"use client";
import Link from "next/link";
/* 🔹 DATA */
import React, { useEffect, useState } from "react";
import eventApi from "../api/eventApi";

const EventSection = ({
  type = "recommended",
  limit = 4,
  showSeeAll = true,
  hideHeader = false,
  isListing = false,
  customTitle = "",
}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(customTitle);

  // Map prop type to backend filter and display title
  const getFilterAndTitle = () => {
    switch (type) {
      case "recommended":
        return { filter: "recommended", defaultTitle: "Recommended" };
      case "near":
        return { filter: "nearYou", defaultTitle: "Near You" };
      case "week":
        return { filter: "thisWeek", defaultTitle: "Happening Soon" };
      default:
        return { filter: "all", defaultTitle: "Events" };
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const { filter, defaultTitle } = getFilterAndTitle();
        if (!customTitle) setTitle(defaultTitle);

        let params = {
          limit,
          page: 1,
          filter,
        };

        // Handle Geolocation for 'near' type
        if (filter === "nearYou") {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            params.latitude = position.coords.latitude;
            params.longitude = position.coords.longitude;
          } catch (error) {
            console.warn("Location access denied or failed", error);
            // If location fails, we might want to fallback or not show anything?
            // For now, let's just return to avoid fetching with missing lat/long which API might reject
            setLoading(false);
            return;
          }
        }

        const response = await eventApi.getEvents(params);
        if (response.data && response.data.events) {
          setEvents(response.data.events || []);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [type, limit, customTitle]);

  if (loading) {
    return (
      <section className="recommended-section">
        <div className="container">
          <p>Loading...</p>
        </div>
      </section>
    ); // Or a skeleton loader
  }

  // If no events and not loading, don't render the section (or render empty state)
  if (!events || events.length === 0) return null;

  return (
    <section className="recommended-section">
      <div className="container">
        {/* 🔹 HEADER */}
        {!hideHeader && (
          <div className="main_title align_title position-relative z-2 border-bottm">
            <h2>{title}</h2>
            {showSeeAll && (
              <Link
                href={`/Listing?type=${getFilterAndTitle().filter === "all" ? "all" : type}`}
                className="see-all"
              >
                See all
              </Link>
            )}
          </div>
        )}

        <div className="row gy-5">
          {events.map((item, index) => (
            <div key={item._id} className="col-lg-3 col-md-6 col-sm-12">
              <Link href={`/eventDetails?id=${item._id}`}>
                <div className="event_main_cart">
                  <div className="recommended-card">
                    <img
                      src={
                        item.posterImage && item.posterImage[0]
                          ? item.posterImage[0]
                          : "/img/no-image.png"
                      }
                      alt={item.eventTitle}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/img/no-image.png";
                      }}
                    />
                  </div>

                  <div className="card-overlay">
                    <div className="overlay-content">
                      {/* ⏱ TIME BOX → ONLY LISTING & ONLY 2 CARDS */}
                      {isListing && index < 2 && (
                        <div className="time_main">
                          <div className="timing_box">
                            <span>
                              <img src="/img/Stopwatch.svg" alt="timer" /> Time
                              to end
                            </span>
                            <span>06:34:15</span>
                            {/* Logic for countdown can be added later if needed */}
                          </div>
                        </div>
                      )}

                      <span className="artist-name">{item.eventTitle}</span>

                      <div className="event-meta">
                        <span>
                          <img src="/img/date_icon.svg" alt="date" />{" "}
                          {item.startDate
                            ? new Date(item.startDate).toLocaleDateString()
                            : "Date TBD"}
                        </span>
                        <span>
                          <img src="/img/loc_icon.svg" alt="location" />{" "}
                          {item.venueAddress
                            ? item.venueAddress.address
                              ? item.venueAddress.address.substring(0, 20) +
                              "..."
                              : "Location"
                            : "Online"}
                        </span>
                      </div>

                      {/* <div className="price-tag">
                        from {item.minPrice ? `$${item.minPrice}` : "Free"}
                      </div> */}
                      <div className="price-tag">
                        from{" "}
                        {item.ticketPrice ? `$${item.ticketPrice}` : "Free"}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventSection;
