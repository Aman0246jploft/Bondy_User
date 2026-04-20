"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import VenueAutocomplete from "../app/(OrganizerAdmin)/Components/VenueAutocomplete";
import { useLanguage } from "@/context/LanguageContext";

export default function Field({ onSearch, label = "Search", placeholder = "Search here..." }) {
   const { t } = useLanguage()
  const [isReady, setIsReady] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState(null);
  const [dateFilter, setDateFilter] = useState("all");
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    setIsReady(true);
  }, []);

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

  const clearLocation = (e) => {
    if (e.target.value === "") {
      setLocation(null);
    }
  };

  const handleSearchClick = () => {
    if (onSearch) {
      const searchParams = {};

      if (keyword.trim()) searchParams.search = keyword.trim();

      if (location) {
        searchParams.filter = "nearYou";
        searchParams.latitude = location.latitude;
        searchParams.longitude = location.longitude;
        searchParams.radius = 50; // default radius
      } else if (dateFilter !== "all") {
        searchParams.filter = dateFilter;
      } else {
        searchParams.filter = "all";
      }

      onSearch(searchParams);
    }
  };

  const handleReset = () => {
    setKeyword("");
    setLocation(null);
    setDateFilter("all");
    setResetKey((prev) => prev + 1);

    if (onSearch) {
      onSearch({});
    }
  };

  return (
    <AnimatePresence>
      {isReady && (
        <motion.div
          className="search-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 80, delay: 0.3 }}
        >
          <div className="search-fields">
            <div className="search-field one_field">
              <img src="/img/event_icon.svg" alt="event" />
              <div>
                <small>{label}</small>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
                />
              </div>
            </div>

            <div className="divider" />

            <div className="search-field two_field">
              <img src="/img/loc_icon.svg" alt="location" />
              <div style={{ width: "100%", overflow: "hidden" }}>
                <small>{t("where")}</small>
                <div onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}>
                  <VenueAutocomplete
                    key={resetKey}
                    onPlaceSelected={handleVenueSelected}
                    placeholder="Location"
                    className="border-0 shadow-none p-0 bg-transparent w-100 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="divider" />

            <div className="search-field three_field">
              <img src="/img/date_icon.svg" alt="date" />
              <div style={{ width: "100%" }}>
                <small>{t("When")}</small>
                <select
                  className="border-0 shadow-none p-0 bg-transparent text-secondary w-100 placeholder-styled-select mt-1"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  style={{ outline: "none", cursor: "pointer", appearance: "none", backgroundColor: "transparent" }}
                >
                  <option value="all">{t("allDates")}</option>
                  <option value="today">{t("today")}</option>
                  <option value="thisWeek">{t("thisWeek")}</option>
                  <option value="thisWeekend">{t("thisWeekend")}</option>
                  <option value="nextWeek">{t("nextWeek")}</option>
                  <option value="thisYear">{t("thisYear")}</option>
                  <option value="upcoming">{t("upcoming")}</option>
                  <option value="past">{t("past")}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="search-actions" style={{ display: 'flex', gap: '8px' }}>
            <button className="icon-btn teal" onClick={handleSearchClick} title="Search">
              <Search size={18} />
            </button>
            {(keyword || location || dateFilter !== "all") && (
              <button
                className="icon-btn bg-danger text-white border-0"
                onClick={handleReset}
                title="Reset Filters"
                style={{ backgroundColor: '#dc3545', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>×</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
