"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import bookingApi from "@/api/bookingApi";
import { useLanguage } from "@/context/LanguageContext";
import "./organizer-orders.css";

const PAGE_SIZE = 10;

function Icon({ name }) {
  const common = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "cal") {
    return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>;
  }
  if (name === "pin") {
    return <svg {...common}><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.2" /></svg>;
  }
  return <svg {...common}><path d="m9 6 6 6-6 6" /></svg>;
}

function ymd(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function describe(ticket, t) {
  const isCourse = ticket.bookingType === "COURSE";
  const item = (isCourse ? ticket.courseId : ticket.eventId) || {};
  const title = (isCourse ? item.courseTitle : item.eventTitle) || "";
  const image = Array.isArray(item.posterImage) ? item.posterImage[0] : "";

  let when = "";
  if (isCourse) {
    when = [ymd(item.startDate), ymd(item.endDate)].filter(Boolean).join(" – ");
  } else {
    when = [ymd(item.startDate), item.startTime].filter(Boolean).join(", ");
  }

  const address = item.venueAddress && typeof item.venueAddress === "object"
    ? [item.venueAddress.address, item.venueAddress.city].filter(Boolean).join(", ")
    : (typeof item.venueAddress === "string" ? item.venueAddress : "");

  let sub = "";
  if (isCourse) {
    const batch = (item.batches || []).find((row) => String(row._id) === String(ticket.batchId));
    sub = [
      batch?.batchName || (ticket.passType ? t("moPassLabel") : ""),
      item.totalSessions ? t("moSessions", { count: item.totalSessions }) : "",
    ].filter(Boolean).join(" · ");
  } else {
    const qty = ticket.qty || 1;
    sub = ticket.ticketName ? `${ticket.ticketName} × ${qty}` : t("obTickets", { count: qty });
  }

  return { isCourse, title, image, when, venue: item.venueName || "", address, sub };
}

function statusTag(status, t) {
  if (status === "CANCELLED" || status === "FAILED") return { label: t("obCancelled"), tone: "bad" };
  if (status === "REFUND_INITIATED") return { label: t("tdRefunding"), tone: "wait" };
  if (status === "REFUNDED") return { label: t("obRefunded"), tone: "muted" };
  if (status === "PENDING") return { label: t("obPending"), tone: "wait" };
  return null;
}

export default function OrganizerOrders() {
  const { t } = useLanguage();
  const [tab, setTab] = useState("active");
  const [kind, setKind] = useState("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    setFailed(false);
    try {
      const params = { page, limit: PAGE_SIZE, type: tab === "active" ? "upcoming" : "past" };
      if (kind !== "all") params.bookingType = kind;
      const res = await bookingApi.getTicketList(params);
      if (mine !== seq.current) return;
      if (!res?.status || !res.data) {
        setFailed(true);
        setRows([]);
      } else {
        setRows(res.data.tickets || []);
        setPages(res.data.pagination?.totalPages || 1);
      }
    } catch {
      if (mine !== seq.current) return;
      setFailed(true);
      setRows([]);
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [page, tab, kind]);

  useEffect(() => {
    load();
  }, [load, retry]);

  const pickTab = (next) => {
    setTab(next);
    setPage(1);
  };
  const pickKind = (next) => {
    setKind(next);
    setPage(1);
  };

  const tabs = [
    { key: "active", label: t("moActive") },
    { key: "past", label: t("moPast") },
  ];
  const kinds = [
    { key: "all", label: t("obAll") },
    { key: "EVENT", label: t("obEvent") },
    { key: "COURSE", label: t("obCourse") },
  ];

  return (
    <div className="mo-wrap">
      <div className="mo-tabs" role="tablist">
        {tabs.map((row) => (
          <button
            key={row.key}
            type="button"
            role="tab"
            className="mo-tab"
            aria-selected={tab === row.key}
            onClick={() => pickTab(row.key)}
          >
            {row.label}
          </button>
        ))}
      </div>

      <div className="mo-kinds">
        {kinds.map((row) => (
          <button
            key={row.key}
            type="button"
            className="mo-kind"
            aria-selected={kind === row.key}
            onClick={() => pickKind(row.key)}
          >
            {row.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mo-list">
          <div className="mo-skel" />
          <div className="mo-skel" />
          <div className="mo-skel" />
        </div>
      ) : failed ? (
        <div className="mo-state">
          <b>{t("obLoadFail")}</b>
          <p>{t("obLoadFailBody")}</p>
          <button type="button" className="mo-retry" onClick={() => setRetry((n) => n + 1)}>{t("obRetry")}</button>
        </div>
      ) : rows.length === 0 ? (
        <p className="mo-empty">{t("moEmpty")}</p>
      ) : (
        <div className="mo-list">
          {rows.map((ticket) => {
            const info = describe(ticket, t);
            const tag = statusTag(ticket.status, t);
            return (
              <Link key={ticket._id} href={`/TicketDetailsOrganiser?id=${ticket._id}`} className="mo-card">
                <span className="mo-thumb" style={info.image ? { backgroundImage: `url(${info.image})` } : undefined} />
                <span className="mo-body">
                  <span className="mo-titlerow">
                    <b className="mo-title">{info.title}</b>
                    {tag && <span className={`mo-tag ${tag.tone}`}>{tag.label}</span>}
                  </span>
                  {info.sub && <span className="mo-sub">{info.sub}</span>}
                  {info.when && (
                    <span className="mo-meta">
                      <span className="mo-ico"><Icon name="cal" /></span>
                      <span>{info.when}</span>
                    </span>
                  )}
                  {(info.venue || info.address) && (
                    <span className="mo-meta">
                      <span className="mo-ico"><Icon name="pin" /></span>
                      <span className="mo-place">
                        {info.venue && <b>{info.venue}</b>}
                        {info.address && <i>{info.address}</i>}
                      </span>
                    </span>
                  )}
                  <span className="mo-cta">
                    {info.isCourse ? t("moViewReg") : t("moViewTicket")}
                    <Icon name="chev" />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && !failed && pages > 1 && (
        <div className="mo-pager">
          <button type="button" disabled={page <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))}>
            ← {t("previous")}
          </button>
          <span>{t("pageOf", { current: page, total: pages })}</span>
          <button type="button" disabled={page >= pages} onClick={() => setPage((n) => Math.min(pages, n + 1))}>
            {t("next")} →
          </button>
        </div>
      )}
    </div>
  );
}
