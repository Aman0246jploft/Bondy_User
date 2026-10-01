"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

// Static fallback items from prototype
const HERO_SLIDES = [
  {
    id: "hero-1",
    kick: "9-р сарын 19, Бямба · 18:00",
    kickEn: "Sep 19, Sat · 18:00",
    title: "Гоби Фолк Фест 2026",
    titleEn: "Gobi Folk Fest 2026",
    venue: "Үндэсний соёл амралтын хүрээлэн",
    venueEn: "National Amusement Park",
    price: "₮65,000-с",
    image: "/assets/img/0beaec5298178d0b.jpg",
    link: "/Explore",
  },
  {
    id: "hero-2",
    kick: "9-р сарын 5, Бямба · 19:00",
    kickEn: "Sep 5, Sat · 19:00",
    title: "Морин хуурын гала тоглолт",
    titleEn: "Morin Khuur Gala Concert",
    venue: "Улсын драмын театр",
    venueEn: "State Drama Theatre",
    price: "₮25,000-с",
    image: "/assets/img/95915dd284f4c106.jpg",
    link: "/Explore",
  },
  {
    id: "hero-3",
    kick: "9-р сарын 5, Бямба · 12:00",
    kickEn: "Sep 5, Sat · 12:00",
    title: "Хотын амт — хүнсний фестиваль",
    titleEn: "City Taste Food Festival",
    venue: "Хүннү молл, гадна талбай",
    venueEn: "Hunnu Mall Outdoor Plaza",
    price: "₮15,000-с",
    image: "/assets/img/702844b5b1ca71e6.jpg",
    link: "/Explore",
  },
  {
    id: "hero-4",
    kick: "9-р сарын 26, Бямба · 21:30",
    kickEn: "Sep 26, Sat · 21:30",
    title: "UB Cypher: Хип-хоп шөнө",
    titleEn: "UB Cypher: Hip-Hop Night",
    venue: "UB Sound Lab",
    venueEn: "UB Sound Lab",
    price: "₮30,000-с",
    image: "/assets/img/3453c0265d41ec3c.jpg",
    link: "/Explore",
  },
  {
    id: "hero-5",
    kick: "9-р сарын 30, Лхагва · 19:00",
    kickEn: "Sep 30, Wed · 19:00",
    title: "Филармонийн классик орой",
    titleEn: "Philharmonic Classical Evening",
    venue: "Улсын филармони",
    venueEn: "State Philharmonic Hall",
    price: "₮38,000-с",
    image: "/assets/img/195b819a97b60a5c.png",
    link: "/Explore",
  },
];

const RECOMMENDED_EVENTS = [
  {
    id: "rec-1",
    title: "Гоби Фолк Фест 2026",
    titleEn: "Gobi Folk Fest 2026",
    date: "9-р сарын 19, Бя · 18:00",
    dateEn: "Sep 19, Sat · 18:00",
    venue: "Үндэсний соёл амралтын хүрээлэн",
    venueEn: "National Amusement Park",
    price: "₮65,000",
    badge: "Онцлох",
    badgeType: "promo",
    image: "/assets/img/0beaec5298178d0b.jpg",
  },
  {
    id: "rec-2",
    title: "AI шөнө: бүтээгчдийн уулзалт",
    titleEn: "AI Night: Creator Meetup",
    date: "9-р сарын 24, Пү · 19:00",
    dateEn: "Sep 24, Thu · 19:00",
    venue: "Shangri-La Center, Хан-Уул",
    venueEn: "Shangri-La Center, Khan-Uul",
    price: "₮35,000",
    badge: "Онцлох",
    badgeType: "promo",
    image: "/assets/img/42310e9cf7a28d06.jpg",
  },
  {
    id: "rec-3",
    title: "Морин хуурын гала тоглолт",
    titleEn: "Morin Khuur Gala Concert",
    date: "9-р сарын 5, Бя · 19:00",
    dateEn: "Sep 5, Sat · 19:00",
    venue: "Улсын драмын театр",
    venueEn: "State Drama Theatre",
    price: "₮25,000",
    badge: null,
    image: "/assets/img/95915dd284f4c106.jpg",
  },
  {
    id: "rec-4",
    title: "Sofar UB: Акустик сешн",
    titleEn: "Sofar UB: Acoustic Session",
    date: "9-р сарын 5, Бя · 21:00",
    dateEn: "Sep 5, Sat · 21:00",
    venue: "Blue Sky Lounge",
    venueEn: "Blue Sky Lounge",
    price: "₮32,000",
    badge: "Цөөн үлдсэн",
    badgeType: "low",
    image: "/assets/img/8e94a2fe5d7c034d.jpg",
  },
  {
    id: "rec-5",
    title: "Хотын амт — хүнсний фестиваль",
    titleEn: "City Taste Food Festival",
    date: "9-р сарын 5, Бя · 12:00",
    dateEn: "Sep 5, Sat · 12:00",
    venue: "Хүннү молл, гадна талбай",
    venueEn: "Hunnu Mall Outdoor Plaza",
    price: "₮15,000",
    badge: null,
    image: "/assets/img/702844b5b1ca71e6.jpg",
  },
  {
    id: "rec-6",
    title: "Улаанбаатар өглөөний гүйлт",
    titleEn: "Ulaanbaatar Morning Run",
    date: "9-р сарын 6, Ня · 07:00",
    dateEn: "Sep 6, Sun · 07:00",
    venue: "Сүхбаатарын талбай",
    venueEn: "Sukhbaatar Square",
    price: "₮40,000",
    badge: null,
    image: "/assets/img/f0ec48407c3c84f6.png",
  },
  {
    id: "rec-7",
    title: "Гэр бүлийн зуны наадам",
    titleEn: "Family Summer Festival",
    date: "9-р сарын 6, Ня · 11:00",
    dateEn: "Sep 6, Sun · 11:00",
    venue: "Соёл амралтын хүрээлэн",
    venueEn: "Amusement Park",
    price: "Үнэгүй",
    badge: null,
    image: "/assets/img/07c6c6c75b998fb6.jpg",
  },
  {
    id: "rec-8",
    title: "Nomad Beats: DJ сешн",
    titleEn: "Nomad Beats: DJ Session",
    date: "9-р сарын 6, Ня · 22:00",
    dateEn: "Sep 6, Sun · 22:00",
    venue: "UB Sound Lab",
    venueEn: "UB Sound Lab",
    price: "₮28,000",
    badge: "Онцлох",
    badgeType: "promo",
    image: "/assets/img/dd5548cce6edebaa.jpg",
  },
];

