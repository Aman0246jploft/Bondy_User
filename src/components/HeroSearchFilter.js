import React, { useState, useRef, useEffect } from "react";
export default function HeroSearchFilter() {
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState("");

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

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

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else setMonth(month + 1);
  };
  return (
    <>
      <div className="search-field three_field" ref={wrapperRef}>
        <img src="/img/date_icon.svg" alt="date" />

        <div className="date-text" onClick={() => setOpen(!open)}>
          <small>When</small>
          <span>{selectedDate || "Date"}</span>
        </div>

        {open && (
          <div className="custom-calendar">
            {/* Header */}
            <div className="calendar-header">
              <button onClick={prevMonth}>‹</button>
              <span>
                {months[month]} {year}
              </span>
              <button onClick={nextMonth}>›</button>
            </div>

            {/* Days */}
            <div className="calendar-days">
              {days.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            {/* Dates */}
            <div className="calendar-dates">
              {[...Array(firstDay)].map((_, i) => (
                <span key={i} />
              ))}

              {[...Array(totalDays)].map((_, i) => {
                const date = i + 1;
                return (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedDate(`${date}/${month + 1}/${year}`);
                      setOpen(false);
                    }}>
                    {date}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
