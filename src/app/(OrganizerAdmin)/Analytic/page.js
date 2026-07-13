"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Col, Row } from "react-bootstrap";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart,
} from "recharts";
import organizerApi from "@/api/organizerApi";

import eventApi from "@/api/eventApi";
import PaginationComponent from "@/components/PaginationComponent";
import { useLanguage } from "@/context/LanguageContext";

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon, color, suffix = "" }) {
  return (
    <div className="analytic-stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="analytic-stat-body">
        <div>
          <p className="analytic-stat-label">{title}</p>
          <h3 className="analytic-stat-value">
            {value !== null && value !== undefined ? `${value}${suffix}` : "—"}
          </h3>
        </div>
        <div className="analytic-stat-icon" style={{ background: `${color}22` }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "10px",
        padding: "10px 16px",
        fontSize: "13px",
      }}>
        <p style={{ color: "#aaa", marginBottom: 4 }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color, margin: "2px 0" }}>
            {entry.name}: ₮{entry.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ── Main Component ─────────────────────────────────────────────────────────────
function AnalyticPage() {
  const { t } = useLanguage();
  // Stats state
  const [statsFilter, setStatsFilter] = useState("1m");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Revenue chart state
  const [chartFilter, setChartFilter] = useState("7d");
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);

  // Top listings derived from stats
  const [topListings, setTopListings] = useState([]);
  const [listingPage, setListingPage] = useState(1);
  const [listingPagination, setListingPagination] = useState({ totalPages: 1 });

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // Map filter to query format
      let params = {
        page: listingPage,
        limit: 5
      };
      if (statsFilter === "7d") {
        params.filter = "7d";
      } else if (statsFilter === "30d") {
        params.filter = "30d";
      } else if (statsFilter === "1m") {
        params.filter = "thisMonth";
      }

      const res = await eventApi.getEventsAnalyticsSummary(params);
      if (res?.status) {
        setStats(res.data?.summary || null);
        setListingPagination(res.data?.pagination || { totalPages: 1 });

        // Map the listing fields from /event/analytics/summary response
        const listings = (res.data?.listings || []).map(item => ({
          name: item.title || "—",
          type: item.type || "Event",
          views: item.views ?? "—",
          bookings: item.bookings ?? 0,
          revenue: item.organizerRevenue ?? 0,
          posterImage: item.posterImage || null,
        }));
        setTopListings(listings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  }, [statsFilter, listingPage]);

  // Fetch revenue chart
  const fetchChart = useCallback(async () => {
    setChartLoading(true);
    try {
      const res = await organizerApi.getRevenueAnalytics(chartFilter);
      if (res?.status) {
        setChartData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChartLoading(false);
    }
  }, [chartFilter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchChart(); }, [fetchChart]);

  useEffect(() => {
    document.title = "Analytics - Bondy";
  }, []);

  // Derived values
  const totalBookings = stats?.totalBookings ?? 0;
  const totalTickets = stats?.totalTicketsSold ?? 0;
  const totalViews = stats?.totalViews ?? 0;
  const bookingRate = stats?.bookingRate ?? 0;

  // Chart data for recharts
  const revenueChartData = chartData?.labels?.map((label, i) => ({
    label,
    "Gross Revenue": chartData.grossRevenue[i] ?? 0,
    "Net Revenue": chartData.netRevenue[i] ?? 0,
  })) || [];

  const statsFilterOptions = [
    { value: "1m", label: t("thisMonth") || "This Month" },
    { value: "7d", label: t("last7Days") || "Last 7 Days" },
    { value: "30d", label: t("last30Days") || "Last 30 Days" },
  ];

  const chartFilterOptions = [
    { value: "7d", label: t("last7Days") || "Last 7 Days" },
    { value: "14d", label: t("last14Days") || "Last 14 Days" },
    { value: "1m", label: t("thisMonth") || "This Month" },
    { value: "6m", label: t("last6Months") || "Last 6 Months" },
    { value: "1y", label: t("last1Year") || "Last 1 Year" },
  ];

  return (
    <div>
      <style>{`
        .analytic-stat-card {
          background: #1a1a1a;
          border-radius: 14px;
          padding: 22px 20px;
          height: 100%;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .analytic-stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.4);
        }
        .analytic-stat-body {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .analytic-stat-label {
          color: #aaa;
          font-size: 13px;
          margin-bottom: 8px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .analytic-stat-value {
          color: #fff;
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          line-height: 1;
        }
        .analytic-stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }
        .analytic-filter-select {
          background: #242424;
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          border-radius: 8px;
          padding: 6px 32px 6px 12px;
          font-size: 13px;
          cursor: pointer;
          outline: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23aaa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
        }
        .analytic-filter-select:hover { border-color: #23ada4; }
        .analytic-section-title {
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }
        .analytic-chart-card {
          background: #1a1a1a;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          margin-top: 24px;
        }
        .analytic-table-card {
          background: #1a1a1a;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          margin-top: 24px;
        }
        .analytic-table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .analytic-view-all-btn {
          background: transparent;
          border: 1px solid #23ada4;
          color: #23ada4;
          border-radius: 20px;
          padding: 5px 16px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .analytic-view-all-btn:hover {
          background: #23ada4;
          color: #fff;
        }
        .analytic-table {
          width: 100%;
          border-collapse: collapse;
        }
        .analytic-table th {
          color: #aaa;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 10px 24px;
          text-align: left;
          background: rgba(255,255,255,0.02);
        }
        .analytic-table td {
          padding: 12px 24px;
          color: #e0e0e0;
          font-size: 14px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .analytic-table tr:last-child td { border-bottom: none; }
        .analytic-table tr:hover td { background: rgba(255,255,255,0.03); }
        .analytic-badge {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          display: inline-block;
        }
        .analytic-badge-event { background: rgba(35,173,164,0.2); color: #23ada4; }
        .analytic-badge-course { background: rgba(35,173,164,0.15); color: #23ada4; }
        .analytic-summary-chips {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .analytic-chip {
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          color: #ccc;
        }
        .analytic-chip span {
          color: #fff;
          font-weight: 700;
        }
        .analytic-empty {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 14px;
        }
        .skeleton-box {
          background: linear-gradient(90deg, #242424 25%, #2e2e2e 50%, #242424 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.4s infinite;
          border-radius: 8px;
          height: 28px;
          width: 80px;
        }
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .growth-badge {
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 20px;
          margin-left: 8px;
          display: inline-block;
        }
        .growth-up { background: rgba(34,197,94,0.15); color: #4ade80; }
        .growth-down { background: rgba(239,68,68,0.15); color: #f87171; }
      `}</style>

      <div className="cards dashboard-home">
        {/* ── Page Header ── */}
        <div className="card-header" style={{ marginBottom: 20 }}>
          <div>
            <h2 className="card-title">{t("analytics") || "Analytics"}</h2>
            <p style={{ color: "#aaa", fontSize: 13, margin: 0 }}>
              {t("analyticsSubtitle") || "Track your performance at a glance"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ color: "#aaa", fontSize: 13 }}>Period:</label>
            <select
              className="analytic-filter-select"
              value={statsFilter}
              onChange={(e) => setStatsFilter(e.target.value)}
            >
              {statsFilterOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── 3 Stat Cards ── */}
        <Row className="g-3 mb-2">
          <Col xs={12} md={4}>
            <StatCard
              title={t("views") || "Total Views"}
              value={statsLoading ? null : totalViews}
              color="#23ada4"
              icon={<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#23ada4" strokeWidth={2}><path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></svg>}
              suffix=""
            />
          </Col>
          <Col xs={12} md={4}>
            <StatCard
              title={t("bookingsTab") || t("totalBookings") || "Total Bookings"}
              value={statsLoading ? null : totalBookings}
              color="#23ada4"
              icon={<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#23ada4" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>}
            />
          </Col>
          <Col xs={12} md={4}>
            <StatCard
              title={t("bookingRate") || "Booking Rate"}
              value={statsLoading ? null : bookingRate}
              color="#23ada4"
              suffix="%"
              icon={<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#23ada4" strokeWidth={2}><path d="M3 17l5-5 4 4 9-9" /></svg>}
            />
          </Col>
        </Row>


        {/* ── Top Performing Listings ── */}
        <div className="analytic-table-card">
          <div className="analytic-table-header">
            <h5 className="analytic-section-title">{t("topPerformingListings") || "Top Performing Listings"}</h5>
          </div>
          {statsLoading ? (
            <div className="analytic-empty">Loading...</div>
          ) : topListings.length === 0 ? (
            <div className="analytic-empty">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#444" strokeWidth={1.5} style={{ marginBottom: 10 }}>
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>No listing data available yet</p>
            </div>
          ) : (
            <div>
              <div style={{ overflowX: "auto" }}>
                <table className="analytic-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th style={{ minWidth: "220px" }}>{t("title") || "title"}</th>
                      <th>{t("views") || "Views"}</th>
                      <th>{t("bookingsTab") || "Bookings"}</th>
                      <th>{t("revenue") || "Revenue"}</th>
                      
                    </tr>
                  </thead>
                  <tbody>
                    {topListings.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ color: "#666", verticalAlign: "middle" }}>
                          {(listingPage - 1) * 5 + idx + 1}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <img
                              src={item.posterImage || "/img/sidebar-logo.svg"}
                              alt={item.name}
                              onError={(e) => {
                                e.target.src = "/img/sidebar-logo.svg";
                              }}
                              style={{
                                width: "48px",
                                height: "48px",
                                objectFit: "contain",
                                borderRadius: "8px",
                                backgroundColor: "#242424",
                                padding: "4px"
                              }}
                            />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                title={item.name}
                                style={{
                                  fontWeight: 500,
                                  color: "#fff",
                                  marginBottom: "2px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  maxWidth: "250px"
                                }}
                              >
                                {item.name}
                              </div>
                              <span className={`analytic-badge analytic-badge-${item.type.toLowerCase()}`}>
                                {item.type}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ verticalAlign: "middle" }}>{item.views}</td>
                        <td style={{ color: "#23ada4", fontWeight: 600, verticalAlign: "middle" }}>{item.bookings}</td>
                        <td style={{ verticalAlign: "middle" }}>{item.revenue !== "—" ? `₮${item.revenue}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <PaginationComponent
                currentPage={listingPage}
                totalPages={listingPagination.totalPages}
                onPageChange={(page) => setListingPage(page)}
              />
            </div>
          )}
        </div>

        {/* ── Revenue Chart ── */}
        <div className="analytic-chart-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h5 className="analytic-section-title">{t("revenueOverview") || "Revenue Overview"}</h5>
              {chartData?.summary && !chartLoading && (
                <div className="analytic-summary-chips">
                  <div className="analytic-chip">
                    {t("net") || "Net"}: <span>₮{chartData.summary.totalNet?.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
            <select
              className="analytic-filter-select"
              value={chartFilter}
              onChange={(e) => setChartFilter(e.target.value)}
            >
              {chartFilterOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {chartLoading ? (
            <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>
              Loading chart...
            </div>
          ) : revenueChartData.length === 0 ? (
            <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#666", flexDirection: "column", gap: 8 }}>
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#444" strokeWidth={1.5}>
                <path d="M3 17l5-5 4 4 9-9" />
              </svg>
              No revenue data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#23ada4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#23ada4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#23ada4" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#23ada4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#888", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#888", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 13, color: "#aaa", paddingTop: 12 }}
                />
                {/* <Area
                  type="monotone"
                  dataKey="Gross Revenue"
                  stroke="#23ada4"
                  strokeWidth={2}
                  fill="url(#grossGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#23ada4" }}
                /> */}
                <Area
                  type="monotone"
                  dataKey="Net Revenue"
                  stroke="#23ada4"
                  strokeWidth={2}
                  fill="url(#netGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#23ada4" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return <AnalyticPage />;
}
