"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";

function calculateCoords(anchorEl) {
  if (!anchorEl || typeof window === "undefined") return null;
  const r = anchorEl.getBoundingClientRect();
  const w = 286;
  const h = 360;
  const x = Math.max(12, Math.min(r.left, window.innerWidth - w - 12));
  const below = r.bottom + 8;
  const y = below + h > window.innerHeight - 12 ? Math.max(12, r.top - h - 8) : below;
  return { top: y, left: x };
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Helper to parse a date string into a Date object.
 * Supports:
 * - DD.MM.YYYY
 * - YYYY-MM-DD
 */
function parseDateString(str) {
  if (!str) return null;
  const trimmed = String(str).trim();
  // Check DD.MM.YYYY
  const dotMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed);
  if (dotMatch) {
    const d = Number(dotMatch[1]);
    const m = Number(dotMatch[2]) - 1;
    const y = Number(dotMatch[3]);
    const dt = new Date(y, m, d);
    if (!Number.isNaN(dt.getTime()) && dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d) {
      return dt;
    }
  }
  // Check ISO YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(trimmed);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]) - 1;
    const d = Number(isoMatch[3]);
    const dt = new Date(y, m, d);
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return null;
}

function formatDDMMYYYY(d) {
  if (!d || Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function formatYYYYMMDD(d) {
  if (!d || Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

export default function SingleDateCalendarPopover({
  anchorRef,
  value,
  language = "en",
  t = (k) => k,
  title,
  maxDate = new Date(),
  minDate = new Date(1920, 0, 1),
  onApply,
  onCancel,
}) {
  const [coords, setCoords] = useState(() => calculateCoords(anchorRef?.current));
  const panelRef = useRef(null);

  const parsedInitial = parseDateString(value);
  const [selectedDate, setSelectedDate] = useState(() => parsedInitial);

  const [viewDate, setViewDate] = useState(() => {
    if (parsedInitial) {
      return new Date(parsedInitial.getFullYear(), parsedInitial.getMonth(), 1);
    }
    // Default to year 2000 for birthday picker, or maxDate's year
    const fallbackYear = Math.min(2000, maxDate ? maxDate.getFullYear() : 2000);
    return new Date(fallbackYear, 0, 1);
  });

  // Keep internal selectedDate in sync if external value changes
  useEffect(() => {
    const nextParsed = parseDateString(value);
    if (nextParsed) {
      setSelectedDate(nextParsed);
      setViewDate(new Date(nextParsed.getFullYear(), nextParsed.getMonth(), 1));
    }
  }, [value]);

  const WD_MN = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];
  const WD_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekdays = language === "mn" ? WD_MN : WD_EN;

  const MONTH_NAMES_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const MONTH_NAMES_MN = [
    "1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар",
    "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар"
  ];
  const monthNames = language === "mn" ? MONTH_NAMES_MN : MONTH_NAMES_EN;

  useIsomorphicLayoutEffect(() => {
    const updatePosition = () => {
      if (!anchorRef?.current) return;
      const next = calculateCoords(anchorRef.current);
      if (next) setCoords(next);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onCancel?.();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel, anchorRef]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const minYear = minDate ? minDate.getFullYear() : 1920;
  const maxYear = maxDate ? maxDate.getFullYear() : new Date().getFullYear();
  const years = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

  const firstDay = new Date(year, month, 1);
  const leadEmpty = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    const nextDate = new Date(year, month + 1, 1);
    if (maxDate && nextDate > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) {
      return;
    }
    setViewDate(nextDate);
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isDayDisabled = (d) => {
    if (maxDate) {
      const eod = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate(), 23, 59, 59, 999);
      if (d > eod) return true;
    }
    if (minDate) {
      const sod = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate(), 0, 0, 0, 0);
      if (d < sod) return true;
    }
    return false;
  };

  const handleDayClick = (d) => {
    if (isDayDisabled(d)) return;
    setSelectedDate(d);
  };

  const handleDayDoubleClick = (d) => {
    if (isDayDisabled(d)) return;
    setSelectedDate(d);
    const formatted = formatDDMMYYYY(d);
    const iso = formatYYYYMMDD(d);
    onApply?.(formatted, iso);
  };

  const handleApplyClick = (e) => {
    e.stopPropagation();
    if (!selectedDate) return;
    const formatted = formatDDMMYYYY(selectedDate);
    const iso = formatYYYYMMDD(selectedDate);
    onApply?.(formatted, iso);
  };

  const handleClearClick = (e) => {
    e.stopPropagation();
    setSelectedDate(null);
    onApply?.("", "");
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 767;

  const displayTitle =
    title || (language === "mn" ? "Огноо сонгох" : "Choose date");

  const footerSummary = selectedDate
    ? formatDDMMYYYY(selectedDate)
    : (language === "mn" ? "Огноо сонгоно уу" : "Choose a date");

  const canGoNextMonth =
    !maxDate || new Date(year, month + 1, 1) <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  return (
    <>
      {isMobile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(2px)",
            zIndex: 1199,
          }}
          onClick={onCancel}
        />
      )}
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: isMobile ? "auto" : `${coords?.top ?? 0}px`,
          left: isMobile ? "0" : `${coords?.left ?? 0}px`,
          right: isMobile ? "0" : "auto",
          bottom: isMobile ? "0" : "auto",
          opacity: coords ? 1 : 0,
          visibility: coords ? "visible" : "hidden",
          pointerEvents: coords ? "auto" : "none",
          transition: "opacity 120ms ease",
          width: isMobile ? "100%" : "286px",
          boxSizing: "border-box",
          padding: isMobile ? "12px 16px calc(18px + env(safe-area-inset-bottom, 0px))" : "14px",
          borderRadius: isMobile ? "22px 22px 0 0" : "18px",
          background: "var(--bd-ink-800, #131b2e)",
          border: "1px solid var(--bd-border-strong, rgba(255,255,255,0.14))",
          boxShadow: "0 22px 50px rgba(0,0,0,0.55)",
          zIndex: 1200,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          textAlign: "left",
          fontFamily: "var(--bd-font-ui, system-ui, -apple-system, sans-serif)",
        }}
      >
        {isMobile && (
          <span
            style={{
              display: "block",
              width: "38px",
              height: "4px",
              borderRadius: "2px",
              background: "rgba(255,255,255,0.25)",
              margin: "2px auto 8px",
            }}
          />
        )}

        {/* Header: Title + Cancel */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 2px 0" }}>
          <b style={{ fontSize: "14px", fontWeight: 700, color: "var(--bd-white, #fff)" }}>
            {displayTitle}
          </b>
          <button
            type="button"
            onClick={onCancel}
            style={{
              border: "none",
              background: "none",
              color: "var(--bd-gray-500, #9ca3af)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: "6px",
              transition: "color 150ms ease",
            }}
          >
            {language === "mn" ? "Болих" : "Cancel"}
          </button>
        </div>

        {/* Month & Year Navigation + Dropdowns */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "6px",
            padding: "2px 0",
          }}
        >
          <button
            type="button"
            onClick={handlePrevMonth}
            style={{
              width: "30px",
              height: "30px",
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--bd-border, rgba(255,255,255,0.12))",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              color: "var(--bd-white, #fff)",
              cursor: "pointer",
              fontSize: "16px",
              lineHeight: 1,
              transition: "background 150ms ease",
            }}
            title={language === "mn" ? "Өмнөх сар" : "Previous month"}
          >
            ‹
          </button>

          {/* Month & Year Selects for effortless jump */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <select
              value={month}
              onChange={(e) => {
                const newM = Number(e.target.value);
                setViewDate(new Date(year, newM, 1));
              }}
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "var(--bd-white, #fff)",
                border: "1px solid var(--bd-border, rgba(255,255,255,0.14))",
                borderRadius: "8px",
                padding: "4px 8px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {monthNames.map((name, idx) => (
                <option
                  key={name}
                  value={idx}
                  style={{ background: "#131b2e", color: "#ffffff" }}
                >
                  {name}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => {
                const newY = Number(e.target.value);
                setViewDate(new Date(newY, month, 1));
              }}
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "var(--bd-white, #fff)",
                border: "1px solid var(--bd-border, rgba(255,255,255,0.14))",
                borderRadius: "8px",
                padding: "4px 8px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {years.map((y) => (
                <option
                  key={y}
                  value={y}
                  style={{ background: "#131b2e", color: "#ffffff" }}
                >
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            disabled={!canGoNextMonth}
            style={{
              width: "30px",
              height: "30px",
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--bd-border, rgba(255,255,255,0.12))",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              color: canGoNextMonth ? "var(--bd-white, #fff)" : "var(--bd-gray-600, #4b5563)",
              cursor: canGoNextMonth ? "pointer" : "not-allowed",
              opacity: canGoNextMonth ? 1 : 0.35,
              fontSize: "16px",
              lineHeight: 1,
              transition: "background 150ms ease",
            }}
            title={language === "mn" ? "Дараах сар" : "Next month"}
          >
            ›
          </button>
        </div>

        {/* Weekdays */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
          {weekdays.map((w) => (
            <span
              key={w}
              style={{
                height: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--bd-gray-500, #9ca3af)",
              }}
            >
              {w}
            </span>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
          {Array.from({ length: leadEmpty }).map((_, i) => (
            <span key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dNum = i + 1;
            const currentDay = new Date(year, month, dNum);
            const isSelected = isSameDay(currentDay, selectedDate);
            const disabled = isDayDisabled(currentDay);
            const isToday = isSameDay(currentDay, new Date());

            return (
              <button
                key={dNum}
                type="button"
                disabled={disabled}
                onClick={() => handleDayClick(currentDay)}
                onDoubleClick={() => handleDayDoubleClick(currentDay)}
                style={{
                  height: "32px",
                  border: isToday && !isSelected ? "1px solid rgba(35,173,164,0.4)" : "none",
                  borderRadius: "9px",
                  cursor: disabled ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected
                    ? "var(--acc, #23ada4)"
                    : "transparent",
                  color: isSelected
                    ? "var(--bd-white, #fff)"
                    : disabled
                      ? "var(--bd-gray-600, #4b5563)"
                      : "var(--bd-gray-300, #d1d5db)",
                  opacity: disabled ? 0.35 : 1,
                  transition: "background 120ms ease, color 120ms ease, transform 100ms ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  outline: "none",
                }}
              >
                {dNum}
              </button>
            );
          })}
        </div>

        {/* Bottom Footer: Date Display + Clear + Apply Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            paddingTop: "4px",
            borderTop: "1px solid var(--bd-border, rgba(255,255,255,0.08))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: selectedDate ? "var(--acc, #23ada4)" : "var(--bd-gray-500, #9ca3af)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {footerSummary}
            </span>
            {selectedDate && (
              <button
                type="button"
                onClick={handleClearClick}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--bd-gray-500, #9ca3af)",
                  fontSize: "11px",
                  cursor: "pointer",
                  padding: "0 4px",
                  textDecoration: "underline",
                }}
              >
                {language === "mn" ? "Цэвэрлэх" : "Clear"}
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={!selectedDate}
            onClick={handleApplyClick}
            style={{
              height: "34px",
              flexShrink: 0,
              padding: "0 16px",
              border: "none",
              borderRadius: "999px",
              background: "var(--acc, #23ada4)",
              color: "var(--bd-white, #fff)",
              fontSize: "13px",
              fontWeight: 700,
              cursor: selectedDate ? "pointer" : "default",
              opacity: selectedDate ? 1 : 0.45,
              transition: "opacity 160ms ease, transform 100ms ease",
            }}
          >
            {language === "mn" ? "Хэрэглэх" : "Apply"}
          </button>
        </div>
      </div>
    </>
  );
}
