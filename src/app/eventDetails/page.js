"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import eventApi from "@/api/eventApi";
import wishlistApi from "@/api/wishlistApi";
import { useAuthGuard } from "@/context/AuthGuardContext";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import { formatTime } from "@/utils/timeHelper";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShareSheet from "@/components/ShareSheet";
import { useUserLocation, extractCoordinates, calcDistanceKm, formatDistance } from "@/utils/locationHelper";
import GlobalLoader from "@/components/GlobalLoader";
import LocationPreviewMap from "@/components/LocationPreviewMap";

const FALLBACK_IMG = "/img/sidebar-logo.svg";

const MONTH_KEYS = ["monthJan", "monthFeb", "monthMar", "monthApr", "monthMay", "monthJun", "monthJul", "monthAug", "monthSep", "monthOct", "monthNov", "monthDec"];
const WEEKDAY_KEYS = ["weekdaySun", "weekdayMon", "weekdayTue", "weekdayWed", "weekdayThu", "weekdayFri", "weekdaySat"];

function formatDateBilingual(dateStr, startTime, endTime, lang, t, endDateStr) {
  if (!dateStr) return t("comingSoon");
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return t("comingSoon");

  const dayNum = d.getDate();
  const dayName = t(WEEKDAY_KEYS[d.getDay()]);
  const monthName = `${t(MONTH_KEYS[d.getMonth()])} ${dayNum}`;

  let timePart = "";
  if (startTime) {
    const s = formatTime(startTime, true, lang);
    const e = endTime ? formatTime(endTime, true, lang) : "";
    timePart = e ? ` · ${s} – ${e}` : ` · ${s}`;
  }

  if (endDateStr) {
    const endD = new Date(endDateStr);
    if (!isNaN(endD.getTime())) {
      const isSameDay =
        d.getFullYear() === endD.getFullYear() &&
        d.getMonth() === endD.getMonth() &&
        d.getDate() === endD.getDate();
      if (!isSameDay) {
        const endDayNum = endD.getDate();
        const endDayName = t(WEEKDAY_KEYS[endD.getDay()]);
        const endMonthName = `${t(MONTH_KEYS[endD.getMonth()])} ${endDayNum}`;
        return `${monthName}, ${dayName} – ${endMonthName}, ${endDayName}${timePart}`;
      }
    }
  }

  return `${monthName}, ${dayName}${timePart}`;
}

