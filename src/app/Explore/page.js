"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import categoryApi from "@/api/categoryApi";
import eventApi from "@/api/eventApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";
import DateRangeCalendarPopover from "../../components/DateRangeCalendarPopover";

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

const DEFAULT_CATEGORY_KEYS = [
  { key: "all", labelKey: "allCategories" },
  { key: "music", labelKey: "musicCategory" },
  { key: "concerts", labelKey: "concertsCategory" },
  { key: "sports", labelKey: "sportsCategory" },
  { key: "conference", labelKey: "conferenceCategory" },
  { key: "family", labelKey: "familyCategory" },
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

  // Batch / pagination
  const [batch, setBatch] = useState(1);

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
    } catch (e) {}
  }, [searchParams]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryApi.getCategories({ limit: 100 });
        const cats = res?.data?.categories || [];
        if (cats.length > 0) {
          const list = cats.map((c) => ({
            key: c._id || c.name,
            label: language === "mn" && c.name_thi ? c.name_thi : c.name,
          }));
          setDynamicCategories(list);
        }
      } catch (err) {}
    };
    fetchCats();
  }, [language]);

  // Fetch real backend events
  useEffect(() => {
    const fetchBackendEvents = async () => {
      try {
        const res = await eventApi.getEvents({
          limit: 30,
          status: "Live,Upcoming",
        });
        const data = res?.data?.data || res?.data || res;
        if (data?.events && data.events.length > 0) {
          const mapped = data.events.map((evt, idx) => {
            const hasPrice = evt.ticketTypes?.[0]?.price || evt.price;
            const priceVal = Number(hasPrice || 0);
            const rawPoster = evt.posterImage?.[0];
            const fullUrl = rawPoster ? getFullImageUrl(rawPoster) : null;
            const safeImg = fullUrl && !fullUrl.includes("sidebar-logo.svg")
              ? fullUrl
              : FALLBACK_POSTERS[idx % FALLBACK_POSTERS.length];

            const title = (language === "mn" && evt.eventTitle_thi)
              ? evt.eventTitle_thi
              : (evt.eventTitle || "Untitled Event");
            const venue = evt.venueAddress?.city || evt.venueName || (language === "mn" ? "Улаанбаатар" : "Ulaanbaatar");
            const dateText = evt.startDate
              ? new Date(evt.startDate).toLocaleDateString(language === "mn" ? "mn-MN" : "en-US", {
                  month: "numeric",
                  day: "numeric",
                }) + (evt.startTime ? ` · ${evt.startTime}` : "")
              : (language === "mn" ? "Тун удахгүй" : "Coming Soon");

            return {
              id: evt._id || `backend-${idx}`,
              title,
              dateText,
              venue,
              priceText: priceVal > 0 ? `₮${priceVal.toLocaleString()}` : t("freePrice"),
              priceNum: priceVal,
              image: safeImg,
              catKey: evt.categoryId?.name?.toLowerCase() || "music",
              catName: language === "mn" && evt.categoryId?.name_thi ? evt.categoryId.name_thi : evt.categoryId?.name,
              km: 2.5,
              time: evt.startTime || "19:00",
              date: evt.startDate ? evt.startDate.split("T")[0] : "2026-09-05",
              lat: parseFloat(evt.latitude) || 47.9186,
              lng: parseFloat(evt.longitude) || 106.9176,
              promo: Boolean(evt.isFeatured || evt.fetcherEvent),
              href: `/eventDetails?id=${evt._id}`,
            };
          });
          setBackendEvents(mapped);
        }
      } catch (err) {}
    };
    fetchBackendEvents();
  }, [language, t]);

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

  // Toggle favorite
  const toggleFavorite = (title, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFavs((prev) => {
      const next = prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title];
      try {
        localStorage.setItem("bondy_favorites", JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  // Combine backend events with prototype fixture events
  const allEvents = useMemo(() => {
    const fixtures = PROTOTYPE_EVENTS.map((f) => ({
      ...f,
      title: language === "mn" ? f.title_mn : f.title_en,
      venue: language === "mn" ? f.venue_mn : f.venue_en,
      dateText: language === "mn" ? f.dateText_mn : f.dateText_en,
      priceText: f.priceNum === 0 ? t("freePrice") : `₮${f.priceNum.toLocaleString()}`,
    }));

    if (backendEvents.length > 0) {
      const backendTitles = new Set(backendEvents.map((e) => e.title.toLowerCase()));
      const remainingFixtures = fixtures.filter(
        (f) => !backendTitles.has(f.title.toLowerCase())
      );
      return [...backendEvents, ...remainingFixtures];
    }
    return fixtures;
  }, [backendEvents, language, t]);

  // Date filtering logic
  const passesDateFilter = (item) => {
    if (selectedDateKey === "all") return true;

    if (selectedDateKey === "custom") {
      if (!customDateFrom || !customDateTo) return true;
      return item.date >= customDateFrom && item.date <= customDateTo;
    }

    if (selectedDateKey === "today") {
      return item.date === "2026-09-05" || item.dateText.includes("Өнөөдөр") || item.dateText.includes("Today");
    }
    if (selectedDateKey === "tomorrow") {
      return item.date === "2026-09-06" || item.dateText.includes("Маргааш") || item.dateText.includes("Tomorrow");
    }
    if (selectedDateKey === "weekend") {
      return (
        item.date === "2026-09-05" ||
        item.date === "2026-09-06" ||
        item.dateText.includes("Бя") ||
        item.dateText.includes("Ня") ||
        item.dateText.includes("Sat") ||
        item.dateText.includes("Sun")
      );
    }
    if (selectedDateKey === "week") {
      return item.date >= "2026-09-05" && item.date <= "2026-09-12";
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

    if (tod === "morning") return hour < 12;
    if (tod === "afternoon") return hour >= 12 && hour < 17;
    if (tod === "evening") return hour >= 17 && hour < 21;
    if (tod === "night") return hour >= 21 || hour < 5;
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
    if (item.catKey === selectedCategoryKey) return true;
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

  // Pagination for grid: batch 1 = 12 items, batch 2 = all
  const visibleEvents = useMemo(() => {
    if (batch === 1) return filteredEvents.slice(0, 12);
    return filteredEvents;
  }, [filteredEvents, batch]);

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
    setBatch(1);
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
    setBatch(1);
  };

  // Reset entire search, category, and date state
  const handleResetEverything = () => {
    setSearchQuery("");
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
    setBatch(1);
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
                setBatch(1);
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
                  setBatch(1);
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
                setBatch(1);
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
          {DEFAULT_CATEGORY_KEYS.map((cat) => {
            const isActive = selectedCategoryKey === cat.key;
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
                  setBatch(1);
                }}
              >
                {t(cat.labelKey)}
              </button>
            );
          })}
          {dynamicCategories.map((dyn) => {
            const isActive = selectedCategoryKey === dyn.key;
            return (
              <button
                key={dyn.key}
                type="button"
                className={`bd-chip ${isActive ? "active" : ""}`}
                style={{
                  height: "36px",
                  padding: "0 16px",
                  fontSize: "14px",
                }}
                onClick={() => {
                  setSelectedCategoryKey(dyn.key);
                  setBatch(1);
                }}
              >
                {dyn.label}
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
            {filteredEvents.length > 0 ? (
              <div className="el-grid">
                {visibleEvents.map((evt) => {
                  const isFavorited = favs.includes(evt.title);
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
                        onClick={(e) => toggleFavorite(evt.title, e)}
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
            {filteredEvents.length > 12 && batch === 1 && (
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
                  onClick={() => setBatch(2)}
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
                    cursor: "pointer",
                    transition: "border-color 200ms var(--bd-ease), background 200ms var(--bd-ease)",
                  }}
                >
                  {t("showMore")}
                </button>
                <span style={{ fontSize: "13px", color: "var(--bd-gray-600)" }}>
                  {t("resultsOutOf", { total: filteredEvents.length, shown: visibleEvents.length })}
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

            {/* Right Column: Sticky Interactive Ulaanbaatar Map */}
            <div className="bd-mapstage">
              <div className="bd-map-surface">
                {/* Background Map Grid & Features */}
                <div
                  className="bd-map-plate"
                  style={{
                    transform: `scale(${mapZoom})`,
                    transformOrigin: "center center",
                    transition: "transform 240ms var(--bd-ease)",
                  }}
                >
                  {/* Tuul River Simulation */}
                  <div className="bd-map-river" />
                  {/* National Park Green Area */}
                  <div
                    className="bd-map-park"
                    style={{ left: "42%", top: "45%", width: "160px", height: "110px" }}
                  />
                  {/* Bogd Khan Mountain Slope */}
                  <div
                    className="bd-map-park"
                    style={{ left: "20%", top: "68%", width: "260px", height: "130px", opacity: 0.8 }}
                  />
                  <div className="bd-map-glow" />

                  {/* Pin Markers */}
                  <div className="bd-map-pins">
                    {filteredEvents.map((evt) => {
                      const dLat = (evt.lat || 47.918) - 47.918;
                      const dLng = (evt.lng || 106.918) - 106.918;
                      const posX = Math.max(10, Math.min(90, 50 + dLng * 450));
                      const posY = Math.max(12, Math.min(88, 50 - dLat * 600));

                      const isSel = selectedMapId === evt.id;

                      return (
                        <button
                          key={evt.id}
                          type="button"
                          className={`bd-map-pin ${isSel ? "active" : ""}`}
                          style={{
                            left: `${posX}%`,
                            top: `${posY}%`,
                            zIndex: isSel ? 12 : 5,
                          }}
                          onClick={() => setSelectedMapId(evt.id)}
                          onMouseEnter={() => setSelectedMapId(evt.id)}
                        >
                          <span>{evt.priceText}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Map Stamp */}
                <div className="bd-map-stamp">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{t("cityUlaanbaatar")}</span>
                </div>

                {/* Zoom Controls */}
                <div className="bd-map-zoom">
                  <button
                    type="button"
                    onClick={() => setMapZoom((prev) => Math.min(prev + 0.25, 2.2))}
                    title={t("zoomIn")}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapZoom((prev) => Math.max(prev - 0.25, 0.75))}
                    title={t("zoomOut")}
                  >
                    −
                  </button>
                </div>

                {/* Selected Event Floating Preview Card */}
                {selectedMapId && (
                  (() => {
                    const selEvt = filteredEvents.find((e) => e.id === selectedMapId);
                    if (!selEvt) return null;
                    return (
                      <Link href={selEvt.href} className="bd-map-preview">
                        <span
                          className="thumb"
                          style={{ backgroundImage: `url(${selEvt.image})` }}
                        />
                        <span className="body">
                          <b>{selEvt.title}</b>
                          <span>{selEvt.dateText}</span>
                          <span>{selEvt.venue}</span>
                          <i>{selEvt.priceText}</i>
                        </span>
                        <button
                          type="button"
                          className="close-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedMapId(null);
                          }}
                        >
                          ×
                        </button>
                      </Link>
                    );
                  })()
                )}
              </div>
            </div>
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
