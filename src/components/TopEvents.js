"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import eventApi from "@/api/eventApi";

const TopEvents = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchTopEvents = async () => {
      try {
        const response = await eventApi.getTopEvents({ limit: 10 });
        const payload = response?.data?.events || response?.data?.data?.events || [];
        setEvents(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error("Error fetching top events:", error);
        setEvents([]);
      }
    };

    fetchTopEvents();
  }, []);

  const displayEvents = useMemo(() => {
    return events.map((event, index) => {
      const startDate = event?.startDate ? new Date(event.startDate) : null;
      const dateText = startDate
        ? startDate.toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
          })
        : "Date TBA";
      const city = event?.venueAddress?.city || "Location TBA";
      const info = `${dateText}, ${city}`;
      const img =
        event?.posterImage?.[0] ||
        event?.mediaLinks?.[0] ||
        "/img/no-image.png";

      return {
        id: event?._id || `top-event-${index}`,
        name: event?.eventTitle || "Untitled Event",
        info,
        img,
      };
    });
  }, [events]);

  const doubleData = useMemo(() => {
    return [...displayEvents, ...displayEvents];
  }, [displayEvents]);

  if (!displayEvents.length) {
    return null;
  }

  return (
    <div className="events-section">
      <div className="container">
        <div className="main_title text-center">
          <h2>{t("topEvents")}</h2>
          <p>
            {t("topEventsDesc")}{" "}
            <a href="/Explore" className="text-theme-color text-decoration-underline">
              {t("youCanSeeMore")}
            </a>
          </p>
        </div>
      </div>

      <div className="slider-wrapper animate-left ">
        {doubleData.map((item, index) => (
          <div className="event-card" key={`${item.id}-left-${index}`}>
            <img
              src={item.img}
              alt={item.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/img/no-image.png";
              }}
            />
            <div>
              <h5>{item.name}</h5>
              <p>{item.info}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="slider-wrapper animate-right">
        {doubleData.map((item, index) => (
          <div className="event-card" key={`${item.id}-right-${index}`}>
            <img
              src={item.img}
              alt={item.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/img/no-image.png";
              }}
            />
            <div>
              <h5>{item.name}</h5>
              <p>{item.info}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopEvents;
