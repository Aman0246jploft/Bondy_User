"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import notificationApi from "@/api/notificationApi";
import { useLanguage } from "@/context/LanguageContext";
import { useSocket } from "@/context/SocketContext";
import "./notifications.css";

const PAGE_SIZE = 10;

function NotificationIcon({ type, title = "" }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "PAYOUT" || /payment|payout|refund|earning|credit/i.test(title)) {
    return <svg {...common}><path d="M3 7h18v11H3zM3 10h18M7 15h3" /></svg>;
  }
  if (type === "CHAT") {
    return <svg {...common}><path d="M4 5h16v12H8l-4 3V5Z" /><path d="M8 10h8M8 13h5" /></svg>;
  }
  if (type === "FOLLOW" || type === "USER") {
    return <svg {...common}><circle cx="10" cy="8" r="3" /><path d="M4 19a6 6 0 0 1 12 0M18 8v6M15 11h6" /></svg>;
  }
  if (/promotion/i.test(title)) {
    return <svg {...common}><path d="M4 10.5v3A1.5 1.5 0 0 0 5.5 15H8l8.5 4.5v-14L8 10H5.5A1.5 1.5 0 0 0 4 11.5Z" /><path d="M8 15v3.5a1.5 1.5 0 0 0 3 0v-1.9M19.5 9.5a4 4 0 0 1 0 5" /></svg>;
  }
  if (/verification|approved|verified/i.test(title)) {
    return <svg {...common}><path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>;
  }
  if (type === "EVENT" || type === "COURSE") {
    return <svg {...common}><path d="M4 8.5V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5a2.2 2.2 0 0 0 0 4.4V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4.1a2.2 2.2 0 0 0 0-4.4Z" /></svg>;
  }
  return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
}

function toneFor(notification) {
  const text = `${notification.title || ""} ${notification.message || ""}`;
  if (/reject|failed|cancel/i.test(text)) return "danger";
  if (/pending|expire|warning/i.test(text)) return "warn";
  if (/approved|confirmed|success|paid|completed/i.test(text)) return "ok";
  if (/promotion/i.test(text)) return "brand";
  return notification.type === "SYSTEM" ? "neutral" : "brand";
}

function destinationFor(notification) {
  const id = notification.relatedId;
  if (notification.type === "CHAT") {
    const senderId = notification.sender?._id || notification.sender;
    return senderId ? `/Message?userId=${senderId}` : "/Message";
  }
  if (notification.type === "FOLLOW" || notification.onModel === "User") return id ? `/profile?id=${id}` : "";
  if (notification.type === "PAYOUT" || notification.onModel === "Payout") return "/Earnings";
  if (notification.onModel === "Event") return id ? `/EventDetailOrganiser?eventId=${id}` : "/EventsManagement";
  if (notification.onModel === "Course") return id ? `/CourseDetailOrganiser?courseId=${id}` : "/CoursesManagement";
  if (/booking/i.test(notification.title || "") && id) return `/TicketDetailsOrganiser?id=${id}`;

  const link = notification.webLink || notification.deepLink || "";
  if (/verification/i.test(link)) return "/Verifiedprofile";
  if (/earning|payout/i.test(link)) return "/Earnings";
  if (/support/i.test(link)) return "/SupportTickets";
  if (/setting/i.test(link)) return "/Settings";
  if (/promotion/i.test(link)) return "/Promotions";
  return "";
}

