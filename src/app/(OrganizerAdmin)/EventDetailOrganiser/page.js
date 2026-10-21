"use client";

import Link from "next/link";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Spinner } from "react-bootstrap";
import { useRouter, useSearchParams } from "next/navigation";
import eventApi from "@/api/eventApi";
import bookingApi from "@/api/bookingApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";
import PromotionPlanModal from "@/components/Promotion/PromotionPlanModal";
import GlobalLoader from "@/components/GlobalLoader";

const money = (n) => `₮${Number(n || 0).toLocaleString("en-US")}`;

function Icon({ name, size = 15 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, style: { flexShrink: 0 } };
  if (name === "eye") {
    return <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
  }
  if (name === "promote") {
    return <svg {...common}><path d="M4 10.4v3.2a1.6 1.6 0 0 0 1.6 1.6h1.7L14 19.4V4.6L7.3 8.8H5.6A1.6 1.6 0 0 0 4 10.4Z" /><path d="M17.2 8.6a4.6 4.6 0 0 1 0 6.8" /><path d="M19.2 6.4a8 8 0 0 1 0 11.2" /></svg>;
  }
  if (name === "edit") {
    return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>;
  }
  if (name === "ticket") {
    return <svg {...common}><path d="M3 8a2 2 0 0 0 0 4v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0 0-4V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2Z" /><path d="M13 6v12" strokeDasharray="2 3" /></svg>;
  }
  if (name === "wallet") {
    return <svg {...common}><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h12A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-12A2.5 2.5 0 0 1 3 16.5v-9Z" /><path d="M3 9h14a2 2 0 0 1 2 2v1.2" /><circle cx="16.2" cy="12.6" r="1" fill="currentColor" stroke="none" /></svg>;
  }
  if (name === "users") {
    return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="3" /><path d="M20 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 4.13a3 3 0 0 1 0 5.75" /></svg>;
  }
  if (name === "atom") {
    return <svg {...common}><circle cx="12" cy="12" r="2" /><ellipse cx="12" cy="12" rx="9" ry="4" /><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)" /></svg>;
  }
  if (name === "chair") {
    return <svg {...common}><path d="M7 11V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5" /><path d="M5 11h14v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3Z" /><path d="M8 16v4M16 16v4" /></svg>;
  }
  if (name === "pin") {
    return <svg {...common}><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.4" /></svg>;
  }
  if (name === "calendar") {
    return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
  }
  if (name === "clock") {
    return <svg {...common}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" /></svg>;
  }
  if (name === "shield") {
    return <svg {...common}><path d="M12 3 5 6v6c0 4.2 2.8 7.2 7 9 4.2-1.8 7-4.8 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
  }
  if (name === "list") {
    return <svg {...common}><path d="M8 6h12M8 12h12M8 18h12" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></svg>;
  }
  return null;
}

const MONTH_KEYS = ["monthJan", "monthFeb", "monthMar", "monthApr", "monthMay", "monthJun", "monthJul", "monthAug", "monthSep", "monthOct", "monthNov", "monthDec"];
const WEEKDAY_KEYS = ["weekdaySun", "weekdayMon", "weekdayTue", "weekdayWed", "weekdayThu", "weekdayFri", "weekdaySat"];

function formatDay(value, t, withWeekday) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const monthDay = `${t(MONTH_KEYS[date.getMonth()])} ${date.getDate()}`;
  if (!withWeekday) return monthDay;
  return `${monthDay}, ${t(WEEKDAY_KEYS[date.getDay()])}`;
}

function formatOrderDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}.${dd}.${date.getFullYear()}`;
}

function ageLabel(value, isMn) {
  if (!value || value === "ALL") return isMn ? "Бүх нас" : "All ages";
  if (typeof value === "string") return value;
  if (value.minAge && value.maxAge) return `${value.minAge}–${value.maxAge}`;
  if (value.minAge) return `${value.minAge}+`;
  return "";
}

function refundLabel(value, isMn) {
  const map = {
    "No Refund": isMn ? "Буцаан олголтгүй" : "No refund",
    "1 Day Before": isMn ? "1 хоногийн өмнө" : "1 day before",
    "7 Days Before": isMn ? "7 хоногийн өмнө" : "7 days before",
  };
  return map[value] || value || "";
}

function venueLine(event) {
  const address = event.venueAddress || {};
  return [event.venueName, address.address, address.city].filter(Boolean).join(", ");
}

function buildChart(series) {
  const points = Array.isArray(series) ? series : [];
  if (!points.length) return null;
  const max = Math.max(...points.map((p) => Number(p.tickets) || 0), 1);
  const width = 600;
  const top = 22;
  const bottom = 150;
  const coords = points.map((p, index) => {
    const x = points.length === 1 ? width / 2 : 8 + (index / (points.length - 1)) * (width - 16);
    const y = bottom - ((Number(p.tickets) || 0) / max) * (bottom - top);
    return [x, y];
  });
  const line = coords.map((p, index) => `${index ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const labels = [];
  const step = Math.max(1, Math.ceil(points.length / 6));
  points.forEach((p, index) => {
    if (index % step === 0 || index === points.length - 1) labels.push(p.date);
  });
  return {
    line,
    area: `${line} L${coords[coords.length - 1][0].toFixed(1)} 158 L${coords[0][0].toFixed(1)} 158 Z`,
    coords,
    max,
    labels,
  };
}

function EventDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get("eventId");
  const { language, t } = useLanguage();
  const isMn = language === "mn";

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [showExternal, setShowExternal] = useState(false);
  const [externalDraft, setExternalDraft] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [bookingsList, setBookingsList] = useState([]);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsSearch, setBookingsSearch] = useState("");
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(0);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsRange, setAnalyticsRange] = useState("all");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [pickStart, setPickStart] = useState("");
  const [pickEnd, setPickEnd] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [hoverIndex, setHoverIndex] = useState(null);

  const copy = {
    title: isMn ? "Эвентийн дэлгэрэнгүй" : "Event details",
    sub: isMn ? "Тасалбар, захиалга, оролцогчийн мэдээлэл" : "Tickets, bookings and attendee details",
    events: isMn ? "Эвент" : "Events",
    publicPage: isMn ? "Нийтийн хуудсыг харах" : "View public page",
    promote: isMn ? "Сурталчлах" : "Promote",
    edit: isMn ? "Засах" : "Edit",
    overview: isMn ? "Тойм" : "Overview",
    bookings: isMn ? "Захиалга" : "Bookings",
    analytics: isMn ? "Аналитик" : "Analytics",
    sold: isMn ? "Зарагдсан тасалбар" : "Tickets sold",
    external: isMn ? "Гаднын захиалга" : "External bookings",
    editExternal: isMn ? "Гаднын захиалга засах" : "Edit external bookings",
    addExternal: isMn ? "Гаднын захиалга нэмэх" : "Add external bookings",
    remaining: isMn ? "Үлдсэн" : "Remaining",
    capacity: isMn ? "Нийт багтаамж" : "Total capacity",
    info: isMn ? "Эвентийн мэдээлэл" : "Event information",
    summary: isMn ? "Товч танилцуулга" : "Overview",
    age: isMn ? "Насны хязгаар" : "Age limit",
    entry: isMn ? "Оролцох мэдээлэл" : "Entry information",
    dress: isMn ? "Хувцаслалт" : "Dress code",
    refund: isMn ? "Буцаан олголтын болон цуцлалтын нөхцөл" : "Refund and cancellation policy",
    more: isMn ? "Дэлгэрэнгүй мэдээлэл" : "More details",
    showMore: isMn ? "Дэлгэрэнгүй үзэх" : "Show more",
    showLess: isMn ? "Хураах" : "Show less",
    about: isMn ? "Эвентийн танилцуулга" : "About this event",
    extra: isMn ? "Нэмэлт мэдээлэл" : "Additional information",
    types: isMn ? "Тасалбарын төрөл" : "Ticket types",
    name: isMn ? "Нэр" : "Name",
    price: isMn ? "Үнэ" : "Price",
    extShort: isMn ? "Гаднын" : "External",
    revenue: isMn ? "Орлого" : "Revenue",
    total: isMn ? "НИЙТ" : "TOTAL",
    free: isMn ? "Үнэгүй" : "Free",
    cancel: isMn ? "Эвентийг цуцлах" : "Cancel event",
    cancelNote: isMn ? "Тасалбар авсан оролцогчдод мэдэгдэж, төлбөрийн буцаалт хийнэ." : "Ticket holders are notified and payments are refunded.",
    cancelled: isMn ? "Эвент цуцлагдсан" : "Event cancelled",
    cancelledNote: isMn ? "Оролцогчдод мэдэгдэл илгээж, төлбөрийн буцаалтыг эхлүүлсэн." : "Attendees were notified and refunds were started.",
    cancelAsk: isMn ? "Эвентийг цуцлах уу?" : "Cancel this event?",
    cancelBody: isMn ? "Энэ үйлдлийг буцаах боломжгүй. Тасалбар авсан оролцогч бүрт мэдэгдэл илгээж, төлбөрийн буцаалтыг эхлүүлнэ." : "This cannot be undone. Every ticket holder is notified and refunds are started.",
    back: isMn ? "Болих" : "Go back",
    confirmCancel: isMn ? "Тийм, цуцлах" : "Yes, cancel",
    orders: isMn ? "Захиалгууд" : "Bookings",
    search: isMn ? "Нэр, захиалгын дугаараар хайх" : "Search by name or order number",
    buyer: isMn ? "Захиалагч" : "Buyer",
    orderNo: isMn ? "Захиалгын №" : "Order no.",
    ticket: isMn ? "Тасалбар" : "Ticket",
    amount: isMn ? "Дүн" : "Amount",
    status: isMn ? "Төлөв" : "Status",
    date: isMn ? "Огноо" : "Date",
    paid: isMn ? "Төлсөн" : "Paid",
    refunded: isMn ? "Буцаасан" : "Refunded",
    none: isMn ? "Илэрц олдсонгүй" : "No results",
    fill: isMn ? "Дүүргэлт" : "Fill",
    views: isMn ? "Үзсэн" : "Views",
    conversion: isMn ? "Хөрвүүлэлт" : "Conversion",
    chart: isMn ? "Тасалбарын борлуулалт" : "Ticket sales",
    all: isMn ? "Нийт" : "All",
    d7: isMn ? "Сүүлийн 7 хоног" : "Last 7 days",
    d30: isMn ? "Сүүлийн 30 хоног" : "Last 30 days",
    month: isMn ? "Энэ сар" : "This month",
    pick: isMn ? "Огноо сонгох" : "Choose dates",
    start: isMn ? "Эхлэх" : "Start",
    end: isMn ? "Дуусах" : "End",
    apply: isMn ? "Хэрэглэх" : "Apply",
    dismiss: isMn ? "Цуцлах" : "Cancel",
    save: isMn ? "Хадгалах" : "Save",
    seats: isMn ? "суудал" : "seats",
    created: isMn ? "Үүсгэсэн огноо" : "Created",
    notFound: isMn ? "Эвент олдсонгүй" : "Event not found",
    noChart: isMn ? "Энэ хугацаанд борлуулалт алга." : "No sales in this period.",
    ticketWord: (n) => (isMn ? `${n} тасалбар` : n === 1 ? "1 ticket" : `${n} tickets`),
  };

  // Refresh after a purchase without blanking the page, so the modal keeps its result screen
  const refreshEvent = async () => {
    try {
      const response = await eventApi.getEventDetails(eventId);
      if (response?.status && response?.data?.event) setEvent(response.data.event);
    } catch (error) {
      console.error("Failed to refresh event", error);
    }
  };

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await eventApi.getEventDetails(eventId);
      if (response?.status && response?.data?.event) {
        setEvent(response.data.event);
    } else {
        setEvent(null);
      }
    } catch (error) {
      console.error("Failed to fetch event details", error);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const res = await bookingApi.getEventAttendees(eventId, {
        page: bookingsPage,
        limit: 20,
        search: bookingsSearch,
      });
      if (res?.status && res.data) {
        setBookingsList(res.data.attendees || []);
        setBookingsTotal(res.data.totalAttendees || 0);
        setBookingsTotalPages(res.data.totalPages || 0);
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const params = {};
      if (analyticsRange === "d7") params.filter = "7d";
      else if (analyticsRange === "d30") params.filter = "30d";
      else if (analyticsRange === "month") params.filter = "thisMonth";
      else if (analyticsRange === "custom" && pickStart && pickEnd) {
        params.filter = "custom";
        params.startDate = pickStart;
        params.endDate = pickEnd;
      }
      const res = await eventApi.getEventAnalytics(eventId, params);
      if (res?.status && res.data) setAnalyticsData(res.data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchDetails();
  }, [eventId]);

  useEffect(() => {
    if (eventId) fetchBookings();
  }, [eventId, bookingsPage, bookingsSearch]);

  useEffect(() => {
    if (eventId && activeTab === "analytics") fetchAnalytics();
  }, [eventId, activeTab, analyticsRange, pickStart, pickEnd]);

  useEffect(() => {
    if (event?.eventTitle) document.title = `${event.eventTitle} - Bondy`;
  }, [event]);

  const stats = useMemo(() => {
    const tickets = Array.isArray(event?.tickets) ? event.tickets : [];
    const cap = tickets.reduce((sum, ticket) => sum + (Number(ticket.qty) || 0), 0) || Number(event?.totalTickets) || 0;
    const sold = tickets.reduce((sum, ticket) => sum + (Number(ticket.soldQty) || 0), 0) || Number(event?.totalBooked) || 0;
    const external = Number(event?.reserveExternal ?? event?.ReservedExternally) || 0;
    const left = Math.max(0, cap - sold - external);
    const revenue = tickets.reduce((sum, ticket) => sum + (Number(ticket.soldQty) || 0) * (Number(ticket.price) || 0), 0);
    const fill = cap > 0 ? ((sold / cap) * 100).toFixed(1) : "0.0";
    return { tickets, cap, sold, external, left, revenue, fill };
  }, [event]);

  const chart = useMemo(() => buildChart(analyticsData?.salesSeries), [analyticsData]);

  const openExternal = () => {
    setExternalDraft(stats.external);
    setSaveError("");
    setShowExternal(true);
  };

  const saveExternal = async () => {
    const next = Math.max(0, Number(externalDraft) || 0);
    const maxExternal = Math.max(0, stats.cap - stats.sold);
    if (next > maxExternal) {
      setSaveError(isMn ? `Хамгийн ихдээ ${maxExternal} байна.` : `Maximum is ${maxExternal}.`);
      return;
    }
    try {
      setIsSaving(true);
      const res = await eventApi.updateEvent(eventId, { ReservedExternally: next });
      if (res?.status === false) {
        setSaveError(res.message || (isMn ? "Хадгалж чадсангүй." : "Could not save."));
        return;
      }
      await fetchDetails();
      setShowExternal(false);
    } catch (err) {
      setSaveError(err?.response?.data?.message || (isMn ? "Хадгалж чадсангүй." : "Could not save."));
    } finally {
      setIsSaving(false);
    }
  };

  const confirmCancel = async () => {
    try {
      setIsCancelling(true);
      const res = await bookingApi.cancelEvent({
        eventId,
        reason: "Event cancelled by organizer",
      });
      if (res?.status) {
        await fetchDetails();
        setShowCancel(false);
      }
    } catch (err) {
      console.error("Failed to cancel event:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return <GlobalLoader fullScreen={false} />;
  }

  if (!event) {
    return (
      <div className="text-center py-5">
        <h4 className="text-white mb-3">{copy.notFound}</h4>
        <Link href="/EventsManagement" className="ed-primary" style={{ display: "inline-flex", padding: "0 18px" }}>{copy.events}</Link>
      </div>
    );
  }

  const cancelled = String(event.status || "").toLowerCase() === "cancelled";
  const poster = getFullImageUrl(event.posterImage?.[0]) || "/img/sidebar-logo.svg";
  const infoRows = [
    { k: copy.summary, v: event.shortdesc, icon: "list" },
    { k: copy.age, v: ageLabel(event.ageRestriction, isMn), icon: "shield" },
    { k: copy.entry, v: event.notes, icon: "clock" },
    { k: copy.dress, v: event.dressCode, icon: "users" },
    { k: copy.refund, v: refundLabel(event.refundPolicy, isMn), icon: "wallet" },
  ].filter((row) => String(row.v || "").trim());
  const detailBlocks = [
    { k: copy.about, v: event.longdesc },
    { k: copy.extra, v: event.addOns },
  ].filter((row) => String(row.v || "").trim());
  const timeLabel = [event.startTime, event.endTime].filter(Boolean).join(" – ");
  const ranges = [
    { id: "all", label: copy.all },
    { id: "d7", label: copy.d7 },
    { id: "d30", label: copy.d30 },
    { id: "month", label: copy.month },
  ];
  const views = Number(analyticsData?.viewCount) || 0;
  const soldInRange = Number(analyticsData?.totalTicketsSold) || 0;
  const conversion = views > 0 ? `${((soldInRange / views) * 100).toFixed(1)}%` : "0%";
  const used = stats.sold + stats.external;
  const fillUsed = stats.cap > 0 ? Math.round((used / stats.cap) * 100) : 0;
  const hover = chart && hoverIndex != null ? chart.coords[hoverIndex] : null;
  const hoverPoint = hover ? analyticsData.salesSeries[hoverIndex] : null;

  const canEdit = Boolean(
    event &&
    (event.isDraft || (
      String(event.status || "").toLowerCase() !== "past" &&
      String(event.status || "").toLowerCase() !== "cancelled" &&
      String(event.status || "").toLowerCase() !== "canceled" &&
      (!event.endDate || new Date(event.endDate) >= new Date())
    ))
  );

  return (
    <div className="ed-page">
      <div className="ed-mobbar">
        <button type="button" className="ed-mobback" onClick={() => router.push("/EventsManagement")} aria-label={copy.events}>←</button>
        <span className="ed-mobbarT"><b>{event.eventTitle}</b><span>{copy.title}</span></span>
        </div>
      <nav className="ed-crumb">
        <button type="button" onClick={() => router.push("/EventsManagement")}>{copy.events}</button>
        <span>/</span>
        <span>{event.eventTitle}</span>
      </nav>

      <section className="ed-hero">
        <div className="ed-heroMain">
          <img className="ed-heroImg" src={poster} alt="" onError={(e) => { e.currentTarget.src = "/img/sidebar-logo.svg"; }} />
          <div className="ed-heroTxt">
            <b>{event.eventTitle}</b>
            {event.shortdesc ? <p>{event.shortdesc}</p> : null}
            {venueLine(event) ? <span className="ed-heroMetaRow ed-pin"><Icon name="pin" />{venueLine(event)}</span> : null}
            <div className="ed-heroMeta">
              {event.startDate ? <span className="ed-heroMetaRow"><Icon name="calendar" />{formatDay(event.startDate, t, true)}</span> : null}
              {timeLabel ? <span className="ed-heroMetaRow"><Icon name="clock" />{timeLabel}</span> : null}
              {event.createdAt ? <span className="ed-heroMetaRow" style={{ color: "var(--bd-gray-600)" }}><Icon name="calendar" />{copy.created}: {formatDay(event.createdAt, t, false)}</span> : null}
          </div>
              </div>
            </div>
        <div className="ed-heroActs">
          <Link href={`/eventDetails?id=${event._id}`} className="ed-primary ed-ctaWide"><Icon name="eye" />{copy.publicPage}</Link>
          <div className="ed-heroPair">
            <button type="button" className="ed-secondary ed-ctaWide" onClick={() => setPromoOpen(true)}><Icon name="promote" />{copy.promote}</button>
            {canEdit && (
              <button type="button" className="ed-secondary ed-ctaWide" onClick={() => router.push(`/BasicInfo?eventId=${event._id}`)}><Icon name="edit" />{copy.edit}</button>
            )}
              </div>
              </div>
      </section>

      <div className="og-tabs" role="tablist">
        <button type="button" className="og-tab" role="tab" aria-selected={activeTab === "overview"} onClick={() => setActiveTab("overview")}>{copy.overview}</button>
        <button type="button" className="og-tab" role="tab" aria-selected={activeTab === "bookings"} onClick={() => setActiveTab("bookings")}>
          {copy.bookings}{bookingsTotal > 0 ? <span className="og-tab-n">{bookingsTotal}</span> : null}
        </button>
        <button type="button" className="og-tab" role="tab" aria-selected={activeTab === "analytics"} onClick={() => setActiveTab("analytics")}>{copy.analytics}</button>
      </div>

      {activeTab === "overview" && (
        <div>
          <div className="ed-kpis">
            <section className="ed-kpi">
              <span className="ed-kpiH"><Icon name="ticket" size={19} />{copy.sold}</span>
              <b className="ed-kpiV is-accent">{stats.sold}<i> / {stats.cap}</i></b>
              <span className="ed-kpiFoot">
                <span className="ed-kpiPct">{stats.fill}%</span>
                <span className="ed-kpiTrack"><i style={{ width: `${Math.min(100, Number(stats.fill))}%` }} /></span>
                  </span>
            </section>
            <section className="ed-kpi">
              <span className="ed-kpiH"><Icon name="users" size={19} />{copy.external}</span>
              <b className="ed-kpiV is-amber">{stats.external}</b>
              <button type="button" className="ed-util ed-kpiBtn" onClick={openExternal}><Icon name="edit" />{stats.external > 0 ? copy.editExternal : copy.addExternal}</button>
            </section>
            <section className="ed-kpi">
              <span className="ed-kpiH"><Icon name="chair" size={19} />{copy.remaining}</span>
              <b className="ed-kpiV is-accent">{stats.left}</b>
              <span className="ed-kpiNote">{copy.capacity}: {stats.cap}</span>
            </section>
                </div>

          {infoRows.length > 0 && (
            <section className="ed-info">
              <h2 className="ed-infoH">{copy.info}</h2>
              {infoRows.map((row) => (
                <div className="ed-infoRow" key={row.k}>
                  <span className="ed-infoI"><Icon name={row.icon} size={17} /></span>
                  <span className="ed-infoK">{row.k}</span>
                  <span className="ed-infoV">{row.v}</span>
                    </div>
                  ))}
            </section>
          )}

          {detailBlocks.length > 0 && (
            <section className="ed-info ed-details">
              <button type="button" className="ed-detailsH" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((open) => !open)}>
                <span className="ed-infoH">{copy.more}</span>
                <span className="ed-detailsMore">{detailsOpen ? copy.showLess : copy.showMore}</span>
                <span className="ed-detailsC" data-open={String(detailsOpen)}>⌄</span>
                </button>
              <div className="ed-detailsB" data-clip={String(!detailsOpen)}>
                {detailBlocks.map((block) => (
                  <div className="ed-detailBlock" key={block.k}>
                    <b className="ed-detailK">{block.k}</b>
                    <p className="ed-detailV">{block.v}</p>
              </div>
                ))}
            </div>
            </section>
          )}

          <section className="ed-card">
            <div className="ed-cardH">
              <h2>{copy.types}</h2>
              {canEdit && (
                <button type="button" className="ed-mini" onClick={() => router.push(`/BasicInfo?eventId=${event._id}&step=3`)}>{copy.edit}</button>
              )}
            </div>
            <div className="og-table og-t1 ed-ttable">
              <div className="og-table-inner" style={{ minWidth: 760 }}>
                <div className="og-row og-head ed-grid6">
                  <span>{copy.name}</span><span>{copy.price}</span><span>{copy.sold}</span><span>{copy.extShort}</span><span>{copy.remaining}</span><span>{copy.revenue}</span>
                </div>
                {stats.tickets.map((ticket) => {
                  const sold = Number(ticket.soldQty) || 0;
                  const cap = Number(ticket.qty) || 0;
                  const left = Math.max(0, cap - sold);
                  const pct = cap > 0 ? Math.min(100, Math.round((sold / cap) * 100)) : 0;
                    return (
                    <div className="og-row ed-grid6" key={ticket._id || ticket.ticketName}>
                      <span><b style={{ fontSize: 14 }}>{ticket.ticketName || copy.ticket}</b></span>
                      <span>{ticket.isFreeTicket || !ticket.price ? copy.free : money(ticket.price)}</span>
                      <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <b>{sold} / {cap}</b>
                        <span className="ed-barTrack"><i style={{ width: `${pct}%` }} /></span>
                            </span>
                      <span><button type="button" className="ed-doorB" onClick={openExternal}>{stats.tickets.length === 1 ? stats.external : "—"}</button></span>
                      <span style={{ fontWeight: 700 }}>{left}</span>
                      <span>{money(sold * (Number(ticket.price) || 0))}</span>
                      </div>
                    );
                  })}
                <div className="og-row ed-grid6" style={{ background: "var(--bd-ink-800)" }}>
                  <span style={{ fontWeight: 700 }}>{copy.total}</span>
                  <span />
                  <span style={{ fontWeight: 700 }}>{stats.sold} / {stats.cap}</span>
                  <span style={{ fontWeight: 700, color: "#ff8a33" }}>{stats.external}</span>
                  <span style={{ fontWeight: 700 }}>{stats.left}</span>
                  <span style={{ fontWeight: 700 }}>{money(stats.revenue)}</span>
                </div>
            </div>
            </div>
            <div className="ed-mcards">
              {stats.tickets.map((ticket) => {
                const sold = Number(ticket.soldQty) || 0;
                const cap = Number(ticket.qty) || 0;
                const pct = cap > 0 ? Math.min(100, Math.round((sold / cap) * 100)) : 0;
                return (
                  <div className="ed-mcard" key={`m-${ticket._id || ticket.ticketName}`}>
                    <div className="ed-mhead">
                      <span className="ed-mname">{ticket.ticketName || copy.ticket}</span>
                      <span className="ed-mprice">{ticket.isFreeTicket || !ticket.price ? copy.free : money(ticket.price)}</span>
              </div>
                    <span className="ed-mtrack"><i style={{ width: `${pct}%` }} /></span>
                    <div className="ed-mcols">
                      <span className="ed-mcol"><span className="ed-mcolL">{copy.sold}</span><span className="ed-mcolV">{sold}<i>/{cap}</i></span></span>
                      <button type="button" className="ed-mdoor" onClick={openExternal}>
                        <span className="ed-mdoorL">{copy.extShort}</span>
                        <span className="ed-mdoorV">{stats.tickets.length === 1 ? stats.external : "—"}</span>
                      </button>
                      <span className="ed-mcol ed-mcol-r"><span className="ed-mcolL">{copy.remaining}</span><span className="ed-mcolV">{Math.max(0, cap - sold)}</span></span>
                            </div>
                    <div className="ed-mfoot">{money(sold * (Number(ticket.price) || 0))}</div>
                        </div>
                );
              })}
                      </div>
          </section>

          <div className="ed-foot">
            {!cancelled ? (
              <>
                <button type="button" className="ed-danger" onClick={() => setShowCancel(true)}>{copy.cancel}</button>
                <span>{copy.cancelNote}</span>
              </>
            ) : (
              <>
                <b className="ed-cancelled">{copy.cancelled}</b>
                <span>{copy.cancelledNote}</span>
              </>
                      )}
                    </div>
                  </div>
                )}

      {activeTab === "bookings" && (
        <section className="ed-card">
          <div className="ed-cardH">
            <h2>{copy.orders}</h2>
            <label className="ed-osearch">
            <input
              type="text"
              value={bookingsSearch}
                placeholder={copy.search}
              onChange={(e) => {
                setBookingsSearch(e.target.value);
                setBookingsPage(1);
              }}
            />
            </label>
          </div>
          {bookingsLoading ? (
            <div className="d-flex justify-content-center py-4"><Spinner animation="border" style={{ color: "#23ada4" }} /></div>
          ) : bookingsList.length === 0 ? (
            <p className="ed-empty">{copy.none}</p>
          ) : (
            <div className="og-table og-t3">
              <div className="og-table-inner og-wide">
                <div className="og-row og-head ed-grid7">
                  <span>{copy.buyer}</span><span>{copy.orderNo}</span><span>{copy.ticket}</span><span>{copy.amount}</span><span>{copy.status}</span><span>{copy.date}</span><span />
                </div>
                {bookingsList.map((booking) => {
                  const name = `${booking.user?.firstName || ""} ${booking.user?.lastName || ""}`.trim() || "—";
                  const qty = booking.tickets?.totalQty || 0;
                  const typeName = booking.tickets?.details?.map((item) => item.ticketName).filter(Boolean).join(", ") || booking.ticketName || "";
                  const refunded = booking.status === "REFUNDED";
                  return (
                    <div
                      className="og-row ed-grid7"
                      key={booking.transactionId || booking.bookingId}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                      onClick={() => router.push(`/TicketDetailsOrganiser?id=${booking.transactionId}`)}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                        {booking.user?.profileImage ? (
                          <img className="ed-avatar" src={getFullImageUrl(booking.user.profileImage)} alt="" />
                        ) : (
                          <span className="ed-avatar">{(name[0] || "?").toUpperCase()}</span>
                        )}
                        <b style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</b>
                          </span>
                      <span style={{ color: "var(--bd-gray-400)", letterSpacing: ".04em" }}>{booking.bookingId || "—"}</span>
                      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <b>{copy.ticketWord(qty)}</b>
                        {typeName ? <span style={{ fontSize: 12, color: "var(--bd-gray-600)" }}>{typeName}</span> : null}
                      </span>
                      <span style={{ fontWeight: 700 }}>{money(booking.totalAmount)}</span>
                      <span><span className={`ed-badge ${refunded ? "refund" : "paid"}`}>{refunded ? copy.refunded : copy.paid}</span></span>
                      <span style={{ color: "var(--bd-gray-500)" }}>{formatOrderDate(booking.bookingDate)}</span>
                      <span style={{ textAlign: "right", color: "var(--bd-gray-600)" }}>›</span>
                        </div>
                  );
                })}
                      </div>
                    </div>
          )}
          {bookingsTotalPages > 1 && (
            <div className="ed-pager">
              <button type="button" disabled={bookingsPage <= 1} onClick={() => setBookingsPage((page) => page - 1)}>‹</button>
              {Array.from({ length: bookingsTotalPages }, (_, index) => index + 1).map((page) => (
                <button key={page} type="button" aria-current={page === bookingsPage} onClick={() => setBookingsPage(page)}>{page}</button>
              ))}
              <button type="button" disabled={bookingsPage >= bookingsTotalPages} onClick={() => setBookingsPage((page) => page + 1)}>›</button>
                </div>
              )}
        </section>
      )}

      {activeTab === "analytics" && (
        <div>
          <div className="ed-anFilters">
            <div className="ed-ranges">
              {ranges.map((range) => (
                <button key={range.id} type="button" className="og-range" aria-selected={analyticsRange === range.id} onClick={() => { setDateOpen(false); setAnalyticsRange(range.id); }}>{range.label}</button>
              ))}
              <button type="button" className="og-range" aria-selected={analyticsRange === "custom"} onClick={() => setDateOpen((open) => !open)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
                {analyticsRange === "custom" && customLabel ? customLabel : copy.pick}
              </button>
            </div>
            <div className="ed-rangesel">
            <select
                aria-label={copy.pick}
                value={analyticsRange}
                onChange={(e) => {
                  const next = e.target.value;
                  setAnalyticsRange(next);
                  setDateOpen(next === "custom");
                }}
              >
                {ranges.map((range) => <option key={range.id} value={range.id}>{range.label}</option>)}
                <option value="custom">{copy.pick}</option>
            </select>
          </div>
            {dateOpen && (
              <div className="og-datepop">
                <span style={{ display: "block", fontWeight: 700, marginBottom: 12 }}>{copy.pick}</span>
                <label style={{ display: "block", marginBottom: 10 }}>
                  <span style={{ display: "block", fontSize: 12, marginBottom: 5 }}>{copy.start}</span>
                  <input type="date" value={pickStart} onChange={(e) => setPickStart(e.target.value)} />
                </label>
                <label style={{ display: "block", marginBottom: 14 }}>
                  <span style={{ display: "block", fontSize: 12, marginBottom: 5 }}>{copy.end}</span>
                  <input type="date" value={pickEnd} onChange={(e) => setPickEnd(e.target.value)} />
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="ed-popGo"
                    onClick={() => {
                      if (!pickStart || !pickEnd) return;
                      setCustomLabel(`${pickStart} – ${pickEnd}`);
                      setAnalyticsRange("custom");
                      setDateOpen(false);
                    }}
                  >{copy.apply}</button>
                  <button type="button" className="ed-popGhost" onClick={() => setDateOpen(false)}>{copy.dismiss}</button>
            </div>
                  </div>
          )}
        </div>

          {analyticsLoading ? (
            <div className="d-flex justify-content-center py-4"><Spinner animation="border" style={{ color: "#23ada4" }} /></div>
          ) : (
            <>
              <div className="ed-anMain">
                <section className="ed-anCard"><span className="ed-anH"><span className="ed-anI"><Icon name="ticket" size={18} /></span>{copy.sold}</span><b className="ed-anV">{soldInRange.toLocaleString("en-US")}</b></section>
                <section className="ed-anCard"><span className="ed-anH"><span className="ed-anI"><Icon name="wallet" size={18} /></span>{copy.revenue}</span><b className="ed-anV">{money(analyticsData?.grossRevenue)}</b></section>
                <section className="ed-anCard">
                  <span className="ed-anH"><span className="ed-anI"><Icon name="users" size={18} /></span>{copy.fill}</span>
                  <b className="ed-anV">{fillUsed}%</b>
                  <span className="ed-anNote">{used} / {stats.cap} {copy.seats}</span>
                  <span className="ed-kpiTrack"><i style={{ width: `${Math.min(100, fillUsed)}%` }} /></span>
                </section>
            </div>
              <div className="ed-anSecond">
                <section className="ed-anCard"><span className="ed-anH"><span className="ed-anI"><Icon name="eye" size={18} /></span>{copy.views}</span><b className="ed-anV">{views.toLocaleString("en-US")}</b></section>
                <section className="ed-anCard"><span className="ed-anH"><span className="ed-anI"><Icon name="atom" size={18} /></span>{copy.conversion}</span><b className="ed-anV">{conversion}</b></section>
                </div>
              <section className="ed-chart">
                <h2>{copy.chart}</h2>
                {!chart ? <p className="ed-empty">{copy.noChart}</p> : (
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 170, padding: "14px 0 22px", textAlign: "right" }}>
                      <span style={{ fontSize: 11, color: "var(--bd-gray-600)" }}>{chart.max}</span>
                      <span style={{ fontSize: 11, color: "var(--bd-gray-600)" }}>{Math.round(chart.max / 2)}</span>
                      <span style={{ fontSize: 11, color: "var(--bd-gray-600)" }}>0</span>
                </div>
                    <div
                      className="ed-anPlot"
                      onMouseMove={(e) => {
                        const box = e.currentTarget.getBoundingClientRect();
                        if (!box.width || !chart.coords.length) return;
                        const t = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
                        setHoverIndex(Math.round(t * (chart.coords.length - 1)));
                      }}
                      onMouseLeave={() => setHoverIndex(null)}
                    >
                      <svg viewBox="0 0 600 170" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 170 }} aria-hidden="true">
                        <line x1="0" y1="22" x2="600" y2="22" stroke="rgba(255,255,255,.06)" />
                        <line x1="0" y1="65" x2="600" y2="65" stroke="rgba(255,255,255,.06)" />
                        <line x1="0" y1="107" x2="600" y2="107" stroke="rgba(255,255,255,.06)" />
                        <line x1="0" y1="150" x2="600" y2="150" stroke="rgba(255,255,255,.06)" />
                        <path d={chart.area} fill="rgba(35,173,164,.26)" />
                        <path d={chart.line} fill="none" stroke="var(--acc, #23ada4)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                      {hover && hoverPoint ? (
                        <>
                          <span className="ed-anRule" style={{ left: `${(hover[0] / 600) * 100}%` }} />
                          <span className="ed-anDot" style={{ left: `${(hover[0] / 600) * 100}%`, top: hover[1] }} />
                          <span className="ed-anTip" style={{ left: `${(hover[0] / 600) * 100}%`, top: hover[1], transform: "translate(-50%, -100%)" }}>
                            {hoverPoint.date} · {copy.ticketWord(hoverPoint.tickets)}
                  </span>
                        </>
                      ) : null}
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
                        {chart.labels.map((label) => <span key={label} style={{ fontSize: 11.5, color: "var(--bd-gray-600)" }}>{label.slice(5)}</span>)}
                </div>
              </div>
                </div>
                )}
              </section>
            </>
          )}
                </div>
      )}

      <PromotionPlanModal
        open={promoOpen}
        kind="event"
        listingId={event._id}
        title={event.eventTitle}
        viewHref={`/eventDetails?id=${event._id}`}
        running={Boolean(event.isFeatured && event.featuredExpiry && new Date(event.featuredExpiry) > new Date())}
        ineligible={cancelled || String(event.status || "").toLowerCase() === "past" || Boolean(event.endDate && new Date(event.endDate) < new Date(new Date().setHours(0, 0, 0, 0)))}
        onClose={() => setPromoOpen(false)}
        onPurchased={refreshEvent}
      />

      {showCancel && (
        <div className="ed-scrim" onClick={() => setShowCancel(false)}>
          <div className="ed-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="ed-sheetH">
              <b style={{ display: "block", fontSize: 18 }}>{copy.cancelAsk}</b>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--bd-gray-500)" }}>{copy.cancelBody}</p>
            </div>
            <div className="ed-sheetF">
              <button type="button" className="ghost" onClick={() => setShowCancel(false)}>{copy.back}</button>
              <button type="button" className="ed-cancelD" disabled={isCancelling} onClick={confirmCancel}>{copy.confirmCancel}</button>
            </div>
          </div>
        </div>
      )}

      {showExternal && (
        <div className="ed-scrim" onClick={() => setShowExternal(false)}>
          <div className="ed-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="ed-sheetH">
              <b style={{ display: "block", fontSize: 18 }}>{copy.external}</b>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--bd-gray-500)" }}>{copy.capacity}: {stats.cap}. {copy.sold}: {stats.sold}.</p>
            </div>
            <div className="ed-sheetB">
              <div className="ed-step">
                <button type="button" disabled={externalDraft <= 0} onClick={() => setExternalDraft((n) => Math.max(0, n - 1))}>−</button>
                <b>{externalDraft}</b>
                <button type="button" disabled={externalDraft >= Math.max(0, stats.cap - stats.sold)} onClick={() => setExternalDraft((n) => n + 1)}>+</button>
              </div>
              {saveError ? <p style={{ color: "#ff6b6b", fontSize: 13, marginTop: 10 }}>{saveError}</p> : null}
            </div>
            <div className="ed-sheetF">
              <button type="button" className="ghost" onClick={() => setShowExternal(false)}>{copy.dismiss}</button>
              <button type="button" className="ed-popGo" disabled={isSaving} onClick={saveExternal}>{copy.save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center py-5"><Spinner animation="border" style={{ color: "#23ada4" }} /></div>}>
      <EventDetailsContent />
    </Suspense>
  );
}
