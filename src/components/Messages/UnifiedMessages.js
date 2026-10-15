"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/context/SocketContext";
import { toast } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import authApi from "@/api/authApi";
import bookingApi from "@/api/bookingApi";
import { Modal } from "react-bootstrap";
import blockUserApi from "@/api/blockUser";
import reportUserApi from "@/api/reportUser";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import { FileIcon, Play, Music } from "lucide-react";
import "./messages-unified.css";

const CHAT_LIMIT = 20;
const MSG_LIMIT = 50;

function sameId(a, b) {
  return String(a || "") === String(b || "");
}

function mediaKind(fileType, fileUrl) {
  const type = String(fileType || "").toLowerCase();
  if (type === "image" || type === "video" || type === "audio") return type;
  if (type === "document" || type === "file") return "file";
  const path = String(fileUrl || "").split("?")[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(path)) return "image";
  if (/\.(mp4|webm|mov|m4v)$/.test(path)) return "video";
  if (/\.(mp3|wav|ogg|m4a)$/.test(path)) return "audio";
  return fileUrl ? "file" : "";
}

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

function ChatImage({ src, label }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" className="ms-file-card">
        <span className="ms-file-icon">
          <FileIcon size={16} />
        </span>
        <span style={{ fontSize: "13px", fontWeight: 600 }}>{label}</span>
      </a>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="ms-img-preview"
      onClick={() => window.open(src, "_blank")}
      onError={() => setFailed(true)}
    />
  );
}

