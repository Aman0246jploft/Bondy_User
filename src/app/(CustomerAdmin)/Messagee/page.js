"use client";
import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import "./message.css";
import Link from "next/link";
import { useSocket } from "@/context/SocketContext";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import authApi from "@/api/authApi";

const CHAT_LIMIT = 20;
const MSG_LIMIT = 50;

function parseJwt(token) {
  if (!token) return null;
  try {
    var base64Url = token.split(".")[1];
    var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    var jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function MessageeContent() {
  const { socket, isSocketConnected, onlineUsers } = useSocket();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("userId");

  const [activeChat, setActiveChat] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // ─── Chat List state ───────────────────────────────────────
  const [chats, setChats] = useState([]);
  const [chatPage, setChatPage] = useState(1);
  const [chatHasMore, setChatHasMore] = useState(true);
  const [chatListLoading, setChatListLoading] = useState(false);

  // ─── Message List state ────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [msgPage, setMsgPage] = useState(1);
  const [msgHasMore, setMsgHasMore] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);

  // ─── Refs ──────────────────────────────────────────────────
  const msgEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const chatListRef = useRef(null);
  const hasAutoSelected = useRef(false);
  const chatsLoaded = useRef(false);
  // Keep latest activeChat accessible inside scroll callbacks without stale closure
  const activeChatRef = useRef(activeChat);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // ─── Helper ────────────────────────────────────────────────
  const getMyId = useCallback(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? parseJwt(token)?.userId : null;
  }, []);

  const getOtherUser = useCallback(
    (chat) => {
      if (!chat) return {};
      if (chat.otherUser) return chat.otherUser;
      const myId = getMyId();
      return chat.participants?.find((p) => p._id !== myId) || {};
    },
    [getMyId],
  );

  // ══════════════════════════════════════════════════════════
  // 1. Initial chat list fetch (page 1) + real-time listeners
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!socket) return;

    setChatListLoading(true);
    socket.emit("get_chat_list", { page: 1, limit: CHAT_LIMIT }, (response) => {
      setChatListLoading(false);
      if (response.status === "ok") {
        setChats(response.data);
        setChatPage(1);
        setChatHasMore(response.hasMore ?? false);
        chatsLoaded.current = true;
      } else {
        console.error("Error fetching chats:", response.message);
        chatsLoaded.current = true;
      }
    });

    // Real-time: existing chat updated (new message arrived elsewhere)
    const handleUpdateChatList = (updatedChat) => {
      setChats((prev) => {
        const others = prev.filter((c) => c._id !== updatedChat._id);
        return [updatedChat, ...others];
      });
    };

    // Real-time: brand-new chat created
    const handleNewChat = (newChat) => {
      setChats((prev) => {
        // Avoid duplicates
        if (prev.some((c) => c._id === newChat._id)) return prev;
        return [newChat, ...prev];
      });
    };

    socket.on("update_chat_list", handleUpdateChatList);
    socket.on("new_chat", handleNewChat);

    return () => {
      socket.off("update_chat_list", handleUpdateChatList);
      socket.off("new_chat", handleNewChat);
    };
  }, [socket]);

  // ══════════════════════════════════════════════════════════
  // 2. Chat list infinite scroll (load more on scroll-to-bottom)
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    const container = chatListRef.current;
    if (!container || !socket) return;

    const handleChatScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const nearBottom = scrollHeight - scrollTop - clientHeight < 60;

      if (!nearBottom || !chatHasMore || chatListLoading) return;

      const nextPage = chatPage + 1;
      setChatListLoading(true);

      socket.emit(
        "get_chat_list",
        { page: nextPage, limit: CHAT_LIMIT },
        (response) => {
          setChatListLoading(false);
          if (response.status === "ok") {
            setChats((prev) => {
              // Deduplicate by _id
              const existingIds = new Set(prev.map((c) => c._id));
              const newChats = response.data.filter(
                (c) => !existingIds.has(c._id),
              );
              return [...prev, ...newChats];
            });
            setChatPage(nextPage);
            setChatHasMore(response.hasMore ?? false);
          } else {
            toast.error(response.message || "Failed to load more chats");
          }
        },
      );
    };

    container.addEventListener("scroll", handleChatScroll);
    return () => container.removeEventListener("scroll", handleChatScroll);
  }, [socket, chatPage, chatHasMore, chatListLoading]);

  // ══════════════════════════════════════════════════════════
  // 3. Auto-select chat from ?userId= query param
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!targetUserId || !socket || !chatsLoaded.current || hasAutoSelected.current)
      return;

    const initializeChat = async () => {
      const existingChat = chats.find((chat) =>
        chat.participants?.some((p) => p._id === targetUserId),
      );

      if (existingChat) {
        setActiveChat(existingChat);
        hasAutoSelected.current = true;
      } else {
        try {
          const response = await authApi.getUserProfileById(targetUserId);
          if (response.status && response.data.user) {
            const userData = response.data.user;
            setActiveChat({
              _id: null,
              isVirtual: true,
              receiverId: targetUserId,
              participants: [
                {
                  _id: userData._id,
                  firstName: userData.firstName,
                  lastName: userData.lastName,
                  profileImage: userData.profileImage,
                },
              ],
              lastMessage: null,
              unreadCount: 0,
            });
            hasAutoSelected.current = true;
          } else {
            toast.error("Unable to load user information");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Failed to load user information");
        }
      }
    };

    initializeChat();
  }, [targetUserId, chats, socket]);

  // ══════════════════════════════════════════════════════════
  // 4. Fetch messages (page 1) when active chat changes
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!socket || !activeChat || activeChat.isVirtual) return;

    // Join room
    socket.emit("join_chat", { chatId: activeChat._id });

    // Reset message pagination state
    setMessages([]);
    setMsgPage(1);
    setMsgHasMore(true);
    setMsgLoading(true);

    socket.emit(
      "get_message_list",
      { chatId: activeChat._id, page: 1, limit: MSG_LIMIT },
      (response) => {
        setMsgLoading(false);
        if (response.status === "ok") {
          // Server returns newest-first; reverse for chronological display
          setMessages(response.data.slice().reverse());
          setMsgPage(1);
          setMsgHasMore(response.hasMore ?? false);

          // Clear unread badge
          setChats((prev) =>
            prev.map((c) =>
              c._id === activeChat._id ? { ...c, unreadCount: 0 } : c,
            ),
          );
        } else {
          toast.error(response.message || "Failed to load messages");
        }
      },
    );
  }, [socket, activeChat?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ══════════════════════════════════════════════════════════
  // 5. Load older messages on scroll-to-top
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    const container = messagesAreaRef.current;
    if (!container || !socket) return;

    const handleMsgScroll = () => {
      if (container.scrollTop > 40) return; // Only trigger near top
      const chat = activeChatRef.current;
      if (!chat || chat.isVirtual) return;
      if (!msgHasMore || msgLoading) return;

      // Capture scroll height before prepending
      const prevScrollHeight = container.scrollHeight;
      const nextPage = msgPage + 1;
      setMsgLoading(true);

      socket.emit(
        "get_message_list",
        { chatId: chat._id, page: nextPage, limit: MSG_LIMIT },
        (response) => {
          setMsgLoading(false);
          if (response.status === "ok") {
            const olderMsgs = response.data.slice().reverse(); // oldest first
            setMessages((prev) => [...olderMsgs, ...prev]);
            setMsgPage(nextPage);
            setMsgHasMore(response.hasMore ?? false);

            // Restore scroll position so user doesn't jump to top
            requestAnimationFrame(() => {
              if (messagesAreaRef.current) {
                const newScrollHeight = messagesAreaRef.current.scrollHeight;
                messagesAreaRef.current.scrollTop =
                  newScrollHeight - prevScrollHeight;
              }
            });
          } else {
            toast.error(response.message || "Failed to load older messages");
          }
        },
      );
    };

    container.addEventListener("scroll", handleMsgScroll);
    return () => container.removeEventListener("scroll", handleMsgScroll);
  }, [socket, msgPage, msgHasMore, msgLoading]);

  // ══════════════════════════════════════════════════════════
  // 6. Real-time incoming messages
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMessage) => {
      const chat = activeChatRef.current;
      if (chat && newMessage.chat === chat._id) {
        setMessages((prev) => [...prev, newMessage]);
        setTimeout(() => {
          msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    const handleReadUpdate = ({ chatId, userId }) => {
      const chat = activeChatRef.current;
      if (chat && chatId === chat._id) {
        setMessages((prev) =>
          prev.map((m) => {
            if (!m.readBy?.includes(userId)) {
              return { ...m, readBy: [...(m.readBy || []), userId] };
            }
            return m;
          }),
        );
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("messages_read_update", handleReadUpdate);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("messages_read_update", handleReadUpdate);
    };
  }, [socket]);

  // ══════════════════════════════════════════════════════════
  // 7. Mark messages read on chat open / new message
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!socket || !activeChat || activeChat.isVirtual) return;
    socket.emit("mark_messages_read", { chatId: activeChat._id });
  }, [socket, activeChat, messages.length]);

  // ══════════════════════════════════════════════════════════
  // 8. Auto-scroll to bottom on initial load
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    // Only scroll to bottom when chatId changes (fresh load), not on every prepend
    if (activeChat && !msgLoading) {
      msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChat?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ══════════════════════════════════════════════════════════
  // 9. Send Message
  // ══════════════════════════════════════════════════════════
  const sendMessage = useCallback(() => {
    if (!message.trim() || !activeChat || !socket) return;

    const payload = activeChat.isVirtual
      ? { receiverId: activeChat.receiverId, content: message }
      : { chatId: activeChat._id, content: message };

    socket.emit("send_message", payload, (response) => {
      if (response.status === "ok") {
        setMessages((prev) => [...prev, response.data]);
        setMessage("");
        setTimeout(() => {
          msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);

        if (activeChat.isVirtual && response.chatId) {
          setActiveChat((prev) => ({
            ...prev,
            _id: response.chatId,
            isVirtual: false,
          }));
        }
      } else {
        toast.error(response.message || "Failed to send message");
      }
    });
  }, [socket, activeChat, message]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // ── Filter chats by search ──────────────────────────────
  const filteredChats = chats.filter((chat) => {
    const other = getOtherUser(chat);
    const name = `${other?.firstName || ""} ${other?.lastName || ""}`;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div>
      <div className="app-root">
        <div className="main-area">
          <div className="chat-wrapper container-fluid">
            <div className="row h-100">

              {/* ── LEFT CHAT LIST ────────────────────────────── */}
              <div
                className={`col-lg-3 col-md-4 chat-sidebar ${activeChat ? "mobile-hide" : ""}`}
              >
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h4 className="title m-0">Messages</h4>
                  <div
                    className={`connection-status ${isSocketConnected ? "online" : "offline"}`}
                    title={isSocketConnected ? "Connected" : "Disconnected"}
                  >
                    ●
                  </div>
                </div>

                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="search-icon">
                    <img src="/img/search.svg" alt="" />
                  </span>
                </div>

                {/* Scrollable chat list */}
                <div className="user-items" ref={chatListRef}>
                  {filteredChats.map((chat) => {
                    const other = getOtherUser(chat);
                    const isOnline = onlineUsers.has(other._id);

                    return (
                      <div
                        key={chat._id}
                        onClick={() => setActiveChat(chat)}
                        className={`user-chat-box ${activeChat?._id === chat._id ? "active" : ""}`}
                      >
                        <div className="position-relative">
                          <img
                            src={other.profileImage || "/img/user_placeholder.png"}
                            className="user-img"
                            onError={(e) => (e.target.src = "/img/user_placeholder.png")}
                            alt="User"
                          />
                          {isOnline && <span className="online-badge"></span>}
                        </div>

                        <div className="user-info">
                          <h5>{other.firstName} {other.lastName}</h5>
                          <p className="text-truncate" style={{ maxWidth: "150px" }}>
                            {chat.lastMessage?.content || "No messages yet"}
                          </p>
                        </div>

                        <div className="right-info">
                          {chat.lastMessage?.createdAt && (
                            <small>
                              {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </small>
                          )}
                          {chat.unreadCount > 0 && (
                            <span className="count">{chat.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Chat list loader / end states */}
                  {chatListLoading && (
                    <div className="text-center py-2">
                      <small className="text-muted">Loading chats…</small>
                    </div>
                  )}
                  {!chatListLoading && !chatHasMore && chats.length > 0 && (
                    <div className="text-center py-2">
                      <small className="text-muted">No more chats</small>
                    </div>
                  )}
                  {!chatListLoading && filteredChats.length === 0 && (
                    <div className="text-center mt-4 text-muted">No chats found</div>
                  )}
                </div>
              </div>

              {/* ── RIGHT CHAT WINDOW ─────────────────────────── */}
              <div
                className={`col-lg-9 col-md-8 chat-window-area ${activeChat ? "mobile-show" : ""}`}
              >
                {activeChat ? (
                  <div className="chat-window">

                    {/* HEADER */}
                    <div className="chat-header">
                      <span className="back-btn" onClick={() => setActiveChat(null)}>←</span>

                      <img
                        src={getOtherUser(activeChat).profileImage || "/img/user_placeholder.png"}
                        className="header-img"
                        onError={(e) => (e.target.src = "/img/user_placeholder.png")}
                        alt="User"
                      />

                      <div className="info">
                        <h5>
                          {getOtherUser(activeChat).firstName}{" "}
                          {getOtherUser(activeChat).lastName}
                        </h5>
                        <small>
                          {onlineUsers.has(getOtherUser(activeChat)._id) ? "Online" : "Offline"}
                        </small>
                      </div>

                      <div className="menu" onClick={() => setShowDropdown(!showDropdown)}>⋮</div>

                      {showDropdown && (
                        <div className="options-dropdown">
                          <Link href="#">
                            <img src="/img/user-white.svg" className="me-2" alt="" />
                            User Profile
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* MESSAGES AREA */}
                    <div className="messages-area" ref={messagesAreaRef}>

                      {/* Load-older indicator */}
                      {msgLoading && msgPage > 1 && (
                        <div className="text-center py-2">
                          <small className="text-muted">Loading older messages…</small>
                        </div>
                      )}
                      {!msgHasMore && messages.length > 0 && (
                        <div className="text-center py-2">
                          <small className="text-muted">Beginning of conversation</small>
                        </div>
                      )}

                      {/* Initial load spinner */}
                      {msgLoading && msgPage === 1 && (
                        <div className="text-center py-4">
                          <small className="text-muted">Loading messages…</small>
                        </div>
                      )}

                      {messages.map((m, i) => {
                        const myId = parseJwt(localStorage.getItem("token"))?.userId;
                        const isMyMessage = (m.sender?._id || m.sender) === myId;

                        return (
                          <div
                            key={m._id || i}
                            className={`message ${isMyMessage ? "right" : "left"}`}
                          >
                            {!isMyMessage && (
                              <img
                                src={m.sender?.profileImage || "/img/user_placeholder.png"}
                                className="msg-user-img"
                                onError={(e) => (e.target.src = "/img/user_placeholder.png")}
                                alt="User"
                              />
                            )}

                            <div className="msg-box">
                              <div className="msg-meta">
                                <span className="msg-time">
                                  {new Date(m.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {isMyMessage && (
                                    <span className="read-status ms-1">
                                      {m.readBy?.some(
                                        (id) => id !== getMyId(),
                                      ) ? (
                                        <span style={{ color: "#34b7f1" }}>✓✓</span>
                                      ) : (
                                        <span>✓✓</span>
                                      )}
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="msg-text">{m.content}</div>
                            </div>
                          </div>
                        );
                      })}

                      <div ref={msgEndRef} />
                    </div>

                    {/* MESSAGE INPUT */}
                    <div className="message-input">
                      <div className="icon-input-box">
                        <input
                          type="text"
                          placeholder="Your message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                        />
                        <div className="action-icon-chat"></div>
                      </div>
                      <div className="icons">
                        <button onClick={sendMessage} className="send-btn">
                          <img src="/img/send_chat.svg" alt="Send" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-chat-selected">
                    <img src="/img/logo.svg" alt="Logo" />
                    Select a chat to start messaging
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessageeContent />
    </Suspense>
  );
}
