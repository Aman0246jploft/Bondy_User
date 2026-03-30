"use client";
import React, { useState, useEffect } from "react";
import { Tabs, Tab, Spinner } from "react-bootstrap";
import notificationApi from "@/api/notificationApi";
import { toast } from "react-hot-toast";

import { useLanguage } from "@/context/LanguageContext";

export default function NotificationPage() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Fetching max 50 for now, can implement pagination later if needed
      const res = await notificationApi.getMyNotifications({ pageNo: 1, size: 50 });
      if (res?.status || res?.status === "SUCCESS") {
        setNotifications(res?.message?.list || res?.data?.list || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error(t("failedToLoadNotifications") || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await notificationApi.markAllAsRead();
      if (res?.status || res?.status === "SUCCESS") {
        toast.success(t("allNotificationsMarkedRead") || "All notifications marked as read");
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
      }
    } catch (error) {
      toast.error(t("failedToMarkAllRead") || "Failed to mark all as read");
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const res = await notificationApi.markAsRead(id);
      if (res?.status || res?.status === "SUCCESS") {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await notificationApi.deleteNotification(id);
      if (res?.status || res?.status === "SUCCESS") {
        toast.success(t("notificationDeleted") || "Notification deleted");
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (error) {
      toast.error(t("failedToDeleteNotification") || "Failed to delete notification");
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `${t("todayAt")} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `${t("yesterdayAt")} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.filter((n) => n.isRead).length;

  const renderNotificationCard = (notif) => (
    <div
      key={notif._id}
      className={`notification-cards ${!notif.isRead ? "unread-notif" : ""}`}
      style={{ position: "relative", cursor: "pointer", opacity: notif.isRead ? 0.7 : 1 }}
      onClick={() => {
        if (!notif.isRead) handleMarkRead(notif._id);
        // Could also redirect via notif.deepLink if it exists
      }}
    >
      <div>
        <h5>{notif.title}</h5>
        <p>{notif.message}</p>
      </div>
      <div className="d-flex flex-column align-items-end justify-content-between">
        <span
          className="text-danger mb-2"
          style={{ cursor: "pointer", fontSize: "14px", padding: "4px" }}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(notif._id);
          }}
          title={t("delete") || "Delete"}
        >
          ✕
        </span>
        <p style={{ fontSize: "12px", margin: 0 }}>{formatTime(notif.createdAt)}</p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="cards notification-card">
        <div className="card-title">
          <h3>{t("notifications")}</h3>
          {unreadCount > 0 && (
            <p onClick={handleMarkAllRead} style={{ cursor: "pointer" }}>
              {t("markAllRead")}{" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15.4933 6.93502C15.8053 7.20743 15.8374 7.68122 15.565 7.99325L7.70786 16.9933C7.56543 17.1564 7.35943 17.25 7.14287 17.25C6.9263 17.25 6.72031 17.1564 6.57788 16.9933L3.43502 13.3933C3.16261 13.0812 3.19473 12.6074 3.50677 12.335C3.8188 12.0626 4.29259 12.0947 4.565 12.4068L7.14287 15.3596L14.435 7.00677C14.7074 6.69473 15.1812 6.66261 15.4933 6.93502Z"
                  fill="#999999"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M20.5175 7.01946C20.8174 7.30513 20.829 7.77986 20.5433 8.07981L11.9716 17.0798C11.8201 17.2389 11.6065 17.3235 11.3872 17.3114C11.1679 17.2993 10.9649 17.1917 10.8318 17.0169L10.4035 16.4544C10.1526 16.1249 10.2163 15.6543 10.5458 15.4034C10.8289 15.1878 11.2161 15.2044 11.4787 15.4223L19.4571 7.04531C19.7428 6.74537 20.2175 6.73379 20.5175 7.01946Z"
                  fill="#999999"
                />
              </svg>
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="danger" />
          </div>
        ) : (
          <div className="ticket-tabs">
            <Tabs defaultActiveKey="all">
              <Tab eventKey="all" title={`${t("all")} (${notifications.length})`}>
                {notifications.length === 0 ? (
                  <div className="text-center py-4 text-muted">{t("noNotifications")}</div>
                ) : (
                  notifications.map(renderNotificationCard)
                )}
              </Tab>

              <Tab eventKey="unread" title={`${t("unread")} (${unreadCount})`}>
                {unreadCount === 0 ? (
                  <div className="text-center py-4 text-muted">{t("noUnreadNotifications") || "No unread notifications"}</div>
                ) : (
                  notifications.filter(n => !n.isRead).map(renderNotificationCard)
                )}
              </Tab>

              <Tab eventKey="read" title={`${t("read")} (${readCount})`}>
                {readCount === 0 ? (
                  <div className="text-center py-4 text-muted">{t("noReadNotifications") || "No read notifications"}</div>
                ) : (
                  notifications.filter(n => n.isRead).map(renderNotificationCard)
                )}
              </Tab>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
