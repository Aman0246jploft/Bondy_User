"use client";
import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import "./message.css";
import Link from "next/link";
import { useSocket } from "@/context/SocketContext";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import authApi from "@/api/authApi";
import { Modal } from "react-bootstrap";
import blockUserApi from "@/api/blockUser";
import reportUserApi from "@/api/reportUser";
import { useLanguage } from "@/context/LanguageContext";

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

function MessageContent() {
    const { t } = useLanguage();
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
    const fileInputRef = useRef(null);
    const hasAutoSelected = useRef(false);
    const chatsLoaded = useRef(false);
    const activeChatRef = useRef(activeChat);
    useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

    // ─── File Upload State ─────────────────────────────────────
    const [isUploading, setIsUploading] = useState(false);
    const [stagedFile, setStagedFile] = useState(null); // { fileUrl, fileType, localUrl, name }
    const [typingUsers, setTypingUsers] = useState({}); // { userId: userName }
    const [sidebarTyping, setSidebarTyping] = useState({}); // { chatId: boolean }
    const typingTimeoutRef = useRef(null);
    const [showClearChatModal, setShowClearChatModal] = useState(false);

    // ─── Block & Report State ──────────────────────────────────
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showUnblockModal, setShowUnblockModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportDescription, setReportDescription] = useState("");
    const [reportError, setReportError] = useState("");

    // ─── Helper ────────────────────────────────────────────────
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
        [getMyId],
    );

    // Check if current user has blocked the other user
    const isBlockedByMe = activeChat?.blockedBy?._id === getMyId() || activeChat?.blockedBy === getMyId();
    
    // Check if current user is blocked by the other user
    const isBlockedByOther = activeChat?.isBlocked && !isBlockedByMe;

    // ══════════════════════════════════════════════════════════
    // 1. Initial chat list fetch (page 1) + real-time listeners
    // ══════════════════════════════════════════════════════════

    useEffect (() => {
        document.title = "Message - Bondy";
    },[])

    useEffect(() => {
        if (!socket) return;

        setChatListLoading(true);
        socket.emit("get_chat_list", { page: 1, limit: CHAT_LIMIT }, (response) => {
            setChatListLoading(false);
            if (response.status === "ok") {
                setChats(response.data);
                console.log(response.data ,"dattttttttt");
                // Join all rooms in the chat list to listen for updates (like typing)
                response.data.forEach((chat) => {
                    socket.emit("join_chat", { chatId: chat._id });
                });
                setChatPage(1);
                setChatHasMore(response.hasMore ?? false);
                chatsLoaded.current = true;
            } else {
                console.error("Error fetching chats:", response.message);
                chatsLoaded.current = true;
            }
        });

        const handleUpdateChatList = (updatedChat) => {
            setChats((prev) => {
                const others = prev.filter((c) => c._id !== updatedChat._id);
                return [updatedChat, ...others];
            });
        };

        const handleNewChat = (newChat) => {
            setChats((prev) => {
                if (prev.some((c) => c._id === newChat._id)) return prev;
                // Join the new room immediately
                socket.emit("join_chat", { chatId: newChat._id });
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
        if (!targetUserId || !socket || !chatsLoaded.current || hasAutoSelected.current) return;

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
                            participants: [{
                                _id: userData._id,
                                firstName: userData.firstName,
                                lastName: userData.lastName,
                                profileImage: userData.profileImage,
                            }],
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

        socket.emit("join_chat", { chatId: activeChat._id });

        // Reset message pagination
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
                    setMessages(response.data.slice().reverse());
                    setMsgPage(1);
                    setMsgHasMore(response.hasMore ?? false);

                    setChats((prev) =>
                        prev.map((c) =>
                            c._id === activeChat._id ? { ...c, unreadCount: 0 } : c,
                        ),
                    );
                    setTimeout(() => {
                        if (messagesAreaRef.current) messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
                    }, 100);
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
            if (container.scrollTop > 40) return;
            const chat = activeChatRef.current;
            if (!chat || chat.isVirtual) return;
            if (!msgHasMore || msgLoading) return;

            const prevScrollHeight = container.scrollHeight;
            const nextPage = msgPage + 1;
            setMsgLoading(true);

            socket.emit(
                "get_message_list",
                { chatId: chat._id, page: nextPage, limit: MSG_LIMIT },
                (response) => {
                    setMsgLoading(false);
                    if (response.status === "ok") {
                        const olderMsgs = response.data.slice().reverse();
                        setMessages((prev) => [...olderMsgs, ...prev]);
                        setMsgPage(nextPage);
                        setMsgHasMore(response.hasMore ?? false);

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
                    if (messagesAreaRef.current) messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
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

        const handleTyping = ({ chatId, userId, userName }) => {
            // Update active chat typing state
            const chat = activeChatRef.current;
            if (chat && chatId === chat._id) {
                setTypingUsers((prev) => ({ ...prev, [userId]: userName }));
            }
            // Update sidebar typing state (track specific users)
            setSidebarTyping((prev) => ({
                ...prev,
                [chatId]: { ...(prev[chatId] || {}), [userId]: true }
            }));
        };

        const handleStopTyping = ({ chatId, userId }) => {
            // Update active chat typing state
            const chat = activeChatRef.current;
            if (chat && chatId === chat._id) {
                setTypingUsers((prev) => {
                    const newState = { ...prev };
                    delete newState[userId];
                    return newState;
                });
            }
            // Update sidebar typing state (remove specific user)
            setSidebarTyping((prev) => {
                const chatTyping = { ...(prev[chatId] || {}) };
                delete chatTyping[userId];
                return { ...prev, [chatId]: chatTyping };
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

    // ══════════════════════════════════════════════════════════
    // 7. Mark messages read on chat open / new message
    // ══════════════════════════════════════════════════════════
    useEffect(() => {
        if (!socket || !activeChat || activeChat.isVirtual) return;

        // 1. Tell server to mark as read
        socket.emit("mark_messages_read", { chatId: activeChat._id });

        // 2. Instantly reset unread count in Sidebar UI
        setChats((prev) =>
            prev.map((c) =>
                c._id === activeChat._id ? { ...c, unreadCount: 0 } : c,
            ),
        );
    }, [socket, activeChat?._id, messages.length]);

    // ══════════════════════════════════════════════════════════
    // 8. Scroll to bottom on initial chat load
    // ══════════════════════════════════════════════════════════
    useEffect(() => {
        if (activeChat && !msgLoading) {
            if (messagesAreaRef.current) messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
        }
    }, [activeChat?._id]); // eslint-disable-line react-hooks/exhaustive-deps

    // ══════════════════════════════════════════════════════════
    // 9. Send Message
    // ══════════════════════════════════════════════════════════
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
            if (response.status === "ok") {
                // Stop typing when message is sent
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
                    if (messagesAreaRef.current) messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
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
    }, [socket, activeChat, message, stagedFile]);

    // 11. Delete Message (for me)
    const deleteMessage = useCallback((messageId) => {
        if (!socket || !messageId) return;
        if (!window.confirm("Delete this message for you?")) return;

        socket.emit("delete_message", { messageId, deleteType: "me" }, (response) => {
            if (response.status === "ok") {
                setMessages((prev) => prev.filter((m) => m._id !== messageId));
                toast.success("Message deleted");
            } else {
                toast.error(response.message || "Failed to delete message");
            }
        });
    }, [socket]);

    // 12. Clear Chat (for me)
    const handleClearChatClick = useCallback(() => {
        if (!socket || !activeChat || activeChat.isVirtual) return;
        setShowDropdown(false);
        setShowClearChatModal(true);
    }, [socket, activeChat]);

    const confirmClearChat = useCallback(() => {
        if (!socket || !activeChat || activeChat.isVirtual) return;

        socket.emit("clear_chat", { chatId: activeChat._id }, (response) => {
            if (response.status === "ok") {
                setMessages([]);
                setShowClearChatModal(false);
                toast.success("Chat cleared");
            } else {
                toast.error(response.message || "Failed to clear chat");
            }
        });
    }, [socket, activeChat]);

    const handleKeyPress = (e) => {
        if (e.key === "Enter") sendMessage();
    };

    const handleInputChange = (e) => {
        setMessage(e.target.value);

        if (!socket || !activeChat || activeChat.isVirtual) return;

        // Emit typing event
        socket.emit("typing", { chatId: activeChat._id });

        // Clear existing timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Set new timeout to stop typing
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stop_typing", { chatId: activeChat._id });
            typingTimeoutRef.current = null;
        }, 3000);
    };

    // ══════════════════════════════════════════════════════════
    // 10. Handle File Select (upload only, send via sendMessage)
    // ══════════════════════════════════════════════════════════
    const handleFileSelect = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const localUrl = URL.createObjectURL(file);
            const formData = new FormData();
            formData.append("files", file);
            const res = await authApi.uploadFile(formData);
            const fileUrl = res?.data?.files?.[0] || res?.files?.[0];
            if (!fileUrl) throw new Error("No file URL returned");
            const fileType = file.type.startsWith("image/")
                ? "image"
                : file.type.startsWith("video/")
                    ? "video"
                    : file.type.startsWith("audio/")
                        ? "audio"
                        : "document";
            setStagedFile({ fileUrl, fileType, localUrl, name: file.name });
        } catch (err) {
            console.error("File upload error:", err);
            toast.error("File upload failed");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, []);

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
                                    <h4 className="title m-0">{t("messages")}</h4>
                                    <div
                                        className={`status-dot ${isSocketConnected ? "online" : "offline"}`}
                                        title={isSocketConnected ? t("connected") : t("disconnected")}
                                    >
                                    </div>
                                </div>

                                <div className="search-box">
                                    <input
                                        type="text"
                                        placeholder={t("search")}
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
                                                onClick={() => { setShowDropdown(false); setActiveChat(chat); }}
                                                className={`user-chat-box ${activeChat?._id === chat._id ? "active" : ""}`}
                                            >
                                                <div className="position-relative">
                                                    <img
                                                        src={other.profileImage || "/img/sidebar-logo.svg"}
                                                        className="user-img"
                                                        onError={(e) => (e.target.src = "/img/sidebar-logo.svg")}
                                                        alt="User"
                                                    />
                                                    {isOnline && <span className="online-badge"></span>}
                                                </div>

                                                <div className="user-info">
                                                    <h5>{other.firstName} {other.lastName}</h5>
                                                    <p className="text-truncate" style={{ maxWidth: "150px" }}>
                                                        {sidebarTyping[chat._id] && Object.keys(sidebarTyping[chat._id]).length > 0 ? (
                                                            <span style={{ color: "var(--primary-color)", fontWeight: "500" }}>{t("typing")}</span>
                                                        ) : (
                                                            chat.lastMessage?.content || t("noMessagesYet")
                                                        )}
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
                                            <small className="text-muted">{t("loading")}…</small>
                                        </div>
                                    )}
                                    {!chatListLoading && !chatHasMore && chats.length > 0 && (
                                        <div className="text-center py-2">
                                            <small className="text-muted">{t("noMoreChats")}</small>
                                        </div>
                                    )}
                                    {!chatListLoading && filteredChats.length === 0 && (
                                        <div className="text-center mt-4 text-muted">{t("noChatsFound")}</div>
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
                                                src={getOtherUser(activeChat).profileImage || "/img/sidebar-logo.svg"}
                                                className="header-img"
                                                onError={(e) => (e.target.src = "/img/sidebar-logo.svg")}
                                                alt="User"
                                            />

                                            <div className="info">
                                                <h5>
                                                    {getOtherUser(activeChat).firstName}{" "}
                                                    {getOtherUser(activeChat).lastName}
                                                </h5>
                                                <small className={onlineUsers.has(getOtherUser(activeChat)._id) ? "online" : "offline"}>
                                                    {onlineUsers.has(getOtherUser(activeChat)._id) ? t("online") : t("offline")}
                                                </small>
                                            </div>

                                            <div className="menu" onClick={() => setShowDropdown(!showDropdown)}>⋮</div>

                                            {showDropdown && (
                                                <div className="options-dropdown">
                                                    <Link href={`/profile?id=${getOtherUser(activeChat)._id}`}>
                                                        <img src="/img/user-white.svg" className="me-2" alt="" />
                                                        {t("userProfile")}
                                                    </Link>
                                                    <a href="#" className="clear-chat" onClick={(e) => { e.preventDefault(); handleClearChatClick(); }}>
                                                        <img src="/img/delete.svg" className="me-2" style={{ filter: "invert(40%) sepia(91%) saturate(3452%) hue-rotate(346deg) brightness(103%) contrast(106%)" }} alt="" />
                                                    {t("clearChat")}
                                                    </a>
                                                    {isBlockedByMe ? (
                                                        <a href="#" className="unblock-action" onClick={(e) => { e.preventDefault(); setShowDropdown(false); setShowUnblockModal(true); }}>
                                                            <img src="/img/block-icon.svg" className="me-2" alt="" style={{ width: '16px', height: '16px', filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(130deg) brightness(95%) contrast(85%)' }} onError={(e) => e.target.style.display = 'none'} />
                                                            {t("unblockUser")}
                                                        </a>
                                                    ) : (
                                                        <a href="#" className="block-action" onClick={(e) => { e.preventDefault(); setShowDropdown(false); setShowBlockModal(true); }}>
                                                            <img src="/img/block-icon.svg" className="me-2" alt="" style={{ width: '16px', height: '16px', filter: "invert(40%) sepia(91%) saturate(3452%) hue-rotate(346deg) brightness(103%) contrast(106%)" }} onError={(e) => e.target.style.display = 'none'} />
                                                            {t("blockUser")}
                                                        </a>
                                                    )}
                                                    <a href="#" className="report-action" onClick={(e) => { e.preventDefault(); setShowDropdown(false); setShowReportModal(true); }}>
                                                        <img src="/img/report-icon.svg" className="me-2" alt="" style={{ width: '16px', height: '16px', filter: "invert(54%) sepia(98%) saturate(1475%) hue-rotate(2deg) brightness(103%) contrast(105%)" }} onError={(e) => e.target.style.display = 'none'} />
                                                        {t("reportUser")}
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {/* MESSAGES AREA */}
                                        <div className="messages-area" ref={messagesAreaRef}>

                                            {/* Load-older indicator */}
                                            {msgLoading && msgPage > 1 && (
                                                <div className="text-center py-2">
                                                    <small className="text-muted">{t("loadingOlderMessages")}…</small>
                                                </div>
                                            )}
                                            {!msgHasMore && messages.length > 0 && (
                                                <div className="text-center py-2">
                                                    <small className="text-muted">{t("beginningOfConversation")}</small>
                                                </div>
                                            )}

                                            {/* Initial load spinner */}
                                            {msgLoading && msgPage === 1 && (
                                                <div className="text-center py-4">
                                                    <small className="text-muted">{t("loadingMessages")}…</small>
                                                </div>
                                            )}

                                            {messages.map((m, i) => {
                                                if (m.isDateSeparator) {
                                                    return (
                                                        <div key={`sep-${i}`} className="date-separator">
                                                            <span>{m.seperatorText}</span>
                                                        </div>
                                                    );
                                                }

                                                const myId = parseJwt(localStorage.getItem("token"))?.userId;
                                                const isMyMessage = (m.sender?._id || m.sender) === myId;

                                                return (
                                                    <div
                                                        key={m._id || i}
                                                        className={`message ${isMyMessage ? "right" : "left"}`}
                                                    >
                                                        {!isMyMessage && (
                                                            <img
                                                                src={m.sender?.profileImage || "/img/sidebar-logo.svg"}
                                                                className="msg-user-img"
                                                                onError={(e) => (e.target.src = "/img/sidebar-logo.svg")}
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
                                                                            {m.readBy?.some((id) => id !== getMyId()) ? (
                                                                                <span style={{ color: "#34b7f1" }}>✓✓</span>
                                                                            ) : (
                                                                                <span>✓✓</span>
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                    {/* <button
                                                                        className="delete-msg-btn"
                                                                        onClick={() => deleteMessage(m._id)}
                                                                        title="Delete for me"
                                                                    >
                                                                        🗑️
                                                                    </button> */}
                                                                </span>
                                                            </div>
                                                            <div className="msg-text">
                                                                {(() => {
                                                                    const isImage =
                                                                        m.fileType === "image" ||
                                                                        (!m.fileType && m.fileUrl && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(m.fileUrl));
                                                                    return (
                                                                        <>
                                                                            {m.fileUrl && isImage && (
                                                                                <img
                                                                                    src={m.fileUrl}
                                                                                    alt="attachment"
                                                                                    className="chat-image"
                                                                                    style={{
                                                                                        maxWidth: "220px",
                                                                                        borderRadius: "8px",
                                                                                        display: "block",
                                                                                        marginBottom: m.content ? "6px" : 0,
                                                                                        cursor: "pointer",
                                                                                    }}
                                                                                    onClick={() => window.open(m.fileUrl, "_blank")}
                                                                                    onError={(e) => (e.target.style.display = "none")}
                                                                                />
                                                                            )}
                                                                            {m.fileUrl && !isImage && (
                                                                                <a
                                                                                    href={m.fileUrl}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="chat-file-link"
                                                                                    style={{ display: "block", marginBottom: m.content ? "4px" : 0 }}
                                                                                >
                                                                                    📎 {t("downloadFile")}
                                                                                </a>
                                                                            )}
                                                                            {m.content}
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {Object.values(typingUsers).length > 0 && (
                                                <div className="typing-indicator-container">
                                                    <div className="typing-text">
                                                        {Object.values(typingUsers).join(", ")} {Object.values(typingUsers).length > 1 ? t("typingPlural") : t("typingSingular")}
                                                        <span className="dot-animation"><span>.</span><span>.</span><span>.</span></span>
                                                    </div>
                                                </div>
                                            )}

                                            <div ref={msgEndRef} />
                                        </div>

                                        {/* MESSAGE INPUT */}
                                        {isBlockedByOther ? (
                                            <div className="message-input" style={{ padding: '16px' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '10px',
                                                    padding: '14px 20px',
                                                    background: 'rgba(231, 76, 60, 0.1)',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(231, 76, 60, 0.3)'
                                                }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <circle cx="12" cy="12" r="10" stroke="#e74c3c" strokeWidth="2"/>
                                                        <path d="M7 7L17 17" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round"/>
                                                    </svg>
                                                    <span style={{ color: '#e74c3c', fontSize: '14px', fontWeight: 500 }}>
                                                        {t("youAreBlockedByThisUser")}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="message-input">
                                                {/* Staged file preview */}
                                                {stagedFile && (
                                                    <div style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "12px",
                                                        padding: "10px 16px",
                                                        background: "rgba(255, 255, 255, 0.05)",
                                                        borderRadius: "16px",
                                                        marginBottom: "12px",
                                                        border: "1px solid var(--border-color)",
                                                    }}>
                                                        {stagedFile.fileType === "image" ? (
                                                            <img
                                                                src={stagedFile.localUrl}
                                                                alt="preview"
                                                                style={{ height: "40px", width: "40px", objectFit: "cover", borderRadius: "8px" }}
                                                            />
                                                        ) : (
                                                            <span style={{ fontSize: "20px" }}>📄</span>
                                                        )}
                                                        <span style={{ flex: 1, fontSize: "13px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {stagedFile.name}
                                                        </span>
                                                        <button
                                                            onClick={() => setStagedFile(null)}
                                                            style={{ background: "none", border: "none", color: "#ff5555", fontSize: "16px", cursor: "pointer", padding: "4px" }}
                                                            title={t("removeAttachment")}
                                                        >✕</button>
                                                    </div>
                                                )}

                                                <div className="input-container">
                                                    {/* Hidden file input */}
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                                                        style={{ display: "none" }}
                                                        onChange={handleFileSelect}
                                                    />

                                                    <button
                                                        className="clip-btn"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={isUploading}
                                                        title={t("attachFile")}
                                                    >
                                                        {isUploading ? "⏳" : "📎"}
                                                    </button>

                                                    <input
                                                        type="text"
                                                        placeholder={stagedFile ? t("addCaption") : t("yourMessagePlaceholder")}
                                                        value={message}
                                                        onChange={handleInputChange}
                                                        onKeyPress={handleKeyPress}
                                                    />

                                                    <button
                                                        onClick={sendMessage}
                                                        className="send-btn"
                                                        disabled={isUploading || (!message.trim() && !stagedFile)}
                                                    >
                                                        <img src="/img/send_chat.svg" alt="Send" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="no-chat-selected">
                                        <img src="/img/logo.svg" alt="Logo" />
                                        {t("selectChatToStart")}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Clear Chat Confirmation Modal */}
            <Modal show={showClearChatModal} onHide={() => setShowClearChatModal(false)} centered className="clear-chat-modal">
                <Modal.Body className="text-center p-4">
                    <div className="modal-icon mb-3">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="11" stroke="#ff4d4f" strokeWidth="2" fill="rgba(255, 77, 79, 0.1)"/>
                            <path d="M9 9L15 15M15 9L9 15" stroke="#ff4d4f" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: '12px' }}>{t("clearChat")}?</h4>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px' }}>
                        {t("clearChatConfirmMessage")}
                    </p>
                    <div className="d-flex gap-3 justify-content-center">
                        <button 
                            onClick={() => setShowClearChatModal(false)}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'transparent',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {t("cancel")}
                        </button>
                        <button 
                            onClick={confirmClearChat}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {t("clearChat")}
                        </button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Block User Confirmation Modal */}
            <Modal show={showBlockModal} onHide={() => setShowBlockModal(false)} centered className="clear-chat-modal">
                <Modal.Body className="text-center p-4">
                    <div className="modal-icon mb-3">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="11" stroke="#ff4d4f" strokeWidth="2" fill="rgba(255, 77, 79, 0.1)"/>
                            <circle cx="12" cy="12" r="5" stroke="#ff4d4f" strokeWidth="2"/>
                            <path d="M8.5 8.5L15.5 15.5" stroke="#ff4d4f" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: '12px' }}>{t("blockUser")}?</h4>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px' }}>
                        {t("blockUserConfirmMessage")}
                    </p>
                    <div className="d-flex gap-3 justify-content-center">
                        <button 
                            onClick={() => setShowBlockModal(false)}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'transparent',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {t("cancel")}
                        </button>
                        <button 
                            onClick={async () => {
                                try {
                                    const otherUserId = getOtherUser(activeChat)?._id;
                                    if (!otherUserId) return;
                                    const res = await blockUserApi.blockUser({ toUser: otherUserId });
                                    setShowBlockModal(false);
                                    if (res.status === true) {
                                        // Update local state to reflect block
                                        const myId = getMyId();
                                        setActiveChat(prev => ({ ...prev, blockedBy: { _id: myId }, isBlocked: true }));
                                        setChats(prev => prev.map(c => c._id === activeChat._id ? { ...c, blockedBy: { _id: myId }, isBlocked: true } : c));
                                        toast.success(res.message || t("userBlockedSuccessfully"));
                                    }
                                } catch (error) {
                                    console.error(error);
                                    toast.error(t("failedToBlockUser"));
                                }
                            }}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {t("blockUser")}
                        </button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Unblock User Confirmation Modal */}
            <Modal show={showUnblockModal} onHide={() => setShowUnblockModal(false)} centered className="clear-chat-modal">
                <Modal.Body className="text-center p-4">
                    <div className="modal-icon mb-3">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="11" stroke="#1abc9c" strokeWidth="2" fill="rgba(26, 188, 156, 0.1)"/>
                            <path d="M8 12l3 3 5-6" stroke="#1abc9c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: '12px' }}>{t("unblockUser")}?</h4>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px' }}>
                        {t("unblockUserConfirmMessage")}
                    </p>
                    <div className="d-flex gap-3 justify-content-center">
                        <button 
                            onClick={() => setShowUnblockModal(false)}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'transparent',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {t("cancel")}
                        </button>
                        <button 
                            onClick={async () => {
                                try {
                                    const otherUserId = getOtherUser(activeChat)?._id;
                                    if (!otherUserId) return;
                                    const res = await blockUserApi.unblockUser({ toUser: otherUserId });
                                    setShowUnblockModal(false);
                                    if (res.status === true) {
                                        // Update local state to reflect unblock
                                        setActiveChat(prev => ({ ...prev, blockedBy: null, isBlocked: false }));
                                        setChats(prev => prev.map(c => c._id === activeChat._id ? { ...c, blockedBy: null, isBlocked: false } : c));
                                        toast.success(res.message || t("userUnblockedSuccessfully"));
                                    }
                                } catch (error) {
                                    console.error(error);
                                    toast.error(t("failedToUnblockUser"));
                                }
                            }}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #1abc9c 0%, #3db5b4 100%)',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {t("unblockUser")}
                        </button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Report User Modal */}
            <Modal show={showReportModal} onHide={() => { setShowReportModal(false); setReportReason(""); setReportDescription(""); setReportError(""); }} centered className="clear-chat-modal">
                <Modal.Body className="p-4">
                    <div className="text-center mb-3">
                        <div className="modal-icon mb-3">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="11" stroke="#1abc9c" strokeWidth="2" fill="rgba(26, 188, 156, 0.1)"/>
                                <path d="M12 8V12M12 16H12.01" stroke="#1abc9c" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: '12px' }}>{t("reportUser")}</h4>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '16px' }}>
                            {t("reportUserDescription")}
                        </p>
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                        <input
                            type="text"
                            placeholder={t("enterReason")}
                            value={reportReason}
                            onChange={(e) => { setReportReason(e.target.value); setReportError(""); }}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: reportError ? '1px solid #e74c3c' : '1px solid #404040',
                                background: '#1a1a1a',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                        {reportError && (
                            <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '6px', marginBottom: 0 }}>
                                {reportError}
                            </p>
                        )}
                    </div>
                    
                    <div style={{ marginBottom: '24px' }}>
                        <textarea
                            placeholder={t("descriptionOptional")}
                            value={reportDescription}
                            onChange={(e) => setReportDescription(e.target.value)}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid #404040',
                                background: '#1a1a1a',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none',
                                resize: 'none'
                            }}
                        />
                    </div>
                    
                    <div className="d-flex gap-3 justify-content-center">
                        <button 
                            onClick={() => { setShowReportModal(false); setReportReason(""); setReportDescription(""); setReportError(""); }}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '10px',
                                border: 'none',
                                background: '#444',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {t("cancel")}
                        </button>
                        <button 
                            onClick={async () => {
                                const reason = reportReason.trim();
                                if (!reason) {
                                    setReportError(t("reasonIsRequired"));
                                    return;
                                }
                                try {
                                    const userId = getOtherUser(activeChat)?._id;
                                    if (!userId) return;
                                    const res = await reportUserApi.reportUser({
                                        toUser: userId,
                                        reason: reason,
                                        description: reportDescription.trim()
                                    });
                                    setShowReportModal(false);
                                    setReportReason("");
                                    setReportDescription("");
                                    setReportError("");
                                    if (res.status === true) {
                                        toast.success(res.message || t("userReportedSuccessfully"));
                                    }
                                } catch (error) {
                                    console.error(error);
                                    toast.error(t("failedToReportUser"));
                                }
                            }}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '10px',
                                border: 'none',
                                background: '#1abc9c',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {t("submitReport")}
                        </button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default function Page() {
    const { t } = useLanguage();
    return (
        <Suspense fallback={<div>{t("loading")}...</div>}>
            <MessageContent />
        </Suspense>
    );
}
