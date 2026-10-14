"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";
import bookingApi from "@/api/bookingApi";
import { useLanguage } from "@/context/LanguageContext";
import "./ticket-detail-view.css";

function Icon({ name }) {
  const common = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "cal") {
    return (
      <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
    );
  }
  if (name === "pin") {
    return (
      <svg {...common}><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.2" /></svg>
    );
  }
  if (name === "user") {
    return (
      <svg {...common}><circle cx="12" cy="8" r="3.2" /><path d="M5 19.2a7 7 0 0 1 14 0" /></svg>
    );
  }
  if (name === "ticket") {
    return (
      <svg {...common}><path d="M4 8.5V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5a2.2 2.2 0 0 0 0 4.4V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4.1a2.2 2.2 0 0 0 0-4.4Z" /></svg>
    );
  }
  return (
    <svg {...common}><path d="M8 7h8M8 12h8M8 17h5" /><rect x="4" y="3" width="16" height="18" rx="2" /></svg>
  );
}

function money(amount) {
  const value = Number(amount) || 0;
  return `₮${value.toLocaleString("en-US")}`;
}

function placeText(item) {
  const venue = item?.venueAddress || item?.venue || {};
  return [venue.venueName, venue.address, venue.city].filter(Boolean).join(", ");
}

function dateText(value, language) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(language === "mn" ? "mn-MN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function payLabel(method, t) {
  if (method === "STRIPE") return t("tdPayStripe");
  if (method === "SOCIALPAY") return t("tdPaySocial");
  if (method === "WALLET") return t("tdPayWallet");
  if (method === "FREE") return t("bcFree");
  if (method === "QPAY") return t("tdPayQpay");
  return method || "";
}