const WEEKEND_EVENTS = [
  {
    id: "wk-1",
    title: "Хотын амт — хүнсний фестиваль",
    titleEn: "City Taste Food Festival",
    date: "9-р сарын 5, Бя · 12:00",
    dateEn: "Sep 5, Sat · 12:00",
    venue: "Хүннү молл, гадна талбай",
    venueEn: "Hunnu Mall Outdoor Plaza",
    price: "₮15,000",
    badge: "Онцлох",
    badgeType: "promo",
    image: "/assets/img/702844b5b1ca71e6.jpg",
  },
  {
    id: "wk-2",
    title: "Nomad Beats: DJ сешн",
    titleEn: "Nomad Beats: DJ Session",
    date: "9-р сарын 6, Ня · 22:00",
    dateEn: "Sep 6, Sun · 22:00",
    venue: "UB Sound Lab",
    venueEn: "UB Sound Lab",
    price: "₮28,000",
    badge: "Онцлох",
    badgeType: "promo",
    image: "/assets/img/dd5548cce6edebaa.jpg",
  },
  {
    id: "wk-3",
    title: "Морин хуурын гала тоглолт",
    titleEn: "Morin Khuur Gala Concert",
    date: "9-р сарын 5, Бя · 19:00",
    dateEn: "Sep 5, Sat · 19:00",
    venue: "Улсын драмын театр",
    venueEn: "State Drama Theatre",
    price: "₮25,000",
    badge: null,
    image: "/assets/img/95915dd284f4c106.jpg",
  },
  {
    id: "wk-4",
    title: "Sofar UB: Акустик сешн",
    titleEn: "Sofar UB: Acoustic Session",
    date: "9-р сарын 5, Бя · 21:00",
    dateEn: "Sep 5, Sat · 21:00",
    venue: "Blue Sky Lounge",
    venueEn: "Blue Sky Lounge",
    price: "₮32,000",
    badge: "Цөөн үлдсэн",
    badgeType: "low",
    image: "/assets/img/8e94a2fe5d7c034d.jpg",
  },
  {
    id: "wk-5",
    title: "Улаанбаатар өглөөний гүйлт",
    titleEn: "Ulaanbaatar Morning Run",
    date: "9-р сарын 6, Ня · 07:00",
    dateEn: "Sep 6, Sun · 07:00",
    venue: "Сүхбаатарын талбай",
    venueEn: "Sukhbaatar Square",
    price: "₮40,000",
    badge: null,
    image: "/assets/img/f0ec48407c3c84f6.png",
  },
  {
    id: "wk-6",
    title: "Гэр бүлийн зуны наадам",
    titleEn: "Family Summer Festival",
    date: "9-р сарын 6, Ня · 11:00",
    dateEn: "Sep 6, Sun · 11:00",
    venue: "Соёл амралтын хүрээлэн",
    venueEn: "Amusement Park",
    price: "Үнэгүй",
    badge: null,
    image: "/assets/img/07c6c6c75b998fb6.jpg",
  },
];

