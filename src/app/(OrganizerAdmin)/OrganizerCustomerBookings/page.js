"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import bookingApi from "@/api/bookingApi";
import { useLanguage } from "@/context/LanguageContext";
import DateRangeCalendarPopover from "@/components/DateRangeCalendarPopover";
import { getFullImageUrl } from "@/utils/imageHelper";
import GlobalLoader from "@/components/GlobalLoader";
import "./bookings.css";

function money(amount) {
  const value = Number(amount) || 0;
  return `₮${value.toLocaleString("en-US")}`;
}

function statusKey(status) {
  if (status === "PAID") return "obConfirmed";
  if (status === "PENDING") return "obPending";
  if (status === "REFUNDED") return "obRefunded";
  if (status === "FAILED") return "obFailed";
  if (status === "REFUND_INITIATED") return "obRefundStarted";
  return "obCancelled";
}

function statusClass(status) {
  if (status === "PAID") return "paid";
  if (status === "PENDING") return "pending";
  return "bad";
}

function DarkSelect({ value, options, onChange, menuId, openMenu, setOpenMenu }) {
  const open = openMenu === menuId;
  const current = options.find((item) => item.value === value) || options[0];
  return (
    <div className={`ob-sel ${open ? "open" : ""}`}>
      <button
        type="button"
        className="ob-sel-btn"
        aria-expanded={open}
        onClick={() => setOpenMenu(open ? "" : menuId)}
      >
        {current?.label}
      </button>
      {open && (
        <div className="ob-menu" role="listbox">
          {options.map((item) => (
            <button
              key={item.value}
              type="button"
              role="option"
              aria-selected={item.value === value}
              onClick={() => {
                onChange(item.value);
                setOpenMenu("");
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingsBody() {
  const { t, language } = useLanguage();
  const params = useSearchParams();
  const router = useRouter();
  const userId = params.get("userId") || "";
  const rangeRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const paramType = params.get("type") || "all";
  const [query, setQuery] = useState(params.get("ref") || "");
  const [type, setType] = useState(paramType);
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCal, setShowCal] = useState(false);
  const [openMenu, setOpenMenu] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const sentinelRef = useRef(null);
  const generation = useRef(0);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const onDoc = (event) => {
      if (!event.target.closest?.(".ob-sel")) setOpenMenu("");
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    setRows([]);
    setTotal(0);
    setPage(1);
    setHasMore(false);
    setLoading(true);
    setQuery(params.get("ref") || "");
    setType(params.get("type") || "all");
    setStatus("all");
    setRange("all");
    setCustomFrom("");
    setCustomTo("");
    setShowCal(false);
  }, [userId, params]);

  const requestFor = (nextPage) => {
    const request = {
      type,
      status,
      range,
      page: nextPage,
      limit: 10,
    };
    if (userId) request.userId = userId;
    const q = query.trim();
    if (q) request.q = q;
    if (range === "custom") {
      request.from = customFrom;
      request.to = customTo;
    }
    return request;
  };

  useEffect(() => {
    if (range === "custom" && (!customFrom || !customTo)) return undefined;
    const gen = ++generation.current;
    loadingMoreRef.current = false;
    setLoadingMore(false);
    setFailed(false);
    setPage(1);
    const handle = setTimeout(() => {
      bookingApi.getOrganizerCustomerBookings(requestFor(1)).then((res) => {
        if (gen !== generation.current) return;
        if (!res?.status) {
          setFailed(true);
          setRows([]);
          setTotal(0);
          setHasMore(false);
        } else {
          setRows(res.data?.bookings || []);
          setTotal(res.data?.total || 0);
          setHasMore(Boolean(res.data?.hasMore));
        }
        setLoading(false);
      }).catch(() => {
        if (gen !== generation.current) return;
        setFailed(true);
        setRows([]);
        setTotal(0);
        setHasMore(false);
        setLoading(false);
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [query, type, status, range, customFrom, customTo, reloadKey, userId]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loading) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting || loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
      const nextPage = page + 1;
      const gen = generation.current;
      bookingApi.getOrganizerCustomerBookings(requestFor(nextPage)).then((res) => {
        if (gen !== generation.current) return;
        if (res?.status) {
          setRows((prev) => [...prev, ...(res.data?.bookings || [])]);
          setTotal(res.data?.total || 0);
          setHasMore(Boolean(res.data?.hasMore));
          setPage(nextPage);
        }
      }).catch(() => {}).finally(() => {
        if (gen === generation.current) {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        }
      });
    }, { root: null, rootMargin: "240px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, page, query, type, status, range, customFrom, customTo, userId]);

  const filtersOn = Boolean(query.trim()) || type !== "all" || status !== "all" || range !== "all";

  const reset = () => {
    setQuery("");
    setType("all");
    setStatus("all");
    setRange("all");
    setCustomFrom("");
    setCustomTo("");
    setShowCal(false);
  };

  let body = null;
  if (loading && rows.length === 0) {
    body = <GlobalLoader fullScreen={false} message={t("loading")} />;
  } else if (failed) {
    body = (
      <div className="ob-state">
        <b>{t("obLoadFail")}</b>
        <p>{t("obLoadFailBody")}</p>
        <button type="button" className="ob-go" onClick={() => setReloadKey((n) => n + 1)}>{t("obRetry")}</button>
      </div>
    );
  } else if (rows.length === 0 && !filtersOn) {
    body = (
      <div className="ob-state">
        <b>{t("obEmpty")}</b>
        <p>{t("obEmptyBody")}</p>
      </div>
    );
  } else if (rows.length === 0) {
    body = (
      <div className="ob-state">
        <b>{t("obNoMatch")}</b>
        <p>{t("obNoMatchBody")}</p>
        <button type="button" className="ob-go" onClick={reset}>{t("obReset")}</button>
      </div>
    );
  } else {
    body = rows.map((row) => {
      const name = `${row.buyer?.firstName || ""} ${row.buyer?.lastName || ""}`.trim() || row.buyer?.email || "";
      const when = row.createdAt
        ? new Date(row.createdAt).toLocaleDateString(language === "mn" ? "mn-MN" : "en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
        : "";
      return (
        <button
          key={row.transactionId || row.bookingId}
          type="button"
          className="ob-row"
          onClick={() => router.push(`/OrganizerBookingDetail?id=${row.transactionId}`)}
        >
          <img
            className="ob-av"
            src={getFullImageUrl(row.buyer?.profileImage) || "/img/default-user.png"}
            alt=""
            onError={(e) => {
              e.currentTarget.src = "/img/default-user.png";
            }}
          />
          <span className="ob-main">
            <b>{name}</b>
            <i>{row.title || row.bookingId}</i>
            <span className="ob-meta">
              <span className={`ob-type ${row.type === "COURSE" ? "course" : "event"}`}>
                {row.type === "COURSE" ? t("obCourse") : t("obEvent")}
              </span>
              <span className="ob-qty">{t("obTickets", { count: row.qty || 0 })}</span>
              <span className="ob-date">{when}</span>
              <span className="ob-date">{row.bookingId}</span>
            </span>
          </span>
          <span className="ob-right">
            <span className="ob-amt">{money(row.totalAmount)}</span>
            <span className={`ob-pill ${statusClass(row.status)}`}>{t(statusKey(row.status))}</span>
          </span>
        </button>
      );
    });
  }

  const statusOptions = [
    { value: "all", label: t("obAllStatus") },
    { value: "confirmed", label: t("obConfirmed") },
    { value: "pending", label: t("obPending") },
    { value: "cancelled", label: t("obCancelled") },
  ];
  const rangeOptions = [
    { value: "all", label: t("obAllTime") },
    { value: "week", label: t("obWeek") },
    { value: "d30", label: t("obDays30") },
    { value: "month", label: t("obThisMonth") },
    { value: "custom", label: t("obCustom") },
  ];

  return (
    <div className="ob-page">
      <div className="ob-head">
        <span className="ob-count">{t("obCount", { count: total })}</span>
      </div>
      <input
        className="ob-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("obSearch")}
      />
      <div className="ob-filters">
        <div className="ob-chips">
          {[
            ["all", "obAll"],
            ["event", "obEvent"],
            ["course", "obCourse"],
          ].map(([id, key]) => (
            <button
              key={id}
              type="button"
              className="ob-chip"
              aria-selected={type === id}
              onClick={() => setType(id)}
            >
              {t(key)}
            </button>
          ))}
        </div>
        <div className="ob-selects">
          <DarkSelect
            menuId="status"
            value={status}
            options={statusOptions}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            onChange={setStatus}
          />
          <div ref={rangeRef}>
            <DarkSelect
              menuId="range"
              value={range}
              options={rangeOptions}
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              onChange={(next) => {
                setRange(next);
                setShowCal(next === "custom");
              }}
            />
          </div>
          {showCal && (
            <DateRangeCalendarPopover
              anchorRef={rangeRef}
              initialFrom={customFrom}
              initialTo={customTo}
              language={language}
              t={t}
              onApply={(from, to) => {
                setCustomFrom(from);
                setCustomTo(to);
                setRange("custom");
                setShowCal(false);
              }}
              onCancel={() => {
                setShowCal(false);
                if (!customFrom || !customTo) setRange("all");
              }}
            />
          )}
        </div>
      </div>
      <div className="ob-list">
        {body}
        {hasMore && rows.length > 0 && (
          <div ref={sentinelRef} className="ob-more">{loadingMore ? t("loading") : ""}</div>
        )}
      </div>
    </div>
  );
}

export default function OrganizerCustomerBookingsPage() {
  return (
    <Suspense fallback={null}>
      <BookingsBody />
    </Suspense>
  );
}