export default function TicketDetailView({ showCustomerNav = false, data = null, ordersHref = "" }) {
  const { t, language } = useLanguage();
  const params = useSearchParams();
  const id = params.get("id");
  const [ticket, setTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    // The parent page may already hold the booking; render it without a second request.
    if (data?.ticket) {
      setTicket(data.ticket);
      setTickets(data.tickets || []);
      setSelected(0);
      setFailed(false);
      setLoading(false);
      return undefined;
    }
    if (!id) {
      setFailed(true);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    bookingApi.getTicketDetail(id).then((res) => {
      if (cancelled) return;
      if (!res?.status || !res.data?.ticket) {
        setFailed(true);
        setTicket(null);
      } else {
        setTicket(res.data.ticket);
        setTickets(res.data.tickets || []);
        setSelected(0);
      }
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setFailed(true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id, data]);

  if (loading) {
    return <div className="td-state-page"><b>{t("loading")}</b></div>;
  }
  if (failed || !ticket) {
    return <div className="td-state-page"><b>{t("tdNotFound")}</b></div>;
  }

  const isCourse = ticket.bookingType === "COURSE";
  const item = isCourse ? ticket.courseId : ticket.eventId;
  const title = isCourse ? item?.courseTitle : item?.eventTitle;
  const image = Array.isArray(item?.posterImage) ? item.posterImage[0] : "";
  const when = [dateText(item?.startDate, language), item?.startTime].filter(Boolean).join(" · ");
  const where = placeText(item);
  const buyerName = `${ticket.userId?.firstName || ""} ${ticket.userId?.lastName || ""}`.trim();
  const option = ticket.ticketName || tickets[0]?.ticketName || "";
  const qty = ticket.qty || tickets.length || 1;
  const free = ticket.paymentMethod === "FREE" || !Number(ticket.totalAmount);
  const dead = ["CANCELLED", "FAILED", "REFUND_INITIATED", "REFUNDED"].includes(ticket.status);
  const current = tickets[selected] || null;
  const person = `${current?.firstName || ""} ${current?.lastName || ""}`.trim() || buyerName;
  const code = current?.ticketNumber || ticket.bookingId || "";
  const rawQr = current?.qrCodeData || (!tickets.length ? ticket.qrCodeData : "");
  // A real ticket code is a short token. Some records carry the payment invoice's
  // base64 image in this field, which is far too long to encode and is not a ticket code.
  const qr = typeof rawQr === "string" && rawQr.length <= 1000 && !rawQr.startsWith("data:") ? rawQr : "";
  const checkedIn = Boolean(current?.isCheckedIn);

  let stateLabel = t("tdValid");
  let stateNote = isCourse ? t("tdScanCourse") : t("tdScanEvent");
  let stateClass = "ok";
  if (ticket.status === "CANCELLED" || ticket.status === "FAILED") {
    stateLabel = t("obCancelled");
    stateNote = t("tdCancelledNote");
    stateClass = "bad";
  } else if (ticket.status === "REFUND_INITIATED") {
    stateLabel = t("tdRefunding");
    stateNote = t("tdRefundingNote");
    stateClass = "wait";
  } else if (ticket.status === "REFUNDED") {
    stateLabel = t("tdRefunded");
    stateNote = t("tdRefundedNote");
    stateClass = "muted";
  } else if (ticket.status === "PENDING") {
    stateLabel = t("obPending");
    stateNote = "";
    stateClass = "wait";
  }

  const batch = (item?.batches || []).find((row) => String(row._id) === String(ticket.batchId));
  const period = [dateText(item?.startDate, language), dateText(item?.endDate, language)].filter(Boolean).join(" – ");
  const weekly = [Array.isArray(batch?.days) ? batch.days.join(", ") : "", batch?.startTime && batch?.endTime ? `${batch.startTime} – ${batch.endTime}` : ""].filter(Boolean).join(" · ");

  return (
    <div className="td-page">
      {dead && (
        <div className={`td-banner ${stateClass}`}>
          <b>{stateLabel}</b>
          {stateNote && <span>{stateNote}</span>}
        </div>
      )}

      {(showCustomerNav || ordersHref) && (
        <nav className="td-crumb" aria-label="Breadcrumb">
          {showCustomerNav && (
            <>
              <Link href="/">{t("home")}</Link>
              <span>/</span>
            </>
          )}
          <Link href={ordersHref || "/MyTickets"}>{t("bcOrders")}</Link>
          <span>/</span>
          <span>{ticket.bookingId}</span>
        </nav>
      )}

      <h1 className="td-title">{t("tdHeading")}</h1>

      <section className="td-hero">
        <span className="td-thumb" style={image ? { backgroundImage: `url(${image})` } : undefined} />
        <span className="td-hero-copy">
          <span className={`ob-type ${isCourse ? "course" : "event"}`}>{isCourse ? t("obCourse") : t("obEvent")}</span>
          <b>{title}</b>
          <span className="td-meta">
            {when && <span><Icon name="cal" />{when}</span>}
            {where && <span><Icon name="pin" />{where}</span>}
          </span>
          {!isCourse && option && <span className="td-opt">{`${option} × ${qty}`}</span>}
        </span>
      </section>

      <section className="td-stats">
        <div>
          <span>{t("tdBookingNo")}</span>
          <b>{ticket.bookingId}</b>
        </div>
        {!free && (
          <div>
            <span>{t("tdAmountPaid")}</span>
            <b>{money(ticket.totalAmount)}</b>
          </div>
        )}
        {!free && (
          <div>
            <span>{t("tdPayMethod")}</span>
            <b>{payLabel(ticket.paymentMethod, t)}</b>
          </div>
        )}
      </section>

      <section className="td-ticketsec">
        {tickets.length > 1 && (
          <div className="td-sec-head">
            <h2>{t("tdTicketsHeading")}</h2>
            <span>{t("tdEachQr")}</span>
          </div>
        )}
        <div className="td-split" data-pick={tickets.length > 1 ? "list" : "none"}>
          {tickets.length > 1 && (
            <div className="td-picker">
              {tickets.map((row, index) => (
                <button
                  key={row._id || row.ticketNumber || index}
                  type="button"
                  className="td-tk"
                  aria-selected={index === selected}
                  onClick={() => setSelected(index)}
                >
                  <span className="td-tk-n">{index + 1}</span>
                  <span className="td-tk-t">{row.ticketName || option}</span>
                  <span className="td-tk-s">{`${row.firstName || ""} ${row.lastName || ""}`.trim() || buyerName}</span>
                </button>
              ))}
            </div>
          )}
          <div className="td-panel">
            <div className="td-rows">
              {person && (
                <span className="td-r"><Icon name="user" /><span className="td-k">{t("tdName")}</span><b className="td-v">{person}</b></span>
              )}
              {isCourse && title && (
                <span className="td-r"><Icon name="list" /><span className="td-k">{t("obCourse")}</span><b className="td-v">{title}</b></span>
              )}
              {(isCourse ? (batch?.batchName || option) : option) && (
                <span className="td-r">
                  <Icon name="ticket" />
                  <span className="td-k">{isCourse ? t("tdSelectedClass") : t("tdTicketType")}</span>
                  <b className="td-v">{isCourse ? (batch?.batchName || option) : option}</b>
                </span>
              )}
              {isCourse && period && (
                <span className="td-r"><Icon name="cal" /><span className="td-k">{t("tdCoursePeriod")}</span><b className="td-v">{period}</b></span>
              )}
              {isCourse && weekly && (
                <span className="td-r"><Icon name="cal" /><span className="td-k">{t("tdWeekly")}</span><b className="td-v">{weekly}</b></span>
              )}
              {isCourse && where && (
                <span className="td-r"><Icon name="pin" /><span className="td-k">{t("tdLocation")}</span><b className="td-v">{where}</b></span>
              )}
              {code && (
                <span className="td-r">
                  <Icon name="list" />
                  <span className="td-k">{isCourse ? t("tdBookingNo") : t("tdTicketNo")}</span>
                  <b className="td-v">{code}</b>
                </span>
              )}
            </div>
            <div className="td-qr">
              {qr && (
                <span className={`td-qr-box ${dead ? "dead" : ""}`}>
                  <QRCode value={qr} size={150} style={{ width: "100%", height: "100%" }} />
                </span>
              )}
              {!dead && <span className={`td-pill ${stateClass}`}>{stateLabel}</span>}
              {checkedIn && <span className="td-pill check">{t("tdCheckedIn")}</span>}
              {!dead && stateNote && <p>{stateNote}</p>}
            </div>
          </div>
        </div>
      </section>

      {(showCustomerNav || ordersHref) && (
        <div className="td-cta">
          <Link href={ordersHref || "/MyTickets"} className="td-cta-main">{t("bcOrders")}</Link>
          {showCustomerNav && <Link href="/" className="td-cta-ghost">{t("bcHome")}</Link>}
        </div>
      )}
    </div>
  );
}
