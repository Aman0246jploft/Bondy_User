"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import categoryApi from "@/api/categoryApi";
import eventApi from "@/api/eventApi";
import wishlistApi from "@/api/wishlistApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";
import DateRangeCalendarPopover from "../../components/DateRangeCalendarPopover";
import InteractiveMapStage from "../../components/InteractiveMapStage";

// Helper for distance in km using Haversine formula
function calcDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 2.5;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Helper for bilingual event date formatting
function formatEventDateText(startDate, startTime, lang) {
  if (!startDate) return lang === "mn" ? "Тун удахгүй" : "Coming Soon";
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return lang === "mn" ? "Тун удахгүй" : "Coming Soon";

  const mnDayNames = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];
  const enDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const enMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const m = d.getMonth() + 1;
  const dateNum = d.getDate();
  const dayIdx = d.getDay();
  const timeStr = startTime || `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  if (lang === "mn") {
    return `${m}-р сарын ${dateNum}, ${mnDayNames[dayIdx]} · ${timeStr}`;
  } else {
    return `${enMonthNames[m - 1]} ${dateNum}, ${enDayNames[dayIdx]} · ${timeStr}`;
  }
}

// Loading Skeleton Component
function GridSkeleton() {
  return (
    <div className="el-grid">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div
          key={idx}
          className="el-c"
          style={{
            pointerEvents: "none",
            opacity: 0.7,
          }}
        >
          <span
            className="el-c-img"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              display: "block",
            }}
          />
          <span className="el-c-b" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <span
              style={{
                display: "block",
                height: "18px",
                width: "75%",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "4px",
              }}
            />
            <span
              style={{
                display: "block",
                height: "14px",
                width: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                borderRadius: "4px",
              }}
            />
            <span
              style={{
                display: "block",
                height: "14px",
                width: "40%",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                borderRadius: "4px",
              }}
            />
            <span
              style={{
                display: "block",
                height: "16px",
                width: "30%",
                backgroundColor: "rgba(35, 173, 164, 0.2)",
                borderRadius: "4px",
                marginTop: "4px",
              }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

// Complete 18 fixture events with bilingual titles, venues, and dates
const PROTOTYPE_EVENTS = [
  {
    id: "evt-0",
    title_mn: "Морин хуурын гала тоглолт",
    title_en: "Morin Khuur Gala Concert",
    dateText_mn: "9-р сарын 5, Бя · 19:00",
    dateText_en: "Sep 5, Sat · 19:00",
    venue_mn: "Улсын драмын театр",
    venue_en: "State Drama Theatre",
    priceNum: 25000,
    image: "/assets/img/95915dd284f4c106.jpg",
    catKey: "music",
    km: 2.6,
    time: "19:00",
    date: "2026-09-05",
    lat: 47.9151,
    lng: 106.9146,
    promo: false,
    href: "/eventDetails?id=evt-0",
  },
  {
    id: "evt-1",
    title_mn: "Sofar UB: Акустик сешн",
    title_en: "Sofar UB: Acoustic Session",
    dateText_mn: "9-р сарын 5, Бя · 21:00",
    dateText_en: "Sep 5, Sat · 21:00",
    venue_mn: "Blue Sky Lounge",
    venue_en: "Blue Sky Lounge",
    priceNum: 32000,
    image: "/assets/img/8e94a2fe5d7c034d.jpg",
    catKey: "music",
    km: 1.8,
    time: "21:00",
    date: "2026-09-05",
    lat: 47.9166,
    lng: 106.9199,
    promo: false,
    href: "/eventDetails?id=evt-1",
  },
  {
    id: "evt-2",
    title_mn: "Хотын амт — хүнсний фестиваль",
    title_en: "City Flavors — Food Festival",
    dateText_mn: "9-р сарын 5, Бя · 12:00",
    dateText_en: "Sep 5, Sat · 12:00",
    venue_mn: "Хүннү молл, гадна талбай",
    venue_en: "Hunnu Mall, Outdoor Plaza",
    priceNum: 15000,
    image: "/assets/img/702844b5b1ca71e6.jpg",
    catKey: "family",
    km: 5.2,
    time: "12:00",
    date: "2026-09-05",
    lat: 47.8862,
    lng: 106.8752,
    promo: true,
    href: "/eventDetails?id=evt-2",
  },
  {
    id: "evt-3",
    title_mn: "Улаанбаатар өглөөний гүйлт",
    title_en: "Ulaanbaatar Morning Run",
    dateText_mn: "9-р сарын 6, Ня · 07:00",
    dateText_en: "Sep 6, Sun · 07:00",
    venue_mn: "Сүхбаатарын талбай",
    venue_en: "Sukhbaatar Square",
    priceNum: 40000,
    image: "/assets/img/f0ec48407c3c84f6.png",
    catKey: "sports",
    km: 0.9,
    time: "07:00",
    date: "2026-09-06",
    lat: 47.9186,
    lng: 106.9176,
    promo: false,
    href: "/eventDetails?id=evt-3",
  },
  {
    id: "evt-4",
    title_mn: "Гэр бүлийн зуны наадам",
    title_en: "Family Summer Festival",
    dateText_mn: "9-р сарын 6, Ня · 11:00",
    dateText_en: "Sep 6, Sun · 11:00",
    venue_mn: "Соёл амралтын хүрээлэн",
    venue_en: "National Amusement Park",
    priceNum: 0,
    image: "/assets/img/07c6c6c75b998fb6.jpg",
    catKey: "family",
    km: 3.4,
    time: "11:00",
    date: "2026-09-06",
    lat: 47.9163,
    lng: 106.9366,
    promo: false,
    href: "/eventDetails?id=evt-4",
  },
  {
    id: "evt-5",
    title_mn: "Nomad Beats: DJ сешн",
    title_en: "Nomad Beats: DJ Session",
    dateText_mn: "9-р сарын 6, Ня · 22:00",
    dateText_en: "Sep 6, Sun · 22:00",
    venue_mn: "UB Sound Lab",
    venue_en: "UB Sound Lab",
    priceNum: 28000,
    image: "/assets/img/dd5548cce6edebaa.jpg",
    catKey: "music",
    km: 4.1,
    time: "22:00",
    date: "2026-09-06",
    lat: 47.9128,
    lng: 106.9078,
    promo: true,
    href: "/eventDetails?id=evt-5",
  },
  {
    id: "evt-6",
    title_mn: "Модерн урлагийн шөнө",
    title_en: "Modern Art Night",
    dateText_mn: "9-р сарын 9, Лх · 19:30",
    dateText_en: "Sep 9, Wed · 19:30",
    venue_mn: "Zanabazar галерей",
    venue_en: "Zanabazar Fine Arts Gallery",
    priceNum: 22000,
    image: "/assets/img/7b6105dcfd227890.jpg",
    catKey: "concerts",
    km: 2.1,
    time: "19:30",
    date: "2026-09-09",
    lat: 47.9174,
    lng: 106.9166,
    promo: false,
    href: "/eventDetails?id=evt-6",
  },
  {
    id: "evt-7",
    title_mn: "UB Jazz Club: Шөнийн сешн",
    title_en: "UB Jazz Club: Night Session",
    dateText_mn: "9-р сарын 11, Ба · 22:00",
    dateText_en: "Sep 11, Fri · 22:00",
    venue_mn: "UB Jazz Club",
    venue_en: "UB Jazz Club",
    priceNum: 28000,
    image: "/assets/img/6450ac80291b9a2d.jpg",
    catKey: "music",
    km: 4.2,
    time: "22:00",
    date: "2026-09-11",
    lat: 47.9235,
    lng: 106.9126,
    promo: false,
    href: "/eventDetails?id=evt-7",
  },
  {
    id: "evt-8",
    title_mn: "Хөх Тэнгэр: Индирок шөнө",
    title_en: "Blue Sky: Indie Rock Night",
    dateText_mn: "9-р сарын 12, Бя · 20:00",
    dateText_en: "Sep 12, Sat · 20:00",
    venue_mn: "Blue Sky Lounge",
    venue_en: "Blue Sky Lounge",
    priceNum: 35000,
    image: "/assets/img/1f821f0d15ec4978.jpg",
    catKey: "concerts",
    km: 1.8,
    time: "20:00",
    date: "2026-09-12",
    lat: 47.9166,
    lng: 106.9199,
    promo: false,
    href: "/eventDetails?id=evt-8",
  },
  {
    id: "evt-9",
    title_mn: "Хүүхдийн шинжлэх ухааны өдөрлөг",
    title_en: "Kids Science Discovery Day",
    dateText_mn: "9-р сарын 13, Ня · 10:00",
    dateText_en: "Sep 13, Sun · 10:00",
    venue_mn: "Шинжлэх ухаан технологийн музей",
    venue_en: "Science & Tech Museum",
    priceNum: 0,
    image: "/assets/img/afc19b55dffa3545.jpg",
    catKey: "family",
    km: 3.1,
    time: "10:00",
    date: "2026-09-13",
    lat: 47.9224,
    lng: 106.9271,
    promo: false,
    href: "/eventDetails?id=evt-9",
  },
  {
    id: "evt-10",
    title_mn: "Улаанбаатар Оупен — теннис",
    title_en: "Ulaanbaatar Open Tennis",
    dateText_mn: "9-р сарын 16, Лх · 10:00",
    dateText_en: "Sep 16, Wed · 10:00",
    venue_mn: "Буянт-Ухаа спорт цогцолбор",
    venue_en: "Buyant-Ukhaa Sports Complex",
    priceNum: 20000,
    image: "/assets/img/13d7944e34016c1d.jpg",
    catKey: "sports",
    km: 7.4,
    time: "10:00",
    date: "2026-09-16",
    lat: 47.8871,
    lng: 106.9265,
    promo: false,
    href: "/eventDetails?id=evt-10",
  },
  {
    id: "evt-11",
    title_mn: "Стартап Питч шөнө",
    title_en: "Startup Pitch Night",
    dateText_mn: "9-р сарын 17, Пү · 18:30",
    dateText_en: "Sep 17, Thu · 18:30",
    venue_mn: "Blue Sky Tower, 19 давхар",
    venue_en: "Blue Sky Tower, 19th Floor",
    priceNum: 25000,
    image: "/assets/img/b235bc2b30d87c92.png",
    catKey: "conference",
    km: 1.7,
    time: "18:30",
    date: "2026-09-17",
    lat: 47.9166,
    lng: 106.9199,
    promo: false,
    href: "/eventDetails?id=evt-11",
  },
  {
    id: "evt-12",
    title_mn: "Гоби Фолк Фест 2026",
    title_en: "Gobi Folk Fest 2026",
    dateText_mn: "9-р сарын 19, Бя · 18:00",
    dateText_en: "Sep 19, Sat · 18:00",
    venue_mn: "Үндэсний соёл амралтын хүрээлэн",
    venue_en: "National Amusement Park",
    priceNum: 65000,
    image: "/assets/img/0beaec5298178d0b.jpg",
    catKey: "concerts",
    km: 5.6,
    time: "18:00",
    date: "2026-09-19",
    lat: 47.9163,
    lng: 106.9366,
    promo: true,
    href: "/eventDetails?id=evt-12",
  },
  {
    id: "evt-13",
    title_mn: "Богд хайрхан трек — өдрийн аялал",
    title_en: "Bogd Khan Trek — Day Tour",
    dateText_mn: "9-р сарын 20, Ня · 08:00",
    dateText_en: "Sep 20, Sun · 08:00",
    venue_mn: "Зайсан цогцолбор, цуглах цэг",
    venue_en: "Zaisan Complex Meeting Point",
    priceNum: 45000,
    image: "/assets/img/ce3c143443abb03d.png",
    catKey: "sports",
    km: 6.8,
    time: "08:00",
    date: "2026-09-20",
    lat: 47.8869,
    lng: 106.9152,
    promo: false,
    href: "/eventDetails?id=evt-13",
  },
  {
    id: "evt-14",
    title_mn: "AI шөнө: бүтээгчдийн уулзалт",
    title_en: "AI Night: Creators Meetup",
    dateText_mn: "9-р сарын 24, Пү · 19:00",
    dateText_en: "Sep 24, Thu · 19:00",
    venue_mn: "Shangri-La Center, Хан-Уул",
    venue_en: "Shangri-La Center, Khan-Uul",
    priceNum: 35000,
    image: "/assets/img/42310e9cf7a28d06.jpg",
    catKey: "conference",
    km: 1.9,
    time: "19:00",
    date: "2026-09-24",
    lat: 47.9137,
    lng: 106.9192,
    promo: true,
    href: "/eventDetails?id=evt-14",
  },
  {
    id: "evt-15",
    title_mn: "UB Cypher: Хип-хоп шөнө",
    title_en: "UB Cypher: Hip-Hop Night",
    dateText_mn: "9-р сарын 26, Бя · 21:30",
    dateText_en: "Sep 26, Sat · 21:30",
    venue_mn: "UB Sound Lab",
    venue_en: "UB Sound Lab",
    priceNum: 30000,
    image: "/assets/img/3453c0265d41ec3c.jpg",
    catKey: "music",
    km: 4.1,
    time: "21:30",
    date: "2026-09-26",
    lat: 47.9128,
    lng: 106.9078,
    promo: false,
    href: "/eventDetails?id=evt-15",
  },
  {
    id: "evt-16",
    title_mn: "Филармонийн классик орой",
    title_en: "Philharmonic Classical Evening",
    dateText_mn: "9-р сарын 30, Лх · 19:00",
    dateText_en: "Sep 30, Wed · 19:00",
    venue_mn: "Улсын филармони",
    venue_en: "State Philharmonic Hall",
    priceNum: 38000,
    image: "/assets/img/195b819a97b60a5c.png",
    catKey: "music",
    km: 1.4,
    time: "19:00",
    date: "2026-09-30",
    lat: 47.9188,
    lng: 106.9203,
    promo: false,
    href: "/eventDetails?id=evt-16",
  },
  {
    id: "evt-17",
    title_mn: "Дижитал форум 2026",
    title_en: "Digital Forum 2026",
    dateText_mn: "10-р сарын 3, Бя · 09:00",
    dateText_en: "Oct 3, Sat · 09:00",
    venue_mn: "Steppe Arena, Баянзүрх",
    venue_en: "Steppe Arena, Bayanzurkh",
    priceNum: 90000,
    image: "/assets/img/5ab367361c6294d1.jpg",
    catKey: "conference",
    km: 8.2,
    time: "09:00",
    date: "2026-10-03",
    lat: 47.9082,
    lng: 106.9814,
    promo: false,
    href: "/eventDetails?id=evt-17",
  },
];

const DATE_CHIP_KEYS = [
  { key: "all", labelKey: "allDates" },
  { key: "today", labelKey: "today" },
  { key: "tomorrow", labelKey: "tomorrow" },
  { key: "weekend", labelKey: "thisWeekend" },
  { key: "week", labelKey: "next7Days" },
  { key: "custom", labelKey: "selectDate" },
];

const FALLBACK_POSTERS = [
  "/assets/img/95915dd284f4c106.jpg",
  "/assets/img/8e94a2fe5d7c034d.jpg",
  "/assets/img/702844b5b1ca71e6.jpg",
  "/assets/img/07c6c6c75b998fb6.jpg",
  "/assets/img/dd5548cce6edebaa.jpg",
  "/assets/img/7b6105dcfd227890.jpg",
];

function EventCardImage({ src, fallback }) {
  const [imgSrc, setImgSrc] = useState(src || fallback);

  useEffect(() => {
    setImgSrc(src || fallback);
  }, [src, fallback]);

  return (
    <span className="el-c-img" style={{ backgroundImage: `url(${imgSrc})` }}>
      <img
        src={imgSrc}
        alt=""
        style={{ display: "none" }}
        onError={() => {
          if (imgSrc !== fallback) {
            setImgSrc(fallback);
          }
        }}
      />
    </span>
  );
}

function MapRowThumb({ src, fallback }) {
  const [imgSrc, setImgSrc] = useState(src || fallback);

  useEffect(() => {
    setImgSrc(src || fallback);
  }, [src, fallback]);

  return (
    <span className="bd-mr-img" style={{ backgroundImage: `url(${imgSrc})` }}>
      <img
        src={imgSrc}
        alt=""
        style={{ display: "none" }}
        onError={() => {
          if (imgSrc !== fallback) {
            setImgSrc(fallback);
          }
        }}
      />
    </span>
  );
}

function ExploreContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Search input & form
  const [searchQuery, setSearchQuery] = useState("");

  // Date chip
  const [selectedDateKey, setSelectedDateKey] = useState("all"); // 'all' | 'today' | 'tomorrow' | 'weekend' | 'week' | 'custom'
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [customDateLabel, setCustomDateLabel] = useState("");
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const customChipRef = useRef(null);

  // Category chip
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("all");
  const [dynamicCategories, setDynamicCategories] = useState([]);

  // Sort dropdown
  const [sortOption, setSortOption] = useState("recommended"); // 'recommended' | 'date' | 'price' | 'new'

  // View mode
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'map'

  // Filter Sheet Popover
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [draftSort, setDraftSort] = useState("recommended");
  const [draftTod, setDraftTod] = useState("any"); // 'any' | 'morning' | 'afternoon' | 'evening' | 'night'
  const [draftDist, setDraftDist] = useState("any"); // 'any' | '2' | '5' | '10' | '20'

  const [appliedFilters, setAppliedFilters] = useState({
    sort: null,
    tod: "any",
    dist: "any",
  });

  // Server-side & Incremental progressive pagination (12 items per page)
  const PAGE_SIZE = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  // Debounce search query to avoid spamming the backend
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Favorites
  const [favs, setFavs] = useState([]);

  // Map state
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [mapZoom, setMapZoom] = useState(1);

  // Backend fetched events
  const [backendEvents, setBackendEvents] = useState([]);

  const filterRef = useRef(null);

  // Sync with URL params on mount
  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("q") || "";
    if (q) setSearchQuery(q);

    const d = searchParams.get("date");
    if (d && ["all", "today", "tomorrow", "weekend", "week", "custom"].includes(d)) {
      setSelectedDateKey(d);
    }

    const sort = searchParams.get("sort");
    if (sort && ["recommended", "date", "soonest", "price", "new"].includes(sort)) {
      setSortOption(sort === "soonest" ? "date" : sort);
    }

    const cat = searchParams.get("category");
    if (cat) setSelectedCategoryKey(cat);

    // Read stored favorites
    try {
      const stored = localStorage.getItem("bondy_favorites");
      if (stored) setFavs(JSON.parse(stored));
    } catch (e) { }
  }, [searchParams]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryApi.getCategories({ limit: 100 });
        const cats = res?.data?.categories || [];
        const eventCats = cats
        if (eventCats.length > 0) {
          const list = eventCats.map((c) => ({
            key: c._id,
            slug: (c.name || "").toLowerCase(),
            label: language === "mn" && c.name_thi ? c.name_thi : c.name,
          }));
          setDynamicCategories(list);
        }
      } catch (err) {
        console.error("Error fetching event categories:", err);
      }
    };
    fetchCats();
  }, [language]);

  // Resolve category key to ObjectId if needed
  const resolvedCategoryId = useMemo(() => {
    if (!selectedCategoryKey || selectedCategoryKey === "all") return null;
    if (/^[0-9a-fA-F]{24}$/.test(selectedCategoryKey)) return selectedCategoryKey;
    const found = dynamicCategories.find(
      (c) => c.key === selectedCategoryKey || c.slug === selectedCategoryKey.toLowerCase()
    );
    return found?.key || null;
  }, [selectedCategoryKey, dynamicCategories]);

  // Map raw backend event into standardized UI card model
  const mapRawEvent = useCallback(
    (evt, idx) => {
      let priceVal = 0;
      if (!evt.isFreeEvent) {
        if (Array.isArray(evt.tickets) && evt.tickets.length > 0) {
          const validPrices = evt.tickets
            .map((t) => Number(t.price))
            .filter((p) => !isNaN(p) && p >= 0);
          priceVal = validPrices.length > 0 ? Math.min(...validPrices) : 0;
        } else if (evt.price !== undefined) {
          priceVal = Number(evt.price) || 0;
        }
      }

      const rawPoster = Array.isArray(evt.posterImage) ? evt.posterImage[0] : evt.posterImage;
      const fullUrl = rawPoster ? getFullImageUrl(rawPoster) : null;
      const safeImg = fullUrl && !fullUrl.includes("sidebar-logo.svg")
        ? fullUrl
        : FALLBACK_POSTERS[idx % FALLBACK_POSTERS.length];

      const title = (language === "mn" && evt.eventTitle_thi)
        ? evt.eventTitle_thi
        : (evt.eventTitle || "Untitled Event");

      const venue = evt.venueName || evt.venueAddress?.address || evt.venueAddress?.city || (language === "mn" ? "Улаанбаатар" : "Ulaanbaatar");
      const dateText = formatEventDateText(evt.startDate, evt.startTime, language);

      const coords = evt.venueAddress?.coordinates;
      const lng = Array.isArray(coords) && !isNaN(coords[0]) ? Number(coords[0]) : 106.9176;
      const lat = Array.isArray(coords) && !isNaN(coords[1]) ? Number(coords[1]) : 47.9186;
      const km = calcDistanceKm(47.9186, 106.9176, lat, lng);

      const catObj = evt.eventCategory || evt.category || evt.categoryId;
      const catId = catObj?._id ? String(catObj._id) : "";
      const catKey = (catObj?.name || "").toLowerCase();
      const catName = language === "mn" && catObj?.name_thi ? catObj.name_thi : (catObj?.name || "");
      const dateStr = evt.startDate ? evt.startDate.split("T")[0] : "";

      return {
        id: evt._id,
        _id: evt._id,
        title,
        dateText,
        venue,
        priceText: priceVal > 0 ? `₮${priceVal.toLocaleString()}` : t("freePrice"),
        priceNum: priceVal,
        image: safeImg,
        catId,
        catKey,
        catName,
        km,
        time: evt.startTime || "19:00",
        date: dateStr,
        lat,
        lng,
        promo: Boolean(evt.isFeatured || evt.fetcherEvent),
        href: `/eventDetails?id=${evt._id}`,
        raw: evt,
      };
    },
    [language, t]
  );

  // Construct query parameters for the backend API
  const buildFilterParams = useCallback(
    (page = 1) => {
      const params = {
        page,
        limit: PAGE_SIZE,
        status: "Live,Upcoming",
      };

      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }

      if (resolvedCategoryId) {
        params.categoryId = resolvedCategoryId;
      }

      if (selectedDateKey === "today") {
        params.filter = "today";
      } else if (selectedDateKey === "tomorrow") {
        params.filter = "tomorrow";
      } else if (selectedDateKey === "weekend") {
        params.filter = "thisweekend";
      } else if (selectedDateKey === "week") {
        params.filter = "thisweek";
      } else if (selectedDateKey === "custom") {
        if (customDateFrom) params.fromDate = customDateFrom;
        if (customDateTo) params.toDate = customDateTo;
      }

      if (appliedFilters.tod && appliedFilters.tod !== "any") {
        params.timeOfDay = appliedFilters.tod;
      }

      if (appliedFilters.dist && appliedFilters.dist !== "any") {
        params.latitude = 47.9186;
        params.longitude = 106.9176;
        params.radius = appliedFilters.dist;
      }

      return params;
    },
    [
      debouncedSearchQuery,
      resolvedCategoryId,
      selectedDateKey,
      customDateFrom,
      customDateTo,
      appliedFilters.tod,
      appliedFilters.dist,
    ]
  );

  const [isLoading, setIsLoading] = useState(true);

  // Fetch page 1 whenever filters, search, or language change
  useEffect(() => {
    let isCancelled = false;

    const fetchFirstPage = async () => {
      setIsLoading(true);
      try {
        const params = buildFilterParams(1);
        const res = await eventApi.getEvents(params);
        if (isCancelled) return;
        const data = res?.data?.data || res?.data || res;
        const eventsList = data?.events || [];
        const total = typeof data?.total === "number" ? data.total : eventsList.length;
        const mapped = eventsList.map((evt, idx) => mapRawEvent(evt, idx));
        setBackendEvents(mapped);
        setTotalCount(total);
        setCurrentPage(1);
      } catch (err) {
        if (!isCancelled) {
          console.error("Error fetching events:", err);
          setBackendEvents([]);
          setTotalCount(0);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchFirstPage();

    return () => {
      isCancelled = true;
    };
  }, [buildFilterParams, mapRawEvent]);

  // Load next page of events from backend
  const handleLoadMore = async () => {
    if (isLoadingMore || backendEvents.length >= totalCount) return;
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    try {
      const params = buildFilterParams(nextPage);
      const res = await eventApi.getEvents(params);
      const data = res?.data?.data || res?.data || res;
      const eventsList = data?.events || [];
      const total = typeof data?.total === "number" ? data.total : totalCount;
      const mapped = eventsList.map((evt, idx) => mapRawEvent(evt, backendEvents.length + idx));
      setBackendEvents((prev) => [...prev, ...mapped]);
      setTotalCount(total);
      setCurrentPage(nextPage);
    } catch (err) {
      console.error("Error loading more events:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Close filter sheet when clicking outside on desktop
  useEffect(() => {
    const handleDocClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        if (window.innerWidth >= 768) {
          setFilterSheetOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  // Toggle favorite with backend wishlist API
  const toggleFavorite = async (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const id = item.id || item._id;
    const isFav = favs.includes(id) || favs.includes(item.title);

    setFavs((prev) => {
      const next = isFav
        ? prev.filter((t) => t !== id && t !== item.title)
        : [...prev, id];
      try {
        localStorage.setItem("bondy_favorites", JSON.stringify(next));
      } catch (err) { }
      return next;
    });

    try {
      if (isFav) {
        await wishlistApi.removeFromWishlist({ entityId: id });
      } else {
        await wishlistApi.addToWishlist({ entityId: id, entityModel: "Event" });
      }
    } catch (err) { }
  };

  // Dynamic events from backend (nothing static when backend is used)
  const allEvents = useMemo(() => {
    return backendEvents;
  }, [backendEvents]);

  // Date filtering logic
  const passesDateFilter = (item) => {
    if (selectedDateKey === "all") return true;

    if (selectedDateKey === "custom") {
      if (!customDateFrom || !customDateTo) return true;
      return item.date >= customDateFrom && item.date <= customDateTo;
    }

    if (!item.date) return false;
    const itemDate = new Date(item.date);
    if (isNaN(itemDate.getTime())) return true;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const tom = new Date(now);
    tom.setDate(tom.getDate() + 1);
    const tomStr = tom.toISOString().split("T")[0];

    if (selectedDateKey === "today") {
      return item.date === todayStr;
    }
    if (selectedDateKey === "tomorrow") {
      return item.date === tomStr;
    }
    if (selectedDateKey === "weekend") {
      const day = itemDate.getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    }
    if (selectedDateKey === "week") {
      const in7Days = new Date(now);
      in7Days.setDate(in7Days.getDate() + 7);
      const in7DaysStr = in7Days.toISOString().split("T")[0];
      return item.date >= todayStr && item.date <= in7DaysStr;
    }

    return true;
  };

  // Time of Day filter
  const passesTodFilter = (item) => {
    const tod = appliedFilters.tod;
    if (!tod || tod === "any") return true;
    if (!item.time) return true;
    const hour = parseInt(item.time.split(":")[0], 10);
    if (isNaN(hour)) return true;

    if (tod === "morning") return hour >= 6 && hour < 12;
    if (tod === "afternoon") return hour >= 12 && hour < 17;
    if (tod === "evening") return hour >= 17 && hour < 21;
    if (tod === "night") return hour >= 21 || hour < 6;
    return true;
  };

  // Distance filter
  const passesDistFilter = (item) => {
    const dist = appliedFilters.dist;
    if (!dist || dist === "any") return true;
    const maxKm = parseInt(dist, 10);
    if (isNaN(maxKm) || !item.km) return true;
    return item.km <= maxKm;
  };

  // Search query filter
  const passesQuery = (item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const hay = `${item.title} ${item.venue} ${item.catKey || ""} ${item.dateText}`.toLowerCase();
    return q.split(/\s+/).every((token) => hay.includes(token));
  };

  // Category filter
  const passesCategory = (item) => {
    if (selectedCategoryKey === "all") return true;
    if (item.catId === selectedCategoryKey) return true;
    if (item.catKey === selectedCategoryKey.toLowerCase()) return true;
    if (item.catName && item.catName.toLowerCase() === selectedCategoryKey.toLowerCase()) return true;
    return false;
  };

  // Filtered & Sorted events
  const filteredEvents = useMemo(() => {
    let result = allEvents.filter(
      (item) =>
        passesQuery(item) &&
        passesCategory(item) &&
        passesDateFilter(item) &&
        passesTodFilter(item) &&
        passesDistFilter(item)
    );

    const activeSort = appliedFilters.sort || sortOption;

    if (activeSort === "date" || activeSort === "soonest") {
      result.sort((a, b) => {
        const da = a.date + (a.time || "00:00");
        const db = b.date + (b.time || "00:00");
        return da.localeCompare(db);
      });
    } else if (activeSort === "price") {
      result.sort((a, b) => a.priceNum - b.priceNum);
    } else if (activeSort === "nearest") {
      result.sort((a, b) => (a.km || 99) - (b.km || 99));
    } else if (activeSort === "new") {
      result = [...result].reverse();
    }

    return result;
  }, [
    allEvents,
    searchQuery,
    selectedCategoryKey,
    selectedDateKey,
    customDateFrom,
    customDateTo,
    appliedFilters,
    sortOption,
  ]);

  // Visible events in grid (all server-loaded events)
  const visibleEvents = useMemo(() => {
    return filteredEvents;
  }, [filteredEvents]);

  // Calculate active filter count for badge
  const activeAdvCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.tod !== "any") count++;
    if (appliedFilters.dist !== "any") count++;
    if (appliedFilters.sort && appliedFilters.sort !== "recommended") count++;
    return count;
  }, [appliedFilters]);

  // Apply draft filters
  const handleApplyFilters = () => {
    setAppliedFilters({
      sort: draftSort === "recommended" ? null : draftSort,
      tod: draftTod,
      dist: draftDist,
    });
    setFilterSheetOpen(false);
  };

  // Clear draft in sheet
  const handleClearDraft = () => {
    setDraftSort("recommended");
    setDraftTod("any");
    setDraftDist("any");
  };

  // Clear all applied filters from active chip bar
  const handleClearAllFilters = () => {
    setAppliedFilters({
      sort: null,
      tod: "any",
      dist: "any",
    });
    setDraftSort("recommended");
    setDraftTod("any");
    setDraftDist("any");
  };

  // Reset entire search, category, and date state
  const handleResetEverything = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setSelectedCategoryKey("all");
    setSelectedDateKey("all");
    setCustomDateFrom("");
    setCustomDateTo("");
    setCustomDateLabel("");
    setShowDatePickerModal(false);
    setSortOption("recommended");
    handleClearAllFilters();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    resetPagination();
  };

  const getSortLabel = (key) => {
    switch (key) {
      case "recommended": return t("recommendedSort");
      case "date": return t("byDateSort");
      case "soonest": return t("soonestSort");
      case "price": return t("priceAscSort");
      case "nearest": return t("nearestSort");
      case "new": return t("newlyAddedSort");
      default: return t("recommendedSort");
    }
  };

  const getTodLabel = (key) => {
    switch (key) {
      case "any": return t("anyTime");
      case "morning": return t("morning");
      case "afternoon": return t("afternoon");
      case "evening": return t("evening");
      case "night": return t("night");
      default: return t("anyTime");
    }
  };

  return (
    <div style={{ width: "100%", background: "var(--bd-ink-900)", minHeight: "100vh", overflowX: "hidden" }}>
      <Header />

      <main
        id="top"
        data-screen-label="Events listing"
        style={{
          maxWidth: "1224px",
          margin: "0 auto",
          padding: "clamp(18px, 2vw, 26px) clamp(20px, 4vw, 32px) clamp(56px, 5vw, 80px)",
        }}
      >
        {/* 1. SEARCH FORM BAR */}
        <form onSubmit={handleSearchSubmit} className="el-sform">
          <label>
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--acc-bright)", flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                resetPagination();
              }}
              placeholder={t("exploreSearchPlaceholder")}
            />
          </label>
          <span className="el-searchbtn">
            <button type="submit">{t("exploreSearchBtn")}</button>
          </span>
        </form>

        {/* 2. DATE FILTER CHIPS ROW */}
        <div className="bd-scroll bd-chiprow" style={{ marginTop: "16px", position: "relative" }}>
          {DATE_CHIP_KEYS.map((item) => {
            const isCustom = item.key === "custom";
            const isActive = selectedDateKey === item.key;
            const chipLabel = isCustom && customDateLabel && isActive ? customDateLabel : t(item.labelKey);

            return (
              <button
                key={item.key}
                ref={isCustom ? customChipRef : null}
                type="button"
                className={`bd-chip ${isActive ? "active" : ""}`}
                onClick={() => {
                  if (isCustom) {
                    setShowDatePickerModal((prev) => !prev);
                  } else {
                    setSelectedDateKey(item.key);
                    setCustomDateFrom("");
                    setCustomDateTo("");
                    setCustomDateLabel("");
                    setShowDatePickerModal(false);
                  }
                  resetPagination();
                }}
              >
                {chipLabel}
              </button>
            );
          })}

          {showDatePickerModal && (
            <DateRangeCalendarPopover
              anchorRef={customChipRef}
              initialFrom={customDateFrom}
              initialTo={customDateTo}
              language={language}
              t={t}
              onApply={(isoA, isoB, label) => {
                setCustomDateFrom(isoA);
                setCustomDateTo(isoB);
                setCustomDateLabel(label);
                setSelectedDateKey("custom");
                setShowDatePickerModal(false);
                resetPagination();
              }}
              onCancel={() => {
                setShowDatePickerModal(false);
              }}
            />
          )}
        </div>

        {/* 3. SEGMENTED CONTROL: [ Events (Active) | Courses ] */}
        <div className="bd-seg">
          <button type="button" className="bd-seg-btn active" data-en="Events">
            {t("eventsTab")}
          </button>
          <Link href="/Programs-Listing" className="bd-seg-btn" data-en="Courses">
            {t("coursesTab")}
          </Link>
        </div>

        {/* 4. CATEGORY CHIP ROW */}
        <div className="bd-scroll bd-chiprow el-cats" style={{ marginTop: "20px" }}>
          <button
            type="button"
            className={`bd-chip ${selectedCategoryKey === "all" ? "active" : ""}`}
            style={{
              height: "36px",
              padding: "0 16px",
              fontSize: "14px",
            }}
            onClick={() => {
              setSelectedCategoryKey("all");
              resetPagination();
            }}
          >
            {t("allCategories")}
          </button>
          {dynamicCategories.map((cat) => {
            const isActive = selectedCategoryKey === cat.key || selectedCategoryKey === cat.slug;
            return (
              <button
                key={cat.key}
                type="button"
                className={`bd-chip ${isActive ? "active" : ""}`}
                style={{
                  height: "36px",
                  padding: "0 16px",
                  fontSize: "14px",
                }}
                onClick={() => {
                  setSelectedCategoryKey(cat.key);
                  resetPagination();
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 5. CONTROL ROW (Filters, Sort dropdown, Grid/Map toggle) */}
        <div className="el-ctrlrow" ref={filterRef}>
          {/* Left: Filter button + popover */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                setDraftSort(appliedFilters.sort || "recommended");
                setDraftTod(appliedFilters.tod);
                setDraftDist(appliedFilters.dist);
                setFilterSheetOpen((prev) => !prev);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "9px",
                height: "42px",
                padding: "0 16px",
                borderRadius: "12px",
                border: activeAdvCount > 0 || filterSheetOpen ? "1px solid var(--acc)" : "1px solid var(--bd-border)",
                background: "var(--bd-ink-850)",
                color: "var(--bd-white)",
                fontFamily: "var(--bd-font-ui)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "border-color 200ms var(--bd-ease)",
              }}
            >
              {t("filterBtn")}
              {activeAdvCount > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "20px",
                    height: "20px",
                    padding: "0 6px",
                    borderRadius: "999px",
                    background: "var(--acc)",
                    color: "var(--bd-white)",
                    fontSize: "11.5px",
                    fontWeight: 700,
                  }}
                >
                  {activeAdvCount}
                </span>
              )}
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  opacity: 0.6,
                  transform: filterSheetOpen ? "rotate(180deg)" : "none",
                  transition: "transform 200ms var(--bd-ease)",
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* Filter Sheet Modal / Popover */}
            {filterSheetOpen && (
              <div className="el-fs" data-open="1">
                <div className="el-fsheet" role="dialog" aria-modal="true" aria-label={t("filtersTitle")}>
                  <span className="el-fs-grip" onClick={() => setFilterSheetOpen(false)}></span>
                  <div className="el-fs-head">
                    <b>{t("filtersTitle")}</b>
                    <button
                      type="button"
                      className="el-fs-x"
                      onClick={() => setFilterSheetOpen(false)}
                      aria-label="Хаах"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M6.6 6.6l10.8 10.8M17.4 6.6L6.6 17.4" />
                      </svg>
                    </button>
                  </div>

                  <div className="el-fs-body">
                    {/* 1. Sort by */}
                    <section className="el-fs-sec">
                      <h3 className="el-fs-h">{t("sortSection")}</h3>
                      <div className="el-fs-tiles">
                        <button
                          type="button"
                          className={`el-tile ${draftSort === "recommended" ? "active" : ""}`}
                          onClick={() => setDraftSort("recommended")}
                        >
                          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.9l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z" />
                          </svg>
                          <span>{t("recommendedSort")}</span>
                        </button>
                        <button
                          type="button"
                          className={`el-tile ${draftSort === "soonest" ? "active" : ""}`}
                          onClick={() => setDraftSort("soonest")}
                        >
                          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <circle cx="12" cy="12" r="8.4" />
                            <path d="M12 7.6V12l3.2 1.9" />
                          </svg>
                          <span>{t("soonestSort")}</span>
                        </button>
                        <button
                          type="button"
                          className={`el-tile ${draftSort === "nearest" ? "active" : ""}`}
                          onClick={() => setDraftSort("nearest")}
                        >
                          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path d="M12 20.6c4-4.4 6.1-7.5 6.1-10.2a6.1 6.1 0 1 0-12.2 0c0 2.7 2.1 5.8 6.1 10.2Z" />
                            <circle cx="12" cy="10.2" r="2.3" />
                          </svg>
                          <span>{t("nearestSort")}</span>
                        </button>
                      </div>
                    </section>

                    {/* 2. Time of day */}
                    <section className="el-fs-sec">
                      <h3 className="el-fs-h">{t("timeOfDaySection")}</h3>
                      <div className="el-fs-opts">
                        {[
                          { key: "any", labelKey: "anyTime", icon: "clock" },
                          { key: "morning", labelKey: "morning", icon: "morning" },
                          { key: "afternoon", labelKey: "afternoon", icon: "day" },
                          { key: "evening", labelKey: "evening", icon: "evening" },
                          { key: "night", labelKey: "night", icon: "night" },
                        ].map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            className={`el-opt ${draftTod === item.key ? "active" : ""}`}
                            onClick={() => setDraftTod(item.key)}
                          >
                            {item.icon === "clock" && (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                                <circle cx="12" cy="12" r="8.4" />
                                <path d="M12 7.6V12l3.2 1.9" />
                              </svg>
                            )}
                            {item.icon === "morning" && (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                                <circle cx="12" cy="12" r="3.5" />
                                <path d="M12 4.3v1.7M12 18v1.7M4.3 12H6M18 12h1.7M6.6 6.6l1.2 1.2M16.2 16.2l1.2 1.2" />
                              </svg>
                            )}
                            {item.icon === "day" && (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                                <circle cx="12" cy="12" r="5" />
                                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" />
                              </svg>
                            )}
                            {item.icon === "evening" && (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                                <path d="M8.4 17.4a3.6 3.6 0 0 1 7.2 0M12 6v2.3M6.8 8.3l1.6 1.6M17.2 8.3l-1.6 1.6M3.8 17.4h2.4M17.8 17.4h2.4" />
                              </svg>
                            )}
                            {item.icon === "night" && (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                                <path d="M19.6 14.9A8.1 8.1 0 0 1 9.1 4.4a8.3 8.3 0 1 0 10.5 10.5Z" />
                              </svg>
                            )}
                            <span>{t(item.labelKey)}</span>
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* 3. Distance */}
                    <section className="el-fs-sec">
                      <h3 className="el-fs-h">{t("distanceSection")}</h3>
                      <div className="el-fs-opts">
                        {[
                          { key: "any", label: t("anyDistance") },
                          { key: "2", label: t("distanceKm", { km: 2 }) },
                          { key: "5", label: t("distanceKm", { km: 5 }) },
                          { key: "10", label: t("distanceKm", { km: 10 }) },
                          { key: "20", label: t("distanceKm", { km: 20 }) },
                        ].map((dist) => (
                          <button
                            key={dist.key}
                            type="button"
                            className={`el-opt ${draftDist === dist.key ? "active" : ""}`}
                            onClick={() => setDraftDist(dist.key)}
                          >
                            {dist.key === "any" && (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                                <circle cx="12" cy="12" r="3.1" />
                                <path d="M12 3.6v3.2M12 17.2v3.2M3.6 12h3.2M17.2 12h3.2" />
                              </svg>
                            )}
                            <span>{dist.label}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="el-fs-acts">
                    <button type="button" className="el-fs-clear" onClick={handleClearDraft}>
                      {t("clearFilters")}
                    </button>
                    <button type="button" className="el-fs-apply" onClick={handleApplyFilters}>
                      {t("applyFilters")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Grid/Map Toggle */}
          <div className="bd-ctrls">
            <div className="bd-view-toggle">
              <button
                type="button"
                className={`bd-view-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title={t("gridView")}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
                <span className="bd-vlab">{t("gridView")}</span>
              </button>
              <button
                type="button"
                className={`bd-view-btn ${viewMode === "map" ? "active" : ""}`}
                onClick={() => setViewMode("map")}
                title={t("mapView")}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                <span className="bd-vlab">{t("mapView")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6. ACTIVE FILTER BADGES ROW + RESULT COUNTER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            marginTop: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", minHeight: "32px" }}>
            {appliedFilters.tod !== "any" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  height: "32px",
                  padding: "0 6px 0 13px",
                  borderRadius: "999px",
                  background: "rgba(35,173,164,.14)",
                  border: "1px solid var(--acc)",
                  color: "var(--bd-white)",
                  fontSize: "13px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {getTodLabel(appliedFilters.tod)}
                <button
                  type="button"
                  onClick={() => setAppliedFilters((prev) => ({ ...prev, tod: "any" }))}
                  aria-label="Remove"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "20px",
                    height: "20px",
                    border: "none",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,.1)",
                    color: "var(--bd-white)",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "13px",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </span>
            )}

            {appliedFilters.dist !== "any" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  height: "32px",
                  padding: "0 6px 0 13px",
                  borderRadius: "999px",
                  background: "rgba(35,173,164,.14)",
                  border: "1px solid var(--acc)",
                  color: "var(--bd-white)",
                  fontSize: "13px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {t("upToDistance", { km: appliedFilters.dist })}
                <button
                  type="button"
                  onClick={() => setAppliedFilters((prev) => ({ ...prev, dist: "any" }))}
                  aria-label="Remove"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "20px",
                    height: "20px",
                    border: "none",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,.1)",
                    color: "var(--bd-white)",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "13px",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </span>
            )}

            {appliedFilters.sort && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  height: "32px",
                  padding: "0 6px 0 13px",
                  borderRadius: "999px",
                  background: "rgba(35,173,164,.14)",
                  border: "1px solid var(--acc)",
                  color: "var(--bd-white)",
                  fontSize: "13px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {getSortLabel(appliedFilters.sort)}
                <button
                  type="button"
                  onClick={() => setAppliedFilters((prev) => ({ ...prev, sort: null }))}
                  aria-label="Remove"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "20px",
                    height: "20px",
                    border: "none",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,.1)",
                    color: "var(--bd-white)",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "13px",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </span>
            )}

            {activeAdvCount > 0 && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                style={{
                  height: "32px",
                  padding: "0 10px",
                  border: "none",
                  background: "transparent",
                  color: "var(--bd-gray-500)",
                  fontFamily: "var(--bd-font-ui)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                {t("clearFilters")}
              </button>
            )}
          </div>

          <p style={{ margin: 0, fontSize: "14px", color: "var(--bd-gray-500)", whiteSpace: "nowrap" }}>
            <b style={{ color: "var(--bd-white)", fontWeight: 700 }}>{filteredEvents.length}</b> {t("resultsCount")}
          </p>
        </div>

        {/* 7. GRID VIEW */}
        {viewMode === "grid" && (
          <>
            {isLoading ? (
              <GridSkeleton />
            ) : filteredEvents.length > 0 ? (
              <div className="el-grid">
                {visibleEvents.map((evt) => {
                  const isFavorited = favs.includes(evt.id) || favs.includes(evt.title);
                  return (
                    <Link
                      href={evt.href}
                      key={evt.id}
                      className="el-c"
                      data-cat={evt.catKey}
                      data-km={evt.km}
                    >
                      {/* Image cover with dark gradient */}
                      <EventCardImage src={evt.image} fallback={FALLBACK_POSTERS[0]} />

                      {/* Promo badge */}
                      {evt.promo && <span className="el-c-promo">{t("featuredBadge")}</span>}

                      {/* Favorite Button */}
                      <button
                        type="button"
                        className={`el-c-fav ${isFavorited ? "active" : ""}`}
                        onClick={(e) => toggleFavorite(evt, e)}
                        aria-label="Favorite"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill={isFavorited ? "var(--acc-bright)" : "none"}
                          stroke={isFavorited ? "var(--acc-bright)" : "currentColor"}
                          strokeWidth="1.7"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20.2c-.3 0-.6-.1-.8-.3C7 16.5 4.4 14 4.4 10.7 4.4 8.1 6.4 6 8.9 6c1.3 0 2.4.5 3.1 1.4C12.7 6.5 13.8 6 15.1 6c2.5 0 4.5 2.1 4.5 4.7 0 3.3-2.6 5.8-6.8 9.2-.2.2-.5.3-.8.3Z" />
                        </svg>
                      </button>

                      {/* Card Bottom Meta */}
                      <span className="el-c-b">
                        <span className="el-c-t">{evt.title}</span>
                        <span className="el-c-m" data-sched-line>
                          {evt.dateText}
                        </span>
                        <span className="el-c-m">{evt.venue}</span>
                        <span className="el-c-p">{evt.priceText}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              /* EMPTY STATE */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "20px",
                  padding: "52px 24px",
                  borderRadius: "20px",
                  border: "1px dashed var(--bd-border-strong)",
                  textAlign: "center",
                }}
              >
                <b style={{ fontSize: "16px", fontWeight: 700, color: "var(--bd-white)" }}>
                  {t("noResultsFound")}
                </b>
                <span style={{ fontSize: "14px", color: "var(--bd-gray-500)" }}>
                  {t("noResultsSubtitle")}
                </span>
                <button
                  type="button"
                  onClick={handleResetEverything}
                  style={{
                    marginTop: "6px",
                    height: "40px",
                    padding: "0 20px",
                    borderRadius: "999px",
                    border: "1px solid var(--bd-border-strong)",
                    background: "transparent",
                    color: "var(--bd-white)",
                    fontFamily: "var(--bd-font-ui)",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t("resetAllFilters")}
                </button>
              </div>
            )}

            {/* LOAD MORE BUTTON */}
            {filteredEvents.length < totalCount && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "clamp(32px, 3.4vw, 44px)",
                }}
              >
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  style={{
                    height: "48px",
                    padding: "0 28px",
                    borderRadius: "999px",
                    border: "1px solid var(--bd-border-strong)",
                    background: "transparent",
                    color: "var(--bd-white)",
                    fontFamily: "var(--bd-font-ui)",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: isLoadingMore ? "not-allowed" : "pointer",
                    opacity: isLoadingMore ? 0.7 : 1,
                    transition: "border-color 200ms var(--bd-ease), background 200ms var(--bd-ease)",
                  }}
                >
                  {isLoadingMore ? "..." : t("showMore")}
                </button>
                <span style={{ fontSize: "13px", color: "var(--bd-gray-600)" }}>
                  {t("resultsOutOf", {
                    total: totalCount,
                    shown: filteredEvents.length,
                  })}
                </span>
              </div>
            )}
          </>
        )}

        {/* 8. MAP VIEW */}
        {viewMode === "map" && (
          <div className="bd-mapwrap" style={{ display: "grid" }}>
            {/* Left Column: Scrollable List of Result Rows */}
            <div className="bd-scroll bd-maplist">
              {filteredEvents.map((item) => {
                const isSelected = selectedMapId === item.id;
                return (
                  <Link
                    href={item.href}
                    key={item.id}
                    className={`bd-maprow ${isSelected ? "selected" : ""}`}
                    data-sel={isSelected ? "1" : "0"}
                    onMouseEnter={() => setSelectedMapId(item.id)}
                    onClick={(e) => {
                      setSelectedMapId(item.id);
                    }}
                  >
                    <MapRowThumb src={item.image} fallback={FALLBACK_POSTERS[0]} />
                    <span className="bd-mr-b">
                      <b>{item.title}</b>
                      <span>{item.dateText}</span>
                      <span>{item.venue}</span>
                      <span className="bd-mr-f">
                        <i>{item.priceText}</i>
                        {item.promo && <em>{t("featuredBadge")}</em>}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Right Column: Sticky Interactive Google Map */}
            <InteractiveMapStage
              items={filteredEvents}
              selectedId={selectedMapId}
              onSelectItem={setSelectedMapId}
              cityLabel={t("cityUlaanbaatar")}
              zoomInLabel={t("zoomIn")}
              zoomOutLabel={t("zoomOut")}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bd-ink-900)" }} />}>
      <ExploreContent />
    </Suspense>
  );
}
