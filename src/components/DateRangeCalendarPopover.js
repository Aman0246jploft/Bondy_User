"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";

function calculateCoords(anchorEl) {
  if (!anchorEl || typeof window === "undefined") return null;
  const r = anchorEl.getBoundingClientRect();
  const w = 276;
  const h = 330;
  const x = Math.max(12, Math.min(r.left, window.innerWidth - w - 12));
  const below = r.bottom + 8;
  const y = below + h > window.innerHeight - 12 ? Math.max(12, r.top - h - 8) : below;
  return { top: y, left: x };
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Prototype Date Range Calendar Popover matching bondy-datecal.js
export default function DateRangeCalendarPopover({
  anchorRef,
  initialFrom,
  initialTo,
  language,
  t,
  onApply,
  onCancel,
}) {
  const [coords, setCoords] = useState(() => calculateCoords(anchorRef?.current));
  const panelRef = useRef(null);

  const WD_MN = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];
  const WD_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekdays = language === "mn" ? WD_MN : WD_EN;

  const [viewDate, setViewDate] = useState(() => {
    if (initialFrom) {
      const p = String(initialFrom).split("-").map(Number);
      return new Date(p[0], p[1] - 1, 1);
    }
    return new Date(2026, 8, 1); // Sep 2026 as in prototype
  });

  const [dateA, setDateA] = useState(() => {
    if (initialFrom) {
      const p = String(initialFrom).split("-").map(Number);
      return new Date(p[0], p[1] - 1, p[2]);
    }
    return null;
  });

  const [dateB, setDateB] = useState(() => {
    if (initialTo) {
      const p = String(initialTo).split("-").map(Number);
      return new Date(p[0], p[1] - 1, p[2]);
    }
    return null;
  });

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
        onCancel();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onCancel, anchorRef]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const MONTH_NAMES_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthTitle =
    language === "mn"
      ? `${year} · ${month + 1}-р сар`
      : `${year} · ${MONTH_NAMES_EN[month]}`;

  const firstDay = new Date(year, month, 1);
  const leadEmpty = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const handleDayClick = (d) => {
    if (!dateA || dateB) {
      setDateA(d);
      setDateB(null);
    } else if (d < dateA) {
      setDateB(dateA);
      setDateA(d);
    } else {
      setDateB(d);
    }
  };

  const formatDateStr = (d) => {
    if (!d) return "";
    const m = d.getMonth() + 1;
    const day = d.getDate();
    if (language === "mn") {
      return `${m}-р сарын ${day}`;
    }
    const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${shortMonths[d.getMonth()]} ${day}`;
  };

  const toIsoDate = (d) => {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const footerSummary = dateA
    ? dateB && !isSameDay(dateA, dateB)
      ? `${formatDateStr(dateA)} – ${formatDateStr(dateB)}`
      : formatDateStr(dateA)
    : (language === "mn" ? "Огноо сонгоно уу" : "Choose a date");

  const handleApply = (e) => {
    e.stopPropagation();
    if (!dateA) return;
    const a = dateA;
    const b = dateB || dateA;
    const isoA = toIsoDate(a);
    const isoB = toIsoDate(b);
    const label = isSameDay(a, b)
      ? formatDateStr(a)
      : `${formatDateStr(a)} – ${formatDateStr(b)}`;
    onApply(isoA, isoB, label);
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 767;

  return (
    <>
      {isMobile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
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
          transition: "opacity 100ms ease",
          width: isMobile ? "100%" : "276px",
          boxSizing: "border-box",
          padding: isMobile ? "10px 16px calc(16px + env(safe-area-inset-bottom, 0px))" : "12px",
          borderRadius: isMobile ? "22px 22px 0 0" : "18px",
          background: "var(--bd-ink-800)",
          border: "1px solid var(--bd-border-strong)",
          boxShadow: "0 22px 50px rgba(0,0,0,0.5)",
          zIndex: 1200,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          textAlign: "left",
        }}
      >
        {isMobile && (
          <span
            style={{
              display: "block",
              width: "38px",
              height: "4px",
              borderRadius: "2px",
              background: "rgba(255,255,255,0.22)",
              margin: "2px auto 6px",
            }}
          />
        )}

        {/* Header: Title + Cancel */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 2px 0" }}>
          <b style={{ fontFamily: "var(--bd-font-ui)", fontSize: "14.5px", fontWeight: 700, color: "var(--bd-white)" }}>
            {language === "mn" ? "Огноо сонгох" : "Choose date"}
          </b>
          <button
            type="button"
            onClick={onCancel}
            style={{
              border: "none",
              background: "none",
              color: "var(--bd-gray-500)",
              fontFamily: "var(--bd-font-ui)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              padding: "0 2px",
              height: "28px",
            }}
          >
            {language === "mn" ? "Болих" : "Cancel"}
          </button>
        </div>

        {/* Month Navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "2px 2px 0" }}>
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
              border: "1px solid var(--bd-border)",
              borderRadius: "50%",
              background: "var(--bd-ink-800)",
              color: "var(--bd-white)",
              cursor: "pointer",
              fontSize: "15px",
              lineHeight: 1,
            }}
          >
            ‹
          </button>
          <b style={{ fontFamily: "var(--bd-font-ui)", fontSize: "14px", fontWeight: 700, color: "var(--bd-white)" }}>
            {monthTitle}
          </b>
          <button
            type="button"
            onClick={handleNextMonth}
            style={{
              width: "30px",
              height: "30px",
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--bd-border)",
              borderRadius: "50%",
              background: "var(--bd-ink-800)",
              color: "var(--bd-white)",
              cursor: "pointer",
              fontSize: "15px",
              lineHeight: 1,
            }}
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
                fontSize: "10.5px",
                fontWeight: 700,
                color: "var(--bd-gray-600)",
              }}
            >
              {w}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
          {Array.from({ length: leadEmpty }).map((_, i) => (
            <span key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dNum = i + 1;
            const currentDay = new Date(year, month, dNum);
            const isEnd = isSameDay(currentDay, dateA) || isSameDay(currentDay, dateB);
            const isMid = dateA && dateB && currentDay > dateA && currentDay < dateB;

            return (
              <button
                key={dNum}
                type="button"
                onClick={() => handleDayClick(currentDay)}
                style={{
                  height: "32px",
                  border: "none",
                  borderRadius: "9px",
                  cursor: "pointer",
                  fontFamily: "var(--bd-font-ui)",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: isEnd
                    ? "var(--acc)"
                    : isMid
                      ? "rgba(35,173,164,0.18)"
                      : "transparent",
                  color: isEnd || isMid ? "var(--bd-white)" : "var(--bd-gray-300)",
                  transition: "background 120ms ease, color 120ms ease",
                }}
              >
                {dNum}
              </button>
            );
          })}
        </div>

        {/* Bottom Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            paddingTop: "2px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: "var(--bd-gray-500)",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {footerSummary}
          </span>
          <button
            type="button"
            disabled={!dateA}
            onClick={handleApply}
            style={{
              height: "36px",
              flexShrink: 0,
              padding: "0 16px",
              border: "none",
              borderRadius: "999px",
              background: "var(--acc)",
              color: "var(--bd-white)",
              fontFamily: "var(--bd-font-ui)",
              fontSize: "13px",
              fontWeight: 700,
              cursor: dateA ? "pointer" : "default",
              opacity: dateA ? 1 : 0.4,
              transition: "opacity 160ms ease",
            }}
          >
            {language === "mn" ? "Хэрэглэх" : "Apply"}
          </button>
        </div>
      </div>
    </>
  );
}
