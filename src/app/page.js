"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import eventApi from "@/api/eventApi";
import courseApi from "@/api/courseApi";
import contactApi from "@/api/contactApi";
import wishlistApi from "@/api/wishlistApi";
import organizerApi from "@/api/organizerApi";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────

const FALLBACK_IMG = "/img/sidebar-logo.svg";

const DATE_OPTIONS = [
  { key: "all", mn: "Бүх огноо", en: "All dates" },
  { key: "today", mn: "Өнөөдөр", en: "Today" },
  { key: "tomorrow", mn: "Маргааш", en: "Tomorrow" },
  { key: "weekend", mn: "Энэ амралтын өдрүүдэд", en: "This weekend" },
  { key: "week", mn: "Энэ долоо хоног", en: "This week" },
  { key: "next7", mn: "Дараагийн 7 хоног", en: "Next 7 days" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPoster(item) {
  const raw = Array.isArray(item?.posterImage)
    ? item.posterImage[0]
    : item?.posterImage;
  if (!raw) return FALLBACK_IMG;
  const full = getFullImageUrl(raw);
  return full && !full.includes("sidebar-logo.svg") ? full : FALLBACK_IMG;
}

function getMinPrice(evt) {
  if (evt.isFreeEvent) return { num: 0, text: "Үнэгүй", textEn: "Free" };
  const prices = (evt.tickets || []).map((t) => Number(t.price)).filter((p) => !isNaN(p) && p >= 0);
  if (prices.length === 0 && evt.price != null) prices.push(Number(evt.price) || 0);
  const min = prices.length > 0 ? Math.min(...prices) : 0;
  return {
    num: min,
    text: min > 0 ? `₮${min.toLocaleString()}` : "Үнэгүй",
    textEn: min > 0 ? `₮${min.toLocaleString()}` : "Free",
  };
}

function formatDateShort(dateStr, timeStr, lang) {
  if (!dateStr) return lang === "mn" ? "Тун удахгүй" : "Coming Soon";
  const d = new Date(dateStr);
  if (isNaN(d)) return lang === "mn" ? "Тун удахгүй" : "Coming Soon";
  const mnM = ["1-р", "2-р", "3-р", "4-р", "5-р", "6-р", "7-р", "8-р", "9-р", "10-р", "11-р", "12-р"];
  const enM = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mnD = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];
  const enD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const t = timeStr || `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (lang === "mn") return `${mnM[d.getMonth()]} сарын ${d.getDate()}, ${mnD[d.getDay()]} · ${t}`;
  return `${enM[d.getMonth()]} ${d.getDate()}, ${enD[d.getDay()]} · ${t}`;
}

function mapEvent(evt) {
  const price = getMinPrice(evt);
  return {
    id: evt._id,
    title: evt.eventTitle || "Untitled",
    titleMn: evt.eventTitle_thi || evt.eventTitle || "Untitled",
    image: getPoster(evt),
    venue: evt.venueName || evt.venueAddress?.address || "Ulaanbaatar",
    date: formatDateShort(evt.startDate, evt.startTime, "en"),
    dateMn: formatDateShort(evt.startDate, evt.startTime, "mn"),
    price: price.text,
    priceEn: price.textEn,
    priceNum: price.num,
    isFeatured: Boolean(evt.isFeatured),
    addToSlider: Boolean(evt.addToSlider),
    href: `/eventDetails?id=${evt._id}`,
  };
}

function mapCourse(crs) {
  const priceNum = Number(crs.price || 0);
  const sd = crs.startDate ? new Date(crs.startDate) : null;
  const enM = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return {
    id: crs._id,
    title: crs.courseTitle || "Untitled",
    titleMn: crs.courseTitle_thi || crs.courseTitle || "Untitled",
    image: getPoster(crs),
    venue: crs.venueName || crs.venueAddress?.address || "Ulaanbaatar",
    date: sd && !isNaN(sd) ? `Starts ${enM[sd.getMonth()]} ${sd.getDate()}` : "Coming soon",
    dateMn: sd && !isNaN(sd) ? `${sd.getMonth() + 1}-р сарын ${sd.getDate()}-нд` : "Тун удахгүй",
    price: priceNum > 0 ? `₮${priceNum.toLocaleString()}` : "Үнэгүй",
    priceEn: priceNum > 0 ? `₮${priceNum.toLocaleString()}` : "Free",
    isFeatured: Boolean(crs.isFeatured),
    href: `/programDetails?id=${crs._id}`,
  };
}

// ─── Skeleton Components ───────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bd-c" style={{ pointerEvents: "none", flexShrink: 0 }}>
      <span className="bd-c-img" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
      <span className="bd-c-b" style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 14px" }}>
        {[80, 60, 50, 35].map((w, i) => (
          <span key={i} style={{ display: "block", height: 13, width: `${w}%`, background: "rgba(255,255,255,0.08)", borderRadius: 4 }} />
        ))}
      </span>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="bd-hero-card" style={{ background: "var(--bd-ink-800)" }}>
      <div className="bd-hero-pad">
        <span style={{ display: "block", height: 14, width: "40%", background: "rgba(255,255,255,0.1)", borderRadius: 6, marginBottom: 14 }} />
        <span style={{ display: "block", height: 36, width: "70%", background: "rgba(255,255,255,0.12)", borderRadius: 8, marginBottom: 16 }} />
        <span style={{ display: "block", height: 14, width: "50%", background: "rgba(255,255,255,0.08)", borderRadius: 6 }} />
      </div>
    </div>
  );
}

// ─── Safe background image span with onError fallback ─────────────────────────

function SafeBg({ src, className, style, children }) {
  const [bg, setBg] = useState(src || FALLBACK_IMG);
  const isLogo = !bg || bg.includes("sidebar-logo.svg");

  useEffect(() => {
    setBg(src || FALLBACK_IMG);
  }, [src]);

  return (
    <span
      className={className}
      style={{
        ...style,
        backgroundImage: `url(${bg})`,
        backgroundSize: isLogo ? "44% auto" : "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundColor: "var(--bd-ink-800, #16181f)",
      }}
    >
      <img
        src={bg}
        alt=""
        style={{ display: "none" }}
        onError={() => {
          if (bg !== FALLBACK_IMG) {
            setBg(FALLBACK_IMG);
          }
        }}
      />
      {children}
    </span>
  );
}

function HeroSlideBg({ src }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMG);
  const isLogo = !imgSrc || imgSrc.includes("sidebar-logo.svg");

  useEffect(() => {
    setImgSrc(src || FALLBACK_IMG);
  }, [src]);

  return (
    <div
      className="bd-hero-img"
      style={{
        backgroundImage: `url(${imgSrc})`,
        backgroundSize: isLogo ? "240px auto" : "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundColor: "var(--bd-ink-800, #16181f)",
      }}
    >
      <img
        src={imgSrc}
        alt=""
        style={{ display: "none" }}
        onError={() => {
          if (imgSrc !== FALLBACK_IMG) {
            setImgSrc(FALLBACK_IMG);
          }
        }}
      />
    </div>
  );
}

// ─── Shared UI sub-components ─────────────────────────────────────────────────

function RailArrow({ dir, onClick }) {
  return (
    <button type="button" className={`op-arw op-arw-${dir}`} onClick={onClick} aria-label={dir === "l" ? "Өмнөх" : "Дараах"}>
      {dir === "l" ? "‹" : "›"}
    </button>
  );
}

function SectionHeader({ mn, en, viewAllHref, language }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
      <h2 className="bd-h2" style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "var(--bd-white)" }}>
        {language === "en" ? en : mn}
      </h2>
      <Link href={viewAllHref} className="bd-btn-outline">
        {language === "en" ? "View all" : "Бүгдийг харах"}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  // Hero
  const [heroSlides, setHeroSlides] = useState([]);
  const [heroLoading, setHeroLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);

  // Section data
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [weekendEvents, setWeekendEvents] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [happeningSoon, setHappeningSoon] = useState([]);
  const [promotedOrganizers, setPromotedOrganizers] = useState([]);
  const [sectionLoading, setSectionLoading] = useState(true);

  // Search
  const [searchWhat, setSearchWhat] = useState("");
  const [selectedDateKey, setSelectedDateKey] = useState("all");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Favorites
  const [favorites, setFavorites] = useState({});

  // Partner form
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [partnerCountryCode, setPartnerCountryCode] = useState("+976");
  const [partnerIntro, setPartnerIntro] = useState("");
  const [partnerLoading, setPartnerLoading] = useState(false);

  // Rails
  const recommendedRailRef = useRef(null);
  const weekendRailRef = useRef(null);
  const coursesRailRef = useRef(null);
  const [fadeStates, setFadeStates] = useState({});

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = "Bondy — Events, Courses & Tickets";
    try {
      const saved = localStorage.getItem("bondy_favorites");
      if (saved) setFavorites(JSON.parse(saved));
    } catch (_) { }
  }, []);

  // ── Fetch all data ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // Fetch hero (slider), recommended, weekend, courses, happening-soon, organizers in parallel
        const [heroRes, recRes, weekendRes, courseRes, soonRes, orgRes] = await Promise.allSettled([
          eventApi.getEvents({ addToSlider: true, status: "Live,Upcoming", limit: 10 }),
          eventApi.getEvents({ isFeatured: true, status: "Live,Upcoming", limit: 10 }),
          eventApi.getEvents({ filter: "thisweekend", status: "Live,Upcoming", limit: 8 }),
          courseApi.getCourses({ isFeatured: true, limit: 10 }),
          eventApi.getEvents({ filter: "today", status: "Live,Upcoming", limit: 8 }),
          organizerApi.getPublicOrganizers({ featured: 1 }),
        ]);

        if (cancelled) return;

        // Hero slides — admin marks addToSlider in dashboard
        const heroRaw = heroRes.status === "fulfilled"
          ? (heroRes.value?.data?.data || heroRes.value?.data)?.events || []
          : [];
        // Also include isFeatured events if not enough slider events
        const sliderEvts = heroRaw.filter(e => e.addToSlider).map(mapEvent);

        // If admin hasn't marked any events for slider, fallback to featured events
        const recRaw = recRes.status === "fulfilled"
          ? (recRes.value?.data?.data || recRes.value?.data)?.events || []
          : [];
        const recEvts = recRaw.map(mapEvent);

        setHeroSlides(sliderEvts.length > 0 ? sliderEvts : recEvts.slice(0, 5));
        setHeroLoading(false);
        setRecommendedEvents(recEvts);

        // Weekend events
        const wkRaw = weekendRes.status === "fulfilled"
          ? (weekendRes.value?.data?.data || weekendRes.value?.data)?.events || []
          : [];
        const wkEvts = wkRaw.map(mapEvent);
        setWeekendEvents(wkEvts.length > 0 ? wkEvts : recEvts.slice(0, 6));

        // Courses
        const crsRaw = courseRes.status === "fulfilled"
          ? (courseRes.value?.data?.data || courseRes.value?.data)?.courses || []
          : [];
        setFeaturedCourses(crsRaw.map(mapCourse));

        // Happening soon
        const soonRaw = soonRes.status === "fulfilled"
          ? (soonRes.value?.data?.data || soonRes.value?.data)?.events || []
          : [];
        const soonEvts = soonRaw.map(mapEvent);
        setHappeningSoon(soonEvts.length > 0 ? soonEvts : recEvts.slice(0, 5));

        // Promoted Organizers (100% dynamic from DB)
        const orgRaw = orgRes.status === "fulfilled"
          ? (orgRes.value?.data?.data?.organizers || orgRes.value?.data?.organizers || [])
          : [];
        const dbPromoted = orgRaw.filter((o) => o.isPromoted);
        const dynamicList = dbPromoted.length > 0
          ? dbPromoted
          : orgRaw.filter((o) => o.verified || o.isApproved);

        setPromotedOrganizers(
          dynamicList.slice(0, 8).map((o) => ({
            id: o._id,
            name: o.name,
            avatar: o.avatar || FALLBACK_IMG,
            verified: o.verified,
            isPromoted: o.isPromoted,
            href: `/profile?id=${o._id}`,
          }))
        );

        setSectionLoading(false);
      } catch (err) {
        if (!cancelled) {
          setHeroLoading(false);
          setSectionLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Hero auto-advance ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused || heroSlides.length === 0) return;
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, heroSlides.length]);

  const handlePrevSlide = () => setSlideIndex((p) => (p - 1 + Math.max(heroSlides.length, 1)) % Math.max(heroSlides.length, 1));
  const handleNextSlide = () => setSlideIndex((p) => (p + 1) % Math.max(heroSlides.length, 1));
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) handleNextSlide();
    else if (diff < -50) handlePrevSlide();
    touchStartX.current = null;
  };

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const isCourse = /сургалт|курс|course/i.test(searchWhat);
    const target = isCourse ? "/Programs-Listing" : "/Explore";
    const params = new URLSearchParams();
    if (searchWhat.trim()) params.set("search", searchWhat.trim());
    if (selectedDateKey !== "all") params.set("date", selectedDateKey);
    router.push(target + (params.toString() ? `?${params}` : ""));
  };

  const selectedDateLabel =
    DATE_OPTIONS.find((d) => d.key === selectedDateKey)?.[language === "en" ? "en" : "mn"] ||
    DATE_OPTIONS[0][language === "en" ? "en" : "mn"];

  // ── Favorites ─────────────────────────────────────────────────────────────
  const toggleFavorite = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("bondy_favorites", JSON.stringify(next));
      toast.success(next[id]
        ? (language === "en" ? "Saved to favorites" : "Хадгалагдлаа")
        : (language === "en" ? "Removed from favorites" : "Хасагдлаа"));
      return next;
    });
    try {
      const token = localStorage.getItem("token");
      if (token) {
        if (!favorites[id]) {
          wishlistApi.addToWishlist({ entityId: id, entityModel: "Event" }).catch(() => { });
        } else {
          wishlistApi.removeFromWishlist({ entityId: id }).catch(() => { });
        }
      }
    } catch (_) { }
  };

  // ── Rail helpers ──────────────────────────────────────────────────────────
  const scrollRail = (ref, dir) => {
    const rail = ref.current;
    if (!rail) return;
    const w = rail.firstElementChild ? rail.firstElementChild.offsetWidth + 19 : 300;
    rail.scrollBy({ left: dir * w * 2, behavior: "smooth" });
  };

  const updateRailFade = (ref, key) => {
    const rail = ref.current;
    if (!rail) return;
    const { scrollLeft, scrollWidth, clientWidth } = rail;
    setFadeStates((prev) => ({
      ...prev,
      [`${key}-left`]: scrollLeft > 10,
      [`${key}-right`]: scrollLeft + clientWidth < scrollWidth - 10,
    }));
  };

  // ── Partner form ──────────────────────────────────────────────────────────
  const handlePartnerSubmit = async (e) => {
    e.preventDefault();
    if (!partnerName.trim()) {
      toast.error(language === "en" ? "Please enter your name" : "Нэрээ оруулна уу");
      return;
    }
    if (!partnerEmail.trim()) {
      toast.error(language === "en" ? "Please enter your email" : "Имэйл хаягаа оруулна уу");
      return;
    }
    if (!partnerIntro.trim()) {
      toast.error(language === "en" ? "Please write a brief introduction" : "Товч танилцуулга бичнэ үү");
      return;
    }
    setPartnerLoading(true);
    try {
      await contactApi.createContact({
        fullName: partnerName.trim(),
        name: partnerName.trim(),
        email: partnerEmail.trim(),
        phone: partnerPhone.trim() ? `${partnerCountryCode} ${partnerPhone.trim()}` : undefined,
        topic: "Organizer Partnership",
        message: partnerIntro.trim(),
      });
      toast.success(
        language === "en"
          ? "Request submitted! We will contact you soon."
          : "Хүсэлт амжилттай илгээгдлээ! Манай баг тантай удахгүй холбогдоно."
      );
      setPartnerName("");
      setPartnerEmail("");
      setPartnerPhone("");
      setPartnerIntro("");
    } catch (err) {
      toast.error(language === "en" ? "Failed to submit. Please try again." : "Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setPartnerLoading(false);
    }
  };

  // ─── Card renderer ────────────────────────────────────────────────────────
  const renderCard = (item) => {
    const isFav = !!favorites[item.id];
    const title = language === "mn" ? (item.titleMn || item.title) : item.title;
    const date = language === "mn" ? (item.dateMn || item.date) : item.date;
    const price = language === "mn" ? item.price : (item.priceEn || item.price);

    return (
      <Link key={item.id} href={item.href} className="bd-c">
        <SafeBg src={item.image} className="bd-c-img">
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
        </SafeBg>
        {item.isFeatured && (
          <span className="bd-c-promo">{language === "en" ? "Featured" : "Онцлох"}</span>
        )}
        <span className="bd-c-b">
          <b className="bd-c-t">{title}</b>
          <span className="bd-c-m" data-sched-line>{date}</span>
          <span className="bd-c-m">{item.venue}</span>
          <span className="bd-c-p">{price}</span>
        </span>
      </Link>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ width: "100%", background: "var(--bd-ink-900)", minHeight: "100vh", overflowX: "hidden" }}>
      <Header />

      {/* ════ HERO CAROUSEL — events marked "Add to Slider" by admin ════════ */}
      <section id="top" data-screen-label="Hero" style={{ padding: "clamp(16px,1.8vw,24px) 0 clamp(30px,3.2vw,42px)" }}>
        <div className="bd-hero-wrap">
          <div
            className="bd-hero"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {heroLoading ? (
              <div className="bd-hero-slide active"><HeroSkeleton /></div>
            ) : heroSlides.length === 0 ? (
              <div className="bd-hero-slide active">
                <div className="bd-hero-card" style={{ background: "linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)" }}>
                  <div className="bd-hero-pad">
                    <span className="bd-hero-kick" style={{ opacity: 0.7 }}>
                      {language === "en" ? "Discover events near you" : "Орчмынхоо эвентүүдийг нээгээрэй"}
                    </span>
                    <h2 className="bd-hero-title">
                      {language === "en" ? "Your next experience awaits" : "Дараагийн туршлагаа Bondy дээрээс ол"}
                    </h2>
                    <div className="bd-hero-cta">
                      <Link href="/Explore">{language === "en" ? "Browse Events" : "Эвентүүд харах"}</Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bd-hero-rail" style={{ transform: `translateX(-${slideIndex * 76}%)` }}>
                  {heroSlides.map((slide, idx) => {
                    const isActive = idx === slideIndex;
                    const title = language === "mn" ? (slide.titleMn || slide.title) : slide.title;
                    const date = language === "mn" ? (slide.dateMn || slide.date) : slide.date;
                    const price = language === "mn" ? slide.price : (slide.priceEn || slide.price);
                    return (
                      <article key={slide.id} className={`bd-hero-slide ${isActive ? "active" : ""}`}>
                        <div className="bd-hero-card">
                          <HeroSlideBg src={slide.image} />
                          <div className="bd-hero-grad-x" />
                          <div className="bd-hero-grad-y" />
                          <div className="bd-hero-pad">
                            <span className="bd-hero-kick">{date}</span>
                            <h2 className="bd-hero-title">{title}</h2>
                            <span className="bd-hero-meta">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              {slide.venue}
                            </span>
                            <div className="bd-hero-cta">
                              <Link href={slide.href || "/Explore"}>
                                {language === "en" ? "Get Tickets" : "Тасалбар авах"}
                              </Link>
                              <span className="bd-hero-price">{price}</span>
                            </div>
                          </div>
                          <div className="bd-hero-veil" />
                        </div>
                      </article>
                    );
                  })}
                </div>

                <button type="button" className="bd-hero-arw bd-hero-arw-prev" onClick={handlePrevSlide} aria-label="Өмнөх">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <button type="button" className="bd-hero-arw bd-hero-arw-next" onClick={handleNextSlide} aria-label="Дараах">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>

                <div className="bd-hero-bar">
                  <div style={{ padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="bd-hero-progs">
                      {heroSlides.map((_, i) => (
                        <button key={i} type="button" className={`bd-hero-prog ${i === slideIndex ? "active" : ""}`} onClick={() => setSlideIndex(i)} aria-label={`Слайд ${i + 1}`}>
                          <span className="bd-hero-track"><span className="bd-hero-fill" /></span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Floating Search */}
        <div style={{ position: "relative", zIndex: 30, maxWidth: 1560, margin: "clamp(12px,1.4vw,18px) auto 0", padding: "0 clamp(16px,2vw,34px)" }}>
          <div className="bd-hero-sbox">
            <form onSubmit={handleSearchSubmit} className="bd-sform">
              <label className="bd-sform-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--acc-bright)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
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

              <div className="bd-sform-label bd-sform-label-date" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)} style={{ position: "relative" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--acc-bright)" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="bd-sform-col">
                  <b>{language === "en" ? "When" : "Хэзээ"}</b>
                  <span style={{ fontSize: 15, color: "var(--bd-white)", whiteSpace: "nowrap" }}>{selectedDateLabel}</span>
                </span>

                {/* Date picker dropdown positioned directly relative to When */}
                {isDatePickerOpen && (
                  <div className="bd-ds" onClick={(e) => e.stopPropagation()}>
                    <div className="bd-ds-bd" onClick={(e) => { e.stopPropagation(); setIsDatePickerOpen(false); }} />
                    <div className="bd-ds-p">
                      <div className="bd-ds-grab" />
                      <div className="bd-ds-list">
                        {DATE_OPTIONS.map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            className="bd-ds-opt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDateKey(opt.key);
                              setIsDatePickerOpen(false);
                            }}
                          >
                            <span>{language === "en" ? opt.en : opt.mn}</span>
                            {selectedDateKey === opt.key && (
                              <span className="bd-ds-ck">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="bd-sform-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>{language === "en" ? "Search" : "Хайх"}</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ════ SECTION 1: RECOMMENDED (featured) EVENTS ══════════════════════ */}
      <section id="upcoming" data-screen-label="Recommended events" style={{ padding: "clamp(46px,4.4vw,68px) 0" }}>
        <div className="bd-container">
          <SectionHeader mn="Танд санал болгох" en="Recommended for you" viewAllHref="/Explore?sort=recommended" language={language} />
          <div className="op-railwrap">
            <RailArrow dir="l" onClick={() => scrollRail(recommendedRailRef, -1)} />
            <div className="bd-rail" ref={recommendedRailRef} onScroll={() => updateRailFade(recommendedRailRef, "rec")}>
              {sectionLoading
                ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
                : recommendedEvents.length > 0
                  ? recommendedEvents.map(renderCard)
                  : <p style={{ padding: "40px 20px", color: "var(--bd-gray-500)", fontSize: 14 }}>{language === "en" ? "No events found." : "Эвент олдсонгүй."}</p>}
            </div>
            <span className={`op-fade op-fade-l ${fadeStates["rec-left"] ? "show" : ""}`} />
            <span className={`op-fade op-fade-r ${fadeStates["rec-right"] ? "show" : ""}`} />
            <RailArrow dir="r" onClick={() => scrollRail(recommendedRailRef, 1)} />
          </div>
        </div>
      </section>

      {/* ════ SECTION 2: THIS WEEKEND ════════════════════════════════════════ */}
      <section id="thisweekend" data-screen-label="This weekend" style={{ padding: "clamp(52px,5vw,72px) 0 clamp(44px,4.2vw,64px)" }}>
        <div className="bd-container">
          <SectionHeader mn="Энэ амралтын өдрүүдэд" en="This weekend" viewAllHref="/Explore?date=weekend&sort=soonest" language={language} />
          <div className="op-railwrap">
            <RailArrow dir="l" onClick={() => scrollRail(weekendRailRef, -1)} />
            <div className="bd-rail" ref={weekendRailRef} onScroll={() => updateRailFade(weekendRailRef, "wk")}>
              {sectionLoading
                ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
                : weekendEvents.length > 0
                  ? weekendEvents.map(renderCard)
                  : <p style={{ padding: "40px 20px", color: "var(--bd-gray-500)", fontSize: 14 }}>{language === "en" ? "No weekend events." : "Амралтын өдрийн эвент олдсонгүй."}</p>}
            </div>
            <RailArrow dir="r" onClick={() => scrollRail(weekendRailRef, 1)} />
          </div>
        </div>
      </section>

      {/* ════ SECTION 3: FEATURED COURSES ════════════════════════════════════ */}
      <section id="courses" data-screen-label="Featured courses" style={{ padding: "clamp(44px,4.2vw,64px) 0" }}>
        <div className="bd-container">
          <SectionHeader mn="Онцлох сургалтууд" en="Featured courses" viewAllHref="/Programs-Listing?sort=recommended" language={language} />
          <div className="op-railwrap">
            <RailArrow dir="l" onClick={() => scrollRail(coursesRailRef, -1)} />
            <div className="bd-rail" ref={coursesRailRef} onScroll={() => updateRailFade(coursesRailRef, "crs")}>
              {sectionLoading
                ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
                : featuredCourses.length > 0
                  ? featuredCourses.map(renderCard)
                  : <p style={{ padding: "40px 20px", color: "var(--bd-gray-500)", fontSize: 14 }}>{language === "en" ? "No courses found." : "Сургалт олдсонгүй."}</p>}
            </div>
            <RailArrow dir="r" onClick={() => scrollRail(coursesRailRef, 1)} />
          </div>
        </div>
      </section>

      {/* ════ SECTION 4: HAPPENING SOON — compact row list ══════════════════ */}
      <section id="weekend" data-screen-label="Happening soon" style={{ padding: "clamp(44px,4.2vw,64px) 0" }}>
        <div className="bd-container">
          <SectionHeader mn="Удахгүй болох" en="Happening soon" viewAllHref="/Explore?sort=soonest" language={language} />
          <div className="hp-up">
            {sectionLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="hp-up-row" style={{ pointerEvents: "none" }}>
                  <span className="hp-up-th" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
                  {[70, 50, 40].map((w, j) => (
                    <span key={j} style={{ display: "block", height: 13, width: `${w}%`, background: "rgba(255,255,255,0.08)", borderRadius: 4 }} />
                  ))}
                </div>
              ))
              : happeningSoon.length > 0
                ? happeningSoon.map((row) => {
                  const isFav = !!favorites[row.id];
                  const title = language === "mn" ? (row.titleMn || row.title) : row.title;
                  const date = language === "mn" ? (row.dateMn || row.date) : row.date;
                  const price = language === "mn" ? row.price : (row.priceEn || row.price);
                  return (
                    <Link key={row.id} href={row.href} className="hp-up-row">
                      <SafeBg src={row.image} className="hp-up-th">
                        {row.isFeatured && <span className="hp-up-promo">{language === "en" ? "Featured" : "Онцлох"}</span>}
                      </SafeBg>
                      <b className="hp-up-t">{title}</b>
                      <span className="hp-up-v"><span className="hp-up-vt">{row.venue}</span></span>
                      <span className="hp-up-d">{date}</span>
                      <b className="hp-up-p">{price}</b>
                      <button type="button" className={`hp-up-bm ${isFav ? "active" : ""}`} onClick={(e) => toggleFavorite(row.id, e)} aria-label="Хадгалах">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                          <path d="M12 20.9C12 20.9 2.7 15.4 2.7 9.4C2.7 6.4 5 4.1 7.9 4.1C9.8 4.1 11.3 5.2 12 6.7C12.7 5.2 14.2 4.1 16.1 4.1C19 4.1 21.3 6.4 21.3 9.4C21.3 15.4 12 20.9 12 20.9Z" />
                        </svg>
                      </button>
                    </Link>
                  );
                })
                : <p style={{ color: "var(--bd-gray-500)", fontSize: 14 }}>{language === "en" ? "No upcoming events." : "Удахгүй болох эвент олдсонгүй."}</p>}
          </div>
        </div>
      </section>

      {/* ════ SECTION 5: PROMOTED ORGANIZERS ════════════════════════════════ */}
      {(sectionLoading || promotedOrganizers.length > 0) && (
        <section id="organizers" data-screen-label="Featured organizers" style={{ padding: "clamp(44px,4.2vw,64px) 0" }}>
          <div className="bd-container">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
              <h2 className="bd-h2" style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "var(--bd-white)" }}>
                {language === "en" ? "Promoted organizers" : "Онцлох зохион байгуулагчид"}
              </h2>
              <Link
                href="/Organizers?featured=1"
                className="bd-btn-outline"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 38,
                  padding: "0 16px",
                  borderRadius: 999,
                  border: "1px solid var(--bd-border, rgba(255,255,255,0.1))",
                  color: "var(--bd-gray-300, #d4d4d4)",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "border-color 200ms cubic-bezier(.2,.8,.2,1), color 200ms cubic-bezier(.2,.8,.2,1)",
                }}
              >
                {language === "en" ? "See all" : "Бүгдийг харах"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
            <div
              className="bd-rail"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 12,
              }}
            >
              {sectionLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`org-skel-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 13,
                      padding: "15px 17px",
                      borderRadius: 20,
                      background: "var(--bd-ink-850, #131b2e)",
                      border: "1px solid var(--bd-border, rgba(255,255,255,0.08))",
                    }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ width: "60%", height: 16, background: "rgba(255,255,255,0.08)", borderRadius: 4 }} />
                      <div style={{ width: "35%", height: 12, background: "rgba(255,255,255,0.05)", borderRadius: 4 }} />
                    </div>
                  </div>
                ))
              ) : (
                promotedOrganizers.map((org) => (
                  <Link
                    key={org.id || org._id}
                    href={org.href || `/profile?id=${org._id || org.id}`}
                    className="bd-hov"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 13,
                      padding: "15px 17px",
                      borderRadius: 20,
                      background: "var(--bd-ink-850, #131b2e)",
                      border: "1px solid var(--bd-border, rgba(255,255,255,0.08))",
                      color: "inherit",
                      textDecoration: "none",
                      transition: "border-color 200ms cubic-bezier(.2,.8,.2,1), transform 200ms cubic-bezier(.2,.8,.2,1), background 200ms",
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        overflow: "hidden",
                        flexShrink: 0,
                        background: "rgba(255,255,255,0.06)",
                      }}
                    >
                      <img
                        src={org.avatar || FALLBACK_IMG}
                        alt={org.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_IMG;
                        }}
                      />
                    </div>
                    <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5 }}>
                      <span
                        style={{
                          maxWidth: "100%",
                          fontSize: 15,
                          fontWeight: 700,
                          color: "var(--bd-white)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          boxSizing: "border-box",
                        }}
                      >
                        {org.name}
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11.5,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "rgba(34, 197, 94, 0.14)",
                          color: "#4ade80",
                          border: "1px solid rgba(34, 197, 94, 0.25)",
                        }}
                      >
                        {language === "en" ? "Verified" : "Баталгаажсан"}
                      </span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* ════ SECTION 6: ORGANIZER CTA ═══════════════════════════════════════ */}
      <section id="partner" data-screen-label="Organizer CTA">
        <div className="bd-container">
          <div className="cta-grid">
            {/* Col 1: Benefits */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: "clamp(26px,2.6vw,34px)", lineHeight: 1.14, color: "var(--bd-white)", maxWidth: "17ch" }}>
                {language === "en" ? "Join Bondy as an organizer" : "Bondy-д зохион байгуулагчаар нэгдээрэй"}
              </h2>
              <p style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.6, color: "var(--bd-gray-400)", maxWidth: "40ch" }}>
                {language === "en" ? "Leave your details. Our team will contact you promptly." : "Мэдээллээ үлдээгээрэй. Манай баг тантай холбогдоно."}
              </p>
              <ul style={{ listStyle: "none", margin: "22px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { en: "Reach a larger audience", mn: "Илүү олон хүнд хүрэх" },
                  { en: "Manage registration & tickets in one place", mn: "Бүртгэл, тасалбараа нэг дор удирдах" },
                  { en: "Effortlessly track sales and revenue", mn: "Борлуулалт, орлогоо хялбар хянах" },
                ].map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: "var(--bd-gray-300)" }}>
                    <span style={{ display: "inline-flex", color: "var(--bd-teal-500)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </span>
                    {language === "en" ? item.en : item.mn}
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 2: Phone mockup */}
            <div className="cta-phone" aria-hidden="true">
              <span className="cta-phone-glow" />
              <span className="cta-phone-contact" />
              <img
                className="cta-phone-render"
                src="/assets/img/organizer-phone-device.png"
                alt="Bondy organizer dashboard on phone"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_IMG;
                  e.currentTarget.style.objectFit = "contain";
                  e.currentTarget.style.padding = "24px";
                }}
              />
            </div>

            {/* Col 3: Contact form → real API call to /contact/createContact */}
            <form onSubmit={handlePartnerSubmit} className="partner-form-box">
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "var(--bd-white)" }}>
                {language === "en" ? "Submit request" : "Хүсэлт илгээх"}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--bd-gray-300)" }}>
                  {language === "en" ? "Full name" : "Бүтэн нэр"}
                </span>
                <input type="text" required value={partnerName} onChange={(e) => setPartnerName(e.target.value)}
                  placeholder={language === "en" ? "Your name" : "Таны нэр"} className="bd-form-input" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--bd-gray-300)" }}>
                  {language === "en" ? "Email" : "Имэйл"}
                </span>
                <input type="email" required value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="tanai@bondy.mn" className="bd-form-input" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--bd-gray-300)" }}>
                  {language === "en" ? "Phone (optional)" : "Утас (заавал биш)"}
                </span>
                <div style={{ display: "flex", gap: 12 }}>
                  <select
                    value={partnerCountryCode}
                    onChange={(e) => setPartnerCountryCode(e.target.value)}
                    className="bd-form-input"
                    style={{ flex: "0 0 130px", cursor: "pointer", paddingLeft: 10, fontWeight: 600 }}
                  >
                    {/* East Asia */}
                    <option value="+976">MN +976</option>
                    <option value="+86">CN +86</option>
                    <option value="+81">JP +81</option>
                    <option value="+82">KR +82</option>
                    <option value="+852">HK +852</option>
                    <option value="+886">TW +886</option>
                    {/* Southeast Asia */}
                    <option value="+65">SG +65</option>
                    <option value="+66">TH +66</option>
                    <option value="+84">VN +84</option>
                    <option value="+60">MY +60</option>
                    <option value="+63">PH +63</option>
                    <option value="+62">ID +62</option>
                    <option value="+95">MM +95</option>
                    <option value="+855">KH +855</option>
                    <option value="+856">LA +856</option>
                    {/* South Asia */}
                    <option value="+91">IN +91</option>
                    <option value="+92">PK +92</option>
                    <option value="+880">BD +880</option>
                    <option value="+94">LK +94</option>
                    <option value="+977">NP +977</option>
                    <option value="+93">AF +93</option>
                    {/* Central Asia */}
                    <option value="+7">KZ +7</option>
                    <option value="+998">UZ +998</option>
                    <option value="+996">KG +996</option>
                    <option value="+992">TJ +992</option>
                    <option value="+993">TM +993</option>
                    {/* Middle East */}
                    <option value="+971">AE +971</option>
                    <option value="+966">SA +966</option>
                    <option value="+90">TR +90</option>
                    <option value="+98">IR +98</option>
                    <option value="+964">IQ +964</option>
                    <option value="+962">JO +962</option>
                    <option value="+961">LB +961</option>
                    <option value="+972">IL +972</option>
                    <option value="+965">KW +965</option>
                    <option value="+974">QA +974</option>
                    <option value="+973">BH +973</option>
                    <option value="+968">OM +968</option>
                    {/* Europe */}
                    <option value="+44">GB +44</option>
                    <option value="+49">DE +49</option>
                    <option value="+33">FR +33</option>
                    <option value="+39">IT +39</option>
                    <option value="+34">ES +34</option>
                    <option value="+31">NL +31</option>
                    <option value="+32">BE +32</option>
                    <option value="+41">CH +41</option>
                    <option value="+43">AT +43</option>
                    <option value="+46">SE +46</option>
                    <option value="+47">NO +47</option>
                    <option value="+45">DK +45</option>
                    <option value="+358">FI +358</option>
                    <option value="+48">PL +48</option>
                    <option value="+7">RU +7</option>
                    <option value="+380">UA +380</option>
                    <option value="+30">GR +30</option>
                    <option value="+351">PT +351</option>
                    <option value="+420">CZ +420</option>
                    <option value="+36">HU +36</option>
                    <option value="+40">RO +40</option>
                    {/* Americas */}
                    <option value="+1">US +1</option>
                    <option value="+1">CA +1</option>
                    <option value="+52">MX +52</option>
                    <option value="+55">BR +55</option>
                    <option value="+54">AR +54</option>
                    <option value="+56">CL +56</option>
                    <option value="+57">CO +57</option>
                    <option value="+51">PE +51</option>
                    <option value="+58">VE +58</option>
                    <option value="+593">EC +593</option>
                    {/* Africa */}
                    <option value="+27">ZA +27</option>
                    <option value="+234">NG +234</option>
                    <option value="+20">EG +20</option>
                    <option value="+254">KE +254</option>
                    <option value="+251">ET +251</option>
                    <option value="+233">GH +233</option>
                    <option value="+212">MA +212</option>
                    <option value="+216">TN +216</option>
                    {/* Oceania */}
                    <option value="+61">AU +61</option>
                    <option value="+64">NZ +64</option>
                  </select>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={partnerPhone}
                    onChange={(e) => {
                      const numeric = e.target.value.replace(/[^0-9]/g, "");
                      setPartnerPhone(numeric);
                    }}
                    placeholder="9911 2233"
                    className="bd-form-input"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--bd-gray-300)" }}>
                  {language === "en" ? "Brief introduction" : "Товч танилцуулга"}
                </span>
                <textarea rows={3} value={partnerIntro} onChange={(e) => setPartnerIntro(e.target.value)}
                  placeholder={language === "en" ? "Briefly describe your organization or activities" : "Үйл ажиллагааныхаа талаар товч танилцуулна уу"}
                  className="bd-form-textarea" />
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

