"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";

export default function BookingConfirmed({
  item,
  isEvent = true,
  whenText,
  whereText,
  transaction,
  tickets = [],
  optionFallback = "",
}) {
  const { t } = useLanguage();
  const [ordersHref, setOrdersHref] = useState("/MyTickets");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("userProfile") || "null");
      if (saved?.role === "ORGANIZER" || saved?.roleId === 2 || saved?.userRole === "ORGANIZER") {
        setOrdersHref("/MyTicketsOrganiser");
      }
    } catch (err) {
      setOrdersHref("/MyTickets");
    }
  }, []);

  const total = Number(transaction?.totalAmount ?? 0);
  const free = total === 0;
  const code = transaction?.bookingId || transaction?.bookingReference || transaction?.bookingNumber || "BNDY-476742";
  const list = Array.isArray(tickets) && tickets.length > 0 ? tickets : [];

  const names = [...new Set(list.map((ticket) => ticket.ticketName).filter(Boolean))];
  const option = names.join(", ") || optionFallback || (isEvent ? "Prebook" : "Cohort");
  const poster = Array.isArray(item?.posterImage) ? item.posterImage[0] : item?.posterImage;
  const posterUrl = poster ? getFullImageUrl(poster) : "";
  const title = item?.eventTitle || item?.courseTitle || item?.title || "Image Test";

  const headline = free ? t("bcRegistered") : t("bcConfirmed");
  const sub = isEvent
    ? (free ? t("bcFreeTickets") : t("bcPaidTickets"))
    : (free ? t("bcFreeCourse") : t("bcPaidCourse"));
  const head = !isEvent
    ? t("bcYourReg")
    : (list.length > 1 ? t("bcYourTickets") : t("bcYourTicket"));

  return (
    <main className="bc-page">
      {/* ── 1. Hero / Status Icon ── */}
      <div className="bc-hero">
        <span className="bc-check" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="m8.2 12.2 2.5 2.5 5.1-5.4" />
          </svg>
        </span>
        <h1>{headline}</h1>
        <p>{sub}</p>
      </div>

      {/* ── 2. Unified Summary Card ── */}
      <div className="bc-summary-card">
        {/* Upper: Poster + Badge + Title + Date & Venue */}
        <section className="bc-sum">
          <span
            className="bc-thumb"
            style={posterUrl ? { backgroundImage: `url(${posterUrl})` } : undefined}
          />
          <span className="bc-copy">
            <span className="bc-badge">{isEvent ? t("bcBadgeEvent") : t("bcBadgeCourse")}</span>
            <b>{title}</b>
            <span className="bc-meta">
              {whenText ? <span>{whenText}</span> : null}
              {whereText ? <span>{whereText}</span> : null}
            </span>
          </span>
        </section>

        {/* Lower: Fact Rows */}
        <section className="bc-facts" data-free={free ? "1" : "0"}>
          <div data-fact="code">
            <span>{t("bcCode")}</span>
            <b>{code}</b>
          </div>
          <div data-fact="opt">
            <span>{isEvent ? t("bcTicket") : t("bcCohort")}</span>
            <b>{option}</b>
          </div>
          {!free && (
            <div data-fact="total">
              <span>{t("bcPaid")}</span>
              <b>{`₮${Math.round(total).toLocaleString("en-US")}`}</b>
            </div>
          )}
        </section>
      </div>

      {/* ── 3. Your Tickets ── */}
      {list.length > 0 && (
        <section className="bc-ticks">
          <div className="bc-tickHead">
            <h2>{head}</h2>
          </div>
          <div className="bc-grid">
            {list.map((ticket, index) => {
              const ticketNum = ticket.ticketNumber || `${code}-${index + 1}`;
              const qrVal = String(ticket.qrCodeData || ticketNum);
              return (
                <div className="bc-card" key={ticket._id || ticket.ticketNumber || index}>
                  {/* Left Ticket Icon */}
                  <span className="bc-ico" aria-hidden="true">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path d="M4 8.5A2.5 2.5 0 0 0 6.5 11 2.5 2.5 0 0 0 4 13.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5A2.5 2.5 0 0 0 17.5 11 2.5 2.5 0 0 0 20 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2.5Z" />
                    </svg>
                  </span>

                  {/* Middle Info */}
                  <span className="bc-cardT">
                    {list.length > 1 && (
                      <span className="bc-card-idx">{`${index + 1}/${list.length}`}</span>
                    )}
                    <b>{ticket.ticketName || option}</b>
                    <i className="bc-card-id">{ticketNum}</i>
                  </span>

                  {/* Right QR Code in White Box */}
                  <span className="bc-qr">
                    <QRCode
                      value={qrVal}
                      size={90}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox="0 0 90 90"
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 4. Bottom Actions ── */}
      <div className="bc-actions">
        <Link className="bc-go" href={ordersHref}>
          {t("bcOrders")}
        </Link>
        <Link className="bc-back" href="/">
          {t("bcHome")}
        </Link>
      </div>

      <style>{`
        .bc-page {
          max-width: 920px;
          margin: 0 auto;
          padding: clamp(28px, 3vw, 44px) clamp(20px, 4vw, 32px) clamp(56px, 5vw, 80px);
          box-sizing: border-box;
          width: 100%;
          color: #fff;
          font-family: var(--bd-font-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
        }
        .bc-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
        }
        .bc-check {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(35, 173, 164, 0.14);
          border: 1px solid var(--acc, #23ada4);
          color: var(--acc-bright, #36cec2);
          margin-bottom: 6px;
        }
        .bc-hero h1 {
          margin: 0;
          font-size: clamp(26px, 3.2vw, 38px);
          font-weight: 700;
          letter-spacing: -0.022em;
          color: #fff;
          line-height: 1.15;
        }
        .bc-hero p {
          margin: 0;
          max-width: 44ch;
          font-size: 15px;
          line-height: 1.5;
          color: #9a9a9a;
        }
        .bc-summary-card {
          margin-top: 32px;
          border-radius: 20px;
          background: var(--bd-ink-850, #161616);
          border: 1px solid var(--bd-border, rgba(255, 255, 255, 0.12));
          overflow: hidden;
          box-sizing: border-box;
          width: 100%;
        }
        .bc-sum {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          box-sizing: border-box;
        }
        .bc-thumb {
          width: 88px;
          height: 88px;
          border-radius: 16px;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: #111 center/cover no-repeat;
        }
        .bc-copy {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }
        .bc-badge {
          align-self: flex-start;
          height: 22px;
          padding: 0 10px;
          border-radius: 999px;
          background: rgba(35, 173, 164, 0.16);
          color: #36cec2;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
        }
        .bc-copy b {
          font-size: 19px;
          font-weight: 700;
          line-height: 1.25;
          color: #fff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bc-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          font-size: 13.5px;
          color: #9a9a9a;
        }
        .bc-facts {
          display: flex;
          flex-direction: column;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          box-sizing: border-box;
        }
        .bc-facts > div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px 20px;
        }
        .bc-facts > div + div {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .bc-facts span {
          font-size: 13.5px;
          color: #8a8a8a;
        }
        .bc-facts b {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          text-align: right;
          letter-spacing: -0.01em;
        }
        .bc-ticks {
          margin-top: 36px;
          width: 100%;
        }
        .bc-tickHead {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }
        .bc-tickHead h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.01em;
        }
        .bc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 12px;
          width: 100%;
          box-sizing: border-box;
        }
        .bc-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 18px;
          border-radius: 20px;
          background: var(--bd-ink-850, #161616);
          border: 1px dashed rgba(255, 255, 255, 0.22);
          width: 100%;
          box-sizing: border-box;
        }
        .bc-ico {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          flex-shrink: 0;
          border-radius: 16px;
          background: rgba(35, 173, 164, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #36cec2;
        }
        .bc-cardT {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
          min-width: 0;
        }
        .bc-card-idx {
          font-size: 12.5px;
          color: #8a8a8a;
        }
        .bc-cardT b {
          font-size: 15.5px;
          font-weight: 700;
          color: #fff;
          line-height: 1.25;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bc-card-id {
          font-style: normal;
          font-size: 12.5px;
          font-family: var(--bd-font-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace);
          color: #9a9a9a;
          letter-spacing: 0.03em;
        }
        .bc-qr {
          width: 104px;
          height: 104px;
          flex-shrink: 0;
          padding: 7px;
          box-sizing: border-box;
          border-radius: 14px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bc-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 36px;
        }
        .bc-go,
        .bc-back {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 48px;
          padding: 0 28px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          transition: all 200ms ease;
        }
        .bc-go {
          background: var(--acc, #23ada4);
          color: #fff;
        }
        .bc-go:hover {
          filter: brightness(1.1);
        }
        .bc-back {
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          font-weight: 600;
        }
        .bc-back:hover {
          border-color: var(--acc, #23ada4);
        }
        @media (max-width: 767px) {
          .bc-page {
            padding: 24px 16px 64px;
          }
          .bc-grid {
            grid-template-columns: 1fr;
          }
          .bc-actions {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            margin-top: 24px;
          }
          .bc-go,
          .bc-back {
            width: 100%;
            height: 52px;
          }
        }
      `}</style>
    </main>
  );
}
