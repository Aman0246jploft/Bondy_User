"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import organizerApi from "../../../api/organizerApi";
import eventApi from "../../../api/eventApi";
import courseApi from "../../../api/courseApi";
import authApi from "../../../api/authApi";
import DateRangeCalendarPopover from "@/components/DateRangeCalendarPopover";
import { getFullImageUrl } from "../../../utils/imageHelper";
import GlobalLoader from "@/components/GlobalLoader";
import PromotionPlanModal from "@/components/Promotion/PromotionPlanModal";

// ─── Number & Date Formatters ──────────────────────────────────────────────────
function formatMoney(amount, isMn = false) {
  const num = Math.round(Number(amount) || 0);
  return `₮${num.toLocaleString("en-US")}`;
}

const MONTH_KEYS = ["monthJan", "monthFeb", "monthMar", "monthApr", "monthMay", "monthJun", "monthJul", "monthAug", "monthSep", "monthOct", "monthNov", "monthDec"];

function formatDateBilingual(dateStr, timeStr, isMn, t) {
  if (!dateStr) return isMn ? "Тун удахгүй" : "Coming soon";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return isMn ? "Тун удахгүй" : "Coming soon";

  const monthText = `${t(MONTH_KEYS[d.getMonth()])} ${d.getDate()}`;
  const timeText = timeStr ? ` · ${String(timeStr).slice(0, 5)}` : "";
  return `${monthText}${timeText}`;
}

function formatExactDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const pad = (n) => (n < 10 ? `0${n}` : String(n));
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  return `${month}.${day}.${year} · ${hours}:${mins}`;
}

// ─── Monotone Cubic Spline (Fritsch-Carlson algorithm from prototype) ─────────
function monotone(pts) {
  const n = pts.length;
  if (n < 2) return n ? "M" + pts[0][0] + " " + pts[0][1] : "";
  const dx = [], dy = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    dy.push(pts[i + 1][1] - pts[i][1]);
  }
  const s = dx.map((d, i) => (d ? dy[i] / d : 0));
  const m = new Array(n);
  m[0] = s[0];
  for (let i = 1; i < n - 1; i++) {
    m[i] = s[i - 1] * s[i] <= 0 ? 0 : (s[i - 1] + s[i]) / 2;
  }
  m[n - 1] = s[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (!s[i]) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / s[i];
    const b = m[i + 1] / s[i];
    const h = Math.hypot(a, b);
    if (h > 3) {
      m[i] = ((3 * a) / h) * s[i];
      m[i + 1] = ((3 * b) / h) * s[i];
    }
  }
  const r = (x) => Math.round(x * 10) / 10;
  let d = "M" + pts[0][0] + " " + pts[0][1];
  for (let i = 0; i < n - 1; i++) {
    const t = dx[i] / 3;
    d += " C" + r(pts[i][0] + t) + " " + r(pts[i][1] + m[i] * t)
      + " " + r(pts[i + 1][0] - t) + " " + r(pts[i + 1][1] - m[i + 1] * t)
      + " " + pts[i + 1][0] + " " + pts[i + 1][1];
  }
  return d;
}

function revPaths(v) {
  const W = 640, H = 168, TOP = 14, BOT = 156;
  const safeV = Array.isArray(v) && v.length > 0 ? v : [0, 0];
  const max = Math.max.apply(null, safeV);
  const min = Math.min.apply(null, safeV);
  const span = max - min;
  const pts = safeV.map((n, i) => {
    const x = safeV.length > 1 ? (i / (safeV.length - 1)) * W : W / 2;
    const y = span === 0 ? BOT : BOT - ((n - min) / span) * (BOT - TOP);
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  });
  const line = monotone(pts);
  return { pts, line, area: line + " L" + W + " " + H + " L0 " + H + " Z" };
}

const MN_WEEKDAYS = {
  MON: "Да",
  TUE: "Мя",
  WED: "Лха",
  THU: "Пү",
  FRI: "Ба",
  SAT: "Бя",
  SUN: "Ня",
};

