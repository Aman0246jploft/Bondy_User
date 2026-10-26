"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import io from "socket.io-client";
import { toast } from "react-hot-toast";
import apiClient, { localizeMessage } from "@/api/apiClient";

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);

    useEffect(() => {
        let socketInstance;
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (token) {
            // Initial fetch of unread message count via HTTP
            apiClient.get("/chat/unread-count")
                .then((res) => {
                    const c = res.data?.data?.count;
                    if (c !== undefined) {
                        setUnreadMessageCount(Number(c) || 0);
                    }
                })
                .catch(() => {});

            // Decode token to get userId if needed, or rely on socket auth middleware if present
            // For now, passing token in auth payload
            socketInstance = io(process.env.NEXT_PUBLIC_BASE_URL, {
                auth: {
                    token: token,
                },
                transports: ["websocket"],
            });

            socketInstance.on("connect", () => {
                console.log("Socket connected:", socketInstance.id);
                setIsSocketConnected(true);

                // Fetch latest unread counts upon connection
                socketInstance.emit("get_unread_notification_count", {}, (res) => {
                    if (res?.count !== undefined) setUnreadNotificationCount(Number(res.count) || 0);
                });
                socketInstance.emit("get_unread_message_count", {}, (res) => {
                    if (res?.count !== undefined) setUnreadMessageCount(Number(res.count) || 0);
                });
            });

            socketInstance.on("unread_notification_count", (data) => {
                const count = typeof data === "number" ? data : (data?.count ?? 0);
                setUnreadNotificationCount(Number(count) || 0);
            });

            socketInstance.on("unread_message_count", (data) => {
                const count = typeof data === "number" ? data : (data?.count ?? 0);
                setUnreadMessageCount(Number(count) || 0);
            });

            // Re-fetch or update when a chat message or update arrives
            socketInstance.on("update_chat_list", () => {
                socketInstance.emit("get_unread_message_count", {}, (res) => {
                    if (res?.count !== undefined) setUnreadMessageCount(Number(res.count) || 0);
                });
            });

            socketInstance.on("receive_message", () => {
                socketInstance.emit("get_unread_message_count", {}, (res) => {
                    if (res?.count !== undefined) setUnreadMessageCount(Number(res.count) || 0);
                });
            });

            socketInstance.on("online_users_list", ({ userIds }) => {
                setOnlineUsers(new Set(userIds));
            });

            socketInstance.on("disconnect", () => {
                console.log("Socket disconnected");
                setIsSocketConnected(false);
            });

            socketInstance.on("connect_error", (err) => {
                console.error("Socket connection error:", err);
                // Toast only if it's not a generic connection error to avoid spam
                // toast.error("Socket connection failed");
            });

            socketInstance.on("force_logout", (data) => {
                const msg = data?.message || "This account has been deactivated.";
                toast.error(localizeMessage(msg), { id: "force-logout-toast" });
                localStorage.removeItem("token");
                localStorage.removeItem("userProfile");
                localStorage.removeItem("registerEmail");
                window.location.href = "/";
            });

            socketInstance.on("user_online", ({ userId }) => {
                setOnlineUsers((prev) => new Set(prev).add(userId));
            });

            socketInstance.on("user_offline", ({ userId }) => {
                setOnlineUsers((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(userId);
                    return newSet;
                });
            });

            setSocket(socketInstance);
        }

        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
    }, []);

    const fetchUnreadNotificationCount = () => {
        if (socket) {
            socket.emit("get_unread_notification_count", {}, (res) => {
                if (res?.count !== undefined) setUnreadNotificationCount(res.count);
            });
        }
    };

    const fetchUnreadMessageCount = () => {
        if (socket && isSocketConnected) {
            socket.emit("get_unread_message_count", {}, (res) => {
                if (res?.count !== undefined) setUnreadMessageCount(Number(res.count) || 0);
            });
        } else {
            apiClient.get("/chat/unread-count")
                .then((res) => {
                    const c = res.data?.data?.count;
                    if (c !== undefined) {
                        setUnreadMessageCount(Number(c) || 0);
                    }
                })
                .catch(() => {});
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isSocketConnected, onlineUsers, unreadNotificationCount, fetchUnreadNotificationCount, unreadMessageCount, fetchUnreadMessageCount }}>
            {children}
        </SocketContext.Provider>
    );
};
