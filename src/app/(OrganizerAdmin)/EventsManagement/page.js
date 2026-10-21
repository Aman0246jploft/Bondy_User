"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useEventContext } from "@/context/EventContext";
import eventApi from "@/api/eventApi";
import promotionsApi from "@/api/promotionsApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import GlobalLoader from "@/components/GlobalLoader";
import PromotionPlanModal from "@/components/Promotion/PromotionPlanModal";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatMoney(amount) {
  const num = Number(amount) || 0;
  return `₮${num.toLocaleString("en-US")}`;
}

const MONTH_KEYS = ["monthJan", "monthFeb", "monthMar", "monthApr", "monthMay", "monthJun", "monthJul", "monthAug", "monthSep", "monthOct", "monthNov", "monthDec"];
const WEEKDAY_KEYS = ["weekdaySun", "weekdayMon", "weekdayTue", "weekdayWed", "weekdayThu", "weekdayFri", "weekdaySat"];

function formatDateBilingual(dateStr, timeStr, isMn, isDraft, updatedAtStr, t) {
  const monthLabel = (date) => `${t(MONTH_KEYS[date.getMonth()])} ${date.getDate()}`;

  if (isDraft && updatedAtStr) {
    const d = new Date(dateStr || updatedAtStr);
    const u = new Date(updatedAtStr);

    const primary = !isNaN(d.getTime())
      ? monthLabel(d)
      : (isMn ? "Товлогдоогүй" : "Not set");

    const sub = !isNaN(u.getTime())
      ? (isMn ? `Зассан: ${monthLabel(u)}` : `Edited: ${monthLabel(u)}`)
      : "";

    return { primary, sub };
  }

  if (!dateStr) return { primary: isMn ? "Тун удахгүй" : "Coming soon", sub: "" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { primary: isMn ? "Тун удахгүй" : "Coming soon", sub: "" };

  const dayName = t(WEEKDAY_KEYS[d.getDay()]);
  const primary = monthLabel(d);

  let timePart = "";
  if (timeStr) {
    timePart = ` · ${String(timeStr).slice(0, 5)}`;
  }

  return {
    primary,
    sub: `${dayName}${timePart}`,
  };
}

export function formatTitleBilingual(title, isMn) {
  if (!title || typeof title !== "string") return title;
  if (isMn) {
    return title.replace(/\s*\((?:copy)\)/gi, " (хуулбар)");
  }
  return title.replace(/\s*\((?:хуулбар)\)/gi, " (Copy)");
}

export default function EventsManagementPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const isMn = language === "mn";
  const { clearEventData } = useEventContext();

  // ─── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("published"); // 'published' | 'draft' | 'past'
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Separate caches for accurate tab badge counts
  const [publishedEvents, setPublishedEvents] = useState([]);
  const [draftEvents, setDraftEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);

  // Kebab Menu State
  const [activeMenu, setActiveMenu] = useState(null); // { id, x, y, event, left, top }
  const [toastMessage, setToastMessage] = useState("");

  // Promotion Modal
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [selectedEventForPromo, setSelectedEventForPromo] = useState(null);
  const [promoPackages, setPromoPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Delete Draft Modal
  const [deleteDraftModal, setDeleteDraftModal] = useState(null); // event object
  const [deleting, setDeleting] = useState(false);
  const [delDone, setDelDone] = useState(false);
  const [delErr, setDelErr] = useState("");

  // ─── Fetch All Categories of Events ────────────────────────────────────────
  const fetchAllEvents = useCallback(async () => {
    try {
      setLoading(true);

      const [pubRes, draftRes, pastRes] = await Promise.allSettled([
        // Published (Upcoming & Live)
        eventApi.getOrganizerEvents({ isDraft: "false", status: "Upcoming,Live", limit: 50 }),
        // Drafts
        eventApi.getOrganizerEvents({ isDraft: "true", limit: 50 }),
        // Past & Cancelled
        eventApi.getOrganizerEvents({ isDraft: "false", status: "Past,Cancelled", limit: 50 }),
      ]);

      if (pubRes.status === "fulfilled" && pubRes.value?.data) {
        const evs = pubRes.value.data.events || pubRes.value.data || [];
        setPublishedEvents(Array.isArray(evs) ? evs : []);
      }

      if (draftRes.status === "fulfilled" && draftRes.value?.data) {
        const evs = draftRes.value.data.events || draftRes.value.data || [];
        setDraftEvents(Array.isArray(evs) ? evs : []);
      }

      if (pastRes.status === "fulfilled" && pastRes.value?.data) {
        const evs = pastRes.value.data.events || pastRes.value.data || [];
        setPastEvents(Array.isArray(evs) ? evs : []);
      }
    } catch (err) {
      console.error("Failed to load events list:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllEvents();
    document.title = isMn ? "Эвентүүд - Bondy" : "Events - Bondy";
  }, [fetchAllEvents, isMn]);

  // Flash Toast Notification
  const flashToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 2400);
  };

  // Close floating menu on document click
  useEffect(() => {
    const handleDocClick = (e) => {
      if (!e.target.closest("[data-rowmenu]") && !e.target.closest(".oe-menu")) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  // ─── Filtered Events by Search & Tab ───────────────────────────────────────
  const currentList = useMemo(() => {
    let base = [];
    if (activeTab === "published") base = publishedEvents;
    else if (activeTab === "draft") base = draftEvents;
    else if (activeTab === "past") base = pastEvents;

    if (!searchQuery.trim()) return base;

    const q = searchQuery.toLowerCase().trim();
    return base.filter((ev) => {
      const title = (ev.eventTitle || "").toLowerCase();
      const venue = (ev.venueName || "").toLowerCase();
      const category = (ev.eventCategory?.name || "").toLowerCase();
      return title.includes(q) || venue.includes(q) || category.includes(q);
    });
  }, [activeTab, publishedEvents, draftEvents, pastEvents, searchQuery]);

  // ─── Menu Action Handlers ──────────────────────────────────────────────────
  const handleOpenMenu = (e, event) => {
    e.stopPropagation();
    if (activeMenu?.id === event._id) {
      setActiveMenu(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const W = 196;
    const H = 196;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = Math.max(12, Math.min(rect.right - W, windowWidth - W - 12));
    let top = (rect.bottom + 8 + H > windowHeight) ? Math.max(12, rect.top - H - 8) : rect.bottom + 8;

    setActiveMenu({
      id: event._id,
      event,
      left: Math.round(left),
      top: Math.round(top),
    });
  };

  const handleRowClick = (ev) => {
    if (ev.isDraft || activeTab === "draft") {
      router.push(`/BasicInfo?eventId=${ev._id}`);
    } else {
      router.push(`/EventDetailOrganiser?eventId=${ev._id}`);
    }
  };

  // Share Link Action
  const handleShareLink = (event) => {
    setActiveMenu(null);
    const url = `${window.location.origin}/eventDetails?id=${event._id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => { });
    }
    flashToast(isMn ? "Нийтийн хуудасны линк хуулагдлаа" : "Public link copied to clipboard");
  };

  // Duplicate / Copy Action
  const handleDuplicateEvent = async (event) => {
    setActiveMenu(null);
    const baseTitle = (event.eventTitle || "").replace(/\s*\((?:хуулбар|copy)\)/gi, "").trim();
    const fallbackTitle = isMn ? "Эвент" : "Event";
    const cloneTitle = isMn
      ? `${baseTitle || fallbackTitle} (хуулбар)`
      : `${baseTitle || fallbackTitle} (Copy)`;
    try {
      const payload = {
        eventTitle: cloneTitle,
        shortdesc: event.shortdesc || event.description || "",
        longdesc: event.longdesc || event.description || "",
        eventCategory: event.eventCategory?._id || event.eventCategory,
        startDate: event.startDate,
        startTime: event.startTime,
        endDate: event.endDate,
        endTime: event.endTime,
        venueName: event.venueName,
        address: event.address,
        latitude: event.latitude,
        longitude: event.longitude,
        posterImage: event.posterImage || [],
        tickets: event.tickets,
        isDraft: true,
      };

      const res = await eventApi.createEvent(payload);
      if (res?.data?.data || res?.data?.event) {
        const created = res.data.data || res.data.event;
        setDraftEvents((prev) => [created, ...prev]);
      } else {
        setDraftEvents((prev) => [
          {
            ...event,
            _id: `copy-${Date.now()}`,
            eventTitle: cloneTitle,
            isDraft: true,
            totalBooked: 0,
            totalRevenue: 0,
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.warn("Optimistic duplicate:", err);
      setDraftEvents((prev) => [
        {
          ...event,
          _id: `copy-${Date.now()}`,
          eventTitle: cloneTitle,
          isDraft: true,
          totalBooked: 0,
          totalRevenue: 0,
        },
        ...prev,
      ]);
    }
    setActiveTab("draft");
    flashToast(isMn ? "Ноорог хуулбар үүслээ" : "Draft copy created");
  };

  // Delete Draft Action
  const handleDeleteDraft = async () => {
    if (!deleteDraftModal) return;
    setDeleting(true);
    setDelErr("");

    try {
      await eventApi.deleteDraftEvent(deleteDraftModal._id);
      setDraftEvents((prev) => prev.filter((e) => e._id !== deleteDraftModal._id));
      setDelDone(true);
    } catch (err) {
      console.error("Failed to delete draft:", err);
      // If error, check if network error or fallback
      const msg = err.response?.data?.message || (isMn ? "Устгаж чадсангүй. Сүлжээгээ шалгаад дахин оролдоно уу." : "Failed to delete. Please try again.");
      setDelErr(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Open Promotion Modal
  const openPromoModal = (event) => {
    setActiveMenu(null);
    setSelectedEventForPromo(event);
    setShowPromoModal(true);
  };

  return (
    <main
      data-screen-label="Эвентийн удирдлага"
      style={{
        flex: 1,
        padding: "clamp(20px, 2.4vw, 30px) clamp(18px, 2.4vw, 32px) clamp(48px, 4vw, 64px)",
      }}
    >
      {/* ─── Mobile Top Header ────────────────────────────────────────────── */}
      <div className="oe-mobbar">
        <button
          type="button"
          className="oe-mobback"
          onClick={() => router.push("/Dashboard")}
          aria-label={isMn ? "Буцах" : "Back"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="oe-mobbarT">
          {isMn ? "Миний эвентүүд" : "My Events"}
        </span>
      </div>

      {/* ─── Tabs List ────────────────────────────────────────────────────── */}
      <div className="og-tabs bd-scroll" role="tablist" style={{ marginBottom: "10px" }}>
        <button
          type="button"
          className="og-tab"
          role="tab"
          data-tab="published"
          aria-selected={activeTab === "published"}
          onClick={() => setActiveTab("published")}
        >
          {isMn ? "Нийтлэгдсэн" : "Published"}
          <span className="og-tab-n" data-tab-n="published">
            {publishedEvents.length}
          </span>
        </button>

        <button
          type="button"
          className="og-tab"
          role="tab"
          data-tab="draft"
          aria-selected={activeTab === "draft"}
          onClick={() => setActiveTab("draft")}
        >
          {isMn ? "Ноорог" : "Draft"}
          <span className="og-tab-n" data-tab-n="draft">
            {draftEvents.length}
          </span>
        </button>

        <button
          type="button"
          className="og-tab"
          role="tab"
          data-tab="past"
          aria-selected={activeTab === "past"}
          onClick={() => setActiveTab("past")}
        >
          {isMn ? "Өнгөрсөн" : "Past events"}
          <span className="og-tab-n" data-tab-n="past">
            {pastEvents.length}
          </span>
        </button>
      </div>

      {/* ─── Tools Row: Search + Create CTA ───────────────────────────────── */}
      <div
        className="og-tools"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: "1 1 240px", minWidth: 0 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flex: "1 1 240px",
              minWidth: "180px",
              maxWidth: "360px",
              height: "42px",
              padding: "0 14px",
              borderRadius: "12px",
              background: "var(--bd-ink-850)",
              border: "1px solid var(--bd-border)",
              boxSizing: "border-box",
              cursor: "text",
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--bd-gray-600)", flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              data-search
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isMn ? "Эвент хайх" : "Search events"}
              style={{
                flex: 1,
                minWidth: 0,
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--bd-white)",
                fontFamily: "var(--bd-font-ui)",
                fontSize: "14px",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--bd-gray-500)",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "15px",
                }}
              >
                ✕
              </button>
            )}
          </label>
        </div>

        {/* Create Event CTA */}
        <span data-nav="eventnew" style={{ display: "inline-flex", flexShrink: 0, cursor: "pointer" }}>
          <Link
            href="/BasicInfo"
            onClick={() => clearEventData()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              height: "40px",
              padding: "0 18px",
              borderRadius: "999px",
              background: "var(--acc)",
              color: "var(--bd-white)",
              fontFamily: "var(--bd-font-ui)",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
              cursor: "pointer",
              transition: "opacity 160ms ease",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{isMn ? "Эвент үүсгэх" : "Create event"}</span>
          </Link>
        </span>
      </div>

      {/* ─── Events Table Section ────────────────────────────────────────── */}
      <section
        style={{
          borderRadius: "22px",
          background: "var(--bd-ink-850)",
          border: "1px solid var(--bd-border)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", padding: "18px 18px 14px" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--bd-font-ui)", fontSize: "18px", fontWeight: 700, color: "var(--bd-white)" }}>
            {isMn ? "Эвентүүд" : "Events"}
          </h2>
        </div>

        <div className="og-table">
          <div className="og-table-inner og-wide">
            {/* Table Header */}
            <div
              className="og-row og-head"
              style={{
                gridTemplateColumns: "minmax(0, 2.3fr) 138px 171px 132px 80px 84px",
                padding: "10px 18px",
                borderTop: "1px solid var(--bd-border-soft)",
                borderBottom: "1px solid var(--bd-border-soft)",
                background: "var(--bd-ink-800)",
              }}
            >
              <span>{isMn ? "Эвент" : "Event"}</span>
              <span>{isMn ? "Огноо, цаг" : "Date and time"}</span>
              <span>{isMn ? "Байршил" : "Location"}</span>
              <span>{isMn ? "Зарагдсан" : "Sold"}</span>
              <span>{isMn ? "Орлого" : "Revenue"}</span>
              <span style={{ textAlign: "right", paddingRight: "8px" }}>{isMn ? "Үйлдэл" : "Action"}</span>
            </div>

            {/* Table Rows */}
            {loading ? (
              <GlobalLoader fullScreen={false} message={isMn ? "Уншиж байна..." : "Loading events..."} />
            ) : currentList.length === 0 ? (
              <p
                data-empty
                style={{
                  margin: 0,
                  padding: "26px 18px 30px",
                  textAlign: "center",
                  fontSize: "13.5px",
                  color: "var(--bd-gray-600)",
                }}
              >
                {isMn ? "Илэрц олдсонгүй" : "No results found"}
              </p>
            ) : (
              currentList.map((ev) => {
                const coverImg = ev.posterImage?.[0] ? getFullImageUrl(ev.posterImage[0]) : "/img/sidebar-logo.svg";
                const isDraftRow = Boolean(ev.isDraft || activeTab === "draft");
                const dateInfo = formatDateBilingual(ev.startDate, ev.startTime, isMn, isDraftRow, ev.updatedAt, t);
                const sold = (ev.totalBooked !== undefined && ev.totalBooked !== null)
                  ? Number(ev.totalBooked)
                  : Math.max(0, (Number(ev.totalTickets) || 0) - (Number(ev.ticketQtyAvailable) || 0));
                const total = Math.max(Number(ev.totalTickets) || 0, sold);
                const pct = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
                const revenueText = ev.totalRevenue !== undefined ? formatMoney(ev.totalRevenue) : "—";

                return (
                  <div
                    key={ev._id}
                    className="og-row"
                    data-state={activeTab}
                    data-nav="eventdetail"
                    role="link"
                    tabIndex={0}
                    onClick={() => handleRowClick(ev)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRowClick(ev);
                      }
                    }}
                    style={{
                      gridTemplateColumns: "minmax(0, 2.3fr) 138px 171px 132px 80px 84px",
                      borderBottom: "1px solid var(--bd-border-soft)",
                    }}
                  >
                    {/* 1. Title & Image */}
                    <span style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      <span
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "12px",
                          flexShrink: 0,
                          border: "1px solid var(--bd-border)",
                          background: `center/cover no-repeat url("${coverImg}")`,
                        }}
                      />
                      <span style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                        <b
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "var(--bd-white)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={formatTitleBilingual(ev.eventTitle, isMn)}
                        >
                          {formatTitleBilingual(ev.eventTitle, isMn)}
                        </b>
                        {String(ev.status || "").toLowerCase() === "cancelled" && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              height: "18px",
                              padding: "0 7px",
                              borderRadius: "999px",
                              fontSize: "10.5px",
                              fontWeight: 700,
                              background: "rgba(255, 90, 90, 0.16)",
                              color: "#ff8a8a",
                              border: "1px solid rgba(255, 90, 90, 0.3)",
                              width: "fit-content",
                            }}
                          >
                            {isMn ? "Цуцлагдсан" : "Cancelled"}
                          </span>
                        )}
                      </span>
                    </span>

                    {/* 2. Date & Time */}
                    <span style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
                      <b style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--bd-white)" }}>
                        {dateInfo.primary}
                      </b>
                      <span style={{ fontSize: "12px", color: "var(--bd-gray-600)" }}>
                        {dateInfo.sub}
                      </span>
                    </span>

                    {/* 3. Venue */}
                    <span
                      style={{
                        fontSize: "13.5px",
                        color: "var(--bd-gray-300)",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={ev.venueName || "—"}
                    >
                      {ev.venueName || "—"}
                    </span>

                    {/* 4. Sales Progress */}
                    {isDraftRow ? (
                      <span style={{ fontSize: "13.5px", color: "var(--bd-gray-700)", minWidth: 0 }}>—</span>
                    ) : (
                      <span style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
                        <b style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--bd-white)" }}>
                          {sold} / {total}
                        </b>
                        <span style={{ fontSize: "12px", color: "var(--bd-gray-600)" }}>
                          <span
                            style={{
                              display: "block",
                              width: "100%",
                              maxWidth: "118px",
                              height: "6px",
                              borderRadius: "999px",
                              background: "var(--bd-ink-700)",
                              overflow: "hidden",
                            }}
                          >
                            <span
                              style={{
                                display: "block",
                                width: `${pct}%`,
                                height: "100%",
                                borderRadius: "999px",
                                background: activeTab === "past" ? "var(--bd-gray-600)" : "var(--acc)",
                                transition: "width 260ms ease",
                              }}
                            />
                          </span>
                        </span>
                      </span>
                    )}

                    {/* 5. Revenue */}
                    {isDraftRow ? (
                      <span style={{ fontSize: "13.5px", color: "var(--bd-gray-700)", minWidth: 0 }}>—</span>
                    ) : (
                      <span
                        style={{
                          fontSize: "13px",
                          color: activeTab === "past" ? "var(--bd-gray-500)" : "var(--bd-white)",
                          minWidth: 0,
                          whiteSpace: "nowrap",
                          letterSpacing: "-.01em",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {revenueText}
                      </span>
                    )}

                    {/* 6. Actions (3-dots) */}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="oe-dots"
                        data-rowmenu
                        aria-label={isMn ? "Үйлдэл" : "Actions"}
                        onClick={(e) => handleOpenMenu(e, ev)}
                      >
                        <i />
                        <i />
                        <i />
                      </button>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ─── Floating Action Menu (.oe-menu) ─────────────────────────────── */}
      {activeMenu && (
        <div className="oe-menuScrim" onClick={() => setActiveMenu(null)}>
          <div
            className="oe-menu"
            data-menu
            style={{
              left: `${activeMenu.left}px`,
              top: `${activeMenu.top}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Edit */}
            <button
              type="button"
              className="oe-mi"
              data-mi="edit"
              onClick={() => {
                setActiveMenu(null);
                router.push(`/BasicInfo?eventId=${activeMenu.event._id}`);
              }}
            >
              {isMn ? "Засах" : "Edit"}
            </button>

            {/* View */}
            {!activeMenu.event.isDraft && (
              <button
                type="button"
                className="oe-mi"
                data-mi="view"
                onClick={() => {
                  setActiveMenu(null);
                  router.push(`/EventDetailOrganiser?eventId=${activeMenu.event._id}`);
                }}
              >
                {isMn ? "Үзэх" : "View"}
              </button>
            )}

            {/* Share */}
            {!activeMenu.event.isDraft && (
              <button
                type="button"
                className="oe-mi"
                data-mi="share"
                onClick={() => handleShareLink(activeMenu.event)}
              >
                {isMn ? "Хуваалцах" : "Share"}
              </button>
            )}

            {/* Copy / Duplicate */}
            <button
              type="button"
              className="oe-mi"
              data-mi="copy"
              onClick={() => handleDuplicateEvent(activeMenu.event)}
            >
              {isMn ? "Хуулбарлах" : "Duplicate"}
            </button>

            {/* Promote (if published/upcoming) */}
            {!activeMenu.event.isDraft && activeTab !== "past" && (
              <button
                type="button"
                className="oe-mi"
                data-mi="promote"
                onClick={() => openPromoModal(activeMenu.event)}
              >
                {isMn ? "Сурталчлах" : "Promote"}
              </button>
            )}

            {/* Delete (if draft) */}
            {activeMenu.event.isDraft && (
              <button
                type="button"
                className="oe-mi oe-del-mi"
                data-mi="del"
                style={{ color: "#FF8A8A" }}
                onClick={() => {
                  setDeleteDraftModal(activeMenu.event);
                  setDelDone(false);
                  setDelErr("");
                  setActiveMenu(null);
                }}
              >
                {isMn ? "Устгах" : "Delete"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Floating Toast Notification ─────────────────────────────────── */}
      {toastMessage && (
        <div className="oe-toast">
          {toastMessage}
        </div>
      )}

      {/* ─── Delete Draft Confirmation Modal (.oe-scrim + .oe-sheet) ─────── */}
      {deleteDraftModal && (
        <div
          className="oe-scrim"
          onClick={() => {
            if (!deleting) {
              setDeleteDraftModal(null);
              setDelDone(false);
              setDelErr("");
            }
          }}
        >
          <div className="oe-sheet" data-sheet onClick={(e) => e.stopPropagation()}>
            {delDone ? (
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "60px",
                    height: "60px",
                    borderRadius: "999px",
                    background: "rgba(35, 173, 164, 0.14)",
                    color: "var(--acc-bright)",
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>
                <b
                  style={{
                    display: "block",
                    marginTop: "14px",
                    fontFamily: "var(--bd-font-ui)",
                    fontSize: "19px",
                    fontWeight: 700,
                    color: "var(--bd-white)",
                  }}
                >
                  {isMn ? "Ноорог устгагдлаа" : "Draft Deleted"}
                </b>
                <p style={{ margin: "8px 0 0", fontSize: "14px", lineHeight: 1.55, color: "var(--bd-gray-400)" }}>
                  {isMn ? "Жагсаалтаас хасагдлаа." : "Removed from draft listings."}
                </p>
                <button
                  type="button"
                  data-del="close"
                  onClick={() => {
                    setDeleteDraftModal(null);
                    setDelDone(false);
                  }}
                  style={{
                    marginTop: "18px",
                    height: "46px",
                    padding: "0 24px",
                    border: "none",
                    borderRadius: "999px",
                    background: "var(--acc)",
                    color: "var(--bd-white)",
                    fontFamily: "var(--bd-font-ui)",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {isMn ? "Хаах" : "Close"}
                </button>
              </div>
            ) : (
              <>
                <b
                  style={{
                    display: "block",
                    fontFamily: "var(--bd-font-ui)",
                    fontSize: "19px",
                    fontWeight: 700,
                    color: "var(--bd-white)",
                  }}
                >
                  {isMn ? "Ноорогийг устгах уу?" : "Delete draft?"}
                </b>
                <p style={{ margin: "9px 0 0", fontSize: "14px", lineHeight: 1.6, color: "var(--bd-gray-400)" }}>
                  {formatTitleBilingual(deleteDraftModal.eventTitle, isMn) || (isMn ? "Энэ ноорог" : "This draft")} —{" "}
                  {isMn
                    ? "бөглөсөн мэдээлэл бүрмөсөн устана. Үйлдлийг буцаах боломжгүй."
                    : "all filled details will be permanently lost. This action cannot be undone."}
                </p>
                {delErr && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "12px 14px",
                      border: "1px solid rgba(255, 90, 90, 0.55)",
                      borderRadius: "13px",
                      background: "rgba(255, 90, 90, 0.1)",
                      fontSize: "13px",
                      lineHeight: 1.45,
                      color: "#FFC9C9",
                    }}
                  >
                    {delErr}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "9px", flexWrap: "wrap", marginTop: "20px" }}>
                  <button
                    type="button"
                    data-del="yes"
                    disabled={deleting}
                    onClick={handleDeleteDraft}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "9px",
                      height: "46px",
                      padding: "0 24px",
                      border: "none",
                      borderRadius: "999px",
                      background: "#FF5A5A",
                      color: "#fff",
                      fontFamily: "var(--bd-font-ui)",
                      fontSize: "15px",
                      fontWeight: 700,
                      cursor: deleting ? "not-allowed" : "pointer",
                      opacity: deleting ? 0.6 : 1,
                    }}
                  >
                    {deleting && <span className="oe-sp" />}
                    {isMn ? "Устгах" : "Delete"}
                  </button>
                  <button
                    type="button"
                    data-del="close"
                    onClick={() => {
                      setDeleteDraftModal(null);
                      setDelErr("");
                    }}
                    style={{
                      height: "46px",
                      padding: "0 20px",
                      border: "1px solid var(--bd-border-strong)",
                      borderRadius: "999px",
                      background: "transparent",
                      color: "var(--bd-white)",
                      fontFamily: "var(--bd-font-ui)",
                      fontSize: "14.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {isMn ? "Болих" : "Cancel"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── Promotion Plan Modal ────────────────────────────────────── */}
      {showPromoModal && selectedEventForPromo && (
        <PromotionPlanModal
          open={showPromoModal}
          kind="event"
          listingId={selectedEventForPromo._id}
          title={formatTitleBilingual(selectedEventForPromo.eventTitle || selectedEventForPromo.title, isMn)}
          viewHref={`/eventDetails?id=${selectedEventForPromo._id}`}
          running={Boolean(
            selectedEventForPromo.isFeatured &&
            selectedEventForPromo.featuredExpiry &&
            new Date(selectedEventForPromo.featuredExpiry) > new Date()
          )}
          ineligible={
            Boolean(selectedEventForPromo.status && String(selectedEventForPromo.status).toLowerCase() === "cancelled") ||
            Boolean(selectedEventForPromo.status && String(selectedEventForPromo.status).toLowerCase() === "past") ||
            Boolean(selectedEventForPromo.endDate && new Date(selectedEventForPromo.endDate) < new Date(new Date().setHours(0, 0, 0, 0)))
          }
          onClose={() => {
            setShowPromoModal(false);
            setSelectedEventForPromo(null);
          }}
          onPurchased={fetchAllEvents}
        />
      )}
    </main>
  );
}