const MN_MONTHS = {
  JAN: "1-р",
  FEB: "2-р",
  MAR: "3-р",
  APR: "4-р",
  MAY: "5-р",
  JUN: "6-р",
  JUL: "7-р",
  AUG: "8-р",
  SEP: "9-р",
  OCT: "10-р",
  NOV: "11-р",
  DEC: "12-р",
};

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const isMn = language === "mn";

  // ─── State ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [dashStats, setDashStats] = useState({
    totalDraftEvents: 0,
    totalPendingEvents: 0,
    totalLiveEvents: 0,
    totalCompletedEvents: 0,
    totalTicketsSold: 0,
    netRevenue: 0,
    totalAttendees: 0,
    courseStats: null,
    recentTransactions: [],
  });
  const [analytics, setAnalytics] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  // Range for revenue chart
  const [range, setRange] = useState("month"); // 'month' | 'week' | 'prev' | 'm6' | 'y1' | 'custom'
  const [rangeMenuOpen, setRangeMenuOpen] = useState(false);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(false);

  // Custom Calendar date range picker state
  const rangeButtonRef = useRef(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [customDates, setCustomDates] = useState({
    startDate: null,
    endDate: null,
    label: isMn ? "Огноо сонгох" : "Choose date",
  });

  // Dropdowns & Sheets
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [activeKebab, setActiveKebab] = useState(null); // 'e-ID' or 'c-ID'
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [selectedPromoteItem, setSelectedPromoteItem] = useState(null);
  const [promoTarget, setPromoTarget] = useState(null);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState(null);

  // Chart hover interaction
  const [hoverIndex, setHoverIndex] = useState(null);

  // ─── Fetch Revenue Analytics From Backend ───────────────────────────────────
  const fetchRevenueAnalytics = useCallback(async (selectedRange, customParams = null) => {
    try {
      setRevenueLoading(true);
      let queryParam = "1m";
      if (selectedRange === "week") queryParam = "7d";
      else if (selectedRange === "month") queryParam = "1m";
      else if (selectedRange === "prev") queryParam = "lastMonth";
      else if (selectedRange === "m6") queryParam = "6m";
      else if (selectedRange === "y1") queryParam = "1y";
      else if (selectedRange === "custom") {
        queryParam = {
          filter: "custom",
          startDate: customParams?.startDate || customDates.startDate,
          endDate: customParams?.endDate || customDates.endDate,
        };
      }

      const res = await organizerApi.getRevenueAnalytics(queryParam);
      if (res?.status && res?.data) {
        setRevenueAnalytics(res.data);
      }
    } catch (err) {
      console.error("Error fetching revenue analytics from backend:", err);
    } finally {
      setRevenueLoading(false);
    }
  }, [customDates]);

  // ─── Fetch All Dashboard Data ──────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);

      const [profRes, dashRes, analRes, earnRes, evRes, crRes] = await Promise.allSettled([
        authApi.getSelfProfile(),
        organizerApi.getDashboardData(),
        organizerApi.getAnalyticsStats(),
        organizerApi.getEarnings(),
        eventApi.getOrganizerEvents({ limit: 6 }),
        courseApi.getOrganizerCourses({ limit: 6 }),
      ]);

      // Profile
      if (profRes.status === "fulfilled" && profRes.value?.status && profRes.value?.data?.user) {
        setProfile(profRes.value.data.user);
      } else {
        try {
          const cached = localStorage.getItem("userProfile");
          if (cached) setProfile(JSON.parse(cached));
        } catch (e) { }
      }

      // Dashboard stats
      let freshDashData = null;
      if (dashRes.status === "fulfilled" && dashRes.value?.status && dashRes.value?.data) {
        freshDashData = dashRes.value.data;
        setDashStats(freshDashData);
      }

      // Analytics stats
      if (analRes.status === "fulfilled" && analRes.value?.status && analRes.value?.data) {
        setAnalytics(analRes.value.data);
      }

      // Earnings data
      let freshEarnData = null;
      if (earnRes.status === "fulfilled" && earnRes.value?.status && earnRes.value?.data) {
        freshEarnData = earnRes.value.data;
        setEarnings(freshEarnData);
      }

      // ─── Map Recent Bookings (Prioritize Real Transactions, Exclude Payouts) ─
      const orders = [];

      // 1. First priority: Real Transaction records from dashStats.recentTransactions
      if (freshDashData?.recentTransactions && Array.isArray(freshDashData.recentTransactions)) {
        freshDashData.recentTransactions.forEach((tx, idx) => {
          const rawItem = tx.itemName || (isMn ? "Тасалбар" : "Event Booking");
          const cleanItem = String(rawItem).replace(/^(Ticket Sale:|Course Sale:)\s*/i, "");
          const ticketQty = tx.qty ? `${tx.qty} ${isMn ? "тасалбар" : "tickets"}` : `1 ${isMn ? "тасалбар" : "ticket"}`;

          orders.push({
            id: tx._id || `tx-${idx}`,
            ref: tx.bookingId || `BND-${(tx._id || "").slice(-6).toUpperCase() || 2000 + idx}`,
            name: tx.customerName && tx.customerName.trim() ? tx.customerName : (isMn ? "Хэрэглэгч" : "Customer"),
            email: tx.customerEmail || "",
            phone: tx.customerPhone || "",
            avatar: tx.customerAvatar ? getFullImageUrl(tx.customerAvatar) : "",
            item: cleanItem,
            unit: tx.unit || tx.ticketName || (isMn ? "Энгийн тасалбар" : "Standard Ticket"),
            qty: ticketQty,
            amount: formatMoney(tx.totalAmount || tx.organizerEarning, isMn),
            rawAmount: tx.totalAmount || tx.organizerEarning,
            rawDate: tx.createdAt,
            status: tx.status || "CONFIRMED",
            payStatus: "PAID",
            type: tx.bookingType === "COURSE" ? "course" : "event",
          });
        });
      }

      // 2. Second priority: If fewer than 5, pick real sales from wallet history (EXCLUDE withdrawal/payout requests)
      if (orders.length < 5 && freshEarnData?.walletHistory && Array.isArray(freshEarnData.walletHistory)) {
        const legitimateSales = freshEarnData.walletHistory.filter(
          (item) =>
            !String(item.description || "").toLowerCase().includes("payout") &&
            !String(item.type || "").toLowerCase().includes("withdrawal") &&
            !String(item.type || "").toLowerCase().includes("payout")
        );

        legitimateSales.forEach((item, idx) => {
          if (orders.length >= 5) return;
          const alreadyExists = orders.some((o) => o.id === item._id || o.ref === item.bookingId);
          if (!alreadyExists) {
            const rawItem = item.description || item.title || (isMn ? "Тасалбар" : "Ticket Purchase");
            const cleanItem = String(rawItem).replace(/^(Ticket Sale:|Course Sale:)\s*/i, "");
            const ticketQty = item.qty ? `${item.qty} ${isMn ? "тасалбар" : "tickets"}` : `1 ${isMn ? "тасалбар" : "ticket"}`;

            orders.push({
              id: item._id || item.bookingId || `ord-${idx}`,
              ref: item.bookingId || `BND-${(item._id || "").slice(-6).toUpperCase() || 1000 + idx}`,
              name: item.userName || (isMn ? "Хэрэглэгч" : "Customer"),
              email: item.userEmail || "",
              phone: item.userPhone || "",
              avatar: item.userAvatar ? getFullImageUrl(item.userAvatar) : "",
              item: cleanItem,
              unit: item.ticketType || (isMn ? "Энгийн тасалбар" : "Standard Ticket"),
              qty: ticketQty,
              amount: formatMoney(Math.abs(item.amount), isMn),
              rawAmount: item.amount,
              rawDate: item.createdAt,
              status: item.status || "CONFIRMED",
              payStatus: item.paymentStatus || "PAID",
              type: item.type || "event",
            });
          }
        });
      }

      setRecentOrders(orders.slice(0, 5));

      // Events
      if (evRes.status === "fulfilled" && evRes.value?.status && evRes.value?.data) {
        const evList = evRes.value.data.events || evRes.value.data || [];
        setEvents(Array.isArray(evList) ? evList : []);
      }

      // Courses
      if (crRes.status === "fulfilled" && crRes.value?.status && crRes.value?.data) {
        const crList = crRes.value.data.courses || crRes.value.data || [];
        setCourses(Array.isArray(crList) ? crList : []);
      }
    } catch (err) {
      console.error("Failed to load organizer dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [isMn]);

  useEffect(() => {
    fetchAllData();
    fetchRevenueAnalytics(range);
    document.title = isMn ? "Хянах самбар - Bondy Organizer" : "Dashboard - Bondy Organizer";
  }, [fetchAllData, fetchRevenueAnalytics, range, isMn]);

  // Close floating menus when clicking outside
  useEffect(() => {
    const handleClickAway = (e) => {
      if (!e.target.closest("[data-menuwrap]")) {
        setCreateMenuOpen(false);
        setRangeMenuOpen(false);
      }
      if (!e.target.closest(".og-pop") && !e.target.closest(".og-kebab")) {
        setActiveKebab(null);
      }
      if (hoverIndex !== null && !e.target.closest(".og-chart-plot")) {
        setHoverIndex(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setPromoteOpen(false);
        setSelectedBookingDetail(null);
        setCreateMenuOpen(false);
        setRangeMenuOpen(false);
        setCalendarOpen(false);
        setActiveKebab(null);
      }
    };
    document.addEventListener("click", handleClickAway);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClickAway);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [hoverIndex]);

  // ─── Dynamic Metrics Computation ───────────────────────────────────────────
  const totalNetRevenue = useMemo(() => {
    if (earnings?.totalEarnings !== undefined && earnings?.totalEarnings !== null) {
      return Number(earnings.totalEarnings);
    }
    if (dashStats.netRevenue !== undefined && dashStats.netRevenue !== null) {
      return Number(dashStats.netRevenue);
    }
    if (analytics?.performance?.totalEarnings) {
      return Number(analytics.performance.totalEarnings);
    }
    return 0;
  }, [earnings, dashStats, analytics]);

  const totalBookingsAll = useMemo(() => {
    if (analytics?.performance?.totalBookings) {
      return Number(analytics.performance.totalBookings);
    }
    if (dashStats.totalTicketsSold) {
      return Number(dashStats.totalTicketsSold);
    }
    return 0;
  }, [analytics, dashStats]);

  const activeEventsCount = useMemo(() => {
    if (dashStats.totalLiveEvents !== undefined || dashStats.totalPendingEvents !== undefined) {
      return (Number(dashStats.totalLiveEvents) || 0) + (Number(dashStats.totalPendingEvents) || 0);
    }
    return events.filter((e) => !e.isDraft && (e.status === "Live" || e.status === "Upcoming" || e.status === "published" || e.status === "live")).length;
  }, [dashStats, events]);

  const activeCoursesCount = useMemo(() => {
    if (dashStats.totalLiveCourses !== undefined && dashStats.totalLiveCourses !== null) {
      return Number(dashStats.totalLiveCourses) || 0;
    }
    return courses.filter((c) => !c.isDraft && (c.status === "Live" || c.status === "Upcoming" || c.status === "Active" || c.status === "published")).length;
  }, [dashStats, courses]);

  const totalPublishedCount = useMemo(() => {
    const hasDashEvents = dashStats.totalLiveEvents !== undefined || dashStats.totalPendingEvents !== undefined || dashStats.totalCompletedEvents !== undefined;
    const evPub = hasDashEvents
      ? (Number(dashStats.totalLiveEvents) || 0) + (Number(dashStats.totalPendingEvents) || 0) + (Number(dashStats.totalCompletedEvents) || 0)
      : events.filter((e) => !e.isDraft).length;

    const hasDashCourses = dashStats.totalCourses !== undefined;
    const crPub = hasDashCourses
      ? Math.max(0, (Number(dashStats.totalCourses) || 0) - (Number(dashStats.totalDraftCourses) || 0))
      : courses.filter((c) => !c.isDraft).length;

    return evPub + crPub;
  }, [dashStats, events, courses]);

  // ─── Range Series & Values Configuration (Connected to Backend API) ──────
  const rangeConfig = useMemo(() => {
    const labelMap = {
      week: isMn ? "Сүүлийн 7 хоног" : "Last 7 days",
      prev: isMn ? "Өнгөрсөн сар" : "Last month",
      m6: isMn ? "Сүүлийн 6 сар" : "Last 6 months",
      y1: isMn ? "Сүүлийн 1 жил" : "Last year",
      custom: customDates.label || (isMn ? "Огноо сонгох" : "Choose date"),
      month: isMn ? "Энэ сар" : "This month",
    };

    const label = labelMap[range] || (isMn ? "Энэ сар" : "This month");

    // Real total net revenue for this range
    const rawTotal = revenueAnalytics?.summary?.totalNet !== undefined && revenueAnalytics.summary.totalNet !== null
      ? Number(revenueAnalytics.summary.totalNet)
      : (range === "month" ? totalNetRevenue : 0);

    const totalText = formatMoney(rawTotal, isMn);

    // Real orders/bookings count for this range
    const kpiPeriod = revenueAnalytics?.summary?.totalOrders !== undefined && revenueAnalytics.summary.totalOrders !== null
      ? Number(revenueAnalytics.summary.totalOrders)
      : (revenueAnalytics?.summary?.totalTickets !== undefined && revenueAnalytics.summary.totalTickets !== null
        ? Number(revenueAnalytics.summary.totalTickets)
        : (range === "month" ? totalBookingsAll : 0));

    // Real amounts array from backend
    const rawAmounts = Array.isArray(revenueAnalytics?.netRevenue) && revenueAnalytics.netRevenue.length > 0
      ? revenueAnalytics.netRevenue
      : [0, 0];

    const rawLabels = Array.isArray(revenueAnalytics?.labels) && revenueAnalytics.labels.length > 0
      ? revenueAnalytics.labels
      : [];

    const formatPointDate = (rawStr) => {
      if (!rawStr) return "";
      const upper = String(rawStr).toUpperCase();
      if (MN_WEEKDAYS[upper]) {
        return isMn ? MN_WEEKDAYS[upper] : rawStr;
      }
      if (MN_MONTHS[upper]) {
        return isMn ? `${MN_MONTHS[upper]} сар` : rawStr;
      }
      if (rawStr.includes(".")) {
        const parts = rawStr.split(".");
        const m = parseInt(parts[0], 10);
        const d = parseInt(parts[1], 10);
        if (!isNaN(m) && !isNaN(d)) {
          return isMn ? `${m}-р сарын ${d}` : rawStr;
        }
      }
      return rawStr;
    };

    const formatTickLabel = (rawStr) => {
      if (!rawStr) return "";
      const upper = String(rawStr).toUpperCase();
      if (MN_WEEKDAYS[upper]) {
        return isMn ? MN_WEEKDAYS[upper] : rawStr;
      }
      if (MN_MONTHS[upper]) {
        return isMn ? MN_MONTHS[upper] : rawStr;
      }
      if (rawStr.includes(".")) {
        const parts = rawStr.split(".");
        const d = parseInt(parts[1], 10);
        return !isNaN(d) ? String(d) : rawStr;
      }
      return rawStr;
    };

    const n = rawLabels.length;
    let displayLabels = [];

    if (n <= 7) {
      displayLabels = rawLabels.map(formatTickLabel);
    } else {
      const step = (n - 1) / 5;
      const tickIndices = [0, 1, 2, 3, 4, 5].map((i) => Math.min(n - 1, Math.round(i * step)));
      displayLabels = tickIndices.map((idx) => formatTickLabel(rawLabels[idx]));
    }

    if (displayLabels.length === 0) {
      if (range === "week") {
        displayLabels = isMn ? ["Да", "Мя", "Лха", "Пү", "Ба", "Бя", "Ня"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      } else if (range === "m6") {
        displayLabels = isMn ? ["1-р", "2-р", "3-р", "4-р", "5-р", "6-р"] : ["M1", "M2", "M3", "M4", "M5", "M6"];
      } else {
        displayLabels = ["1", "5", "9", "13", "17", "21", "25"];
      }
    }

    const dateFormatter = (i) => {
      if (rawLabels[i]) {
        return formatPointDate(rawLabels[i]);
      }
      return "";
    };

    return {
      label,
      totalText,
      rawTotal,
      kpiPeriod,
      v: rawAmounts,
      rawAmounts,
      labels: displayLabels,
      dateFormatter,
    };
  }, [range, isMn, revenueAnalytics, totalNetRevenue, totalBookingsAll, customDates]);

  // Compute SVG monotone path and area
  const chartPaths = useMemo(() => {
    return revPaths(rangeConfig.v);
  }, [rangeConfig.v]);

  // Hover calculation on pointer
  const handleChartPointer = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    if (!box.width) return;
    const norm = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    const idx = Math.round(norm * (rangeConfig.v.length - 1));
    if (hoverIndex !== idx) setHoverIndex(idx);
  };

  const handleChartPointerLeave = () => {
    setHoverIndex(null);
  };

  const hN = rangeConfig.v.length;
  const hOn = hoverIndex != null && hoverIndex >= 0 && hoverIndex < hN;
  const tipPct = hOn ? (hN > 1 ? (hoverIndex / (hN - 1)) * 100 : 50) : 50;
  const tipTop = hOn && chartPaths.pts[hoverIndex] ? Math.round((chartPaths.pts[hoverIndex][1] / 168) * 1000) / 10 : 0;
  const tipShift = `translate(${tipPct < 13 ? "0%" : tipPct > 87 ? "-100%" : "-50%"}, -100%)`;
  const tipAmount = hOn && rangeConfig.rawAmounts && rangeConfig.rawAmounts[hoverIndex] !== undefined
    ? Number(rangeConfig.rawAmounts[hoverIndex]) || 0
    : 0;
  const tipDate = hOn && rangeConfig.dateFormatter ? rangeConfig.dateFormatter(hoverIndex) : "";
  const tipText = hOn
    ? `${tipDate ? `${tipDate} · ` : ""}₮${tipAmount.toLocaleString("en-US")}`
    : "";

  // ─── Promote Modal Action ──────────────────────────────────────────────────
  const openPromoteWith = (item, kind = null) => {
    if (item) {
      const resolvedKind = kind || ((item.eventType || item.eventTitle) ? "event" : "course");
      setPromoTarget({ item, kind: resolvedKind });
      setActiveKebab(null);
      return;
    }
    setSelectedPromoteItem(events[0] || courses[0] || null);
    setPromoteOpen(true);
    setActiveKebab(null);
  };

  const handlePromoteSubmit = () => {
    if (!selectedPromoteItem?._id) return;
    setPromoteOpen(false);
    const kind = (selectedPromoteItem.eventType || selectedPromoteItem.eventTitle) ? "event" : "course";
    setPromoTarget({ item: selectedPromoteItem, kind });
  };

  if (loading) {
    return <GlobalLoader fullScreen={false} />;
  }

  return (
    <div style={{ width: "100%", paddingBottom: "48px" }}>
      {/* ─── Top Toolbar (Create dropdown + Mobile buttons + Promote) ────── */}
      <div className="og-toolbar">
        {/* Desktop Create dropdown */}
        <span className="og-menuwrap" data-menuwrap data-open={createMenuOpen ? "1" : "0"}>
          <button
            type="button"
            className="og-btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              setCreateMenuOpen((prev) => !prev);
              setRangeMenuOpen(false);
              setActiveKebab(null);
            }}
            aria-haspopup="true"
            aria-expanded={createMenuOpen}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{isMn ? "Үүсгэх" : "Create"}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: createMenuOpen ? "rotate(180deg)" : "none", transition: "transform 180ms ease" }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div className="og-pop" style={{ top: "50px", right: 0 }}>
            <button
              type="button"
              onClick={() => {
                setCreateMenuOpen(false);
                router.push("/BasicInfo");
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{isMn ? "Эвент" : "Event"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCreateMenuOpen(false);
                router.push("/AddProgram");
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>{isMn ? "Сургалт" : "Course"}</span>
            </button>
          </div>
        </span>

        {/* Mobile Quick Buttons */}
        <button
          type="button"
          className="og-btn-primary og-quick"
          onClick={() => router.push("/BasicInfo")}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{isMn ? "Эвент үүсгэх" : "Create Event"}</span>
        </button>
        <button
          type="button"
          className="og-btn-primary og-quick"
          onClick={() => router.push("/AddProgram")}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{isMn ? "Сургалт үүсгэх" : "Create Course"}</span>
        </button>

        {/* Promote CTA Button */}
        <button
          type="button"
          className="og-btn-ghost og-promote"
          onClick={() => {
            if (events.length === 1 && courses.length === 0) {
              openPromoteWith(events[0], "event");
            } else if (courses.length === 1 && events.length === 0) {
              openPromoteWith(courses[0], "course");
            } else if (events.length > 0 || courses.length > 0) {
              openPromoteWith(null);
            }
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 10.4v3.2a1.6 1.6 0 0 0 1.6 1.6h1.7L14 19.4V4.6L7.3 8.8H5.6A1.6 1.6 0 0 0 4 10.4Z" />
            <path d="M17.2 8.6a4.6 4.6 0 0 1 0 6.8" />
            <path d="M7.6 15.4 8.9 20" />
          </svg>
          <span>{isMn ? "Сурталчлах" : "Promote"}</span>
        </button>
      </div>

      {/* ─── Date Range Selector Row ────────────────────────────────────── */}
      <div className="og-daterow">
        <span className="og-menuwrap" data-menuwrap data-open={rangeMenuOpen ? "1" : "0"}>
          <button
            ref={rangeButtonRef}
            type="button"
            className="og-range"
            onClick={(e) => {
              e.stopPropagation();
              setRangeMenuOpen((prev) => !prev);
              setCreateMenuOpen(false);
              setActiveKebab(null);
            }}
            aria-haspopup="true"
            aria-expanded={rangeMenuOpen}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{rangeConfig.label}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: rangeMenuOpen ? "rotate(180deg)" : "none", transition: "transform 180ms ease" }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Range Dropdown Matching Prototype Image 4 */}
          <div className="og-pop" style={{ top: "46px", right: 0 }}>
            {[
              { id: "month", label: isMn ? "Энэ сар" : "This month" },
              { id: "week", label: isMn ? "Сүүлийн 7 хоног" : "Last 7 days" },
              { id: "prev", label: isMn ? "Өнгөрсөн сар" : "Last month" },
              { id: "m6", label: isMn ? "Сүүлийн 6 сар" : "Last 6 months" },
              { id: "y1", label: isMn ? "Сүүлийн 1 жил" : "Last year" },
              { id: "custom", label: isMn ? "Огноо сонгох" : "Choose date" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                style={{
                  background: range === r.id ? "rgba(35, 173, 164, 0.12)" : "transparent",
                  color: range === r.id ? "var(--acc)" : "var(--bd-gray-300)",
                }}
                onClick={() => {
                  setRangeMenuOpen(false);
                  if (r.id === "custom") {
                    setCalendarOpen(true);
                  } else {
                    setRange(r.id);
                    fetchRevenueAnalytics(r.id);
                  }
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </span>

        {/* Existing Project Style Calendar Popover */}
        {calendarOpen && (
          <DateRangeCalendarPopover
            anchorRef={rangeButtonRef}
            initialFrom={customDates.startDate}
            initialTo={customDates.endDate}
            language={language}
            t={t || ((k) => k)}
            onApply={(isoA, isoB, label) => {
              setCustomDates({ startDate: isoA, endDate: isoB, label });
              setRange("custom");
              setCalendarOpen(false);
              fetchRevenueAnalytics("custom", { startDate: isoA, endDate: isoB });
            }}
            onCancel={() => setCalendarOpen(false)}
          />
        )}
      </div>

      {/* ─── Monotone Cubic Revenue Chart ─────────────────────────────────── */}
      <section className="og-chart">
        <div className="og-chart-head">
          <span style={{ display: "flex", flexDirection: "column", gap: "9px", minWidth: 0 }}>
            <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--bd-gray-300)" }}>
              {isMn ? "Орлого" : "Revenue"}
            </span>
            <b style={{ fontFamily: "var(--bd-font-ui)", fontSize: "31px", fontWeight: 700, letterSpacing: "-0.028em", lineHeight: 1, color: "var(--bd-white)" }}>
              {rangeConfig.totalText}
            </b>
          </span>
        </div>

        <div
          className="og-chart-plot"
          onPointerMove={handleChartPointer}
          onPointerDown={handleChartPointer}
          onPointerLeave={handleChartPointerLeave}
        >
          <svg className="og-chart-svg" viewBox="0 0 640 168" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="ogRevFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(35, 173, 164, 0.26)" />
                <stop offset="100%" stopColor="rgba(35, 173, 164, 0)" />
              </linearGradient>
            </defs>
            <line x1="0" y1="18" x2="640" y2="18" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1="84" x2="640" y2="84" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1="150" x2="640" y2="150" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {chartPaths.area && <path d={chartPaths.area} fill="url(#ogRevFill)" />}
            {chartPaths.line && (
              <path
                d={chartPaths.line}
                fill="none"
                stroke="var(--acc)"
                strokeWidth="1.75"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* Crosshair, Dot & Tooltip */}
          <span
            className="og-chart-rule"
            style={{ left: `${tipPct}%`, opacity: hOn ? 1 : 0 }}
            aria-hidden="true"
          />
          <span
            className="og-chart-dot"
            style={{ left: `${tipPct}%`, top: `${tipTop}%`, opacity: hOn ? 1 : 0 }}
            aria-hidden="true"
          />
          <span
            className="og-tip"
            style={{ left: `${tipPct}%`, top: `${tipTop}%`, transform: tipShift, opacity: hOn ? 1 : 0 }}
            aria-hidden="true"
          >
            {tipText}
          </span>
        </div>

        {/* X-axis labels */}
        <div className="og-chart-x">
          {rangeConfig.labels.map((l, idx) => (
            <span key={idx}>{l}</span>
          ))}
        </div>
      </section>

      {/* ─── 2 KPI Cards (Захиалга & Идэвхтэй нийтлэл) ────────────────────── */}
      {/* ─── 2 KPI Cards (Захиалга & Идэвхтэй нийтлэл) ────────────────────── */}
      <div
        className="og-stats"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
          marginBottom: "4px",
        }}
      >
        {/* KPI 1: Захиалга (Bookings) */}
        <button
          type="button"
          className="og-kpi"
          onClick={() => router.push("/OrganizerCustomerBookings?type=all")}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "13px",
            textAlign: "left",
            padding: "20px 22px",
            borderRadius: "20px",
            background: "linear-gradient(158deg, rgba(255, 255, 255, 0.055) 0%, rgba(255, 255, 255, 0.013) 44%, rgba(255, 255, 255, 0) 100%), var(--bd-ink-850, #161616)",
            border: "1px solid var(--bd-border, rgba(255, 255, 255, 0.08))",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 14px 30px rgba(0, 0, 0, 0.24)",
            cursor: "pointer",
            transition: "border-color var(--bd-dur, 180ms) var(--bd-ease, ease)",
            width: "100%",
            boxSizing: "border-box",
            color: "inherit",
          }}
        >
          <span
            className="og-kpiH"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "13px",
              minWidth: 0,
            }}
          >
            <span
              className="og-kpiIco"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                flexShrink: 0,
                borderRadius: "999px",
                background: "var(--bd-brand-soft, rgba(35, 173, 164, 0.14))",
                color: "var(--acc-bright, #36cec2)",
              }}
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                style={{ width: "21px", height: "21px", display: "inline-flex", color: "currentColor" }}
                aria-hidden="true"
              >
                <path
                  d="M 15.75 12.25 C 16.302 12.25 16.75 11.802 16.75 11.25 C 16.75 10.698 16.302 10.25 15.75 10.25 C 15.198 10.25 14.75 10.698 14.75 11.25 C 14.75 11.802 15.198 12.25 15.75 12.25 Z"
                  fill="currentColor"
                  fillRule="nonzero"
                  transform="matrix(1 0 0 1 1.250 1.750)"
                />
                <path
                  d="M 15.75 16.25 C 16.302 16.25 16.75 15.802 16.75 15.25 C 16.75 14.698 16.302 14.25 15.75 14.25 C 15.198 14.25 14.75 14.698 14.75 15.25 C 14.75 15.802 15.198 16.25 15.75 16.25 Z"
                  fill="currentColor"
                  fillRule="nonzero"
                  transform="matrix(1 0 0 1 1.250 1.750)"
                />
                <path
                  d="M 11.75 11.25 C 11.75 11.802 11.302 12.25 10.75 12.25 C 10.198 12.25 9.75 11.802 9.75 11.25 C 9.75 10.698 10.198 10.25 10.75 10.25 C 11.302 10.25 11.75 10.698 11.75 11.25 Z"
                  fill="currentColor"
                  fillRule="nonzero"
                  transform="matrix(1 0 0 1 1.250 1.750)"
                />
                <path
                  d="M 11.75 15.25 C 11.75 15.802 11.302 16.25 10.75 16.25 C 10.198 16.25 9.75 15.802 9.75 15.25 C 9.75 14.698 10.198 14.25 10.75 14.25 C 11.302 14.25 11.75 14.698 11.75 15.25 Z"
                  fill="currentColor"
                  fillRule="nonzero"
                  transform="matrix(1 0 0 1 1.250 1.750)"
                />
                <path
                  d="M 5.75 12.25 C 6.302 12.25 6.75 11.802 6.75 11.25 C 6.75 10.698 6.302 10.25 5.75 10.25 C 5.198 10.25 4.75 10.698 4.75 11.25 C 4.75 11.802 5.198 12.25 5.75 12.25 Z"
                  fill="currentColor"
                  fillRule="nonzero"
                  transform="matrix(1 0 0 1 1.250 1.750)"
                />
                <path
                  d="M 5.75 16.25 C 6.302 16.25 6.75 15.802 6.75 15.25 C 6.75 14.698 6.302 14.25 5.75 14.25 C 5.198 14.25 4.75 14.698 4.75 15.25 C 4.75 15.802 5.198 16.25 5.75 16.25 Z"
                  fill="currentColor"
                  fillRule="nonzero"
                  transform="matrix(1 0 0 1 1.250 1.750)"
                />
                <path
                  d="M 5.75 0 C 6.164 0 6.5 0.336 6.5 0.75 L 6.5 1.513 C 7.162 1.5 7.891 1.5 8.693 1.5 L 12.806 1.5 C 13.609 1.5 14.338 1.5 15 1.513 L 15 0.75 C 15 0.336 15.336 0 15.75 0 C 16.164 0 16.5 0.336 16.5 0.75 L 16.5 1.577 C 16.76 1.597 17.006 1.622 17.239 1.653 C 18.411 1.811 19.36 2.143 20.109 2.891 C 20.857 3.64 21.189 4.589 21.347 5.761 C 21.5 6.9 21.5 8.356 21.5 10.194 L 21.5 12.306 C 21.5 14.144 21.5 15.6 21.347 16.739 C 21.189 17.911 20.857 18.86 20.109 19.609 C 19.36 20.357 18.411 20.689 17.239 20.847 C 16.1 21 14.644 21 12.806 21 L 8.694 21 C 6.856 21 5.4 21 4.261 20.847 C 3.089 20.689 2.14 20.357 1.391 19.609 C 0.643 18.86 0.311 17.911 0.153 16.739 C 0 15.6 0 14.144 0 12.306 L 0 10.194 C 0 8.356 0 6.9 0.153 5.761 C 0.311 4.589 0.643 3.64 1.391 2.891 C 2.14 2.143 3.089 1.811 4.261 1.653 C 4.494 1.622 4.74 1.597 5 1.577 L 5 0.75 C 5 0.336 5.336 0 5.75 0 Z M 4.461 3.14 C 3.455 3.275 2.875 3.529 2.452 3.952 C 2.029 4.375 1.775 4.955 1.64 5.961 C 1.617 6.131 1.598 6.311 1.582 6.5 L 19.918 6.5 C 19.902 6.311 19.883 6.131 19.86 5.961 C 19.725 4.955 19.471 4.375 19.048 3.952 C 18.625 3.529 18.045 3.275 17.039 3.14 C 16.011 3.002 14.657 3 12.75 3 L 8.75 3 C 6.843 3 5.489 3.002 4.461 3.14 Z M 1.5 10.25 C 1.5 9.396 1.5 8.653 1.513 8 L 19.987 8 C 20 8.653 20 9.396 20 10.25 L 20 12.25 C 20 14.157 19.998 15.511 19.86 16.539 C 19.725 17.545 19.471 18.125 19.048 18.548 C 18.625 18.971 18.045 19.225 17.039 19.36 C 16.011 19.498 14.657 19.5 12.75 19.5 L 8.75 19.5 C 6.843 19.5 5.489 19.498 4.461 19.36 C 3.455 19.225 2.875 18.971 2.452 18.548 C 2.029 18.125 1.775 17.545 1.64 16.539 C 1.502 15.511 1.5 14.157 1.5 12.25 L 1.5 10.25 Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  transform="matrix(1 0 0 1 1.250 1.750)"
                />
              </svg>
            </span>
            <span
              className="og-kpiT"
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--bd-white, #FFFFFF)",
                whiteSpace: "nowrap",
              }}
            >
              {isMn ? "Захиалга" : "Booking"}
            </span>
          </span>
          <b
            className="og-kpiN"
            style={{
              margin: 0,
              fontFamily: "var(--bd-font-ui, 'Inter', sans-serif)",
              fontSize: "29px",
              fontWeight: 700,
              letterSpacing: "-0.028em",
              lineHeight: 1,
              color: "var(--bd-white, #FFFFFF)",
            }}
          >
            {rangeConfig.kpiPeriod.toLocaleString("en-US")}
          </b>
          <span
            className="og-kpiS"
            style={{
              fontSize: "12.5px",
              color: "var(--bd-gray-600, #979797)",
            }}
          >
            {rangeConfig.label} · {isMn ? "Нийт" : "Total"} {totalBookingsAll.toLocaleString("en-US")}
          </span>
        </button>

        {/* KPI 2: Идэвхтэй нийтлэл (Active Listings) */}
        <button
          type="button"
          className="og-kpi"
          onClick={() => router.push("/EventsManagement")}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "13px",
            textAlign: "left",
            padding: "20px 22px",
            borderRadius: "20px",
            background: "linear-gradient(158deg, rgba(255, 255, 255, 0.055) 0%, rgba(255, 255, 255, 0.013) 44%, rgba(255, 255, 255, 0) 100%), var(--bd-ink-850, #161616)",
            border: "1px solid var(--bd-border, rgba(255, 255, 255, 0.08))",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 14px 30px rgba(0, 0, 0, 0.24)",
            cursor: "pointer",
            transition: "border-color var(--bd-dur, 180ms) var(--bd-ease, ease)",
            width: "100%",
            boxSizing: "border-box",
            color: "inherit",
          }}
        >
          <span
            className="og-kpiH"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "13px",
              minWidth: 0,
            }}
          >
            <span
              className="og-kpiIco"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                flexShrink: 0,
                borderRadius: "999px",
                background: "var(--bd-brand-soft, rgba(35, 173, 164, 0.14))",
                color: "var(--acc-bright, #36cec2)",
              }}
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                style={{ width: "21px", height: "21px", display: "inline-flex", color: "currentColor" }}
                aria-hidden="true"
              >
                <path
                  d="M 19 0 L 1 0 C 0.448 0 0 0.447 0 1 L 0 24 L 4 21 L 7 24 L 10 21 L 13 24 L 16 21 L 20 24 L 20 1 C 20 0.447 19.552 0 19 0 Z M 11 16 L 4 16 L 4 14 L 11 14 L 11 16 Z M 11 12 L 4 12 L 4 10 L 11 10 L 11 12 Z M 11 8 L 4 8 L 4 6 L 11 6 L 11 8 Z M 16 16 L 13 16 L 13 14 L 16 14 L 16 16 Z M 16 12 L 13 12 L 13 10 L 16 10 L 16 12 Z M 16 8 L 13 8 L 13 6 L 16 6 L 16 8 Z"
                  fill="currentColor"
                  fillRule="nonzero"
                  transform="matrix(1 0 0 1 2 0)"
                />
              </svg>
            </span>
            <span
              className="og-kpiT"
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--bd-white, #FFFFFF)",
                whiteSpace: "nowrap",
              }}
            >
              <span className="og-kpi-full">{isMn ? "Идэвхтэй нийтлэл" : "Active listings"}</span>
              <span className="og-kpi-short">{isMn ? "Идэвхтэй" : "Active"}</span>
            </span>
          </span>
          <b
            className="og-kpiN"
            style={{
              margin: 0,
              fontFamily: "var(--bd-font-ui, 'Inter', sans-serif)",
              fontSize: "29px",
              fontWeight: 700,
              letterSpacing: "-0.028em",
              lineHeight: 1,
              color: "var(--bd-white, #FFFFFF)",
            }}
          >
            {(activeEventsCount + activeCoursesCount).toLocaleString("en-US")}
          </b>
          <span
            className="og-kpiS og-kpiS-split"
            style={{
              fontSize: "12.5px",
              color: "var(--bd-gray-600, #979797)",
            }}
          >
            <span>
              {activeEventsCount} {isMn ? "эвент" : "event"} · {activeCoursesCount} {isMn ? "сургалт" : "course"}
            </span>
            <span className="og-kpiSep"> · </span>
            <span>
              {isMn ? "Нийт" : "Total"} {totalPublishedCount.toLocaleString("en-US")}
            </span>
          </span>
        </button>
      </div>

      {/* ─── Published Events Section (Нийтэлсэн эвентүүд) ────────────────── */}
      <div className="og-sec-head">
        <h2>{isMn ? "Нийтэлсэн эвентүүд" : "Published events"}</h2>
        <button
          type="button"
          onClick={() => router.push("/EventsManagement")}
        >
          <span>{isMn ? "Бүгдийг харах" : "View All"}</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {events.length > 0 ? (
        <div className="og-cards">
          {events.slice(0, 3).map((ev) => {
            const sold = (ev.totalBooked !== undefined && ev.totalBooked !== null)
              ? Number(ev.totalBooked)
              : Math.max(0, (Number(ev.totalTickets) || 0) - (Number(ev.ticketQtyAvailable) || 0));
            const total = Number(ev.totalTickets) || (sold > 0 ? sold : 100);
            const pct = Math.min(100, Math.round((sold / total) * 100));
            const coverImg = ev.posterImage?.[0] ? getFullImageUrl(ev.posterImage[0]) : "/img/sidebar-logo.svg";
            const isMenuThis = activeKebab === `e-${ev._id}`;

            return (
              <article
                key={ev._id}
                className={`og-card og-menuwrap ${isMenuThis ? "open" : ""}`}
                data-menuwrap
                data-open={isMenuThis ? "1" : "0"}
                onClick={() => router.push(`/EventDetailOrganiser?eventId=${ev._id}`)}
                role="link"
                tabIndex={0}
                aria-label={ev.eventTitle || ""}
              >
                <img
                  src={coverImg}
                  alt=""
                  style={{
                    width: "82px",
                    height: "82px",
                    borderRadius: "16px",
                    objectFit: "cover",
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.05)",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "/img/sidebar-logo.svg";
                  }}
                />

                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <b
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: "14.5px",
                        fontWeight: 650,
                        lineHeight: 1.3,
                        letterSpacing: "-0.01em",
                        color: "var(--bd-white)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={ev.eventTitle}
                    >
                      {ev.eventTitle}
                    </b>

                    <button
                      type="button"
                      className="og-kebab"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveKebab((prev) => (prev === `e-${ev._id}` ? null : `e-${ev._id}`));
                      }}
                      aria-label="Actions"
                      aria-haspopup="true"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <circle cx="8" cy="3" r="1.5" />
                        <circle cx="8" cy="8" r="1.5" />
                        <circle cx="8" cy="13" r="1.5" />
                      </svg>
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "var(--bd-gray-600)" }}>
                      {formatDateBilingual(ev.startDate, ev.startTime, isMn, t)}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "1px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px" }}>
                      <span style={{ fontSize: "12px", color: "var(--bd-gray-600)" }}>
                        {isMn ? "Зарагдсан" : "Sold"}
                      </span>
                      <b style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--bd-white)" }}>
                        {sold.toLocaleString("en-US")}/{total.toLocaleString("en-US")}
                      </b>
                    </div>
                    <span style={{ display: "block", height: "4px", borderRadius: "999px", background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                      <i style={{ display: "block", height: "100%", width: `${pct}%`, borderRadius: "999px", background: "var(--acc)", transition: "width 300ms ease" }} />
                    </span>
                  </div>
                </div>

                {/* Popover Actions */}
                {isMenuThis && (
                  <div
                    className={`og-pop ${isMenuThis ? "open" : ""}`}
                    style={{ top: "44px", right: "12px", display: "flex", zIndex: 100 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveKebab(null);
                        openPromoteWith(ev, "event");
                      }}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                      <span>{isMn ? "Сурталчлах" : "Promote"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveKebab(null);
                        router.push(`/BasicInfo?eventId=${ev._id}`);
                      }}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <span>{isMn ? "Засах" : "Edit"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveKebab(null);
                        router.push(`/EventDetailOrganiser?eventId=${ev._id}`);
                      }}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>{isMn ? "Харах" : "View"}</span>
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            padding: "36px 20px",
            textAlign: "center",
            borderRadius: "20px",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px dashed var(--bd-border)",
          }}
        >
          <p style={{ margin: "0 0 12px", color: "var(--bd-gray-500)", fontSize: "14px" }}>
            {isMn ? "Одоогоор нийтлэгдсэн эвент байхгүй байна." : "No published events found."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/BasicInfo")}
            className="og-btn-primary"
            style={{ display: "inline-flex" }}
          >
            {isMn ? "+ Эвент үүсгэх" : "+ Create Event"}
          </button>
        </div>
      )}

      {/* ─── Published Courses Section (Нийтэлсэн сургалтууд) ─────────────── */}
      <div className="og-sec-head">
        <h2>{isMn ? "Нийтэлсэн сургалтууд" : "Published courses"}</h2>
        <button
          type="button"
          onClick={() => router.push("/CoursesManagement")}
        >
          <span>{isMn ? "Бүгдийг харах" : "View All"}</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {courses.length > 0 ? (
        <div className="og-cards">
          {courses.slice(0, 3).map((cr) => {
            const enrolled = Number(cr.acquiredSeats || cr.totalBooked || 0);
            const total = Number(cr.totalSeats) || (enrolled > 0 ? enrolled : 30);
            const pct = Math.min(100, Math.round((enrolled / total) * 100));
            const coverImg = cr.posterImage?.[0] ? getFullImageUrl(cr.posterImage[0]) : "/img/sidebar-logo.svg";
            const isMenuThis = activeKebab === `c-${cr._id}`;

            return (
              <article
                key={cr._id}
                className={`og-card og-menuwrap ${isMenuThis ? "open" : ""}`}
                data-menuwrap
                data-open={isMenuThis ? "1" : "0"}
                onClick={() => router.push(`/CourseDetailOrganiser?courseId=${cr._id}`)}
                role="link"
                tabIndex={0}
                aria-label={cr.courseTitle || cr.title || ""}
              >
                <img
                  src={coverImg}
                  alt=""
                  style={{
                    width: "82px",
                    height: "82px",
                    borderRadius: "16px",
                    objectFit: "cover",
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.05)",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "/img/sidebar-logo.svg";
                  }}
                />

                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <b
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: "14.5px",
                        fontWeight: 650,
                        lineHeight: 1.3,
                        letterSpacing: "-0.01em",
                        color: "var(--bd-white)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={cr.courseTitle || cr.title}
                    >
                      {cr.courseTitle || cr.title}
                    </b>

                    <button
                      type="button"
                      className="og-kebab"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveKebab((prev) => (prev === `c-${cr._id}` ? null : `c-${cr._id}`));
                      }}
                      aria-label="Actions"
                      aria-haspopup="true"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <circle cx="8" cy="3" r="1.5" />
                        <circle cx="8" cy="8" r="1.5" />
                        <circle cx="8" cy="13" r="1.5" />
                      </svg>
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "var(--bd-gray-600)" }}>
                      {cr.startDate ? (isMn ? `${formatDateBilingual(cr.startDate, null, isMn, t)}-нд эхэлнэ` : `${formatDateBilingual(cr.startDate, null, isMn, t)} starts`) : (isMn ? "Тун удахгүй эхэлнэ" : "Starting soon")}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "1px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px" }}>
                      <span style={{ fontSize: "12px", color: "var(--bd-gray-600)" }}>
                        {isMn ? "Бүртгүүлсэн" : "Enrolled"}
                      </span>
                      <b style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--bd-white)" }}>
                        {enrolled.toLocaleString("en-US")}/{total.toLocaleString("en-US")}
                      </b>
                    </div>
                    <span style={{ display: "block", height: "4px", borderRadius: "999px", background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                      <i style={{ display: "block", height: "100%", width: `${pct}%`, borderRadius: "999px", background: "var(--acc)", transition: "width 300ms ease" }} />
                    </span>
                  </div>
                </div>

                {/* Popover Actions */}
                {isMenuThis && (
                  <div
                    className={`og-pop ${isMenuThis ? "open" : ""}`}
                    style={{ top: "44px", right: "12px", display: "flex", zIndex: 100 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveKebab(null);
                        openPromoteWith(cr, "course");
                      }}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                      <span>{isMn ? "Сурталчлах" : "Promote"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveKebab(null);
                        router.push(`/AddProgram?courseId=${cr._id}`);
                      }}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <span>{isMn ? "Засах" : "Edit"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveKebab(null);
                        router.push(`/CourseDetailOrganiser?courseId=${cr._id}`);
                      }}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>{isMn ? "Харах" : "View"}</span>
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            padding: "36px 20px",
            textAlign: "center",
            borderRadius: "20px",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px dashed var(--bd-border)",
          }}
        >
          <p style={{ margin: "0 0 12px", color: "var(--bd-gray-500)", fontSize: "14px" }}>
            {isMn ? "Одоогоор идэвхтэй сургалт байхгүй байна." : "No active courses found."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/AddProgram")}
            className="og-btn-primary"
            style={{ display: "inline-flex" }}
          >
            {isMn ? "+ Сургалт үүсгэх" : "+ Create Course"}
          </button>
        </div>
      )}

      {/* ─── Recent Bookings Section (Matching Prototype Image 3) ────────── */}
      <div className="og-sec-head">
        <h2>{isMn ? "Сүүлийн захиалгууд" : "Recent bookings"}</h2>
        <button
          type="button"
          onClick={() => router.push("/OrganizerCustomerBookings?type=all")}
        >
          <span>{isMn ? "Бүгдийг харах" : "View All"}</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <section
        style={{
          borderRadius: "22px",
          background: "linear-gradient(158deg, rgba(255, 255, 255, 0.055) 0%, rgba(255, 255, 255, 0.013) 44%, rgba(255, 255, 255, 0) 100%), var(--bd-ink-850)",
          border: "1px solid var(--bd-border)",
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 14px 30px rgba(0, 0, 0, 0.24)",
          overflow: "hidden",
        }}
      >
        {recentOrders.length > 0 ? (
          recentOrders.map((o) => (
            <button
              key={o.id}
              type="button"
              className="og-row"
              data-ref={o.ref}
              style={{
                gridTemplateColumns: "34px minmax(0, 1fr) auto",
                gap: "12px",
                padding: "12px 18px",
                border: "none",
                borderTop: "1px solid var(--bd-border-soft)",
                background: "transparent",
                color: "inherit",
                fontFamily: "var(--bd-font-ui)",
                textAlign: "left",
                width: "100%",
                boxSizing: "border-box",
                cursor: "pointer",
              }}
              onClick={() => setSelectedBookingDetail(o)}
            >
              <span className="sc-host-x" style={{ display: "flex", alignItems: "center" }}>
                {o.avatar ? (
                  <img
                    src={o.avatar}
                    alt={o.name}
                    className="og-row-avatar"
                    style={{ width: "34px", height: "34px", borderRadius: "999px", objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "34px",
                      height: "34px",
                      borderRadius: "999px",
                      background: "var(--bd-brand-soft)",
                      color: "var(--acc)",
                      fontWeight: 700,
                      fontSize: "12.5px",
                    }}
                  >
                    {(o.name || "U")[0]?.toUpperCase()}
                  </span>
                )}
              </span>

              <span style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                <b style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--bd-white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {o.name}
                </b>
                <span style={{ fontSize: "12px", color: "var(--bd-gray-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {o.item}
                </span>
                {o.qty && (
                  <span style={{ fontSize: "11.5px", fontWeight: 600, color: "rgba(35, 173, 164, 0.72)", whiteSpace: "nowrap" }}>
                    {o.qty}
                  </span>
                )}
              </span>

              <b style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--bd-white)", whiteSpace: "nowrap", alignSelf: "center" }}>
                {o.amount}
              </b>
            </button>
          ))
        ) : (
          <div style={{ padding: "34px 20px", textAlign: "center", color: "var(--bd-gray-500)", fontSize: "13.5px" }}>
            {isMn ? "Сүүлийн захиалга бүртгэгдээгүй байна." : "No recent bookings recorded yet."}
          </div>
        )}
      </section>

      {/* ─── Promote Modal Sheet (.og-sheet) ──────────────────────────────── */}
      {promoteOpen && (
        <div
          className="og-sheet"
          data-open="1"
          role="dialog"
          aria-modal="true"
          aria-label={isMn ? "Сурталчлах" : "Promote"}
          onClick={() => setPromoteOpen(false)}
        >
          <div className="og-sheet-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "14px", padding: "18px 18px 14px", borderBottom: "1px solid var(--bd-border-soft)" }}>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: 0, fontFamily: "var(--bd-font-ui)", fontSize: "17px", fontWeight: 700, letterSpacing: "-0.014em", color: "var(--bd-white)" }}>
                  {isMn ? "Сурталчлах" : "Promote"}
                </h2>
                <p style={{ margin: "5px 0 0", fontSize: "12.5px", color: "var(--bd-gray-600)" }}>
                  {isMn ? "Нийтэлсэн хөтөлбөрөөсөө сонгоно уу." : "Choose from your published events and courses."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPromoteOpen(false)}
                aria-label="Хаах"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  border: "none",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,.05)",
                  color: "var(--bd-gray-400)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </button>
            </div>

            <div className="bd-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", padding: "14px" }}>
              {/* Event Section */}
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--bd-gray-600)" }}>
                {isMn ? "Эвент" : "Events"}
              </span>
              {events.length > 0 ? (
                events.map((ev) => {
                  const isChecked = selectedPromoteItem?._id === ev._id;
                  const sold = Number(ev.totalBooked) || 0;
                  const total = Number(ev.totalTickets) || 0;
                  const img = ev.posterImage?.[0] ? getFullImageUrl(ev.posterImage[0]) : "/img/sidebar-logo.svg";
                  const seatText = total > 0 ? ` · ${sold}/${total}` : (sold > 0 ? ` · ${sold} ${isMn ? "борлуулсан" : "sold"}` : "");

                  return (
                    <button
                      key={ev._id}
                      type="button"
                      className="og-pick"
                      role="radio"
                      aria-checked={isChecked}
                      onClick={() => setSelectedPromoteItem(ev)}
                    >
                      <span className="og-tick">
                        <span />
                      </span>
                      <img
                        src={img}
                        alt=""
                        style={{ width: "42px", height: "42px", borderRadius: "12px", objectFit: "cover", flexShrink: 0 }}
                        onError={(e) => {
                          e.currentTarget.src = "/img/sidebar-logo.svg";
                        }}
                      />
                      <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                        <b style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--bd-white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ev.eventTitle}
                        </b>
                        <span style={{ fontSize: "12px", color: "var(--bd-gray-600)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {formatDateBilingual(ev.startDate, null, isMn, t)}{seatText}
                        </span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <p style={{ margin: "4px 0 10px", fontSize: "12.5px", color: "var(--bd-gray-500)" }}>
                  {isMn ? "Нийтлэгдсэн эвент байхгүй байна." : "No published events available."}
                </p>
              )}

              {/* Course Section */}
              <span style={{ marginTop: "6px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--bd-gray-600)" }}>
                {isMn ? "Сургалт" : "Courses"}
              </span>
              {courses.length > 0 ? (
                courses.map((cr) => {
                  const isChecked = selectedPromoteItem?._id === cr._id;
                  const enrolled = Number(cr.acquiredSeats || cr.totalBooked) || 0;
                  const total = Number(cr.totalSeats) || 0;
                  const img = cr.posterImage?.[0] ? getFullImageUrl(cr.posterImage[0]) : "/img/sidebar-logo.svg";
                  const seatText = total > 0 ? ` · ${enrolled}/${total}` : (enrolled > 0 ? ` · ${enrolled} ${isMn ? "бүртгүүлсэн" : "enrolled"}` : "");

                  return (
                    <button
                      key={cr._id}
                      type="button"
                      className="og-pick"
                      role="radio"
                      aria-checked={isChecked}
                      onClick={() => setSelectedPromoteItem(cr)}
                    >
                      <span className="og-tick">
                        <span />
                      </span>
                      <img
                        src={img}
                        alt=""
                        style={{ width: "42px", height: "42px", borderRadius: "12px", objectFit: "cover", flexShrink: 0 }}
                        onError={(e) => {
                          e.currentTarget.src = "/img/sidebar-logo.svg";
                        }}
                      />
                      <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                        <b style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--bd-white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {cr.courseTitle || cr.title}
                        </b>
                        <span style={{ fontSize: "12px", color: "var(--bd-gray-600)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {cr.startDate ? formatDateBilingual(cr.startDate, null, isMn, t) : (isMn ? "Тун удахгүй" : "Soon")} · {enrolled}/{total}
                        </span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <p style={{ margin: "4px 0 10px", fontSize: "12.5px", color: "var(--bd-gray-500)" }}>
                  {isMn ? "Нийтлэгдсэн сургалт байхгүй байна." : "No published courses available."}
                </p>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 18px calc(16px + env(safe-area-inset-bottom, 0px))", borderTop: "1px solid var(--bd-border-soft)" }}>
              <button
                type="button"
                className="og-btn-ghost"
                onClick={() => setPromoteOpen(false)}
                style={{ flex: 1 }}
              >
                {isMn ? "Цуцлах" : "Cancel"}
              </button>
              <button
                type="button"
                className="og-btn-primary"
                onClick={handlePromoteSubmit}
                disabled={!selectedPromoteItem}
                style={{
                  flex: 1.3,
                  opacity: selectedPromoteItem ? 1 : 0.4,
                  cursor: selectedPromoteItem ? "pointer" : "not-allowed",
                }}
              >
                {isMn ? "Сурталчлах" : "Promote"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bondy Booking Sheet Modal (bondy-booking-sheet) ──────────────── */}
      {selectedBookingDetail && (
        <div
          className="bondy-booking-scrim"
          onClick={() => setSelectedBookingDetail(null)}
        >
          <div
            className="bondy-booking-panel"
            role="dialog"
            aria-modal="true"
            aria-label={isMn ? "Захиалгын дэлгэрэнгүй" : "Booking Details"}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Customer Head */}
            <div className="bondy-booking-head">
              <a
                className="bondy-booking-who"
                href={`/MyTicketsOrganiser?ref=${encodeURIComponent(selectedBookingDetail.ref)}`}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(`/MyTicketsOrganiser?ref=${encodeURIComponent(selectedBookingDetail.ref)}`);
                }}
              >
                {selectedBookingDetail.avatar ? (
                  <span
                    className="bondy-booking-av"
                    style={{ backgroundImage: `url(${selectedBookingDetail.avatar})` }}
                  />
                ) : (
                  <span
                    className="bondy-booking-av"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--bd-brand-soft)",
                      color: "var(--acc)",
                      fontWeight: 700,
                      fontSize: "17px",
                    }}
                  >
                    {(selectedBookingDetail.name || "U")[0]?.toUpperCase()}
                  </span>
                )}
                <span style={{ minWidth: 0 }}>
                  <b className="bondy-booking-nm">{selectedBookingDetail.name}</b>
                  <span className="bondy-booking-em">{selectedBookingDetail.email}</span>
                </span>
              </a>

              <button
                type="button"
                className="bondy-booking-x"
                onClick={() => setSelectedBookingDetail(null)}
                aria-label={isMn ? "Хаах" : "Close"}
              >
                ×
              </button>
            </div>

            {/* Key-Value Breakdown */}
            <div>
              <span className="bondy-booking-kv">
                <span>{selectedBookingDetail.type === "course" ? (isMn ? "Бүртгэлийн ID" : "Registration ID") : (isMn ? "Захиалгын дугаар" : "Booking Reference")}</span>
                <span style={{ fontFamily: "monospace", color: "var(--acc-bright)" }}>{selectedBookingDetail.ref}</span>
              </span>

              {selectedBookingDetail.phone && (
                <span className="bondy-booking-kv">
                  <span>{isMn ? "Утас" : "Phone"}</span>
                  <span>{selectedBookingDetail.phone}</span>
                </span>
              )}

              <span className="bondy-booking-kv">
                <span>{selectedBookingDetail.type === "course" ? (isMn ? "Сургалт" : "Course") : (isMn ? "Эвент" : "Event")}</span>
                <span>{selectedBookingDetail.item}</span>
              </span>

              <span className="bondy-booking-kv">
                <span>{selectedBookingDetail.type === "course" ? (isMn ? "Анги" : "Batch") : (isMn ? "Тасалбарын төрөл" : "Ticket Type")}</span>
                <span>{selectedBookingDetail.unit}</span>
              </span>

              {selectedBookingDetail.qty && (
                <span className="bondy-booking-kv">
                  <span>{isMn ? "Тоо хэмжээ" : "Quantity"}</span>
                  <span>{selectedBookingDetail.qty}</span>
                </span>
              )}

              <span className="bondy-booking-kv">
                <span>{isMn ? "Төлсөн дүн" : "Amount Paid"}</span>
                <span style={{ color: "var(--acc)", fontWeight: 700 }}>{selectedBookingDetail.amount}</span>
              </span>

              <span className="bondy-booking-kv">
                <span>{isMn ? "Төлбөрийн төлөв" : "Payment Status"}</span>
                <span style={{ color: "#34c759", fontWeight: 600 }}>{isMn ? "Төлөгдсөн" : "PAID"}</span>
              </span>

              <span className="bondy-booking-kv">
                <span>{selectedBookingDetail.type === "course" ? (isMn ? "Бүртгэлийн төлөв" : "Registration Status") : (isMn ? "Захиалгын төлөв" : "Booking Status")}</span>
                <span>{isMn ? "Баталгаажсан" : "Confirmed"}</span>
              </span>

              <span className="bondy-booking-kv">
                <span>{selectedBookingDetail.type === "course" ? (isMn ? "Бүртгүүлсэн огноо" : "Registered At") : (isMn ? "Захиалсан огноо" : "Booked At")}</span>
                <span>{formatExactDate(selectedBookingDetail.rawDate)}</span>
              </span>
            </div>

            {/* CTAs */}
            <div className="bondy-booking-ctas">
              <button
                type="button"
                className="bondy-booking-cta primary"
                onClick={() => {
                  setSelectedBookingDetail(null);
                  router.push(`/Message?thread=${encodeURIComponent(selectedBookingDetail.ref)}`);
                }}
              >
                {isMn ? "Зурвас бичих" : "Send message"}
              </button>
              <button
                type="button"
                className="bondy-booking-cta out"
                onClick={() => {
                  setSelectedBookingDetail(null);
                  router.push(`/MyTicketsOrganiser?ref=${encodeURIComponent(selectedBookingDetail.ref)}`);
                }}
              >
                {isMn ? "Профайл үзэх" : "View profile"}
              </button>
            </div>
          </div>
        </div>
      )}
      {promoTarget && (
        <PromotionPlanModal
          open={Boolean(promoTarget)}
          kind={promoTarget.kind}
          listingId={promoTarget.item._id}
          title={promoTarget.kind === "event" ? (promoTarget.item.eventTitle || promoTarget.item.title) : (promoTarget.item.courseTitle || promoTarget.item.title)}
          viewHref={promoTarget.kind === "event" ? `/eventDetails?id=${promoTarget.item._id}` : `/programDetails?id=${promoTarget.item._id}`}
          running={Boolean(
            promoTarget.item.isFeatured &&
            promoTarget.item.featuredExpiry &&
            new Date(promoTarget.item.featuredExpiry) > new Date()
          )}
          ineligible={
            Boolean(promoTarget.item.status && String(promoTarget.item.status).toLowerCase() === "cancelled") ||
            Boolean(promoTarget.item.status && String(promoTarget.item.status).toLowerCase() === "past") ||
            Boolean(promoTarget.item.endDate && new Date(promoTarget.item.endDate) < new Date(new Date().setHours(0, 0, 0, 0)))
          }
          onClose={() => setPromoTarget(null)}
          onPurchased={fetchAllData}
        />
      )}
    </div>
  );
}
