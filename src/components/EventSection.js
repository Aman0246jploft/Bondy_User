"use client";
import Link from "next/link";
/* 🔹 DATA */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import eventApi from "../api/eventApi";
import { useLanguage } from "@/context/LanguageContext";

const EventSection = ({
  type = "recommended",
  limit = 4,
  showSeeAll = true,
  hideHeader = false,
  isListing = false,
  customTitle = "",
  extraParams = null,
}) => {
  const { t } = useLanguage();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(customTitle);

  const handleAddInterestClick = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const profileStr = localStorage.getItem("userProfile");
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        if (profile.role === "ORGANIZER") {
          router.push("/OrganizerPersonalInfo");
        } else if (profile.role === "CUSTOMER") {
          router.push("/Personalinfo");
        } else {
          router.push("/login");
        }
      } catch (err) {
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  };

  // Map prop type to backend filter and display title
  const getFilterAndTitle = () => {
    switch (type) {
      case "recommended":
        return { filter: "recommended", defaultTitle: t("recommended") };
      case "near":
      case "nearYou":
        return { filter: "nearYou", defaultTitle: t("nearYou") };
      case "week":
        return { filter: "thisWeek", defaultTitle: t("happeningSoon") };
      default:
        return { filter: "all", defaultTitle: t("events") };
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
          status: "Upcoming,Live",
          excludemyevents: true,
          ...extraParams,
        };

        // Handle Geolocation for 'near' type
        if (filter === "nearYou") {
          // If we already have coords from props (extraParams), use them
          if (extraParams?.latitude && extraParams?.longitude) {
            params.latitude = extraParams.latitude;
            params.longitude = extraParams.longitude;
          } else {
            // Otherwise try to get them manually
            try {
              const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
              });
              params.latitude = position.coords.latitude;
              params.longitude = position.coords.longitude;
            } catch (error) {
              console.warn("Location access denied or failed", error);
              setLoading(false);
              return;
            }
          }
        }

        const response = await eventApi.getEvents(params);
        if (response.data && response.data.events) {
          let fetchedEvents = response.data.events || [];
          // Fallback if list is not fully filled (except for recommended filter)
          if (type !== "recommended" && fetchedEvents.length < limit) {
            const neededCount = limit - fetchedEvents.length;
            const fallbackParams = {
              ...params,
              limit: neededCount,
              filter: "all",
              status: "Upcoming,Live",
              excludemyevents: true,
            };
            const fallbackResponse = await eventApi.getEvents(fallbackParams);
            if (fallbackResponse?.data?.events?.length > 0) {
              const filteredFallbacks = fallbackResponse.data.events.filter(
                (fe) => !fetchedEvents.some((e) => e._id === fe._id)
              );
              fetchedEvents = [...fetchedEvents, ...filteredFallbacks].slice(0, limit);
            }
          }
          setEvents(fetchedEvents);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [type, limit, customTitle, extraParams]);

  if (loading) {
    return (
      <section className="recommended-section">
        <div className="container">
          <p>{t("loadingEvents")}</p>
        </div>
      </section>
    ); // Or a skeleton loader
  }

  // If no events and not loading, don't render the section (or render empty state)
  if (!events || events.length === 0) {
    if (type === "recommended") {
      return (
        <section className="recommended-section" style={{ position: "relative", zIndex: 2 }}>
          <div className="container" style={{ position: "relative", zIndex: 2 }}>
            {!hideHeader && (
              <div className="main_title align_title position-relative z-2 border-bottm">
                <h2>{title}</h2>
              </div>
            )}
            <div style={{ textAlign: "center", padding: "50px 20px", position: "relative", zIndex: 3 }}>
              <p style={{ color: "#888", marginBottom: "20px", fontSize: "16px" }}>
                {t("noRecommendedEvents")}
              </p>
              <button
                onClick={handleAddInterestClick}
                style={{
                  background: "#23ADA4",
                  color: "#fff",
                  border: "none",
                  padding: "12px 30px",
                  borderRadius: "50px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(35, 173, 164, 0.3)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  position: "relative",
                  zIndex: 10
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(35, 173, 164, 0.5)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(35, 173, 164, 0.3)";
                }}
              >
                {t("addInterest")}
              </button>
            </div>
          </div>
        </section>
      );
    }
    return null;
  }

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
                {t("seeAll")}
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
                    {(item.isFeatured || item.fetcherEvent) && (
                      <span className="event-badge">{t("featured")}</span>
                    )}
                    <img
                      src={
                        item.posterImage && item.posterImage[0]
                          ? item.posterImage[0]
                          : "/img/sidebar-logo.svg"
                      }
                      alt={item.eventTitle}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/img/sidebar-logo.svg";
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
                              <img src="/img/Stopwatch.svg" alt={t("timerAlt")} /> {t("timeToEndLabel")}
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
                            : t("dateTBD")}
                        </span>
                        <span>
                          <img src="/img/loc_icon.svg" alt="location" />{" "}
                          {item.venueAddress
                            ? item.venueAddress.city || t("locationLabel")
                            : t("onlineLabel")}
                        </span>
                      </div>

                      {/* <div className="price-tag">
                        from {item.minPrice ? `$${item.minPrice}` : "Free"}
                      </div> */}
                      <div className="price-tag">
                        {(() => {
                          if (!item.tickets || item.tickets.length === 0) return t("freeLabel");
                          const prices = item.tickets.map(tk => tk.price).filter(p => typeof p === 'number');
                          if (prices.length === 0) return t("freeLabel");
                          const minPrice = Math.min(...prices);
                          return minPrice === 0 ? (t("free") || "Free") : `₮${minPrice}`;
                        })()}
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
