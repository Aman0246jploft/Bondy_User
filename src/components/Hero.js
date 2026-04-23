"use client";
import React, { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Navigation } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
// import HeroSearchFilter from "./HeroSearchFilter";
import { useLanguage } from "@/context/LanguageContext";
import VenueAutocomplete from "../app/(OrganizerAdmin)/Components/VenueAutocomplete";
import { toUtcDateRangeValue } from "@/utils/dateRangePayload";
const HeroSlider = ({ setView, onSearch }) => {
  const { t } = useLanguage();
  const [isReady, setIsReady] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState(null);
  // const [dateFilter, setDateFilter] = useState("all");
  const [resetKey, setResetKey] = useState(0);

  // Custom Date Dropdown State
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [dateFilter, setDateFilter] = useState("all");
  const [dateRange, setDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: "selection",
    },
  ]);

  // Close custom dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDateDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dateOptions = [
    { value: "all", label: "All Dates" },
    { value: "today", label: "Today" },
    { value: "thisWeek", label: "This Week" },
    { value: "thisWeekend", label: "This Weekend" },
    { value: "nextWeek", label: "Next Week" },
    { value: "thisYear", label: "This Year" },
    { value: "upcoming", label: "Upcoming" },
    { value: "past", label: "Past" },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 60, damping: 12 },
    },
  };

  const slides = [
    "/img/banner_img.png",
    "https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070",
  ];

  const handleSearchClick = () => {
    const params = {};
    if (keyword.trim()) params.search = keyword.trim();
    if (location) {
      params.filter = "nearYou";
      params.latitude = location.latitude;
      params.longitude = location.longitude;
    }
    // if (dateFilter !== "all") params.filter = dateFilter;

    if (dateRange[0].startDate) {
      params.startDate = toUtcDateRangeValue(dateRange[0].startDate, "start");
    }

    if (dateRange[0].endDate) {
      params.endDate = toUtcDateRangeValue(dateRange[0].endDate, "end");
    }

    if (onSearch) {
      onSearch(params);
    }
  };

  const handleReset = () => {
    setKeyword("");
    setLocation(null);
    setDateFilter("all");
    setDateRange([{ startDate: null, endDate: null, key: "selection" }]);
    setResetKey((prev) => prev + 1);

    if (onSearch) {
      onSearch({
        search: "",
        filter: "all",
        latitude: null,
        longitude: null,
        startDate: "",
        endDate: "",
      });
    }
  };

  const handleVenueSelected = (venueData) => {
    if (venueData && venueData.latitude && venueData.longitude) {
      setLocation({
        latitude: venueData.latitude,
        longitude: venueData.longitude,
      });
    } else {
      setLocation(null);
    }
  };

  return (
    <div className="hero-wrapper">
      {/* ---------- SLIDER ---------- */}
      <Swiper
        modules={[Autoplay, EffectFade, Navigation]}
        effect="fade"
        speed={1500}
        autoplay={{ delay: 5000 }}
        navigation={{ prevEl: ".prev-el", nextEl: ".next-el" }}
        loop
        className="h-100"
      >
        {slides.map((img, index) => (
          <SwiperSlide key={index}>
            <div
              className="slide-bg"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.9)), url(${img})`,
              }}
            />

            <div className="banner_video">
              <video autoPlay muted loop playsInline className="bg_video">
                <source src="/img/video_banner.mp4" type="video/mp4" />
              </video>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* ---------- NAV BUTTONS ---------- */}
      <button className="nav-btn prev-el">
        <ChevronLeft size={24} />
      </button>
      <button className="nav-btn next-el">
        <ChevronRight size={24} />
      </button>

      {/* ---------- CONTENT ---------- */}
      <AnimatePresence>
        {isReady && (
          <motion.div
            className="hero-content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 variants={itemVariants}>
              {t("heroTitle1")} <br />
              <span>{t("heroTitle2")}</span>
            </motion.h1>

            <motion.p variants={itemVariants}>{t("heroSubtitle")}</motion.p>

            {/* ---------- SEARCH CARD ---------- */}
            <motion.div
              className="search-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80, delay: 0.5 }}
            >
              <div className="search-fields ">
                <div className="search-field one_field">
                  <img src="/img/event_icon.svg" />
                  <div>
                    <small>{t("eventcategory")}</small>
                    <input
                      type="text"
                      placeholder={t("eventTypePlaceholders")}
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSearchClick()
                      }
                    />
                  </div>
                </div>

                <div className="divider" />

                <div className="search-field two_field">
                  <img src="/img/loc_icon.svg" />
                  <div style={{ width: "100%", overflow: "hidden" }}>
                    <small>{t("where")}</small>
                    <div
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSearchClick()
                      }
                    >
                      <VenueAutocomplete
                        key={resetKey}
                        onPlaceSelected={handleVenueSelected}
                        placeholder={t("locationPlaceholder")}
                        className="border-0 shadow-none p-0 bg-transparent w-100 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="divider" />
                {/* <div className="search-field three_field">
                  <img src="/img/date_icon.svg" alt="date" />
                  <div style={{ width: "100%" }}>
                    <small>{t("When")}</small>
                    <select
                      className="border-0 shadow-none p-0 bg-transparent w-100 mt-1"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      style={{
                        outline: "none",
                        cursor: "pointer",
                        color: dateFilter === "all" ? "rgba(255, 255, 255, 0.6)" : "#ffffff"
                      }}
                    >
                      <option value="all" style={{ backgroundColor: "#222", color: "#fff" }}>{t("allDates")}</option>
                      <option value="today" style={{ backgroundColor: "#222", color: "#fff" }}>{t("today")}</option>
                      <option value="thisWeek" style={{ backgroundColor: "#222", color: "#fff" }}>{t("thisWeek")}</option>
                      <option value="thisWeekend" style={{ backgroundColor: "#222", color: "#fff" }}>{t("thisWeekend")}</option>
                      <option value="nextWeek" style={{ backgroundColor: "#222", color: "#fff" }}>{t("nextWeek")}</option>
                      <option value="thisYear" style={{ backgroundColor: "#222", color: "#fff" }}>{t("thisYear")}</option>
                      <option value="upcoming" style={{ backgroundColor: "#222", color: "#fff" }}>{t("upcoming")}</option>
                      <option value="past" style={{ backgroundColor: "#222", color: "#fff" }}>{t("past")}</option>
                    </select>
                  </div>
                </div> */}
                <div
                  className="search-field three_field"
                  style={{ position: "relative" }}
                >
                  <img src="/img/date_icon.svg" alt="date" />
                  <div style={{ width: "100%" }}>
                    <small>{t("When")}</small>

                    <input
                      type="text"
                      readOnly
                      placeholder={t("selectDateRange")}
                      value={
                        dateRange[0].startDate && dateRange[0].endDate
                          ? `${dateRange[0].startDate.toLocaleDateString()} - ${dateRange[0].endDate.toLocaleDateString()}`
                          : ""
                      }
                      onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                      style={{
                        color: "#aaa", // 👈 grey color
                        cursor: "pointer",
                        background: "transparent",
                        border: "none",
                      }}
                    />

                    {isDateDropdownOpen && (
                      <div
                        ref={dropdownRef}
                        style={{
                          position: "absolute",
                          bottom: "calc(100% + 10px)",
                          left: "-60px",
                          zIndex: 9999,
                          borderRadius: "12px",
                          overflow: "hidden",
                          boxShadow: "0 -8px 32px rgba(0,0,0,0.7)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          transform: "scale(0.82)",
                          transformOrigin: "bottom left",
                        }}
                      >
                        <style>{`
          .rdr-dark .rdrCalendarWrapper { background: #141428; color: #fff; }
          .rdr-dark .rdrDateDisplayWrapper { display: none; }
          .rdr-dark .rdrDateInput { background: #141428; border-color: rgba(255,255,255,0.12); }
          .rdr-dark .rdrDateInput input { color: #ccc; }
          .rdr-dark .rdrMonthAndYearWrapper { background: #141428; }
          .rdr-dark .rdrMonthAndYearPickers select { color: #fff; background: #141428; }
          .rdr-dark .rdrMonthAndYearPickers select option { background: #141428; }
          .rdr-dark .rdrNextPrevButton { background: #1e1e38; }
          .rdr-dark .rdrNextPrevButton:hover { background: #2a2a4a; }
          .rdr-dark .rdrPprevButton i { border-color: transparent #aaa transparent transparent; }
          .rdr-dark .rdrNextButton i { border-color: transparent transparent transparent #aaa; }
          .rdr-dark .rdrWeekDay { color: rgba(160,160,160,0.65); font-size: 12px; }
          .rdr-dark .rdrMonth { background: #141428; }
          .rdr-dark .rdrMonthName { color: rgba(160,160,160,0.65); }
          .rdr-dark .rdrDay:not(.rdrDayPassive) .rdrDayNumber span { color: #fff; }
          .rdr-dark .rdrDayPassive .rdrDayNumber span { color: rgba(255,255,255,0.18); }
          .rdr-dark .rdrDayDisabled { background: transparent; }
          .rdr-dark .rdrDayDisabled .rdrDayNumber span { color: rgba(255,255,255,0.18) !important; }
          .rdr-dark .rdrDayToday .rdrDayNumber span:after { background: #00b4b4; }
          .rdr-dark .rdrDay:not(.rdrDayPassive):not(.rdrDayDisabled):hover .rdrDayNumber span { color: #fff; }
          .rdr-dark .rdrDefined .rdrDayNumber span { color: #fff; }
        `}</style>
                        <div className="rdr-dark">
                          <DateRange
                            editableDateInputs={true}
                            onChange={(item) => {
                              const { startDate, endDate } = item.selection;
                              if (endDate >= startDate) {
                                setDateRange([item.selection]);
                              }
                            }}
                            moveRangeOnFirstSelection={false}
                            ranges={dateRange}
                            minDate={new Date()}
                            color="#00b4b4"
                            rangeColors={["#00b4b4"]}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                className="search-actions"
                style={{ display: "flex", gap: "8px" }}
              >
                <button className="icon-btn teal" onClick={handleSearchClick}>
                  <Search size={18} />
                </button>

                {(keyword || location || dateRange[0].startDate) && (
                  <button
                    className="icon-btn bg-danger text-white border-0"
                    onClick={handleReset}
                    title="Reset Filters"
                    style={{
                      backgroundColor: "#dc3545",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      ×
                    </span>
                  </button>
                )}

                {/* 👇 SWITCH TO GRID VIEW */}
                <button
                  className="icon-btn outline"
                  onClick={() => setView("grid")}
                >
                  <img src="/img/location_icon.svg" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeroSlider;
