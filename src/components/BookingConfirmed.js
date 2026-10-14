"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";

export default function BookingConfirmed({ item, isEvent, whenText, whereText, transaction, tickets, optionFallback }) {
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
  const code = transaction?.bookingId || "";
  const list = Array.isArray(tickets) ? tickets : [];
  const names = [...new Set(list.map((ticket) => ticket.ticketName).filter(Boolean))];
  const option = names.join(", ") || optionFallback || "";
  const poster = Array.isArray(item?.posterImage) ? item.posterImage[0] : item?.posterImage;
  const title = item?.eventTitle || item?.courseTitle || item?.title || "";

  const headline = free ? t("bcRegistered") : t("bcConfirmed");
  const sub = isEvent
    ? (free ? t("bcFreeTickets") : t("bcPaidTickets"))
    : (free ? t("bcFreeCourse") : t("bcPaidCourse"));
  const head = !isEvent
    ? t("bcYourReg")
    : (list.length > 1 ? t("bcYourTickets") : t("bcYourTicket"));

  return (
    <main className="bc-page">
      <div className="bc-hero">
        <span className="bc-check" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="m8.2 12.2 2.5 2.5 5.1-5.4" />
          </svg>
        </span>
        <h1>{headline}</h1>
        <p>{sub}</p>
      </div>

      <section className="bc-sum">
        <span className="bc-thumb" style={poster ? { backgroundImage: `url(${getFullImageUrl(poster)})` } : undefined} />
        <span className="bc-copy">
          <span className="bc-badge">{isEvent ? t("bcBadgeEvent") : t("bcBadgeCourse")}</span>
          <b>{title}</b>
          <span className="bc-meta">
            {whenText ? <span>{whenText}</span> : null}
            {whereText ? <span>{whereText}</span> : null}
          </span>
        </span>
      </section>

      <section className="bc-facts" data-free={free ? "1" : "0"}>
        <div>
          <span>{t("bcCode")}</span>
          <b>{code}</b>
        </div>
        <div>
          <span>{isEvent ? t("bcTicket") : t("bcCohort")}</span>
          <b>{option}</b>
        </div>
        {!free && (
          <div>
            <span>{t("bcPaid")}</span>
            <b>{`₮${Math.round(total).toLocaleString("en-US")}`}</b>
          </div>
        )}
      </section>

      <section className="bc-ticks">
        <div className="bc-tickHead">
          <h2>{head}</h2>
          <span>{isEvent ? t("bcShowTicket") : t("bcShowReg")}</span>
        </div>
        <div className="bc-grid">
          {list.map((ticket, index) => (
            <div className="bc-card" key={ticket._id || ticket.ticketNumber || index}>
              <span className="bc-ico" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M4 8.5A2.5 2.5 0 0 0 6.5 11 2.5 2.5 0 0 0 4 13.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5A2.5 2.5 0 0 0 17.5 11 2.5 2.5 0 0 0 20 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2.5Z" />
                </svg>
              </span>
              <span className="bc-cardT">
                {list.length > 1 ? <span>{`${index + 1}/${list.length}`}</span> : null}
                <b>{ticket.ticketName || option}</b>
                <i>{ticket.ticketNumber || (code ? `${code}-${index + 1}` : "")}</i>
              </span>
              {(ticket.qrCodeData || ticket.ticketNumber) && (
                <span className="bc-qr">
                  <QRCode value={String(ticket.qrCodeData || ticket.ticketNumber)} size={90} />
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

        <div className="bc-actions">
        <Link className="bc-go" href={ordersHref}>{t("bcOrders")}</Link>
        <Link className="bc-back" href="/">{t("bcHome")}</Link>
      </div>

      <style>{`
        .bc-page { max-width: 920px; margin: 0 auto; padding: 36px 24px 72px; }
        .bc-hero { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px; }
        .bc-check { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 50%; background: rgba(35,173,164,.14); border: 1px solid #23ada4; color: #36cec2; }
        .bc-hero h1 { margin: 0; font-size: clamp(28px, 3.2vw, 40px); font-weight: 700; letter-spacing: -.022em; color: #fff; }
        .bc-hero p { margin: 0; max-width: 46ch; font-size: 16px; line-height: 1.5; color: #9a9a9a; }
        .bc-sum { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 32px; padding: 20px; border-radius: 20px 20px 0 0; background: #161616; border: 1px solid rgba(255,255,255,.12); border-bottom: none; }
        .bc-thumb { width: 92px; height: 92px; border-radius: 16px; flex-shrink: 0; border: 1px solid rgba(255,255,255,.12); background: #111 center/cover no-repeat; }
        .bc-copy { display: flex; flex-direction: column; gap: 7px; flex: 1; min-width: 200px; }
        .bc-badge { align-self: flex-start; height: 22px; padding: 0 8px; border-radius: 999px; background: rgba(35,173,164,.16); color: #36cec2; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; }
        .bc-copy b { font-size: 19px; font-weight: 700; line-height: 1.25; color: #fff; }
        .bc-meta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; font-size: 13.5px; color: #9a9a9a; }
        .bc-facts { display: flex; flex-direction: column; background: #161616; border: 1px solid rgba(255,255,255,.12); border-top: none; border-radius: 0 0 20px 20px; overflow: hidden; }
        .bc-facts > div { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 20px; }
        .bc-facts > div + div { border-top: 1px solid rgba(255,255,255,.08); }
        .bc-facts span { font-size: 13.5px; color: #8a8a8a; }
        .bc-facts b { font-size: 16px; font-weight: 700; color: #fff; text-align: right; }
        .bc-ticks { margin-top: 32px; }
        .bc-tickHead { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
        .bc-tickHead h2 { margin: 0; font-size: 20px; font-weight: 700; color: #fff; }
        .bc-tickHead span { display: none; }
        .bc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 12px; }
        .bc-card { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 20px; background: #161616; border: 1px dashed rgba(255,255,255,.22); }
        .bc-ico { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; flex-shrink: 0; border-radius: 16px; background: rgba(35,173,164,.1); border: 1px solid rgba(255,255,255,.12); color: #36cec2; }
        .bc-cardT { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
        .bc-cardT span, .bc-cardT i { font-style: normal; font-size: 12.5px; color: #8a8a8a; }
        .bc-cardT b { font-size: 15px; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bc-qr { width: 104px; height: 104px; flex-shrink: 0; padding: 7px; box-sizing: border-box; border-radius: 14px; background: #fff; display: flex; align-items: center; justify-content: center; }
        .bc-actions { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; margin-top: 40px; }
        .bc-go, .bc-back { display: inline-flex; align-items: center; justify-content: center; height: 48px; padding: 0 26px; border-radius: 999px; font-size: 15px; font-weight: 700; text-decoration: none; }
        .bc-go { background: #23ada4; color: #fff; }
        .bc-back { border: 1px solid rgba(255,255,255,.2); color: #fff; font-weight: 600; }
        @media (max-width: 767px) {
          .bc-grid { grid-template-columns: 1fr; }
          .bc-actions { flex-direction: column; align-items: stretch; }
          .bc-go, .bc-back { width: 100%; height: 52px; }
        }
      `}</style>
    </main>
  );
}
