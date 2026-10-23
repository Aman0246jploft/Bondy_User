"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";
import bookingApi from "@/api/bookingApi";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import GlobalLoader from "@/components/GlobalLoader";
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
  if (name === "mail") {
    return (
      <svg {...common}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
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

function shortDate(value, language) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(language === "mn" ? "mn-MN" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function clientWhen(item, language) {
  if (!item?.startDate && !item?.startTime) return "";
  const date = item?.startDate ? new Date(item.startDate) : null;
  const day = date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(language === "mn" ? "mn-MN" : "en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
    })
    : "";
  return [day, item?.startTime].filter(Boolean).join(" · ");
}

function cleanTicketName(rawName) {
  if (!rawName) return "";
  const parts = String(rawName)
    .split(",")
    .map((s) => s.replace(/\s*\(x\d+\)/gi, "").trim())
    .filter(Boolean);
  const unique = [...new Set(parts)];
  return unique.join(", ");
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
  const [savingQr, setSavingQr] = useState(false);
  const cardRef = useRef(null);

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
    return <GlobalLoader fullScreen={false} />;
  }
  if (failed || !ticket) {
    return <div className="td-state-page"><b>{t("tdNotFound")}</b></div>;
  }

  const isCourse = ticket.bookingType === "COURSE";
  const item = isCourse ? ticket.courseId : ticket.eventId;
  const title = isCourse ? item?.courseTitle : item?.eventTitle;
  const rawImage = Array.isArray(item?.posterImage) ? item.posterImage[0] : (item?.posterImage || "");
  const image = !rawImage
    ? ""
    : rawImage.startsWith("http://") || rawImage.startsWith("https://")
      ? rawImage
      : getFullImageUrl(rawImage);
  const when = showCustomerNav
    ? clientWhen(item, language)
    : [dateText(item?.startDate, language), item?.startTime].filter(Boolean).join(" · ");
  const where = placeText(item);
  const buyerName = `${ticket.userId?.firstName || ""} ${ticket.userId?.lastName || ""}`.trim();
  const buyerEmail = ticket.userId?.email || ticket.email || "";
  const qty = ticket.qty || tickets.length || 1;
  const free = ticket.paymentMethod === "FREE" || !Number(ticket.totalAmount);
  const isItemCancelled = String(item?.status || "").toLowerCase() === "cancelled";
  const isCancelled = isItemCancelled || ticket.status === "CANCELLED" || ticket.status === "FAILED" || Boolean(ticket.cancelledAt) || (typeof ticket.refundReason === "string" && /cancel/i.test(ticket.refundReason));
  const dead = isCancelled || ["CANCELLED", "FAILED", "REFUND_INITIATED", "REFUNDED"].includes(ticket.status);
  const current = tickets[selected] || null;
  const option = cleanTicketName(current?.ticketName || ticket.ticketName || tickets[0]?.ticketName) || (isCourse ? "Cohort" : "Ticket");
  const person = `${current?.firstName || ""} ${current?.lastName || ""}`.trim() || buyerName;
  const email = current?.email || current?.userId?.email || buyerEmail;
  const code = current?.ticketNumber || ticket.bookingId || "";
  const isTicketNumber = Boolean(
    current?.ticketNumber ||
    (code && typeof code === "string" && code.startsWith("TKT-")) ||
    (code && code !== ticket.bookingId)
  );
  const rawQr = current?.qrCodeData || (!tickets.length ? ticket.qrCodeData : "");
  // A real ticket code is a short token. Some records carry the payment invoice's
  // base64 image in this field, which is far too long to encode and is not a ticket code.
  const qr = typeof rawQr === "string" && rawQr.length <= 1000 && !rawQr.startsWith("data:") ? rawQr : "";
  const checkedIn = Boolean(current?.isCheckedIn);

  let stateLabel = t("tdValid");
  let stateNote = isCourse ? t("tdScanCourse") : t("tdScanEvent");
  let stateClass = "ok";
  if (isCancelled) {
    stateLabel = isItemCancelled
      ? (isCourse
          ? (language === "mn" ? "Курс цуцлагдсан" : "Course Cancelled")
          : (language === "mn" ? "Эвент цуцлагдсан" : "Event Cancelled"))
      : (t("obCancelled") || "Cancelled");
    stateNote = ticket.refundReason
      || (isItemCancelled
          ? (language === "mn" ? "Зохион байгуулагч уг эвент/курсийг цуцалсан тул тасалбар хүчингүй болсон байна." : "This event/course was cancelled by the organizer. The ticket is no longer valid.")
          : t("tdCancelledNote"));
    stateClass = "bad";
  } else if (ticket.status === "CANCELLED" || ticket.status === "FAILED") {
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
  const dayNames = { Mon: "Да", Tue: "Мя", Wed: "Лха", Thu: "Пү", Fri: "Ба", Sat: "Бя", Sun: "Ням" };
  const dayText = Array.isArray(batch?.days)
    ? batch.days.map((day) => (showCustomerNav && language === "mn" ? (dayNames[day] || day) : day)).join(", ")
    : "";
  const period = showCustomerNav
    ? [shortDate(item?.startDate, language), shortDate(item?.endDate, language)].filter(Boolean).join(" – ")
    : [dateText(item?.startDate, language), dateText(item?.endDate, language)].filter(Boolean).join(" – ");
  const weekly = [dayText, batch?.startTime && batch?.endTime ? `${batch.startTime} – ${batch.endTime}` : ""].filter(Boolean).join(" · ");

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

      <h1 className="td-title">{showCustomerNav && isCourse ? t("tdCourseHeading") : t("tdHeading")}</h1>

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
        <div className="td-split" data-pick={tickets.length > 1 ? "some" : "none"}>
          {tickets.length > 1 && (
            <div className="td-picker">
              {tickets.map((row, index) => {
                const rowName = cleanTicketName(row.ticketName) || option;
                const rowPerson = `${row.firstName || ""} ${row.lastName || ""}`.trim() || buyerName;
                return (
                  <button
                    key={row._id || row.ticketNumber || index}
                    type="button"
                    className="td-tk"
                    aria-selected={index === selected}
                    onClick={() => setSelected(index)}
                  >
                    <span className="td-tk-n">{index + 1}</span>
                    <span className="td-tk-t">{rowName}</span>
                    <span className="td-tk-s">{rowPerson}</span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="td-panel">
            <div className="td-rows">
              {person && (
                <span className="td-r"><Icon name="user" /><span className="td-k">{t("tdName")}</span><b className="td-v">{person}</b></span>
              )}
              {isCourse && title && !showCustomerNav && (
                <span className="td-r"><Icon name="list" /><span className="td-k">{t("obCourse")}</span><b className="td-v">{title}</b></span>
              )}
              {(isCourse ? (batch?.batchName || option) : option) && (
                <span className="td-r">
                  <Icon name="ticket" />
                  <span className="td-k">{isCourse ? (showCustomerNav ? t("bdCohort") : t("tdSelectedClass")) : t("tdTicketType")}</span>
                  <b className="td-v">{isCourse ? (batch?.batchName || option) : option}</b>
                </span>
              )}
              {isCourse && period && (
                <span className="td-r"><Icon name="cal" /><span className="td-k">{showCustomerNav ? t("bdCourseDates") : t("tdCoursePeriod")}</span><b className="td-v">{period}</b></span>
              )}
              {isCourse && weekly && (
                <span className="td-r"><Icon name="cal" /><span className="td-k">{t("tdWeekly")}</span><b className="td-v">{weekly}</b></span>
              )}
              {isCourse && where && (
                <span className="td-r"><Icon name="pin" /><span className="td-k">{t("tdLocation")}</span><b className="td-v">{where}</b></span>
              )}
              {code && (
                <span className="td-r">
                  <Icon name={isTicketNumber ? "ticket" : "list"} />
                  <span className="td-k">{isTicketNumber ? t("tdTicketNo") : t("tdBookingNo")}</span>
                  <b className="td-v">{code}</b>
                </span>
              )}
            </div>
            <div className="td-qr">
              {qr && (
                <span className={`td-qr-box ${dead ? "dead" : ""}`} style={{ position: "relative" }}>
                  <QRCode value={qr} size={150} style={{ width: "100%", height: "100%" }} />
                  {isCancelled && (
                    <span style={{
                      position: "absolute",
                      inset: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(20, 20, 20, 0.82)",
                      borderRadius: "12px",
                      color: "#ff6b6b",
                      fontWeight: 800,
                      fontSize: "14px",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      border: "2px solid #ff6b6b",
                      transform: "rotate(-12deg)",
                      pointerEvents: "none",
                    }}>
                      {language === "mn" ? "ЦУЦЛАГДСАН" : "CANCELLED"}
                    </span>
                  )}
                </span>
              )}
              <span className={`td-pill ${stateClass}`}>{stateLabel}</span>
              {checkedIn && <span className="td-pill check">{t("tdCheckedIn")}</span>}
              {stateNote && <p>{stateNote}</p>}
            </div>
          </div>
        </div>
      </section>

      {showCustomerNav && qr && !dead && (
        <button
          type="button"
          className="td-save"
          disabled={savingQr}
          onClick={async () => {
            if (savingQr) return;
            try {
              setSavingQr(true);
              if (!cardRef.current) return;
              const html2canvas = (await import("html2canvas")).default;
              const canvas = await html2canvas(cardRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
              });
              const image = canvas.toDataURL("image/png");
              const link = document.createElement("a");
              link.href = image;
              link.download = `checkin-${code || ticket.bookingId || "ticket"}.png`;
              link.click();
            } catch (err) {
              console.error("Failed to generate check-in card:", err);
              toast.error(language === "mn" ? "Зураг татахад алдаа гарлаа" : "Failed to download check-in card");
            } finally {
              setSavingQr(false);
            }
          }}
        >
          {savingQr ? (language === "mn" ? "Бэлтгэж байна..." : "Saving...") : t("tdSaveQr")}
        </button>
      )}

      {/* Offscreen high-res check-in card for image export */}
      {qr && !dead && (
        <div className="td-export-stage" aria-hidden="true">
          <div ref={cardRef} className="td-checkin-card">
            {/* Top wave styling */}
            <svg
              className="td-card-waves"
              viewBox="0 0 440 640"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              {/* Top-left decorative teal wave */}
              <path
                d="M-40 -40 L160 -40 C140 25 80 75 -40 85 Z"
                fill="#169b8f"
                opacity="0.95"
              />
              <path
                d="M-30 -30 L110 -30 C100 20 60 55 -30 65 Z"
                fill="#27c5b6"
                opacity="0.65"
              />
              {/* Top-right decorative teal wave */}
              <path
                d="M360 -40 L480 -40 L480 85 C420 70 380 20 360 -40 Z"
                fill="#169b8f"
                opacity="0.95"
              />
              {/* Bottom decorative wave layers */}
              <path
                d="M-40 610 C90 570 210 635 340 595 C390 580 440 585 480 595 L480 680 L-40 680 Z"
                fill="#23ada4"
                opacity="0.9"
              />
              <path
                d="M-40 630 C120 600 260 650 480 610 L480 680 L-40 680 Z"
                fill="#0e7a71"
                opacity="0.85"
              />
            </svg>

            <div className="td-card-content">
              {/* Brand Logo Header */}
              <div className="td-card-brand">
                <img
                  src="/assets/logo/bondy-logo.svg"
                  alt="Bondy"
                  style={{ height: 38, width: "auto" }}
                />
              </div>

              {/* Title & Prompt */}
              <div className="td-card-heading">
                <div className="td-card-title-row">
                  {/* Left decorative sparkle rays */}
                  <span className="td-card-sparkle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#23ada4" strokeWidth="2.8" strokeLinecap="round">
                      <line x1="12" y1="4" x2="12" y2="8" />
                      <line x1="5" y1="12" x2="9" y2="12" />
                      <line x1="7" y1="7" x2="10" y2="10" />
                    </svg>
                  </span>

                  <h2 className="td-card-h">{t("qrScanCheckIn")}</h2>

                  {/* Right decorative sparkle rays */}
                  <span className="td-card-sparkle td-card-sparkle-flip">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#23ada4" strokeWidth="2.8" strokeLinecap="round">
                      <line x1="12" y1="4" x2="12" y2="8" />
                      <line x1="5" y1="12" x2="9" y2="12" />
                      <line x1="7" y1="7" x2="10" y2="10" />
                    </svg>
                  </span>
                </div>
                <p className="td-card-desc">
                  {isCourse ? t("qrScanCourseDesc") : t("qrScanDesc")}
                </p>
              </div>

              {/* QR Code with Teal Rounded Frame */}
              <div className="td-card-qr-frame">
                <QRCode
                  value={qr}
                  size={200}
                  level="M"
                  style={{ display: "block", borderRadius: 14 }}
                />
              </div>

              {/* Event / Course Info Box */}
              <div className="td-card-info-box">
                <div className="td-card-info-grid">
                  {/* Date Column */}
                  <div className="td-card-info-item">
                    <span className="td-card-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </span>
                    <div className="td-card-text">
                      <span className="td-card-lbl">{t("date") || "Date"}</span>
                      <b className="td-card-val">
                        {isCourse && period
                          ? period
                          : (item?.startDate
                              ? new Date(item.startDate).toLocaleDateString(language === "mn" ? "mn-MN" : "en-US", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—")}
                      </b>
                      {item?.startDate && !isCourse && (
                        <span className="td-card-sub">
                          ({new Date(item.startDate).toLocaleDateString(language === "mn" ? "mn-MN" : "en-US", { weekday: "long" })})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time Column */}
                  <div className="td-card-info-item">
                    <span className="td-card-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </span>
                    <div className="td-card-text">
                      <span className="td-card-lbl">{language === "mn" ? "Цаг" : "Time"}</span>
                      <b className="td-card-val">
                        {isCourse
                          ? (batch?.startTime && batch?.endTime
                              ? `${batch.startTime} – ${batch.endTime}`
                              : (weekly || item?.startTime || "—"))
                          : ([item?.startTime, item?.endTime].filter(Boolean).join(" – ") || item?.startTime || "—")}
                      </b>
                      {isCourse && dayText && (
                        <span className="td-card-sub">{dayText}</span>
                      )}
                    </div>
                  </div>

                  {/* Location (Full Row) */}
                  <div className="td-card-info-item full-width">
                    <span className="td-card-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <div className="td-card-text">
                      <span className="td-card-lbl">{t("location") || "Location"}</span>
                      <b className="td-card-val">
                        {item?.venueAddress?.venueName || item?.venue?.venueName || title || "Bondy"}
                      </b>
                      {(item?.venueAddress?.address || item?.venueAddress?.city || where) && (
                        <span className="td-card-sub">
                          {[item?.venueAddress?.address, item?.venueAddress?.city].filter(Boolean).join(", ") || where}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Thank you note */}
              <div className="td-card-footer">
                <div className="td-card-thank-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#23ada4" strokeWidth="2.8" strokeLinecap="round">
                    <line x1="5" y1="12" x2="9" y2="12" />
                    <line x1="7" y1="7" x2="10" y2="10" />
                  </svg>
                  <span>{t("qrThankYou")}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#23ada4" strokeWidth="2.8" strokeLinecap="round" style={{ transform: "scaleX(-1)" }}>
                    <line x1="5" y1="12" x2="9" y2="12" />
                    <line x1="7" y1="7" x2="10" y2="10" />
                  </svg>
                </div>
                <p className="td-card-thank-sub">
                  {isCourse ? t("qrThankYouCourseDesc") : t("qrThankYouDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="td-cta">
        <Link href={ordersHref || "/MyTickets"} className="td-cta-main">{t("bcOrders")}</Link>
        <Link href="/" className="td-cta-ghost">{t("bcHome")}</Link>
      </div>
    </div>
  );
}
