"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useEventContext } from "@/context/EventContext";
import authApi from "@/api/authApi";
import eventApi from "@/api/eventApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import { formatCategoryName, capitalizeWords } from "@/utils/formatHelper";
import GlobalLoader from "@/components/GlobalLoader";

// ─── Audited Constants from Prototype ─────────────────────────────────────────
const FALLBACK_CATS = [
  { id: "musicshow", label: "Хөгжим, шоу", en: "Music & shows" },
  { id: "meetup", label: "Уулзалт", en: "Meetups" },
  { id: "workshop", label: "Воркшоп", en: "Workshops" },
  { id: "business", label: "Бизнес, хурал", en: "Business & conferences" },
  { id: "artsculture", label: "Урлаг, соёл", en: "Arts & culture" },
  { id: "sports", label: "Спорт", en: "Sports" },
  { id: "other", label: "Бусад", en: "Other" },
];

const STEPS_MN = ["Үндсэн мэдээлэл", "Огноо ба байршил", "Тасалбарууд", "Тохиргоо", "Хянах"];
const STEPS_EN = ["Basic info", "Date and location", "Tickets", "Settings", "Review"];

const MAPBOX = { lng0: 106.855, lng1: 106.995, lat0: 47.95, lat1: 47.878 };

function nearestAddr(lat, lng) {
  let best = null;
  let bestDist = Infinity;
  ADDRS.forEach((row) => {
    const dist = (row[2] - lat) ** 2 + ((row[3] - lng) * 0.67) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = row;
    }
  });
  return bestDist < 0.00008 ? best : null;
}

function pinPercents(lat, lng) {
  const x = ((lng - MAPBOX.lng0) / (MAPBOX.lng1 - MAPBOX.lng0)) * 100;
  const y = ((lat - MAPBOX.lat0) / (MAPBOX.lat1 - MAPBOX.lat0)) * 100;
  return {
    left: `${Math.min(96, Math.max(4, x))}%`,
    top: `${Math.min(92, Math.max(8, y))}%`,
  };
}

function nextMinute(hhmm) {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  const d = new Date(2000, 0, 1, h, m + 1);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function todayISO() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function nowStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toDatetimeLocal(value) {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw) && !/[zZ+]/.test(raw.slice(16))) {
    return raw.slice(0, 16);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 16);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function blankTicket() {
  return { name: "", desc: "", price: "", cap: "", ss: "", se: "" };
}

function digitsOf(value) {
  const raw = String(value ?? "").trim();
  if (!/^\d+$/.test(raw)) return null;
  return raw.replace(/^0+/, "") || "0";
}

function validDigitAmount(value) {
  const digits = digitsOf(value);
  return Boolean(digits && digits !== "0" && digits.length <= 10);
}

function titleCaseWords(value) {
  return String(value || "").replace(/(^|[\s]+)(\p{L})/gu, (_, space, letter) => space + letter.toLocaleUpperCase());
}

function sentenceCaseText(value) {
  return String(value || "").replace(/(^|[.!?]\s+|\n\s*)(\p{L})/gu, (_, lead, letter) => lead + letter.toLocaleUpperCase());
}

function formatReviewWhen(value, mn, extraTime) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parts = raw.slice(0, 10).split("-");
  if (parts.length < 3) return raw;
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const embedded = raw.includes("T") ? raw.slice(raw.indexOf("T") + 1, raw.indexOf("T") + 6) : "";
  const clock = extraTime || embedded;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const label = mn ? `${month}-р сарын ${day}` : `${months[month - 1] || parts[1]} ${day}`;
  return clock ? `${label} · ${clock}` : label;
}

const REFUND_POLICY_CANONICAL = {
  "no refund": "No Refund",
  "буцаан олголтгүй": "No Refund",
  "буцаалтгүй": "No Refund",
  "буцаалт байхгүй": "No Refund",
  "буцаан олголт байхгүй": "No Refund",
  "1 day before": "1 Day Before",
  "1 хоногийн өмнө": "1 Day Before",
  "1 өдрийн өмнө": "1 Day Before",
  "7 days before": "7 Days Before",
  "7 хоногийн өмнө": "7 Days Before",
  "7 өдрийн өмнө": "7 Days Before",
};

function canonicalRefundPolicy(value) {
  if (!value) return "";
  const key = String(value).trim().toLowerCase();
  return REFUND_POLICY_CANONICAL[key] || String(value).trim();
}

function parseRefundPolicyOptions(rawList) {
  if (!Array.isArray(rawList)) return [];
  const seen = new Set();
  const options = [];
  rawList.forEach((item) => {
    const raw = typeof item === "object" && item !== null
      ? (item.title || item.name || item.policy || item.value || item.label || "")
      : item;
    const label = String(raw ?? "").trim();
    if (!label) return;
    const value = canonicalRefundPolicy(label);
    if (seen.has(value)) return;
    seen.add(value);
    options.push({ value, label });
  });
  return options;
}

function openNativePicker(input) {
  if (!input) return;
  input.focus();
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      /* showPicker can throw if the input is not eligible yet */
    }
  }
}

const ADDRS = [
  ["Сүхбаатарын талбай, Сүхбаатар дүүрэг", "Улаанбаатар, 14200", 47.9186, 106.9176],
  ["Их эзэн Чингис хааны талбай, Чингэлтэй дүүрэг", "Улаанбаатар, 15170", 47.9203, 106.9169],
  ["UB Palace, Чингэлтэй дүүрэг", "Улаанбаатар, 15170", 47.9235, 106.9126],
  ["Улсын драмын театр, Сүхбаатар дүүрэг", "Улаанбаатар, 14200", 47.9151, 106.9146],
  ["Blue Sky Lounge, Сүхбаатар дүүрэг", "Улаанбаатар, 14240", 47.9166, 106.9199],
  ["Шангри-Ла центр, Хан-Уул дүүрэг", "Улаанбаатар, 17010", 47.9137, 106.9192],
  ["Хүннү молл, Хан-Уул дүүрэг", "Улаанбаатар, 17032", 47.8862, 106.8752],
  ["Мишээл экспо, Хан-Уул дүүрэг", "Улаанбаатар, 17040", 47.8993, 106.8686],
  ["Steppe Arena, Баянзүрх дүүрэг", "Улаанбаатар, 13343", 47.9082, 106.9814],
  ["Үндэсний соёл амралтын хүрээлэн, Баянзүрх дүүрэг", "Улаанбаатар, 13381", 47.9163, 106.9366],
];

const DEFAULT_DISTRICTS = [
  "Сүхбаатар дүүрэг",
  "Чингэлтэй дүүрэг",
  "Хан-Уул дүүрэг",
  "Баянзүрх дүүрэг",
  "Баянгол дүүрэг",
  "Сонгинохайрхан дүүрэг",
  "Налайх дүүрэг",
  "Багануур дүүрэг",
  "Багахангай дүүрэг",
  "Дархан-Уул",
  "Орхон / Эрдэнэт",
];

const DISTRICT_MATCHERS = [
  { keys: ["сүхбаатар", "sukhbaatar", "sükhbaatar", "sbd", "сбд"], mn: "Сүхбаатар дүүрэг", en: "Sukhbaatar District" },
  { keys: ["баянзүрх", "bayanzurkh", "bayanzürkh", "bzd", "бзд"], mn: "Баянзүрх дүүрэг", en: "Bayanzurkh District" },
  { keys: ["хан-уул", "хануул", "khan-uul", "khan uul", "khanuul", "hud", "худ"], mn: "Хан-Уул дүүрэг", en: "Khan-Uul District" },
  { keys: ["баянгол", "bayangol", "bgd", "бгд"], mn: "Баянгол дүүрэг", en: "Bayangol District" },
  { keys: ["чингэлтэй", "chingeltei", "chd", "чд"], mn: "Чингэлтэй дүүрэг", en: "Chingeltei District" },
  { keys: ["сонгинохайрхан", "songinokhairkhan", "songino khairkhan", "shd", "схд"], mn: "Сонгинохайрхан дүүрэг", en: "Songinokhairkhan District" },
  { keys: ["налайх", "nalaikh", "nld", "нд"], mn: "Налайх дүүрэг", en: "Nalaikh District" },
  { keys: ["багануур", "baganuur", "bnd", "бнд"], mn: "Багануур дүүрэг", en: "Baganuur District" },
  { keys: ["багахангай", "bagakhangai", "bkhd", "бхд"], mn: "Багахангай дүүрэг", en: "Bagakhangai District" },
  { keys: ["дархан", "darkhan"], mn: "Дархан-Уул", en: "Darkhan-Uul" },
  { keys: ["эрдэнэт", "erdenet", "орхон", "orkhon"], mn: "Орхон / Эрдэнэт", en: "Orkhon / Erdenet" },
];

const BONDY_DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#141414" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#858585" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#141414" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#666666" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#222222" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#363636" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1b22" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#2b4c59" }] },
];

function fmtMnDate(iso) {
  const s = String(iso || "");
  const time = s.includes("T") ? s.slice(s.indexOf("T") + 1, s.indexOf("T") + 6) : "";
  const p = s.slice(0, 10).split("-");
  if (p.length < 3) return s;
  return `${Number(p[1])}-р сарын ${Number(p[2])}${time ? ` · ${time}` : ""}`;
}

function EventEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const isMn = language === "mn";
  const { clearEventData } = useEventContext();

  const eventIdParam = searchParams.get("eventId");
  const stepParam = parseInt(searchParams.get("step") || "1", 10);
  const modeParam = searchParams.get("mode"); // 'new' | 'draft' | 'published'

  // ─── Current Step State ───────────────────────────────────────────────────
  const [step, setStep] = useState(stepParam >= 1 && stepParam <= 5 ? stepParam : 1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDraftMode, setIsDraftMode] = useState(modeParam === "draft");
  const [initialLoading, setInitialLoading] = useState(false);

  // ─── Form State ───────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [dbCategories, setDbCategories] = useState([]);

  // Media
  const [poster, setPoster] = useState(""); // URL or key
  const [posterName, setPosterName] = useState("");
  const [posterSize, setPosterSize] = useState("");
  const [gallery, setGallery] = useState([]); // array of URLs
  const [teaserVideo, setTeaserVideo] = useState("");
  const [teaserName, setTeaserName] = useState("");
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoPct, setVideoPct] = useState(0);
  const [liveBlockedModal, setLiveBlockedModal] = useState(false);
  const [upPct, setUpPct] = useState(0);

  // Date, Time, Location
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venueName, setVenueName] = useState("");
  const [district, setDistrict] = useState(DEFAULT_DISTRICTS[0]);
  const [address, setAddressState] = useState("");
  const setAddress = (value) => setAddressState(String(value ?? "").slice(0, 180));
  const [addrQuery, setAddrQuery] = useState("");
  const [showAddrAc, setShowAddrAc] = useState(false);
  const [lat, setLat] = useState(47.9186);
  const [lng, setLng] = useState(106.9176);
  const [pinMode, setPinMode] = useState(false);

  // Google Maps & Places Integration
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [mapsFailed, setMapsFailed] = useState(false);
  const mapContainerRef = useRef(null);
  const googleMapRef = useRef(null);
  const markerRef = useRef(null);
  const latRef = useRef(lat);
  const lngRef = useRef(lng);
  const updateLocationRef = useRef(null);
  latRef.current = lat;
  lngRef.current = lng;
  const addressInputRef = useRef(null);

  // Tickets & Pricing
  const [isFree, setIsFree] = useState(false);
  const [tickets, setTickets] = useState([blankTicket()]);
  const [freeCap, setFreeCap] = useState("");
  const [freeSs, setFreeSs] = useState("");
  const [freeSe, setFreeSe] = useState("");
  const [policy, setPolicy] = useState("");
  const [dbPolicies, setDbPolicies] = useState([]);

  // Settings
  const [visibility, setVisibility] = useState("public"); // 'public' | 'private'
  const [ageRestriction, setAgeRestriction] = useState("18"); // 'all' | '18' | '21'
  const [showAttendees, setShowAttendees] = useState(true);
  const [entryNotes, setEntryNotes] = useState("");
  const [dressCode, setDressCode] = useState("");

  // Validation Errors
  const [errors, setErrors] = useState({});

  // Button Busy States
  const [draftBusy, setDraftBusy] = useState(false);
  const [pubBusy, setPubBusy] = useState(false);

  // Modals & Feedback
  const [toastMessage, setToastMessage] = useState("");
  const [ask, setAsk] = useState(null); // { kind, title, body, acts: [{ key, label, cls }] }
  const [done, setDone] = useState(null); // { kind, title, body, icon, tileBg, tileColor, acts: [{ key, label, cls }] }
  const [pendingRemoveTicketIdx, setPendingRemoveTicketIdx] = useState(null);
  const [createdEventId, setCreatedEventId] = useState(eventIdParam || null);

  // ─── Fetch Categories & Policies ──────────────────────────────────────────
  useEffect(() => {
    async function loadMeta() {
      try {
        const catRes = await authApi.getCategoryList();
        if (catRes?.data?.categories && catRes.data.categories.length > 0) {
          setDbCategories(catRes.data.categories);
        }
      } catch (e) {
        console.warn("Failed to load DB categories, using fallback:", e);
      }

    }
    loadMeta();
  }, []);

  // ─── Dynamic Refund Policies from Backend API ────────────────────────────
  useEffect(() => {
    async function loadPolicies() {
      try {
        const polRes = await eventApi.getRefundPolicies(isMn ? "mn" : "en");
        const rawList = polRes?.data?.data || polRes?.data;
        setDbPolicies(parseRefundPolicyOptions(rawList));
      } catch (e) {
        console.warn("Failed to load refund policies from backend API:", e);
        setDbPolicies([]);
      }
    }
    loadPolicies();
  }, [isMn]);

  // ─── Load Existing Event for Edit Mode ────────────────────────────────────
  useEffect(() => {
    if (!eventIdParam) return;

    async function loadEvent() {
      try {
        setInitialLoading(true);
        setIsEditMode(true);
        const res = await eventApi.getEventDetails(eventIdParam);
        const ev = res?.data?.event || res?.data?.data;
        if (!ev) return;

        const now = new Date();
        const isLive = !ev.isDraft && (
          String(ev.status).toLowerCase() === "live" ||
          Boolean(ev.isLive) ||
          (ev.startDate && ev.endDate && new Date(ev.startDate) <= now && new Date(ev.endDate) >= now)
        );
        if (isLive) {
          setLiveBlockedModal(true);
        }

        setIsDraftMode(Boolean(ev.isDraft));
        setTitle(ev.eventTitle || "");
        setShortDesc(ev.shortdesc || "");
        setLongDesc(ev.longdesc || "");

        if (ev.eventCategory) {
          if (typeof ev.eventCategory === "object") {
            setCategoryId(ev.eventCategory._id);
            setCategoryName(ev.eventCategory.name || "");
          } else {
            setCategoryId(ev.eventCategory);
          }
        }

        if (ev.posterImage && ev.posterImage.length > 0) {
          setPoster(ev.posterImage[0]);
          setPosterName("event-poster.jpg");
        }
        if (ev.mediaLinks && Array.isArray(ev.mediaLinks)) {
          setGallery(ev.mediaLinks);
        }
        if (ev.shortTeaserVideo && ev.shortTeaserVideo.length > 0) {
          setTeaserVideo(ev.shortTeaserVideo[0]);
          setTeaserName("teaser.mp4");
        }

        setStartDate(ev.startDate ? ev.startDate.slice(0, 10) : "");
        setStartTime(ev.startTime || "");
        setEndDate(ev.endDate ? ev.endDate.slice(0, 10) : "");
        setEndTime(ev.endTime || "");
        setVenueName(ev.venueName || "");

        if (ev.venueAddress) {
          setAddress(ev.venueAddress.address || "");
          setAddrQuery(ev.venueAddress.address || "");
          if (ev.venueAddress.latitude) setLat(Number(ev.venueAddress.latitude));
          if (ev.venueAddress.longitude) setLng(Number(ev.venueAddress.longitude));
          if (ev.venueAddress.city) {
            setDistrict(ev.venueAddress.city);
          }
        }

        if (ev.tickets && ev.tickets.length > 0) {
          const isFreeEv = ev.tickets.every((t) => Number(t.price) === 0 || t.isFreeTicket);
          setIsFree(isFreeEv);
          if (isFreeEv) {
            const t0 = ev.tickets[0] || {};
            const cap = t0.qty != null ? t0.qty : ev.totalTickets;
            setFreeCap(cap != null && cap !== "" ? String(cap) : "");
            setFreeSs(toDatetimeLocal(t0.salesStart || t0.ticketSelesStartDate));
            setFreeSe(toDatetimeLocal(t0.salesEnd || t0.ticketSelesEndDate));
          } else {
            setTickets(
              ev.tickets.map((t) => ({
                name: t.ticketName || "",
                desc: t.ticketShortDesc || "",
                price: t.price != null && t.price !== "" ? String(t.price) : "",
                cap: t.qty != null ? String(t.qty) : "",
                ss: toDateInput(t.salesStart || t.ticketSelesStartDate),
                se: toDateInput(t.salesEnd || t.ticketSelesEndDate),
              }))
            );
          }
        }

        if (ev.refundPolicy) {
          setPolicy(canonicalRefundPolicy(ev.refundPolicy));
        }
        if (ev.visibility) {
          setVisibility(String(ev.visibility).toLowerCase() === "private" ? "private" : "public");
        } else if (ev.accessAndPrivacy !== undefined) {
          setVisibility(ev.accessAndPrivacy ? "public" : "private");
        }
        if (ev.ageRestriction) {
          const ar = String(ev.ageRestriction).toUpperCase();
          if (ar === "ALL" || ar === "ALL+") {
            setAgeRestriction("all");
          } else if (ar.includes("21")) {
            setAgeRestriction("21");
          } else {
            setAgeRestriction("18");
          }
        }
        if (ev.dressCode) setDressCode(ev.dressCode);
        if (typeof ev.notes === "string" && ev.notes.trim()) {
          setEntryNotes(ev.notes);
        } else if (ev.tags && ev.tags.length > 0) {
          setEntryNotes(ev.tags.join(", "));
        }
      } catch (err) {
        console.error("Failed to load event for edit:", err);
        flashToast(isMn ? "Эвент олдсонгүй" : "Failed to load event");
      } finally {
        setInitialLoading(false);
      }
    }

    loadEvent();
  }, [eventIdParam, isMn]);

  // Flash Toast
  const flashToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2600);
  };

  // Autocomplete filter for Address
  const filteredAddrs = useMemo(() => {
    const q = (addrQuery || "").trim().toLowerCase();
    if (!q) return ADDRS.slice(0, 5);
    return ADDRS.filter((a) => a[0].toLowerCase().includes(q) || a[1].toLowerCase().includes(q)).slice(0, 5);
  }, [addrQuery]);

  // ─── Helper to Parse Geocoded / Places Location ──────────────────────────
  const parseGeocodeLocation = useCallback((placeOrResult) => {
    if (!placeOrResult) return null;
    const formatted = placeOrResult.formatted_address || placeOrResult.name || "";
    let detectedDistrict = "";
    let detectedCity = "";
    let detectedVenue = "";

    // 1. Check all address_components for district, city, and venue
    if (placeOrResult.address_components && Array.isArray(placeOrResult.address_components)) {
      for (const comp of placeOrResult.address_components) {
        const types = comp.types || [];
        const cLong = comp.long_name || "";
        const cShort = comp.short_name || "";

        // Check if this component matches any known district
        if (!detectedDistrict) {
          for (const m of DISTRICT_MATCHERS) {
            const lowLong = cLong.toLowerCase();
            const lowShort = cShort.toLowerCase();
            if (m.keys.some((k) => lowLong.includes(k) || lowShort === k)) {
              detectedDistrict = isMn ? m.mn : m.en;
              break;
            }
          }
        }

        if (
          !detectedDistrict &&
          (types.includes("sublocality") ||
            types.includes("sublocality_level_1") ||
            types.includes("administrative_area_level_2"))
        ) {
          detectedDistrict = cLong;
        }

        if (!detectedCity && (types.includes("locality") || types.includes("administrative_area_level_1"))) {
          detectedCity = cLong;
        }

        if (
          types.includes("point_of_interest") ||
          types.includes("establishment") ||
          types.includes("premise")
        ) {
          if (!detectedVenue) detectedVenue = cLong;
        }
      }
    }

    // 2. Check formatted_address and name with DISTRICT_MATCHERS (handles "SBD", "BZD", "HUD", etc.)
    if (!detectedDistrict && formatted) {
      const lowFormatted = formatted.toLowerCase();
      for (const m of DISTRICT_MATCHERS) {
        if (
          m.keys.some((k) => {
            const reg = new RegExp(`(^|[^a-zа-я0-9])${k}([^a-zа-я0-9]|$)`, "i");
            return reg.test(lowFormatted) || lowFormatted.includes(k);
          })
        ) {
          detectedDistrict = isMn ? m.mn : m.en;
          break;
        }
      }
    }

    // 3. Fallback regex detection for Mongolian district names
    if (!detectedDistrict && formatted) {
      const match = formatted.match(/([А-Яа-яA-Za-z0-9\-]+ дүүрэг)/i);
      if (match) {
        detectedDistrict = match[1];
      } else {
        const found = DEFAULT_DISTRICTS.find(
          (d) =>
            formatted.toLowerCase().includes(d.toLowerCase()) ||
            formatted.toLowerCase().includes(d.replace(" дүүрэг", "").toLowerCase())
        );
        if (found) detectedDistrict = found;
      }
    }

    if (!detectedDistrict && detectedCity) {
      detectedDistrict = detectedCity;
    }

    return {
      address: formatted,
      district: detectedDistrict,
      city: detectedCity || "Улаанбаатар",
      venue: placeOrResult.name || detectedVenue,
    };
  }, [isMn]);

  // ─── Coordinate-based District Fallback ──────────────────────────────────
  const detectDistrictFromCoords = useCallback((cLat, cLng) => {
    if (typeof cLat !== "number" || typeof cLng !== "number") return "";

    if (cLng > 107.15 || (cLat < 47.85 && cLng > 107.05)) {
      return isMn ? "Налайх дүүрэг" : "Nalaikh District";
    }
    if (cLng > 108.0) {
      return isMn ? "Багануур дүүрэг" : "Baganuur District";
    }
    if (cLat < 47.7 && cLng > 107.3) {
      return isMn ? "Багахангай дүүрэг" : "Bagakhangai District";
    }

    if (cLat < 47.905) {
      return isMn ? "Хан-Уул дүүрэг" : "Khan-Uul District";
    }
    if (cLng < 106.845) {
      return isMn ? "Сонгинохайрхан дүүрэг" : "Songinokhairkhan District";
    }
    if (cLng < 106.895 && cLat <= 47.930) {
      return isMn ? "Баянгол дүүрэг" : "Bayangol District";
    }
    if (cLng > 106.945) {
      return isMn ? "Баянзүрх дүүрэг" : "Bayanzurkh District";
    }
    if (cLng < 106.918 && cLat >= 47.922) {
      return isMn ? "Чингэлтэй дүүрэг" : "Chingeltei District";
    }
    return isMn ? "Сүхбаатар дүүрэг" : "Sukhbaatar District";
  }, [isMn]);

  // ─── Resilient Reverse Geocoder Fallback ──────────────────────────────────
  const reverseGeocodeFallback = useCallback(
    async (cLat, cLng) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${cLat}&lon=${cLng}&format=json&addressdetails=1`,
          {
            headers: {
              "Accept-Language": isMn ? "mn,en" : "en,mn",
            },
          }
        );
        if (!res.ok) throw new Error("OSM reverse geocode network error");
        const data = await res.json();
        if (!data) throw new Error("No OSM data");

        const addrObj = data.address || {};
        const street = addrObj.road || addrObj.pedestrian || addrObj.street || "";
        const rawDistrict =
          addrObj.city_district ||
          addrObj.district ||
          addrObj.suburb ||
          addrObj.county ||
          "";
        const city = addrObj.city || addrObj.town || addrObj.state || "Улаанбаатар";

        let resolvedDistrict = "";
        if (rawDistrict) {
          for (const m of DISTRICT_MATCHERS) {
            const low = rawDistrict.toLowerCase();
            if (m.keys.some((k) => low.includes(k))) {
              resolvedDistrict = isMn ? m.mn : m.en;
              break;
            }
          }
        }
        if (!resolvedDistrict && data.display_name) {
          const lowDisplay = data.display_name.toLowerCase();
          for (const m of DISTRICT_MATCHERS) {
            if (m.keys.some((k) => lowDisplay.includes(k))) {
              resolvedDistrict = isMn ? m.mn : m.en;
              break;
            }
          }
        }
        if (!resolvedDistrict) {
          resolvedDistrict = detectDistrictFromCoords(cLat, cLng);
        }

        const cleanAddress = data.display_name
          ? data.display_name
            .split(",")
            .slice(0, 4)
            .map((s) => s.trim())
            .join(", ")
          : `${street || resolvedDistrict}, ${city}`;

        const venue = data.name || (street ? `${street}` : resolvedDistrict);

        return {
          address: cleanAddress,
          district: resolvedDistrict,
          city,
          venue: venue || resolvedDistrict,
        };
      } catch (err) {
        const fallbackDistrict = detectDistrictFromCoords(cLat, cLng);
        return {
          address: `${fallbackDistrict}, Улаанбаатар`,
          district: fallbackDistrict,
          city: "Улаанбаатар",
          venue: fallbackDistrict,
        };
      }
    },
    [detectDistrictFromCoords, isMn]
  );

  // ─── Centralized Map / Pin Location Updater ──────────────────────────────
  const updateLocationFromCoords = useCallback(
    (cLat, cLng) => {
      const roundedLat = Number(Number(cLat).toFixed(4));
      const roundedLng = Number(Number(cLng).toFixed(4));
      setLat(roundedLat);
      setLng(roundedLng);

      if (markerRef.current) {
        markerRef.current.setPosition({ lat: roundedLat, lng: roundedLng });
      }

      const applyLocationData = (parsed) => {
        if (!parsed) return;
        const nextAddress = String(parsed.address || "").trim();
        if (nextAddress) {
          setAddress(nextAddress);
          setAddrQuery(nextAddress);
          if (addressInputRef.current) addressInputRef.current.value = nextAddress;
        }
        if (parsed.district) {
          setDistrict(parsed.district);
        }
        setErrors((prev) => ({ ...prev, address: "" }));
        flashToast(isMn ? "Байршил шинэчлэгдлээ" : "Location updated from the map");
      };

      const applyFallback = async () => {
        const fallbackData = await reverseGeocodeFallback(roundedLat, roundedLng);
        if (fallbackData?.address) {
          applyLocationData(fallbackData);
          return;
        }
        const districtName = detectDistrictFromCoords(roundedLat, roundedLng);
        applyLocationData({
          address: districtName ? `${districtName}, Улаанбаатар` : `${roundedLat}, ${roundedLng}`,
          district: districtName,
          venue: "",
        });
      };

      if (window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: roundedLat, lng: roundedLng } }, (results, status) => {
          if (status === "OK" && results && results.length > 0) {
            const poiResult = results.find((r) =>
              r.types?.some((t) => ["point_of_interest", "establishment", "premise", "subpremise"].includes(t))
            );
            const hit = poiResult || results[0];
            const parsed = parseGeocodeLocation(hit) || {};
            applyLocationData({
              ...parsed,
              address: hit.formatted_address || parsed.address || "",
            });
          } else {
            applyFallback();
          }
        });
      } else {
        applyFallback();
      }
    },
    [isMn, parseGeocodeLocation, reverseGeocodeFallback, detectDistrictFromCoords]
  );

  // Drop a pin on the grid map and fill the address from that point.
  const handleMapClick = (e) => {
    if (e.target.closest("button")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pctX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const pctY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const newLng = Number((MAPBOX.lng0 + pctX * (MAPBOX.lng1 - MAPBOX.lng0)).toFixed(4));
    const newLat = Number((MAPBOX.lat0 + pctY * (MAPBOX.lat1 - MAPBOX.lat0)).toFixed(4));

    const near = nearestAddr(newLat, newLng);
    if (near) {
      setAddress(near[0]);
      setAddrQuery(near[0]);
      if (addressInputRef.current) addressInputRef.current.value = near[0];
    } else {
      const districtName = detectDistrictFromCoords(newLat, newLng);
      const rough = districtName ? `${districtName}, Улаанбаатар` : `${newLat}, ${newLng}`;
      setAddress(rough);
      setAddrQuery(rough);
      if (addressInputRef.current) addressInputRef.current.value = rough;
      if (districtName) setDistrict(districtName);
    }
    setErrors((prev) => ({ ...prev, address: "" }));
    updateLocationFromCoords(newLat, newLng);
    setPinMode(false);
  };

  // ─── Load Google Maps in the active organizer language ────────────────────
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      setMapsFailed(true);
      setGoogleMapsLoaded(false);
      return;
    }

    let cancelled = false;
    const lang = isMn ? "mn" : "en";
    const callbackName = `__bondyMapsReady_${lang}`;
    const existing = document.getElementById("google-maps-script");

    if (existing?.dataset.lang === lang && window.google?.maps?.places) {
      setMapsFailed(false);
      setGoogleMapsLoaded(true);
      return;
    }

    setGoogleMapsLoaded(false);

    const timer = setTimeout(() => {
      if (cancelled) return;
      googleMapRef.current = null;
      markerRef.current = null;

      document.querySelectorAll('script[src*="maps.googleapis.com"], script[src*="maps.gstatic.com"]').forEach((node) => node.remove());
      try {
        delete window.google;
      } catch (e) {
        window.google = undefined;
      }

      window[callbackName] = () => {
        if (cancelled) return;
        setMapsFailed(false);
        setGoogleMapsLoaded(true);
      };

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.dataset.lang = lang;
      script.async = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=${lang}&callback=${callbackName}`;
      script.onerror = () => {
        if (cancelled) return;
        setMapsFailed(true);
        setGoogleMapsLoaded(false);
      };
      document.head.appendChild(script);

      const poll = setInterval(() => {
        if (cancelled) {
          clearInterval(poll);
          return;
        }
        if (window.google?.maps?.places) {
          clearInterval(poll);
          setMapsFailed(false);
          setGoogleMapsLoaded(true);
        }
      }, 150);
      setTimeout(() => clearInterval(poll), 8000);
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isMn]);

  const moveMapTo = useCallback((pLat, pLng, zoom = 16) => {
    const pos = {
      lat: Number(Number(pLat).toFixed(4)),
      lng: Number(Number(pLng).toFixed(4)),
    };
    if (!Number.isFinite(pos.lat) || !Number.isFinite(pos.lng)) return;
    setLat(pos.lat);
    setLng(pos.lng);
    if (markerRef.current) markerRef.current.setPosition(pos);
    if (googleMapRef.current) {
      googleMapRef.current.panTo(pos);
      if (zoom) googleMapRef.current.setZoom(zoom);
    }
  }, []);

  const applySelectedPlace = useCallback((place) => {
    if (!place) return;
    const parsed = parseGeocodeLocation(place) || {};
    const nextAddress = place.formatted_address || parsed.address || place.name || "";
    if (nextAddress) {
      setAddress(nextAddress);
      setAddrQuery(nextAddress);
      if (addressInputRef.current) addressInputRef.current.value = nextAddress;
    }
    if (parsed.district) setDistrict(parsed.district);
    if (place.geometry?.location) {
      moveMapTo(place.geometry.location.lat(), place.geometry.location.lng());
    }
    setErrors((prev) => ({ ...prev, address: "", venueName: "" }));
    setPinMode(false);
    flashToast(isMn ? "Байршил бөглөгдлөө" : "Location updated");
  }, [parseGeocodeLocation, moveMapTo, isMn]);

  // ─── Attach Google Places Autocomplete to Inputs ─────────────────────────
  useEffect(() => {
    if (step !== 2 || !googleMapsLoaded || typeof window === "undefined" || !window.google?.maps?.places) return;

    const placeFields = ["place_id", "name", "formatted_address", "geometry", "address_components"];
    let addrAc;

    const resolvePlace = (autocomplete) => {
      const place = autocomplete.getPlace();
      if (!place) return;
      if (place.geometry?.location) {
        applySelectedPlace(place);
        return;
      }
      const typed = addressInputRef.current?.value || place.name || "";
      if (place.place_id && window.google.maps.places.PlacesService) {
        const host = googleMapRef.current || document.createElement("div");
        const service = new window.google.maps.places.PlacesService(host);
        service.getDetails({ placeId: place.place_id, fields: placeFields }, (detail, status) => {
          if (status === "OK" && detail?.geometry?.location) {
            applySelectedPlace(detail);
          } else if (typed && window.google.maps.Geocoder) {
            new window.google.maps.Geocoder().geocode({ address: typed }, (results, geoStatus) => {
              if (geoStatus === "OK" && results?.[0]) applySelectedPlace(results[0]);
            });
          }
        });
        return;
      }
      if (typed && window.google.maps.Geocoder) {
        new window.google.maps.Geocoder().geocode({ address: typed }, (results, geoStatus) => {
          if (geoStatus === "OK" && results?.[0]) applySelectedPlace(results[0]);
        });
      }
    };

    if (addressInputRef.current) {
      try {
        addrAc = new window.google.maps.places.Autocomplete(addressInputRef.current, {
          fields: placeFields,
        });
        addrAc.addListener("place_changed", () => resolvePlace(addrAc));
      } catch (e) {
        console.warn("Error setting up address autocomplete:", e);
      }
    }

    return () => {
      if (window.google?.maps?.event && addrAc) {
        window.google.maps.event.clearInstanceListeners(addrAc);
      }
    };
  }, [googleMapsLoaded, step, applySelectedPlace]);

  updateLocationRef.current = updateLocationFromCoords;

  // ─── Initialize Interactive Google Map in Step 2 ──────────────────────────
  useEffect(() => {
    if (step !== 2 || !googleMapsLoaded || !mapContainerRef.current || typeof window === "undefined" || !window.google?.maps) return;

    const initialPos = {
      lat: typeof latRef.current === "number" && !isNaN(latRef.current) ? latRef.current : 47.9186,
      lng: typeof lngRef.current === "number" && !isNaN(lngRef.current) ? lngRef.current : 106.9176,
    };

    const map = new window.google.maps.Map(mapContainerRef.current, {
      center: initialPos,
      zoom: 15,
      styles: BONDY_DARK_MAP_STYLE,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_TOP,
      },
      gestureHandling: "greedy",
      scrollwheel: true,
      clickableIcons: false,
      backgroundColor: "#141414",
    });

    const marker = new window.google.maps.Marker({
      position: initialPos,
      map,
      draggable: true,
      icon: {
        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
        fillColor: "#23ada4",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 1.5,
        scale: 1.6,
        anchor: new window.google.maps.Point(12, 22),
      },
    });

    const dropPin = (latLng) => {
      if (!latLng || !updateLocationRef.current) return;
      updateLocationRef.current(latLng.lat(), latLng.lng());
      setPinMode(false);
    };

    const clickListener = map.addListener("click", (e) => dropPin(e.latLng));
    const dragListener = marker.addListener("dragend", (e) => dropPin(e.latLng));

    googleMapRef.current = map;
    markerRef.current = marker;

    return () => {
      if (window.google?.maps?.event) {
        window.google.maps.event.removeListener(clickListener);
        window.google.maps.event.removeListener(dragListener);
      }
      googleMapRef.current = null;
      markerRef.current = null;
    };
  }, [step, googleMapsLoaded]);

  // Keep Google Map synced when coordinates change
  useEffect(() => {
    if (googleMapRef.current && markerRef.current && typeof lat === "number" && typeof lng === "number") {
      const pos = { lat, lng };
      markerRef.current.setPosition(pos);
      googleMapRef.current.panTo(pos);
    }
  }, [lat, lng]);

  useEffect(() => {
    if (!googleMapRef.current || !window.google?.maps) return;
    googleMapRef.current.setOptions({
      draggableCursor: pinMode ? "crosshair" : null,
    });
  }, [pinMode, googleMapsLoaded, step]);

  // ─── File Uploads ─────────────────────────────────────────────────────────
  const handlePosterUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPoster(true);
    setUpPct(30);
    try {
      const formData = new FormData();
      formData.append("files", file);
      setUpPct(60);
      const res = await authApi.uploadFile(formData);
      setUpPct(100);

      if (res?.data?.files && res.data.files.length > 0) {
        const uploadedPath = res.data.files[0];
        setPoster(uploadedPath);
        setPosterName(file.name);
        setPosterSize(`${(file.size / 1024 / 1024).toFixed(1)} MB`);
        setErrors((prev) => ({ ...prev, poster: "" }));
        flashToast(isMn ? "Постер амжилттай хуулагдлаа" : "Poster uploaded successfully");
      }
    } catch (err) {
      console.error("Poster upload failed:", err);
      flashToast(isMn ? "Зураг хуулж чадсангүй" : "Failed to upload poster");
    } finally {
      setUploadingPoster(false);
      setUpPct(0);
    }
  };

  const handleGalleryUpload = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (!picked.length) return;

    const room = 5 - gallery.length;
    if (room <= 0) {
      flashToast(t("apGalleryTooMany"));
      return;
    }
    const files = [];
    let tooBig = false;
    picked.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        tooBig = true;
        return;
      }
      if (files.length < room) files.push(file);
    });
    if (tooBig) flashToast(t("apGalleryTooBig"));
    if (picked.filter((file) => file.size <= 5 * 1024 * 1024).length > room) flashToast(t("apGalleryTooMany"));
    if (!files.length) return;

    setUploadingGallery(true);
    try {
      const newLinks = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("files", file);
        const res = await authApi.uploadFile(formData);
        if (res?.data?.files?.[0]) {
          newLinks.push(res.data.files[0]);
        }
      }
      setGallery((prev) => [...prev, ...newLinks].slice(0, 5));
      flashToast(isMn ? "Цомгийн зураг нэмэгдлээ" : "Gallery images added");
    } catch (err) {
      console.error("Gallery upload failed:", err);
      flashToast(isMn ? "Зураг хуулж чадсангүй" : "Failed to upload gallery image");
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (idx) => {
    setGallery((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      flashToast(isMn ? "Видеоны хэмжээ 50MB-аас ихгүй байх ёстой" : "Video size must not exceed 50MB");
      if (e.target) e.target.value = "";
      return;
    }

    setUploadingVideo(true);
    setVideoPct(0);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const res = await authApi.uploadFile(formData, (pct) => {
        setVideoPct(pct);
      });
      if (res?.data?.files?.[0]) {
        setTeaserVideo(res.data.files[0]);
        setTeaserName(file.name);
        flashToast(isMn ? "Видео амжилттай хуулагдлаа" : "Video uploaded");
      }
    } catch (err) {
      console.error("Video upload failed:", err);
      flashToast(isMn ? "Видео хуулж чадсангүй" : "Failed to upload video");
    } finally {
      setUploadingVideo(false);
      setVideoPct(0);
      if (e.target) e.target.value = "";
    }
  };

  const removeTeaserVideo = () => {
    setTeaserVideo("");
    setTeaserName("");
  };

  // ─── Step Validation ──────────────────────────────────────────────────────
  const validateStep = (s) => {
    const errs = {};
    if (s === 1) {
      if (!title.trim()) {
        errs.title = isMn ? "Эвентийн нэрээ бичнэ үү." : "Event title is required.";
      } else if (title.trim().length < 3) {
        errs.title = isMn
          ? "Талбар хамгийн багадаа 3 тэмдэгттэй байх ёстой."
          : "The field must contain a minimum of 3 characters.";
      }
      if (!shortDesc.trim() || shortDesc.length < 10) {
        errs.short = isMn ? "Хамгийн багадаа 10 тэмдэгт бичнэ үү." : "At least 10 characters required.";
      }
      if (!longDesc.trim()) {
        errs.long = isMn ? "Дэлгэрэнгүй тайлбар шаардлагатай" : "Detailed description is required";
      } else if (longDesc.trim().length < 40 || longDesc.trim().length > 800) {
        errs.long = isMn
          ? "Талбар хамгийн багадаа 40, хамгийн ихдээ 800 тэмдэгттэй байх ёстой."
          : "The field must contain a minimum of 40 characters and a maximum of 800 characters.";
      }
      if (!categoryId) errs.category = isMn ? "Ангиллаа сонгоно уу." : "Category is required.";
      if (!poster) errs.poster = isMn ? "Постер зургаа оруулна уу." : "Poster image is required.";
    }

    if (s === 2) {
      if (!startDate) errs.startDate = isMn ? "Эхлэх огноог сонгоно уу." : "Start date is required.";
      else if (startDate < todayISO()) {
        errs.startDate = isMn ? "Эхлэх огноо өнөөдрөөс өмнө байж болохгүй." : "Start date cannot be before today.";
      }
      if (!startTime) errs.startTime = isMn ? "Эхлэх цагийг оруулна уу." : "Start time is required.";
      if (!endDate) errs.endDate = isMn ? "Дуусах огноог сонгоно уу." : "End date is required.";
      if (!endTime) errs.endTime = isMn ? "Дуусах цагийг оруулна уу." : "End time is required.";
      if (startDate && endDate && endDate < startDate) {
        errs.endDate = isMn ? "Дуусах огноо эхлэх огнооноос өмнө байж болохгүй." : "End date cannot be before the start date.";
      }
      if (startDate && endDate && startDate === endDate && startTime && endTime && endTime <= startTime) {
        errs.endTime = isMn ? "Дуусах цаг эхлэх цагаас өмнө байж болохгүй." : "End time cannot be before the start time.";
      }
      const venue = venueName.trim();
      if (venue.length < 2 || venue.length > 150) {
        errs.venueName = isMn
          ? "Байршлын нэр 2–150 тэмдэгт байна."
          : "Venue name must be 2 to 150 characters.";
      }
      if (!address.trim() || address.trim().length > 180) errs.address = t("apAddressLen");
    }

    if (s === 3) {
      if (isFree) {
        if (!validDigitAmount(freeCap)) {
          errs.freeCap = isMn
            ? "Тоо ширхэг 1–10 оронтой тоо байна."
            : "Quantity must be 1 to 10 digits.";
        }
        const ss = String(freeSs || "").trim();
        const se = String(freeSe || "").trim();
        const now = nowStamp();
        if (ss && ss < now) {
          errs.freeSs = true;
          errs.freeSales = isMn
            ? "Бүртгэл эхлэх хугацаа өнгөрсөн байж болохгүй."
            : "The registration start cannot be in the past.";
        } else if (se && se < now) {
          errs.freeSe = true;
          errs.freeSales = isMn
            ? "Бүртгэл дуусах хугацаа өнгөрсөн байж болохгүй."
            : "The registration end cannot be in the past.";
        } else if (ss && se && se <= ss) {
          errs.freeSe = true;
          errs.freeSales = isMn
            ? "Бүртгэл дуусах хугацаа эхлэхээс хойш байх ёстой."
            : "Registration must close after it opens.";
        } else if (se && (endDate || startDate) && se.slice(0, 10) > (endDate || startDate)) {
          errs.freeSe = true;
          errs.freeSales = isMn
            ? "Бүртгэл эвентийн өдрөөс хожуу дуусах боломжгүй."
            : "Registration cannot close after the event date.";
        }
      } else {
        if (!tickets || tickets.length === 0) {
          errs.tickets = isMn
            ? "Хамгийн багадаа нэг бүрэн тасалбарын төрөл шаардлагатай."
            : "You need at least one complete ticket type.";
        } else {
          const names = {};
          tickets.forEach((t, i) => {
            const nm = String(t.name || "").trim();
            if (nm.length < 2 || nm.length > 150) {
              errs[`tkName_${i}`] = isMn
                ? "Тасалбарын нэр 2–150 тэмдэгт байна."
                : "Ticket name must be 2 to 150 characters.";
            } else if (names[nm.toLowerCase()]) {
              errs[`tkName_${i}`] = isMn ? "Ижил нэр давхардаж байна." : "That name is already used.";
            }
            if (nm) names[nm.toLowerCase()] = true;
            const desc = String(t.desc || "").trim();
            if (desc.length > 200) {
              errs[`tkDesc_${i}`] = isMn
                ? "Товч тайлбар хамгийн ихдээ 200 тэмдэгт байна."
                : "Short description must be at most 200 characters.";
            }
            if (!validDigitAmount(t.price)) {
              errs[`tkPrice_${i}`] = isMn
                ? "Үнэ 1–10 оронтой тоо байна."
                : "Price must be 1 to 10 digits.";
            }
            if (!validDigitAmount(t.cap)) {
              errs[`tkCap_${i}`] = isMn
                ? "Тоо ширхэг 1–10 оронтой тоо байна."
                : "Quantity must be 1 to 10 digits.";
            }
            if (t.ss && t.se && t.se < t.ss) {
              errs[`tkSales_${i}`] = isMn
                ? "Борлуулалт дуусах огноо эхлэхээс хойш байх ёстой."
                : "Sales must end after they start.";
            } else if (t.se && (endDate || startDate) && t.se > (endDate || startDate)) {
              errs[`tkSales_${i}`] = isMn
                ? "Борлуулалт эвентийн өдрөөс хожуу дуусах боломжгүй."
                : "Sales cannot end after the event date.";
            }
          });
        }
        if (!policy) {
          errs.policy = isMn ? "Буцаан олголтын нөхцөлөө сонгоно уу." : "Choose a refund policy.";
        }
      }
    }

    if (s === 4) {
      if (String(entryNotes || "").trim().length > 500) {
        errs.entryNotes = isMn
          ? "Нэвтрэх тэмдэглэл хамгийн ихдээ 500 тэмдэгт байна."
          : "Entry requirements must be at most 500 characters.";
      }
      if (String(dressCode || "").trim().length > 300) {
        errs.dressCode = isMn
          ? "Хувцаслалтын дүрэм хамгийн ихдээ 300 тэмдэгт байна."
          : "Dress code must be at most 300 characters.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(5, prev + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGotoStep = (targetStep) => {
    // If going forward, validate current step
    if (targetStep > step) {
      if (!validateStep(step)) return;
    }
    setStep(targetStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Build Submission Payload ─────────────────────────────────────────────
  const buildPayload = (asDraft = false) => {
    const formattedTickets = isFree
      ? (Number(freeCap) > 0
        ? [
          {
            ticketName: isMn ? "Бүртгэл" : "Registrations",
            ticketShortDesc: "",
            price: 0,
            qty: Number(freeCap),
            isFreeTicket: true,
            ...(freeSs ? { salesStart: freeSs } : {}),
            ...(freeSe ? { salesEnd: freeSe } : {}),
          },
        ]
        : [])
      : tickets
        .filter((t) => String(t.name || "").trim() && Number(t.cap) > 0)
        .map((t) => ({
          ticketName: t.name.trim(),
          ticketShortDesc: t.desc || "",
          price: Number(t.price) || 0,
          qty: Number(t.cap),
          isFreeTicket: false,
          ...(t.ss ? { salesStart: t.ss } : {}),
          ...(t.se ? { salesEnd: t.se } : {}),
        }));

    const totalTicketsCount = formattedTickets.reduce((sum, t) => sum + (t.qty || 0), 0);

    return {
      eventTitle: title,
      shortdesc: shortDesc,
      longdesc: longDesc,
      eventCategory: categoryId || null,
      posterImage: poster ? [poster] : [],
      mediaLinks: gallery,
      shortTeaserVideo: teaserVideo ? [teaserVideo] : [],
      startDate: startDate || "",
      startTime: startTime || "",
      endDate: endDate || startDate || "",
      endTime: endTime || "",
      venueName: venueName || "",
      venueAddress: {
        address: address || "",
        city: district || "Улаанбаатар",
        country: "Монгол",
        latitude: lat || 47.9186,
        longitude: lng || 106.9176,
      },
      tickets: formattedTickets,
      totalTickets: totalTicketsCount,
      refundPolicy: isFree ? "" : (policy || ""),
      visibility: visibility === "public" ? "PUBLIC" : "PRIVATE",
      accessAndPrivacy: visibility === "public",
      ageRestriction: (ageRestriction === "all" || ageRestriction === "ALL") ? "ALL" : (String(ageRestriction).endsWith("+") ? ageRestriction : `${ageRestriction}+`),
      dressCode: dressCode.trim(),
      notes: entryNotes.trim(),
      tags: entryNotes.trim() ? [entryNotes.trim()] : [],
      isDraft: asDraft,
    };
  };

  // ─── Save as Draft Handlers ──────────────────────────────────────────────
  const promptSaveDraft = () => {
    setAsk({
      kind: "savedraft",
      title: isMn ? "Ноорогт хадгалах уу?" : "Save to Drafts?",
      body: isMn
        ? "Таны оруулсан мэдээллийг ноорог болгон хадгалснаар та хүссэн үедээ үргэлжлүүлэн засах боломжтой болно."
        : "Your entered information will be saved as a draft. You can continue editing at any time.",
      acts: [
        { key: "save", label: isMn ? "Ноорогт хадгалах" : "Save Draft", cls: "ew-go" },
        { key: "cancel", label: isMn ? "Болих" : "Cancel", cls: "ew-gh" },
      ],
    });
  };

  const executeSaveDraft = async () => {
    if (liveBlockedModal) {
      flashToast(isMn ? "Таны эвент шууд явагдаж байгаа тул засах боломжгүй." : "Your event is live, you cannot edit this.");
      return;
    }
    if (!title.trim()) {
      flashToast(isMn ? "Эвентийн нэр оруулна уу" : "Event title is required to save draft");
      setErrors((prev) => ({ ...prev, title: isMn ? "Эвентийн нэрээ бичнэ үү." : "Title required" }));
      return;
    }
    if (title.trim().length < 3) {
      flashToast(isMn ? "Талбар хамгийн багадаа 3 тэмдэгттэй байх ёстой." : "The field must contain a minimum of 3 characters.");
      setErrors((prev) => ({
        ...prev,
        title: isMn ? "Талбар хамгийн багадаа 3 тэмдэгттэй байх ёстой." : "The field must contain a minimum of 3 characters.",
      }));
      return;
    }
    if (longDesc.trim().length > 0 && (longDesc.trim().length < 40 || longDesc.trim().length > 800)) {
      flashToast(
        isMn
          ? "Талбар хамгийн багадаа 40, хамгийн ихдээ 800 тэмдэгттэй байх ёстой."
          : "The field must contain a minimum of 40 characters and a maximum of 800 characters."
      );
      setErrors((prev) => ({
        ...prev,
        long: isMn
          ? "Талбар хамгийн багадаа 40, хамгийн ихдээ 800 тэмдэгттэй байх ёстой."
          : "The field must contain a minimum of 40 characters and a maximum of 800 characters.",
      }));
      return;
    }

    setDraftBusy(true);
    try {
      const payload = buildPayload(true);
      let res;
      let savedId = eventIdParam;
      if (eventIdParam) {
        res = await eventApi.updateEvent(eventIdParam, payload);
      } else {
        res = await eventApi.createEvent(payload);
        savedId = res?.data?.data?._id || res?.data?.event?._id || res?.data?._id;
      }

      if (savedId) {
        setCreatedEventId(savedId);
      }
      clearEventData();
      flashToast(isMn ? "Ноорогт хадгаллаа" : "Draft saved");

      setDone({
        kind: "draft",
        tileBg: "rgba(35, 173, 164, 0.14)",
        tileColor: "var(--acc-bright)",
        icon: "check",
        title: isMn ? "Ноорогт хадгалагдлаа" : "Saved to Drafts",
        body: isMn ? "Дараа үргэлжлүүлэн засах боломжтой." : "You can continue editing at any time.",
        acts: [
          { key: "continue", label: isMn ? "Үргэлжлүүлэн засах" : "Continue Editing", cls: "ew-go" },
          { key: "events", label: isMn ? "Миний эвентүүд" : "My Events", cls: "ew-gh" },
        ],
      });
    } catch (err) {
      console.error("Failed to save draft:", err);
      setDone({
        kind: "draftfail",
        tileBg: "rgba(255, 90, 90, 0.13)",
        tileColor: "#FF5A5A",
        icon: "danger",
        title: isMn ? "Ноорог хадгалагдсангүй" : "Failed to Save Draft",
        body: isMn ? "Сүлжээнд холбогдож чадсангүй. Дахин оролдоно уу." : "Unable to reach server. Please try again.",
        acts: [
          { key: "retrydraft", label: isMn ? "Дахин оролдох" : "Retry", cls: "ew-go" },
          { key: "cancel", label: isMn ? "Хаах" : "Close", cls: "ew-gh" },
        ],
      });
    } finally {
      setDraftBusy(false);
    }
  };

  // ─── Leave / Discard Handler ──────────────────────────────────────────────
  const handleLeave = () => {
    const isDirty = Boolean(title.trim() || shortDesc.trim() || startDate || (tickets && tickets.length > 0));
    if (isDirty) {
      setAsk({
        kind: "leave",
        title: isMn ? "Хадгалаагүй өөрчлөлт байна" : "Unsaved Changes",
        body: isMn
          ? "Гарвал бөглөсөн мэдээлэл алдагдана. Ноорогт хадгалах эсвэл үргэлжлүүлэн засаж болно."
          : "Leaving will discard entered information. You can save as a draft or continue editing.",
        acts: [
          { key: "stay", label: isMn ? "Үргэлжлүүлэх" : "Keep Editing", cls: "ew-go" },
          { key: "save", label: isMn ? "Ноорогт хадгалах" : "Save Draft", cls: "ew-gh" },
          { key: "discard", label: isMn ? "Хаях" : "Discard", cls: "ew-gh" },
        ],
      });
      return;
    }
    router.push("/EventsManagement");
  };

  // ─── Ticket Removal Confirmation ──────────────────────────────────────────
  const confirmRemoveTicket = (idx) => {
    setPendingRemoveTicketIdx(idx);
    setAsk({
      kind: "rmtk",
      title: isMn ? "Тасалбарын төрлийг хасах уу?" : "Remove ticket tier?",
      body: isMn
        ? "Хасвал энэ төрлийн үнэ, орон, борлуулалтын хугацаа устана."
        : "Removing this tier will delete its price, capacity, and sale dates.",
      acts: [
        { key: "rmyes", label: isMn ? "Хасах" : "Remove", cls: "ew-go" },
        { key: "cancel", label: isMn ? "Болих" : "Cancel", cls: "ew-gh" },
      ],
    });
  };

  // ─── Ask Sheet Action Click ───────────────────────────────────────────────
  const handleAskAction = async (key) => {
    if (key === "stay" || key === "cancel") {
      setAsk(null);
      return;
    }
    if (key === "discard") {
      setAsk(null);
      clearEventData();
      router.push("/EventsManagement");
      return;
    }
    if (key === "save") {
      setAsk(null);
      await executeSaveDraft();
      return;
    }
    if (key === "rmyes") {
      const idx = pendingRemoveTicketIdx;
      if (idx !== null && idx !== undefined) {
        setTickets((prev) => prev.filter((_, i) => i !== idx));
        setPendingRemoveTicketIdx(null);
        flashToast(isMn ? "Тасалбарын төрөл хасагдлаа" : "Ticket type removed");
      }
      setAsk(null);
      return;
    }
    setAsk(null);
  };

  // ─── Done Sheet Action Click ──────────────────────────────────────────────
  const handleDoneAction = (key) => {
    if (key === "continue") {
      setDone(null);
      return;
    }
    if (key === "events") {
      setDone(null);
      router.push("/EventsManagement");
      return;
    }
    if (key === "dash") {
      setDone(null);
      router.push("/Dashboard");
      return;
    }
    if (key === "view") {
      setDone(null);
      if (createdEventId) {
        router.push(`/EventDetailOrganiser?eventId=${createdEventId}`);
      } else {
        router.push("/EventsManagement");
      }
      return;
    }
    if (key === "retrydraft") {
      setDone(null);
      executeSaveDraft();
      return;
    }
    if (key === "retrypub") {
      setDone(null);
      handlePublish();
      return;
    }
    if (key === "savedraft") {
      setDone(null);
      executeSaveDraft();
      return;
    }
    setDone(null);
  };

  // ─── Publish / Save Changes (Step 5) ──────────────────────────────────────
  const handlePublish = async () => {
    if (liveBlockedModal) {
      flashToast(isMn ? "Таны эвент шууд явагдаж байгаа тул засах боломжгүй." : "Your event is live, you cannot edit this.");
      return;
    }
    // Final check across all steps
    const failedStep = [1, 2, 3, 4].find((n) => !validateStep(n));
    if (failedStep) {
      setStep(failedStep);
      flashToast(isMn ? "Дутуу бөглөсөн талбар байна" : "Please complete required fields");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setPubBusy(true);
    try {
      const payload = buildPayload(false);
      let res;
      let targetId = eventIdParam;

      if (eventIdParam) {
        res = await eventApi.updateEvent(eventIdParam, payload);
      } else {
        res = await eventApi.createEvent(payload);
        targetId = res?.data?.data?._id || res?.data?.event?._id || res?.data?._id;
      }

      if (!res || res.status === false) {
        flashToast(res?.message || (isMn ? "Хадгалж чадсангүй." : "Could not save the event."));
        return;
      }

      if (targetId) {
        setCreatedEventId(targetId);
      }
      clearEventData();
      setDone({
        kind: isEditMode && !isDraftMode ? "updated" : "published",
        tileBg: "rgba(35, 173, 164, 0.14)",
        tileColor: "var(--acc-bright)",
        icon: "check",
        title: isEditMode && !isDraftMode ? (isMn ? "Эвент шинэчлэгдлээ" : "Changes Saved") : (isMn ? "Хяналтад илгээгдлээ" : "Submitted for Review"),
        body: isEditMode && !isDraftMode
          ? (isMn ? "Өөрчлөлт нийтийн хуудсанд тэр даруй харагдана." : "Changes are now live on the public page.")
          : (isMn ? "Bondy мэдээллийг хянаж, баталгаажуулсны дараа эвент нийтийн сайт дээр харагдана." : "Bondy will review and publish your event once verified."),
        acts: [
          ...(targetId ? [{ key: "view", label: isMn ? "Эвентийг харах" : "View Event", cls: "ew-go" }] : []),
          { key: "events", label: isMn ? "Миний эвентүүд" : "My Events", cls: targetId ? "ew-gh" : "ew-go" },
          { key: "dash", label: isMn ? "Хянах самбар" : "Dashboard", cls: "ew-gh" },
        ],
      });
    } catch (err) {
      console.error("Failed to publish event:", err);
      setDone({
        kind: "fail",
        tileBg: "rgba(255, 90, 90, 0.13)",
        tileColor: "#FF5A5A",
        icon: "danger",
        title: isMn ? "Нийтлэлт амжилтгүй" : "Publish Failed",
        body: err.response?.data?.message || (isMn ? "Сервер хүсэлтийг боловсруулж чадсангүй. Дахин оролдоно уу." : "Server could not process the request. Please try again."),
        acts: [
          { key: "retrypub", label: isMn ? "Дахин оролдох" : "Retry", cls: "ew-go" },
          { key: "savedraft", label: isMn ? "Ноорогт хадгалах" : "Save Draft", cls: "ew-gh" },
          { key: "cancel", label: isMn ? "Хаах" : "Close", cls: "ew-gh" },
        ],
      });
    } finally {
      setPubBusy(false);
    }
  };

  // Step Progress Calculation
  const progressPct = step * 20;
  const categoriesList = dbCategories.length > 0
    ? dbCategories.map((c) => ({ id: c._id, label: formatCategoryName(c, isMn ? "mn" : "en"), en: capitalizeWords(c.name) }))
    : FALLBACK_CATS;

  const startInPast = Boolean(startDate && startDate < todayISO());
  const startDateError = errors.startDate || (startInPast
    ? (isMn ? "Эхлэх огноо өнөөдрөөс өмнө байж болохгүй." : "Start date cannot be before today.")
    : "");
  const endBeforeStart = Boolean(startDate && endDate && endDate < startDate);
  const endTimeBeforeStart = Boolean(
    startDate && endDate && startDate === endDate && startTime && endTime && endTime <= startTime
  );
  const endDateError = errors.endDate || (endBeforeStart
    ? (isMn ? "Дуусах огноо эхлэх огнооноос өмнө байж болохгүй." : "End date cannot be before the start date.")
    : "");
  const endTimeError = errors.endTime || (endTimeBeforeStart
    ? (isMn ? "Дуусах цаг эхлэх цагаас өмнө байж болохгүй." : "End time cannot be before the start time.")
    : "");
  const endTimeMin = startDate && endDate && startDate === endDate && startTime && nextMinute(startTime) > startTime
    ? nextMinute(startTime)
    : undefined;
  const pinAt = pinPercents(lat, lng);

  if (initialLoading) {
    return <GlobalLoader fullScreen={false} message={isMn ? "Уншиж байна..." : "Loading event editor..."} />;
  }

  return (
    <main
      data-screen-label="Эвент нэмэх"
      style={{
        flex: 1,
        padding: "clamp(20px, 2.4vw, 30px) clamp(18px, 2.4vw, 32px) clamp(96px, 8vw, 120px)",
      }}
    >
      {/* ─── Mobile Sticky Topbar ─────────────────────────────────────────── */}
      <div className="ew-mobbar">
        <button
          type="button"
          className="ew-mobback"
          onClick={handleLeave}
          aria-label={isMn ? "Буцах" : "Back"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="ew-mobbarT">
          <b>{isEditMode ? (isDraftMode ? (isMn ? "Ноорог засах" : "Edit Draft") : (isMn ? "Эвент засах" : "Edit Event")) : (isMn ? "Эвент нэмэх" : "Create Event")}</b>
        </span>
        <button
          type="button"
          className="ew-mobdraft"
          onClick={promptSaveDraft}
          disabled={draftBusy}
        >
          {draftBusy ? <span className="ew-sp" /> : isMn ? "Ноорог" : "Draft"}
        </button>
      </div>

      <div className="ew-page">
        {/* ─── Step Pills (1 to 5) ─────────────────────────────────────────── */}
        <div className="ew-steps bd-scroll">
          {(isMn ? STEPS_MN : STEPS_EN).map((label, idx) => {
            const stepNum = idx + 1;
            const isSelected = step === stepNum;
            return (
              <button
                key={stepNum}
                type="button"
                className="ew-step"
                aria-selected={isSelected}
                onClick={() => handleGotoStep(stepNum)}
              >
                <span className="ew-num">{stepNum}</span>
                <span className="ew-lbl">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="ew-bar">
          <span className="ew-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="ew-of">
          {isMn
            ? `Алхам ${step}/5 · ${STEPS_MN[step - 1]}`
            : `Step ${step}/5 · ${STEPS_EN[step - 1]}`}
        </p>

        {/* Draft Notice Banner */}
        {isDraftMode && (
          <div
            className="ew-note"
            style={{
              borderColor: "rgba(255, 138, 51, 0.5)",
              background: "rgba(255, 138, 51, 0.09)",
              color: "#FFD9BC",
              marginTop: "14px",
            }}
          >
            {isMn
              ? "Ноорог хэвээр байна. Дутуу талбаруудыг бөглөж нийтэлнэ үү."
              : "This event is currently a draft. Complete remaining steps to publish live."}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            STEP 1: Үндсэн мэдээлэл (Basic Information)
            ═════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="ew-grid2">
            {/* Left Column */}
            <section className="ew-cardIn">
              {/* Event Title */}
              <label className="ew-f">
                <span className="ew-lb">
                  {isMn ? "Эвентийн нэр" : "Event Title"} <i>*</i>
                </span>
                <input
                  type="text"
                  className="ew-in"
                  value={title}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 80);
                    setTitle(val);
                    if (val.trim() && val.trim().length < 3) {
                      setErrors((prev) => ({
                        ...prev,
                        title: isMn
                          ? "Талбар хамгийн багадаа 3 тэмдэгттэй байх ёстой."
                          : "The field must contain a minimum of 3 characters.",
                      }));
                    } else if (errors.title) {
                      setErrors((prev) => ({ ...prev, title: "" }));
                    }
                  }}
                  onBlur={() => {
                    if (!title.trim()) {
                      setErrors((prev) => ({
                        ...prev,
                        title: isMn ? "Эвентийн нэрээ бичнэ үү." : "Event title is required.",
                      }));
                    } else if (title.trim().length < 3) {
                      setErrors((prev) => ({
                        ...prev,
                        title: isMn
                          ? "Талбар хамгийн багадаа 3 тэмдэгттэй байх ёстой."
                          : "The field must contain a minimum of 3 characters.",
                      }));
                    }
                  }}
                  maxLength={80}
                  aria-invalid={Boolean(errors.title)}
                  placeholder={isMn ? "Эвентийн нэр оруулна уу" : "Enter event title"}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "4px" }}>
                  {errors.title ? <span className="ew-er" style={{ margin: 0, fontSize: "12px", lineHeight: 1.35 }}>{errors.title}</span> : <span />}
                  <span className="ew-count" style={{ margin: 0, marginLeft: "auto", fontSize: "11px", whiteSpace: "nowrap" }}>{title.length} / 80</span>
                </div>
              </label>

              {/* Overview */}
              <label className="ew-f">
                <span className="ew-lb">
                  {isMn ? "Товч танилцуулга" : "Overview"} <i>*</i>
                </span>
                <textarea
                  className="ew-ta"
                  value={shortDesc}
                  onChange={(e) => {
                    setShortDesc(e.target.value.slice(0, 160));
                    if (errors.short) setErrors((prev) => ({ ...prev, short: "" }));
                  }}
                  maxLength={160}
                  aria-invalid={Boolean(errors.short)}
                  placeholder={isMn ? "Эвентээ товчхон танилцуулна уу" : "Brief summary of your event"}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "4px" }}>
                  {errors.short ? <span className="ew-er" style={{ margin: 0, fontSize: "12px", lineHeight: 1.35 }}>{errors.short}</span> : <span />}
                  <span className="ew-count" style={{ margin: 0, marginLeft: "auto", fontSize: "11px", whiteSpace: "nowrap" }}>{shortDesc.length} / 160</span>
                </div>
              </label>

              {/* Detailed Description */}
              <div className="ew-f">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span className="ew-lb" style={{ margin: 0 }}>
                    {isMn ? "Дэлгэрэнгүй мэдээлэл" : "Detailed Description"} <i>*</i>
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--bd-gray-600)" }}>{longDesc.length} / 800</span>
                </div>
                <textarea
                  className="ew-ta"
                  style={{ minHeight: "140px" }}
                  value={longDesc}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 800);
                    setLongDesc(val);
                    if (val.trim().length > 0 && (val.trim().length < 40 || val.trim().length > 800)) {
                      setErrors((prev) => ({
                        ...prev,
                        long: isMn
                          ? "Талбар хамгийн багадаа 40, хамгийн ихдээ 800 тэмдэгттэй байх ёстой."
                          : "The field must contain a minimum of 40 characters and a maximum of 800 characters.",
                      }));
                    } else if (errors.long) {
                      setErrors((prev) => ({ ...prev, long: "" }));
                    }
                  }}
                  onBlur={() => {
                    if (!longDesc.trim()) {
                      setErrors((prev) => ({
                        ...prev,
                        long: isMn ? "Дэлгэрэнгүй тайлбар шаардлагатай" : "Detailed description is required",
                      }));
                    } else if (longDesc.trim().length < 40 || longDesc.trim().length > 800) {
                      setErrors((prev) => ({
                        ...prev,
                        long: isMn
                          ? "Талбар хамгийн багадаа 40, хамгийн ихдээ 800 тэмдэгттэй байх ёстой."
                          : "The field must contain a minimum of 40 characters and a maximum of 800 characters.",
                      }));
                    }
                  }}
                  maxLength={800}
                  aria-invalid={Boolean(errors.long)}
                  placeholder={isMn ? "Эвентийн дэлгэрэнгүй мэдээлэл, үйл ажиллагааг тайлбарлана уу" : "Full program details and schedule"}
                />
                {errors.long && <span className="ew-er">{errors.long}</span>}
              </div>
            </section>

            {/* Right Column */}
            <section className="ew-cardIn">
              {/* Category Chips */}
              <div className="ew-f">
                <span className="ew-lb">
                  {isMn ? "Ангилал" : "Category"} <i>*</i>
                </span>
                <div className="ew-cats">
                  {categoriesList.map((c) => {
                    const isSelected = categoryId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className="ew-chip"
                        aria-selected={isSelected}
                        title={c.en}
                        onClick={() => {
                          setCategoryId(c.id);
                          setCategoryName(c.label);
                          if (errors.category) setErrors((prev) => ({ ...prev, category: "" }));
                        }}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
                {errors.category && <span className="ew-er">{errors.category}</span>}
              </div>

              {/* Poster Upload */}
              <div className="ew-f">
                <span className="ew-lb">
                  {isMn ? "Постер зураг" : "Poster Image"} <i>*</i>
                </span>
                {poster ? (
                  <div className="ew-up">
                    <span
                      className="ew-thumb"
                      style={{ backgroundImage: `url("${getFullImageUrl(poster)}")` }}
                    />
                    <span className="ew-upT">
                      <b>{posterName || "event-poster.jpg"}</b>
                      <span>{posterSize || (isMn ? "Бэлэн байна" : "Ready")}</span>
                      {uploadingPoster && (
                        <span className="ew-pbar">
                          <span style={{ width: `${upPct}%` }} />
                        </span>
                      )}
                    </span>
                    <label className="ew-gh ew-sm" style={{ position: "relative", overflow: "hidden" }}>
                      {uploadingPoster ? <span className="ew-sp" /> : isMn ? "Зураг солих" : "Change Image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePosterUpload}
                        disabled={uploadingPoster}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="ew-drop">
                    <span className="ew-dropT">{isMn ? "Постер зураг оруулах" : "Upload Poster Image"}</span>
                    <span className="ew-dropS">PNG, JPG (Max 5MB)</span>
                    <label className="ew-gh ew-sm" style={{ position: "relative", overflow: "hidden" }}>
                      {uploadingPoster ? <span className="ew-sp" /> : isMn ? "Зураг сонгох" : "Choose Image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePosterUpload}
                        disabled={uploadingPoster}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                      />
                    </label>
                  </div>
                )}
                {errors.poster && <span className="ew-er">{errors.poster}</span>}
              </div>

              {/* Gallery Images */}
              <div className="ew-f">
                <span className="ew-lb">
                  {isMn ? "Зургийн цомог" : "Photo Gallery"}{" "}
                  <span className="ew-opt-b">({isMn ? "заавал биш" : "optional"})</span>
                </span>
                <div className="ew-gal">
                  {gallery.map((imgUrl, idx) => (
                    <span
                      key={idx}
                      className="ew-gi"
                      style={{ backgroundImage: `url("${getFullImageUrl(imgUrl)}")` }}
                    >
                      <button
                        type="button"
                        className="ew-gx"
                        onClick={() => removeGalleryImage(idx)}
                        aria-label={isMn ? "Хасах" : "Remove"}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {gallery.length < 5 && (
                    <label className="ew-gadd" title={isMn ? "Зураг нэмэх" : "Add Photo"}>
                      {uploadingGallery ? <span className="ew-sp" /> : "+"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryUpload}
                        disabled={uploadingGallery}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                      />
                    </label>
                  )}
                </div>
                <span className="ew-hint">
                  {t("apGalleryMax")}
                </span>
              </div>

              {/* Teaser Video */}
              <div className="ew-f">
                <span className="ew-lb">
                  {isMn ? "Тизер видео" : "Teaser Video"}{" "}
                  <span className="ew-opt-b">({isMn ? "заавал биш" : "optional"})</span>
                </span>
                {teaserVideo ? (
                  <div className="ew-up" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
                    <div style={{ position: "relative", width: 68, height: 68, borderRadius: 10, overflow: "hidden", background: "#0a0d14", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <video src={getFullImageUrl(teaserVideo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <span style={{ position: "absolute", color: "#fff", pointerEvents: "none", fontSize: 16, background: "rgba(0,0,0,0.5)", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>▶</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                      <b style={{ fontSize: 13.5, color: "var(--bd-white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {teaserName || "teaser-video.mp4"}
                      </b>
                      <span style={{ fontSize: 12, color: "var(--acc-bright, #36CEC2)", fontWeight: 500 }}>
                        {isMn ? "Амжилттай хуулагдсан" : "Uploaded successfully"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={removeTeaserVideo}
                        className="ew-gh ew-sm"
                        style={{ color: "#ff5252", borderColor: "rgba(255,82,82,0.25)", padding: "6px 12px", fontSize: 12.5 }}
                      >
                        {isMn ? "Устгах" : "Remove"}
                      </button>
                      <label className="ew-gh ew-sm" style={{ position: "relative", overflow: "hidden", cursor: "pointer", padding: "6px 12px", fontSize: 12.5 }}>
                        {uploadingVideo ? `${videoPct}%` : isMn ? "Солих" : "Replace"}
                        <input
                          type="file"
                          accept="video/mp4,video/quicktime,video/*"
                          onChange={handleVideoUpload}
                          disabled={uploadingVideo}
                          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="ew-drop" style={{ padding: "20px 16px" }}>
                    <span className="ew-dropT">
                      {uploadingVideo
                        ? (isMn ? `Хуулж байна... ${videoPct}%` : `Uploading... ${videoPct}%`)
                        : (isMn ? "Тизер видео оруулах" : "Upload Teaser Video")}
                    </span>
                    <span className="ew-dropS">MP4, MOV (Max 50MB)</span>
                    {uploadingVideo && (
                      <div style={{ width: "85%", maxWidth: 280, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 999, overflow: "hidden", margin: "10px auto 6px" }}>
                        <div
                          style={{
                            width: `${videoPct}%`,
                            height: "100%",
                            background: "var(--acc-bright, #36CEC2)",
                            borderRadius: 999,
                            transition: "width 0.2s ease",
                          }}
                        />
                      </div>
                    )}
                    <label className="ew-gh ew-sm" style={{ position: "relative", overflow: "hidden", marginTop: uploadingVideo ? 6 : 4 }}>
                      {uploadingVideo ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                          <span className="ew-sp" />
                          <span>{videoPct}%</span>
                        </span>
                      ) : (
                        isMn ? "Видео сонгох" : "Choose Video"
                      )}
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/*"
                        onChange={handleVideoUpload}
                        disabled={uploadingVideo}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            STEP 2: Огноо ба байршил (Date & Location)
            ═════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="ew-grid2">
            <section className="ew-cardIn">
              <h2 className="ew-h2">{isMn ? "Огноо, цаг" : "Date and time"}</h2>
              <div className="ew-2">
                <label className="ew-f">
                  <span className="ew-lb">{isMn ? "Эхлэх огноо" : "Start date"} <i>*</i></span>
                  <div className="ew-dt">
                    <input
                      type="date"
                      className="ew-in"
                      value={startDate}
                      min={todayISO()}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value && value < todayISO()) {
                          setErrors((prev) => ({
                            ...prev,
                            startDate: isMn
                              ? "Эхлэх огноо өнөөдрөөс өмнө байж болохгүй."
                              : "Start date cannot be before today.",
                          }));
                          return;
                        }
                        if (endDate && value && value > endDate) {
                          setErrors((prev) => ({
                            ...prev,
                            startDate: isMn
                              ? "Эхлэх огноо дуусах огнооноос хойш байж болохгүй."
                              : "Start date cannot be after the end date.",
                          }));
                          return;
                        }
                        setStartDate(value);
                        if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: "" }));
                      }}
                      aria-invalid={Boolean(errors.startDate || startInPast)}
                    />
                    <button type="button" className="ew-dtBtn" aria-label={isMn ? "Огноо сонгох" : "Open date picker"} onClick={(e) => openNativePicker(e.currentTarget.previousElementSibling)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
                        <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
                      </svg>
                    </button>
                  </div>
                  {startDateError && <span className="ew-er">{startDateError}</span>}
                </label>
                <label className="ew-f">
                  <span className="ew-lb">{isMn ? "Эхлэх цаг" : "Start time"} <i>*</i></span>
                  <div className="ew-dt">
                    <input
                      type="time"
                      className="ew-in"
                      value={startTime}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (startDate && endDate && startDate === endDate && endTime && value && value >= endTime) {
                          setErrors((prev) => ({
                            ...prev,
                            startTime: isMn
                              ? "Эхлэх цаг дуусах цагаас хойш байж болохгүй."
                              : "Start time cannot be after the end time.",
                          }));
                          return;
                        }
                        setStartTime(value);
                        if (errors.startTime) setErrors((prev) => ({ ...prev, startTime: "" }));
                      }}
                      aria-invalid={Boolean(errors.startTime)}
                    />
                    <button type="button" className="ew-dtBtn" aria-label={isMn ? "Цаг сонгох" : "Open time picker"} onClick={(e) => openNativePicker(e.currentTarget.previousElementSibling)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="8.25" />
                        <path d="M12 7.5V12l3 2" />
                      </svg>
                    </button>
                  </div>
                  {errors.startTime && <span className="ew-er">{errors.startTime}</span>}
                </label>
                <label className="ew-f">
                  <span className="ew-lb">{isMn ? "Дуусах огноо" : "End date"} <i>*</i></span>
                  <div className="ew-dt">
                    <input
                      type="date"
                      className="ew-in"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (startDate && value && value < startDate) {
                          setErrors((prev) => ({
                            ...prev,
                            endDate: isMn
                              ? "Дуусах огноо эхлэх огнооноос өмнө байж болохгүй."
                              : "End date cannot be before the start date.",
                          }));
                          return;
                        }
                        setEndDate(value);
                        if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: "" }));
                      }}
                      aria-invalid={Boolean(errors.endDate || endBeforeStart)}
                    />
                    <button type="button" className="ew-dtBtn" aria-label={isMn ? "Огноо сонгох" : "Open date picker"} onClick={(e) => openNativePicker(e.currentTarget.previousElementSibling)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
                        <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
                      </svg>
                    </button>
                  </div>
                  {endDateError && <span className="ew-er">{endDateError}</span>}
                </label>
                <label className="ew-f">
                  <span className="ew-lb">{isMn ? "Дуусах цаг" : "End time"} <i>*</i></span>
                  <div className="ew-dt">
                    <input
                      type="time"
                      className="ew-in"
                      value={endTime}
                      min={endTimeMin}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (startDate && endDate && startDate === endDate && startTime && value && value <= startTime) {
                          setErrors((prev) => ({
                            ...prev,
                            endTime: isMn
                              ? "Дуусах цаг эхлэх цагаас өмнө байж болохгүй."
                              : "End time cannot be before the start time.",
                          }));
                          return;
                        }
                        setEndTime(value);
                        if (errors.endTime) setErrors((prev) => ({ ...prev, endTime: "" }));
                      }}
                      aria-invalid={Boolean(errors.endTime || endTimeBeforeStart)}
                    />
                    <button type="button" className="ew-dtBtn" aria-label={isMn ? "Цаг сонгох" : "Open time picker"} onClick={(e) => openNativePicker(e.currentTarget.previousElementSibling)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="8.25" />
                        <path d="M12 7.5V12l3 2" />
                      </svg>
                    </button>
                  </div>
                  {endTimeError && <span className="ew-er">{endTimeError}</span>}
                </label>
              </div>
            </section>

            <section className="ew-cardIn">
              <h2 className="ew-h2">{isMn ? "Байршил" : "Location"}</h2>
              <label className="ew-f">
                <span className="ew-lb">{isMn ? "Байршлын нэр" : "Venue name"} <i>*</i></span>
                <input
                  type="text"
                  className="ew-in"
                  value={venueName}
                  autoComplete="off"
                  maxLength={150}
                  onChange={(e) => {
                    setVenueName(e.target.value.slice(0, 150));
                    if (errors.venueName) setErrors((prev) => ({ ...prev, venueName: "" }));
                  }}
                  aria-invalid={Boolean(errors.venueName)}
                  placeholder={isMn ? "Байршлын нэр оруулна уу" : "Enter the venue name"}
                />
                <span className="ew-count">{venueName.trim().length} / 150</span>
                {errors.venueName && <span className="ew-er">{errors.venueName}</span>}
              </label>

              <label className="ew-f" style={{ position: "relative" }}>
                <span className="ew-lb">{isMn ? "Хаяг" : "Address"} <i>*</i></span>
                <input
                  ref={addressInputRef}
                  type="text"
                  className="ew-in"
                  value={address}
                  maxLength={180}
                  onChange={(e) => {
                    const next = e.target.value.slice(0, 180);
                    setAddress(next);
                    setAddrQuery(next);
                    if (errors.address) setErrors((prev) => ({ ...prev, address: "" }));
                  }}
                  aria-invalid={Boolean(errors.address)}
                  autoComplete="off"
                  placeholder={isMn ? "Дүүрэг, хороо, барилга" : "District, khoroo, building"}
                />
                {errors.address && <span className="ew-er">{errors.address}</span>}
              </label>

              <div style={{ position: "relative", height: 260, borderRadius: 16, overflow: "hidden", border: "1px solid var(--bd-border, rgba(255,255,255,0.1))" }}>
                {googleMapsLoaded && !mapsFailed ? (
                  <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <div
                    className="ew-map"
                    data-pinmode={pinMode ? "1" : "0"}
                    onClick={handleMapClick}
                    style={{ height: "100%", cursor: pinMode ? "crosshair" : "pointer" }}
                  >
                    <span
                      className="ew-pin"
                      style={{
                        position: "absolute",
                        left: pinAt.left,
                        top: pinAt.top,
                        transform: "translate(-50%, -86%)",
                        pointerEvents: "none",
                      }}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
                        <circle cx="12" cy="10" r="2.4" />
                      </svg>
                    </span>
                  </div>
                )}
                {pinMode && googleMapsLoaded && !mapsFailed && (
                  <div
                    role="presentation"
                    onClick={(e) => {
                      const map = googleMapRef.current;
                      const bounds = map?.getBounds?.();
                      if (!map || !bounds) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
                      const ne = bounds.getNorthEast();
                      const sw = bounds.getSouthWest();
                      const nextLat = ne.lat() - y * (ne.lat() - sw.lat());
                      const nextLng = sw.lng() + x * (ne.lng() - sw.lng());
                      moveMapTo(nextLat, nextLng, map.getZoom());
                      updateLocationFromCoords(nextLat, nextLng);
                      setPinMode(false);
                    }}
                    style={{ position: "absolute", inset: 0, zIndex: 1, cursor: "crosshair", background: "transparent" }}
                  />
                )}
                <span style={{ position: "absolute", left: "50%", bottom: 10, transform: "translateX(-50%)", zIndex: 2 }}>
                  <button
                    type="button"
                    className="ew-gh ew-sm"
                    aria-pressed={pinMode}
                    onClick={() => {
                      setPinMode(true);
                      if (googleMapRef.current) {
                        googleMapRef.current.setOptions({ draggableCursor: "crosshair" });
                      }
                      updateLocationFromCoords(latRef.current, lngRef.current);
                      flashToast(isMn ? "Газрын зураг дээр дарж зүүг тавина уу." : "Click the map to place the pin.");
                    }}
                  >
                    {isMn ? "Газрын зураг дээр сонгох" : "Pick on the map"}
                  </button>
                </span>
              </div>
              {pinMode && (
                <span className="ew-hint" style={{ textAlign: "center" }}>
                  {isMn ? "Газрын зураг дээр дарж зүүг тавина уу." : "Click the map to place the pin."}
                </span>
              )}
            </section>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            STEP 3: Тасалбарууд (Tickets & Pricing)
            ═════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <section className="ew-card">
            {/* Free Event Toggle */}
            <label className="ew-tog">
              <span className="ew-togT">
                <b>{isMn ? "Үнэгүй эвент" : "Free event"}</b>
                <span>
                  {isMn
                    ? "Эвент үнэ төлбөргүй бол идэвхжүүлнэ үү."
                    : "Turn this on if the event is free."}
                </span>
              </span>
              <input
                type="checkbox"
                className="ew-sw"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
              />
            </label>

            {/* Paid Ticket Tiers */}
            {!isFree ? (
              <>
                <div className="ew-tks">
                  {tickets.map((t, idx) => (
                    <div key={idx} className="ew-tk">
                      <div className="ew-tkH">
                        <b>
                          {isMn ? `Тасалбарын төрөл ${idx + 1}` : `Ticket type ${idx + 1}`}
                        </b>
                        {tickets.length > 1 && (
                          <button
                            type="button"
                            className="ew-rm"
                            onClick={() => confirmRemoveTicket(idx)}
                          >
                            {isMn ? "Хасах" : "Remove"}
                          </button>
                        )}
                      </div>

                      <label className="ew-f">
                        <span className="ew-lb">
                          {isMn ? "Тасалбарын нэр" : "Ticket name"} <i>*</i>
                        </span>
                        <input
                          type="text"
                          className="ew-in"
                          value={t.name}
                          maxLength={150}
                          onChange={(e) => {
                            const val = e.target.value.slice(0, 150);
                            setTickets((prev) => prev.map((item, i) => (i === idx ? { ...item, name: val } : item)));
                            if (errors[`tkName_${idx}`]) {
                              setErrors((prev) => ({ ...prev, [`tkName_${idx}`]: "" }));
                            }
                          }}
                          aria-invalid={Boolean(errors[`tkName_${idx}`])}
                          placeholder={isMn ? "Жишээ: Энгийн суудал" : "Example: Standard seat"}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "4px" }}>
                          {errors[`tkName_${idx}`] ? (
                            <span className="ew-er" style={{ margin: 0, fontSize: "12px", lineHeight: 1.35 }}>
                              {errors[`tkName_${idx}`]}
                            </span>
                          ) : <span />}
                          <span className="ew-count" style={{ margin: 0, marginLeft: "auto", fontSize: "11px", whiteSpace: "nowrap" }}>
                            {String(t.name || "").trim().length} / 150
                          </span>
                        </div>
                      </label>

                      <label className="ew-f">
                        <span className="ew-lb">
                          {isMn ? "Товч тайлбар" : "Short description"}{" "}
                          <span className="ew-opt-b">({isMn ? "заавал биш" : "optional"})</span>
                        </span>
                        <textarea
                          className="ew-ta"
                          value={t.desc}
                          maxLength={200}
                          onChange={(e) => {
                            const val = e.target.value.slice(0, 200);
                            setTickets((prev) => prev.map((item, i) => (i === idx ? { ...item, desc: val } : item)));
                            if (errors[`tkDesc_${idx}`]) setErrors((prev) => ({ ...prev, [`tkDesc_${idx}`]: "" }));
                          }}
                          placeholder={isMn ? "Энэ тасалбарт юу багтахыг тайлбарлана уу" : "Describe what this ticket includes"}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "4px" }}>
                          {errors[`tkDesc_${idx}`] ? (
                            <span className="ew-er" style={{ margin: 0, fontSize: "12px", lineHeight: 1.35 }}>
                              {errors[`tkDesc_${idx}`]}
                            </span>
                          ) : <span />}
                          <span className="ew-count" style={{ margin: 0, marginLeft: "auto", fontSize: "11px", whiteSpace: "nowrap" }}>
                            {String(t.desc || "").trim().length} / 200
                          </span>
                        </div>
                      </label>

                      <div className="ew-2">
                        <label className="ew-f">
                          <span className="ew-lb">
                            {isMn ? "Үнэ (₮)" : "Price (₮)"} <i>*</i>
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={10}
                            className="ew-in"
                            value={t.price}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setTickets((prev) => prev.map((item, i) => (i === idx ? { ...item, price: val } : item)));
                              if (errors[`tkPrice_${idx}`]) {
                                setErrors((prev) => ({ ...prev, [`tkPrice_${idx}`]: "" }));
                              }
                            }}
                            aria-invalid={Boolean(errors[`tkPrice_${idx}`])}
                            placeholder="30000"
                          />
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "4px" }}>
                            {errors[`tkPrice_${idx}`] ? (
                              <span className="ew-er" style={{ margin: 0, fontSize: "12px", lineHeight: 1.35 }}>
                                {errors[`tkPrice_${idx}`]}
                              </span>
                            ) : <span />}
                            <span className="ew-count" style={{ margin: 0, marginLeft: "auto", fontSize: "11px", whiteSpace: "nowrap" }}>
                              {digitsOf(t.price)?.replace(/^0$/, "").length || 0} / 10
                            </span>
                          </div>
                        </label>

                        <label className="ew-f">
                          <span className="ew-lb">
                            {isMn ? "Тоо ширхэг" : "Quantity"} <i>*</i>
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={10}
                            className="ew-in"
                            value={t.cap}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setTickets((prev) => prev.map((item, i) => (i === idx ? { ...item, cap: val } : item)));
                              if (errors[`tkCap_${idx}`]) {
                                setErrors((prev) => ({ ...prev, [`tkCap_${idx}`]: "" }));
                              }
                            }}
                            aria-invalid={Boolean(errors[`tkCap_${idx}`])}
                            placeholder="100"
                          />
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "4px" }}>
                            {errors[`tkCap_${idx}`] ? (
                              <span className="ew-er" style={{ margin: 0, fontSize: "12px", lineHeight: 1.35 }}>
                                {errors[`tkCap_${idx}`]}
                              </span>
                            ) : <span />}
                            <span className="ew-count" style={{ margin: 0, marginLeft: "auto", fontSize: "11px", whiteSpace: "nowrap" }}>
                              {digitsOf(t.cap)?.replace(/^0$/, "").length || 0} / 10
                            </span>
                          </div>
                        </label>

                        <label className="ew-f">
                          <span className="ew-lb">{isMn ? "Борлуулалт эхлэх" : "Sales start"}</span>
                          <div className="ew-dt">
                            <input
                              type="date"
                              className="ew-in"
                              value={t.ss}
                              max={t.se || endDate || startDate || undefined}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTickets((prev) => prev.map((item, i) => (i === idx ? { ...item, ss: val } : item)));
                                if (errors[`tkSales_${idx}`]) setErrors((prev) => ({ ...prev, [`tkSales_${idx}`]: "" }));
                              }}
                            />
                            <button type="button" className="ew-dtBtn" aria-label={isMn ? "Огноо сонгох" : "Open date picker"} onClick={(e) => openNativePicker(e.currentTarget.previousElementSibling)}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
                                <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
                              </svg>
                            </button>
                          </div>
                        </label>

                        <label className="ew-f">
                          <span className="ew-lb">{isMn ? "Борлуулалт дуусах" : "Sales end"}</span>
                          <div className="ew-dt">
                            <input
                              type="date"
                              className="ew-in"
                              value={t.se}
                              min={t.ss || undefined}
                              max={endDate || startDate || undefined}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTickets((prev) => prev.map((item, i) => (i === idx ? { ...item, se: val } : item)));
                                if (errors[`tkSales_${idx}`]) setErrors((prev) => ({ ...prev, [`tkSales_${idx}`]: "" }));
                              }}
                              aria-invalid={Boolean(errors[`tkSales_${idx}`])}
                            />
                            <button type="button" className="ew-dtBtn" aria-label={isMn ? "Огноо сонгох" : "Open date picker"} onClick={(e) => openNativePicker(e.currentTarget.previousElementSibling)}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
                                <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
                              </svg>
                            </button>
                          </div>
                        </label>
                      </div>
                      {errors[`tkSales_${idx}`] && <span className="ew-er">{errors[`tkSales_${idx}`]}</span>}
                    </div>
                  ))}
                </div>

                {errors.tickets && <span className="ew-er">{errors.tickets}</span>}

                <button
                  type="button"
                  className="ew-gh"
                  style={{ alignSelf: "flex-start", marginTop: "0px" }}
                  onClick={() => setTickets((prev) => [...prev, blankTicket()])}
                >
                  {isMn ? "Өөр тасалбарын төрөл нэмэх" : "Add another ticket type"}
                </button>

                <div style={{ height: "1px", background: "var(--bd-border-soft)", margin: "8px 0" }} />

                {/* Refund Policy */}
                <label className="ew-f">
                  <span className="ew-row1">
                    <span className="ew-lb" style={{ margin: 0 }}>
                      {isMn ? "Буцаан олголтын нөхцөл" : "Refund policy"} <i>*</i>
                    </span>
                    <select
                      className="ew-in"
                      value={policy}
                      onChange={(e) => {
                        setPolicy(e.target.value);
                        if (errors.policy) setErrors((prev) => ({ ...prev, policy: "" }));
                      }}
                      aria-invalid={Boolean(errors.policy)}
                      style={{ flex: "0 1 auto", width: "280px", minWidth: 0, maxWidth: "100%" }}
                    >
                      <option value="">{isMn ? "Буцаан олгох журмыг сонгох" : "Choose a refund policy"}</option>
                      {dbPolicies.map((pol) => (
                        <option key={pol.value} value={pol.value}>
                          {pol.label}
                        </option>
                      ))}
                    </select>
                  </span>
                  {errors.policy && <span className="ew-er">{errors.policy}</span>}
                </label>
              </>
            ) : (
              /* Free Event Details */
              <div className="ew-tk">
                <div className="ew-tkH">
                  <b>{isMn ? "Бүртгэл ба багтаамж" : "Registration and capacity"}</b>
                </div>
                <label className="ew-f">
                  <span className="ew-lb">
                    {isMn ? "Нийт багтаамж" : "Total capacity"} <i>*</i>
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    className="ew-in"
                    value={freeCap}
                    onChange={(e) => {
                      setFreeCap(e.target.value.replace(/\D/g, "").slice(0, 10));
                      if (errors.freeCap) setErrors((prev) => ({ ...prev, freeCap: "" }));
                    }}
                    aria-invalid={Boolean(errors.freeCap)}
                    placeholder={isMn ? "Жишээ: 120" : "Example: 120"}
                  />
                  <span className="ew-count">{digitsOf(freeCap)?.replace(/^0$/, "").length || 0} / 10</span>
                  {errors.freeCap && <span className="ew-er">{errors.freeCap}</span>}
                  <span className="ew-hint">
                    {isMn
                      ? "Бүртгэл багтаамжаас хэтрэхгүй. Бүртгүүлсэн хүн бүрт QR тасалбар үүсч, үүдэн дээр шалгагдана."
                      : "Registrations never exceed capacity. Everyone who registers gets a QR ticket that is checked at the door."}
                  </span>
                </label>
                <div className="ew-2">
                  <label className="ew-f">
                    <span className="ew-lb">
                      {isMn ? "Бүртгэл эхлэх" : "Registration opens"}{" "}
                      <span className="ew-opt-b">({isMn ? "заавал биш" : "optional"})</span>
                    </span>
                    <div className="ew-dt">
                      <input
                        type="datetime-local"
                        className="ew-in"
                        min={nowStamp()}
                        value={freeSs}
                        onChange={(e) => {
                          setFreeSs(e.target.value);
                          if (errors.freeSales || errors.freeSs) {
                            setErrors((prev) => ({ ...prev, freeSales: "", freeSs: "" }));
                          }
                        }}
                        aria-invalid={Boolean(errors.freeSs)}
                      />
                      <button type="button" className="ew-dtBtn" aria-label={isMn ? "Огноо сонгох" : "Open date picker"} onClick={(e) => openNativePicker(e.currentTarget.previousElementSibling)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
                          <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
                        </svg>
                      </button>
                    </div>
                  </label>
                  <label className="ew-f">
                    <span className="ew-lb">
                      {isMn ? "Бүртгэл дуусах" : "Registration closes"}{" "}
                      <span className="ew-opt-b">({isMn ? "заавал биш" : "optional"})</span>
                    </span>
                    <div className="ew-dt">
                      <input
                        type="datetime-local"
                        className="ew-in"
                        min={freeSs || nowStamp()}
                        max={endDate ? `${endDate}T23:59` : undefined}
                        value={freeSe}
                        onChange={(e) => {
                          setFreeSe(e.target.value);
                          if (errors.freeSales || errors.freeSe) {
                            setErrors((prev) => ({ ...prev, freeSales: "", freeSe: "" }));
                          }
                        }}
                        aria-invalid={Boolean(errors.freeSe)}
                      />
                      <button type="button" className="ew-dtBtn" aria-label={isMn ? "Огноо сонгох" : "Open date picker"} onClick={(e) => openNativePicker(e.currentTarget.previousElementSibling)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
                          <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
                        </svg>
                      </button>
                    </div>
                  </label>
                </div>
                <span className="ew-hint">
                  {isMn
                    ? "Хоосон орхивол бүртгэл эвент нийтлэгдсэн даруй эхэлж, эвент эхлэх үед хаагдана."
                    : "Leave these empty and registration opens as soon as the event is published, then closes when it starts."}
                </span>
                {errors.freeSales && <span className="ew-er">{errors.freeSales}</span>}
              </div>
            )}
          </section>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            STEP 4: Тохиргоо (Settings & Privacy)
            ═════════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="ew-grid2">
            <section className="ew-cardIn">
              {/* Visibility */}
              <div className="ew-f">
                <span className="ew-lb">{isMn ? "Харагдах байдал" : "Visibility"}</span>
                <div className="ew-pick">
                  <button
                    type="button"
                    className="ew-pk"
                    aria-selected={visibility === "public"}
                    onClick={() => setVisibility("public")}
                  >
                    {isMn ? "Нийтийн" : "Public"}
                  </button>
                  <button
                    type="button"
                    className="ew-pk"
                    aria-selected={visibility === "private"}
                    onClick={() => setVisibility("private")}
                  >
                    {isMn ? "Хувийн" : "Private"}
                  </button>
                </div>
                <span className="ew-hint">
                  {visibility === "public"
                    ? isMn
                      ? "Бүх хэрэглэгчид нүүр хуудас болон хайлтаас олох боломжтой."
                      : "Discoverable on search feeds and explore page."
                    : isMn
                      ? "Зөвхөн шууд линкээр нэвтрэх боломжтой."
                      : "Only accessible with direct link."}
                </span>
              </div>

              {/* Age Restriction */}
              <div className="ew-f">
                <span className="ew-lb">{isMn ? "Насны хязгаарлалт" : "Age Restriction"}</span>
                <div className="ew-pick">
                  <button
                    type="button"
                    className="ew-pk"
                    aria-selected={ageRestriction === "all" || ageRestriction === "ALL"}
                    onClick={() => setAgeRestriction("all")}
                  >
                    {isMn ? "Бүх насныханд" : "All Ages"}
                  </button>
                  <button
                    type="button"
                    className="ew-pk"
                    aria-selected={ageRestriction === "18" || ageRestriction === "18+"}
                    onClick={() => setAgeRestriction("18")}
                  >
                    18+
                  </button>
                  <button
                    type="button"
                    className="ew-pk"
                    aria-selected={ageRestriction === "21" || ageRestriction === "21+"}
                    onClick={() => setAgeRestriction("21")}
                  >
                    21+
                  </button>
                </div>
              </div>

              {/* Show Attendees Toggle */}
              <label className="ew-tog">
                <span className="ew-togT">
                  <b>{isMn ? "Оролцогчдыг харуулах" : "Show Attendees"}</b>
                  <span>
                    {isMn
                      ? "Нийтийн хуудсан дээр ирэх хүмүүсийг харуулах."
                      : "Display attendee avatars on the public event page."}
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="ew-sw"
                  checked={showAttendees}
                  onChange={(e) => setShowAttendees(e.target.checked)}
                />
              </label>
            </section>

            <section className="ew-cardIn">
              {/* Entry Notes */}
              <label className="ew-f">
                <span className="ew-lb">{isMn ? "Нэвтрэх заавар, тэмдэглэл" : "Entry Requirements"}</span>
                <textarea
                  className="ew-ta"
                  value={entryNotes}
                  maxLength={500}
                  onChange={(e) => {
                    setEntryNotes(e.target.value.slice(0, 500));
                    if (errors.entryNotes) setErrors((prev) => ({ ...prev, entryNotes: "" }));
                  }}
                  aria-invalid={Boolean(errors.entryNotes)}
                  placeholder={isMn ? "Жишээ: Иргэний үнэмлэх үүдэн дээр шалгана." : "e.g. ID verification required at entrance."}
                />
                <span className="ew-count">{entryNotes.trim().length} / 500</span>
                {errors.entryNotes && <span className="ew-er">{errors.entryNotes}</span>}
              </label>

              {/* Dress Code */}
              <label className="ew-f">
                <span className="ew-lb">{isMn ? "Хувцаслалтын дүрэм" : "Dress Code"}</span>
                <input
                  type="text"
                  className="ew-in"
                  value={dressCode}
                  maxLength={300}
                  onChange={(e) => {
                    setDressCode(e.target.value.slice(0, 300));
                    if (errors.dressCode) setErrors((prev) => ({ ...prev, dressCode: "" }));
                  }}
                  aria-invalid={Boolean(errors.dressCode)}
                  placeholder={isMn ? "Жишээ: Энгийн, тухтай хувцас" : "e.g. Casual, Formal"}
                />
                <span className="ew-count">{dressCode.trim().length} / 300</span>
                {errors.dressCode && <span className="ew-er">{errors.dressCode}</span>}
              </label>
            </section>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            STEP 5: Хянах (Review & Confirm)
            ═════════════════════════════════════════════════════════════════════ */}
        {step === 5 && (
          <>
            <p className="ew-note2">
              <span style={{ color: "var(--acc-bright)" }}>ⓘ</span>
              {isMn
                ? "Илгээсний дараа Bondy эвентийн мэдээллийг хянаж, баталгаажуулсны дараа нийтлэгдэнэ."
                : "After you submit, Bondy reviews the event and publishes it once it is approved."}
            </p>
            <div className="ew-r4">
              {/* Column 1: Basic Info & Tickets */}
              <div className="ew-rcol">
                <div className="ew-rcard">
                  <div className="ew-rcH">
                    <b>{isMn ? "Үндсэн мэдээлэл" : "Basic info"}</b>
                    <button type="button" className="ew-edit" onClick={() => handleGotoStep(1)}>
                      {isMn ? "Засах" : "Edit"}
                    </button>
                  </div>

                  <div className="ew-topRow">
                    {poster ? (
                      <span
                        className="ew-poster ew-posterR"
                        style={{ backgroundImage: `url("${getFullImageUrl(poster)}")` }}
                      />
                    ) : (
                      <span className="ew-poster ew-posterR" />
                    )}
                    <div style={{ flex: "1 1 230px", minWidth: 0 }}>
                      <span className="ew-kv2">
                        <span>{isMn ? "Эвентийн нэр" : "Event name"}</span>
                        <span>{title.trim() ? titleCaseWords(title.trim()) : "—"}</span>
                      </span>
                      <span className="ew-kv2">
                        <span>{isMn ? "Ангилал" : "Category"}</span>
                        <span>{categoryName || "—"}</span>
                      </span>
                      <span className="ew-kv2 ew-clamp">
                        <span>{isMn ? "Товч танилцуулга" : "Overview"}</span>
                        <span>{shortDesc.trim() ? sentenceCaseText(shortDesc.trim()) : "—"}</span>
                      </span>
                      <span className="ew-kv2 ew-clamp">
                        <span>{isMn ? "Дэлгэрэнгүй тайлбар" : "Description"}</span>
                        <span>{longDesc.trim() ? sentenceCaseText(longDesc.trim()) : "—"}</span>
                      </span>
                    </div>
                  </div>

                  <div className="ew-media">
                    <b>{isMn ? "Медиа" : "Media"}</b>
                    <span className="ew-mrow">
                      <span>{isMn ? "Постер" : "Poster"}</span>
                      <b>{poster ? (isMn ? "Оруулсан" : "Added") : "—"}</b>
                    </span>
                    <span className="ew-mrow">
                      <span>{isMn ? "Зургийн цомог" : "Photo gallery"}</span>
                      <b>
                        {gallery.length
                          ? (isMn ? `${gallery.length} зураг` : (gallery.length === 1 ? "1 image" : `${gallery.length} images`))
                          : "—"}
                      </b>
                    </span>
                    {gallery.length > 0 && (
                      <div className="ew-gal ew-reviewGal">
                        {gallery.map((imgUrl, idx) => (
                          <span
                            key={`${imgUrl}-${idx}`}
                            className="ew-gi"
                            role="img"
                            aria-label={isMn ? `Зураг ${idx + 1}` : `Gallery image ${idx + 1}`}
                            style={{ backgroundImage: `url("${getFullImageUrl(imgUrl)}")` }}
                          />
                        ))}
                      </div>
                    )}
                    <span className="ew-mrow">
                      <span>{isMn ? "Тизер видео" : "Teaser video"}</span>
                      <b>{teaserVideo ? (teaserName || (isMn ? "Оруулсан" : "Added")) : "—"}</b>
                    </span>
                    {teaserVideo && (
                      <video
                        className="ew-reviewVideo"
                        controls
                        playsInline
                        preload="metadata"
                        src={getFullImageUrl(teaserVideo)}
                      />
                    )}
                  </div>
                </div>

                {/* Tickets */}
                <div className="ew-rcard">
                  <div className="ew-rcH">
                    <b>{isFree ? (isMn ? "Бүртгэл" : "Registrations") : (isMn ? "Тасалбарууд" : "Tickets")}</b>
                    <button type="button" className="ew-edit" onClick={() => handleGotoStep(3)}>
                      {isMn ? "Засах" : "Edit"}
                    </button>
                  </div>

                  {isFree ? (
                    <div className="ew-tkRow">
                      <span className="ew-tkRowT">
                        <b>{isMn ? "Бүртгэл" : "Registrations"}</b>
                        <small>
                          {`${freeCap || 0} ${isMn ? "орон" : "spots"} · ${freeSs
                            ? formatReviewWhen(freeSs, isMn)
                            : (isMn ? "Нийтлэгдсэн даруй" : "As soon as it is published")
                            } – ${freeSe
                              ? formatReviewWhen(freeSe, isMn)
                              : (isMn ? "Эвент эхлэх хүртэл" : "Until the event starts")
                            }`}
                        </small>
                      </span>
                      <span className="ew-tkRowV">{isMn ? "Үнэгүй" : "Free"}</span>
                    </div>
                  ) : (
                    tickets.map((t, idx) => (
                      <div key={idx} className="ew-tkRow">
                        <span className="ew-tkRowT">
                          <b>{t.name || (isMn ? "Нэргүй тасалбар" : "Untitled ticket")}</b>
                          <small>
                            {`${t.cap || 0} ${isMn ? "ширхэг" : "tickets"}${t.ss ? ` · ${formatReviewWhen(t.ss, isMn)} – ${t.se ? formatReviewWhen(t.se, isMn) : "—"}` : ""
                              }`}
                          </small>
                        </span>
                        <span className="ew-tkRowV">
                          {Number(t.price) > 0
                            ? `₮${Number(t.price).toLocaleString("en-US")}`
                            : (isMn ? "Үнэгүй" : "Free")}
                        </span>
                      </div>
                    ))
                  )}

                  {!isFree && (
                    <span className="ew-kv2" style={{ borderTop: "1px solid var(--bd-border-soft)", marginTop: "6px" }}>
                      <span>{isMn ? "Буцаан олголтын нөхцөл" : "Refund policy"}</span>
                      <span>{dbPolicies.find((p) => p.value === policy)?.label || policy || "—"}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Column 2: Date & Location & Settings */}
              <div className="ew-rcol">
                <div className="ew-rcard">
                  <div className="ew-rcH">
                    <b>{isMn ? "Огноо ба байршил" : "Date and location"}</b>
                    <button type="button" className="ew-edit" onClick={() => handleGotoStep(2)}>
                      {isMn ? "Засах" : "Edit"}
                    </button>
                  </div>
                  <div className="ew-topRow">
                    {address ? (
                      <span className="ew-mapS ew-mapP">
                        <span className="ew-pin" style={{ left: pinAt.left, top: pinAt.top }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="currentColor" strokeWidth="1.6" />
                            <circle cx="12" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.6" />
                          </svg>
                        </span>
                      </span>
                    ) : (
                      <span className="ew-mapS">
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="currentColor" strokeWidth="1.6" />
                          <circle cx="12" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.6" />
                        </svg>
                      </span>
                    )}
                    <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                      <span className="ew-kv2">
                        <span>{isMn ? "Байршлын нэр" : "Venue name"}</span>
                        <span>{venueName || "—"}</span>
                      </span>
                      <span className="ew-kv2">
                        <span>{isMn ? "Хаяг" : "Address"}</span>
                        <span>{address || "—"}</span>
                      </span>
                    </div>
                  </div>
                  <span className="ew-kv2">
                    <span>{isMn ? "Эхлэх" : "Starts"}</span>
                    <span>{startDate ? formatReviewWhen(startDate, isMn, startTime) : "—"}</span>
                  </span>
                  <span className="ew-kv2">
                    <span>{isMn ? "Дуусах" : "Ends"}</span>
                    <span>{endDate ? formatReviewWhen(endDate, isMn, endTime) : "—"}</span>
                  </span>
                </div>

                {/* Settings */}
                <div className="ew-rcard">
                  <div className="ew-rcH">
                    <b>{isMn ? "Тохиргоо" : "Settings"}</b>
                    <button type="button" className="ew-edit" onClick={() => handleGotoStep(4)}>
                      {isMn ? "Засах" : "Edit"}
                    </button>
                  </div>
                  <span className="ew-kv2">
                    <span>{isMn ? "Харагдах байдал" : "Visibility"}</span>
                    <span>{visibility === "public" ? (isMn ? "Нийтийн" : "Public") : (isMn ? "Хувийн" : "Private")}</span>
                  </span>
                  <span className="ew-kv2">
                    <span>{isMn ? "Насны хязгаарлалт" : "Age restriction"}</span>
                    <span>{(ageRestriction === "all" || ageRestriction === "ALL") ? (isMn ? "Бүх насныханд" : "All ages") : (String(ageRestriction).endsWith("+") ? ageRestriction : `${ageRestriction}+`)}</span>
                  </span>
                  <span className="ew-kv2">
                    <span>{isMn ? "Оролцогчдыг харуулах" : "Show attendees"}</span>
                    <span>{showAttendees ? (isMn ? "Идэвхтэй" : "Active") : (isMn ? "Идэвхгүй" : "Inactive")}</span>
                  </span>
                  <span className="ew-kv2">
                    <span>{isMn ? "Нэвтрэх тэмдэглэл" : "Entry notes"}</span>
                    <span>{entryNotes || "—"}</span>
                  </span>
                  <span className="ew-kv2">
                    <span>{isMn ? "Хувцаслалтын дүрэм" : "Dress code"}</span>
                    <span>{dressCode || "—"}</span>
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            ACTIONS FOOTER (.ew-acts)
            ═════════════════════════════════════════════════════════════════════ */}
        <div className="ew-acts">
          {step > 1 && (
            <button type="button" className="ew-gh" onClick={handleBack}>
              {isMn ? "Буцах" : "Back"}
            </button>
          )}

          <span style={{ flex: "1 1 auto" }} />

          {/* Save Draft */}
          <button
            type="button"
            className="ew-gh"
            data-act="savedraft"
            onClick={promptSaveDraft}
            disabled={draftBusy}
          >
            {draftBusy && <span className="ew-sp" />}
            {isMn ? "Ноорог хадгалах" : "Save draft"}
          </button>

          {/* Continue (Steps 1-4) */}
          {step < 5 && (
            <button type="button" className="ew-go" onClick={handleNext}>
              {isMn ? "Үргэлжлүүлэх" : "Continue"}
            </button>
          )}

          {/* Publish / Save Changes (Step 5) */}
          {step === 5 && (
            <button
              type="button"
              className="ew-go"
              onClick={handlePublish}
              disabled={pubBusy}
            >
              {pubBusy && <span className="ew-sp" />}
              {isEditMode && !isDraftMode
                ? (isMn ? "Өөрчлөлтийг хадгалах" : "Save changes")
                : (pubBusy
                  ? (isMn ? "Илгээж байна…" : "Sending…")
                  : (isMn ? "Илгээх" : "Send"))}
            </button>
          )}
        </div>
      </div>

      {/* ─── Floating Toast Notification (.ew-toast) ─────────────────────── */}
      {toastMessage && (
        <div className="ew-toast" role="status">
          <span style={{ display: "inline-flex", color: "var(--acc-bright)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </span>
          {toastMessage}
        </div>
      )}

      {/* ─── Prototype Ask Confirmation Modal (.ew-scrim + .ew-sheet) ─────── */}
      {ask && (
        <div className="ew-scrim" onClick={() => setAsk(null)}>
          <div className="ew-sheet" onClick={(e) => e.stopPropagation()} data-sheet>
            <b
              style={{
                display: "block",
                fontFamily: "var(--bd-font-ui)",
                fontSize: "19px",
                fontWeight: 700,
                letterSpacing: "-.014em",
                color: "var(--bd-white)",
              }}
            >
              {ask.title}
            </b>
            <p style={{ margin: "9px 0 0", fontSize: "14px", lineHeight: 1.6, color: "var(--bd-gray-400)" }}>
              {ask.body}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", flexWrap: "wrap", marginTop: "20px" }}>
              {ask.acts.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  className={a.cls}
                  data-ask={a.key}
                  onClick={() => handleAskAction(a.key)}
                  disabled={draftBusy && a.key === "save"}
                  style={a.key === "discard" ? { color: "#FF5A5A" } : undefined}
                >
                  {draftBusy && a.key === "save" && <span className="ew-sp" />}
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Prototype Done Modal (.ew-scrim + .ew-sheet) ──────────────────── */}
      {done && (
        <div className="ew-scrim" onClick={() => setDone(null)}>
          <div className="ew-sheet" onClick={(e) => e.stopPropagation()} data-sheet style={{ textAlign: "center" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "64px",
                height: "64px",
                borderRadius: "999px",
                background: done.tileBg || "rgba(35, 173, 164, 0.14)",
                color: done.tileColor || "var(--acc-bright)",
                margin: "0 auto",
              }}
            >
              {done.icon === "danger" ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
            </span>
            <b
              style={{
                display: "block",
                marginTop: "15px",
                fontFamily: "var(--bd-font-ui)",
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "-.014em",
                color: "var(--bd-white)",
              }}
            >
              {done.title}
            </b>
            <p style={{ margin: "9px 0 0", fontSize: "14px", lineHeight: 1.6, color: "var(--bd-gray-400)" }}>
              {done.body}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", flexWrap: "wrap", justifyContent: "center", marginTop: "20px" }}>
              {done.acts.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  className={a.cls}
                  data-done={a.key}
                  onClick={() => handleDoneAction(a.key)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Live Event Blocked Modal */}
      {liveBlockedModal && (
        <div className="ew-cov" role="dialog" aria-modal="true" style={{ zIndex: 9999 }}>
          <div
            className="ew-ask"
            style={{
              maxWidth: 440,
              padding: "32px 24px 28px",
              textAlign: "center",
              border: "1px solid rgba(255, 82, 82, 0.3)",
              background: "#161b26",
              boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(255, 82, 82, 0.15)",
                color: "#ff5252",
                margin: "0 auto",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <b
              style={{
                display: "block",
                marginTop: 18,
                fontSize: 18,
                fontWeight: 700,
                color: "var(--bd-white)",
              }}
            >
              {isMn ? "Арга хэмжээ шууд явагдаж байна" : "Event is Currently Live"}
            </b>
            <p style={{ margin: "10px 0 24px", fontSize: 14, lineHeight: 1.6, color: "var(--bd-gray-300)" }}>
              {isMn
                ? "Таны эвент шууд явагдаж байгаа тул засах боломжгүй."
                : "Your event is live, you cannot edit this."}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                type="button"
                className="ew-gh"
                onClick={() => router.push("/EventsManagement")}
                style={{ padding: "10px 20px", fontSize: 13.5 }}
              >
                {isMn ? "Буцах" : "Back to Events"}
              </button>
              {eventIdParam && (
                <button
                  type="button"
                  className="ew-ac"
                  onClick={() => router.push(`/EventDetails/${eventIdParam}`)}
                  style={{ padding: "10px 20px", fontSize: 13.5 }}
                >
                  {isMn ? "Эвент харах" : "View Event"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function BasicInfoPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--bd-gray-500)" }}>
          Loading editor...
        </div>
      }
    >
      <EventEditorContent />
    </Suspense>
  );
}
