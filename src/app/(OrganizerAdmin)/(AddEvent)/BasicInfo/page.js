"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useEventContext } from "@/context/EventContext";
import authApi from "@/api/authApi";
import eventApi from "@/api/eventApi";
import { getFullImageUrl } from "@/utils/imageHelper";

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
const STEPS_EN = ["Basic Info", "Date & Location", "Tickets & Pricing", "Settings", "Review"];

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
  const { language } = useLanguage();
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
  const [upPct, setUpPct] = useState(0);

  // Date, Time, Location
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venueName, setVenueName] = useState("");
  const [availableDistricts, setAvailableDistricts] = useState(DEFAULT_DISTRICTS);
  const [district, setDistrict] = useState(DEFAULT_DISTRICTS[0]);
  const [districtAutoFilled, setDistrictAutoFilled] = useState(false);
  const [address, setAddress] = useState("");
  const [addrQuery, setAddrQuery] = useState("");
  const [showAddrAc, setShowAddrAc] = useState(false);
  const [lat, setLat] = useState(47.9186);
  const [lng, setLng] = useState(106.9176);
  const [pinMode, setPinMode] = useState(false);

  // Google Maps & Places Integration
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const mapContainerRef = useRef(null);
  const googleMapRef = useRef(null);
  const markerRef = useRef(null);
  const addressInputRef = useRef(null);
  const venueInputRef = useRef(null);

  // Tickets & Pricing
  const [isFree, setIsFree] = useState(false);
  const [tickets, setTickets] = useState([
    { name: "Энгийн суудал", desc: "Танхимын үндсэн суудал.", price: 30000, cap: 100, ss: "", se: "" },
  ]);
  const [freeCap, setFreeCap] = useState("100");
  const [freeSs, setFreeSs] = useState("");
  const [freeSe, setFreeSe] = useState("");
  const [policy, setPolicy] = useState("");
  const [dbPolicies, setDbPolicies] = useState([]);

  // Settings
  const [visibility, setVisibility] = useState("public"); // 'public' | 'private'
  const [ageRestriction, setAgeRestriction] = useState("18"); // 'all' | '18' | '21'
  const [showAttendees, setShowAttendees] = useState(true);
  const [entryNotes, setEntryNotes] = useState("Иргэний үнэмлэх үүдэн дээр шалгана.");
  const [dressCode, setDressCode] = useState("Энгийн, тухтай хувцас.");

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
        const polRes = await eventApi.getRefundPolicies();
        const rawList = polRes?.data?.data;
        if (Array.isArray(rawList) && rawList.length > 0) {
          const list = rawList.map((p) => (typeof p === "object" ? p.title || p.name || p.policy : p));
          setDbPolicies(list);
          setPolicy((curr) => (curr && list.includes(curr) ? curr : list[0] || ""));
        }
      } catch (e) {
        console.warn("Failed to load refund policies from backend API:", e);
      }
    }
    loadPolicies();
  }, [language]);

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
            setAvailableDistricts((prev) =>
              prev.includes(ev.venueAddress.city) ? prev : [ev.venueAddress.city, ...prev]
            );
          }
        }

        if (ev.tickets && ev.tickets.length > 0) {
          const isFreeEv = ev.tickets.every((t) => Number(t.price) === 0 || t.isFreeTicket);
          setIsFree(isFreeEv);
          if (isFreeEv) {
            setFreeCap(String(ev.tickets[0]?.qty || ev.totalTickets || 100));
          } else {
            setTickets(
              ev.tickets.map((t) => ({
                name: t.ticketName || "",
                desc: t.ticketShortDesc || "",
                price: Number(t.price) || 0,
                cap: Number(t.qty) || 100,
                ss: t.ticketSelesStartDate ? t.ticketSelesStartDate.slice(0, 10) : "",
                se: t.ticketSelesEndDate ? t.ticketSelesEndDate.slice(0, 10) : "",
              }))
            );
          }
        }

        if (ev.refundPolicy) {
          setPolicy(ev.refundPolicy);
        }
        if (ev.accessAndPrivacy !== undefined) {
          setVisibility(ev.accessAndPrivacy ? "public" : "private");
        }
        if (ev.ageRestriction) setAgeRestriction(String(ev.ageRestriction).replace("+", ""));
        if (ev.dressCode) setDressCode(ev.dressCode);
        if (ev.tags && ev.tags.length > 0) setEntryNotes(ev.tags.join(", "));
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
        if (parsed.address) {
          setAddress(parsed.address);
          setAddrQuery(parsed.address);
          if (addressInputRef.current) {
            addressInputRef.current.value = parsed.address;
          }
        }
        if (parsed.district) {
          setDistrict(parsed.district);
          setDistrictAutoFilled(true);
          setAvailableDistricts((prev) =>
            prev.includes(parsed.district) ? prev : [parsed.district, ...prev]
          );
        }
        if (parsed.venue) {
          setVenueName(parsed.venue);
          if (venueInputRef.current) {
            venueInputRef.current.value = parsed.venue;
          }
        }
        setErrors((prev) => ({ ...prev, address: "", venueName: "" }));
        flashToast(
          isMn
            ? `Байршил ба ${parsed.district ? `дүүрэг (${parsed.district}) ` : ""}шинэчлэгдлээ`
            : `Location & District auto-updated from map`
        );
      };

      if (window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: roundedLat, lng: roundedLng } }, async (results, status) => {
          if (status === "OK" && results && results.length > 0) {
            const poiResult = results.find((r) =>
              r.types?.some((t) => ["point_of_interest", "establishment", "premise", "subpremise"].includes(t))
            );
            const parsed = parseGeocodeLocation(poiResult || results[0]);
            applyLocationData(parsed);
          } else {
            // Google Geocoding API is not activated on this project or failed -> use resilient reverse geocoder fallback
            const fallbackData = await reverseGeocodeFallback(roundedLat, roundedLng);
            applyLocationData(fallbackData);
          }
        });
      } else {
        reverseGeocodeFallback(roundedLat, roundedLng).then(applyLocationData);
      }
    },
    [isMn, parseGeocodeLocation, reverseGeocodeFallback]
  );

  // Handle map click to place pin (fallback grid)
  const handleMapClick = (e) => {
    if (!pinMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pctX = Math.max(0, Math.min(1, x / rect.width));
    const pctY = Math.max(0, Math.min(1, y / rect.height));

    const newLng = Number((106.855 + pctX * (106.995 - 106.855)).toFixed(4));
    const newLat = Number((47.950 - pctY * (47.950 - 47.878)).toFixed(4));
    updateLocationFromCoords(newLat, newLng);
    setPinMode(false);
  };

  // ─── Load Google Maps & Places JavaScript API ─────────────────────────────
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) return;

    if (typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.places) {
      setGoogleMapsLoaded(true);
      return;
    }

    const scriptId = "google-maps-script";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleMapsLoaded(true);
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setGoogleMapsLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // ─── Attach Google Places Autocomplete to Inputs ─────────────────────────
  useEffect(() => {
    if (!googleMapsLoaded || typeof window === "undefined" || !window.google?.maps?.places) return;

    // 1. Full Address Autocomplete
    let addrAc;
    if (addressInputRef.current) {
      try {
        addrAc = new window.google.maps.places.Autocomplete(addressInputRef.current, {
          fields: ["name", "formatted_address", "geometry", "address_components"],
        });
        addrAc.addListener("place_changed", () => {
          const place = addrAc.getPlace();
          if (!place) return;
          const parsed = parseGeocodeLocation(place);

          if (parsed?.address) {
            setAddress(parsed.address);
            setAddrQuery(parsed.address);
            if (addressInputRef.current) addressInputRef.current.value = parsed.address;
          }
          if (parsed?.venue && (!venueName || venueName.trim() === "")) {
            setVenueName(parsed.venue);
            if (venueInputRef.current) venueInputRef.current.value = parsed.venue;
          }
          if (parsed?.district) {
            setDistrict(parsed.district);
            setDistrictAutoFilled(true);
            setAvailableDistricts((prev) =>
              prev.includes(parsed.district) ? prev : [parsed.district, ...prev]
            );
          }

          if (place.geometry?.location) {
            const pLat = place.geometry.location.lat();
            const pLng = place.geometry.location.lng();
            setLat(Number(pLat.toFixed(4)));
            setLng(Number(pLng.toFixed(4)));
            if (googleMapRef.current) {
              googleMapRef.current.panTo({ lat: pLat, lng: pLng });
              googleMapRef.current.setZoom(16);
            }
            if (markerRef.current) {
              markerRef.current.setPosition({ lat: pLat, lng: pLng });
            }
          }

          setErrors((prev) => ({ ...prev, address: "", venueName: "" }));
          flashToast(
            isMn
              ? `Google Places: Байршил ба ${parsed?.district ? `дүүрэг (${parsed.district}) ` : ""}бөглөгдлөө`
              : `Google Places: Location & District auto-filled`
          );
        });
      } catch (e) {
        console.warn("Error setting up address autocomplete:", e);
      }
    }

    // 2. Venue Name Autocomplete
    let venueAc;
    if (venueInputRef.current) {
      try {
        venueAc = new window.google.maps.places.Autocomplete(venueInputRef.current, {
          types: ["establishment"],
          fields: ["name", "formatted_address", "geometry", "address_components"],
        });
        venueAc.addListener("place_changed", () => {
          const place = venueAc.getPlace();
          if (!place) return;
          const parsed = parseGeocodeLocation(place);

          if (place.name) {
            setVenueName(place.name);
            if (venueInputRef.current) venueInputRef.current.value = place.name;
          }
          if (parsed?.address) {
            setAddress(parsed.address);
            setAddrQuery(parsed.address);
            if (addressInputRef.current) addressInputRef.current.value = parsed.address;
          }
          if (parsed?.district) {
            setDistrict(parsed.district);
            setDistrictAutoFilled(true);
            setAvailableDistricts((prev) =>
              prev.includes(parsed.district) ? prev : [parsed.district, ...prev]
            );
          }

          if (place.geometry?.location) {
            const pLat = place.geometry.location.lat();
            const pLng = place.geometry.location.lng();
            setLat(Number(pLat.toFixed(4)));
            setLng(Number(pLng.toFixed(4)));
            if (googleMapRef.current) {
              googleMapRef.current.panTo({ lat: pLat, lng: pLng });
              googleMapRef.current.setZoom(16);
            }
            if (markerRef.current) {
              markerRef.current.setPosition({ lat: pLat, lng: pLng });
            }
          }

          setErrors((prev) => ({ ...prev, address: "", venueName: "" }));
          flashToast(
            isMn
              ? `Google Places: Байршил ба ${parsed?.district ? `дүүрэг (${parsed.district}) ` : ""}бөглөгдлөө`
              : `Google Places: Location & District auto-filled`
          );
        });
      } catch (e) {
        console.warn("Error setting up venue autocomplete:", e);
      }
    }

    return () => {
      if (window.google?.maps?.event) {
        if (addrAc) window.google.maps.event.clearInstanceListeners(addrAc);
        if (venueAc) window.google.maps.event.clearInstanceListeners(venueAc);
      }
    };
  }, [googleMapsLoaded, step, isMn, parseGeocodeLocation, venueName]);

  // ─── Initialize Interactive Google Map in Step 2 ──────────────────────────
  useEffect(() => {
    if (step !== 2 || !googleMapsLoaded || !mapContainerRef.current || typeof window === "undefined" || !window.google?.maps) return;

    const initialPos = {
      lat: typeof lat === "number" && !isNaN(lat) ? lat : 47.9186,
      lng: typeof lng === "number" && !isNaN(lng) ? lng : 106.9176,
    };

    if (!googleMapRef.current) {
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: initialPos,
        zoom: 15,
        styles: BONDY_DARK_MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
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

      map.addListener("click", (e) => {
        updateLocationFromCoords(e.latLng.lat(), e.latLng.lng());
      });

      marker.addListener("dragend", (e) => {
        updateLocationFromCoords(e.latLng.lat(), e.latLng.lng());
      });

      googleMapRef.current = map;
      markerRef.current = marker;
    } else {
      googleMapRef.current.setCenter(initialPos);
      if (markerRef.current) {
        markerRef.current.setPosition(initialPos);
      }
    }
  }, [step, googleMapsLoaded, updateLocationFromCoords]);

  // Keep Google Map synced when coordinates change
  useEffect(() => {
    if (googleMapRef.current && markerRef.current && typeof lat === "number" && typeof lng === "number") {
      const pos = { lat, lng };
      markerRef.current.setPosition(pos);
      googleMapRef.current.panTo(pos);
    }
  }, [lat, lng]);

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
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (gallery.length + files.length > 5) {
      flashToast(isMn ? "Цомогт хамгийн ихдээ 5 зураг оруулна" : "Max 5 gallery images allowed");
      return;
    }

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
      setGallery((prev) => [...prev, ...newLinks]);
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

    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const res = await authApi.uploadFile(formData);
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
    }
  };

  // ─── Step Validation ──────────────────────────────────────────────────────
  const validateStep = (s) => {
    const errs = {};
    if (s === 1) {
      if (!title.trim()) errs.title = isMn ? "Эвентийн нэрээ бичнэ үү." : "Event title is required.";
      if (!shortDesc.trim() || shortDesc.length < 10) {
        errs.short = isMn ? "Хамгийн багадаа 10 тэмдэгт бичнэ үү." : "At least 10 characters required.";
      }
      if (!longDesc.trim() || longDesc.length < 20) {
        errs.long = isMn ? "Хамгийн багадаа 20 тэмдэгт бичнэ үү." : "At least 20 characters required.";
      }
      if (!categoryId) errs.category = isMn ? "Ангиллаа сонгоно уу." : "Category is required.";
      if (!poster) errs.poster = isMn ? "Постер зургаа оруулна уу." : "Poster image is required.";
    }

    if (s === 2) {
      if (!startDate) errs.startDate = isMn ? "Эхлэх огноог сонгоно уу." : "Start date is required.";
      if (!startTime) errs.startTime = isMn ? "Эхлэх цагийг оруулна уу." : "Start time is required.";
      if (!venueName.trim()) errs.venueName = isMn ? "Байршлын нэрээ оруулна уу." : "Venue name is required.";
      if (!address.trim()) errs.address = isMn ? "Хаягаа оруулна уу." : "Address is required.";
    }

    if (s === 3) {
      if (isFree) {
        if (!freeCap || Number(freeCap) <= 0) {
          errs.freeCap = isMn ? "Багтаамжийг 0-ээс их тоогоор оруулна уу." : "Capacity must be greater than 0.";
        }
      } else {
        if (!tickets || tickets.length === 0) {
          errs.tickets = isMn ? "Дор хаяж 1 тасалбар нэмнэ үү." : "At least 1 ticket required.";
        } else {
          tickets.forEach((t, i) => {
            if (!t.name.trim()) errs[`tkName_${i}`] = isMn ? "Нэр оруулна уу." : "Ticket name required.";
            if (t.price === "" || Number(t.price) < 0) errs[`tkPrice_${i}`] = isMn ? "Үнэ зөв оруулна уу." : "Valid price required.";
            if (!t.cap || Number(t.cap) <= 0) errs[`tkCap_${i}`] = isMn ? "Тоо ширхэг оруулна уу." : "Quantity required.";
          });
        }
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
      ? [
        {
          ticketName: "Үнэгүй тасалбар",
          ticketShortDesc: "Энэхүү эвентийн үнэгүй нэвтрэх тасалбар",
          price: 0,
          qty: Number(freeCap) || 100,
          isFreeTicket: true,
          ticketSelesStartDate: freeSs ? freeSs.slice(0, 10) : startDate || "",
          ticketSelesEndDate: freeSe ? freeSe.slice(0, 10) : endDate || startDate || "",
        },
      ]
      : tickets.map((t) => ({
        ticketName: t.name,
        ticketShortDesc: t.desc || "",
        price: Number(t.price) || 0,
        qty: Number(t.cap) || 100,
        isFreeTicket: false,
        ticketSelesStartDate: t.ss || startDate || "",
        ticketSelesEndDate: t.se || endDate || startDate || "",
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
      refundPolicy: isFree ? (dbPolicies[0] || "") : (policy || dbPolicies[0] || ""),
      accessAndPrivacy: visibility === "public",
      ageRestriction: `${ageRestriction}+`,
      dressCode: dressCode || "Энгийн",
      tags: entryNotes ? [entryNotes] : [],
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
    if (!title.trim()) {
      flashToast(isMn ? "Эвентийн нэр оруулна уу" : "Event title is required to save draft");
      setErrors((prev) => ({ ...prev, title: isMn ? "Эвентийн нэрээ бичнэ үү." : "Title required" }));
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
        router.push(`/eventbooking?id=${createdEventId}`);
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
    // Final check across all steps
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      flashToast(isMn ? "Дутуу бөглөсөн талбар байна" : "Please complete required fields");
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
    ? dbCategories.map((c) => ({ id: c._id, label: c.name, en: c.name }))
    : FALLBACK_CATS;

  if (initialLoading) {
    return (
      <main style={{ flex: 1, padding: "80px 20px", textAlign: "center", color: "var(--bd-gray-400)" }}>
        <span className="ew-sp" style={{ width: "24px", height: "24px", margin: "0 auto 16px" }} />
        <p style={{ margin: 0, fontSize: "15px" }}>{isMn ? "Уншиж байна..." : "Loading event editor..."}</p>
      </main>
    );
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
          {isMn ? `АЛХАМ ${step} / 5` : `STEP ${step} OF 5`}
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
                    setTitle(e.target.value.slice(0, 80));
                    if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
                  }}
                  maxLength={80}
                  aria-invalid={Boolean(errors.title)}
                  placeholder={isMn ? "Эвентийн нэр оруулна уу" : "Enter event title"}
                />
                <span className="ew-count">{title.length} / 80</span>
                {errors.title && <span className="ew-er">{errors.title}</span>}
              </label>

              {/* Short Description */}
              <label className="ew-f">
                <span className="ew-lb">
                  {isMn ? "Товч танилцуулга" : "Short Description"} <i>*</i>
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
                <span className="ew-count">{shortDesc.length} / 160</span>
                {errors.short && <span className="ew-er">{errors.short}</span>}
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
                    setLongDesc(e.target.value.slice(0, 800));
                    if (errors.long) setErrors((prev) => ({ ...prev, long: "" }));
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
                      {uploadingPoster ? <span className="ew-sp" /> : isMn ? "Зураг сонгох" : "Select Image"}
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
                  {isMn ? "Эвентээ танилцуулах 5 хүртэлх зураг" : "Up to 5 event showcase images"}
                </span>
              </div>

              {/* Teaser Video */}
              <div className="ew-f">
                <span className="ew-lb">
                  {isMn ? "Тизер видео" : "Teaser Video"}{" "}
                  <span className="ew-opt-b">({isMn ? "заавал биш" : "optional"})</span>
                </span>
                <div className="ew-drop">
                  <span className="ew-dropT">
                    {teaserName || (isMn ? "Тизер видео оруулах" : "Upload Teaser Video")}
                  </span>
                  <span className="ew-dropS">MP4, MOV (Max 50MB)</span>
                  <label className="ew-gh ew-sm" style={{ position: "relative", overflow: "hidden" }}>
                    {uploadingVideo ? <span className="ew-sp" /> : isMn ? "Видео сонгох" : "Choose Video"}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={uploadingVideo}
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                    />
                  </label>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            STEP 2: Огноо ба байршил (Date & Location)
            ═════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="ew-grid3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", alignItems: "start", marginTop: "18px" }}>
            {/* Column 1: Date & Time */}
            <section className="ew-cardIn">
              <h2 className="ew-h2">{isMn ? "Огноо ба цаг" : "Date & Time"}</h2>
              <label className="ew-f">
                <span className="ew-lb">{isMn ? "Эхлэх огноо" : "Start Date"} <i>*</i></span>
                <input
                  type="date"
                  className="ew-in"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: "" }));
                  }}
                  aria-invalid={Boolean(errors.startDate)}
                />
                {errors.startDate && <span className="ew-er">{errors.startDate}</span>}
              </label>
              <label className="ew-f">
                <span className="ew-lb">{isMn ? "Эхлэх цаг" : "Start Time"} <i>*</i></span>
                <input
                  type="time"
                  className="ew-in"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    if (errors.startTime) setErrors((prev) => ({ ...prev, startTime: "" }));
                  }}
                  aria-invalid={Boolean(errors.startTime)}
                />
                {errors.startTime && <span className="ew-er">{errors.startTime}</span>}
              </label>
              <label className="ew-f">
                <span className="ew-lb">{isMn ? "Дуусах огноо" : "End Date"}</span>
                <input
                  type="date"
                  className="ew-in"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
              <label className="ew-f">
                <span className="ew-lb">{isMn ? "Дуусах цаг" : "End Time"}</span>
                <input
                  type="time"
                  className="ew-in"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </label>
            </section>

            {/* Column 2: Venue & Address */}
            <section className="ew-cardIn">
              <h2 className="ew-h2">{isMn ? "Байршил" : "Location"}</h2>
              <label className="ew-f">
                <span className="ew-lb">{isMn ? "Байршлын нэр" : "Venue Name"} <i>*</i></span>
                <input
                  ref={venueInputRef}
                  type="text"
                  className="ew-in"
                  value={venueName}
                  onChange={(e) => {
                    setVenueName(e.target.value);
                    if (errors.venueName) setErrors((prev) => ({ ...prev, venueName: "" }));
                  }}
                  aria-invalid={Boolean(errors.venueName)}
                  placeholder="Жишээ: UB Palace, Steppe Arena"
                />
                {errors.venueName && <span className="ew-er">{errors.venueName}</span>}
              </label>

              <div className="ew-f">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span className="ew-lb" style={{ margin: 0 }}>{isMn ? "Дүүрэг" : "District"}</span>
                  {districtAutoFilled && (
                    <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      {isMn ? "Автомат" : "Auto-filled"}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  className="ew-in"
                  value={district}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDistrict(val);
                    setDistrictAutoFilled(false);
                    if (val.trim() && !availableDistricts.includes(val.trim())) {
                      setAvailableDistricts((prev) => [val.trim(), ...prev]);
                    }
                  }}
                  placeholder={isMn ? "Google Places-аас автоматаар бөглөгдөнө" : "Auto-filled from Google Places or map"}
                  list="districts-datalist"
                  autoComplete="off"
                />
                <datalist id="districts-datalist">
                  {availableDistricts.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              <div className="ew-f" style={{ position: "relative" }}>
                <span className="ew-lb">{isMn ? "Дэлгэрэнгүй хаяг" : "Full Address"} <i>*</i></span>
                <input
                  ref={addressInputRef}
                  type="text"
                  className="ew-in"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setAddrQuery(e.target.value);
                    if (errors.address) setErrors((prev) => ({ ...prev, address: "" }));
                  }}
                  aria-invalid={Boolean(errors.address)}
                  placeholder={isMn ? "Google Places хаяг хайх..." : "Search Google Places address..."}
                />
                {errors.address && <span className="ew-er">{errors.address}</span>}
              </div>

              {/* Selected Venue summary */}
              {(venueName || address) && (
                <div className="ew-loc" style={{ padding: "12px 14px" }}>
                  <span className="ew-locI">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <div className="ew-locT">
                    <b>{venueName || "—"}</b>
                    <span>{address || "—"}</span>
                  </div>
                </div>
              )}
            </section>

            {/* Column 3: Google Map */}
            <section className="ew-cardIn">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 className="ew-h2" style={{ margin: 0 }}>{isMn ? "Газрын зураг" : "Map"}</h2>
                {googleMapsLoaded && (
                  <span style={{ fontSize: "12px", color: "var(--acc-bright)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--acc-bright)" }} />
                    Google Maps
                  </span>
                )}
              </div>

              <div
                style={{
                  position: "relative",
                  height: "280px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid var(--bd-border-strong)",
                  background: "#141414",
                }}
              >
                <div
                  ref={mapContainerRef}
                  style={{ width: "100%", height: "100%", display: googleMapsLoaded ? "block" : "none" }}
                />
                {!googleMapsLoaded && (
                  <div
                    className="ew-map"
                    data-pinmode={pinMode ? "1" : "0"}
                    onClick={handleMapClick}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <span className="ew-pin">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <p className="ew-mapT">
                      {pinMode
                        ? isMn ? "Байршил дээр дарна уу" : "Click to drop pin"
                        : `${lat.toFixed(4)}, ${lng.toFixed(4)}`}
                    </p>
                  </div>
                )}
                {/* Floating overlays */}
                <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", pointerEvents: "none", zIndex: 5 }}>
                  <span style={{ background: "rgba(18,18,18,0.9)", backdropFilter: "blur(6px)", padding: "4px 10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.14)", fontSize: "11px", color: "var(--bd-gray-200)" }}>
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </span>
                  <button
                    type="button"
                    className="ew-gh ew-sm"
                    onClick={() => {
                      if (googleMapRef.current) {
                        googleMapRef.current.panTo({ lat, lng });
                        googleMapRef.current.setZoom(16);
                        flashToast(isMn ? "Байршилд төвлөрлөө" : "Centered on pin");
                      } else {
                        setPinMode((prev) => !prev);
                      }
                    }}
                    style={{ pointerEvents: "auto", background: "rgba(18,18,18,0.9)", borderColor: "rgba(255,255,255,0.2)", color: "var(--bd-white)" }}
                  >
                    {isMn ? "Төвлөрөх" : "Center"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", padding: "10px 12px", background: "var(--bd-ink-800)", borderRadius: "12px", border: "1px solid var(--bd-border-soft)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--acc-bright)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                <span style={{ fontSize: "12px", color: "var(--bd-gray-400)" }}>
                  {isMn ? "Газрын зураг дээр дарж эсвэл маркер чирж байршлаа тохируулна" : "Click map or drag marker to update location"}
                </span>
              </div>
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
                <b>{isMn ? "Үнэгүй эвент" : "Free Event"}</b>
                <span>
                  {isMn
                    ? "Эвент үнэ төлбөргүй бол идэвхжүүлнэ үү."
                    : "Toggle on if admission to this event is free of charge."}
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
                          {isMn ? `Тасалбар ${idx + 1}` : `Ticket ${idx + 1}`}
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
                          {isMn ? "Тасалбарын нэр" : "Ticket Tier Name"} <i>*</i>
                        </span>
                        <input
                          type="text"
                          className="ew-in"
                          value={t.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTickets((prev) => prev.map((item, i) => (i === idx ? { ...item, name: val } : item)));
                            if (errors[`tkName_${idx}`]) {
                              setErrors((prev) => ({ ...prev, [`tkName_${idx}`]: "" }));
                            }
                          }}
                          aria-invalid={Boolean(errors[`tkName_${idx}`])}
                          placeholder="Жишээ: VIP суудал, Энгийн суудал"
                        />
                        {errors[`tkName_${idx}`] && <span className="ew-er">{errors[`tkName_${idx}`]}</span>}
                      </label>

                      <label className="ew-f">
                        <span className="ew-lb">
                          {isMn ? "Товч тайлбар" : "Short Description"}{" "}
                          <span className="ew-opt-b">({isMn ? "заавал биш" : "optional"})</span>
                        </span>
                        <textarea
                          className="ew-ta"
                          value={t.desc}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTickets((prev) => prev.map((item, i) => (i === idx ? { ...item, desc: val } : item)));
                          }}
                          placeholder={isMn ? "Энэ тасалбарт юу багтахыг тайлбарлана уу" : "What is included with this ticket?"}
                        />
                      </label>

                      <div className="ew-2">
                        <label className="ew-f">
                          <span className="ew-lb">
                            {isMn ? "Үнэ (₮)" : "Price (₮)"} <i>*</i>
                          </span>
                          <input
                            type="number"
                            min="0"
                            className="ew-in"
                            value={t.price}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTickets((prev) => prev.map((item, i) => (i === idx ? { ...item, price: val } : item)));
                              if (errors[`tkPrice_${idx}`]) {
                                setErrors((prev) => ({ ...prev, [`tkPrice_${idx}`]: "" }));
                              }
                            }}
                            aria-invalid={Boolean(errors[`tkPrice_${idx}`])}
                            placeholder="30000"
                          />
                          {errors[`tkPrice_${idx}`] && <span className="ew-er">{errors[`tkPrice_${idx}`]}</span>}
                        </label>

                        <label className="ew-f">
                          <span className="ew-lb">
                            {isMn ? "Тоо ширхэг" : "Quantity / Capacity"} <i>*</i>
                          </span>
                          <input
                            type="number"
                            min="1"
                            className="ew-in"
                            value={t.cap}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTickets((prev) => prev.map((item, i) => (i === idx ? { ...item, cap: val } : item)));
                              if (errors[`tkCap_${idx}`]) {
                                setErrors((prev) => ({ ...prev, [`tkCap_${idx}`]: "" }));
                              }
                            }}
                            aria-invalid={Boolean(errors[`tkCap_${idx}`])}
                            placeholder="100"
                          />
                          {errors[`tkCap_${idx}`] && <span className="ew-er">{errors[`tkCap_${idx}`]}</span>}
                        </label>

                        <label className="ew-f">
                          <span className="ew-lb">{isMn ? "Борлуулалт эхлэх" : "Sales Start"}</span>
                          <input
                            type="date"
                            className="ew-in"
                            value={t.ss}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTickets((prev) => prev.map((item, i) => (i === idx ? { ...item, ss: val } : item)));
                            }}
                          />
                        </label>

                        <label className="ew-f">
                          <span className="ew-lb">{isMn ? "Борлуулалт дуусах" : "Sales End"}</span>
                          <input
                            type="date"
                            className="ew-in"
                            value={t.se}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTickets((prev) => prev.map((item, i) => (i === idx ? { ...item, se: val } : item)));
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                {errors.tickets && <span className="ew-er">{errors.tickets}</span>}

                <button
                  type="button"
                  className="ew-gh"
                  style={{ alignSelf: "flex-start", marginTop: "4px" }}
                  onClick={() =>
                    setTickets((prev) => [
                      ...prev,
                      { name: "", desc: "", price: 0, cap: 50, ss: "", se: "" },
                    ])
                  }
                >
                  {isMn ? "+ Өөр тасалбарын төрөл нэмэх" : "+ Add Ticket Tier"}
                </button>

                <div style={{ height: "1px", background: "var(--bd-border-soft)", margin: "8px 0" }} />

                {/* Refund Policy */}
                <label className="ew-f">
                  <span className="ew-row1">
                    <span className="ew-lb" style={{ margin: 0 }}>
                      {isMn ? "Буцаан олголтын нөхцөл" : "Refund Policy"} <i>*</i>
                    </span>
                    <select
                      className="ew-in"
                      value={policy}
                      onChange={(e) => setPolicy(e.target.value)}
                      style={{ flex: "0 1 auto", width: "300px", maxWidth: "100%" }}
                    >
                      {dbPolicies.length === 0 ? (
                        <option value="">{isMn ? "Уншиж байна..." : "Loading..."}</option>
                      ) : (
                        dbPolicies.map((pol) => (
                          <option key={pol} value={pol}>
                            {pol}
                          </option>
                        ))
                      )}
                    </select>
                  </span>
                </label>
              </>
            ) : (
              /* Free Event Details */
              <div className="ew-tk">
                <div className="ew-tkH">
                  <b>{isMn ? "Бүртгэл ба багтаамж" : "Registration & Capacity"}</b>
                </div>
                <label className="ew-f">
                  <span className="ew-lb">
                    {isMn ? "Нийт багтаамж" : "Total Capacity"} <i>*</i>
                  </span>
                  <input
                    type="number"
                    min="1"
                    className="ew-in"
                    value={freeCap}
                    onChange={(e) => {
                      setFreeCap(e.target.value);
                      if (errors.freeCap) setErrors((prev) => ({ ...prev, freeCap: "" }));
                    }}
                    aria-invalid={Boolean(errors.freeCap)}
                    placeholder="Жишээ: 120"
                  />
                  {errors.freeCap && <span className="ew-er">{errors.freeCap}</span>}
                  <span className="ew-hint">
                    {isMn
                      ? "Бүртгэл багтаамжаас хэтрэхгүй. Бүртгүүлсэн хүн бүрт QR тасалбар үүсч, үүдэн дээр шалгагдана."
                      : "Each registered attendee receives a unique QR code ticket for entry check-in."}
                  </span>
                </label>
                <div className="ew-2">
                  <label className="ew-f">
                    <span className="ew-lb">
                      {isMn ? "Бүртгэл эхлэх" : "Registration Opens"}{" "}
                      <span className="ew-opt-b">({isMn ? "заавал биш" : "optional"})</span>
                    </span>
                    <input
                      type="datetime-local"
                      className="ew-in"
                      value={freeSs}
                      onChange={(e) => setFreeSs(e.target.value)}
                    />
                  </label>
                  <label className="ew-f">
                    <span className="ew-lb">
                      {isMn ? "Бүртгэл дуусах" : "Registration Closes"}{" "}
                      <span className="ew-opt-b">({isMn ? "заавал биш" : "optional"})</span>
                    </span>
                    <input
                      type="datetime-local"
                      className="ew-in"
                      value={freeSe}
                      onChange={(e) => setFreeSe(e.target.value)}
                    />
                  </label>
                </div>
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
                    aria-selected={ageRestriction === "all"}
                    onClick={() => setAgeRestriction("all")}
                  >
                    {isMn ? "Бүх насныханд" : "All Ages"}
                  </button>
                  <button
                    type="button"
                    className="ew-pk"
                    aria-selected={ageRestriction === "18"}
                    onClick={() => setAgeRestriction("18")}
                  >
                    18+
                  </button>
                  <button
                    type="button"
                    className="ew-pk"
                    aria-selected={ageRestriction === "21"}
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
                  onChange={(e) => setEntryNotes(e.target.value)}
                  placeholder={isMn ? "Жишээ: Иргэний үнэмлэх үүдэн дээр шалгана." : "e.g. ID verification required at entrance."}
                />
              </label>

              {/* Dress Code */}
              <label className="ew-f">
                <span className="ew-lb">{isMn ? "Хувцаслалтын дүрэм" : "Dress Code"}</span>
                <input
                  type="text"
                  className="ew-in"
                  value={dressCode}
                  onChange={(e) => setDressCode(e.target.value)}
                  placeholder={isMn ? "Жишээ: Энгийн, тухтай хувцас" : "e.g. Casual, Formal"}
                />
              </label>
            </section>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            STEP 5: Хянах (Review & Confirm)
            ═════════════════════════════════════════════════════════════════════ */}
        {step === 5 && (
          <div className="ew-r4" style={{ marginTop: "18px" }}>
            {/* Card 1: Эвент ба байршил */}
            <div className="ew-rcard">
              <div className="ew-rcH">
                <b>{isMn ? "Эвент ба байршил" : "Event & Venue"}</b>
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
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <b style={{ fontSize: "16px", color: "var(--bd-white)", display: "block", marginBottom: "4px" }}>
                    {title || "—"}
                  </b>
                  <span style={{ fontSize: "12.5px", color: "var(--acc-bright)", display: "block", marginBottom: "10px" }}>
                    {categoryName || (isMn ? "Ангилал сонгогдоогүй" : "No category")}
                  </span>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--bd-gray-400)", lineHeight: 1.45 }}>
                    {shortDesc || "—"}
                  </p>
                </div>
              </div>

              <div style={{ height: "1px", background: "var(--bd-border-soft)", margin: "14px 0" }} />

              <span className="ew-kv2">
                <span>{isMn ? "Байршлын нэр" : "Venue"}</span>
                <span>{venueName || "—"}</span>
              </span>
              <span className="ew-kv2">
                <span>{isMn ? "Хаяг" : "Address"}</span>
                <span>{address || "—"}</span>
              </span>
              <span className="ew-kv2">
                <span>{isMn ? "Эхлэх" : "Starts"}</span>
                <span>{startDate ? `${startDate} · ${startTime || "00:00"}` : "—"}</span>
              </span>
              <span className="ew-kv2">
                <span>{isMn ? "Дуусах" : "Ends"}</span>
                <span>{endDate ? `${endDate} · ${endTime || "00:00"}` : startDate || "—"}</span>
              </span>
            </div>

            {/* Right Column: Cards 2 & 3 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Card 2: Тасалбар */}
              <div className="ew-rcard">
                <div className="ew-rcH">
                  <b>{isFree ? (isMn ? "Үнэгүй бүртгэл" : "Free Registration") : (isMn ? "Тасалбарууд" : "Tickets")}</b>
                  <button type="button" className="ew-edit" onClick={() => handleGotoStep(3)}>
                    {isMn ? "Засах" : "Edit"}
                  </button>
                </div>

                {isFree ? (
                  <div className="ew-tkRow">
                    <span className="ew-tkRowT">
                      <b>{isMn ? "Үнэгүй тасалбар" : "Free Admission"}</b>
                      <small>{isMn ? `Багтаамж: ${freeCap}` : `Capacity: ${freeCap}`}</small>
                    </span>
                    <span className="ew-tkRowV">₮0</span>
                  </div>
                ) : (
                  tickets.map((t, idx) => (
                    <div key={idx} className="ew-tkRow">
                      <span className="ew-tkRowT">
                        <b>{t.name || `Тасалбар ${idx + 1}`}</b>
                        <small>{isMn ? `Тоо: ${t.cap}` : `Qty: ${t.cap}`}</small>
                      </span>
                      <span className="ew-tkRowV">₮{Number(t.price || 0).toLocaleString()}</span>
                    </div>
                  ))
                )}

                {!isFree && (
                  <span className="ew-kv2" style={{ borderTop: "1px solid var(--bd-border-soft)", marginTop: "6px" }}>
                    <span>{isMn ? "Буцаан олголт" : "Refund Policy"}</span>
                    <span>{policy}</span>
                  </span>
                )}
              </div>

              {/* Card 3: Тохиргоо */}
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
                  <span>{isMn ? "Насны хязгаар" : "Age Restriction"}</span>
                  <span>{ageRestriction === "all" ? (isMn ? "Бүх насныханд" : "All Ages") : `${ageRestriction}+`}</span>
                </span>
                <span className="ew-kv2">
                  <span>{isMn ? "Оролцогчдыг харуулах" : "Show Attendees"}</span>
                  <span>{showAttendees ? (isMn ? "Тийм" : "Yes") : (isMn ? "Үгүй" : "No")}</span>
                </span>
                {entryNotes && (
                  <span className="ew-kv2 ew-clamp">
                    <span>{isMn ? "Нэвтрэх заавар" : "Entry Notes"}</span>
                    <span>{entryNotes}</span>
                  </span>
                )}
                {dressCode && (
                  <span className="ew-kv2 ew-clamp">
                    <span>{isMn ? "Хувцаслалт" : "Dress Code"}</span>
                    <span>{dressCode}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
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
            {isMn ? "Ноорог хадгалах" : "Save Draft"}
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
                ? (isMn ? "Өөрчлөлтийг хадгалах" : "Save Changes")
                : (isMn ? "Эвент нийтлэх" : "Publish Event")}
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
