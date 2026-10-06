"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import organizerApi from "../../../api/organizerApi";
import apiClient from "../../../api/apiClient";
import eventApi from "../../../api/eventApi";
import courseApi from "../../../api/courseApi";
import authApi from "../../../api/authApi";
import { getFullImageUrl } from "../../../utils/imageHelper";

// ─── Number & Date Formatters ──────────────────────────────────────────────────
function formatMoney(amount, isMn) {
  const num = Number(amount) || 0;
  return `₮${num.toLocaleString("en-US")}`;
}

function formatDateBilingual(dateStr, timeStr, isMn) {
  if (!dateStr) return isMn ? "Тун удахгүй" : "Coming soon";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return isMn ? "Тун удахгүй" : "Coming soon";

  const mnMonths = ["1-р", "2-р", "3-р", "4-р", "5-р", "6-р", "7-р", "8-р", "9-р", "10-р", "11-р", "12-р"];
  const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = d.getMonth();
  const day = d.getDate();

  const monthText = isMn ? `${mnMonths[m]} сарын ${day}` : `${enMonths[m]} ${day}`;
  const timeText = timeStr ? ` · ${String(timeStr).slice(0, 5)}` : "";
  return `${monthText}${timeText}`;
}

// ─── Smooth Bezier Curve Calculator ──────────────────────────────────────────
function computeBezierCurve(points, width = 1000, height = 180, padTop = 18, padBottom = 22) {
  if (!points || points.length === 0) return { line: "", area: "", coords: [] };
  const minVal = 0;
  const maxVal = Math.max(...points, 1000);
  const plotH = height - padTop - padBottom;
  const stepX = points.length > 1 ? width / (points.length - 1) : width / 2;

  const coords = points.map((val, idx) => {
    const x = Math.round(idx * stepX * 10) / 10;
    const yRatio = (val - minVal) / (maxVal - minVal);
    const y = Math.round((height - padBottom - yRatio * plotH) * 10) / 10;
    return [x, y];
  });

  if (coords.length === 1) {
    const [, y] = coords[0];
    return {
      line: `M 0,${y} L ${width},${y}`,
      area: `M 0,${y} L ${width},${y} L ${width},${height} L 0,${height} Z`,
      coords,
    };
  }

  let line = `M ${coords[0][0]},${coords[0][1]}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const [x0, y0] = coords[i];
    const [x1, y1] = coords[i + 1];
    const mx = (x0 + x1) / 2;
    line += ` C ${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }

  const area = `${line} L ${coords[coords.length - 1][0]},${height} L ${coords[0][0]},${height} Z`;

  return { line, area, coords };
}

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
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
  });
  const [analytics, setAnalytics] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  // Range for revenue chart
  const [range, setRange] = useState("month"); // 'week' | 'month' | 'm6' | 'y1'
  const [rangeMenuOpen, setRangeMenuOpen] = useState(false);

  // Dropdowns & Sheets
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [activeKebab, setActiveKebab] = useState(null); // 'e-ID' or 'c-ID'
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [selectedPromoteItem, setSelectedPromoteItem] = useState(null);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState(null);

  // Chart hover interaction
  const [hoverIndex, setHoverIndex] = useState(null);
  const chartPlotRef = useRef(null);

  // ─── Fetch All Data ────────────────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);

      const [profRes, dashRes, analRes, earnRes, evRes, crRes] = await Promise.allSettled([
        authApi.getSelfProfile(),
        organizerApi.getDashboardData(),
        organizerApi.getAnalyticsStats(),
        organizerApi.getEarnings(),
        eventApi.getOrganizerEvents({ limit: 4 }),
        courseApi.getOrganizerCourses({ limit: 4 }),
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
      if (dashRes.status === "fulfilled" && dashRes.value?.status && dashRes.value?.data) {
        setDashStats(dashRes.value.data);
      }

      // Analytics stats
      if (analRes.status === "fulfilled" && analRes.value?.status && analRes.value?.data) {
        setAnalytics(analRes.value.data);
      }

      // Earnings & Transactions
      if (earnRes.status === "fulfilled" && earnRes.value?.status && earnRes.value?.data) {
        const earnData = earnRes.value.data;
        setEarnings(earnData);

        // Derive recent orders from wallet history
        if (earnData?.walletHistory && Array.isArray(earnData.walletHistory)) {
          const orders = earnData.walletHistory
            .filter((item) => item.amount !== undefined)
            .slice(0, 5)
            .map((item, idx) => ({
              id: item._id || item.bookingId || `ord-${idx}`,
              name: item.userName || item.user?.firstName || (isMn ? "Хэрэглэгч" : "Customer"),
              avatar: item.userAvatar || item.user?.profileImage ? getFullImageUrl(item.userAvatar || item.user?.profileImage) : "",
              item: item.description || item.title || (isMn ? "Тасалбар" : "Ticket Purchase"),
              qty: item.qty ? `${item.qty} ${isMn ? "ш" : "tickets"}` : "",
              amount: formatMoney(Math.abs(item.amount), isMn),
              rawAmount: item.amount,
              rawDate: item.createdAt,
              status: item.status || "PAID",
              bookingId: item.bookingId,
            }));
          setRecentOrders(orders);
        }
      }

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
    document.title = "Dashboard - Bondy Organizer";
  }, [fetchAllData]);

  // Close floating menus when clicking outside
  useEffect(() => {
    const handleClickAway = (e) => {
      if (!e.target.closest("[data-menuwrap]")) {
        setCreateMenuOpen(false);
        setRangeMenuOpen(false);
        setActiveKebab(null);
      }
    };
    document.addEventListener("click", handleClickAway);
    return () => document.removeEventListener("click", handleClickAway);
  }, []);

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

  const totalBookingsCount = useMemo(() => {
    if (analytics?.performance?.totalBookings) {
      return Number(analytics.performance.totalBookings);
    }
    if (dashStats.totalTicketsSold) {
      return Number(dashStats.totalTicketsSold);
    }
    return 0;
  }, [analytics, dashStats]);

  const activeEventsCount = useMemo(() => {
    return (dashStats.totalLiveEvents || 0) + (dashStats.totalPendingEvents || 0) || events.length;
  }, [dashStats, events]);

  const activeCoursesCount = useMemo(() => {
    return courses.length;
  }, [courses]);

  const totalActiveListings = useMemo(() => {
    return activeEventsCount + activeCoursesCount;
  }, [activeEventsCount, activeCoursesCount]);

  // ─── Dynamic Revenue Chart Series ──────────────────────────────────────────
  const chartData = useMemo(() => {
    const rawHistory = earnings?.walletHistory || [];

    if (range === "week") {
      const labels = isMn
        ? ["Дав", "Мяг", "Лха", "Пүр", "Баа", "Бям", "Ням"]
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const buckets = [0, 0, 0, 0, 0, 0, 0];
      const now = new Date();
      rawHistory.forEach((item) => {
        if (!item.createdAt || !item.amount) return;
        const d = new Date(item.createdAt);
        const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          const dayIdx = (d.getDay() + 6) % 7; // Mon=0 .. Sun=6
          buckets[dayIdx] += Math.abs(Number(item.amount) || 0);
        }
      });
      // Fallback if brand new
      const series = buckets.every((v) => v === 0) ? [0, 0, 0, 0, 0, 0, 0] : buckets;
      const sum = series.reduce((a, b) => a + b, 0);
      return {
        label: isMn ? "Сүүлийн 7 хоног" : "This week",
        totalText: formatMoney(sum || totalNetRevenue, isMn),
        labels,
        series,
      };
    }

    if (range === "m6") {
      const labels = isMn
        ? ["1 сар", "2 сар", "3 сар", "4 сар", "5 сар", "6 сар"]
        : ["M-5", "M-4", "M-3", "M-2", "M-1", "Current"];
      const buckets = [0, 0, 0, 0, 0, 0];
      const now = new Date();
      rawHistory.forEach((item) => {
        if (!item.createdAt || !item.amount) return;
        const d = new Date(item.createdAt);
        const mDiff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        if (mDiff >= 0 && mDiff < 6) {
          buckets[5 - mDiff] += Math.abs(Number(item.amount) || 0);
        }
      });
      const series = buckets.every((v) => v === 0) ? [0, 0, 0, 0, 0, 0] : buckets;
      const sum = series.reduce((a, b) => a + b, 0);
      return {
        label: isMn ? "Сүүлийн 6 сар" : "Last 6 months",
        totalText: formatMoney(sum || totalNetRevenue, isMn),
        labels,
        series,
      };
    }

    if (range === "y1") {
      const labels = isMn
        ? ["1-р улирал", "2-р улирал", "3-р улирал", "4-р улирал"]
        : ["Q1", "Q2", "Q3", "Q4"];
      const buckets = [0, 0, 0, 0];
      const curYear = new Date().getFullYear();
      rawHistory.forEach((item) => {
        if (!item.createdAt || !item.amount) return;
        const d = new Date(item.createdAt);
        if (d.getFullYear() === curYear) {
          const q = Math.floor(d.getMonth() / 3);
          buckets[q] += Math.abs(Number(item.amount) || 0);
        }
      });
      const series = buckets.every((v) => v === 0) ? [0, 0, 0, 0] : buckets;
      const sum = series.reduce((a, b) => a + b, 0);
      return {
        label: isMn ? "Энэ жил" : "This year",
        totalText: formatMoney(sum || totalNetRevenue, isMn),
        labels,
        series,
      };
    }

    // Default: 'month' (e.g. 1st, 7th, 14th, 21st, 28th, end)
    const labels = isMn
      ? ["1-р сар", "7-р өдөр", "14-р өдөр", "21-р өдөр", "28-р өдөр", "Сар төгсгөл"]
      : ["Day 1", "Day 7", "Day 14", "Day 21", "Day 28", "End"];
    const buckets = [0, 0, 0, 0, 0, 0];
    const now = new Date();
    rawHistory.forEach((item) => {
      if (!item.createdAt || !item.amount) return;
      const d = new Date(item.createdAt);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        const day = d.getDate();
        const bIdx = Math.min(5, Math.floor(day / 5));
        buckets[bIdx] += Math.abs(Number(item.amount) || 0);
      }
    });
    const series = buckets.every((v) => v === 0) ? [0, 0, 0, 0, 0, 0] : buckets;
    const sum = series.reduce((a, b) => a + b, 0);
    return {
      label: isMn ? "Энэ сар" : "This month",
      totalText: formatMoney(sum || totalNetRevenue, isMn),
      labels,
      series,
    };
  }, [earnings, range, isMn, totalNetRevenue]);

  const curve = useMemo(() => {
    return computeBezierCurve(chartData.series, 1000, 180, 18, 24);
  }, [chartData.series]);

  // Chart mouse move hover
  const handleChartMouseMove = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    if (!box.width) return;
    const norm = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    const idx = Math.round(norm * (chartData.series.length - 1));
    if (hoverIndex !== idx) setHoverIndex(idx);
  };

  const handleChartMouseLeave = () => {
    setHoverIndex(null);
  };

  const activePoint = useMemo(() => {
    if (hoverIndex === null || !curve.coords[hoverIndex]) return null;
    const [x, y] = curve.coords[hoverIndex];
    const pctX = (hoverIndex / (chartData.series.length - 1 || 1)) * 100;
    const val = chartData.series[hoverIndex];
    const dateLabel = chartData.labels[hoverIndex];
    return {
      x,
      y,
      pctX,
      text: `${dateLabel}: ${formatMoney(val, isMn)}`,
    };
  }, [hoverIndex, curve.coords, chartData, isMn]);

  // ─── Promote Handler ────────────────────────────────────────────────────────
  const openPromoteWith = (item) => {
    setSelectedPromoteItem(item || events[0] || courses[0] || null);
    setPromoteOpen(true);
    setActiveKebab(null);
  };

  return (
    <div style={{ width: "100%", paddingBottom: "60px" }}>
      {/* ─── Top Executive Toolbar ───────────────────────────────────────── */}
      <div className="og-toolbar">
        {/* Create CTA Button with Popover */}
        <span className="og-menuwrap" data-menuwrap>
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
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{isMn ? "Үүсгэх" : "Create"}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: createMenuOpen ? "rotate(180deg)" : "none", transition: "transform 180ms ease" }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {createMenuOpen && (
            <div className="og-pop" style={{ top: "48px", right: 0 }}>
              <Link href="/BasicInfo" onClick={() => setCreateMenuOpen(false)}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{isMn ? "Эвент" : "Event"}</span>
              </Link>
              <Link href="/AddProgram" onClick={() => setCreateMenuOpen(false)}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span>{isMn ? "Сургалт" : "Course"}</span>
              </Link>
            </div>
          )}
        </span>

        {/* Promote CTA Button */}
        <button
          type="button"
          className="og-btn-ghost"
          onClick={() => openPromoteWith(events[0] || courses[0])}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>{isMn ? "Сурталчлах" : "Promote"}</span>
        </button>
      </div>

      {/* ─── 3 Key Metric Cards ──────────────────────────────────────────── */}
      <div className="og-stats">
        {/* Card 1: Revenue */}
        <Link href="/Earnings" className="og-kpi">
          <div className="og-kpiH">
            <span className="og-kpiIco">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </span>
            <span className="og-kpiT">{isMn ? "Орлого" : "Revenue"}</span>
          </div>
          <b className="og-kpiN">{formatMoney(totalNetRevenue, isMn)}</b>
          <span className="og-kpiS">
            {isMn ? "Цэвэр орлогын нийт дүн" : "Total net earnings recorded"}
          </span>
        </Link>

        {/* Card 2: Bookings */}
        <Link href="/MyTicketsOrganiser" className="og-kpi">
          <div className="og-kpiH">
            <span className="og-kpiIco">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </span>
            <span className="og-kpiT">{isMn ? "Нийт захиалга" : "Total Bookings"}</span>
          </div>
          <b className="og-kpiN">{totalBookingsCount.toLocaleString("en-US")}</b>
          <span className="og-kpiS">
            {dashStats.totalTicketsSold || totalBookingsCount} {isMn ? "тасалбар / суудал зарагдсан" : "tickets & registrations"}
          </span>
        </Link>

        {/* Card 3: Active Listings */}
        <Link href="/EventsManagement" className="og-kpi">
          <div className="og-kpiH">
            <span className="og-kpiIco">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </span>
            <span className="og-kpiT">{isMn ? "Идэвхтэй нийтлэл" : "Active Listings"}</span>
          </div>
          <b className="og-kpiN">{totalActiveListings}</b>
          <span className="og-kpiS">
            {activeEventsCount} {isMn ? "эвент" : "events"} · {activeCoursesCount} {isMn ? "сургалт" : "courses"}
          </span>
        </Link>
      </div>

      {/* ─── Interactive Revenue Chart Card ──────────────────────────────── */}
      <section className="og-chart">
        <div className="og-chart-head">
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--bd-gray-400)" }}>
              {isMn ? "Орлогын динамик" : "Revenue Dynamics"}
            </span>
            <b style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--bd-white)" }}>
              {chartData.totalText}
            </b>
          </div>

          {/* Range Selector Pill */}
          <div className="og-menuwrap" data-menuwrap>
            <button
              type="button"
              className="og-range"
              onClick={(e) => {
                e.stopPropagation();
                setRangeMenuOpen((prev) => !prev);
                setCreateMenuOpen(false);
              }}
            >
              <span>{chartData.label}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {rangeMenuOpen && (
              <div className="og-pop" style={{ top: "44px", right: 0, minWidth: "170px" }}>
                {[
                  { id: "week", label: isMn ? "Сүүлийн 7 хоног" : "This week" },
                  { id: "month", label: isMn ? "Энэ сар" : "This month" },
                  { id: "m6", label: isMn ? "Сүүлийн 6 сар" : "Last 6 months" },
                  { id: "y1", label: isMn ? "Энэ жил" : "This year" },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    style={{
                      background: range === r.id ? "rgba(35, 173, 164, 0.12)" : "transparent",
                      color: range === r.id ? "var(--acc)" : "var(--bd-gray-300)",
                    }}
                    onClick={() => {
                      setRange(r.id);
                      setRangeMenuOpen(false);
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Interactive SVG Plot */}
        <div
          ref={chartPlotRef}
          className="og-chart-plot"
          onMouseMove={handleChartMouseMove}
          onMouseLeave={handleChartMouseLeave}
        >
          <svg
            className="og-chart-svg"
            viewBox="0 0 1000 180"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="ogChartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#23ada4" stopOpacity="0.32" />
                <stop offset="65%" stopColor="#23ada4" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#23ada4" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Area Fill */}
            {curve.area && <path d={curve.area} fill="url(#ogChartGrad)" />}

            {/* Glowing Border Line */}
            {curve.line && (
              <path
                d={curve.line}
                fill="none"
                stroke="#23ada4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Hover Crosshair Dot */}
            {hoverPoint && (
              <g>
                <line
                  x1={hoverPoint.x}
                  y1={0}
                  x2={hoverPoint.x}
                  y2={180}
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeDasharray="4,4"
                  strokeWidth="1"
                />
                <circle
                  cx={hoverPoint.x}
                  cy={hoverPoint.y}
                  r="5"
                  fill="#23ada4"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>

          {/* Interactive Tooltip */}
          {hoverPoint && (
            <div
              className="og-chart-tt"
              style={{
                left: `${(hoverPoint.x / 1000) * 100}%`,
                top: `${(hoverPoint.y / 180) * 100}%`,
              }}
            >
              <span className="og-chart-tt-val">{formatMoney(hoverPoint.amount)}</span>
              <span className="og-chart-tt-lbl">{hoverPoint.label}</span>
            </div>
          )}
        </div>

        {/* X-axis labels */}
        <div className="og-chart-axis">
          {chartPoints.map((p, idx) => (
            <span key={idx}>{p.label}</span>
          ))}
        </div>
      </section>

      {/* ─── Published Events Section ────────────────────────────────────── */}
      <div className="og-sec-head">
        <h2>{isMn ? "Нийтлэгдсэн эвентүүд" : "Published Events"}</h2>
        <Link href="/EventsManagement">
          {isMn ? "Бүгдийг харах" : "View all"}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      {events.length > 0 ? (
        <div className="og-cards">
          {events.map((ev) => {
            const sold = (ev.totalBooked !== undefined && ev.totalBooked !== null)
              ? Number(ev.totalBooked)
              : Math.max(0, (Number(ev.totalTickets) || 0) - (Number(ev.ticketQtyAvailable) || 0));
            const total = Number(ev.totalTickets) || (sold > 0 ? sold : 100);
            const pct = Math.min(100, Math.round((sold / total) * 100));
            const coverImg = ev.posterImage?.[0] ? getFullImageUrl(ev.posterImage[0]) : "/img/sidebar-logo.svg";
            const isMenuThis = activeKebab === `e-${ev._id}`;

            return (
              <article key={ev._id} className="og-card" data-menuwrap>
                <img
                  src={coverImg}
                  alt={ev.eventTitle || ""}
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

                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "7px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
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

                    {/* Kebab 3-dots */}
                    <button
                      type="button"
                      className="og-kebab"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveKebab((prev) => (prev === `e-${ev._id}` ? null : `e-${ev._id}`));
                      }}
                      aria-label="Actions"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="8" cy="3" r="1.5" />
                        <circle cx="8" cy="8" r="1.5" />
                        <circle cx="8" cy="13" r="1.5" />
                      </svg>
                    </button>
                  </div>

                  {/* Date & Time */}
                  <span style={{ fontSize: "12px", color: "var(--bd-gray-500)" }}>
                    {formatDateBilingual(ev.startDate, ev.startTime, isMn)}
                  </span>

                  {/* Progress Bar */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "2px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px" }}>
                      <span style={{ fontSize: "11.5px", color: "var(--bd-gray-500)" }}>
                        {isMn ? "Борлуулалт" : "Sold"}
                      </span>
                      <b style={{ fontSize: "12px", fontWeight: 600, color: "var(--bd-white)" }}>
                        {sold.toLocaleString("en-US")} / {total.toLocaleString("en-US")}
                      </b>
                    </div>
                    <div style={{ height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          borderRadius: "999px",
                          background: "var(--acc)",
                          transition: "width 300ms ease",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Popover Actions */}
                {isMenuThis && (
                  <div className="og-pop" style={{ top: "44px", right: "12px" }}>
                    <button type="button" onClick={() => openPromoteWith(ev)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                      <span>{isMn ? "Сурталчлах" : "Promote"}</span>
                    </button>
                    <button type="button" onClick={() => router.push(`/BasicInfo?eventId=${ev._id}`)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <span>{isMn ? "Засах" : "Edit"}</span>
                    </button>
                    <button type="button" onClick={() => router.push(`/eventbooking?id=${ev._id}`)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>{isMn ? "Харах" : "View Public"}</span>
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
          <Link href="/BasicInfo" className="og-btn-primary" style={{ display: "inline-flex" }}>
            {isMn ? "+ Эвент үүсгэх" : "+ Create Event"}
          </Link>
        </div>
      )}

      {/* ─── Courses / Programs Section ──────────────────────────────────── */}
      <div className="og-sec-head">
        <h2>{isMn ? "Сургалтууд" : "Courses & Programs"}</h2>
        <Link href="/CoursesManagement">
          {isMn ? "Бүгдийг харах" : "View all"}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      {courses.length > 0 ? (
        <div className="og-cards">
          {courses.map((cr) => {
            const enrolled = Number(cr.acquiredSeats || cr.totalBooked || 0);
            const total = Number(cr.totalSeats) || (enrolled > 0 ? enrolled : 30);
            const pct = Math.min(100, Math.round((enrolled / total) * 100));
            const coverImg = cr.posterImage?.[0] ? getFullImageUrl(cr.posterImage[0]) : "/img/sidebar-logo.svg";
            const isMenuThis = activeKebab === `c-${cr._id}`;

            return (
              <article key={cr._id} className="og-card" data-menuwrap>
                <img
                  src={coverImg}
                  alt={cr.courseTitle || cr.title || ""}
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

                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "7px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
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
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="8" cy="3" r="1.5" />
                        <circle cx="8" cy="8" r="1.5" />
                        <circle cx="8" cy="13" r="1.5" />
                      </svg>
                    </button>
                  </div>

                  <span style={{ fontSize: "12px", color: "var(--bd-gray-500)" }}>
                    {formatDateBilingual(cr.startDate, null, isMn)}
                  </span>

                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "2px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px" }}>
                      <span style={{ fontSize: "11.5px", color: "var(--bd-gray-500)" }}>
                        {isMn ? "Оролцогчид" : "Enrolled"}
                      </span>
                      <b style={{ fontSize: "12px", fontWeight: 600, color: "var(--bd-white)" }}>
                        {enrolled.toLocaleString("en-US")} / {total.toLocaleString("en-US")}
                      </b>
                    </div>
                    <div style={{ height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          borderRadius: "999px",
                          background: "var(--acc)",
                          transition: "width 300ms ease",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {isMenuThis && (
                  <div className="og-pop" style={{ top: "44px", right: "12px" }}>
                    <button type="button" onClick={() => openPromoteWith(cr)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                      <span>{isMn ? "Сурталчлах" : "Promote"}</span>
                    </button>
                    <button type="button" onClick={() => router.push(`/AddProgram?id=${cr._id}`)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <span>{isMn ? "Засах" : "Edit"}</span>
                    </button>
                    <button type="button" onClick={() => router.push(`/programDetails?id=${cr._id}`)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>{isMn ? "Харах" : "View Public"}</span>
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
          <Link href="/AddProgram" className="og-btn-primary" style={{ display: "inline-flex" }}>
            {isMn ? "+ Сургалт үүсгэх" : "+ Create Course"}
          </Link>
        </div>
      )}

      {/* ─── Recent Bookings / Orders Section ────────────────────────────── */}
      <div className="og-sec-head">
        <h2>{isMn ? "Сүүлийн захиалгууд" : "Recent Bookings"}</h2>
        <Link href="/MyTicketsOrganiser">
          {isMn ? "Бүгдийг харах" : "View all"}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
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
          recentOrders.map((ord) => (
            <button
              key={ord.id}
              type="button"
              className="og-row"
              style={{
                gridTemplateColumns: "36px minmax(0, 1fr) auto",
                borderTop: "1px solid var(--bd-border-soft)",
              }}
              onClick={() => setSelectedBookingDetail(ord)}
            >
              {/* Avatar / Initials */}
              {ord.avatar ? (
                <img
                  src={ord.avatar}
                  alt={ord.name}
                  style={{ width: "36px", height: "36px", borderRadius: "999px", objectFit: "cover" }}
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
                    width: "36px",
                    height: "36px",
                    borderRadius: "999px",
                    background: "var(--bd-brand-soft)",
                    color: "var(--acc)",
                    fontWeight: 700,
                    fontSize: "13px",
                  }}
                >
                  {(ord.name || "U")[0]?.toUpperCase()}
                </span>
              )}

              {/* Title & Desc */}
              <span style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                <b style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--bd-white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ord.name}
                </b>
                <span style={{ fontSize: "12px", color: "var(--bd-gray-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ord.item}
                </span>
                {ord.qty && (
                  <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--acc)", whiteSpace: "nowrap" }}>
                    {ord.qty}
                  </span>
                )}
              </span>

              {/* Amount */}
              <b style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--bd-white)", whiteSpace: "nowrap" }}>
                {ord.amount}
              </b>
            </button>
          ))
        ) : (
          <div style={{ padding: "34px 20px", textAlign: "center", color: "var(--bd-gray-500)", fontSize: "13.5px" }}>
            {isMn ? "Сүүлийн захиалга бүртгэгдээгүй байна." : "No recent bookings recorded yet."}
          </div>
        )}
      </section>

      {/* ─── Promote Modal Sheet ─────────────────────────────────────────── */}
      {promoteOpen && (
        <div className="og-sheet" onClick={() => setPromoteOpen(false)}>
          <div className="og-sheet-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--bd-border-soft)" }}>
              <b style={{ fontSize: "16px", fontWeight: 700, color: "var(--bd-white)" }}>
                {isMn ? "Сурталчлах зүйлээ сонгох" : "Choose item to promote"}
              </b>
              <button
                type="button"
                onClick={() => setPromoteOpen(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "999px",
                  border: "1px solid var(--bd-border)",
                  color: "var(--bd-gray-400)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "420px", overflowY: "auto" }}>
              {[...events, ...courses].length > 0 ? (
                [...events, ...courses].map((item) => {
                  const title = item.eventTitle || item.courseTitle || item.title || "";
                  const isSelected = selectedPromoteItem?._id === item._id;
                  const img = item.posterImage?.[0] ? getFullImageUrl(item.posterImage[0]) : "/img/sidebar-logo.svg";

                  return (
                    <button
                      key={item._id}
                      type="button"
                      className="og-pick"
                      aria-checked={isSelected}
                      onClick={() => setSelectedPromoteItem(item)}
                    >
                      <img
                        src={img}
                        alt=""
                        style={{ width: "42px", height: "42px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }}
                        onError={(e) => {
                          e.currentTarget.src = "/img/sidebar-logo.svg";
                        }}
                      />
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, fontSize: "13.5px" }}>
                        {title}
                      </span>
                      <span className="og-tick">
                        <span />
                      </span>
                    </button>
                  );
                })
              ) : (
                <p style={{ textAlign: "center", color: "var(--bd-gray-500)", padding: "20px 0" }}>
                  {isMn ? "Нийтлэгдсэн эвент эсвэл сургалт байхгүй байна." : "No published events or courses available to promote."}
                </p>
              )}
            </div>

            <div style={{ padding: "16px 20px", borderTop: "1px solid var(--bd-border-soft)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" className="og-btn-ghost" onClick={() => setPromoteOpen(false)}>
                {isMn ? "Болих" : "Cancel"}
              </button>
              <button
                type="button"
                className="og-btn-primary"
                disabled={!selectedPromoteItem}
                style={{ opacity: selectedPromoteItem ? 1 : 0.5, cursor: selectedPromoteItem ? "pointer" : "not-allowed" }}
                onClick={() => {
                  setPromoteOpen(false);
                  if (selectedPromoteItem?._id) {
                    router.push(`/Promotions?id=${selectedPromoteItem._id}`);
                  }
                }}
              >
                {isMn ? "Багц сонгох" : "Choose Package"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Booking Details Sheet Modal ─────────────────────────────────── */}
      {selectedBookingDetail && (
        <div className="og-sheet" onClick={() => setSelectedBookingDetail(null)}>
          <div className="og-sheet-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--bd-border-soft)" }}>
              <b style={{ fontSize: "16px", fontWeight: 700, color: "var(--bd-white)" }}>
                {isMn ? "Захиалгын дэлгэрэнгүй" : "Booking Details"}
              </b>
              <button
                type="button"
                onClick={() => setSelectedBookingDetail(null)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "999px",
                  border: "1px solid var(--bd-border)",
                  color: "var(--bd-gray-400)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", paddingBottom: "14px", borderBottom: "1px solid var(--bd-border-soft)" }}>
                {selectedBookingDetail.avatar ? (
                  <img
                    src={selectedBookingDetail.avatar}
                    alt=""
                    style={{ width: "50px", height: "50px", borderRadius: "999px", objectFit: "cover" }}
                  />
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "50px",
                      height: "50px",
                      borderRadius: "999px",
                      background: "var(--bd-brand-soft)",
                      color: "var(--acc)",
                      fontWeight: 700,
                      fontSize: "18px",
                    }}
                  >
                    {(selectedBookingDetail.name || "U")[0]?.toUpperCase()}
                  </span>
                )}
                <div>
                  <b style={{ fontSize: "16px", color: "var(--bd-white)", display: "block" }}>
                    {selectedBookingDetail.name}
                  </b>
                  <span style={{ fontSize: "12.5px", color: "var(--bd-gray-500)" }}>
                    {selectedBookingDetail.rawDate ? new Date(selectedBookingDetail.rawDate).toLocaleString() : ""}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px" }}>
                <span style={{ color: "var(--bd-gray-500)" }}>{isMn ? "Бүтээгдэхүүн" : "Item"}</span>
                <b style={{ color: "var(--bd-white)", textAlign: "right" }}>{selectedBookingDetail.item}</b>
              </div>

              {selectedBookingDetail.bookingId && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px" }}>
                  <span style={{ color: "var(--bd-gray-500)" }}>{isMn ? "Захиалгын №" : "Booking ID"}</span>
                  <span style={{ fontFamily: "monospace", color: "var(--acc-bright)" }}>
                    {selectedBookingDetail.bookingId}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px" }}>
                <span style={{ color: "var(--bd-gray-500)" }}>{isMn ? "Төлөв" : "Status"}</span>
                <span style={{ color: "#34c759", fontWeight: 600 }}>
                  {selectedBookingDetail.status === "PAID" ? (isMn ? "Төлөгдсөн" : "PAID") : selectedBookingDetail.status}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", paddingTop: "10px", borderTop: "1px solid var(--bd-border-soft)" }}>
                <b style={{ color: "var(--bd-white)" }}>{isMn ? "Нийт дүн" : "Total Paid"}</b>
                <b style={{ color: "var(--acc)", fontSize: "18px" }}>{selectedBookingDetail.amount}</b>
              </div>
            </div>

            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--bd-border-soft)", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="og-btn-primary"
                onClick={() => setSelectedBookingDetail(null)}
              >
                {isMn ? "Хаах" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