export default function NotificationPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { fetchUnreadNotificationCount } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUnread, setTotalUnread] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const [deadLink, setDeadLink] = useState(false);
  const [toastText, setToastText] = useState("");
  const [retry, setRetry] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const params = { page: currentPage, limit: PAGE_SIZE };
      if (activeTab === "unread") params.isRead = false;
      const res = await notificationApi.getMyNotifications(params);
      if (!res?.status || !res?.data) throw new Error("Invalid notification response");
      setNotifications(res.data.notifications || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalUnread(res.data.totalUnread || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setFailed(true);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadNotificationCount();
    document.title = `${t("notifications")} - Bondy`;
  }, [fetchNotifications, retry, language]);

  const flash = (text) => {
    setToastText(text);
    window.setTimeout(() => setToastText(""), 2200);
  };

  const handleMarkAllRead = async () => {
    if (!totalUnread || markingAll) return;
    setMarkingAll(true);
    try {
      const res = await notificationApi.markAllAsRead();
      if (res?.status) {
        setTotalUnread(0);
        if (activeTab === "unread") setNotifications([]);
        else setNotifications((rows) => rows.map((row) => ({ ...row, isRead: true })));
        fetchUnreadNotificationCount();
        flash(t("allNotificationsMarkedRead"));
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      try {
        const res = await notificationApi.markAsRead(notification._id);
        if (res?.status) {
          setNotifications((rows) => activeTab === "unread"
            ? rows.filter((row) => row._id !== notification._id)
            : rows.map((row) => row._id === notification._id ? { ...row, isRead: true } : row));
          setTotalUnread((count) => Math.max(0, count - 1));
          fetchUnreadNotificationCount();
        }
      } catch {
        // Opening the target should not be blocked by a read-state failure.
      }
    }
    const destination = destinationFor(notification);
    if (destination) router.push(destination);
    else setDeadLink(true);
  };

  const formatTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const diffMs = Math.max(0, Date.now() - date.getTime());
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return t("onNow");
    if (minutes < 60) return t("onMinutesAgo", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("onHoursAgo", { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return t("onDaysAgo", { count: days });
    return date.toLocaleDateString(language === "mn" ? "mn-MN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const setTab = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className="on-page">
      <div className="on-head">
        <p>
          {loading
            ? t("loading")
            : failed
              ? t("onLoadFailedSummary")
              : totalUnread
                ? t("onUnreadCount", { count: totalUnread })
                : t("onAllRead")}
        </p>
        <button
          type="button"
          className="on-mark"
          disabled={!totalUnread || loading || failed || markingAll}
          onClick={handleMarkAllRead}
        >
          {markingAll ? t("opSaving") : t("markAllRead")}
        </button>
      </div>

      <div className="on-chips">
        <button type="button" className="on-chip" aria-selected={activeTab === "all"} onClick={() => setTab("all")}>
          {t("all")}
        </button>
        <button type="button" className="on-chip" aria-selected={activeTab === "unread"} onClick={() => setTab("unread")}>
          {t("onUnread")}
        </button>
      </div>

      {loading ? (
        <div className="on-skels">
          <div className="on-skel" />
          <div className="on-skel" />
          <div className="on-skel" />
        </div>
      ) : failed ? (
        <div className="on-state">
          <b>{t("failedToLoadNotifications")}</b>
          <p>{t("obLoadFailBody")}</p>
          <button type="button" className="on-go" onClick={() => setRetry((value) => value + 1)}>{t("obRetry")}</button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="on-state">
          <b>{activeTab === "unread" ? t("onNoUnread") : t("noNotifications")}</b>
          <p>{activeTab === "unread" ? t("onChangeFilter") : t("onEmptyBody")}</p>
        </div>
      ) : (
        <>
          <div className="on-list">
            {notifications.map((notification) => (
              <button
                key={notification._id}
                type="button"
                className="on-row"
                data-unread={!notification.isRead ? "1" : "0"}
                onClick={() => openNotification(notification)}
              >
                <span className={`on-rowI ${toneFor(notification)}`}>
                  <NotificationIcon type={notification.type} title={notification.title} />
                </span>
                <span className="on-copy">
                  <b>
                    <span>{notification.title}</span>
                    <span className="on-time">{formatTime(notification.createdAt)}</span>
                  </b>
                  <i>{notification.message}</i>
                </span>
                {!notification.isRead && <span className="on-dot" aria-label={t("onUnread")} />}
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="on-pager">
              <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                ← {t("previous")}
              </button>
              <span>{t("pageOf", { current: currentPage, total: totalPages })}</span>
              <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                {t("next")} →
              </button>
            </div>
          )}
        </>
      )}

      {deadLink && (
        <div className="on-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeadLink(false); }}>
          <div className="on-sheet" role="dialog" aria-modal="true">
            <b>{t("onTargetMissing")}</b>
            <p>{t("onTargetMissingBody")}</p>
            <button type="button" className="on-go" onClick={() => setDeadLink(false)}>{t("onBackToList")}</button>
          </div>
        </div>
      )}

      {toastText && <div className="on-toast" role="status">{toastText}</div>}
    </div>
  );
}
