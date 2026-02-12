"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { toast } from "react-hot-toast";

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());

    useEffect(() => {
        let socketInstance;
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (token) {
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

    return (
        <SocketContext.Provider value={{ socket, isSocketConnected, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
