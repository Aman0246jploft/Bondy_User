"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import courseApi from "@/api/courseApi";
import wishlistApi from "@/api/wishlistApi";
import { useAuthGuard } from "@/context/AuthGuardContext";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import { formatTime } from "@/utils/timeHelper";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";

const FALLBACK_IMG = "/img/sidebar-logo.svg";

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

// ─── Format Course Duration & Schedule Helpers ─────────────────────────────────
function formatCourseDuration(startDate, endDate, duration, durationTranslation, totalSessions, enrollmentType, lang) {
  if (enrollmentType === "Ongoing") {
    return lang === "en" ? "Ongoing Course" : "Тасралтгүй сургалт";
  }
  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      const mnMonths = ["1-р", "2-р", "3-р", "4-р", "5-р", "6-р", "7-р", "8-р", "9-р", "10-р", "11-р", "12-р"];
      const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const startStr = lang === "mn" ? `${mnMonths[s.getMonth()]} сарын ${s.getDate()}` : `${enMonths[s.getMonth()]} ${s.getDate()}`;
      const endStr = lang === "mn" ? `${mnMonths[e.getMonth()]} сарын ${e.getDate()}` : `${enMonths[e.getMonth()]} ${e.getDate()}`;

      const durText = (lang === "mn" ? durationTranslation : duration) ||
        (totalSessions ? (lang === "mn" ? `${totalSessions} хичээл` : `${totalSessions} sessions`) : "");

      return durText ? `${startStr} – ${endStr} · ${durText}` : `${startStr} – ${endStr}`;
    }
  }
  return (lang === "mn" ? durationTranslation : duration) || (lang === "mn" ? "Хугацаа тодорхойгүй" : "Duration N/A");
}

function formatCourseSchedule(batches, weeklySchedule, enrollmentType, totalSessions, lang) {
  if (enrollmentType === "Ongoing" && weeklySchedule) {
    const days = Object.keys(weeklySchedule);
    if (days.length > 0) {
      return lang === "en" ? `${days.join(", ")} weekly` : `Долоо хоног бүрийн ${days.join(", ")}`;
    }
  }
  if (batches && batches.length > 0) {
    const first = batches[0];
    const daysStr = first.days?.join(", ") || "";
    const timeStr = first.startTime ? `${formatTime(first.startTime, true, lang)}${first.endTime ? ` – ${formatTime(first.endTime, true, lang)}` : ""}` : "";
    const sessionCount = totalSessions ? `${totalSessions} ${lang === "mn" ? "хичээл" : "sessions"}` : "";
    const parts = [sessionCount, daysStr, timeStr].filter(Boolean);
    return parts.join(" · ");
  }
  return lang === "mn" ? "Хуваарь тодорхойгүй" : "Schedule N/A";
}

