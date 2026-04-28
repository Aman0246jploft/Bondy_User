import React, { useState, useRef, useEffect } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useLanguage } from "@/context/LanguageContext";

export default function HeroSearchFilter({ onDateChange }) {
  const { t } = useLanguage();
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: "selection",
    },
  ]);

  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const getDateRangeInputValue = () => {
    const start = dateRange[0].startDate;
    const end = dateRange[0].endDate;

    if (!start && !end) return t("selectDateRange");
    if (start && end && start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString();
    }
    if (start && end) {
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    return start ? start.toLocaleDateString() : t("selectDateRange");
  };

  const hasSelectedDate = Boolean(dateRange[0].startDate || dateRange[0].endDate);

  const handleDateClick = () => {
    if (!open && !dateRange[0].startDate && !dateRange[0].endDate) {
      const today = getTodayDate();
      const nextSelection = [{ startDate: today, endDate: today, key: "selection" }];
      setDateRange(nextSelection);
      if (onDateChange) {
        onDateChange({
          startDate: today,
          endDate: today,
        });
      }
    }
    setOpen((prev) => !prev);
  };

  const handleResetDate = (e) => {
    e.stopPropagation();
    setDateRange([
      {
        startDate: null,
        endDate: null,
        key: "selection",
      },
    ]);
    setOpen(false);
    if (onDateChange) {
      onDateChange({
        startDate: null,
        endDate: null,
      });
    }
  };

  // outside click close
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <div
        className="search-field three_field"
        ref={wrapperRef}
        style={{
          position: "relative",
          width: hasSelectedDate ? "290px" : "218px",
          maxWidth: "100%",
          transition: "width 0.2s ease",
        }}
      >
        <img src="/img/date_icon.svg" alt="date" />

        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "100%" }}>
            <small>{t("When")}</small>
            <input
              type="text"
              readOnly
              placeholder={t("selectDateRange")}
              value={getDateRangeInputValue()}
              onClick={handleDateClick}
              style={{
                color: "#aaa",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                outline: "none",
                width: "100%",
                minWidth: 0,
              }}
            />
          </div>

          {hasSelectedDate && (
            <button
              className="icon-btn bg-danger text-white border-0"
              onClick={handleResetDate}
              title="Reset Date"
              style={{
                backgroundColor: "#dc3545",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "30px",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
              }}
            >
              <span style={{ fontSize: "18px", fontWeight: "bold", lineHeight: 1 }}>
                x
              </span>
            </button>
          )}
        </div>

        {open && (
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
                  if (endDate >= startDate) {
                    setDateRange([item.selection]);
                    if (onDateChange) {
                      onDateChange({
                        startDate,
                        endDate,
                      });
                    }
                  }
                }}
                moveRangeOnFirstSelection={false}
                ranges={dateRange}
                minDate={getTodayDate()}
                color="#00b4b4"
                rangeColors={["#00b4b4"]}
              />


            </div>
            
          </div>
        )}
      </div>
    </>
  );
}
