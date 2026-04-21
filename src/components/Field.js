"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import VenueAutocomplete from "../app/(OrganizerAdmin)/Components/VenueAutocomplete";
import { useLanguage } from "@/context/LanguageContext";

export default function Field({ onSearch, label = "Search", placeholder = "Search here..." }) {
   const { t } = useLanguage()
  const [isReady, setIsReady] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState(null);
  const [dateRange, setDateRange] = useState([{ startDate: null, endDate: null, key: "selection" }]);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDateDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const handleVenueSelected = (venueData) => {
    if (venueData && venueData.latitude && venueData.longitude) {
      setLocation({ latitude: venueData.latitude, longitude: venueData.longitude });
    } else {
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
        searchParams.radius = 50;
      } else {
        searchParams.filter = "all";
      }

      if (dateRange[0].startDate) searchParams.startDate = dateRange[0].startDate.toISOString();
      if (dateRange[0].endDate) searchParams.endDate = dateRange[0].endDate.toISOString();

      onSearch(searchParams);
    }
  };

  const handleReset = () => {
    setKeyword("");
    setLocation(null);
    setDateRange([{ startDate: null, endDate: null, key: "selection" }]);
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
                   placeholder={t("locationPlaceholder")}
                    className="border-0 shadow-none p-0 bg-transparent w-100 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="divider" />

            <div className="search-field three_field" ref={dropdownRef} style={{ position: "relative" }}>
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
                  onClick={() => setIsDateDropdownOpen((v) => !v)}
                  style={{ color: "#aaa", cursor: "pointer", background: "transparent", border: "none", outline: "none", width: "100%" }}
                />

                {isDateDropdownOpen && (
                  <div
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
                    `}</style>
                    <div className="rdr-dark">
                      <DateRange
                        editableDateInputs={true}
                        onChange={(item) => {
                          const { startDate, endDate } = item.selection;
                          if (endDate >= startDate) setDateRange([item.selection]);
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

          <div className="search-actions" style={{ display: 'flex', gap: '8px' }}>
            <button className="icon-btn teal" onClick={handleSearchClick} title="Search">
              <Search size={18} />
            </button>
            {(keyword || location || dateRange[0].startDate) && (
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