// ─── Main Component ────────────────────────────────────────────────────────────
function ProgramDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { language } = useLanguage();
  const { checkAuth } = useAuthGuard();

  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [similarCourses, setSimilarCourses] = useState([]);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryInitialIdx, setGalleryInitialIdx] = useState(0);
  const [galleryInitialMode, setGalleryInitialMode] = useState("carousel");
  const [favorites, setFavorites] = useState({});
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedPassType, setSelectedPassType] = useState(""); // "" | "1month" | "3month"
  const [expandedAbout, setExpandedAbout] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bondy_favorites");
      if (saved) setFavorites(JSON.parse(saved));
    } catch (_) { }
  }, []);

  // Fetch Course Details
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const response = await courseApi.getCourseDetails(id);
        if (cancelled) return;
        if (response && response.data) {
          const c = response.data;
          setCourseDetails(c);
          setIsWishlisted(Boolean(c.isWishlisted));

          // Set default selected batch to first available batch
          if (c.batches && c.batches.length > 0) {
            const firstAvailable = c.batches.find((b) => !b.isFull && !b.bookingCutOffPassed);
            if (firstAvailable) {
              setSelectedBatchId(firstAvailable._id);
            } else {
              setSelectedBatchId(c.batches[0]._id);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching course details:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Fetch Similar Courses
  useEffect(() => {
    let cancelled = false;
    const fetchSimilar = async () => {
      try {
        const res = await courseApi.getCourses({ limit: 6 });
        if (cancelled) return;
        if (res && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data?.courses || []);
          setSimilarCourses(list.filter((c) => c._id !== id).slice(0, 4));
        }
      } catch (err) {
        console.error("Error fetching similar courses:", err);
      }
    };
    fetchSimilar();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (courseDetails?.courseTitle) {
      document.title = `${courseDetails.courseTitle} | Bondy`;
    }
  }, [courseDetails]);

  // Wishlist toggle
  const handleWishlistToggle = () => {
    checkAuth(async () => {
      if (wishlistLoading || !id) return;
      setWishlistLoading(true);

      try {
        if (isWishlisted) {
          const response = await wishlistApi.removeFromWishlist({ entityId: id });
          if (response?.status === true) {
            toast.success(response?.message || (language === "en" ? "Removed from saved" : "Хадгалснаас хасагдлаа"));
            setIsWishlisted(false);
          }
        } else {
          const response = await wishlistApi.addToWishlist({
            entityId: id,
            entityModel: "Course",
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

  const handleSimilarFavoriteToggle = (courseId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = { ...prev, [courseId]: !prev[courseId] };
      localStorage.setItem("bondy_favorites", JSON.stringify(next));
      toast.success(next[courseId]
        ? (language === "en" ? "Saved to favorites" : "Хадгалагдлаа")
        : (language === "en" ? "Removed from favorites" : "Хасагдлаа"));
      return next;
    });
    try {
      const token = localStorage.getItem("token");
      if (token) {
        if (!favorites[courseId]) {
          wishlistApi.addToWishlist({ entityId: courseId, entityModel: "Course" }).catch(() => { });
        } else {
          wishlistApi.removeFromWishlist({ entityId: courseId }).catch(() => { });
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

    if (courseDetails?.posterImage) {
      const posters = Array.isArray(courseDetails.posterImage) ? courseDetails.posterImage : [courseDetails.posterImage];
      posters.forEach((p) => add(p, "image"));
    }
    if (courseDetails?.mediaLinks) {
      const links = Array.isArray(courseDetails.mediaLinks) ? courseDetails.mediaLinks : [courseDetails.mediaLinks];
      links.forEach((m) => add(m, "image"));
    }
    if (courseDetails?.shortTeaserVideo) {
      const teasers = Array.isArray(courseDetails.shortTeaserVideo) ? courseDetails.shortTeaserVideo : [courseDetails.shortTeaserVideo];
      teasers.forEach((v) => add(v, "video"));
    }
    return items.length > 0 ? items : [{ type: "image", url: FALLBACK_IMG }];
  }, [courseDetails]);

  const heroImage = useMemo(() => {
    if (mediaItems.length > 0) {
      const firstImg = mediaItems.find((m) => m.type === "image");
      return firstImg?.url || FALLBACK_IMG;
    }
    return FALLBACK_IMG;
  }, [mediaItems]);

  const openGalleryModal = (startIdx = 0, startMode = "carousel") => {
    setGalleryInitialIdx(startIdx);
    setGalleryInitialMode(startMode);
    setGalleryModalOpen(true);
  };

  const formatPrice = (amount) => {
    if (amount == null || amount === undefined || isNaN(Number(amount))) {
      return language === "en" ? "Free" : "Үнэгүй";
    }
    const val = Number(amount);
    if (val === 0) return language === "en" ? "Free" : "Үнэгүй";
    return `₮${val.toLocaleString()}`;
  };

  // Validations & Registration CTA Handler
  const handleRegister = () => {
    checkAuth(() => {
      if (!courseDetails) return;

      const { batches, enrollmentType, currentSchedule, bookingCutOffPassed } = courseDetails;

      // Check 1: Course-level cutoff
      if (bookingCutOffPassed) {
        toast.error(language === "en" ? "Booking is closed for this course" : "Энэ сургалтын бүртгэл хаагдсан байна");
        return;
      }

      // Check 2: Ongoing Passes
      if (enrollmentType === "Ongoing" && selectedPassType) {
        router.push(`/eventbooking?id=${courseDetails._id}&passType=${selectedPassType}`);
        return;
      }

      // Check 3: Batches validation
      if (batches && batches.length > 0) {
        const allBatchesCutOff = batches.filter((b) => b.status === "Active" || !b.status).every((b) => !!b.bookingCutOffPassed);
        if (allBatchesCutOff) {
          toast.error(language === "en" ? "All batches are closed for booking" : "Бүх ээлжийн бүртгэл хаагдсан байна");
          return;
        }

        const allFull = batches.every((b) => b.isFull || (b.availableSeats != null && b.availableSeats <= 0));
        if (allFull) {
          toast.error(language === "en" ? "All batches are currently sold out" : "Бүх ээлж дүүрсэн байна");
          return;
        }

        if (!selectedBatchId) {
          toast.error(language === "en" ? "Please select a schedule batch to proceed" : "Үргэлжлүүлэхийн тулд хуваариа сонгоно уу");
          return;
        }

        const activeBatch = batches.find((b) => b._id === selectedBatchId);
        if (!activeBatch) {
          toast.error(language === "en" ? "Please select a valid schedule batch" : "Зөв хуваарь сонгоно уу");
          return;
        }

        if (activeBatch.bookingCutOffPassed) {
          toast.error(language === "en" ? "Registration for this batch has closed" : "Энэ ээлжийн бүртгэл хаагдсан байна");
          return;
        }

        if (activeBatch.isFull || (activeBatch.availableSeats != null && activeBatch.availableSeats <= 0)) {
          toast.error(language === "en" ? "This batch is already full" : "Энэ ээлж дүүрсэн байна");
          return;
        }

        router.push(`/eventbooking?id=${courseDetails._id}&scheduleId=${selectedBatchId}`);
        return;
      }

      // Check 4: Single schedule fallback
      if (currentSchedule?._id) {
        router.push(`/eventbooking?id=${courseDetails._id}&scheduleId=${currentSchedule._id}`);
      } else {
        router.push(`/eventbooking?id=${courseDetails._id}`);
      }
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bd-ink-900)", color: "var(--bd-white)", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, border: "3px solid var(--bd-ink-700)", borderTopColor: "var(--acc)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 15, color: "var(--bd-gray-400)" }}>{language === "en" ? "Loading course details..." : "Сургалтын мэдээлэл уншиж байна..."}</span>
          </div>
        </div>
        <Footer />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!courseDetails) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bd-ink-900)", color: "var(--bd-white)", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
          <div style={{ textAlign: "center", maxWidth: 440 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>{language === "en" ? "Course Not Found" : "Сургалт олдсонгүй"}</h2>
            <p style={{ color: "var(--bd-gray-400)", marginBottom: 24, fontSize: 14 }}>
              {language === "en" ? "The course you are looking for does not exist or has been removed." : "Таны хайсан сургалт олдсонгүй эсвэл устгагдсан байна."}
            </p>
            <Link
              href="/Programs-Listing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "12px 24px",
                borderRadius: 14,
                background: "var(--acc)",
                color: "var(--bd-white)",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              {language === "en" ? "Browse Courses" : "Бүх сургалт үзэх"}
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const {
    courseTitle,
    shortdesc,
    longdesc,
    price,
    duration,
    durationTranslation,
    currentSchedule,
    weeklySchedule,
    venueAddress,
    venueName,
    createdBy,
    enrollmentType,
    whatYouWillLearn,
    totalSessions,
    batches,
    bookingCutOff,
    bookingCutOffPassed,
    refundPolicy,
    oneMonthPassEnabled,
    oneMonthPassPrice,
    threeMonthPassEnabled,
    threeMonthPassPrice,
  } = courseDetails;

  const allBatchesCutOff = batches && batches.length > 0
    ? batches.filter((b) => b.status === "Active" || !b.status).every((b) => !!b.bookingCutOffPassed)
    : Boolean(bookingCutOffPassed);

  const allBatchesFull = batches && batches.length > 0
    ? batches.every((b) => b.isFull || (b.availableSeats != null && b.availableSeats <= 0))
    : false;

  const isBookingClosed = allBatchesCutOff || allBatchesFull;

  const durationText = formatCourseDuration(
    courseDetails.startDate || currentSchedule?.startDate,
    courseDetails.endDate || currentSchedule?.endDate,
    duration,
    durationTranslation,
    totalSessions,
    enrollmentType,
    language
  );

  const scheduleText = formatCourseSchedule(batches, weeklySchedule, enrollmentType, totalSessions, language);

  const fullVenue = [
    venueName,
    venueAddress?.address,
    venueAddress?.city,
    venueAddress?.state,
  ].filter(Boolean).join(", ") || (language === "en" ? "Ulaanbaatar, Mongolia" : "Улаанбаатар, Монгол Улс");

  const googleMapsUrl = (venueAddress?.latitude && venueAddress?.longitude)
    ? `https://www.google.com/maps/search/?api=1&query=${venueAddress.latitude},${venueAddress.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullVenue)}`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bd-ink-900)", color: "var(--bd-white)", display: "flex", flexDirection: "column" }}>
      <Header />

      <main id="top" data-screen-label="Course detail" style={{ maxWidth: 1224, width: "100%", margin: "0 auto", padding: "clamp(20px, 2.4vw, 28px) clamp(20px, 4vw, 32px) clamp(56px, 5vw, 80px)", boxSizing: "border-box" }}>

        {/* ─── Breadcrumbs ───────────────────────────────────────────────────── */}
        <nav className="bd-crumb" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--bd-gray-600)", marginBottom: 16, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "var(--bd-gray-600)", textDecoration: "none" }}>
            {language === "en" ? "Home" : "Нүүр"}
          </Link>
          <span>/</span>
          <Link href="/Programs-Listing" style={{ color: "var(--bd-gray-600)", textDecoration: "none" }}>
            {language === "en" ? "Courses" : "Сургалт"}
          </Link>
          <span>/</span>
          <span style={{ color: "var(--bd-gray-400)", maxWidth: "45ch", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {courseTitle}
          </span>
        </nav>

        {/* ─── Hero Banner ───────────────────────────────────────────────────── */}
        <div
          className="bd-hero"
          style={{
            position: "relative",
            height: "clamp(240px, 28vw, 380px)",
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid var(--bd-border)",
            background: `center 42%/cover no-repeat url(${heroImage})`,
            backgroundColor: "var(--bd-ink-800)",
          }}
        >
          {/* Fallback hidden image listener */}
          <img
            src={heroImage}
            alt=""
            style={{ display: "none" }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.style.backgroundImage = `url(${FALLBACK_IMG})`;
                parent.style.backgroundSize = "32% auto";
                parent.style.backgroundRepeat = "no-repeat";
                parent.style.backgroundPosition = "center";
              }
            }}
          />

          {/* Gradients */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,8,8,.42) 0%, transparent 38%, rgba(10,10,10,.86) 100%)" }} />

          {/* Hero Top Controls */}
          <div className="bd-hero-ctl" style={{ position: "absolute", left: 16, right: 16, top: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <Link
              href="/Programs-Listing"
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
                textDecoration: "none",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
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
                  border: isWishlisted ? "1px solid var(--acc)" : "none",
                  borderRadius: 999,
                  background: isWishlisted ? "rgba(35, 173, 164, 0.4)" : "rgba(0,0,0,.45)",
                  backdropFilter: "blur(8px)",
                  color: isWishlisted ? "var(--acc-bright)" : "var(--bd-white)",
                  cursor: "pointer",
                }}
              >
                <svg className="bd-hero-heart" width="22" height="22" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
              {courseTitle}
            </h1>
          </div>
        </div>

        {/* ─── Detail Grid: Content (Left) + Sticky Sidebar (Right) ──────────── */}
        <div className="bd-detail" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 348px", gap: "clamp(24px, 3vw, 40px)", alignItems: "start", marginTop: "clamp(24px, 2.6vw, 32px)" }}>

          {/* ════ LEFT COLUMN ══════════════════════════════════════════════════ */}
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "clamp(22px, 2.4vw, 30px)" }}>

            {/* Desktop Title Block */}
            <div className="bd-titleblock" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
              <h1 className="bd-h1" style={{ margin: 0, fontFamily: "var(--bd-font-ui)", fontSize: "clamp(28px, 2.55vw, 32px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-.02em", color: "var(--bd-white)", maxWidth: "22ch" }}>
                {courseTitle}
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
                  title={language === "en" ? "Share course" : "Хуваалцах"}
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
                  title={language === "en" ? "Save to favorites" : "Хадгалах"}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20.9C12 20.9 2.7 15.4 2.7 9.4C2.7 6.4 5 4.1 7.9 4.1C9.8 4.1 11.3 5.2 12 6.7C12.7 5.2 14.2 4.1 16.1 4.1C19 4.1 21.3 6.4 21.3 9.4C21.3 15.4 12 20.9 12 20.9Z" />
                  </svg>
                </button>
              </span>
            </div>

            {/* 2-Column Info Card */}
            <div className="bd-info">
              {/* Card 1: Course Duration */}
              <div className="bd-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="bd-tile">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                  <b style={{ fontSize: 15, fontWeight: 700, color: "var(--bd-white)" }}>
                    {language === "en" ? "Course Duration" : "Сургалтын хугацаа"}
                  </b>
                  <span style={{ fontSize: 14, lineHeight: 1.45, color: "var(--bd-gray-400)" }}>
                    {durationText}
                  </span>
                </span>
              </div>

              {/* Card 2: Schedule */}
              <div className="bd-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="bd-tile">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                  <b style={{ fontSize: 15, fontWeight: 700, color: "var(--bd-white)" }}>
                    {language === "en" ? "Schedule" : "Хуваарь"}
                  </b>
                  <span style={{ fontSize: 14, lineHeight: 1.45, color: "var(--bd-gray-400)" }}>
                    {scheduleText}
                  </span>
                </span>
              </div>
            </div>

            {/* Short Description */}
            {shortdesc && (
              <section>
                <h2 className="bd-h3">{language === "en" ? "Brief Summary" : "Товч танилцуулга"}</h2>
                <div className="bd-card">
                  <p className="bd-body">{shortdesc}</p>
                </div>
              </section>
            )}

            {/* About the Course (Expandable longdesc) */}
            {longdesc && (
              <section>
                <h2 className="bd-h3">{language === "en" ? "About the Course" : "Сургалтын тухай"}</h2>
                <div className="bd-card">
                  <p
                    className="bd-body bd-more"
                    style={{
                      maxHeight: expandedAbout ? "none" : 120,
                      overflow: "hidden",
                      position: "relative",
                      transition: "max-height 300ms ease",
                    }}
                  >
                    {longdesc}
                  </p>
                  {longdesc.length > 200 && (
                    <button
                      type="button"
                      className="bd-morebtn"
                      onClick={() => setExpandedAbout(!expandedAbout)}
                      style={{
                        marginTop: 10,
                        padding: 0,
                        border: "none",
                        background: "none",
                        fontFamily: "var(--bd-font-ui)",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--acc-bright)",
                        cursor: "pointer",
                      }}
                    >
                      {expandedAbout
                        ? (language === "en" ? "Show less" : "Хураах")
                        : (language === "en" ? "Read more" : "Цааш унших")}
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* What you will learn */}
            {whatYouWillLearn && (
              <section>
                <h2 className="bd-h3">{language === "en" ? "What You Will Learn" : "Юу сурах вэ?"}</h2>
                <div className="bd-card">
                  <div className="bd-body" style={{ whiteSpace: "pre-line", lineHeight: 1.75 }}>
                    {whatYouWillLearn}
                  </div>
                </div>
              </section>
            )}

            {/* Photo Gallery with View All functionality */}
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

            {/* Location Section */}
            <section>
              <h2 className="bd-h3">{language === "en" ? "Location" : "Байршил"}</h2>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 6 }}>
                  <b style={{ fontSize: 16, fontWeight: 700, color: "var(--bd-white)" }}>
                    {venueName || (language === "en" ? "Venue Location" : "Сургалтын байр")}
                  </b>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--bd-gray-400)" }}>
                    {fullVenue}
                  </span>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
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
                      textDecoration: "none",
                      transition: "border-color 200ms ease",
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

                {/* 132x132 Radar Preview Card */}
                <div style={{ position: "relative", width: 132, height: 132, flexShrink: 0, borderRadius: 18, overflow: "hidden", border: "1px solid var(--bd-border)", background: "var(--bd-ink-850)" }}>
                  <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(180px 140px at 50% 50%, rgba(35,173,164,.18), transparent 72%)" }} />
                  <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 999, background: "var(--acc)", boxShadow: "0 0 16px rgba(35, 173, 164, 0.6)", color: "var(--bd-white)" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                </div>
              </div>
            </section>

            {/* Organizer Card */}
            <section>
              <h2 className="bd-h3">{language === "en" ? "Organizer" : "Зохион байгуулагч"}</h2>
              <div className="bd-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <img
                  src={getFullImageUrl(createdBy?.profileImage) || FALLBACK_IMG}
                  alt={createdBy?.firstName || "Organizer"}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMG;
                  }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    objectFit: "cover",
                    background: "var(--bd-ink-800)",
                    border: "1px solid var(--bd-border)",
                  }}
                />
                <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <b style={{ fontSize: 15, fontWeight: 700, color: "var(--bd-white)" }}>
                    {createdBy ? `${createdBy.firstName || ""} ${createdBy.lastName || ""}`.trim() : (language === "en" ? "Bondy Academy" : "Бонди Академи")}
                  </b>
                  {createdBy?.isVerified && (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(35, 173, 164, 0.16)",
                        color: "var(--acc-bright)",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      ✓ {language === "en" ? "Verified" : "Баталгаажсан"}
                    </span>
                  )}
                </span>
                {createdBy?._id && (
                  <Link
                    href={`/profile?id=${createdBy._id}`}
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--acc-bright)",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {language === "en" ? "View" : "Үзэх"}
                  </Link>
                )}
              </div>
            </section>

            {/* Course Terms & Conditions */}
            <section>
              <div className="bd-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="bd-tile">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                  <b style={{ fontSize: 15, fontWeight: 700, color: "var(--bd-white)" }}>
                    {language === "en" ? "Course Terms" : "Сургалтын нөхцөл"}
                  </b>
                  <span style={{ fontSize: 13, color: "var(--bd-gray-400)", lineHeight: 1.5 }}>
                    {refundPolicy || (language === "en"
                      ? "Full refund available up to 14 days before start date. Non-refundable once the course commences."
                      : "Сургалт эхлэхээс 14 хоногийн өмнө цуцалбал бүрэн буцаалттай. Эхэлсний дараа буцаалтгүй.")}
                  </span>
                </span>
              </div>
            </section>
          </div>

          {/* ════ RIGHT COLUMN: STICKY BOOKING SIDEBAR ═════════════════════════ */}
          <aside className="bd-book" style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 14, padding: "22px 22px 18px", borderRadius: 24, background: "var(--bd-ink-850)", border: "1px solid var(--bd-border)", boxShadow: "0 24px 60px rgba(0,0,0,.32)" }}>

            {/* Price Header */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, color: "var(--bd-gray-500)" }}>
                {language === "en" ? "Course Tuition" : "Сургалтын үнэ"}
              </span>
              <b style={{ fontFamily: "var(--bd-font-ui)", fontSize: 27, fontWeight: 700, letterSpacing: "-.02em", color: "var(--bd-white)" }}>
                {formatPrice(price)}
              </b>
            </div>

            {/* Batches / Schedule Selection with Validations and Checks */}
            {batches && batches.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--bd-gray-400)" }}>
                  {language === "en" ? "Available Batches" : "Сургалтын ээлж / Хуваарь"}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto", paddingRight: 2 }}>
                  {batches.map((batch) => {
                    const isSelected = selectedBatchId === batch._id;
                    const isCutOff = !!batch.bookingCutOffPassed;
                    const isFull = !!batch.isFull || (batch.availableSeats != null && batch.availableSeats <= 0);
                    const isUnavailable = isCutOff || isFull;

                    return (
                      <div
                        key={batch._id}
                        onClick={() => {
                          if (!isUnavailable) {
                            setSelectedBatchId(batch._id);
                            setSelectedPassType("");
                          }
                        }}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 14,
                          border: isSelected ? "2px solid var(--acc)" : "1px solid var(--bd-border)",
                          background: isSelected ? "rgba(35, 173, 164, 0.08)" : (isUnavailable ? "rgba(255,255,255,0.02)" : "var(--bd-ink-800)"),
                          cursor: isUnavailable ? "not-allowed" : "pointer",
                          opacity: isUnavailable ? 0.6 : 1,
                          transition: "all 160ms ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <b style={{ fontSize: 13.5, color: isSelected ? "var(--acc-bright)" : "var(--bd-white)", fontWeight: 700 }}>
                            {batch.batchName || (language === "en" ? "Standard Batch" : "Энгийн ээлж")}
                          </b>
                          {isCutOff ? (
                            <span style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(239,68,68,0.16)", color: "#EF4444", fontSize: 11, fontWeight: 700 }}>
                              {language === "en" ? "Closed" : "Хаагдсан"}
                            </span>
                          ) : isFull ? (
                            <span style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(239,68,68,0.16)", color: "#EF4444", fontSize: 11, fontWeight: 700 }}>
                              {language === "en" ? "Sold out" : "Дүүрсэн"}
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--acc-bright)" }}>
                              {batch.availableSeats} {language === "en" ? "left" : "суудал"}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--bd-gray-400)", marginTop: 4, display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {batch.days && batch.days.length > 0 && <span>📅 {batch.days.join(", ")}</span>}
                          {batch.startTime && (
                            <span>
                              🕒 {formatTime(batch.startTime, true, language)}
                              {batch.endTime ? ` – ${formatTime(batch.endTime, true, language)}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Passes for Ongoing courses */}
            {enrollmentType === "Ongoing" && (oneMonthPassEnabled || threeMonthPassEnabled) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--bd-gray-400)" }}>
                  {language === "en" ? "Pass Options" : "Багцын сонголт"}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {oneMonthPassEnabled && (
                    <div
                      onClick={() => setSelectedPassType(selectedPassType === "1month" ? "" : "1month")}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: selectedPassType === "1month" ? "2px solid var(--acc)" : "1px solid var(--bd-border)",
                        background: selectedPassType === "1month" ? "rgba(35, 173, 164, 0.08)" : "var(--bd-ink-800)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <b style={{ fontSize: 13, color: "var(--bd-white)", display: "block" }}>
                          {language === "en" ? "1 Month Pass" : "1 Сарын багц"}
                        </b>
                        <span style={{ fontSize: 11, color: "var(--bd-gray-500)" }}>
                          {language === "en" ? "30 days unlimited access" : "30 хоног хязгааргүй"}
                        </span>
                      </div>
                      <b style={{ fontSize: 13, color: "var(--acc-bright)" }}>
                        {formatPrice(oneMonthPassPrice)}
                      </b>
                    </div>
                  )}

                  {threeMonthPassEnabled && (
                    <div
                      onClick={() => setSelectedPassType(selectedPassType === "3month" ? "" : "3month")}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: selectedPassType === "3month" ? "2px solid var(--acc)" : "1px solid var(--bd-border)",
                        background: selectedPassType === "3month" ? "rgba(35, 173, 164, 0.08)" : "var(--bd-ink-800)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <b style={{ fontSize: 13, color: "var(--bd-white)", display: "block" }}>
                          {language === "en" ? "3 Month Pass" : "3 Сарын багц"}
                        </b>
                        <span style={{ fontSize: 11, color: "var(--bd-gray-500)" }}>
                          {language === "en" ? "90 days unlimited access" : "90 хоног хязгааргүй"}
                        </span>
                      </div>
                      <b style={{ fontSize: 13, color: "var(--acc-bright)" }}>
                        {formatPrice(threeMonthPassPrice)}
                      </b>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cut-off info / Booking status notice */}
            {isBookingClosed && (
              <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "#EF4444", fontSize: 12.5, fontWeight: 600, textAlign: "center" }}>
                {allBatchesFull
                  ? (language === "en" ? "This course is completely booked out." : "Энэ сургалтын бүх суудал дүүрсэн байна.")
                  : (language === "en" ? "The registration deadline has passed for this course." : "Энэ сургалтын бүртгэлийн хугацаа дууссан байна.")}
              </div>
            )}

            {bookingCutOff && !isBookingClosed && (
              <div style={{ fontSize: 12, color: "var(--bd-gray-500)", textAlign: "center" }}>
                ⏱ {language === "en" ? "Cut-off" : "Бүртгэл хаагдах"}: <b>{bookingCutOff}</b>
              </div>
            )}

            {/* Primary Action CTA */}
            <button
              type="button"
              className="bd-book-cta-btn"
              onClick={handleRegister}
              disabled={isBookingClosed}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: 48,
                borderRadius: 14,
                border: "none",
                background: isBookingClosed ? "var(--bd-ink-700)" : "var(--acc)",
                color: "var(--bd-white)",
                fontSize: 15,
                fontWeight: 700,
                cursor: isBookingClosed ? "not-allowed" : "pointer",
                transition: "background 200ms ease, transform 160ms ease",
                marginTop: 6,
              }}
            >
              {isBookingClosed
                ? (language === "en" ? "Registration Closed" : "Бүртгэл хаагдсан")
                : (language === "en" ? "Register Now" : "Бүртгүүлэх")}
            </button>
          </aside>
        </div>

        {/* ─── Similar Courses Section ────────────────────────────────────────── */}
        {similarCourses && similarCourses.length > 0 && (
          <section className="bd-similar" style={{ marginTop: "clamp(44px, 4.4vw, 64px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
              <h2 className="bd-h2" style={{ margin: 0, fontFamily: "var(--bd-font-ui)", fontSize: 26, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-.016em", color: "var(--bd-white)" }}>
                {language === "en" ? "Similar Courses" : "Төстэй сургалтууд"}
              </h2>
              <Link
                href="/Programs-Listing"
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
                  textDecoration: "none",
                  transition: "border-color 200ms ease, color 200ms ease",
                }}
              >
                {language === "en" ? "View all" : "Бүгдийг харах"}
              </Link>
            </div>

            <div className="bd-rail" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(258px, 1fr))", gap: 20 }}>
              {similarCourses.map((sim) => {
                const isFav = !!favorites[sim._id];
                const simPoster = sim.posterImage?.[0] ? getFullImageUrl(sim.posterImage[0]) : FALLBACK_IMG;
                const simPriceText = formatPrice(sim.price);
                const simSchedLine = (language === "mn" ? sim.durationTranslation : sim.duration) ||
                  (sim.batches?.[0]?.days ? `${sim.batches[0].days.join(", ")}` : (language === "en" ? "Course" : "Сургалт"));
                const simOrgName = sim.createdBy ? `${sim.createdBy.firstName || ""} ${sim.createdBy.lastName || ""}`.trim() : (language === "en" ? "Bondy Academy" : "Бонди Академи");

                return (
                  <Link key={sim._id} href={`/programDetails?id=${sim._id}`} className="bd-c" style={{ textDecoration: "none" }}>
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
                      <b className="bd-c-t">{sim.courseTitle}</b>
                      <span className="bd-c-m" data-sched-line>{simSchedLine}</span>
                      <span className="bd-c-m">{simOrgName}</span>
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
          <small>{language === "en" ? "Course Price" : "Сургалтын үнэ"}</small>
          <b>{formatPrice(courseDetails.price)}</b>
        </span>
        <button
          type="button"
          onClick={handleRegister}
          disabled={isBookingClosed}
          style={{
            flex: "0 0 calc(60% - 14px)",
            minWidth: "calc(60% - 14px)",
            height: 48,
            borderRadius: 14,
            border: "none",
            background: isBookingClosed ? "var(--bd-ink-700)" : "var(--acc)",
            color: "var(--bd-white)",
            fontSize: 15,
            fontWeight: 700,
            cursor: isBookingClosed ? "not-allowed" : "pointer",
          }}
        >
          {isBookingClosed
            ? (language === "en" ? "Closed" : "Хаагдсан")
            : (language === "en" ? "Register" : "Бүртгүүлэх")}
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

      <FAQ />
      <Footer />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "var(--bd-ink-900)", color: "var(--bd-white)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Loading...
        </div>
      }
    >
      <ProgramDetailsContent />
    </Suspense>
  );
}
