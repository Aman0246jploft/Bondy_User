"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/context/SocketContext";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import authApi from "@/api/authApi";
import { Modal } from "react-bootstrap";
import blockUserApi from "@/api/blockUser";
import reportUserApi from "@/api/reportUser";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import { FileIcon, Play, Music } from "lucide-react";
import "./messages-unified.css";

const CHAT_LIMIT = 20;
const MSG_LIMIT = 50;

function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const VideoPlayer = ({ url }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        maxWidth: "280px",
        marginBottom: "6px",
        cursor: "pointer",
      }}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={url}
        style={{
          width: "100%",
          borderRadius: "12px",
          display: "block",
          backgroundColor: "#000",
        }}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      {!isPlaying && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "var(--acc, #23ada4)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "44px",
            height: "44px",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          <Play size={18} fill="currentColor" style={{ marginLeft: "3px" }} />
        </div>
      )}
    </div>
  );
};

export default function UnifiedMessages() {
  const { t, language } = useLanguage();
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
  const messagesAreaRef = useRef(null);
  const chatListRef = useRef(null);
  const fileInputRef = useRef(null);
  const hasAutoSelected = useRef(false);
  const chatsLoaded = useRef(false);
  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ─── File Upload State ─────────────────────────────────────
  const [isUploading, setIsUploading] = useState(false);
  const [stagedFile, setStagedFile] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [sidebarTyping, setSidebarTyping] = useState({});
  const typingTimeoutRef = useRef(null);
  const [showClearChatModal, setShowClearChatModal] = useState(false);

  // ─── Block & Report State ──────────────────────────────────
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportError, setReportError] = useState("");
  const [myBlockedUsers, setMyBlockedUsers] = useState([]);

  const getMyId = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? parseJwt(token)?.userId : null;
  }, []);

  const getOtherUser = useCallback(
    (chat) => {
      if (!chat) return {};
      if (chat.otherUser) return chat.otherUser;
      const myId = getMyId();
      return chat.participants?.find((p) => p._id !== myId) || {};
    },
    [getMyId]
  );

  const otherUserId = getOtherUser(activeChat)?._id;
  const isBlockedByMe = myBlockedUsers.includes(otherUserId) || activeChat?.isBlockedByMe === true;
  const isBlockedByOther = activeChat?.isBlockedByOther === true;

  // 1. Initial chat list fetch + real-time listeners
  useEffect(() => {
    document.title = `${t("messages") || "Messages"} - Bondy`;
    const fetchBlocked = async () => {
      try {
        const res = await blockUserApi.getBlockedUsers({ pageNo: 1, size: 1000 });
        if (res.status && res.data?.blockedUsers) {
          setMyBlockedUsers(res.data.blockedUsers.map((b) => b.toUser?._id || b.toUser));
        }
      } catch (err) {
        console.error("Failed to fetch blocked users", err);
      }
    };
    fetchBlocked();
  }, [t]);

  useEffect(() => {
    if (!socket) return;

    setChatListLoading(true);
    socket.emit("get_chat_list", { page: 1, limit: CHAT_LIMIT }, (response) => {
      setChatListLoading(false);
      if (response?.status === "ok") {
        setChats(response.data || []);
        setChatPage(1);
        setChatHasMore((response.data || []).length === CHAT_LIMIT);
        chatsLoaded.current = true;
      }
    });

    const handleChatListUpdate = (newChat) => {
      setChats((prev) => {
        const exists = prev.find((c) => c._id === newChat._id);
        if (exists) {
          return [newChat, ...prev.filter((c) => c._id !== newChat._id)];
        }
        return [newChat, ...prev];
      });
    };

    socket.on("chat_list_update", handleChatListUpdate);
    return () => {
      socket.off("chat_list_update", handleChatListUpdate);
    };
  }, [socket]);

  // Handle URL ?userId= parameter to auto-select or create chat
  useEffect(() => {
    if (!targetUserId || !socket || hasAutoSelected.current) return;

    const findOrCreateChat = async () => {
      const existing = chats.find((c) => {
        const other = getOtherUser(c);
        return other?._id === targetUserId;
      });

      if (existing) {
        setActiveChat(existing);
        hasAutoSelected.current = true;
        return;
      }

      try {
        const res = await authApi.getUserProfile(targetUserId);
        if (res?.status && res?.data?.user) {
          const user = res.data.user;
          const virtualChat = {
            _id: `virtual_${targetUserId}`,
            isVirtual: true,
            receiverId: targetUserId,
            otherUser: user,
            participants: [{ _id: targetUserId, ...user }],
            messages: [],
            unreadCount: 0,
          };
          setActiveChat(virtualChat);
          hasAutoSelected.current = true;
        }
      } catch (err) {
        console.error("Failed to fetch target user profile", err);
      }
    };

    findOrCreateChat();
  }, [targetUserId, socket, chats, getOtherUser]);

  // Load messages when activeChat changes
  useEffect(() => {
    if (!socket || !activeChat) return;

    if (activeChat.isVirtual) {
      setMessages([]);
      setMsgLoading(false);
      setMsgHasMore(false);
      return;
    }

    setMsgLoading(true);
    setMsgPage(1);
    setMsgHasMore(true);

    socket.emit("get_messages", { chatId: activeChat._id, page: 1, limit: MSG_LIMIT }, (response) => {
      setMsgLoading(false);
      if (response?.status === "ok") {
        setMessages(response.data || []);
        setMsgHasMore((response.data || []).length === MSG_LIMIT);
        setTimeout(() => {
          if (messagesAreaRef.current) {
            messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
          }
        }, 80);
      }
    });
  }, [socket, activeChat?._id]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMsg) => {
      const chat = activeChatRef.current;
      if (chat && (newMsg.chatId === chat._id || newMsg.chat === chat._id)) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => {
          if (messagesAreaRef.current) {
            messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
          }
        }, 60);

        socket.emit("mark_messages_read", { chatId: chat._id });
      }

      setChats((prev) =>
        prev.map((c) => {
          if (c._id === newMsg.chatId || c._id === newMsg.chat) {
            const isCurrentlyActive = chat && chat._id === c._id;
            return {
              ...c,
              lastMessage: newMsg,
              unreadCount: isCurrentlyActive ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );
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
          })
        );
      }
    };

    const handleTyping = ({ chatId, userId, userName }) => {
      const chat = activeChatRef.current;
      if (chat && chatId === chat._id) {
        setTypingUsers((prev) => ({ ...prev, [userId]: userName }));
      }
      setSidebarTyping((prev) => ({
        ...prev,
        [chatId]: { ...(prev[chatId] || {}), [userId]: true },
      }));
    };

    const handleStopTyping = ({ chatId, userId }) => {
      const chat = activeChatRef.current;
      if (chat && chatId === chat._id) {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
      setSidebarTyping((prev) => {
        const nextChat = { ...(prev[chatId] || {}) };
        delete nextChat[userId];
        return { ...prev, [chatId]: nextChat };
      });
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("messages_read_update", handleReadUpdate);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("messages_read_update", handleReadUpdate);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
    };
  }, [socket]);

  // Send message handler
  const sendMessage = useCallback(() => {
    const hasText = message.trim();
    if (!hasText && !stagedFile) return;
    if (!activeChat || !socket) return;

    const payload = activeChat.isVirtual
      ? { receiverId: activeChat.receiverId, content: message }
      : { chatId: activeChat._id, content: message };

    if (stagedFile) {
      payload.fileUrl = stagedFile.fileUrl;
      payload.fileType = stagedFile.fileType;
    }

    socket.emit("send_message", payload, (response) => {
      if (response?.status === "ok") {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
          if (!activeChat.isVirtual) {
            socket.emit("stop_typing", { chatId: activeChat._id });
          }
        }

        setMessages((prev) => [...prev, response.data]);
        setMessage("");
        setStagedFile(null);
        setTimeout(() => {
          if (messagesAreaRef.current) {
            messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
          }
        }, 80);

        if (activeChat.isVirtual && response.chatId) {
          setActiveChat((prev) => ({
            ...prev,
            _id: response.chatId,
            isVirtual: false,
          }));
        }
      } else {
        toast.error(response?.message || t("failedToSendMessage") || "Failed to send message");
      }
    });
  }, [socket, activeChat, message, stagedFile, t]);

  // Input change & Typing emitter
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (!socket || !activeChat || activeChat.isVirtual) return;

    socket.emit("typing", { chatId: activeChat._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { chatId: activeChat._id });
      typingTimeoutRef.current = null;
    }, 2500);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle file select
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const localUrl = URL.createObjectURL(file);
      const formData = new FormData();
      formData.append("files", file);
      const res = await authApi.uploadFile(formData);
      const fileUrl = res?.data?.files?.[0] || res?.files?.[0];
      if (!fileUrl) throw new Error("Upload failed");

      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
        ? "audio"
        : "file";

      setStagedFile({ fileUrl, fileType, localUrl, name: file.name, size: file.size });
      toast.success(t("fileAttached") || "File attached");
    } catch (err) {
      toast.error(t("fileUploadFailed") || "Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Clear chat action
  const confirmClearChat = () => {
    if (!socket || !activeChat || activeChat.isVirtual) return;
    socket.emit("clear_chat", { chatId: activeChat._id }, (response) => {
      if (response?.status === "ok") {
        setMessages([]);
        setShowClearChatModal(false);
        toast.success(t("chatCleared") || "Chat cleared");
      } else {
        toast.error(response?.message || "Failed to clear chat");
      }
    });
  };

  // Block / Unblock action
  const confirmBlockUser = async () => {
    if (!otherUserId) return;
    try {
      const res = await blockUserApi.blockUser(otherUserId);
      if (res?.status) {
        toast.success(t("userBlocked") || "User blocked");
        setMyBlockedUsers((prev) => [...prev, otherUserId]);
        setShowBlockModal(false);
      }
    } catch (err) {
      toast.error("Failed to block user");
    }
  };

  const confirmUnblockUser = async () => {
    if (!otherUserId) return;
    try {
      const res = await blockUserApi.unblockUser(otherUserId);
      if (res?.status) {
        toast.success(t("userUnblocked") || "User unblocked");
        setMyBlockedUsers((prev) => prev.filter((id) => id !== otherUserId));
        setShowUnblockModal(false);
      }
    } catch (err) {
      toast.error("Failed to unblock user");
    }
  };

  // Report user action
  const confirmReportUser = async () => {
    if (!otherUserId || !reportReason) {
      setReportError(t("pleaseSelectReason") || "Please select a reason");
      return;
    }
    try {
      const res = await reportUserApi.reportUser({
        targetUserId: otherUserId,
        reason: reportReason,
        description: reportDescription,
      });
      if (res?.status) {
        toast.success(t("reportSubmitted") || "Report submitted successfully");
        setShowReportModal(false);
        setReportReason("");
        setReportDescription("");
      }
    } catch (err) {
      toast.error("Failed to submit report");
    }
  };

  // Filter chats by search
  const filteredChats = chats.filter((c) => {
    if (!searchTerm.trim()) return true;
    const other = getOtherUser(c);
    const name = `${other.firstName || ""} ${other.lastName || ""} ${other.email || ""}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const totalUnreadCount = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const activeOtherUser = getOtherUser(activeChat);
  const isOtherOnline = otherUserId && onlineUsers?.includes(otherUserId);

  const myId = getMyId();

  return (
    <div className="ms-wrapper">
      <div className="ms-grid" data-mode={activeChat ? "detail" : "list"}>
        {/* ─── LEFT: Chat List Card ─── */}
        <div className="ms-list ms-card">
          <div className="ms-list-head">
            <h3 className="ms-list-title">{t("messages") || "Messages"}</h3>
            {totalUnreadCount > 0 && (
              <span className="ms-unread-pill">
                {totalUnreadCount} {t("unread") || "unread"}
              </span>
            )}
          </div>

          <div className="ms-search-wrap">
            <span className="ms-search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="ms-search-input"
              placeholder={t("searchPlaceholder") || "Search conversations..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="ms-listscroll bd-scroll" ref={chatListRef}>
            {chatListLoading && chats.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px" }}>
                <div className="ac-skel-book" style={{ height: "64px" }} />
                <div className="ac-skel-book" style={{ height: "64px" }} />
                <div className="ac-skel-book" style={{ height: "64px" }} />
              </div>
            ) : filteredChats.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--bd-gray-500)" }}>
                <p style={{ margin: 0, fontSize: "14px" }}>
                  {searchTerm ? t("noResultsFound") || "No matching conversations" : t("noMessagesYet") || "No conversations yet"}
                </p>
              </div>
            ) : (
              filteredChats.map((c) => {
                const other = getOtherUser(c);
                const isSelected = activeChat?._id === c._id;
                const isUserOnline = other._id && onlineUsers?.includes(other._id);
                const isTyping = sidebarTyping[c._id] && Object.keys(sidebarTyping[c._id]).length > 0;
                const name = `${other.firstName || ""} ${other.lastName || ""}`.trim() || other.email || "User";
                const lastMsg = c.lastMessage?.content || (c.lastMessage?.fileType ? "📎 Attachment" : "");

                return (
                  <button
                    key={c._id}
                    type="button"
                    className={`ms-row ${isSelected ? "active" : ""}`}
                    onClick={() => setActiveChat(c)}
                  >
                    <div className="ms-av-wrap">
                      <img
                        src={getFullImageUrl(other.profileImage) || "/img/default-user.png"}
                        alt={name}
                        className="ms-av"
                        onError={(e) => {
                          e.currentTarget.src = "/img/default-user.png";
                        }}
                      />
                      {isUserOnline && <span className="ms-online-dot" />}
                    </div>

                    <div className="ms-row-meta">
                      <div className="ms-row-top">
                        <span className="ms-row-name" title={name}>
                          {name}
                        </span>
                        {c.lastMessage?.createdAt && (
                          <span className="ms-row-time">
                            {new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>

                      <div className="ms-row-preview">
                        <span className="ms-row-text">
                          {isTyping ? (
                            <span style={{ color: "var(--acc-bright)" }}>
                              {language === "en" ? "typing..." : "бичиж байна..."}
                            </span>
                          ) : (
                            lastMsg || (language === "en" ? "Start conversation" : "Зурвас илгээх")
                          )}
                        </span>
                        {c.unreadCount > 0 && !isSelected && (
                          <span className="ms-row-unread">{c.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─── RIGHT: Chat Thread Card ─── */}
        <div className="ms-thread ms-card">
          {!activeChat ? (
            <div className="ms-empty-thread">
              <div className="ms-empty-bubble">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--bd-white)" }}>
                {t("selectConversation") || "Select a conversation"}
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--bd-gray-500)", maxWidth: "340px", lineHeight: 1.5 }}>
                {t("selectConversationDesc") || "Choose a chat from the left list to read messages and start conversation."}
              </p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="ms-thread-head">
                <div className="ms-thread-user">
                  <button
                    type="button"
                    className="ms-back"
                    onClick={() => setActiveChat(null)}
                    aria-label="Back"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  <div className="ms-av-wrap">
                    <img
                      src={getFullImageUrl(activeOtherUser.profileImage) || "/img/default-user.png"}
                      alt="avatar"
                      className="ms-av"
                      onError={(e) => {
                        e.currentTarget.src = "/img/default-user.png";
                      }}
                    />
                    {isOtherOnline && <span className="ms-online-dot" />}
                  </div>

                  <div className="ms-thread-user-info">
                    <h4 className="ms-thread-name">
                      {`${activeOtherUser.firstName || ""} ${activeOtherUser.lastName || ""}`.trim() || activeOtherUser.email || "User"}
                    </h4>
                    <span className={`ms-thread-status ${isOtherOnline ? "online" : ""}`}>
                      {isOtherOnline ? (language === "en" ? "Online" : "Идэвхтэй байна") : (language === "en" ? "Offline" : "Офлайн")}
                    </span>
                  </div>
                </div>

                {/* Actions Dropdown */}
                <div className="ms-thread-actions" ref={dropdownRef}>
                  <button
                    type="button"
                    className="ms-action-btn"
                    onClick={() => setShowDropdown(!showDropdown)}
                    aria-label="Chat options"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>

                  {showDropdown && (
                    <div className="ms-dropdown-menu">
                      <button
                        type="button"
                        className="ms-dropdown-item"
                        onClick={() => {
                          setShowDropdown(false);
                          setShowClearChatModal(true);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>{t("clearChat") || "Clear Chat"}</span>
                      </button>

                      {!isBlockedByMe ? (
                        <button
                          type="button"
                          className="ms-dropdown-item danger"
                          onClick={() => {
                            setShowDropdown(false);
                            setShowBlockModal(true);
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                          <span>{t("blockUser") || "Block User"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="ms-dropdown-item"
                          onClick={() => {
                            setShowDropdown(false);
                            setShowUnblockModal(true);
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                          <span>{t("unblockUser") || "Unblock User"}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="ms-dropdown-item danger"
                        onClick={() => {
                          setShowDropdown(false);
                          setShowReportModal(true);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{t("reportUser") || "Report User"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages History */}
              <div className="ms-msgs bd-scroll" ref={messagesAreaRef}>
                {msgLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px" }}>
                    <div className="ac-skel-book" style={{ height: "48px", width: "60%" }} />
                    <div className="ac-skel-book" style={{ height: "48px", width: "50%", alignSelf: "flex-end" }} />
                    <div className="ac-skel-book" style={{ height: "48px", width: "70%" }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ margin: "auto", textAlign: "center", color: "var(--bd-gray-500)", padding: "20px" }}>
                    <p style={{ margin: 0, fontSize: "14px" }}>
                      {language === "en" ? "No messages yet. Say hello!" : "Одоогоор зурвас байхгүй байна."}
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isOutgoing = m.senderId === myId || m.sender?._id === myId;
                    const timeStr = m.createdAt
                      ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "";

                    return (
                      <div key={m._id || idx} className={`ms-msg-wrap ${isOutgoing ? "out" : "in"}`}>
                        <div className="ms-bubble">
                          {/* File / Media Preview */}
                          {m.fileUrl && (
                            <>
                              {m.fileType === "image" && (
                                <img
                                  src={m.fileUrl}
                                  alt="Attachment"
                                  className="ms-img-preview"
                                  onClick={() => window.open(m.fileUrl, "_blank")}
                                />
                              )}
                              {m.fileType === "video" && <VideoPlayer url={m.fileUrl} />}
                              {m.fileType === "audio" && (
                                <audio controls src={m.fileUrl} style={{ maxWidth: "260px", marginBottom: "6px" }} />
                              )}
                              {m.fileType === "file" && (
                                <a
                                  href={m.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ms-file-card"
                                >
                                  <span className="ms-file-icon">
                                    <FileIcon size={16} />
                                  </span>
                                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Download File</span>
                                </a>
                              )}
                            </>
                          )}

                          {m.content && <span>{m.content}</span>}
                        </div>

                        <div className="ms-msg-meta">
                          <span>{timeStr}</span>
                          {isOutgoing && (
                            <span>
                              {m.readBy?.length > 1 ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Real-time typing bubble */}
                {Object.keys(typingUsers).length > 0 && (
                  <div className="ms-msg-wrap in">
                    <span className="ms-typing-indicator">
                      {language === "en" ? "typing..." : "бичиж байна..."}
                    </span>
                  </div>
                )}
              </div>

              {/* Staged File Banner */}
              {stagedFile && (
                <div className="ms-staged-banner">
                  <div className="ms-staged-info">
                    <FileIcon size={16} color="var(--acc-bright)" />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {stagedFile.name}
                    </span>
                  </div>
                  <button type="button" className="ms-staged-remove" onClick={() => setStagedFile(null)}>
                    ✕
                  </button>
                </div>
              )}

              {/* Blocked Notifications */}
              {isBlockedByMe ? (
                <div className="ms-blocked-banner">
                  {t("youBlockedThisUser") || "You have blocked this user. Unblock to send messages."}
                </div>
              ) : isBlockedByOther ? (
                <div className="ms-blocked-banner">
                  {t("youAreBlocked") || "You cannot reply to this conversation."}
                </div>
              ) : (
                /* Composer */
                <div className="ms-compose">
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    className="ms-icon-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    aria-label="Attach file"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>

                  <input
                    type="text"
                    className="ms-in"
                    placeholder={t("typeAMessage") || "Type a message..."}
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                  />

                  <button
                    type="button"
                    className="ms-send"
                    onClick={sendMessage}
                    disabled={!message.trim() && !stagedFile}
                    aria-label="Send message"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Clear Chat Confirmation Modal */}
      <Modal show={showClearChatModal} onHide={() => setShowClearChatModal(false)} centered>
        <div style={{ padding: "24px", background: "var(--bd-ink-850, #131b2e)", color: "#fff", borderRadius: "20px", border: "1px solid var(--bd-border)" }}>
          <h4 style={{ margin: "0 0 10px", fontWeight: 700 }}>{t("clearChat") || "Clear Chat"}</h4>
          <p style={{ margin: "0 0 20px", color: "var(--bd-gray-400)", fontSize: "14px" }}>
            {t("clearChatConfirm") || "Are you sure you want to clear this conversation? This will delete messages for you."}
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              className="ac-pg-btn"
              onClick={() => setShowClearChatModal(false)}
            >
              {t("cancel") || "Cancel"}
            </button>
            <button
              type="button"
              className="ac-cta"
              style={{ background: "#ff3b30", borderColor: "#ff3b30" }}
              onClick={confirmClearChat}
            >
              {t("clear") || "Clear"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Block Confirmation Modal */}
      <Modal show={showBlockModal} onHide={() => setShowBlockModal(false)} centered>
        <div style={{ padding: "24px", background: "var(--bd-ink-850, #131b2e)", color: "#fff", borderRadius: "20px", border: "1px solid var(--bd-border)" }}>
          <h4 style={{ margin: "0 0 10px", fontWeight: 700 }}>{t("blockUser") || "Block User"}</h4>
          <p style={{ margin: "0 0 20px", color: "var(--bd-gray-400)", fontSize: "14px" }}>
            {t("blockUserConfirm") || "Are you sure you want to block this user? They will not be able to message you."}
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              className="ac-pg-btn"
              onClick={() => setShowBlockModal(false)}
            >
              {t("cancel") || "Cancel"}
            </button>
            <button
              type="button"
              className="ac-cta"
              style={{ background: "#ff3b30", borderColor: "#ff3b30" }}
              onClick={confirmBlockUser}
            >
              {t("block") || "Block"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Unblock Confirmation Modal */}
      <Modal show={showUnblockModal} onHide={() => setShowUnblockModal(false)} centered>
        <div style={{ padding: "24px", background: "var(--bd-ink-850, #131b2e)", color: "#fff", borderRadius: "20px", border: "1px solid var(--bd-border)" }}>
          <h4 style={{ margin: "0 0 10px", fontWeight: 700 }}>{t("unblockUser") || "Unblock User"}</h4>
          <p style={{ margin: "0 0 20px", color: "var(--bd-gray-400)", fontSize: "14px" }}>
            {t("unblockUserConfirm") || "Do you want to unblock this user?"}
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              className="ac-pg-btn"
              onClick={() => setShowUnblockModal(false)}
            >
              {t("cancel") || "Cancel"}
            </button>
            <button
              type="button"
              className="ac-cta"
              onClick={confirmUnblockUser}
            >
              {t("unblock") || "Unblock"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered>
        <div style={{ padding: "24px", background: "var(--bd-ink-850, #131b2e)", color: "#fff", borderRadius: "20px", border: "1px solid var(--bd-border)" }}>
          <h4 style={{ margin: "0 0 10px", fontWeight: 700 }}>{t("reportUser") || "Report User"}</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "14px 0" }}>
            <select
              className="ms-in"
              style={{ height: "40px", borderRadius: "10px" }}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            >
              <option value="">{t("selectReason") || "Select a reason..."}</option>
              <option value="SPAM">Spam or unwanted messages</option>
              <option value="HARASSMENT">Harassment or hate speech</option>
              <option value="INAPPROPRIATE">Inappropriate content</option>
              <option value="FRAUD">Fraud or scam</option>
              <option value="OTHER">Other</option>
            </select>

            <textarea
              className="ac-textarea"
              placeholder={t("optionalDescription") || "Additional details (optional)..."}
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
            />
            {reportError && <span style={{ fontSize: "12px", color: "#ff5a5a" }}>{reportError}</span>}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              className="ac-pg-btn"
              onClick={() => setShowReportModal(false)}
            >
              {t("cancel") || "Cancel"}
            </button>
            <button
              type="button"
              className="ac-cta"
              onClick={confirmReportUser}
            >
              {t("submitReport") || "Submit Report"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
