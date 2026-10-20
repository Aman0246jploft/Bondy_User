"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import reviewApi from "@/api/reviewApi";
import { useLanguage } from "@/context/LanguageContext";
import "./booking-detail-view.css";

function money(amount) {
  return `₮${(Number(amount) || 0).toLocaleString("en-US")}`;
}

function ymd(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
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

function Icon({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "alert") {
    return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></svg>;
  }
  if (name === "clock") {
    return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  }
  return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8L16 9.5" /></svg>;
}

export default function BookingDetailView({ data, ordersHref = "/MyTicketsOrganiser", qrHref = "" }) {
  const { t } = useLanguage();
  const ticket = data?.ticket;
  const tickets = data?.tickets || [];
  const course = ticket?.courseId || {};
  const courseId = course?._id || "";

  const [review, setReview] = useState(null);
  const [sheet, setSheet] = useState(false);
  const [done, setDone] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [ratingErr, setRatingErr] = useState(false);
  const [textErr, setTextErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sendErr, setSendErr] = useState("");

  useEffect(() => {
    if (!courseId) return undefined;
    let cancelled = false;
    reviewApi.getUserReviews({ limit: 200 }).then((res) => {
      if (cancelled) return;
      const mine = (res?.data?.reviews || []).find((row) => String(row?.entityId?._id || row?.entityId) === String(courseId));
      setReview(mine ? { reviewId: mine._id, rating: mine.rating, review: mine.review } : null);
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (!ticket) return null;

  const now = Date.now();
  const startMs = course.startDate ? new Date(course.startDate).getTime() : NaN;
  const endSource = ticket.passType && ticket.passExpiryDate ? ticket.passExpiryDate : course.endDate;
  const endMs = endSource ? new Date(endSource).getTime() : NaN;
  const ended = !Number.isNaN(endMs) && endMs < now;

  const isItemCancelled = String(course?.status || "").toLowerCase() === "cancelled";
  const isCancelled = isItemCancelled || ticket.status === "CANCELLED" || ticket.status === "FAILED" || Boolean(ticket.cancelledAt) || (typeof ticket.refundReason === "string" && /cancel/i.test(ticket.refundReason));

  let state = { label: t("bdOngoing"), tone: "ok" };
  if (isCancelled) {
    state = {
      label: isItemCancelled ? (language === "mn" ? "Курс цуцлагдсан" : "Course Cancelled") : (t("obCancelled") || "Cancelled"),
      tone: "danger",
    };
  } else if (ticket.status === "CANCELLED" || ticket.status === "FAILED") state = { label: t("obCancelled"), tone: "danger" };
  else if (ticket.status === "REFUND_INITIATED") state = { label: t("tdRefunding"), tone: "warn" };
  else if (ticket.status === "REFUNDED") state = { label: t("tdRefunded"), tone: "muted" };
  else if (ticket.status === "PENDING") state = { label: t("obPending"), tone: "warn" };
  else if (ended) state = { label: t("bdCompleted"), tone: "muted" };
  else if (!Number.isNaN(startMs) && startMs > now) state = { label: t("upcoming"), tone: "ok" };

  const paid = ticket.status === "PAID";
  const free = ticket.paymentMethod === "FREE" || !Number(ticket.totalAmount);
  const title = course.courseTitle || "";
  const image = Array.isArray(course.posterImage) ? course.posterImage[0] : "";
  const batch = (course.batches || []).find((row) => String(row._id) === String(ticket.batchId));
  const selection = ticket.passType ? t("moPassLabel") : (batch?.batchName || ticket.ticketName || tickets[0]?.ticketName || "");
  const periodEnd = ticket.passType && ticket.passExpiryDate ? ymd(ticket.passExpiryDate) : ymd(course.endDate);
  const period = [ymd(course.startDate), periodEnd].filter(Boolean).join(" – ");
  const weekly = [
    Array.isArray(batch?.days) ? batch.days.join(", ") : "",
    batch?.startTime && batch?.endTime ? `${batch.startTime} – ${batch.endTime}` : "",
  ].filter(Boolean).join(" · ");
  const override = Boolean(batch?.overrideLocation);
  const venue = (override ? batch?.venueName : course.venueName) || "";
  const address = addressText(override ? batch?.venueAddress : course.venueAddress);
  const ordered = ymd(ticket.createdAt);
  const attended = tickets.some((row) => row.isCheckedIn);

  const qty = ticket.qty || 1;
  const subtotal = Number(ticket.basePrice) || 0;
  const discount = Number(ticket.discountAmount) || 0;
  const fees = Number(ticket.taxAmount) || 0;
  const unitLine = qty > 1 ? `${money(subtotal / qty)} × ${qty}` : "";

  const organizer = course.createdBy || {};
  const organizerName = `${organizer.firstName || ""} ${organizer.lastName || ""}`.trim();

  let notice = null;
  if (ticket.status === "REFUND_INITIATED") {
    notice = { text: t("bdNoticeRefunding"), tone: "warn", icon: "clock" };
  } else if (isCancelled || ticket.status === "CANCELLED" || ticket.status === "FAILED" || ticket.status === "REFUNDED") {
    const refundedOn = ticket.refundedAt ? ymd(ticket.refundedAt) : "";
    const reason = ticket.refundReason ? ` (${ticket.refundReason})` : "";
    notice = {
      text: [
        isItemCancelled ? (language === "mn" ? "Курс цуцлагдсан." : "Course was cancelled.") : t("bdNoticeCancelled"),
        reason,
        refundedOn ? t("bdNoticeRefunded", { date: refundedOn }) : "",
      ].filter(Boolean).join(" "),
      tone: "danger",
      icon: "alert",
    };
  } else if (review) {
    notice = { text: t("bdNoticeReviewed", { rating: review.rating }), tone: "ok", icon: "ok" };
  }

  const canQr = paid;
  const canReview = paid && ended;
  const showRefund = !free && Boolean(ticket.refundPolicy);

  const openReview = () => {
    setRating(review?.rating || 0);
    setText(review?.review || "");
    setRatingErr(false);
    setTextErr(false);
    setSendErr("");
    setDone(false);
    setSheet(true);
  };

  const submitReview = async () => {
    if (busy) return;
    if (!rating) {
      setRatingErr(true);
      return;
    }
    const trimmed = text.trim();
    if (trimmed.split(/\s+/).filter(Boolean).length < 2) {
      setTextErr(true);
      return;
    }
    setBusy(true);
    setSendErr("");
    try {
      const res = review?.reviewId
        ? await reviewApi.updateReview(review.reviewId, { rating, review: trimmed })
        : await reviewApi.addReview({ entityId: courseId, entityModel: "Course", rating, review: trimmed });
      if (res?.status) {
        const saved = res.data?.review || res.data || {};
        setReview({ reviewId: review?.reviewId || saved._id || saved.reviewId || null, rating, review: trimmed });
        setDone(true);
      } else {
        setSendErr(res?.message || t("reviewSubmitFailed"));
      }
    } catch {
      setSendErr(t("reviewSubmitFailed"));
    } finally {
      setBusy(false);
    }
  };

  const rows = [];
  if (selection) rows.push({ k: t("tdSelectedClass"), v: selection });
  if (period) rows.push({ k: t("tdCoursePeriod"), v: period });
  if (weekly) rows.push({ k: t("tdWeekly"), v: weekly });
  if (venue || address) rows.push({ k: t("tdLocation"), v: venue, sub: address });
  if (ordered) rows.push({ k: t("bdOrdered"), v: ordered });
  if (attended) rows.push({ k: t("bdCheckin"), v: t("tdCheckedIn") });

  return (
    <div className="bk-page">
      <nav className="bk-crumb" aria-label="Breadcrumb">
        <Link href={ordersHref}>{t("bcOrders")}</Link>
        <span>/</span>
        <span>{ticket.bookingId}</span>
      </nav>

      <div className="bk-head">
        <div className="bk-headcopy">
          <span className="bk-pills">
            <span className="bk-pill course">{t("obCourse")}</span>
            <span className={`bk-pill ${state.tone}`}>{state.label}</span>
          </span>
          <h1>{title}</h1>
        </div>
        <span className="bk-thumb" style={image ? { backgroundImage: `url(${image})` } : undefined} />
      </div>

      {notice && (
        <div className={`bk-notice ${notice.tone}`}>
          <Icon name={notice.icon} />
          <span>{notice.text}</span>
        </div>
      )}

      <div className="bk-split">
        <div className="bk-main">
          <section className="bk-card">
            <h2 className="bk-h2">{t("bdInfo")}</h2>
            <div className="bk-rows">
              {rows.map((row) => (
                <div className="bk-kv" key={row.k}>
                  <span className="bk-k">{row.k}</span>
                  <span className="bk-v">
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
              {!free && (
                <div className="bk-kv">
                  <span className="bk-k bk-kcol">
                    <b>{t("bdCoursePrice")}</b>
                    {unitLine && <span>{unitLine}</span>}
                  </span>
                  <span className="bk-v">{money(subtotal)}</span>
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
              {!free && (
                <div className="bk-kv">
                  <span className="bk-k">{t("tdPayMethod")}</span>
                  <span className="bk-v">{payLabel(ticket.paymentMethod, t)}</span>
                </div>
              )}
              {!paid && !free && (
                <div className="bk-kv">
                  <span className="bk-k">{t("bdPayStatus")}</span>
                  <span className="bk-v"><span className={`bk-pill ${state.tone}`}>{state.label}</span></span>
                </div>
              )}
            </div>
            <div className={`bk-total ${free ? "flat" : ""}`}>
              <span>{t("bdTotal")}</span>
              <b>{free ? t("free") : money(ticket.totalAmount)}</b>
            </div>
          </section>

          {showRefund && (
            <section className="bk-card">
              <h2 className="bk-h2">{t("bdRefundTitle")}</h2>
              <p className="bk-policy">{ticket.refundPolicy}</p>
              {paid && (
                <p className="bk-policy-sub">
                  {Number(ticket.estimatedRefundAmount) > 0
                    ? t("bdRefundNow", { amount: money(ticket.estimatedRefundAmount) })
                    : t("bdNoRefundNow")}
                </p>
              )}
            </section>
          )}

          <section className="bk-card">
            <h2 className="bk-h2">{t("organizer")}</h2>
            <div className="bk-org">
              <span className="bk-avatar" style={organizer.profileImage ? { backgroundImage: `url(${organizer.profileImage})` } : undefined} />
              <b>{organizerName || t("organizer")}</b>
            </div>
            {organizer._id && (
              <div className="bk-orgact">
                <Link href={`/Message?userId=${organizer._id}`} className="bk-mini fill">{t("bdContact")}</Link>
                <Link href={`/profile?id=${organizer._id}`} className="bk-mini line">{t("bdViewProfile")}</Link>
              </div>
            )}
          </section>

          {(canQr || canReview) && (
            <div className="bk-mobile-actions">
              {canQr && qrHref && <Link href={qrHref} className="bk-primary">{t("bdViewQr")}</Link>}
              {canReview && (
                <button type="button" className="bk-ghost" onClick={openReview}>
                  {review ? t("bdReviewEdit") : t("bdReview")}
                </button>
              )}
            </div>
          )}
        </div>

        {(canQr || canReview) && (
          <aside className="bk-side bk-card">
            {canQr && qrHref && <Link href={qrHref} className="bk-primary">{t("bdViewQr")}</Link>}
            {canReview && (
              <button type="button" className="bk-ghost" onClick={openReview}>
                {review ? t("bdReviewEdit") : t("bdReview")}
              </button>
            )}
          </aside>
        )}
      </div>

      {sheet && (
        <div className="bk-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) setSheet(false); }}>
          <div className="bk-sheet" role="dialog" aria-modal="true">
            {done ? (
              <div className="bk-done">
                <span className="bk-doneico"><Icon name="ok" /></span>
                <b>{t("bdReviewDone")}</b>
                <p>{t("bdReviewDoneBody")}</p>
                <button type="button" className="bk-primary" onClick={() => setSheet(false)}>{t("close")}</button>
              </div>
            ) : (
              <>
                <div className="bk-sheethead">
                  <div>
                    <h2>{t("bdReview")}</h2>
                    <p>{title}</p>
                  </div>
                  <button type="button" className="bk-x" aria-label={t("close")} onClick={() => setSheet(false)}>×</button>
                </div>

                <div className="bk-field">
                  <span className="bk-label">{t("bdRating")} <i>*</i></span>
                  <div className="bk-stars">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className="bk-star"
                        aria-label={String(n)}
                        aria-selected={rating >= n}
                        onClick={() => { setRating(n); setRatingErr(false); }}
                      >
                        ★
                      </button>
                    ))}
                    {rating > 0 && <span className="bk-ratetxt">{t(`bdRate${rating}`)}</span>}
                  </div>
                  {ratingErr && <span className="bk-err">{t("bdRatingErr")}</span>}
                </div>

                <label className="bk-field">
                  <span className="bk-label">{t("bdComment")} <i>*</i></span>
                  <textarea
                    className="bk-in"
                    maxLength={300}
                    value={text}
                    placeholder={t("bdCommentPh")}
                    onChange={(e) => { setText(e.target.value); setTextErr(false); }}
                  />
                  <span className="bk-count">{`${text.length} / 300`}</span>
                  {textErr && <span className="bk-err">{t("reviewMinWords")}</span>}
                </label>

                {sendErr && <div className="bk-sendErr">{sendErr}</div>}

                <div className="bk-sheetacts">
                  <button type="button" className="bk-primary" disabled={busy} onClick={submitReview}>
                    {busy ? t("submitting") : t("bdReviewSend")}
                  </button>
                  <button type="button" className="bk-ghost" disabled={busy} onClick={() => setSheet(false)}>{t("cancel")}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
