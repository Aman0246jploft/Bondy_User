"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import bookingApi from "@/api/bookingApi";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import GlobalLoader from "@/components/GlobalLoader";
import "./booking-detail-view.css";

function money(amount) {
  return `₮${(Number(amount) || 0).toLocaleString("en-US")}`;
}

const DAY_MN = { Mon: "Да", Tue: "Мя", Wed: "Лха", Thu: "Пү", Fri: "Ба", Sat: "Бя", Sun: "Ням" };

function shortDate(value, language) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(language === "mn" ? "mn-MN" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function dayList(days, language) {
  if (!Array.isArray(days) || !days.length) return "";
  return days.map((day) => (language === "mn" ? (DAY_MN[day] || day) : day)).join(", ");
}

function addressText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return [value.address, value.city].filter(Boolean).join(", ");
}

function payLabel(method, t) {
  if (method === "STRIPE") return t("tdPayStripe");
  if (method === "SOCIALPAY") return t("tdPaySocial");
  if (method === "WALLET") return t("tdPayWallet");
  if (method === "FREE") return t("bcFree");
  if (method === "QPAY") return t("tdPayQpay");
  return method || "";
}

export default function CustomerBookingDetail() {
  const { t, language } = useLanguage();
  const id = useSearchParams().get("id");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!id) {
      setFailed(true);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    bookingApi.getTicketDetail(id).then((res) => {
      if (cancelled) return;
      if (!res?.status || !res.data?.ticket) setFailed(true);
      else setData(res.data);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setFailed(true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <GlobalLoader fullScreen={false} />;
  if (failed || !data?.ticket) return <div className="bk-page"><p className="bk-policy">{t("tdNotFound")}</p></div>;

  const ticket = data.ticket;
  const tickets = data.tickets || [];
  const isEvent = ticket.bookingType === "EVENT";
  const item = (isEvent ? ticket.eventId : ticket.courseId) || {};
  const now = Date.now();
  const startMs = item.startDate ? new Date(item.startDate).getTime() : NaN;
  const endSource = !isEvent && ticket.passType && ticket.passExpiryDate ? ticket.passExpiryDate : (item.endDate || item.startDate);
  const endMs = endSource ? new Date(endSource).getTime() : NaN;
  const ended = !Number.isNaN(endMs) && endMs < now;

  const isItemCancelled = String(item?.status || "").toLowerCase() === "cancelled";
  const isTicketCancelled = ticket.status === "CANCELLED" || ticket.status === "FAILED" || Boolean(ticket.cancelledAt) || (typeof ticket.refundReason === "string" && /cancel/i.test(ticket.refundReason));
  const isCancelled = isItemCancelled || isTicketCancelled;

  let state = { label: isEvent ? t("ordConfirmed") : t("ordActive"), tone: "ok" };
  if (isCancelled) {
    state = {
      label: isItemCancelled
        ? (isEvent ? (language === "mn" ? "Эвент цуцлагдсан" : "Event Cancelled") : (language === "mn" ? "Курс цуцлагдсан" : "Course Cancelled"))
        : (t("obCancelled") || "Cancelled"),
      tone: "danger",
    };
  } else if (ticket.status === "CANCELLED" || ticket.status === "FAILED") {
    state = { label: t("obCancelled"), tone: "danger" };
  } else if (ticket.status === "REFUND_INITIATED") {
    state = { label: t("tdRefunding"), tone: "warn" };
  } else if (ticket.status === "REFUNDED") {
    state = { label: t("tdRefunded"), tone: "muted" };
  } else if (ticket.status === "PENDING") {
    state = { label: t("obPending"), tone: "warn" };
  } else if (ended) {
    state = { label: t("bdCompleted"), tone: "muted" };
  }

  const paid = ticket.status === "PAID";
  const free = ticket.paymentMethod === "FREE" || !Number(ticket.totalAmount);
  const title = isEvent ? item.eventTitle : item.courseTitle;
  const rawImage = Array.isArray(item.posterImage) ? item.posterImage[0] : item.posterImage;
  const image = rawImage ? getFullImageUrl(rawImage) : "";
  const batch = (item.batches || []).find((row) => String(row._id) === String(ticket.batchId));
  const selection = !isEvent && ticket.passType
    ? t("moPassLabel")
    : (batch?.batchName || ticket.ticketName || tickets[0]?.ticketName || "");
  const period = [shortDate(item.startDate, language), shortDate(!isEvent && ticket.passExpiryDate ? ticket.passExpiryDate : item.endDate, language)].filter(Boolean).join(" – ");
  const when = [shortDate(item.startDate, language), item.startTime].filter(Boolean).join(" · ");
  const weekly = [
    dayList(batch?.days, language),
    batch?.startTime && batch?.endTime ? `${batch.startTime} – ${batch.endTime}` : "",
  ].filter(Boolean).join(" · ");
  const venue = item.venueName || item.venueAddress?.venueName || "";
  const address = addressText(item.venueAddress);
  const ordered = shortDate(ticket.createdAt, language);
  const qty = ticket.qty || tickets.length || 1;
  const lineAmount = Number(ticket.basePrice) || Number(ticket.totalAmount) || 0;
  const discount = Number(ticket.discountAmount) || 0;
  const fees = Number(ticket.taxAmount) || 0;
  const organizer = item.createdBy || {};
  const organizerName = organizer.businessName
    || `${organizer.firstName || ""} ${organizer.lastName || ""}`.trim();
  const qrHref = `/TicketDetails?id=${ticket._id}&view=qr`;

  const rows = [];
  if (selection) rows.push({ k: isEvent ? t("tdTicketType") : t("bdCohort"), v: selection });
  if (isEvent && qty > 1) rows.push({ k: t("ordQty"), v: String(qty) });
  if (isEvent && when) rows.push({ k: t("dateAndTime"), v: when });
  if (!isEvent && period) rows.push({ k: t("bdCourseDates"), v: period });
  if (!isEvent && weekly) rows.push({ k: t("tdWeekly"), v: weekly });
  if (venue || address) rows.push({ k: t("tdLocation"), v: venue || address, sub: venue && address && address !== venue ? address : "" });
  // if (!isEvent) rows.push({ k: t("bdTeacher"), v: "—", plain: true });
  if (ordered) rows.push({ k: t("bdOrdered"), v: ordered });

  return (
    <div className="bk-page">
      <nav className="bk-crumb" aria-label="Breadcrumb">
        <Link href="/">{t("home")}</Link>
        <span>/</span>
        <Link href="/MyTickets">{t("bcOrders")}</Link>
        <span>/</span>
        <span>{ticket.bookingId}</span>
      </nav>

      <div className="bk-head">
        <div className="bk-headcopy">
          <span className="bk-pills">
            <span className={`bk-pill ${isEvent ? "event" : "course"}`}>{isEvent ? t("obEvent") : t("obCourse")}</span>
            <span className={`bk-pill ${state.tone}`}>{state.label}</span>
          </span>
          <h1>{title}</h1>
        </div>
        <span className="bk-thumb" style={image ? { backgroundImage: `url(${image})` } : undefined} />
      </div>

      {isCancelled && (
        <div className="bk-notice danger" style={{ marginTop: "18px" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <b style={{ display: "block", fontSize: "15px" }}>
              {isItemCancelled
                ? (isEvent
                  ? (language === "mn" ? "Энэ эвент цуцлагдсан байна" : "This event has been cancelled")
                  : (language === "mn" ? "Энэ курс цуцлагдсан байна" : "This course has been cancelled"))
                : (language === "mn" ? "Энэ захиалга цуцлагдсан байна" : "This booking has been cancelled")}
            </b>
            {ticket.refundReason && (
              <p style={{ margin: "4px 0 0", opacity: 0.95 }}>
                <span style={{ opacity: 0.8 }}>{language === "mn" ? "Шалтгаан: " : "Reason: "}</span>
                {ticket.refundReason}
              </p>
            )}
            {ticket.status === "REFUNDED" && (
              <p style={{ margin: "4px 0 0", opacity: 0.9, fontSize: "12.5px" }}>
                {language === "mn"
                  ? (ticket.refundedAt
                    ? `Төлбөр ${shortDate(ticket.refundedAt, language)}-нд буцаагдсан.`
                    : "Тасалбарын төлбөр буцаагдсан.")
                  : (ticket.refundedAt
                    ? `Payment was refunded on ${shortDate(ticket.refundedAt, language)}.`
                    : "Ticket payment has been refunded.")}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bk-split">
        <div className="bk-main">
          <section className="bk-card">
            <h2 className="bk-h2">{t("bdDetailsTitle")}</h2>
            <div className="bk-rows">
              {rows.map((row) => (
                <div className="bk-kv" key={row.k}>
                  <span className="bk-k">{row.k}</span>
                  <span className={`bk-v${row.plain ? " bk-plain" : ""}`}>
                    {row.v}
                    {row.sub && <><br /><span className="bk-vsub">{row.sub}</span></>}
                  </span>
                </div>
              ))}
            </div>
            <p className="bk-ref">{`${t("tdBookingNo")} · ${ticket.bookingId}`}</p>
          </section>

          <section className="bk-card">
            <h2 className="bk-h2">{t("bdPayment")}</h2>
            <div className="bk-rows">
              <div className="bk-kv">
                <span className="bk-k">{isEvent ? t("bdTicketPrice") : t("bdCoursePrice")}</span>
                <span className="bk-v">{free ? t("free") : money(lineAmount)}</span>
              </div>
              {!free && ticket.paymentMethod && (
                <div className="bk-kv">
                  <span className="bk-k">{t("tdPayMethod")}</span>
                  <span className="bk-v">{payLabel(ticket.paymentMethod, t)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="bk-kv">
                  <span className="bk-k">{t("bdDiscount")}</span>
                  <span className="bk-v bk-accent">{`-${money(discount)}`}</span>
                </div>
              )}
              {fees > 0 && (
                <div className="bk-kv">
                  <span className="bk-k">{t("bdFee")}</span>
                  <span className="bk-v">{money(fees)}</span>
                </div>
              )}
            </div>
            <div className="bk-total">
              <span>{t("bdTotal")}</span>
              <b>{free ? t("free") : money(ticket.totalAmount)}</b>
            </div>
          </section>

          {!free && ticket.refundPolicy && (
            <section className="bk-card">
              <h2 className="bk-h2">{t("bdRefundHead")}</h2>
              <p className="bk-policy">{ticket.refundPolicy}</p>
            </section>
          )}

          {organizerName && (
            <section className="bk-card">
              <h2 className="bk-h2">{t("organizer")}</h2>
              <div className="bk-org">
                <span
                  className="bk-avatar"
                  style={organizer.profileImage ? { backgroundImage: `url(${getFullImageUrl(organizer.profileImage)})` } : undefined}
                />
                <span className="bk-orgcopy">
                  <b>{organizerName}</b>
                  <span className="bk-verified">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 3 5 6v6c0 4.5 3.2 7.4 7 9 3.8-1.6 7-4.5 7-9V6l-7-3z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    {t("bdVerifiedOrg")}
                  </span>
                </span>
              </div>
              <div className="bk-orgact">
                {organizer._id && <Link href={`/Messagee?userId=${organizer._id}`} className="bk-mini fill">{t("bdContact")}</Link>}
                {organizer._id && <Link href={`/profile?id=${organizer._id}`} className="bk-mini line">{t("bdViewProfile")}</Link>}
              </div>
            </section>
          )}

          {paid && (
            <div className="bk-mobile-actions">
              <Link href={qrHref} className="bk-primary">{isEvent ? t("ordViewTicket") : t("bdShowQr")}</Link>
            </div>
          )}
          {isCancelled && (
            <div className="bk-mobile-actions">
              <Link
                href={qrHref}
                className="bk-primary"
                style={{
                  background: "rgba(255, 90, 90, 0.15)",
                  color: "#ff8a8a",
                  border: "1px solid rgba(255, 90, 90, 0.35)",
                }}
              >
                {isEvent ? t("ordViewTicket") : t("bdShowQr")}
              </Link>
            </div>
          )}
        </div>

        <aside className="bk-side bk-card">
          {paid && (
            <Link href={qrHref} className="bk-primary">{isEvent ? t("ordViewTicket") : t("bdShowQr")}</Link>
          )}
          {isCancelled && (
            <div style={{ textAlign: "center", padding: "10px 4px" }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(255, 90, 90, 0.15)",
                color: "#ff8a8a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 10px",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <b style={{ display: "block", fontSize: "15px", marginBottom: "6px", color: "#ff8a8a" }}>
                {isItemCancelled
                  ? (isEvent ? (language === "mn" ? "Эвент цуцлагдсан" : "Event Cancelled") : (language === "mn" ? "Курс цуцлагдсан" : "Course Cancelled"))
                  : (language === "mn" ? "Захиалга цуцлагдсан" : "Booking Cancelled")}
              </b>
              <p style={{ fontSize: "13px", color: "var(--bd-gray-400)", margin: "0 0 14px", lineHeight: 1.45 }}>
                {ticket.status === "REFUNDED"
                  ? (language === "mn" ? "Энэ тасалбар цуцлагдаж, төлбөр буцаагдсан байна." : "This ticket has been cancelled and refunded.")
                  : (ticket.refundReason || (language === "mn" ? "Энэ тасалбар хүчингүй болсон байна." : "This ticket is no longer valid."))}
              </p>
              <Link
                href={qrHref}
                className="bk-mini line"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  width: "100%",
                  color: "#ff8a8a",
                  borderColor: "rgba(255, 90, 90, 0.4)",
                  textDecoration: "none",
                }}
              >
                {isEvent ? t("ordViewTicket") : t("bdShowQr")}
              </Link>
            </div>
          )}
          {!paid && !isCancelled && (
            <div style={{ textAlign: "center", padding: "10px 4px" }}>
              <span className={`bk-pill ${state.tone}`} style={{ marginBottom: "8px" }}>{state.label}</span>
              <p style={{ fontSize: "13px", color: "var(--bd-gray-400)", margin: "8px 0 12px" }}>
                {state.label}
              </p>
              <Link href={qrHref} className="bk-mini line" style={{ display: "block", textAlign: "center" }}>
                {isEvent ? t("ordViewTicket") : t("bdShowQr")}
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