export default function UnifiedMessages({ organizerMode = false }) {
  const { t } = useLanguage();
  const router = useRouter();
  const { socket, isSocketConnected, onlineUsers } = useSocket();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("userId");

  const [activeChat, setActiveChat] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [buyerRefs, setBuyerRefs] = useState({});

  // ─── Chat List state ───────────────────────────────────────
  const [chats, setChats] = useState([]);
  const [chatPage, setChatPage] = useState(1);
  const [chatHasMore, setChatHasMore] = useState(true);
  const [chatListLoading, setChatListLoading] = useState(false);
  const [chatListReady, setChatListReady] = useState(false);

  // ─── Message List state ────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [msgPage, setMsgPage] = useState(1);
  const [msgHasMore, setMsgHasMore] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);

  // ─── Refs ──────────────────────────────────────────────────
  const messagesAreaRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const composerRef = useRef(null);
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
  const actionLock = useRef(false);
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
      return chat.participants?.find((p) => !sameId(p._id, myId)) || {};
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

    chatsLoaded.current = false;
    setChatListReady(false);
    setChatListLoading(true);
    socket.emit("get_chat_list", { page: 1, limit: CHAT_LIMIT }, (response) => {
      setChatListLoading(false);
      chatsLoaded.current = true;
      if (response?.status === "ok") {
        const list = response.data || [];
        setChats(list);
        setChatPage(1);
        setChatHasMore(list.length === CHAT_LIMIT);
        list.forEach((c) => {
          if (c?._id) socket.emit("join_chat", { chatId: c._id });
        });
      }
      setChatListReady(true);
    });

    const handleChatListUpdate = (newChat) => {
      if (!newChat?._id) return;
      socket.emit("join_chat", { chatId: newChat._id });
      const active = activeChatRef.current;
      const isOpen = active && !active.isVirtual && sameId(active._id, newChat._id);
      const nextChat = isOpen ? { ...newChat, unreadCount: 0 } : newChat;
      if (isOpen) socket.emit("mark_messages_read", { chatId: newChat._id });
      setChats((prev) => {
        const exists = prev.some((c) => sameId(c._id, nextChat._id));
        if (exists) {
          return [nextChat, ...prev.filter((c) => !sameId(c._id, nextChat._id))];
        }
        return [nextChat, ...prev];
      });
    };

    socket.on("chat_list_update", handleChatListUpdate);
    socket.on("update_chat_list", handleChatListUpdate);
    return () => {
      socket.off("chat_list_update", handleChatListUpdate);
      socket.off("update_chat_list", handleChatListUpdate);
    };
  }, [socket]);

  // Handle URL ?userId= parameter to auto-select or create chat
  useEffect(() => {
    if (!targetUserId || !socket || !chatListReady || !chatsLoaded.current || hasAutoSelected.current) return;

    let cancelled = false;
    const findOrCreateChat = async () => {
      const existing = chats.find((c) => {
        const other = getOtherUser(c);
        return String(other?._id || "") === String(targetUserId);
      });

      if (existing) {
        if (cancelled) return;
        setActiveChat(existing);
        hasAutoSelected.current = true;
        return;
      }

      try {
        const res = await authApi.getUserProfileById(targetUserId);
        if (cancelled || hasAutoSelected.current) return;
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
    return () => {
      cancelled = true;
    };
  }, [targetUserId, socket, chats, chatListReady, getOtherUser]);

  // Load messages when activeChat changes
  useEffect(() => {
    if (!socket || !activeChat) return;

    if (activeChat.isVirtual) {
      setMessages([]);
      setMsgLoading(false);
      setMsgHasMore(false);
      setTypingUsers({});
      return;
    }

    stickToBottomRef.current = true;
    setShowJump(false);
    socket.emit("join_chat", { chatId: activeChat._id });
    socket.emit("mark_messages_read", { chatId: activeChat._id });
    setChats((prev) => prev.map((c) => (sameId(c._id, activeChat._id) ? { ...c, unreadCount: 0 } : c)));
    setTypingUsers({});

    setMessages([]);
    setMsgLoading(true);
    setMsgPage(1);
    setMsgHasMore(true);

    let ignore = false;
    socket.emit("get_message_list", { chatId: activeChat._id, page: 1, limit: MSG_LIMIT }, (response) => {
      if (ignore) return;
      setMsgLoading(false);
      if (response?.status === "ok") {
        const rows = Array.isArray(response.data) ? response.data : [];
        const onlyMessages = rows.filter((row) => row && !row.isDateSeparator && (row._id || row.content || row.fileUrl));
        setMessages(onlyMessages.reverse());
        setMsgHasMore(typeof response.hasMore === "boolean" ? response.hasMore : onlyMessages.length === MSG_LIMIT);
        setTimeout(() => {
          const el = messagesAreaRef.current;
          if (!el) return;
          el.scrollTop = el.scrollHeight;
          stickToBottomRef.current = true;
          setShowJump(false);
        }, 80);
      } else {
        setMessages([]);
      }
    });
    return () => {
      ignore = true;
    };
  }, [socket, activeChat?._id]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMsg) => {
      const chat = activeChatRef.current;
      const incomingChatId = newMsg?.chatId || newMsg?.chat;
      const isOpen = chat && !chat.isVirtual && sameId(incomingChatId, chat._id);
      const fromMe = sameId(newMsg?.senderId || newMsg?.sender?._id || newMsg?.sender, getMyId());
      if (isOpen) {
        setMessages((prev) => {
          if (prev.some((m) => sameId(m._id, newMsg._id))) return prev;
          return [...prev, newMsg];
        });
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[String(newMsg?.sender?._id || newMsg?.senderId || newMsg?.sender || "")];
          return next;
        });
        setTimeout(() => {
          const el = messagesAreaRef.current;
          if (!el || !stickToBottomRef.current) {
            if (el) setShowJump(true);
            return;
          }
          el.scrollTop = el.scrollHeight;
        }, 60);
        if (!fromMe) socket.emit("mark_messages_read", { chatId: chat._id });
      }

      setChats((prev) =>
        prev.map((c) => {
          if (sameId(c._id, incomingChatId)) {
            return {
              ...c,
              lastMessage: {
                content: newMsg.content || (newMsg.fileType ? newMsg.fileType : c.lastMessage?.content),
                fileType: newMsg.fileType,
                sender: newMsg.sender,
                createdAt: newMsg.createdAt || new Date().toISOString(),
              },
              unreadCount: isOpen || fromMe ? 0 : c.unreadCount,
            };
          }
          return c;
        })
      );
    };

    const handleReadUpdate = ({ chatId, userId }) => {
      const chat = activeChatRef.current;
      if (!chat || !sameId(chatId, chat._id) || !userId) return;
      const reader = String(userId);
      setMessages((prev) =>
        prev.map((m) => {
          const readIds = (m.readBy || []).map((id) => String(id?._id || id));
          if (readIds.includes(reader)) return m;
          return { ...m, readBy: [...(m.readBy || []), reader] };
        })
      );
    };

    const handleTyping = ({ chatId, userId, userName }) => {
      if (!chatId || !userId || sameId(userId, getMyId())) return;
      const key = String(chatId);
      const person = String(userId);
      const chat = activeChatRef.current;
      if (chat && sameId(key, chat._id)) {
        setTypingUsers((prev) => ({ ...prev, [person]: userName || true }));
        setTimeout(() => {
          const el = messagesAreaRef.current;
          if (!el || !stickToBottomRef.current) return;
          el.scrollTop = el.scrollHeight;
        }, 30);
      }
      setSidebarTyping((prev) => ({
        ...prev,
        [key]: { ...(prev[key] || {}), [person]: true },
      }));
    };

    const handleStopTyping = ({ chatId, userId }) => {
      if (!chatId || !userId) return;
      const key = String(chatId);
      const person = String(userId);
      const chat = activeChatRef.current;
      if (chat && sameId(key, chat._id)) {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[person];
          return next;
        });
      }
      setSidebarTyping((prev) => {
        const nextChat = { ...(prev[key] || {}) };
        delete nextChat[person];
        return { ...prev, [key]: nextChat };
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
      payload.fileType = stagedFile.fileType === "file" ? "document" : stagedFile.fileType;
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
        stickToBottomRef.current = true;
        setShowJump(false);
        setTimeout(() => {
          const el = messagesAreaRef.current;
          if (!el) return;
          el.scrollTop = el.scrollHeight;
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

  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 120);
    el.style.height = `${Math.max(next, 44)}px`;
  }, [message, activeChat?._id]);

  const handleMsgsScroll = () => {
    const el = messagesAreaRef.current;
    if (!el) return;
    const away = el.scrollHeight - el.scrollTop - el.clientHeight > 80;
    stickToBottomRef.current = !away;
    setShowJump(away);
  };

  const jumpToBottom = () => {
    const el = messagesAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    stickToBottomRef.current = true;
    setShowJump(false);
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

  const apiNotice = (message, fallbackKey) => (message ? t(message) : t(fallbackKey));

  // Block / Unblock action
  const confirmBlockUser = async () => {
    if (!otherUserId || actionLock.current) return;
    actionLock.current = true;
    try {
      const res = await blockUserApi.blockUser({ toUser: otherUserId }, { skipToast: true });
      if (res?.status) {
        toast.success(t("userBlockedSuccessfully"), { id: "chat-block" });
        setMyBlockedUsers((prev) => [...prev, otherUserId]);
        setShowBlockModal(false);
      } else {
        toast.error(apiNotice(res?.message, "failedToBlockUser"), { id: "chat-block" });
      }
    } catch (err) {
      toast.error(apiNotice(err?.response?.data?.message, "failedToBlockUser"), { id: "chat-block" });
    } finally {
      actionLock.current = false;
    }
  };

  const confirmUnblockUser = async () => {
    if (!otherUserId || actionLock.current) return;
    actionLock.current = true;
    try {
      const res = await blockUserApi.unblockUser({ toUser: otherUserId }, { skipToast: true });
      if (res?.status) {
        toast.success(t("userUnblockedSuccessfully"), { id: "chat-block" });
        setMyBlockedUsers((prev) => prev.filter((id) => id !== otherUserId));
        setShowUnblockModal(false);
      } else {
        toast.error(apiNotice(res?.message, "failedToUnblockUser"), { id: "chat-block" });
      }
    } catch (err) {
      toast.error(apiNotice(err?.response?.data?.message, "failedToUnblockUser"), { id: "chat-block" });
    } finally {
      actionLock.current = false;
    }
  };

  // Report user action
  const confirmReportUser = async () => {
    if (!otherUserId || !reportReason) {
      setReportError(t("pleaseSelectReason") || "Please select a reason");
      return;
    }
    if (actionLock.current) return;
    actionLock.current = true;
    try {
      const res = await reportUserApi.reportUser(
        {
          toUser: otherUserId,
          reason: reportReason,
          description: reportDescription,
        },
        { skipToast: true },
      );
      if (res?.status) {
        toast.success(t("userReportedSuccessfully"), { id: "chat-report" });
        setShowReportModal(false);
        setReportReason("");
        setReportDescription("");
      } else {
        toast.error(apiNotice(res?.message, "failedToReportUser"), { id: "chat-report" });
      }
    } catch (err) {
      toast.error(apiNotice(err?.response?.data?.message, "failedToReportUser"), { id: "chat-report" });
    } finally {
      actionLock.current = false;
    }
  };

  useEffect(() => {
    if (!organizerMode) return undefined;
    let cancelled = false;
    bookingApi.getOrganizerBuyerRefs().then((res) => {
      if (cancelled || !res?.status) return;
      const next = {};
      (res.data?.buyers || []).forEach((row) => {
        if (row?.userId) next[String(row.userId)] = row;
      });
      setBuyerRefs(next);
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [organizerMode]);

  const refsFor = (userId) => buyerRefs[String(userId || "")] || null;

  // Filter chats by search
  const filteredChats = chats.filter((c) => {
    if (!searchTerm.trim()) return true;
    const other = getOtherUser(c);
    const q = searchTerm.trim().toLowerCase();
    const name = `${other.firstName || ""} ${other.lastName || ""} ${other.email || ""}`.toLowerCase();
    if (name.includes(q)) return true;
    if (!organizerMode) return false;
    const refs = refsFor(other._id);
    return Boolean(refs?.bookingIds?.some((id) => String(id).toLowerCase().includes(q)));
  });

  const totalUnreadCount = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const activeOtherUser = getOtherUser(activeChat);
  const isOnline = (id) => Boolean(id && onlineUsers && typeof onlineUsers.has === "function" && onlineUsers.has(id));
  const isOtherOnline = isOnline(otherUserId);
  const threadTyping = Object.keys(typingUsers).length > 0;

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
              placeholder={organizerMode ? t("searchByNameOrBooking") : (t("searchPlaceholder") || "Search conversations...")}
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
                const isSelected = sameId(activeChat?._id, c._id);
                const isUserOnline = isOnline(other._id);
                const typingForRow = sidebarTyping[String(c._id)];
                const isTyping = typingForRow && Object.keys(typingForRow).length > 0;
                const name = `${other.firstName || ""} ${other.lastName || ""}`.trim() || other.email || "User";
                const lastMsg = c.lastMessage?.content || (c.lastMessage?.fileType ? "📎 Attachment" : "");
                const refs = organizerMode ? refsFor(other._id) : null;
                const about = refs?.latestTitle
                  ? `${refs.latestTitle}${refs.latestBookingId ? ` · ${refs.latestBookingId}` : ""}`
                  : "";

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
                            <span style={{ color: "var(--acc-bright, #2dd4bf)" }}>
                              {t("typing")}
                            </span>
                          ) : (
                            lastMsg || t("startConversation")
                          )}
                        </span>
                        {c.unreadCount > 0 && !isSelected && (
                          <span className="ms-row-unread">{c.unreadCount}</span>
                        )}
                      </div>
                      {about && <span className="ms-row-about">{about}</span>}
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
                    <span className={`ms-thread-status ${threadTyping || isOtherOnline ? "online" : ""}`}>
                      {threadTyping ? t("typing") : isOtherOnline ? t("online") : t("offline")}
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
                      {organizerMode && otherUserId && (
                        <button
                          type="button"
                          className="ms-dropdown-item"
                          onClick={() => {
                            setShowDropdown(false);
                            router.push(`/OrganizerCustomerBookings?userId=${String(otherUserId)}`);
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 7h16M4 12h16M4 17h10" />
                          </svg>
                          <span>{t("viewBooking")}</span>
                        </button>
                      )}
                      {!organizerMode && otherUserId && (
                        <button
                          type="button"
                          className="ms-dropdown-item"
                          onClick={() => {
                            setShowDropdown(false);
                            router.push(`/MyTickets?organizerId=${String(otherUserId)}`);
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 7h16M4 12h16M4 17h10" />
                          </svg>
                          <span>{t("viewBooking")}</span>
                        </button>
                      )}
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

              <div className="ms-msgs-wrap">
              {/* Messages History */}
              <div className="ms-msgs bd-scroll" ref={messagesAreaRef} onScroll={handleMsgsScroll}>
                {msgLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px" }}>
                    <div className="ac-skel-book" style={{ height: "48px", width: "60%" }} />
                    <div className="ac-skel-book" style={{ height: "48px", width: "50%", alignSelf: "flex-end" }} />
                    <div className="ac-skel-book" style={{ height: "48px", width: "70%" }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ margin: "auto", textAlign: "center", color: "var(--bd-gray-500)", padding: "20px" }}>
                    <p style={{ margin: 0, fontSize: "14px" }}>
                      {t("emptyChatHello")}
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const senderId = m.senderId || m.sender?._id || (typeof m.sender === "string" ? m.sender : "");
                    const isOutgoing = sameId(senderId, myId);
                    const timeStr = m.createdAt
                      ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "";
                    const kind = m.fileUrl ? mediaKind(m.fileType, m.fileUrl) : "";
                    const fileSrc = m.fileUrl ? getFullImageUrl(m.fileUrl) : "";
                    const readIds = (m.readBy || []).map((id) => String(id?._id || id));
                    const seenByOther = readIds.some((id) => id && !sameId(id, myId));

                    return (
                      <div key={m._id || idx} className={`ms-msg-wrap ${isOutgoing ? "out" : "in"}`}>
                        <div className="ms-bubble">
                          {fileSrc && kind === "image" && (
                            <ChatImage src={fileSrc} label={t("downloadFile")} />
                          )}
                          {fileSrc && kind === "video" && <VideoPlayer url={fileSrc} />}
                          {fileSrc && kind === "audio" && (
                            <audio controls src={fileSrc} style={{ maxWidth: "260px", marginBottom: "6px" }} />
                          )}
                          {fileSrc && kind === "file" && (
                            <a
                              href={fileSrc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ms-file-card"
                            >
                              <span className="ms-file-icon">
                                <FileIcon size={16} />
                              </span>
                              <span style={{ fontSize: "13px", fontWeight: 600 }}>{t("downloadFile")}</span>
                            </a>
                          )}

                          {m.content && <span>{m.content}</span>}
                        </div>

                        <div className="ms-msg-meta">
                          <span>{timeStr}</span>
                          {isOutgoing && (
                            <span>
                              {seenByOther ? "✓✓" : "✓"}
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
                      {t("typing")}
                    </span>
                  </div>
                )}
              </div>

              {showJump && (
                <button
                  type="button"
                  className="ms-jump"
                  onClick={jumpToBottom}
                  aria-label={t("jumpToLatest")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
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
                  {t("youBlockedThisUser")}
                </div>
              ) : isBlockedByOther ? (
                <div className="ms-blocked-banner">
                  {t("youAreBlocked")}
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

                  <textarea
                    ref={composerRef}
                    rows={1}
                    className="ms-in ms-composer"
                    placeholder={t("typeAMessage")}
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

      <Modal show={showClearChatModal} onHide={() => setShowClearChatModal(false)} centered className="ms-dialog">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>{t("clearChat")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="ms-dialog-copy">{t("clearChatConfirmMessage")}</p>
          <div className="ms-dialog-actions">
            <button type="button" className="ms-dialog-btn cancel" onClick={() => setShowClearChatModal(false)}>
              {t("cancel")}
            </button>
            <button type="button" className="ms-dialog-btn danger" onClick={confirmClearChat}>
              {t("clearChat")}
            </button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={showBlockModal} onHide={() => setShowBlockModal(false)} centered className="ms-dialog">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>{t("blockUser")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="ms-dialog-copy">{t("blockUserConfirmMessage")}</p>
          <div className="ms-dialog-actions">
            <button type="button" className="ms-dialog-btn cancel" onClick={() => setShowBlockModal(false)}>
              {t("cancel")}
            </button>
            <button type="button" className="ms-dialog-btn danger" onClick={confirmBlockUser}>
              {t("block")}
            </button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={showUnblockModal} onHide={() => setShowUnblockModal(false)} centered className="ms-dialog">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>{t("unblockUser")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="ms-dialog-copy">{t("unblockUserConfirmMessage")}</p>
          <div className="ms-dialog-actions">
            <button type="button" className="ms-dialog-btn cancel" onClick={() => setShowUnblockModal(false)}>
              {t("cancel")}
            </button>
            <button type="button" className="ms-dialog-btn confirm" onClick={confirmUnblockUser}>
              {t("unblock")}
            </button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered className="ms-dialog">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>{t("reportUser")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="ms-dialog-copy">{t("reportUserDescription")}</p>
          <select
            className="ms-dialog-field"
            value={reportReason}
            onChange={(e) => {
              setReportReason(e.target.value);
              setReportError("");
            }}
          >
            <option value="">{t("selectReason")}</option>
            <option value="SPAM">{t("reportReasonSpam")}</option>
            <option value="HARASSMENT">{t("reportReasonHarassment")}</option>
            <option value="INAPPROPRIATE">{t("reportReasonInappropriate")}</option>
            <option value="FRAUD">{t("reportReasonFraud")}</option>
            <option value="OTHER">{t("reportReasonOther")}</option>
          </select>
          <textarea
            className="ms-dialog-field ms-dialog-note"
            placeholder={t("optionalDescription")}
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
          />
          {reportError && <span className="ms-dialog-error">{reportError}</span>}
          <div className="ms-dialog-actions">
            <button type="button" className="ms-dialog-btn cancel" onClick={() => setShowReportModal(false)}>
              {t("cancel")}
            </button>
            <button type="button" className="ms-dialog-btn confirm" onClick={confirmReportUser}>
              {t("submitReport")}
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
