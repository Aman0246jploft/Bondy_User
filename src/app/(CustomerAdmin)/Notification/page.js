"use client";
import React, { useState, useEffect } from "react";
import { Tabs, Tab, Spinner } from "react-bootstrap";
import notificationApi from "@/api/notificationApi";
import { toast } from "react-hot-toast";

import { useLanguage } from "@/context/LanguageContext";
import { useSocket } from "@/context/SocketContext";

export default function NotificationPage() {
  const { t, language } = useLanguage();
  const { fetchUnreadNotificationCount, unreadNotificationCount } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deletingMultiple, setDeletingMultiple] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const PAGE_SIZE = 10;

  const fetchNotifications = async (page = currentPage, tab = activeTab) => {
    try {
      setLoading(true);
      const params = {
        page: page,
        limit: PAGE_SIZE,
      };
      if (tab !== "all") {
        params.category = tab;
      }
      const res = await notificationApi.getMyNotifications(params);
      if (res?.status === "SUCCESS" || res?.status === true || res?.data) {
        setNotifications(res?.data?.notifications || []);
        setTotalNotifications(res?.data?.total || 0);
        setTotalPages(res?.data?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error(t("failedToLoadNotifications") || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(currentPage, activeTab);
    fetchUnreadNotificationCount();
    document.title = `Notification - Bondy`;
  }, [currentPage, activeTab]);

  const handleMarkAllRead = async () => {
    try {
      const res = await notificationApi.markAllAsRead();
      if (res?.status || res?.status === "SUCCESS") {
        toast.success(t("allNotificationsMarkedRead") || "All notifications marked as read");
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        fetchUnreadNotificationCount();
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
        fetchUnreadNotificationCount();
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
        fetchNotifications(currentPage, activeTab);
        setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      }
    } catch (error) {
      toast.error(t("failedToDeleteNotification") || "Failed to delete notification");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    setDeletingMultiple(true);
    try {
      const res = await notificationApi.deleteMultipleNotifications(selectedIds);
      if (res?.status || res?.status === "SUCCESS") {
        toast.success(t("notificationsDeleted") || `${selectedIds.length} notification(s) deleted`);
        setSelectedIds([]);
        const remainingOnPage = notifications.length - selectedIds.filter(id => notifications.some(n => n._id === id)).length;
        if (remainingOnPage === 0 && currentPage > 1) {
          setCurrentPage((p) => p - 1);
        } else {
          fetchNotifications(currentPage, activeTab);
        }
      }
    } catch (error) {
      toast.error(t("failedToDeleteNotification") || "Failed to delete notifications");
    } finally {
      setDeletingMultiple(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const allSelected = notifications.every((n) => selectedIds.includes(n._id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !notifications.some((n) => n._id === id)));
    } else {
      setSelectedIds((prev) => [
        ...prev,
        ...notifications.filter((n) => !prev.includes(n._id)).map((n) => n._id),
      ]);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `${t("todayAt")} ${date.toLocaleTimeString(language === "mn" ? "mn-MN" : "en-US", { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    } else if (days === 1) {
      return `${t("yesterdayAt")} ${date.toLocaleTimeString(language === "mn" ? "mn-MN" : "en-US", { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    } else {
      return date.toLocaleString(language === "mn" ? "mn-MN" : "en-US", { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
    }
  };

  const renderPagination = () => {
    if (totalNotifications <= PAGE_SIZE) return null;
    return (
      <div className="d-flex justify-content-between align-items-center px-1 py-3" style={{ borderTop: "1px solid #2a2a2a", marginTop: 8 }}>
        <span style={{ color: "#888", fontSize: 13 }}>
          {t("showing") || "Showing"} {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalNotifications)}–{Math.min(currentPage * PAGE_SIZE, totalNotifications)} {t("of") || "of"} {totalNotifications}
        </span>
        <div className="d-flex gap-2 flex-wrap">
          <button className="common_btn" style={{ padding: "6px 14px", fontSize: 13 }} disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
            ← {t("previous") || "Previous"}
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
            .map((p, idx) =>
              p === "..." ? (
                <span key={`e-${idx}`} style={{ alignSelf: "center", color: "#666" }}>...</span>
              ) : (
                <button key={p} onClick={() => setCurrentPage(p)} className="common_btn" style={{ padding: "6px 12px", fontSize: 13, opacity: currentPage === p ? 1 : 0.5 }}>
                  {p}
                </button>
              )
            )}
          <button className="common_btn" style={{ padding: "6px 14px", fontSize: 13 }} disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
            {t("next") || "Next"} →
          </button>
        </div>
      </div>
    );
  };

  const renderNotificationCard = (notif) => {
    const isSelected = selectedIds.includes(notif._id);
    return (
      <div
        key={notif._id}
        className={`notification-cards ${!notif.isRead ? "unread-notif" : ""} ${isSelected ? "selected-notif" : ""}`}
        style={{ position: "relative", cursor: "pointer", opacity: notif.isRead ? 0.7 : 1, outline: isSelected ? "2px solid #23ada4" : "none" }}
        onClick={() => {
          if (!notif.isRead) handleMarkRead(notif._id);
        }}
      >
        <div className="d-flex align-items-start gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelect(notif._id)}
            onClick={(e) => e.stopPropagation()}
            style={{ marginTop: "4px", accentColor: "#23ada4", cursor: "pointer", flexShrink: 0 }}
          />
          <div>
            <h5>{notif.title}</h5>
            <p>{notif.message}</p>
          </div>
        </div>
        <div className="d-flex flex-column align-items-end justify-content-between">
          <p style={{ fontSize: "12px", margin: 0 }}>{formatTime(notif.createdAt)}</p>
        </div>
      </div>
    );
  };

  const getTabTitle = (key, labelKey) => {
    const label = t(labelKey) || labelKey;
    if (activeTab === key) {
      return `${label} (${totalNotifications})`;
    }
    return label;
  };

  const renderTabContent = () => {
    if (notifications.length === 0) {
      return <div className="text-center py-4 text-muted">{t("noNotifications")}</div>;
    }
    return (
      <>
        <div className="d-flex align-items-center justify-content-between mb-2 px-1">
          <label style={{ fontSize: 14, color: "#aaa", cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={notifications.every((n) => selectedIds.includes(n._id))}
              onChange={toggleSelectAll}
              style={{ marginRight: 6, accentColor: "#23ada4" }}
            />
            {t("selectAll") || "Select All"}
          </label>
          {selectedIds.length > 0 && (
            <button
              className="common_btn"
              style={{ padding: "5px 14px", fontSize: 13, background: "#e74c3c", border: "none" }}
              disabled={deletingMultiple}
              onClick={handleDeleteSelected}
            >
              {deletingMultiple ? <Spinner animation="border" size="sm" /> : `${t("deleteSelected") || "Delete Selected"} (${selectedIds.length})`}
            </button>
          )}
        </div>
        {notifications.map(renderNotificationCard)}
        {renderPagination()}
      </>
    );
  };

  return (
    <div>
      <div className="cards notification-card">
        <div className="card-title">
          <h3>{t("notifications")}</h3>
          {unreadNotificationCount > 0 && (
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
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => {
                setActiveTab(k);
                setSelectedIds([]);
                setCurrentPage(1);
              }}
            >
              <Tab eventKey="all" title={getTabTitle("all", "all")}>
                {renderTabContent()}
              </Tab>

              <Tab eventKey="bookings" title={getTabTitle("bookings", "bookings")}>
                {renderTabContent()}
              </Tab>

              <Tab eventKey="payments" title={getTabTitle("payments", "payments")}>
                {renderTabContent()}
              </Tab>

              <Tab eventKey="eventupdates" title={getTabTitle("eventupdates", "eventupdates")}>
                {renderTabContent()}
              </Tab>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
