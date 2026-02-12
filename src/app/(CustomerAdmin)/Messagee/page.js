"use client";
import React, { useState, useEffect, useRef } from "react";
import "./message.css";
import Link from "next/link";
import { useSocket } from "@/context/SocketContext";
import { toast } from "react-hot-toast";

function page() {
  const { socket, isSocketConnected, onlineUsers } = useSocket();
  const [activeChat, setActiveChat] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const msgEndRef = useRef();

  // 1. Fetch Chat List on Load
  useEffect(() => {
    if (!socket) return;

    socket.emit("get_chat_list", { page: 1, limit: 20 }, (response) => {
      if (response.status === "ok") {
        setChats(response.data);
      } else {
        console.error("Error fetching chats:", response.message);
      }
    });

    // Listener for real-time chat list updates (e.g., new message in another chat)
    socket.on("update_chat_list", (updatedChat) => {
      setChats((prev) => {
        const otherChats = prev.filter((c) => c._id !== updatedChat._id);
        return [updatedChat, ...otherChats];
      });
    });

    socket.on("new_chat", (newChat) => {
      setChats((prev) => [newChat, ...prev]);
    });

    return () => {
      socket.off("update_chat_list");
      socket.off("new_chat");
    };
  }, [socket]);

  // 2. Fetch Messages when Active Chat Changes
  useEffect(() => {
    if (!socket || !activeChat) return;

    // Join the chat room
    socket.emit("join_chat", { chatId: activeChat._id });

    // Mark as read locally immediately for UI
    setChats((prev) =>
      prev.map((c) =>
        c._id === activeChat._id ? { ...c, unreadCount: 0 } : c
      )
    );

    socket.emit(
      "get_message_list",
      { chatId: activeChat._id, page: 1, limit: 50 },
      (response) => {
        if (response.status === "ok") {
          setMessages(response.data.reverse()); // Reverse to show oldest first at top
        } else {
          toast.error(response.message);
        }
      }
    );
  }, [socket, activeChat]);

  // 3. Listen for Incoming Messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMessage) => {
      // Only append if it belongs to the active chat
      if (activeChat && newMessage.chat === activeChat._id) {
        setMessages((prev) => [...prev, newMessage]);
        // Scroll to bottom
        setTimeout(() => {
          msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    const handleReadUpdate = ({ chatId, userId }) => {
      if (activeChat && chatId === activeChat._id) {
        setMessages(prev => prev.map(m => {
          if (!m.readBy.includes(userId)) {
            return { ...m, readBy: [...(m.readBy || []), userId] };
          }
          return m;
        }));
      }
    };
    socket.on("messages_read_update", handleReadUpdate);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("messages_read_update", handleReadUpdate);
    };
  }, [socket, activeChat]);

  // Mark messages as read when active chat changes or new message arrives
  useEffect(() => {
    if (!socket || !activeChat) return;
    socket.emit("mark_messages_read", { chatId: activeChat._id });
  }, [socket, activeChat, messages.length]);

  // Scroll to bottom on new messages load
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  // 4. Send Message
  const sendMessage = () => {
    if (!message.trim() || !activeChat || !socket) return;

    const tempId = Date.now();
    const tempMsg = {
      _id: tempId,
      content: message,
      sender: "me", // Placeholder, will optionally replace or just wait for server
      createdAt: new Date(),
      isTemp: true
    };

    // Optimistic UI update (optional, but handled by server ack usually)
    // For now, let's wait for ACK to append to be safe and consistent with ids

    socket.emit(
      "send_message",
      { chatId: activeChat._id, content: message },
      (response) => {
        if (response.status === "ok") {
          setMessages((prev) => [...prev, response.data]);
          setMessage("");
        } else {
          toast.error(response.message);
        }
      }
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  }

  // Helper to get my ID from token
  const getMyId = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? parseJwt(token)?.userId : null;
  };

  const getOtherUser = (chat) => {
    if (chat.otherUser) return chat.otherUser;
    const myId = getMyId();
    // Fallback: find participant that is not me
    return chat.participants.find(p => p._id !== myId) || {};
  };

  // Filter chats by search
  const filteredChats = chats.filter((chat) => {
    const otherUser = getOtherUser(chat);
    const name = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : "Unknown";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      <div className="app-root">
        <div className="main-area">
          <div className="chat-wrapper container-fluid">
            <div className="row h-100">
              {/* LEFT CHAT LIST */}
              <div
                className={`col-lg-3 col-md-4 chat-sidebar ${activeChat ? "mobile-hide" : ""
                  }`}
              >
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h4 className="title m-0">Messages</h4>
                  <div className={`connection-status ${isSocketConnected ? 'online' : 'offline'}`}
                    title={isSocketConnected ? "Connected" : "Disconnected"}>
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

                <div className="user-items">
                  {filteredChats.map((chat) => {
                    const other = getOtherUser(chat);
                    const isOnline = onlineUsers.has(other._id);

                    return (
                      <div
                        key={chat._id}
                        onClick={() => setActiveChat(chat)}
                        className={`user-chat-box ${activeChat?._id === chat._id ? "active" : ""
                          }`}
                      >
                        <div className="position-relative">
                          <img
                            src={other.profileImage || "/img/user_placeholder.png"}
                            className="user-img"
                            onError={(e) => e.target.src = '/img/user_placeholder.png'}
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
                          {chat.unreadCount > 0 && <span className="count">{chat.unreadCount}</span>}
                        </div>
                      </div>
                    );
                  })}
                  {filteredChats.length === 0 && (
                    <div className="text-center mt-4 text-muted">No chats found</div>
                  )}
                </div>
              </div>

              {/* RIGHT CHAT WINDOW */}
              <div
                className={`col-lg-9 col-md-8 chat-window-area ${activeChat ? "mobile-show" : ""
                  }`}
              >
                {activeChat ? (
                  <div className="chat-window">
                    {/* HEADER */}
                    <div className="chat-header">
                      <span
                        className="back-btn"
                        onClick={() => setActiveChat(null)}
                      >
                        ←
                      </span>

                      <img
                        src={getOtherUser(activeChat).profileImage || "/img/user_placeholder.png"}
                        className="header-img"
                        onError={(e) => e.target.src = '/img/user_placeholder.png'}
                      />

                      <div className="info">
                        <h5>{getOtherUser(activeChat).firstName} {getOtherUser(activeChat).lastName}</h5>
                        <small>{onlineUsers.has(getOtherUser(activeChat)._id) ? "Online" : "Offline"}</small>
                      </div>

                      <div
                        className="menu"
                        onClick={() => setShowDropdown(!showDropdown)}
                      >
                        ⋮
                      </div>

                      {showDropdown && (
                        <div className="options-dropdown">
                          <Link href="#">
                            <img src="/img/user-white.svg" className="me-2" />
                            User Profile
                          </Link>
                          {/* Add other options as needed */}
                        </div>
                      )}
                    </div>

                    {/* MESSAGES */}
                    <div className="messages-area">
                      {messages.map((m, i) => {
                        const isMe = m.sender._id === socket?.auth?.userId || m.sender === socket?.auth?.userId || (typeof m.sender === 'object' && !m.sender._id);
                        // The newly sent message returns populated sender object or just id? 
                        // Controller: populatedMessage = await newMessage.populate("sender", ...)
                        // So it should be an object.
                        // But we need to check ID against our ID.
                        // Wait, socket.auth.userId might not be accessible directly if we didn't store it in context state in a way to access here easily. 
                        // Decoder of token is needed? Or just check if sender is 'me' (not reliable).
                        // Better: Use a helper to check ID.
                        // For now, let's assume sender is populated object.

                        // We need the current user's ID.
                        // Let's decode or store it in context.
                        // WORKAROUND: In Send Message we know it's us. In Receive, check if sender._id === myId.
                        // We need myId.
                        // Let's get it from localStorage for now or use a simple hack if we trust the 'me' flag from local state (but we are using server data).

                        // Simplified check:
                        const myId = parseJwt(localStorage.getItem("token"))?.userId;
                        const isMyMessage = (m.sender?._id || m.sender) === myId;

                        return (
                          <div
                            key={i}
                            className={`message ${isMyMessage ? "right" : "left"
                              }`}
                          >
                            {!isMyMessage && (
                              <img
                                src={m.sender?.profileImage || "/img/user_placeholder.png"}
                                className="msg-user-img"
                                onError={(e) => e.target.src = '/img/user_placeholder.png'}
                                alt="User"
                              />
                            )}

                            <div className="msg-box">
                              <div className="msg-meta">
                                {/* <span className="msg-name">
                                  {isMyMessage ? "You" : `${m.sender?.firstName || 'User'} ${m.sender?.lastName || ''}`}
                                </span> */}
                                <span className="msg-time">
                                  {new Date(m.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {isMyMessage && (
                                    <span className="read-status ms-1">
                                      {m.readBy?.some(id => id !== socket?.auth?.userId && id !== getMyId()) ?
                                        <span style={{ color: '#34b7f1' }}>✓✓</span> :
                                        <span>✓✓</span>
                                      }
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

                    <div className="message-input">
                      <div className="icon-input-box">
                        <input
                          type="text"
                          placeholder="Your message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                        />

                        <div className="action-icon-chat">
                          {/* <button>
                            <img src="/img/voice_icon.svg" />
                          </button> */}
                          {/* <div className="gift-area">
                            <span className="gift-icon">
                              <img src="/img/gift_icon.svg" />
                            </span>
                          </div> */}

                          {/* ATTACH */}
                          {/* <label className="attach">
                            <img src="/img/attach_icon.svg" />
                            <input type="file" hidden />
                          </label> */}
                        </div>
                      </div>
                      <div className="icons">
                        <button onClick={sendMessage} className="send-btn">
                          <img src="/img/send_chat.svg" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-chat-selected">
                    <img src="/img/logo.svg" />
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

function parseJwt(token) {
  if (!token) return null;
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

export default page;
