"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useEventContext } from "@/context/EventContext";
import eventApi from "@/api/eventApi";
import promotionsApi from "@/api/promotionsApi";
import { getFullImageUrl } from "@/utils/imageHelper";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatMoney(amount) {
  const num = Number(amount) || 0;
  return `₮${num.toLocaleString("en-US")}`;
}

function formatDateBilingual(dateStr, timeStr, isMn, isDraft, updatedAtStr) {
  const mnMonths = ["1-р", "2-р", "3-р", "4-р", "5-р", "6-р", "7-р", "8-р", "9-р", "10-р", "11-р", "12-р"];
  const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mnDays = ["Ням", "Дав", "Мяг", "Лха", "Пүр", "Баа", "Бям"];
  const enDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (isDraft && updatedAtStr) {
    const d = new Date(dateStr || updatedAtStr);
    const u = new Date(updatedAtStr);

    const primary = !isNaN(d.getTime())
      ? (isMn ? `${mnMonths[d.getMonth()]} сарын ${d.getDate()}` : `${enMonths[d.getMonth()]} ${d.getDate()}`)
      : (isMn ? "Товлогдоогүй" : "Not set");

    const sub = !isNaN(u.getTime())
      ? (isMn ? `Зассан: ${mnMonths[u.getMonth()]} сарын ${u.getDate()}` : `Edited: ${enMonths[u.getMonth()]} ${u.getDate()}`)
      : "";

    return { primary, sub };
  }

  if (!dateStr) return { primary: isMn ? "Тун удахгүй" : "Coming soon", sub: "" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { primary: isMn ? "Тун удахгүй" : "Coming soon", sub: "" };

  const m = d.getMonth();
  const dayNum = d.getDate();
  const dayName = isMn ? mnDays[d.getDay()] : enDays[d.getDay()];
  const primary = isMn ? `${mnMonths[m]} сарын ${dayNum}` : `${enMonths[m]} ${dayNum}`;

  let timePart = "";
  if (timeStr) {
    timePart = ` · ${String(timeStr).slice(0, 5)}`;
  }

  return {
    primary,
    sub: `${dayName}${timePart}`,
  };
}

export default function EventsManagementPage() {
  const router = useRouter();
  const { language } = useLanguage();
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
        // Past
        eventApi.getOrganizerEvents({ isDraft: "false", status: "Past", limit: 50 }),
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
      router.push(`/eventbooking?id=${ev._id}`);
    }
  };

  // Share Link Action
  const handleShareLink = (event) => {
    setActiveMenu(null);
    const url = `${window.location.origin}/eventbooking?id=${event._id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => { });
    }
    flashToast(isMn ? "Нийтийн хуудасны линк хуулагдлаа" : "Public link copied to clipboard");
  };

  // Duplicate / Copy Action
  const handleDuplicateEvent = async (event) => {
    setActiveMenu(null);
    const cloneTitle = `${event.eventTitle || "Эвент"} (хуулбар)`;
    try {
      const payload = {
        eventTitle: cloneTitle,
        description: event.description || "",
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
  const openPromoModal = async (event) => {
    setActiveMenu(null);
    setSelectedEventForPromo(event);
    setShowPromoModal(true);
    setSelectedPackage(null);

    try {
      setLoadingPackages(true);
      const res = await promotionsApi.getEventPackages();
      if (res?.data?.data) {
        setPromoPackages(res.data.data);
      } else if (Array.isArray(res?.data)) {
        setPromoPackages(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch promo packages:", err);
    } finally {
      setLoadingPackages(false);
    }
  };

  // Checkout Promotion
  const handleCheckoutPromo = async () => {
    if (!selectedPackage || !selectedEventForPromo) return;
    try {
      setCheckingOut(true);
      const res = await promotionsApi.checkoutEventPromotion({
        eventId: selectedEventForPromo._id,
        packageId: selectedPackage._id,
      });

      if (res?.data?.invoiceUrl || res?.data?.paymentUrl) {
        window.location.href = res.data.invoiceUrl || res.data.paymentUrl;
      } else {
        flashToast(isMn ? "Сурталчилгаа амжилттай захиалагдлаа!" : "Promotion activated successfully!");
        setShowPromoModal(false);
      }
    } catch (err) {
      console.error("Failed to checkout promotion:", err);
      flashToast(isMn ? "Алдаа гарлаа. Дахин оролдоно уу." : "Checkout failed. Please try again.");
    } finally {
      setCheckingOut(false);
    }
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
      <div className="og-tabs bd-scroll" role="tablist">
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
          {isMn ? "Өнгөрсөн" : "Past"}
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
            <span>{isMn ? "Эвент үүсгэх" : "Create Event"}</span>
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
          <span style={{ fontSize: "13px", color: "var(--bd-gray-500)" }} data-count>
            {currentList.length} {isMn ? "эвент" : "events"}
          </span>
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
              <span>{isMn ? "Огноо, цаг" : "Date, Time"}</span>
              <span>{isMn ? "Байршил" : "Venue"}</span>
              <span>{isMn ? "Зарагдсан" : "Sold"}</span>
              <span>{isMn ? "Орлого" : "Revenue"}</span>
              <span />
            </div>

            {/* Table Rows */}
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--bd-gray-500)" }}>
                {isMn ? "Уншиж байна..." : "Loading events..."}
              </div>
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
                const dateInfo = formatDateBilingual(ev.startDate, ev.startTime, isMn, isDraftRow, ev.updatedAt);
                const sold = (ev.totalBooked !== undefined && ev.totalBooked !== null)
                  ? Number(ev.totalBooked)
                  : Math.max(0, (Number(ev.totalTickets) || 0) - (Number(ev.ticketQtyAvailable) || 0));
                const total = Number(ev.totalTickets) || (sold > 0 ? sold : 0);
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
                          title={ev.eventTitle}
                        >
                          {ev.eventTitle}
                        </b>
                        {ev.eventCategory?.name && (
                          <span style={{ fontSize: "11.5px", color: "var(--bd-gray-500)", textTransform: "capitalize" }}>
                            {ev.eventCategory.name}
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
                  router.push(`/eventbooking?id=${activeMenu.event._id}`);
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
                  {deleteDraftModal.eventTitle || (isMn ? "Энэ ноорог" : "This draft")} —{" "}
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

      {/* ─── Promotion Packages Modal ────────────────────────────────────── */}
      {showPromoModal && (
        <div className="oe-scrim" onClick={() => setShowPromoModal(false)}>
          <div
            className="oe-sheet"
            style={{ maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <b style={{ fontSize: "18px", fontWeight: 700, color: "var(--bd-white)", fontFamily: "var(--bd-font-ui)" }}>
                ⭐ {isMn ? "Сурталчилгаа идэвхжүүлэх" : "Promote Event"}
              </b>
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "999px",
                  border: "1px solid var(--bd-border)",
                  background: "transparent",
                  color: "var(--bd-gray-400)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "0 0 16px", fontSize: "13.5px", color: "var(--bd-gray-400)", lineHeight: 1.5 }}>
              {isMn
                ? "Нүүр хуудас болон Explore хэсэгт илүү олон хүнд харуулах багцаа сонгоно уу."
                : "Select a plan to boost visibility on the Discover feed and Homepage."}
            </p>

            {loadingPackages ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--bd-gray-500)" }}>
                {isMn ? "Уншиж байна..." : "Loading packages..."}
              </div>
            ) : promoPackages.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--bd-gray-500)" }}>
                {isMn ? "Идэвхтэй багц байхгүй байна." : "No promotion packages available."}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                {promoPackages.map((pkg) => {
                  const isSelected = selectedPackage?._id === pkg._id;
                  return (
                    <div
                      key={pkg._id}
                      onClick={() => setSelectedPackage(pkg)}
                      style={{
                        background: isSelected ? "rgba(35, 173, 164, 0.12)" : "var(--bd-ink-800)",
                        border: `1.5px solid ${isSelected ? "var(--acc)" : "var(--bd-border)"}`,
                        borderRadius: "16px",
                        padding: "16px",
                        cursor: "pointer",
                        transition: "all 180ms ease",
                      }}
                    >
                      <b style={{ color: "var(--bd-white)", fontSize: "14px", display: "block", marginBottom: "6px" }}>
                        {pkg.name}
                      </b>
                      <h4 style={{ color: "var(--acc-bright)", margin: "0 0 6px", fontSize: "17px", fontWeight: 700 }}>
                        ₮{pkg.price?.toLocaleString()}
                      </h4>
                      <span style={{ fontSize: "12px", color: "var(--bd-gray-500)", display: "block" }}>
                        {pkg.durationInDays} {isMn ? "хоног" : "days"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                style={{
                  height: "44px",
                  padding: "0 20px",
                  border: "1px solid var(--bd-border-strong)",
                  borderRadius: "999px",
                  background: "transparent",
                  color: "var(--bd-white)",
                  fontFamily: "var(--bd-font-ui)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {isMn ? "Болих" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={!selectedPackage || checkingOut}
                onClick={handleCheckoutPromo}
                style={{
                  height: "44px",
                  padding: "0 24px",
                  border: "none",
                  borderRadius: "999px",
                  background: "var(--acc)",
                  color: "var(--bd-white)",
                  fontFamily: "var(--bd-font-ui)",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: selectedPackage ? "pointer" : "not-allowed",
                  opacity: selectedPackage ? 1 : 0.5,
                }}
              >
                {checkingOut ? (isMn ? "Төлж байна..." : "Processing...") : (isMn ? "Баталгаажуулах" : "Confirm & Pay")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