const FEATURED_COURSES = [
  {
    id: "crs-1",
    title: "Веб хөгжүүлэлт — суурь курс",
    titleEn: "Web Development Bootcamp",
    date: "9-р сарын 21-нд",
    dateEn: "Starts Sep 21",
    venue: "Blue Sky Tower, 14 давхар",
    venueEn: "Blue Sky Tower, 14th Fl",
    price: "₮1,200,000",
    badge: "Онцлох",
    badgeType: "promo",
    image: "/assets/img/2549d679991e8be3.jpg",
  },
  {
    id: "crs-2",
    title: "Гэрэл зургийн мэргэшүүлэх курс",
    titleEn: "Professional Photography Course",
    date: "10-р сарын 12-нд",
    dateEn: "Starts Oct 12",
    venue: "Chinggis Studio, Сүхбаатар",
    venueEn: "Chinggis Studio, Sukhbaatar",
    price: "₮760,000",
    badge: "Онцлох",
    badgeType: "promo",
    image: "/assets/img/f774286468b80c6f.jpg",
  },
  {
    id: "crs-3",
    title: "Тайзны гэрэлтүүлгийн курс",
    titleEn: "Stage Lighting Masterclass",
    date: "9-р сарын 7-нд",
    dateEn: "Starts Sep 7",
    venue: "Хөх Тэнгэр студи, Сүхбаатар",
    venueEn: "Hoh Tenger Studio",
    price: "₮430,000",
    badge: "Цөөн үлдсэн",
    badgeType: "low",
    image: "/assets/img/b5e94e90c3d8df6c.jpg",
  },
  {
    id: "crs-4",
    title: "Гитарын анхан шатны сургалт",
    titleEn: "Acoustic Guitar for Beginners",
    date: "9-р сарын 10-нд",
    dateEn: "Starts Sep 10",
    venue: "Морин хуур танхим, Чингэлтэй",
    venueEn: "Morin Khuur Hall",
    price: "₮380,000",
    badge: null,
    image: "/assets/img/584415eadd8f2ebe.jpg",
  },
  {
    id: "crs-5",
    title: "Хип-хоп бүжгийн 8 долоо хоног",
    titleEn: "8 Weeks Hip-Hop Dance",
    date: "9-р сарын 12-нд",
    dateEn: "Starts Sep 12",
    venue: "Flow Dance Studio, Хан-Уул",
    venueEn: "Flow Dance Studio",
    price: "₮460,000",
    badge: null,
    image: "/assets/img/9e7e81cc0090743e.jpg",
  },
  {
    id: "crs-6",
    title: "DJ ба битмейкинг сургалт",
    titleEn: "DJ & Beatmaking Training",
    date: "9-р сарын 14-нд",
    dateEn: "Starts Sep 14",
    venue: "UB Sound Lab, Сүхбаатар",
    venueEn: "UB Sound Lab",
    price: "₮680,000",
    badge: null,
    image: "/assets/img/902236f864f58ab2.jpg",
  },
  {
    id: "crs-7",
    title: "Йогийн багшийн үндсэн курс",
    titleEn: "Yoga Instructor Certification",
    date: "9-р сарын 15-нд",
    dateEn: "Starts Sep 15",
    venue: "Zen Yoga Center, Сүхбаатар",
    venueEn: "Zen Yoga Center",
    price: "₮1,450,000",
    badge: null,
    image: "/assets/img/afc19b55dffa3545.jpg",
  },
  {
    id: "crs-8",
    title: "Уран зургийн студи — акрил",
    titleEn: "Acrylic Painting Workshop",
    date: "9-р сарын 17-нд",
    dateEn: "Starts Sep 17",
    venue: "Steppe Arts Studio, Баянзүрх",
    venueEn: "Steppe Arts Studio",
    price: "₮490,000",
    badge: null,
    image: "/assets/img/6450ac80291b9a2d.jpg",
  },
  {
    id: "crs-9",
    title: "Латин бүжгийн үндэс",
    titleEn: "Latin Dance Fundamentals",
    date: "9-р сарын 23-нд",
    dateEn: "Starts Sep 23",
    venue: "Salsa UB Club, Чингэлтэй",
    venueEn: "Salsa UB Club",
    price: "₮390,000",
    badge: null,
    image: "/assets/img/1f821f0d15ec4978.jpg",
  },
  {
    id: "crs-10",
    title: "Тайзны дуу чимээний сургалт",
    titleEn: "Stage Audio Engineering",
    date: "9-р сарын 28-нд",
    dateEn: "Starts Sep 28",
    venue: "Nomad Studio, Баянгол",
    venueEn: "Nomad Studio",
    price: "₮540,000",
    badge: null,
    image: "/assets/img/b1b506d7f555f2f9.jpg",
  },
];

