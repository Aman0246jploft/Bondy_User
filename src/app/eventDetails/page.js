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

const FALLBACK_IMG = "/img/sidebar-logo.svg";

function formatDateBilingual(dateStr, startTime, endTime, lang) {
  if (!dateStr) return lang === "mn" ? "Тун удахгүй" : "Coming soon";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return lang === "mn" ? "Тун удахгүй" : "Coming soon";

  const mnMonths = ["1-р", "2-р", "3-р", "4-р", "5-р", "6-р", "7-р", "8-р", "9-р", "10-р", "11-р", "12-р"];
  const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mnDays = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
  const enDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const m = d.getMonth();
  const dayNum = d.getDate();
  const dayName = lang === "mn" ? mnDays[d.getDay()] : enDays[d.getDay()];
  const monthName = lang === "mn" ? `${mnMonths[m]} сарын ${dayNum}` : `${enMonths[m]} ${dayNum}`;

  let timePart = "";
  if (startTime) {
    const s = formatTime(startTime, true, lang);
    const e = endTime ? formatTime(endTime, true, lang) : "";
    timePart = e ? ` · ${s} – ${e}` : ` · ${s}`;
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
function GalleryModal({ isOpen, onClose, items, initialIndex = 0, initialMode = "carousel", language }) {
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
            {language === "en" ? "Photo Gallery" : "Зургийн цомог"}
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
            {mode === "carousel" ? `${index + 1} / ${items.length}` : `${items.length} ${language === "en" ? "items" : "зураг"}`}
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
                <span>{language === "en" ? "All Photos" : "Бүгд"}</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
                <span>{language === "en" ? "Slideshow" : "Слайд"}</span>
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
                title={language === "en" ? `View photo #${i + 1}` : `Зураг #${i + 1} томруулж харах`}
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
                      {language === "en" ? "Expand" : "Томруулах"}
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
  const { language } = useLanguage();
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
            evt.tickets.forEach((tk, idx) => {
              initQtys[tk._id || idx] = idx === 0 ? 1 : 0;
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
            toast.success(response?.message || (language === "en" ? "Removed from saved" : "Хадгалснаас хасагдлаа"));
            setIsWishlisted(false);
          }
        } else {
          const response = await wishlistApi.addToWishlist({
            entityId: eventId,
            entityModel: "Event",
          });
          if (response?.status === true) {
            setIsWishlisted(true);
            toast.success(response?.message || (language === "en" ? "Saved to favorites" : "Амжилттай хадгалагдлаа"));
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
    setFavorites((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("bondy_favorites", JSON.stringify(next));
      toast.success(next[id]
        ? (language === "en" ? "Saved to favorites" : "Хадгалагдлаа")
        : (language === "en" ? "Removed from favorites" : "Хасагдлаа"));
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
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      toast.success(language === "en" ? "Link copied to clipboard!" : "Холбоос хуулагдлаа!");
    } catch (error) {
      toast.error(language === "en" ? "Failed to copy link" : "Холбоос хуулахад алдаа гарлаа");
    }
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
      return language === "en" ? "Free" : "Үнэгүй";
    }
    if (minPrice != null && minPrice > 0) {
      return `₮${minPrice.toLocaleString()}`;
    }
    return language === "en" ? "Free" : "Үнэгүй";
  }, [minPrice, event, language]);

  const formattedDateTime = useMemo(() => {
    return formatDateBilingual(event?.startDate, event?.startTime, event?.endTime, language);
  }, [event, language]);

  const fullVenue = useMemo(() => {
    const parts = [];
    if (event?.venueName) parts.push(event.venueName);
    if (event?.venueAddress?.address) parts.push(event.venueAddress.address);
    if (event?.venueAddress?.city) parts.push(event.venueAddress.city);
    return parts.join(", ") || (language === "en" ? "Ulaanbaatar, Mongolia" : "Улаанбаатар, Монгол Улс");
  }, [event, language]);

  // Ticket totals
  const ticketTotals = useMemo(() => {
    if (!event?.tickets || event.tickets.length === 0) {
      return { qty: 1, subtotal: minPrice || 0 };
    }
    let qty = 0;
    let subtotal = 0;
    event.tickets.forEach((tk, idx) => {
      const q = ticketQtys[tk._id || idx] || 0;
      qty += q;
      subtotal += q * (Number(tk.price) || 0);
    });
    return { qty, subtotal };
  }, [event, ticketQtys, minPrice]);

  const handleStepTicket = (tkId, delta) => {
    setTicketQtys((prev) => {
      const cur = prev[tkId] || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [tkId]: next };
    });
  };

  const handleGoToBooking = () => {
    if (!eventId) return;
    router.push(`/eventbooking?eventId=${eventId}`);
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
        label: language === "en" ? "Age restriction" : "Насны хязгаар",
        value: event.ageRestriction,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" /><path d="M12 16h.01" />
          </svg>
        ),
      });
    }
    if (event?.dressCode) {
      list.push({
        key: "dress",
        label: language === "en" ? "Dress code" : "Хувцаслалт",
        value: event.dressCode,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
          </svg>
        ),
      });
    }
    if (event?.notes) {
      list.push({
        key: "entry",
        label: language === "en" ? "Entry info" : "Нэвтрэх мэдээлэл",
        value: event.notes,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 12h6" /><path d="M12 9v6" />
          </svg>
        ),
      });
    }
    const ref = refundPolicy || event?.refundPolicy;
    if (ref) {
      list.push({
        key: "refund",
        label: language === "en" ? "Refund policy" : "Буцаан олголт",
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
    return (
      <div style={{ width: "100%", background: "var(--bd-ink-900)", minHeight: "100vh" }}>
        <Header />
        <main style={{ maxWidth: 1224, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ height: 320, borderRadius: 24, background: "var(--bd-ink-850)", animation: "pulse 1.5s infinite" }} />
          <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 396px", gap: 32 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ height: 40, width: "60%", borderRadius: 8, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ height: 90, borderRadius: 16, background: "rgba(255,255,255,0.04)" }} />
              <div style={{ height: 160, borderRadius: 16, background: "rgba(255,255,255,0.04)" }} />
            </div>
            <div style={{ height: 340, borderRadius: 24, background: "var(--bd-ink-850)" }} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ width: "100%", background: "var(--bd-ink-900)", minHeight: "100vh" }}>
        <Header />
        <main style={{ maxWidth: 1224, margin: "0 auto", padding: "100px 24px", textAlign: "center" }}>
          <h2 style={{ color: "var(--bd-white)", fontSize: 24, fontWeight: 700 }}>
            {language === "en" ? "Event not found" : "Эвент олдсонгүй"}
          </h2>
          <p style={{ color: "var(--bd-gray-400)", marginTop: 12 }}>
            {language === "en" ? "The event may have expired or been removed." : "Уг эвент хугацаа нь дууссан эсвэл устгагдсан байж болзошгүй."}
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
            {language === "en" ? "Browse other events" : "Бусад эвент харах"}
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
            {language === "en" ? "Home" : "Нүүр"}
          </Link>
          <span>/</span>
          <Link href="/Explore" style={{ color: "var(--bd-gray-600)" }}>
            {language === "en" ? "Events" : "Эвент"}
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
              aria-label={language === "en" ? "Back" : "Буцах"}
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
                aria-label={language === "en" ? "Save" : "Хадгалах"}
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
                aria-label={language === "en" ? "Share" : "Хуваалцах"}
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
              <h1 className="bd-h1" style={{ margin: 0, fontFamily: "var(--bd-font-ui)", fontSize: "clamp(28px, 2.55vw, 32px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-.02em", color: "var(--bd-white)", maxWidth: "22ch" }}>
                {event.eventTitle}
              </h1>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexShrink: 0, marginTop: 5 }}>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label={language === "en" ? "Share" : "Хуваалцах"}
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
                  title={language === "en" ? "Share event" : "Хуваалцах"}
                >
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  aria-label={language === "en" ? "Save to favorites" : "Хадгалах"}
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
                  title={isWishlisted ? (language === "en" ? "Saved" : "Хадгалсан") : (language === "en" ? "Save to favorites" : "Хадгалах")}
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
                    {language === "en" ? "Date & Time" : "Огноо, цаг"}
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
                    {language === "en" ? "Location" : "Байршил"}
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
                  <h2 className="bd-h3">{language === "en" ? "Photo Gallery" : "Зургийн цомог"}</h2>
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
                    {language === "en" ? "View all" : "Бүгдийг харах"} ({mediaItems.length})
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
                      title={language === "en" ? "Click to view photo" : "Томруулж харах"}
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
                      title={language === "en" ? "Click to view photo" : "Томруулж харах"}
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
                    title={language === "en" ? "View all photos" : "Бүх зургийг харах"}
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
                        {language === "en" ? "View all" : "Бүгдийг харах"}
                      </span>
                    </div>
                  </button>
                </div>
              </section>
            )}

            {/* Short Description */}
            {event.shortdesc && (
              <section>
                <h2 className="bd-h3">{language === "en" ? "Brief Summary" : "Товч танилцуулга"}</h2>
                <div className="bd-card">
                  <p className="bd-body">{event.shortdesc}</p>
                </div>
              </section>
            )}

            {/* Detailed Information */}
            {event.longdesc && (
              <section>
                <h2 className="bd-h3">{language === "en" ? "Detailed Overview" : "Дэлгэрэнгүй мэдээлэл"}</h2>
                <div className="bd-card">
                  <p className="bd-body" style={{ whiteSpace: "pre-line" }}>
                    {event.longdesc}
                  </p>
                </div>
              </section>
            )}

            {/* Things to Know (Мэдэх зүйлс) */}
            {knowRows.length > 0 && (
              <section>
                <h2 className="bd-h3">{language === "en" ? "Things to Know" : "Мэдэх зүйлс"}</h2>
                <div style={{ borderRadius: 18, background: "var(--bd-ink-850)", border: "1px solid var(--bd-border)", overflow: "hidden" }}>
                  {knowRows.map((k, i) => (
                    <div
                      key={k.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        padding: "15px 18px",
                        borderBottom: i === knowRows.length - 1 ? "none" : "1px solid var(--bd-border-soft)",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 38,
                            height: 38,
                            flexShrink: 0,
                            borderRadius: 12,
                            background: "rgba(35, 173, 164, 0.13)",
                            color: "var(--acc-bright)",
                          }}
                        >
                          {k.icon}
                        </span>
                        <b style={{ fontSize: 15, fontWeight: 600, color: "var(--bd-white)" }}>
                          {k.label}
                        </b>
                      </span>
                      <span style={{ fontSize: 14.5, color: "var(--bd-gray-400)", textAlign: "right" }}>
                        {k.value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Location & Map Section */}
            <section>
              <h2 className="bd-h3">{language === "en" ? "Location" : "Байршил"}</h2>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 6 }}>
                  <b style={{ fontSize: 16, fontWeight: 700, color: "var(--bd-white)" }}>
                    {event.venueName || "UB Palace"}
                  </b>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--bd-gray-500)" }}>
                    {event.venueAddress?.address || "Чингэлтэй дүүрэг, Улаанбаатар"}<br />
                    {event.venueAddress?.city ? `${event.venueAddress.city}, ` : ""}Монгол Улс
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--acc-bright)" }}>
                    {language === "en" ? "5.2 km from you" : "Танаас 5.2 км"}
                  </span>
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
                    {language === "en" ? "Open Google Maps" : "Google Maps нээх"}
                  </a>
                </div>

                <div
                  style={{
                    position: "relative",
                    width: 132,
                    height: 132,
                    flexShrink: 0,
                    borderRadius: 18,
                    overflow: "hidden",
                    border: "1px solid var(--bd-border)",
                    background: "var(--bd-ink-850)",
                  }}
                >
                  <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(180px 140px at 50% 50%, rgba(35, 173, 164, 0.16), transparent 72%)" }} />
                  <span
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      background: "var(--acc)",
                      boxShadow: "0 6px 16px rgba(0,0,0,.5)",
                      color: "var(--bd-white)",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                </div>
              </div>
            </section>

            {/* Attendees Info (Оролцогчдын мэдээлэл) */}
            <div className="bd-two">
              <section>
                <h2 className="bd-h3">{language === "en" ? "Attendees" : "Оролцогчдын мэдээлэл"}</h2>
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
                      {attendees?.total || 0} {language === "en" ? "people going" : "хүн оролцоно"}
                    </span>
                  </div>

                  {attendees?.total > 0 && (
                    <button
                      type="button"
                      className="all-btn"
                      onClick={() => router.push(`/eventAttendees?id=${event._id}`)}
                    >
                      {language === "en" ? "View all" : "Бүгдийг харах"}
                    </button>
                  )}
                </div>
              </section>
            </div>

            {/* Organizer Profile Card (Зохион байгуулагч) */}
            <section>
              <h2 className="bd-h3">{language === "en" ? "Organizer" : "Зохион байгуулагч"}</h2>
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
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(35, 173, 164, 0.15)",
                        color: "var(--acc-bright)",
                        fontSize: 11.5,
                        fontWeight: 600,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {language === "en" ? "Verified" : "Баталгаажсан"}
                    </span>
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
                    {language === "en" ? "View" : "Үзэх"}
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
                    {language === "en" ? "Terms & Conditions" : "Нөхцөл, журам"}
                  </b>
                  <span style={{ fontSize: 13, color: "var(--bd-gray-500)" }}>
                    {refundPolicy || event.refundPolicy || (language === "en" ? "Non-refundable" : "Буцаан олголтгүй")}
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
              <h2 style={{ margin: 0, fontFamily: "var(--bd-font-ui)", fontSize: 19, fontWeight: 700, letterSpacing: "-.014em", color: "var(--bd-white)" }}>
                {language === "en" ? "Select Tickets" : "Тасалбар сонгох"}
              </h2>

              {/* Tickets Stepper List */}
              <div className="bs-opts" style={{ marginTop: 14 }}>
                {event.tickets && event.tickets.length > 0 ? (
                  event.tickets.map((ticket, idx) => {
                    const tkId = ticket._id || idx;
                    const q = ticketQtys[tkId] || 0;
                    const total = ticket.qty || 0;
                    const available = ticket.availableQty !== undefined ? ticket.availableQty : total;
                    const isSoldOut = available <= 0;
                    const tPrice = Number(ticket.price) || 0;

                    return (
                      <div key={tkId} className="bs-tk">
                        <div className="bs-tk-l">
                          <span className="bs-tk-nm">{ticket.ticketName}</span>
                          <span className="bs-tk-sub">
                            {ticket.ticketShortDesc || (isSoldOut ? (language === "en" ? "Sold out" : "Дууссан") : (language === "en" ? "Free seating" : "Суудал чөлөөтэй"))}
                          </span>
                        </div>
                        <div className="bs-tk-r">
                          <span className="bs-tk-pr">
                            {tPrice === 0 ? (language === "en" ? "Free" : "Үнэгүй") : `₮${tPrice.toLocaleString()}`}
                          </span>
                          <span className="bs-stp">
                            <button
                              type="button"
                              onClick={() => handleStepTicket(tkId, -1)}
                              disabled={q <= 0}
                              aria-label="Decrease"
                            >
                              −
                            </button>
                            <b>{q}</b>
                            <button
                              type="button"
                              onClick={() => handleStepTicket(tkId, 1)}
                              disabled={isSoldOut || q >= available}
                              aria-label="Increase"
                            >
                              +
                            </button>
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bs-tk">
                    <div className="bs-tk-l">
                      <span className="bs-tk-nm">{language === "en" ? "Standard Entry" : "Энгийн тасалбар"}</span>
                      <span className="bs-tk-sub">{language === "en" ? "General admission" : "Ерөнхий нэвтрэх эрх"}</span>
                    </div>
                    <div className="bs-tk-r">
                      <span className="bs-tk-pr">{formattedMinPrice}</span>
                      <span className="bs-stp">
                        <button type="button" disabled>−</button>
                        <b>1</b>
                        <button type="button" disabled>+</button>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Running Total */}
              <div className="bs-tkfoot">
                <span>
                  <small>{language === "en" ? "Total" : "Нийт"}</small>
                  <b style={{ color: ticketTotals.qty ? "var(--acc-bright, #36CEC2)" : "var(--bd-white, #fff)" }}>
                    {ticketTotals.subtotal === 0 && ticketTotals.qty > 0
                      ? (language === "en" ? "Free" : "Үнэгүй")
                      : `₮${ticketTotals.subtotal.toLocaleString()}`}
                  </b>
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                className="bs-go"
                onClick={handleGoToBooking}
                disabled={ticketTotals.qty <= 0}
                style={{ width: "100%", marginTop: 14, borderRadius: 14 }}
              >
                {ticketTotals.qty > 0 && ticketTotals.subtotal === 0
                  ? (language === "en" ? "Register for Free" : "Үнэгүй бүртгүүлэх")
                  : (language === "en" ? "Get Tickets" : "Тасалбар авах")}
              </button>
            </div>
          </aside>
        </div>

        {/* ─── Similar Events Section ────────────────────────────────────────── */}
        {similarEvents && similarEvents.length > 0 && (
          <section className="bd-similar" style={{ marginTop: "clamp(44px, 4.4vw, 64px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
              <h2 className="bd-h2" style={{ margin: 0, fontFamily: "var(--bd-font-ui)", fontSize: 26, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-.016em", color: "var(--bd-white)" }}>
                {language === "en" ? "Similar Events" : "Төстэй эвентүүд"}
              </h2>
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
                {language === "en" ? "View all" : "Бүгдийг харах"}
              </Link>
            </div>

            <div className="bd-rail" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(258px, 1fr))", gap: 20 }}>
              {similarEvents.map((sim) => {
                const isFav = !!favorites[sim._id];
                const simPoster = sim.posterImage?.[0] ? getFullImageUrl(sim.posterImage[0]) : FALLBACK_IMG;
                const simPrice = getMinTicketPrice(sim.tickets);
                const simPriceText = simPrice === 0 ? (language === "en" ? "Free" : "Үнэгүй") : (simPrice ? `₮${simPrice.toLocaleString()}` : (language === "en" ? "Free" : "Үнэгүй"));
                const simDate = formatDateBilingual(sim.startDate, sim.startTime, null, language);
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
                        aria-label={language === "en" ? "Save" : "Хадгалах"}
                        onClick={(e) => handleSimilarFavoriteToggle(sim._id, e)}
                      >
                        <svg viewBox="0 0 24 24" width="21" height="21" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
                          <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z" />
                        </svg>
                      </button>
                    </span>

                    {sim.isFeatured && (
                      <span className="bd-c-promo">{language === "en" ? "Featured" : "Онцлох"}</span>
                    )}

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
          <small>{language === "en" ? "Starting price" : "Эхлэх үнэ"}</small>
          <b>{formattedMinPrice}</b>
        </span>
        <button
          type="button"
          onClick={handleGoToBooking}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: 48,
            padding: "0 24px",
            borderRadius: 14,
            border: "none",
            background: "var(--acc)",
            color: "var(--bd-white)",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {language === "en" ? "Get Tickets" : "Тасалбар авах"}
        </button>
      </div>

      {/* ─── Fullscreen Photo Gallery Modal (Lightbox & All Photos Grid) ────── */}
      <GalleryModal
        isOpen={galleryModalOpen}
        onClose={() => setGalleryModalOpen(false)}
        items={mediaItems}
        initialIndex={galleryInitialIdx}
        initialMode={galleryInitialMode}
        language={language}
      />

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