function getMinTicketPrice(tickets) {
  if (!tickets || tickets.length === 0) return null;
  const prices = tickets.map((tk) => Number(tk.price)).filter((p) => !isNaN(p) && p >= 0);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

// ─── Photo Gallery Lightbox & Grid Modal ───────────────────────────────────────
function GalleryModal({ isOpen, onClose, items, initialIndex = 0, initialMode = "carousel" }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(initialIndex);
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const handlePrev = useCallback(() => {
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const handleNext = useCallback(() => {
    setIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (mode === "carousel") {
        if (e.key === "ArrowLeft") handlePrev();
        if (e.key === "ArrowRight") handleNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, mode, onClose, handlePrev, handleNext]);

  if (!isOpen || !items || items.length === 0) return null;

  const currentItem = items[index] || items[0];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(5, 5, 8, 0.94)",
        backdropFilter: "blur(20px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "clamp(12px, 2vw, 24px)",
      }}
    >
      {/* Top Header Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <b style={{ fontSize: 18, color: "var(--bd-white)", fontWeight: 700 }}>
            {t("photoGallery")}
          </b>
          <span
            style={{
              padding: "3px 10px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--acc-bright)",
            }}
          >
            {mode === "carousel" ? `${index + 1} / ${items.length}` : `${items.length} ${t("galleryItems")}`}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Mode Switcher: Grid vs Single */}
          <button
            type="button"
            onClick={() => setMode(mode === "carousel" ? "grid" : "carousel")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 38,
              padding: "0 14px",
              borderRadius: 999,
              border: "1px solid var(--bd-border)",
              background: "var(--bd-ink-800)",
              color: "var(--bd-white)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {mode === "carousel" ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>{t("allPhotos")}</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
                <span>{t("slideshow")}</span>
              </>
            )}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              border: "1px solid var(--bd-border)",
              background: "var(--bd-ink-800)",
              color: "var(--bd-white)",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 1200,
          margin: "12px auto",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {mode === "carousel" ? (
          <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Prev button */}
            {items.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous"
                style={{
                  position: "absolute",
                  left: 8,
                  zIndex: 20,
                  width: 46,
                  height: 46,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(15,15,18,0.7)",
                  backdropFilter: "blur(10px)",
                  color: "var(--bd-white)",
                  fontSize: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                ‹
              </button>
            )}

            {/* Active media container */}
            <div style={{ maxWidth: "88vw", maxHeight: "68vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {currentItem.type === "video" ? (
                <video
                  src={currentItem.url}
                  controls
                  autoPlay
                  style={{ maxWidth: "100%", maxHeight: "68vh", borderRadius: 16 }}
                />
              ) : (
                <img
                  src={currentItem.url}
                  alt={`Gallery photo ${index + 1}`}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMG;
                  }}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "68vh",
                    objectFit: "contain",
                    borderRadius: 16,
                    boxShadow: "0 20px 60px rgba(0,0,0,.6)",
                  }}
                />
              )}
            </div>

            {/* Next button */}
            {items.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next"
                style={{
                  position: "absolute",
                  right: 8,
                  zIndex: 20,
                  width: 46,
                  height: 46,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(15,15,18,0.7)",
                  backdropFilter: "blur(10px)",
                  color: "var(--bd-white)",
                  fontSize: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                ›
              </button>
            )}
          </div>
        ) : (
          /* Grid View of ALL photos */
          <div
            style={{
              width: "100%",
              height: "100%",
              maxHeight: "calc(88vh - 80px)",
              overflowY: "auto",
              padding: "14px 6px 30px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 16,
              alignContent: "start",
            }}
          >
            {items.map((item, i) => (
              <div
                key={i}
                onClick={() => {
                  setIndex(i);
                  setMode("carousel");
                }}
                className="gallery-grid-thumb"
                title={t("viewPhoto", { n: i + 1 })}
                style={{
                  aspectRatio: "4/3",
                  borderRadius: 14,
                  overflow: "hidden",
                  border: i === index ? "2px solid var(--acc)" : "1px solid var(--bd-border)",
                  cursor: "pointer",
                  position: "relative",
                  background: "var(--bd-ink-800)",
                }}
              >
                {item.type === "video" ? (
                  <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <img
                    src={item.url}
                    alt={`Photo ${i + 1}`}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMG;
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
                {/* Photo sequence badge */}
                <span
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "rgba(0, 0, 0, 0.65)",
                    backdropFilter: "blur(4px)",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--bd-white)",
                    lineHeight: 1,
                  }}
                >
                  #{i + 1}
                </span>

                {item.type === "video" ? (
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0, 0, 0, 0.35)",
                      color: "#fff",
                      fontSize: 26,
                    }}
                  >
                    ▶
                  </span>
                ) : (
                  <div
                    className="thumb-hover-overlay"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0, 0, 0, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0,
                      transition: "opacity 200ms ease",
                    }}
                  >
                    <span
                      style={{
                        padding: "6px 14px",
                        borderRadius: 999,
                        background: "rgba(255, 255, 255, 0.2)",
                        backdropFilter: "blur(8px)",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {t("expand")}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Thumbnail Strip (in Carousel mode) */}
      {mode === "carousel" && items.length > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            overflowX: "auto",
            padding: "8px 4px",
            maxWidth: 1200,
            width: "100%",
            margin: "0 auto",
          }}
        >
          {items.map((it, idx) => {
            const isActive = idx === index;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setIndex(idx)}
                style={{
                  flex: "0 0 68px",
                  height: 48,
                  borderRadius: 10,
                  overflow: "hidden",
                  border: isActive ? "2px solid var(--acc-bright)" : "1px solid var(--bd-border)",
                  opacity: isActive ? 1 : 0.6,
                  cursor: "pointer",
                  padding: 0,
                  background: "var(--bd-ink-800)",
                  transition: "opacity 160ms, border-color 160ms",
                }}
              >
                {it.type === "video" ? (
                  <video src={it.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <img
                    src={it.url}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMG;
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EventDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");
  const { language, t } = useLanguage();
  const { checkAuth } = useAuthGuard();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState(null);
  const [similarEvents, setSimilarEvents] = useState([]);
  const [refundPolicy, setRefundPolicy] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryInitialIdx, setGalleryInitialIdx] = useState(0);
  const [galleryInitialMode, setGalleryInitialMode] = useState("carousel");
  const [favorites, setFavorites] = useState({});
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [ticketQtys, setTicketQtys] = useState({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bondy_favorites");
      if (saved) setFavorites(JSON.parse(saved));
    } catch (_) { }
  }, []);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    const fetchEventDetails = async () => {
      setLoading(true);
      try {
        const response = await eventApi.getEventDetails(eventId);
        if (cancelled) return;
        if (response?.status) {
          const evt = response?.data?.event;
          setEvent(evt);
          setAttendees(response?.data?.attendees);
          setSimilarEvents(response?.data?.similarEvents || []);
          setRefundPolicy(response?.data?.refundPolicy || evt?.refundPolicy || "");
          setIsWishlisted(Boolean(evt?.isWishlisted));

          if (evt?.tickets && evt.tickets.length > 0) {
            const initQtys = {};
            // Find first available ticket tier that is not sold out
            const firstAvailIdx = evt.tickets.findIndex((tk) => {
              const avail = tk.availableQty !== undefined ? Number(tk.availableQty) : Number(tk.qty || 0);
              return avail > 0;
            });
            evt.tickets.forEach((tk, idx) => {
              initQtys[tk._id || idx] = (firstAvailIdx !== -1 && idx === firstAvailIdx) ? 1 : 0;
            });
            setTicketQtys(initQtys);
          }
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchEventDetails();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    if (event?.eventTitle) {
      document.title = `${event.eventTitle} | Bondy`;
    }
  }, [event]);

  const handleWishlistToggle = () => {
    checkAuth(async () => {
      if (wishlistLoading || !eventId) return;
      setWishlistLoading(true);

      try {
        if (isWishlisted) {
          const response = await wishlistApi.removeFromWishlist({ entityId: eventId });
          if (response?.status === true) {
            toast.success(t("removedFromFavourites") || "Removed from Favourites");
            setIsWishlisted(false);
          }
        } else {
          const response = await wishlistApi.addToWishlist({
            entityId: eventId,
            entityModel: "Event",
          });
          if (response?.status === true) {
            setIsWishlisted(true);
            toast.success(t("addedToFavourites") || "Added to Favourites");
          }
        }
      } catch (error) {
        console.error("Wishlist toggle error:", error);
      } finally {
        setWishlistLoading(false);
      }
    });
  };

  const handleSimilarFavoriteToggle = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    checkAuth(() => {
      setFavorites((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        localStorage.setItem("bondy_favorites", JSON.stringify(next));
        toast.success(next[id]
          ? (t("addedToFavourites") || "Added to Favourites")
          : (t("removedFromFavourites") || "Removed from Favourites"));
        return next;
      });
      try {
        const token = localStorage.getItem("token");
        if (token) {
          if (!favorites[id]) {
            wishlistApi.addToWishlist({ entityId: id, entityModel: "Event" }).catch(() => { });
          } else {
            wishlistApi.removeFromWishlist({ entityId: id }).catch(() => { });
          }
        }
      } catch (_) { }
    });
  };

  const handleShare = () => {
    setShareUrl(typeof window !== "undefined" ? window.location.href : "");
    setShareOpen(true);
  };

  // Collect all media items: poster images + media links + videos (with deduplication)
  const mediaItems = useMemo(() => {
    const items = [];
    const seen = new Set();

    const add = (raw, type) => {
      if (!raw || typeof raw !== "string") return;
      const trimmed = raw.trim();
      if (!trimmed) return;
      const url = getFullImageUrl(trimmed);
      if (url && !seen.has(url)) {
        seen.add(url);
        items.push({ type, url });
      }
    };

    if (event?.posterImage) {
      const posters = Array.isArray(event.posterImage) ? event.posterImage : [event.posterImage];
      posters.forEach((p) => add(p, "image"));
    }
    if (event?.mediaLinks) {
      const links = Array.isArray(event.mediaLinks) ? event.mediaLinks : [event.mediaLinks];
      links.forEach((m) => add(m, "image"));
    }
    if (event?.shortTeaserVideo) {
      const teasers = Array.isArray(event.shortTeaserVideo) ? event.shortTeaserVideo : [event.shortTeaserVideo];
      teasers.forEach((v) => add(v, "video"));
    }
    return items.length > 0 ? items : [{ type: "image", url: FALLBACK_IMG }];
  }, [event]);

  const heroImage = useMemo(() => {
    if (mediaItems.length > 0) {
      const firstImg = mediaItems.find((m) => m.type === "image");
      return firstImg?.url || FALLBACK_IMG;
    }
    return FALLBACK_IMG;
  }, [mediaItems]);

  const minPrice = useMemo(() => {
    if (event?.isFreeEvent) return 0;
    const fromTickets = getMinTicketPrice(event?.tickets);
    if (fromTickets != null) return fromTickets;
    if (event?.price != null && !isNaN(Number(event.price))) return Number(event.price);
    return null;
  }, [event]);

  const formattedMinPrice = useMemo(() => {
    if (minPrice === 0 || event?.isFreeEvent) {
      return t("freePrice");
    }
    if (minPrice != null && minPrice > 0) {
      return `₮${minPrice.toLocaleString()}`;
    }
    return t("freePrice");
  }, [minPrice, event, language]);

  const formattedDateTime = useMemo(() => {
    return formatDateBilingual(event?.startDate, event?.startTime, event?.endTime, language, t, event?.endDate);
  }, [event, language, t]);

  const fullVenue = useMemo(() => {
    const parts = [];
    if (event?.venueName) parts.push(event.venueName);
    if (event?.venueAddress?.address) parts.push(event.venueAddress.address);
    if (event?.venueAddress?.city) parts.push(event.venueAddress.city);
    return parts.join(", ") || (t("defaultVenueCity"));
  }, [event, language]);

  // ─── Real Distance to Venue ──────────────────────────────────────────────
  const userCoords = useUserLocation();
  const eventCoords = useMemo(() => extractCoordinates(event), [event]);
  const realDistanceKm = useMemo(() => {
    if (!userCoords?.latitude || !userCoords?.longitude || !eventCoords) return null;
    return calcDistanceKm(userCoords.latitude, userCoords.longitude, eventCoords.latitude, eventCoords.longitude);
  }, [userCoords, eventCoords]);

  // ─── Event Date & Past Status Validation ─────────────────────────────────
  const isPastEvent = useMemo(() => {
    if (!event) return false;

    // Status flag check
    if (event.status && ["past", "completed", "expired", "cancelled", "ended"].includes(event.status.toLowerCase())) {
      return true;
    }

    const now = new Date();

    // Check end date/time if provided
    if (event.endDate) {
      const end = new Date(event.endDate);
      if (event.endTime) {
        const [h, m] = String(event.endTime).split(":").map(Number);
        end.setHours(h || 23, m || 59, 59, 999);
      } else {
        end.setHours(23, 59, 59, 999);
      }
      if (!isNaN(end.getTime()) && end < now) return true;
    } else if (event.startDate) {
      // If only startDate is provided
      const start = new Date(event.startDate);
      if (event.startTime) {
        const [h, m] = String(event.startTime).split(":").map(Number);
        start.setHours(h || 0, m || 0, 0, 0);
      } else {
        start.setHours(23, 59, 59, 999);
      }
      // If the event day has passed
      const startDayEnd = new Date(start);
      startDayEnd.setHours(23, 59, 59, 999);
      if (startDayEnd < now) return true;
    }

    // Booking cutoff check
    if (event.bookingCutOff && event.startDate) {
      const match = String(event.bookingCutOff).match(/^(\d+)([hmdw])$/i);
      if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        let ms = 0;
        if (unit === "h") ms = value * 60 * 60 * 1000;
        else if (unit === "m") ms = value * 60 * 1000;
        else if (unit === "d") ms = value * 24 * 60 * 60 * 1000;
        else if (unit === "w") ms = value * 7 * 24 * 60 * 60 * 1000;

        const start = new Date(event.startDate);
        if (event.startTime) {
          const [h, m] = String(event.startTime).split(":").map(Number);
          start.setHours(h || 0, m || 0, 0, 0);
        }
        const cutoffTime = new Date(start.getTime() - ms);
        if (cutoffTime < now) return true;
      }
    }

    return false;
  }, [event]);

  // ─── Seat & Ticket Capacity Validation ───────────────────────────────────
  const { isSoldOut, totalAvailableSeats, remainingSeatsText } = useMemo(() => {
    if (!event) return { isSoldOut: false, totalAvailableSeats: null, remainingSeatsText: null };

    // 1. Check overall event ticketQtyAvailable
    if (event.ticketQtyAvailable !== undefined && Number(event.ticketQtyAvailable) <= 0) {
      return { isSoldOut: true, totalAvailableSeats: 0, remainingSeatsText: null };
    }

    // 2. Check ticket tiers
    if (event.tickets && event.tickets.length > 0) {
      let totalAvail = 0;
      let hasAvailabilityData = false;

      event.tickets.forEach((t) => {
        const avail = t.availableQty !== undefined ? Number(t.availableQty) : (t.qty !== undefined ? Number(t.qty) : null);
        if (avail !== null) {
          hasAvailabilityData = true;
          totalAvail += Math.max(0, avail);
        }
      });

      if (hasAvailabilityData && totalAvail <= 0) {
        return { isSoldOut: true, totalAvailableSeats: 0, remainingSeatsText: null };
      }

      if (totalAvail > 0 && totalAvail <= 10) {
        const text = t("onlySeatsLeft", { count: totalAvail });
        return { isSoldOut: false, totalAvailableSeats: totalAvail, remainingSeatsText: text };
      }

      return { isSoldOut: false, totalAvailableSeats: totalAvail, remainingSeatsText: null };
    }

    return { isSoldOut: false, totalAvailableSeats: null, remainingSeatsText: null };
  }, [event, language]);

  // Ticket totals
  const ticketTotals = useMemo(() => {
    if (isPastEvent || isSoldOut) {
      return { qty: 0, subtotal: 0 };
    }
    if (!event?.tickets || event.tickets.length === 0) {
      return { qty: 1, subtotal: minPrice || 0 };
    }
    let qty = 0;
    let subtotal = 0;
    event.tickets.forEach((tk, idx) => {
      const avail = tk.availableQty !== undefined ? Number(tk.availableQty) : Number(tk.qty || 0);
      const isTierSold = avail <= 0;
      const now = new Date();
      const salesStarted = tk.salesStart ? now >= new Date(tk.salesStart) : true;
      const salesEnded = tk.salesEnd ? now > new Date(tk.salesEnd) : false;
      const isSalesActive = salesStarted && !salesEnded;
      const q = (isTierSold || !isSalesActive) ? 0 : (ticketQtys[tk._id || idx] || 0);
      qty += q;
      subtotal += q * (Number(tk.price) || 0);
    });
    return { qty, subtotal };
  }, [event, ticketQtys, minPrice, isPastEvent, isSoldOut]);

  const allSalesPending = useMemo(() => {
    if (!event?.tickets || event.tickets.length === 0) return false;
    const now = new Date();
    return event.tickets.every((tk) => tk.salesStart && now < new Date(tk.salesStart));
  }, [event]);

  const earliestSalesStart = useMemo(() => {
    if (!event?.tickets || event.tickets.length === 0) return null;
    const now = new Date();
    const futureStarts = event.tickets
      .filter((tk) => tk.salesStart && now < new Date(tk.salesStart))
      .map((tk) => new Date(tk.salesStart));
    if (futureStarts.length === 0) return null;
    return new Date(Math.min(...futureStarts));
  }, [event]);

  const handleStepTicket = (tkId, delta) => {
    if (isPastEvent || isSoldOut) return;
    const ticket = event?.tickets?.find((t, i) => (t._id || i) === tkId || String(t._id) === String(tkId));
    const available = ticket?.availableQty !== undefined ? Number(ticket.availableQty) : Number(ticket?.qty || 0);

    if (ticket && delta > 0) {
      const now = new Date();
      if (ticket.salesStart && now < new Date(ticket.salesStart)) {
        const startStr = new Date(ticket.salesStart).toLocaleDateString();
        toast.error(
          language === "mn"
            ? `Тасалбарын борлуулалт ${startStr}-нд эхэлнэ: ${ticket.ticketName}`
            : `Sales start on ${startStr} for ${ticket.ticketName}`
        );
        return;
      }
      if (ticket.salesEnd && now > new Date(ticket.salesEnd)) {
        toast.error(
          language === "mn"
            ? `Тасалбарын борлуулалт дууссан: ${ticket.ticketName}`
            : `Sales ended for ticket: ${ticket.ticketName}`
        );
        return;
      }
    }

    if (delta > 0 && available <= 0) return;

    setTicketQtys((prev) => {
      const cur = prev[tkId] || 0;
      let next = cur + delta;
      if (delta > 0 && available > 0 && next > available) {
        next = available;
      }
      next = Math.max(0, next);
      return { ...prev, [tkId]: next };
    });
  };

  const handleGoToBooking = () => {
    if (!eventId) return;
    if (isPastEvent) {
      toast.error(t("eventAlreadyEnded"));
      return;
    }
    if (isSoldOut) {
      toast.error(t("allTicketsSoldOut"));
      return;
    }
    if (allSalesPending) {
      const dateStr = earliestSalesStart ? earliestSalesStart.toLocaleDateString() : "";
      toast.error(
        language === "mn"
          ? `Энэ эвентийн тасалбарын борлуулалт хараахан эхлээгүй байна (${dateStr}-нд эхэлнэ).`
          : `Ticket sales have not started yet. Sales start on ${dateStr}.`
      );
      return;
    }
    if (event?.tickets && event.tickets.length > 0 && ticketTotals.qty <= 0) {
      toast.error(t("selectAtLeastOneTicket"));
      return;
    }
    const now = new Date();
    const picked = Object.entries(ticketQtys)
      .filter(([id, q]) => {
        const num = Number(q);
        if (num <= 0) return false;
        const tk = event?.tickets?.find((t, i) => (t._id || i) === id || String(t._id) === String(id));
        const avail = tk?.availableQty !== undefined ? Number(tk.availableQty) : Number(tk?.qty || 0);
        const salesStarted = tk?.salesStart ? now >= new Date(tk.salesStart) : true;
        const salesEnded = tk?.salesEnd ? now > new Date(tk.salesEnd) : false;
        return avail > 0 && salesStarted && !salesEnded;
      })
      .map(([id, q]) => `${id}:${q}`)
      .join(",");

    checkAuth(() => {
      router.push(`/eventbooking?eventId=${eventId}${picked ? `&tickets=${encodeURIComponent(picked)}` : ""}`);
    });
  };

  const openGalleryModal = (startIdx = 0, startMode = "carousel") => {
    setGalleryInitialIdx(startIdx);
    setGalleryInitialMode(startMode);
    setGalleryModalOpen(true);
  };

  // Things to know (Мэдэх зүйлс)
  const knowRows = useMemo(() => {
    const list = [];
    if (event?.ageRestriction) {
      list.push({
        key: "age",
        label: t("ageLimit"),
        value: event.ageRestriction,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="3.4" />
            <path d="M4.6 19.6c0-3.2 3.3-4.9 7.4-4.9s7.4 1.7 7.4 4.9" />
          </svg>
        ),
      });
    }
    if (event?.dressCode) {
      list.push({
        key: "dress",
        label: t("evtDressCode"),
        value: event.dressCode,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3.6 5.1 5.3a1 1 0 0 0-.55.62L3.3 9.55a.6.6 0 0 0 .37.75l2.1.72a.6.6 0 0 0 .76-.38l.32-.95V20.4h10.3V9.69l.32.95a.6.6 0 0 0 .76.38l2.1-.72a.6.6 0 0 0 .37-.75l-1.25-3.63a1 1 0 0 0-.55-.62L15 3.6" />
            <path d="M9 3.6a3 3 0 0 0 6 0" />
          </svg>
        ),
      });
    }
    if (event?.notes) {
      list.push({
        key: "entry",
        label: t("entryLabel"),
        value: event.notes,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2.6" y="5" width="18.8" height="14" rx="3.2" />
            <circle cx="8.6" cy="10.7" r="2" />
            <path d="M5.5 15.9c.5-1.4 1.7-2.1 3.1-2.1s2.6.7 3.1 2.1" />
            <path d="M14.9 10h4.1M14.9 13.4h4.1" />
          </svg>
        ),
      });
    }
    const ref = refundPolicy || event?.refundPolicy;
    if (ref) {
      list.push({
        key: "refund",
        label: t("evtRefundLabel"),
        value: ref,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        ),
      });
    }
    return list;
  }, [event, refundPolicy, language]);

  if (loading) {
    return <GlobalLoader fullScreen />;
  }

  if (!event) {
    return (
      <div style={{ width: "100%", background: "var(--bd-ink-900)", minHeight: "100vh" }}>
        <Header />
        <main style={{ maxWidth: 1224, margin: "0 auto", padding: "100px 24px", textAlign: "center" }}>
          <h2 style={{ color: "var(--bd-white)", fontSize: 24, fontWeight: 700 }}>
            {t("eventNotFound")}
          </h2>
          <p style={{ color: "var(--bd-gray-400)", marginTop: 12 }}>
            {t("eventNotFoundHint")}
          </p>
          <Link
            href="/Explore"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 20,
              padding: "10px 22px",
              borderRadius: 999,
              background: "var(--acc)",
              color: "var(--bd-white)",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {t("browseOtherEvents")}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const organizerName = event?.createdBy
    ? `${event.createdBy.firstName || ""} ${event.createdBy.lastName || ""}`.trim() || event.createdBy.name || "Organizer"
    : "Bondy Organizer";

  const organizerAvatar = event?.createdBy?.profileImage
    ? getFullImageUrl(event.createdBy.profileImage)
    : FALLBACK_IMG;

  const isVerifiedOrganizer = Boolean(event?.createdBy?.isVerified);

  const googleMapsUrl = event?.venueAddress?.latitude && event?.venueAddress?.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${event.venueAddress.latitude},${event.venueAddress.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullVenue)}`;

  return (
    <div style={{ width: "100%", background: "var(--bd-ink-900)", minHeight: "100vh", overflowX: "hidden" }}>
      <Header />

      <main id="top" data-screen-label="Event detail" style={{ maxWidth: 1224, margin: "0 auto", padding: "clamp(20px, 2.4vw, 28px) clamp(20px, 4vw, 32px) clamp(56px, 5vw, 80px)" }}>

        {/* ─── Breadcrumb ──────────────────────────────────────────────────────── */}
        <nav className="bd-crumb" aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--bd-gray-600)", marginBottom: 16, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "var(--bd-gray-600)" }}>
            {t("home")}
          </Link>
          <span>/</span>
          <Link href="/Explore" style={{ color: "var(--bd-gray-600)" }}>
            {t("eventCrumb")}
          </Link>
          <span>/</span>
          <span style={{ color: "var(--bd-gray-400)" }}>
            {event.eventTitle}
          </span>
        </nav>

        {/* ─── Hero Media Banner ───────────────────────────────────────────────── */}
        <div className="bd-hero" style={{ position: "relative", height: "clamp(240px, 28vw, 380px)", borderRadius: 24, overflow: "hidden", border: "1px solid var(--bd-border)" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "var(--bd-ink-800)",
              backgroundImage: `url(${heroImage})`,
              backgroundPosition: "center 45%",
              backgroundSize: heroImage.includes("sidebar-logo.svg") ? "220px auto" : "cover",
              backgroundRepeat: "no-repeat",
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,8,8,.42) 0%, transparent 38%, rgba(10,10,10,.86) 100%)" }} />

          {/* Hidden image with error listener to fallback smoothly */}
          <img
            src={heroImage}
            alt=""
            style={{ display: "none" }}
            onError={(e) => {
              if (heroImage !== FALLBACK_IMG) {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_IMG;
              }
            }}
          />

          {/* Mobile top overlay controls */}
          <div className="bd-hero-ctl" style={{ position: "absolute", left: 16, right: 16, top: 16, alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <Link
              href="/Explore"
              aria-label={t("back")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 999,
                background: "rgba(0,0,0,.45)",
                backdropFilter: "blur(8px)",
                color: "var(--bd-white)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={handleWishlistToggle}
                aria-label={t("save")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  padding: 0,
                  border: "none",
                  borderRadius: 999,
                  background: "rgba(0,0,0,.45)",
                  backdropFilter: "blur(8px)",
                  color: isWishlisted ? "var(--acc-bright)" : "var(--bd-white)",
                  cursor: "pointer",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20.9C12 20.9 2.7 15.4 2.7 9.4C2.7 6.4 5 4.1 7.9 4.1C9.8 4.1 11.3 5.2 12 6.7C12.7 5.2 14.2 4.1 16.1 4.1C19 4.1 21.3 6.4 21.3 9.4C21.3 15.4 12 20.9 12 20.9Z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleShare}
                aria-label={t("share")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  padding: 0,
                  border: "none",
                  borderRadius: 999,
                  background: "rgba(0,0,0,.45)",
                  backdropFilter: "blur(8px)",
                  color: "var(--bd-white)",
                  cursor: "pointer",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
                </svg>
              </button>
            </span>
          </div>

          {/* Mobile title overlay */}
          <div className="bd-hero-ttl" style={{ position: "absolute", left: 16, right: 16, bottom: 18 }}>
            <h1 style={{ margin: 0, fontFamily: "var(--bd-font-ui)", fontSize: 24, fontWeight: 700, lineHeight: 1.18, letterSpacing: "-.02em", color: "var(--bd-white)", textShadow: "0 2px 14px rgba(0,0,0,.6)" }}>
              {event.eventTitle}
            </h1>
          </div>
        </div>

        {/* ─── Detail Grid: Content (Left) + Sticky Sidebar (Right) ──────────── */}
        <div className="bd-detail" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 396px", gap: "clamp(24px, 3vw, 40px)", alignItems: "start", marginTop: "clamp(24px, 2.6vw, 32px)" }}>

          {/* ════ LEFT COLUMN ══════════════════════════════════════════════════ */}
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "clamp(22px, 2.4vw, 30px)" }}>

            {/* Desktop Title Block */}
            <div className="bd-titleblock" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h1 className="bd-h1" style={{ margin: 0, fontFamily: "var(--bd-font-ui)", fontSize: "clamp(28px, 2.55vw, 32px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-.02em", color: "var(--bd-white)", maxWidth: "22ch" }}>
                    {event.eventTitle}
                  </h1>
                  {isPastEvent && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 11px", borderRadius: 999, background: "rgba(255, 90, 90, 0.15)", border: "1px solid rgba(255, 90, 90, 0.3)", color: "#FF6B6B", fontSize: 12, fontWeight: 700 }}>
                      {t("eventEndedPast")}
                    </span>
                  )}
                  {!isPastEvent && isSoldOut && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 11px", borderRadius: 999, background: "rgba(255, 140, 0, 0.15)", border: "1px solid rgba(255, 140, 0, 0.3)", color: "#FF9A3C", fontSize: 12, fontWeight: 700 }}>
                      {t("seatsFull")}
                    </span>
                  )}
                </div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexShrink: 0, marginTop: 5 }}>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label={t("share")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 44,
                    height: 44,
                    padding: 0,
                    border: "1px solid var(--bd-border)",
                    borderRadius: 999,
                    background: "var(--bd-ink-850)",
                    color: "var(--bd-white)",
                    cursor: "pointer",
                    transition: "border-color 200ms ease, color 200ms ease",
                  }}
                  title={t("share")}
                >
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  aria-label={t("saveToFavorites")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 44,
                    height: 44,
                    padding: 0,
                    border: isWishlisted ? "1px solid var(--acc)" : "1px solid var(--bd-border)",
                    borderRadius: 999,
                    background: "var(--bd-ink-850)",
                    color: isWishlisted ? "var(--acc-bright)" : "var(--bd-white)",
                    cursor: "pointer",
                    transition: "border-color 200ms ease, color 200ms ease",
                  }}
                  title={isWishlisted ? (t("saved")) : (t("saveToFavorites"))}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20.9C12 20.9 2.7 15.4 2.7 9.4C2.7 6.4 5 4.1 7.9 4.1C9.8 4.1 11.3 5.2 12 6.7C12.7 5.2 14.2 4.1 16.1 4.1C19 4.1 21.3 6.4 21.3 9.4C21.3 15.4 12 20.9 12 20.9Z" />
                  </svg>
                </button>
              </span>
            </div>

            {/* Date/Time & Location Info Box */}
            <div className="bd-info">
              <div>
                <span style={{ display: "inline-flex", flexShrink: 0, color: "var(--acc-bright)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                  <b style={{ fontSize: 15, fontWeight: 700, color: "var(--bd-white)" }}>
                    {t("evtDateTime")}
                  </b>
                  <span style={{ fontSize: 14, lineHeight: 1.45, color: "var(--bd-gray-400)" }}>
                    {formattedDateTime}
                  </span>
                </span>
              </div>
              <div>
                <span style={{ display: "inline-flex", flexShrink: 0, color: "var(--acc-bright)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                  <b style={{ fontSize: 15, fontWeight: 700, color: "var(--bd-white)" }}>
                    {t("location")}
                  </b>
                  <span style={{ fontSize: 14, lineHeight: 1.45, color: "var(--bd-gray-400)" }}>
                    {fullVenue}
                  </span>
                </span>
              </div>
            </div>

            {/* Gallery Grid Section with View All functionality */}
            {mediaItems.length > 0 && (
              <section>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <h2 className="bd-h3">{t("photoGallery")}</h2>
                  <button
                    type="button"
                    onClick={() => openGalleryModal(0, "grid")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--acc-bright)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {t("seeAll")} ({mediaItems.length})
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>

                <div className="bd-gal2">
                  {/* Item 0: Large (span 2x2) */}
                  {mediaItems[0] && (
                    <div
                      onClick={() => openGalleryModal(0, "carousel")}
                      title={t("clickToViewPhoto")}
                      style={{
                        gridColumn: "span 2",
                        gridRow: "span 2",
                        borderRadius: 16,
                        overflow: "hidden",
                        border: "1px solid var(--bd-border)",
                        position: "relative",
                        cursor: "pointer",
                        background: `center/cover no-repeat url(${mediaItems[0].url})`,
                        backgroundColor: "var(--bd-ink-800)",
                        transition: "border-color 200ms ease",
                      }}
                    >
                      {mediaItems[0].type === "video" && (
                        <video
                          src={mediaItems[0].url}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      )}
                    </div>
                  )}

                  {/* Items 1, 2, 3: Smaller Thumbnails */}
                  {mediaItems.slice(1, 4).map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => openGalleryModal(idx + 1, "carousel")}
                      title={t("clickToViewPhoto")}
                      style={{
                        borderRadius: 16,
                        overflow: "hidden",
                        border: "1px solid var(--bd-border)",
                        position: "relative",
                        cursor: "pointer",
                        background: `center/cover no-repeat url(${item.url})`,
                        backgroundColor: "var(--bd-ink-800)",
                        transition: "border-color 200ms ease",
                      }}
                    >
                      {item.type === "video" && (
                        <video
                          src={item.url}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          muted
                          loop
                        />
                      )}
                    </div>
                  ))}

                  {/* 5th tile: "View all" trigger tile */}
                  <button
                    type="button"
                    onClick={() => openGalleryModal(0, "grid")}
                    title={t("viewAllPhotos")}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 16,
                      border: "1px solid var(--bd-border)",
                      position: "relative",
                      overflow: "hidden",
                      background: mediaItems[4] ? `center/cover no-repeat url(${mediaItems[4].url})` : "var(--bd-ink-850)",
                      backgroundColor: "var(--bd-ink-850)",
                      color: "var(--bd-white)",
                      padding: 0,
                      cursor: "pointer",
                      transition: "border-color 200ms ease",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(10, 11, 16, 0.72)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        padding: 8,
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                      </svg>
                      {mediaItems.length > 4 && (
                        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--acc-bright)", lineHeight: 1 }}>
                          +{mediaItems.length - 4}
                        </span>
                      )}
                      <span style={{ fontSize: 12, fontWeight: 600, textAlign: "center", lineHeight: 1.25 }}>
                        {t("seeAll")}
                      </span>
                    </div>
                  </button>
                </div>
              </section>
            )}

            {/* Short Description */}
            {event.shortdesc && (
              <section>
                <h2 className="bd-h3">{t("evtOverview")}</h2>
                <div className="bd-card">
                  <p className="bd-body">{event.shortdesc}</p>
                </div>
              </section>
            )}

            {/* Detailed Information */}
            {event.longdesc && (
              <section>
                <h2 className="bd-h3">{t("evtDetails")}</h2>
                <div className="bd-card" style={{ minWidth: 0, maxWidth: "100%" }}>
                  <p className="bd-body" style={{ whiteSpace: "pre-line", overflowWrap: "anywhere", wordBreak: "break-word" }}>
                    {event.longdesc}
                  </p>
                </div>
              </section>
            )}

            {/* Things to Know (Мэдэх зүйлс) */}
            {knowRows.length > 0 && (
              <section>
                <h2 className="bd-h3">{t("goodToKnow")}</h2>
                <div className="bd-know">
                  {knowRows.map((k, i) => {
                    const value = String(k.value || "").trim();
                    const isLong = value.length > 28;
                    return (
                      <div className={`bd-knowRow${isLong ? " is-long" : ""}`} key={k.key} style={{ borderBottom: i === knowRows.length - 1 ? "none" : undefined }}>
                        <span className="bd-knowL">
                          <span className="bd-knowI">{k.icon}</span>
                          <b>{k.label}</b>
                        </span>
                        <span className="bd-knowV">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Location & Map Section */}
            <section>
              <h2 className="bd-h3">{t("location")}</h2>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 6 }}>
                  <b style={{ fontSize: 16, fontWeight: 700, color: "var(--bd-white)" }}>
                    {event.venueName || "UB Palace"}
                  </b>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--bd-gray-500)" }}>
                    {event.venueAddress?.address || "Чингэлтэй дүүрэг, Улаанбаатар"}<br />
                    {event.venueAddress?.city ? `${event.venueAddress.city}, ` : ""}Монгол Улс
                  </span>
                  {realDistanceKm != null && (
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--acc-bright)" }}>
                      {formatDistance(realDistanceKm, language, t)}
                    </span>
                  )}
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      alignSelf: "flex-start",
                      marginTop: 8,
                      height: 40,
                      padding: "0 16px",
                      borderRadius: 14,
                      background: "var(--bd-ink-800)",
                      border: "1px solid var(--bd-border)",
                      color: "var(--bd-white)",
                      fontSize: 14,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      transition: "border-color 200ms cubic-bezier(.2,.8,.2,1)",
                    }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    {t("openGoogleMaps")}
                  </a>
                </div>

                <LocationPreviewMap
                  latitude={event.venueAddress?.latitude}
                  longitude={event.venueAddress?.longitude}
                  venueAddress={event.venueAddress}
                  coordinates={eventCoords}
                  address={event.venueAddress?.address}
                  venueName={event.venueName}
                  googleMapsUrl={googleMapsUrl}
                  width={132}
                  height={132}
                  borderRadius={18}
                />
              </div>
            </section>

            {/* Attendees Info (Оролцогчдын мэдээлэл) */}
            <div className="bd-two">
              <section>
                <h2 className="bd-h3">{t("evtAttendees")}</h2>
                <div className="bd-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="stack">
                      {attendees?.recent?.length > 0 ? (
                        <>
                          {attendees.recent.slice(0, 3).map((user, idx) => (
                            <span
                              key={user._id || idx}
                              className="av"
                              style={{
                                backgroundImage: `url(${user.profileImage ? getFullImageUrl(user.profileImage) : FALLBACK_IMG})`,
                                marginLeft: idx > 0 ? -9 : 0,
                              }}
                            />
                          ))}
                          {attendees.total > 3 && (
                            <span className="more">
                              +{attendees.total - 3}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="av" style={{ backgroundImage: `url(${FALLBACK_IMG})` }} />
                      )}
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--bd-white)" }}>
                      {t("peopleGoing", { count: attendees?.total || 0 })}
                    </span>
                  </div>

                  {attendees?.total > 0 && (
                    <button
                      type="button"
                      className="all-btn"
                      onClick={() => router.push(`/eventAttendees?id=${event._id}`)}
                    >
                      {t("seeAll")}
                    </button>
                  )}
                </div>
              </section>
            </div>

            {/* Organizer Profile Card (Зохион байгуулагч) */}
            <section>
              <h2 className="bd-h3">{t("organizer")}</h2>
              <div className="bd-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 999, overflow: "hidden", flexShrink: 0, background: "var(--bd-ink-800)", border: "1px solid var(--bd-border)" }}>
                  <img
                    src={organizerAvatar}
                    alt={organizerName}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMG;
                      e.currentTarget.style.objectFit = "contain";
                      e.currentTarget.style.padding = "6px";
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: organizerAvatar.includes("sidebar-logo.svg") ? "contain" : "cover",
                    }}
                  />
                </div>
                <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <b style={{ fontSize: 15, fontWeight: 700, color: "var(--bd-white)" }}>
                    {organizerName}
                  </b>
                  {isVerifiedOrganizer && (
                    <span className="bd-verified">{t("organizersVerified")}</span>
                  )}
                </span>
                {event.createdBy?._id && (
                  <Link
                    href={`/profile?id=${event.createdBy._id}`}
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--acc-bright)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("viewProfile")}
                  </Link>
                )}
              </div>
            </section>

            {/* Terms / Policy Card */}
            <section>
              <div className="bd-card" style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <span style={{ display: "inline-flex", flexShrink: 0, color: "var(--acc-bright)" }}>
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                  <b style={{ fontSize: 15, fontWeight: 700, color: "var(--bd-white)" }}>
                    {t("termsAndConditions")}
                  </b>
                  <span style={{ fontSize: 13, color: "var(--bd-gray-500)" }}>
                    {refundPolicy || event.refundPolicy || (t("nonRefundable"))}
                  </span>
                </span>
              </div>
            </section>
          </div>

          {/* ════ RIGHT COLUMN: STICKY TICKET BOOKING CARD ═════════════════════ */}
          <aside
            className="bd-book"
            style={{
              position: "sticky",
              top: 88,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: 22,
              borderRadius: 24,
              background: "var(--bd-ink-850)",
              border: "1px solid var(--bd-border)",
              boxShadow: "0 24px 60px rgba(0,0,0,.32)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontFamily: "var(--bd-font-ui)", fontSize: 19, fontWeight: 700, letterSpacing: "-.014em", color: "var(--bd-white)" }}>
                  {isPastEvent
                    ? (t("eventEndedTitle"))
                    : isSoldOut
                      ? (t("seatsFull"))
                      : (t("selectTickets"))}
                </h2>
                {!isPastEvent && remainingSeatsText && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#FFA143", background: "rgba(255, 140, 0, 0.12)", padding: "2px 8px", borderRadius: 6 }}>
                    {remainingSeatsText}
                  </span>
                )}
              </div>

              {/* Past Event State Notice */}
              {isPastEvent && (
                <div style={{ padding: "16px", borderRadius: 16, background: "rgba(255, 90, 90, 0.08)", border: "1px solid rgba(255, 90, 90, 0.22)", color: "#FF8A8A", fontSize: 14, lineHeight: 1.5, marginTop: 14 }}>
                  <b style={{ display: "block", marginBottom: 4, color: "#FF6B6B" }}>
                    {t("eventHasEnded")}
                  </b>
                  {t("eventEndedBody")}
                </div>
              )}

              {/* Sold Out State Notice */}
              {!isPastEvent && isSoldOut && (
                <div style={{ padding: "16px", borderRadius: 16, background: "rgba(255, 140, 0, 0.08)", border: "1px solid rgba(255, 140, 0, 0.22)", color: "#FFB067", fontSize: 14, lineHeight: 1.5, marginTop: 14 }}>
                  <b style={{ display: "block", marginBottom: 4, color: "#FFA143" }}>
                    {t("allSeatsBooked")}
                  </b>
                  {t("soldOutBody")}
                </div>
              )}

              {/* Tickets Stepper List (Shown when event is active) */}
              {!isPastEvent && !isSoldOut && (
                <>
                  {/* Future Sales Start Notice Banner */}
                  {allSalesPending && earliestSalesStart && (
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 14,
                        background: "rgba(35, 173, 164, 0.1)",
                        border: "1px solid rgba(35, 173, 164, 0.28)",
                        color: "var(--acc-bright, #36CEC2)",
                        fontSize: 13,
                        lineHeight: 1.45,
                        marginTop: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <div>
                        <b style={{ display: "block", color: "var(--bd-white, #fff)", fontSize: 13.5 }}>
                          {language === "mn" ? "Борлуулалт хараахан эхлээгүй байна" : "Ticket Sales Not Started"}
                        </b>
                        <span>
                          {language === "mn"
                            ? `Тасалбарын борлуулалт ${earliestSalesStart.toLocaleDateString()} өдөр эхэлнэ.`
                            : `Sales will open on ${earliestSalesStart.toLocaleDateString()}.`}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="bs-opts" style={{ marginTop: 14 }}>
                    {event.tickets && event.tickets.length > 0 ? (
                      event.tickets.map((ticket, idx) => {
                        const tkId = ticket._id || idx;
                        const total = ticket.qty || 0;
                        const available = ticket.availableQty !== undefined ? ticket.availableQty : total;
                        const isTierSoldOut = available <= 0;
                        const now = new Date();
                        const salesStarted = ticket.salesStart ? now >= new Date(ticket.salesStart) : true;
                        const salesEnded = ticket.salesEnd ? now > new Date(ticket.salesEnd) : false;
                        const isSalesActive = salesStarted && !salesEnded;
                        const rawQ = ticketQtys[tkId] || 0;
                        const q = (!isSalesActive || isTierSoldOut) ? 0 : rawQ;
                        const tPrice = Number(ticket.price) || 0;

                        const shortDesc = String(ticket.ticketShortDesc || "").trim();

                        return (
                          <div
                            key={tkId}
                            className={`bs-tk${q > 0 ? " is-on" : ""}${isTierSoldOut || !isSalesActive ? " is-off" : ""}`}
                            onClick={() => {
                              if (!salesStarted && ticket.salesStart) {
                                const startStr = new Date(ticket.salesStart).toLocaleDateString();
                                toast.error(
                                  language === "mn"
                                    ? `Тасалбарын борлуулалт ${startStr}-нд эхэлнэ: ${ticket.ticketName}`
                                    : `Sales start on ${startStr} for ${ticket.ticketName}`
                                );
                              }
                            }}
                          >
                            <div className="bs-tk-l">
                              <span className="bs-tk-nm">{ticket.ticketName}</span>
                              {shortDesc ? <span className="bs-tk-nt">{shortDesc}</span> : null}
                              <span className={`bs-tk-flag${isTierSoldOut || salesEnded ? " is-sold" : !salesStarted ? " is-pending" : available <= 6 ? " is-low" : ""}`}>
                                {isTierSoldOut
                                  ? t("soldOut")
                                  : !salesStarted
                                    ? (language === "mn" ? `Борлуулалт: ${new Date(ticket.salesStart).toLocaleDateString()}` : `Sales start on ${new Date(ticket.salesStart).toLocaleDateString()}`)
                                    : salesEnded
                                      ? (language === "mn" ? "Борлуулалт дууссан" : "Sales ended")
                                      : `${Number(available).toLocaleString()} ${t("left")}`}
                              </span>
                            </div>
                            <div className="bs-tk-r">
                              <span className="bs-tk-pr">
                                {tPrice === 0 ? (t("freePrice")) : `₮${tPrice.toLocaleString()}`}
                              </span>
                              <span className="bs-stp">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStepTicket(tkId, -1);
                                  }}
                                  disabled={q <= 0 || isTierSoldOut}
                                  aria-label="Decrease"
                                >
                                  −
                                </button>
                                <b>{q}</b>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStepTicket(tkId, 1);
                                  }}
                                  disabled={isTierSoldOut || (available > 0 && q >= available && isSalesActive)}
                                  aria-label="Increase"
                                >
                                  +
                                </button>
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : null}
                  </div>

                  {/* Running Total */}
                  <div className="bs-tkfoot">
                    <span>
                      <small>{t("total")}</small>
                      <b style={{ color: ticketTotals.qty ? "var(--acc-bright, #36CEC2)" : "var(--bd-white, #fff)" }}>
                        {ticketTotals.subtotal === 0 && ticketTotals.qty > 0
                          ? (t("freePrice"))
                          : `₮${ticketTotals.subtotal.toLocaleString()}`}
                      </b>
                    </span>
                  </div>
                </>
              )}

              {/* Submit CTA */}
              <button
                type="button"
                className="bs-go"
                onClick={handleGoToBooking}
                disabled={isPastEvent || isSoldOut}
                style={{
                  width: "100%",
                  marginTop: 14,
                  borderRadius: 14,
                  background: isPastEvent || isSoldOut || allSalesPending ? "var(--bd-ink-800)" : undefined,
                  border: isPastEvent || isSoldOut || allSalesPending ? "1px solid var(--bd-border)" : undefined,
                  color: isPastEvent || isSoldOut || allSalesPending ? "var(--bd-gray-400)" : undefined,
                  cursor: isPastEvent || isSoldOut ? "not-allowed" : "pointer",
                }}
              >
                {isPastEvent
                  ? (t("endedShort"))
                  : isSoldOut
                    ? (t("seatsFull"))
                    : allSalesPending
                      ? (language === "mn" ? `Борлуулалт ${earliestSalesStart ? earliestSalesStart.toLocaleDateString() : ""} эхэлнэ` : `Sales Start on ${earliestSalesStart ? earliestSalesStart.toLocaleDateString() : ""}`)
                      : ticketTotals.qty > 0 && ticketTotals.subtotal === 0
                        ? (t("registerForFree"))
                        : (t("getTickets"))}
              </button>
            </div>
          </aside>
        </div>

        {/* ─── Similar Events Section ────────────────────────────────────────── */}
        {similarEvents && similarEvents.length > 0 && (
          <section className="bd-similar" style={{ marginTop: "clamp(44px, 4.4vw, 64px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
              <h2 className="bd-h2" style={{ margin: 0, fontFamily: "var(--bd-font-ui)", fontSize: 26, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-.016em", color: "var(--bd-white)" }}>
                {t("similarEvents")}
              </h2>
              {similarEvents.length > 2 && (
                <Link
                  href="/Explore"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    height: 38,
                    padding: "0 16px",
                    borderRadius: 999,
                    border: "1px solid var(--bd-border)",
                    color: "var(--bd-gray-300)",
                    fontSize: 12,
                    fontWeight: 550,
                    whiteSpace: "nowrap",
                    transition: "border-color 200ms cubic-bezier(.2,.8,.2,1), color 200ms cubic-bezier(.2,.8,.2,1)",
                  }}
                >
                  {t("seeAll")}
                </Link>
              )}
            </div>

            <div className="bd-rail" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(258px, 1fr))", gap: 20 }}>
              {similarEvents.map((sim) => {
                const isFav = !!favorites[sim._id];
                const simPoster = sim.posterImage?.[0] ? getFullImageUrl(sim.posterImage[0]) : FALLBACK_IMG;
                const simPrice = getMinTicketPrice(sim.tickets);
                const simPriceText = simPrice === 0 ? (t("freePrice")) : (simPrice ? `₮${simPrice.toLocaleString()}` : (t("freePrice")));
                const simDate = formatDateBilingual(sim.startDate, sim.startTime, null, language, t);
                const simVenue = sim.venueName || sim.venueAddress?.address || "Ulaanbaatar";

                return (
                  <Link key={sim._id} href={`/eventDetails?id=${sim._id}`} className="bd-c">
                    <span
                      className="bd-c-img"
                      style={{
                        backgroundImage: `url(${simPoster})`,
                        backgroundSize: simPoster.includes("sidebar-logo.svg") ? "45% auto" : "cover",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        backgroundColor: "var(--bd-ink-800)",
                      }}
                    >
                      <img
                        src={simPoster}
                        alt=""
                        style={{ display: "none" }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_IMG;
                        }}
                      />
                      <button
                        type="button"
                        className={`bd-c-fav ${isFav ? "active" : ""}`}
                        aria-label={t("save")}
                        onClick={(e) => handleSimilarFavoriteToggle(sim._id, e)}
                      >
                        <svg viewBox="0 0 24 24" width="21" height="21" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
                          <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z" />
                        </svg>
                      </button>
                    </span>

                    {(sim.status === "Live" || String(sim.status).toLowerCase() === "live") ? (
                      <span className="bd-c-promo" style={{ background: "#098D8A" }}>{language === "en" ? "LIVE" : "ШУУД"}</span>
                    ) : sim.isFeatured ? (
                      <span className="bd-c-promo">{t("featuredBadge")}</span>
                    ) : null}

                    <span className="bd-c-b">
                      <b className="bd-c-t">{sim.eventTitle}</b>
                      <span className="bd-c-m" data-sched-line>{simDate}</span>
                      <span className="bd-c-m">{simVenue}</span>
                      <span className="bd-c-p">{simPriceText}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* ─── Mobile Bottom Floating CTA Bar ──────────────────────────────────── */}
      <div className="bd-cta-bar">
        <span className="bd-cta-price">
          <small>{t("startingPrice")}</small>
          <b>
            {isPastEvent
              ? (t("endedShort"))
              : isSoldOut
                ? (t("soldShort"))
                : formattedMinPrice}
          </b>
        </span>
        <button
          type="button"
          onClick={handleGoToBooking}
          disabled={isPastEvent || isSoldOut}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: 48,
            padding: "0 24px",
            borderRadius: 14,
            border: "none",
            background: isPastEvent || isSoldOut || allSalesPending ? "var(--bd-ink-800)" : "var(--acc)",
            color: isPastEvent || isSoldOut || allSalesPending ? "var(--bd-gray-400)" : "var(--bd-white)",
            fontSize: 15,
            fontWeight: 700,
            cursor: isPastEvent || isSoldOut ? "not-allowed" : "pointer",
          }}
        >
          {isPastEvent
            ? (t("endedShort"))
            : isSoldOut
              ? (t("seatsFull"))
              : allSalesPending
                ? (language === "mn" ? `Борлуулалт ${earliestSalesStart ? earliestSalesStart.toLocaleDateString() : ""} эхэлнэ` : `Starts ${earliestSalesStart ? earliestSalesStart.toLocaleDateString() : ""}`)
                : (t("getTickets"))}
        </button>
      </div>

      {/* ─── Fullscreen Photo Gallery Modal (Lightbox & All Photos Grid) ────── */}
      <GalleryModal
        isOpen={galleryModalOpen}
        onClose={() => setGalleryModalOpen(false)}
        items={mediaItems}
        initialIndex={galleryInitialIdx}
        initialMode={galleryInitialMode}
      />

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} url={shareUrl} />

      <Footer />
    </div>
  );
}

export default function EventDetailPage() {
  return (
    <Suspense
      fallback={
        <div style={{ width: "100%", minHeight: "100vh", background: "var(--bd-ink-900)" }} />
      }
    >
      <EventDetailsContent />
    </Suspense>
  );
}