const HAPPENING_SOON = [
  {
    id: "soon-1",
    title: "Хотын амт — хүнсний фестиваль",
    titleEn: "City Taste Food Festival",
    date: "9-р сарын 5, Бя · 12:00",
    dateEn: "Sep 5, Sat · 12:00",
    venue: "Хүннү молл, гадна талбай",
    venueEn: "Hunnu Mall Outdoor Plaza",
    price: "₮15,000",
    badge: "Онцлох",
    image: "/assets/img/702844b5b1ca71e6.jpg",
  },
  {
    id: "soon-2",
    title: "Nomad Beats: DJ сешн",
    titleEn: "Nomad Beats: DJ Session",
    date: "9-р сарын 6, Ня · 22:00",
    dateEn: "Sep 6, Sun · 22:00",
    venue: "UB Sound Lab",
    venueEn: "UB Sound Lab",
    price: "₮28,000",
    badge: "Онцлох",
    image: "/assets/img/dd5548cce6edebaa.jpg",
  },
  {
    id: "soon-3",
    title: "Морин хуурын гала тоглолт",
    titleEn: "Morin Khuur Gala Concert",
    date: "9-р сарын 5, Бя · 19:00",
    dateEn: "Sep 5, Sat · 19:00",
    venue: "Улсын драмын театр",
    venueEn: "State Drama Theatre",
    price: "₮25,000",
    badge: null,
    image: "/assets/img/95915dd284f4c106.jpg",
  },
  {
    id: "soon-4",
    title: "Sofar UB: Акустик сешн",
    titleEn: "Sofar UB: Acoustic Session",
    date: "9-р сарын 5, Бя · 21:00",
    dateEn: "Sep 5, Sat · 21:00",
    venue: "Blue Sky Lounge",
    venueEn: "Blue Sky Lounge",
    price: "₮32,000",
    badge: "Цөөн үлдсэн",
    image: "/assets/img/8e94a2fe5d7c034d.jpg",
  },
  {
    id: "soon-5",
    title: "Улаанбаатар өглөөний гүйлт",
    titleEn: "Ulaanbaatar Morning Run",
    date: "9-р сарын 6, Ня · 07:00",
    dateEn: "Sep 6, Sun · 07:00",
    venue: "Сүхбаатарын талбай",
    venueEn: "Sukhbaatar Square",
    price: "₮40,000",
    badge: null,
    image: "/assets/img/f0ec48407c3c84f6.png",
  },
];

const FEATURED_ORGANIZERS = [
  {
    id: "org-1",
    name: "Хөх Тэнгэр Продакшн",
    avatar: "/assets/img/b5e94e90c3d8df6c.jpg",
    verified: true,
  },
  {
    id: "org-2",
    name: "UB Jazz Club",
    avatar: "/assets/img/6450ac80291b9a2d.jpg",
    verified: true,
  },
  {
    id: "org-3",
    name: "Codenomad Academy",
    avatar: "/assets/img/2549d679991e8be3.jpg",
    verified: true,
  },
  {
    id: "org-4",
    name: "Steppe Arts Studio",
    avatar: "/assets/img/9e7e81cc0090743e.jpg",
    verified: true,
  },
  {
    id: "org-5",
    name: "UB Sound Lab",
    avatar: "/assets/img/dd5548cce6edebaa.jpg",
    verified: true,
  },
  {
    id: "org-6",
    name: "Nomad Studio",
    avatar: "/assets/img/b1b506d7f555f2f9.jpg",
    verified: true,
  },
];

const DATE_OPTIONS = [
  { key: "all", mn: "Бүх огноо", en: "All dates" },
  { key: "today", mn: "Өнөөдөр", en: "Today" },
  { key: "tomorrow", mn: "Маргааш", en: "Tomorrow" },
  { key: "weekend", mn: "Энэ амралтын өдрүүдэд", en: "This weekend" },
  { key: "week", mn: "Энэ долоо хоног", en: "This week" },
  { key: "next7", mn: "Дараагийн 7 хоног", en: "Next 7 days" },
];

