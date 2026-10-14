"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import organizerApi from "@/api/organizerApi";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import DateRangeCalendarPopover from "@/components/DateRangeCalendarPopover";

const TOP_N = 5;
const MONTHS = ["monthJan", "monthFeb", "monthMar", "monthApr", "monthMay", "monthJun", "monthJul", "monthAug", "monthSep", "monthOct", "monthNov", "monthDec"];

function page() {
  const { t, language } = useLanguage();
  const rangeAnchorRef = useRef(null);
  const [range, setRange] = useState("month");
  const [pickOpen, setPickOpen] = useState(false);
  const [pickStart, setPickStart] = useState("");
  const [pickEnd, setPickEnd] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [summary, setSummary] = useState({ totalViews: 0, totalBookings: 0, averageBookingRate: 0 });
  const [listings, setListings] = useState([]);

  const rangeParams = (key, start, end) => {
    if (key === "d7") return { filter: "7d" };
    if (key === "d30") return { filter: "30d" };
    if (key === "month") return { filter: "thisMonth" };
    if (key === "custom" && start && end) return { filter: "custom", startDate: start, endDate: end };
    return {};
  };

  const load = useCallback(async (key, start, end) => {
    if (key === "custom" && (!start || !end)) return;
    try {
      setLoading(true);
      setFailed(false);
      const res = await organizerApi.getListingAnalytics({
        ...rangeParams(key, start, end),
        page: 1,
        limit: 100,
      });
      if (res?.status) {
        setSummary(res.data?.summary || { totalViews: 0, totalBookings: 0, averageBookingRate: 0 });
        setListings(res.data?.listings || []);
      } else {
        setFailed(true);
      }
    } catch (err) {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Analytics - Bondy";
    load("month");
  }, [load]);

  const spanLabel = () => {
    const now = new Date();
    const day = (n) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - n);
    const label = (a, b) => {
      const left = `${t(MONTHS[a.getMonth()])} ${a.getDate()}`;
      if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
        return `${left} – ${b.getDate()}`;
      }
      return `${left} – ${t(MONTHS[b.getMonth()])} ${b.getDate()}`;
    };
    if (range === "month") return label(new Date(now.getFullYear(), now.getMonth(), 1), now);
    if (range === "d7") return label(day(6), now);
    if (range === "d30") return label(day(29), now);
    if (range === "custom" && pickStart && pickEnd) {
      const [ys, ms, ds] = pickStart.split("-").map(Number);
      const [ye, me, de] = pickEnd.split("-").map(Number);
      return label(new Date(ys, ms - 1, ds), new Date(ye, me - 1, de));
    }
    return t("anAll");
  };

  const money = (n) => `₮${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
  const num = (n) => Math.round(Number(n) || 0).toLocaleString("en-US");
  const shown = showAll ? listings : listings.slice(0, TOP_N);
  const rate = Number(summary.averageBookingRate ?? summary.bookingRate ?? 0);

  const poster = (item) => {
    const src = item.posterImage;
    if (!src) return "";
    if (String(src).startsWith("http") || String(src).startsWith("/")) return src;
    return getFullImageUrl(src);
  };

  return (
    <div className="an-page">
      <p className="an-sub">{t("anPageSub")}</p>
      <div className="an-tools">
        <span className="an-sel" ref={rangeAnchorRef}>
          <select
            aria-label={t("pyChooseDate")}
            value={pickOpen ? "custom" : range}
            onChange={(e) => {
              const v = e.target.value;
              setShowAll(false);
              if (v === "custom") {
                setPickOpen(true);
                return;
              }
              setPickOpen(false);
              setRange(v);
              load(v);
            }}
          >
            <option value="all">{t("anAll")}</option>
            <option value="d7">{t("pyLast7")}</option>
            <option value="d30">{t("anLast30")}</option>
            <option value="month">{t("pyThisMonth")}</option>
            <option value="custom">{t("pyChooseDate")}</option>
          </select>
          {pickOpen && (
            <DateRangeCalendarPopover
              anchorRef={rangeAnchorRef}
              initialFrom={pickStart}
              initialTo={pickEnd}
              language={language}
              t={t}
              onApply={(isoA, isoB) => {
                setPickStart(isoA);
                setPickEnd(isoB);
                setRange("custom");
                setPickOpen(false);
                load("custom", isoA, isoB);
              }}
              onCancel={() => setPickOpen(false)}
            />
          )}
        </span>
        <span className="an-range">{spanLabel()}</span>
      </div>

      <div className="an-kpi">
        <div className="an-k">
          <span className="an-kI" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
          </span>
          <small>{t("anViews")}</small>
          <b>{loading ? "…" : num(summary.totalViews)}</b>
        </div>
        <div className="an-k">
          <span className="an-kI" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
          </span>
          <small>{t("anOrders")}</small>
          <b>{loading ? "…" : num(summary.totalBookings)}</b>
        </div>
        <div className="an-k">
          <span className="an-kI" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></svg>
          </span>
          <small>{t("anConv")}</small>
          <b>{loading ? "…" : `${rate.toFixed(2)}%`}</b>
        </div>
      </div>

      <section className="an-card">
        <div className="an-cardHead">
          <h2>{t("anTop")}</h2>
          {listings.length > TOP_N && (
            <button type="button" onClick={() => setShowAll((v) => !v)}>
              {showAll ? t("pdShowLess") : t("pdSeeAll")}
            </button>
          )}
        </div>
        {loading ? (
          <div className="an-skelWrap">
            <div className="an-skel" />
            <div className="an-skel" />
            <div className="an-skel" />
          </div>
        ) : failed ? (
          <div className="an-empty">
            <b>{t("anFail")}</b>
            <button type="button" className="an-go" onClick={() => load(range, pickStart, pickEnd)}>{t("pyRetry")}</button>
          </div>
        ) : listings.length === 0 ? (
          <div className="an-empty">
            <b>{t("anEmpty")}</b>
            <p>{t("anEmptyBody")}</p>
          </div>
        ) : (
          <div className="an-table">
            <div className="an-row an-head">
              <span>{t("anListing")}</span>
              <span>{t("anViews")}</span>
              <span>{t("anOrders")}</span>
              <span>{t("anRevenue")}</span>
            </div>
            {shown.map((item) => (
              <div className="an-row" key={item.id || item.eventId}>
                <span className="an-who">
                  <span className="an-thumb" style={poster(item) ? { backgroundImage: `url(${poster(item)})` } : undefined} />
                  <span>
                    <b>{item.title || item.eventTitle}</b>
                    <i>{item.type === "Course" ? t("anKindCourse") : t("anKindEvent")}</i>
                  </span>
                </span>
                <span className="an-v"><i>{t("anViews")}</i>{num(item.views)}</span>
                <span className="an-v an-orders"><i>{t("anOrders")}</i>{num(item.bookings)}</span>
                <span className="an-v"><i>{t("anRevenue")}</i>{money(item.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default page;