export default function HomePage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  // Hero carousel state
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);

  // Search state
  const [searchWhat, setSearchWhat] = useState("");
  const [selectedDateKey, setSelectedDateKey] = useState("all");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState({});

  // Partner form state
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [partnerIntro, setPartnerIntro] = useState("");
  const [partnerLoading, setPartnerLoading] = useState(false);

  // Rail refs for scroll navigation
  const recommendedRailRef = useRef(null);
  const weekendRailRef = useRef(null);
  const coursesRailRef = useRef(null);

  // Rail edge fade states
  const [fadeStates, setFadeStates] = useState({});

  useEffect(() => {
    document.title = "Bondy — Events, Courses & Tickets";
    const saved = localStorage.getItem("bondy_favorites");
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const toggleFavorite = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("bondy_favorites", JSON.stringify(next));
      if (next[id]) {
        toast.success(language === "en" ? "Saved to favorites" : "Хадгалагдлаа");
      } else {
        toast.success(language === "en" ? "Removed from favorites" : "Хасагдлаа");
      }
      return next;
    });
  };

  // Hero Auto-advance timer
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handlePrevSlide = () => {
    setSlideIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleNextSlide = () => {
    setSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  // Hero touch swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) handleNextSlide();
    else if (diff < -50) handlePrevSlide();
    touchStartX.current = null;
  };

  // Search submission
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const isCourse = /сургалт|курс|course/i.test(searchWhat);
    const target = isCourse ? "/Programs-Listing" : "/Explore";
    const params = new URLSearchParams();
    if (searchWhat.trim()) params.set("search", searchWhat.trim());
    if (selectedDateKey !== "all") params.set("date", selectedDateKey);
    const query = params.toString();
    router.push(target + (query ? `?${query}` : ""));
  };

  // Carousel Rail scroll helper
  const scrollRail = (railRef, key, dir) => {
    const rail = railRef.current;
    if (!rail) return;
    const cardWidth = rail.firstElementChild ? rail.firstElementChild.offsetWidth + 19 : 300;
    rail.scrollBy({ left: dir * cardWidth * 2, behavior: "smooth" });
  };

  const updateRailFade = (railRef, key) => {
    const rail = railRef.current;
    if (!rail) return;
    const { scrollLeft, scrollWidth, clientWidth } = rail;
    const hasLeft = scrollLeft > 10;
    const hasRight = scrollLeft + clientWidth < scrollWidth - 10;
    setFadeStates((prev) => ({
      ...prev,
      [`${key}-left`]: hasLeft,
      [`${key}-right`]: hasRight,
    }));
  };

  const selectedDateLabel =
    DATE_OPTIONS.find((d) => d.key === selectedDateKey)?.[language === "en" ? "en" : "mn"] ||
    DATE_OPTIONS[0][language === "en" ? "en" : "mn"];

  const handlePartnerSubmit = (e) => {
    e.preventDefault();
    if (!partnerEmail.trim()) {
      toast.error(language === "en" ? "Please enter your email" : "Имэйл хаягаа оруулна уу");
      return;
    }
    setPartnerLoading(true);
    setTimeout(() => {
      setPartnerLoading(false);
      setPartnerEmail("");
      setPartnerPhone("");
      setPartnerIntro("");
      toast.success(
        language === "en"
          ? "Request submitted! We will contact you soon."
          : "Хүсэлт амжилттай илгээгдлээ! Манай баг тантай удахгүй холбогдоно."
      );
    }, 1000);
  };

  return (
    <div style={{ width: "100%", background: "var(--bd-ink-900)", minHeight: "100vh", overflowX: "hidden" }}>
      <Header />

      {/* ====================================================================
          HERO CAROUSEL SECTION (#top)
          ==================================================================== */}
      <section
        id="top"
        data-screen-label="Hero"
        style={{ padding: "clamp(16px, 1.8vw, 24px) 0 clamp(30px, 3.2vw, 42px)" }}
      >
        <div className="bd-hero-wrap">
          <div
            className="bd-hero"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Sliding Rail */}
            <div
              className="bd-hero-rail"
              style={{
                transform: `translateX(-${slideIndex * 76}%)`,
              }}
            >
              {HERO_SLIDES.map((slide, idx) => {
                const isActive = idx === slideIndex;
                return (
                  <article
                    key={slide.id}
                    className={`bd-hero-slide ${isActive ? "active" : ""}`}
                  >
                    <div className="bd-hero-card">
                      <div
                        className="bd-hero-img"
                        style={{ backgroundImage: `url(${slide.image})` }}
                      />
                      <div className="bd-hero-grad-x" />
                      <div className="bd-hero-grad-y" />

                      <div className="bd-hero-pad">
                        <span className="bd-hero-kick">
                          {language === "en" ? slide.kickEn : slide.kick}
                        </span>
                        <h2 className="bd-hero-title">
                          {language === "en" ? slide.titleEn : slide.title}
                        </h2>
                        <span className="bd-hero-meta">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {language === "en" ? slide.venueEn : slide.venue}
                        </span>
                        <div className="bd-hero-cta">
                          <Link href="/Explore">
                            {language === "en" ? "Get Tickets" : "Тасалбар авах"}
                          </Link>
                          <span className="bd-hero-price">{slide.price}</span>
                        </div>
                      </div>

                      <div className="bd-hero-veil" />
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Left / Right Nav Arrows */}
            <button
              type="button"
              className="bd-hero-arw bd-hero-arw-prev"
              onClick={handlePrevSlide}
              aria-label="Өмнөх"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="bd-hero-arw bd-hero-arw-next"
              onClick={handleNextSlide}
              aria-label="Дараах"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* Bottom Progress Bars */}
            <div className="bd-hero-bar">
              <div style={{ padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="bd-hero-progs">
                  {HERO_SLIDES.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`bd-hero-prog ${i === slideIndex ? "active" : ""}`}
                      onClick={() => setSlideIndex(i)}
                      aria-label={`Слайд ${i + 1}`}
                    >
                      <span className="bd-hero-track">
                        <span className="bd-hero-fill" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FLOATING GLASS SEARCH BAR */}
        <div style={{ position: "relative", zIndex: 10, maxWidth: "1560px", margin: "clamp(12px, 1.4vw, 18px) auto 0", padding: "0 clamp(16px, 2vw, 34px)" }}>
          <div className="bd-hero-sbox">
            <form onSubmit={handleSearchSubmit} className="bd-sform">
              {/* Field 1: What */}
              <label className="bd-sform-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--acc-bright)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="bd-sform-col">
                  <b>{language === "en" ? "What" : "Юу"}</b>
                  <input
                    type="text"
                    value={searchWhat}
                    onChange={(e) => setSearchWhat(e.target.value)}
                    placeholder={language === "en" ? "Search events, courses" : "Эвент, сургалт хайх"}
                  />
                </span>
              </label>

              <span className="bd-sdiv" />

              {/* Field 2: When */}
              <div
                className="bd-sform-label bd-sform-label-date"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                style={{ position: "relative" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--acc-bright)" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="bd-sform-col">
                  <b>{language === "en" ? "When" : "Хэзээ"}</b>
                  <span style={{ fontSize: "15px", color: "var(--bd-white)", whiteSpace: "nowrap" }}>
                    {selectedDateLabel}
                  </span>
                </span>
              </div>

              {/* Action Button */}
              <button type="submit" className="bd-sform-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>{language === "en" ? "Search" : "Хайх"}</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* DATE PICKER SHEET / POPOVER */}
      {isDatePickerOpen && (
        <div className="bd-ds">
          <div className="bd-ds-bd" onClick={() => setIsDatePickerOpen(false)} />
          <div className="bd-ds-p">
            <div className="bd-ds-grab" />
            <div className="bd-ds-list">
              {DATE_OPTIONS.map((opt) => {
                const isSelected = selectedDateKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    className="bd-ds-opt"
                    onClick={() => {
                      setSelectedDateKey(opt.key);
                      setIsDatePickerOpen(false);
                    }}
                  >
                    <span>{language === "en" ? opt.en : opt.mn}</span>
                    {isSelected && (
                      <span className="bd-ds-ck">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SECTION 1: RECOMMENDED EVENTS (#upcoming)
          ==================================================================== */}
      <section id="upcoming" data-screen-label="Recommended events" style={{ padding: "clamp(46px, 4.4vw, 68px) 0" }}>
        <div className="bd-container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap", marginBottom: "20px" }}>
            <h2 className="bd-h2" style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "var(--bd-white)" }}>
              {language === "en" ? "Recommended for you" : "Танд санал болгох"}
            </h2>
            <Link href="/Explore?sort=recommended" className="bd-btn-outline">
              {language === "en" ? "View all" : "Бүгдийг харах"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>

          <div className="op-railwrap">
            <button
              type="button"
              className="op-arw op-arw-l"
              onClick={() => scrollRail(recommendedRailRef, "rec", -1)}
              aria-label="Өмнөх"
            >
              ‹
            </button>

            <div
              className="bd-rail"
              ref={recommendedRailRef}
              onScroll={() => updateRailFade(recommendedRailRef, "rec")}
            >
              {RECOMMENDED_EVENTS.map((item) => {
                const isFav = !!favorites[item.id];
                return (
                  <Link key={item.id} href="/Explore" className="bd-c">
                    <span className="bd-c-img" style={{ backgroundImage: `url(${item.image})` }}>
                      <button
                        type="button"
                        className={`bd-c-fav ${isFav ? "active" : ""}`}
                        onClick={(e) => toggleFavorite(item.id, e)}
                        aria-label="Хадгалах"
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7">
                          <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z" />
                        </svg>
                      </button>
                    </span>

                    {item.badge && (
                      <span className={item.badgeType === "low" ? "bd-c-low" : "bd-c-promo"}>
                        {language === "en" ? (item.badgeType === "low" ? "Low stock" : "Featured") : item.badge}
                      </span>
                    )}

                    <span className="bd-c-b">
                      <b className="bd-c-t">{language === "en" ? item.titleEn : item.title}</b>
                      <span className="bd-c-m" data-sched-line>
                        {language === "en" ? item.dateEn : item.date}
                      </span>
                      <span className="bd-c-m">{language === "en" ? item.venueEn : item.venue}</span>
                      <span className="bd-c-p">{item.price}</span>
                    </span>
                  </Link>
                );
              })}
            </div>

            <span className={`op-fade op-fade-l ${fadeStates["rec-left"] ? "show" : ""}`} />
            <span className={`op-fade op-fade-r ${fadeStates["rec-right"] ? "show" : ""}`} />

            <button
              type="button"
              className="op-arw op-arw-r"
              onClick={() => scrollRail(recommendedRailRef, "rec", 1)}
              aria-label="Дараах"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 2: THIS WEEKEND (#thisweekend)
          ==================================================================== */}
      <section id="thisweekend" data-screen-label="This weekend" style={{ padding: "clamp(52px, 5vw, 72px) 0 clamp(44px, 4.2vw, 64px)" }}>
        <div className="bd-container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap", marginBottom: "20px" }}>
            <h2 className="bd-h2" style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "var(--bd-white)" }}>
              {language === "en" ? "This weekend" : "Энэ амралтын өдрүүдэд"}
            </h2>
            <Link href="/Explore?date=weekend&sort=soonest" className="bd-btn-outline">
              {language === "en" ? "View all" : "Бүгдийг харах"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>

          <div className="op-railwrap">
            <button
              type="button"
              className="op-arw op-arw-l"
              onClick={() => scrollRail(weekendRailRef, "wk", -1)}
              aria-label="Өмнөх"
            >
              ‹
            </button>

            <div
              className="bd-rail"
              ref={weekendRailRef}
              onScroll={() => updateRailFade(weekendRailRef, "wk")}
            >
              {WEEKEND_EVENTS.map((item) => {
                const isFav = !!favorites[item.id];
                return (
                  <Link key={item.id} href="/Explore" className="bd-c">
                    <span className="bd-c-img" style={{ backgroundImage: `url(${item.image})` }}>
                      <button
                        type="button"
                        className={`bd-c-fav ${isFav ? "active" : ""}`}
                        onClick={(e) => toggleFavorite(item.id, e)}
                        aria-label="Хадгалах"
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7">
                          <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z" />
                        </svg>
                      </button>
                    </span>

                    {item.badge && (
                      <span className={item.badgeType === "low" ? "bd-c-low" : "bd-c-promo"}>
                        {language === "en" ? (item.badgeType === "low" ? "Low stock" : "Featured") : item.badge}
                      </span>
                    )}

                    <span className="bd-c-b">
                      <b className="bd-c-t">{language === "en" ? item.titleEn : item.title}</b>
                      <span className="bd-c-m" data-sched-line>
                        {language === "en" ? item.dateEn : item.date}
                      </span>
                      <span className="bd-c-m">{language === "en" ? item.venueEn : item.venue}</span>
                      <span className="bd-c-p">{item.price}</span>
                    </span>
                  </Link>
                );
              })}
            </div>

            <button
              type="button"
              className="op-arw op-arw-r"
              onClick={() => scrollRail(weekendRailRef, "wk", 1)}
              aria-label="Дараах"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 3: FEATURED COURSES (#courses)
          ==================================================================== */}
      <section id="courses" data-screen-label="Featured courses" style={{ padding: "clamp(44px, 4.2vw, 64px) 0" }}>
        <div className="bd-container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap", marginBottom: "20px" }}>
            <h2 className="bd-h2" style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "var(--bd-white)" }}>
              {language === "en" ? "Featured courses" : "Онцлох сургалтууд"}
            </h2>
            <Link href="/Programs-Listing?sort=recommended" className="bd-btn-outline">
              {language === "en" ? "View all" : "Бүгдийг харах"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>

          <div className="op-railwrap">
            <button
              type="button"
              className="op-arw op-arw-l"
              onClick={() => scrollRail(coursesRailRef, "crs", -1)}
              aria-label="Өмнөх"
            >
              ‹
            </button>

            <div
              className="bd-rail"
              ref={coursesRailRef}
              onScroll={() => updateRailFade(coursesRailRef, "crs")}
            >
              {FEATURED_COURSES.map((item) => {
                const isFav = !!favorites[item.id];
                return (
                  <Link key={item.id} href="/Programs-Listing" className="bd-c">
                    <span className="bd-c-img" style={{ backgroundImage: `url(${item.image})` }}>
                      <button
                        type="button"
                        className={`bd-c-fav ${isFav ? "active" : ""}`}
                        onClick={(e) => toggleFavorite(item.id, e)}
                        aria-label="Хадгалах"
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7">
                          <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z" />
                        </svg>
                      </button>
                    </span>

                    {item.badge && (
                      <span className={item.badgeType === "low" ? "bd-c-low" : "bd-c-promo"}>
                        {language === "en" ? (item.badgeType === "low" ? "Low stock" : "Featured") : item.badge}
                      </span>
                    )}

                    <span className="bd-c-b">
                      <b className="bd-c-t">{language === "en" ? item.titleEn : item.title}</b>
                      <span className="bd-c-m" data-sched-line>
                        {language === "en" ? item.dateEn : item.date}
                      </span>
                      <span className="bd-c-m">{language === "en" ? item.venueEn : item.venue}</span>
                      <span className="bd-c-p">{item.price}</span>
                    </span>
                  </Link>
                );
              })}
            </div>

            <button
              type="button"
              className="op-arw op-arw-r"
              onClick={() => scrollRail(coursesRailRef, "crs", 1)}
              aria-label="Дараах"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 4: HAPPENING SOON (#weekend)
          ==================================================================== */}
      <section id="weekend" data-screen-label="Happening soon" style={{ padding: "clamp(44px, 4.2vw, 64px) 0" }}>
        <div className="bd-container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap", marginBottom: "20px" }}>
            <h2 className="bd-h2" style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "var(--bd-white)" }}>
              {language === "en" ? "Happening soon" : "Удахгүй болох"}
            </h2>
            <Link href="/Explore?sort=soonest" className="bd-btn-outline">
              {language === "en" ? "View all" : "Бүгдийг харах"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>

          <div className="hp-up">
            {HAPPENING_SOON.map((row) => {
              const isFav = !!favorites[row.id];
              return (
                <Link key={row.id} href="/Explore" className="hp-up-row">
                  <span className="hp-up-th" style={{ backgroundImage: `url(${row.image})` }}>
                    {row.badge && (
                      <span className={row.badge === "Цөөн үлдсэн" ? "hp-up-low" : "hp-up-promo"}>
                        {language === "en" ? (row.badge === "Цөөн үлдсэн" ? "Low stock" : "Featured") : row.badge}
                      </span>
                    )}
                  </span>
                  <b className="hp-up-t">{language === "en" ? row.titleEn : row.title}</b>
                  <span className="hp-up-v">
                    <span className="hp-up-vt">{language === "en" ? row.venueEn : row.venue}</span>
                  </span>
                  <span className="hp-up-d">{language === "en" ? row.dateEn : row.date}</span>
                  <b className="hp-up-p">{row.price}</b>
                  <button
                    type="button"
                    className={`hp-up-bm ${isFav ? "active" : ""}`}
                    onClick={(e) => toggleFavorite(row.id, e)}
                    aria-label="Хадгалах"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M12 20.9C12 20.9 2.7 15.4 2.7 9.4C2.7 6.4 5 4.1 7.9 4.1C9.8 4.1 11.3 5.2 12 6.7C12.7 5.2 14.2 4.1 16.1 4.1C19 4.1 21.3 6.4 21.3 9.4C21.3 15.4 12 20.9 12 20.9Z" />
                    </svg>
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 5: FEATURED ORGANIZERS (#organizers)
          ==================================================================== */}
      <section id="organizers" data-screen-label="Featured organizers" style={{ padding: "clamp(44px, 4.2vw, 64px) 0" }}>
        <div className="bd-container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap", marginBottom: "20px" }}>
            <h2 className="bd-h2" style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "var(--bd-white)" }}>
              {language === "en" ? "Featured organizers" : "Онцлох зохион байгуулагчид"}
            </h2>
            <Link href="/Organizers" className="bd-btn-outline">
              {language === "en" ? "View all" : "Бүгдийг харах"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>

          <div className="bd-org-grid">
            {FEATURED_ORGANIZERS.map((org) => (
              <Link key={org.id} href="/Organizers" className="bd-org-card">
                <img src={org.avatar} alt={org.name} className="bd-org-avatar" />
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "5px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--bd-white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {org.name}
                  </span>
                  <span className="bd-org-verified">
                    {language === "en" ? "Verified" : "Баталгаажсан"}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 6: ORGANIZER CTA / PARTNER (#partner)
          ==================================================================== */}
      <section id="partner" data-screen-label="Organizer CTA">
        <div className="bd-container">
          <div className="cta-grid">
            {/* Col 1: Benefits */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: "clamp(26px, 2.6vw, 34px)", lineHeight: 1.14, color: "var(--bd-white)", maxWidth: "17ch" }}>
                {language === "en" ? "Join Bondy as an organizer" : "Bondy-д зохион байгуулагчаар нэгдээрэй"}
              </h2>
              <p style={{ margin: "12px 0 0", fontSize: "16px", lineHeight: 1.6, color: "var(--bd-gray-400)", maxWidth: "40ch" }}>
                {language === "en"
                  ? "Leave your details. Our team will contact you promptly."
                  : "Мэдээллээ үлдээгээрэй. Манай баг тантай холбогдоно."}
              </p>
              <ul style={{ listStyle: "none", margin: "22px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", color: "var(--bd-gray-300)" }}>
                  <span style={{ display: "inline-flex", color: "var(--bd-teal-500)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </span>
                  {language === "en" ? "Reach a larger audience" : "Илүү олон хүнд хүрэх"}
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", color: "var(--bd-gray-300)" }}>
                  <span style={{ display: "inline-flex", color: "var(--bd-teal-500)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </span>
                  {language === "en" ? "Manage registration & tickets in one place" : "Бүртгэл, тасалбараа нэг дор удирдах"}
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", color: "var(--bd-gray-300)" }}>
                  <span style={{ display: "inline-flex", color: "var(--bd-teal-500)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </span>
                  {language === "en" ? "Effortlessly track sales and revenue" : "Борлуулалт, орлогоо хялбар хянах"}
                </li>
              </ul>
            </div>

            {/* Col 2: Phone Device Mockup */}
            <div className="cta-phone" aria-hidden="true">
              <span className="cta-phone-glow" />
              <span className="cta-phone-contact" />
              <img
                className="cta-phone-render"
                src="/assets/img/organizer-phone-device.png"
                alt="Bondy зохион байгуулагчийн хяналтын самбар утсан дээр"
              />
            </div>

            {/* Col 3: Request Form */}
            <form onSubmit={handlePartnerSubmit} className="partner-form-box">
              <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: "var(--bd-white)" }}>
                {language === "en" ? "Submit request" : "Хүсэлт илгээх"}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--bd-gray-300)" }}>
                  {language === "en" ? "Email" : "Имэйл"}
                </span>
                <input
                  type="email"
                  required
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="tanai@bondy.mn"
                  className="bd-form-input"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--bd-gray-300)" }}>
                  {language === "en" ? "Phone number" : "Утасны дугаар"}
                </span>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ flex: "0 0 94px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bd-surface-sunken)", border: "1px solid var(--bd-border)", borderRadius: "12px", color: "var(--bd-white)", fontSize: "14px", fontWeight: 600 }}>
                    MN +976
                  </div>
                  <input
                    type="tel"
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    placeholder="9911 2233"
                    className="bd-form-input"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--bd-gray-300)" }}>
                  {language === "en" ? "Brief introduction" : "Товч танилцуулга"}
                </span>
                <textarea
                  rows={3}
                  value={partnerIntro}
                  onChange={(e) => setPartnerIntro(e.target.value)}
                  placeholder={language === "en" ? "Briefly describe your organization or activities" : "Үйл ажиллагааныхаа талаар товч танилцуулна уу"}
                  className="bd-form-textarea"
                />
              </div>

              <button type="submit" disabled={partnerLoading} className="bd-partner-cta">
                {partnerLoading
                  ? (language === "en" ? "Submitting..." : "Илгээж байна...")
                  : (language === "en" ? "Submit request" : "Хүсэлт илгээх")}
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
