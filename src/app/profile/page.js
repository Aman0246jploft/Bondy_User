"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReviewListModal from "@/components/Modal/ReviewListModal";
import authApi from "@/api/authApi";
import blockUserApi from "@/api/blockUser";
import reportUserApi from "@/api/reportUser";
import wishlistApi from "@/api/wishlistApi";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";

// ─── Helpers ───────────────────────────────────────────────────────────────────
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
    const s = String(startTime);
    const e = endTime ? String(endTime) : "";
    timePart = e ? ` · ${s} – ${e}` : ` · ${s}`;
  }

  return `${monthName}, ${dayName}${timePart}`;
}

function getCardPrice(item, lang) {
  let priceVal = null;
  if (item.ticketPrice !== undefined && item.ticketPrice !== null) {
    priceVal = item.ticketPrice;
  } else if (item.price !== undefined && item.price !== null) {
    priceVal = item.price;
  } else if (item.tickets && Array.isArray(item.tickets) && item.tickets.length > 0) {
    const prices = item.tickets.map((t) => Number(t.price)).filter((p) => !isNaN(p) && p >= 0);
    if (prices.length > 0) priceVal = Math.min(...prices);
  }

  if (priceVal === 0) return lang === "mn" ? "Үнэгүй" : "Free";
  if (priceVal != null) {
    try {
      const locale = lang === "mn" ? "mn-MN" : "en-US";
      return `₮${Number(priceVal).toLocaleString(locale)}`;
    } catch {
      return `₮${priceVal}`;
    }
  }
  return lang === "mn" ? "Үнэгүй" : "Free";
}

// ─── Carousel Rail Component ──────────────────────────────────────────────────
function CarouselRail({ items, isPast = false, language, onFavToggle, favorites = {} }) {
  const railRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(max > 6 && el.scrollLeft < max - 6);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, items]);

  const glide = (dir) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.firstElementChild;
    const step = card ? (card.getBoundingClientRect().width + 19) * 2 : el.clientWidth * 0.75;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className="op-railwrap">
      {canScrollLeft && (
        <button
          type="button"
          className="op-arw op-arw-l"
          aria-label={language === "mn" ? "Өмнөх" : "Previous"}
          onClick={() => glide(-1)}
        >
          ‹
        </button>
      )}

      <div className="bd-rail" ref={railRef}>
        {items.map((item, idx) => {
          const id = item._id || item.id || `evt-${idx}`;
          const isCourse = Boolean(item.courseTitle || item.schedules);
          const detailUrl = isCourse ? `/programDetails?id=${id}` : `/eventDetails?id=${id}`;
          const title = item.eventTitle || item.courseTitle || item.name || item.title || "";
          const rawImg = Array.isArray(item.posterImage) ? item.posterImage[0] : (item.posterImage || item.bannerImage || item.coverImage || item.img);
          const imgUrl = rawImg ? getFullImageUrl(rawImg) : "/img/sidebar-logo.svg";
          const dateText = formatDateBilingual(item.startDate || item.date, item.startTime, item.endTime, language);
          const venueText = item.venueName || (item.venueAddress?.city ? `${item.venueAddress.city}${item.venueAddress.address ? `, ${item.venueAddress.address}` : ""}` : (item.venueAddress?.address || item.location || "Улаанбаатар"));
          const priceText = getCardPrice(item, language);
          const isFav = Boolean(favorites[id]);

          return (
            <Link
              key={id}
              href={detailUrl}
              className={`bd-c ${isPast ? "bd-c-past" : ""}`}
            >
              <span
                className="bd-c-img"
                style={{
                  backgroundImage: `url(${imgUrl})`,
                  backgroundColor: "var(--bd-ink-800)",
                }}
              >
                {!isPast && onFavToggle && (
                  <button
                    type="button"
                    className={`bd-c-fav ${isFav ? "active" : ""}`}
                    aria-label={language === "mn" ? "Хадгалах" : "Save"}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onFavToggle(item, e);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20.9C12 20.9 2.7 15.4 2.7 9.4C2.7 6.4 5 4.1 7.9 4.1C9.8 4.1 11.3 5.2 12 6.7C12.7 5.2 14.2 4.1 16.1 4.1C19 4.1 21.3 6.4 21.3 9.4C21.3 15.4 12 20.9 12 20.9Z" />
                    </svg>
                  </button>
                )}
              </span>
              <span className="bd-c-b">
                <b className="bd-c-t">{title}</b>
                <span className="bd-c-m">{dateText}</span>
                <span className="bd-c-m">{venueText}</span>
                <span className="bd-c-p">{priceText}</span>
              </span>
            </Link>
          );
        })}
      </div>

      <span className="op-fade op-fade-l" style={{ opacity: canScrollLeft ? 1 : 0 }} aria-hidden="true" />
      <span className="op-fade op-fade-r" style={{ opacity: canScrollRight ? 1 : 0 }} aria-hidden="true" />

      {canScrollRight && (
        <button
          type="button"
          className="op-arw op-arw-r"
          aria-label={language === "mn" ? "Дараах" : "Next"}
          onClick={() => glide(1)}
        >
          ›
        </button>
      )}
    </div>
  );
}

// ─── Followers / Following Sheet Modal ─────────────────────────────────────────
function FollowListSheet({ show, onClose, userId, initialTab = "followers", orgName, language }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchPeople = useCallback(async (tab, pageNum) => {
    if (!userId) return;
    setLoading(true);
    setError(false);
    try {
      const params = { userId, pageNo: pageNum, size: 12 };
      const response = tab === "followers"
        ? await authApi.getFollowers(params)
        : await authApi.getFollowing(params);

      if (response?.status) {
        const data = tab === "followers" ? (response?.data?.followers || []) : (response?.data?.following || []);
        if (data.length === 0) {
          if (pageNum === 1) setPeople([]);
          setHasMore(false);
        } else {
          setPeople((prev) => (pageNum === 1 ? data : [...prev, ...data]));
          if (data.length < 12) setHasMore(false);
        }
      } else {
        if (pageNum === 1) setPeople([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching follow list:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (show && userId) {
      setPeople([]);
      setPage(1);
      setHasMore(true);
      fetchPeople(activeTab, 1);
    }
  }, [show, userId, activeTab, fetchPeople]);

  const handleTabChange = (newTab) => {
    if (activeTab === newTab) return;
    setActiveTab(newTab);
    setPeople([]);
    setPage(1);
    setHasMore(true);
    fetchPeople(newTab, 1);
  };

  const handleFollowToggle = async (e, targetUserId, isCurrentlyFollowed, idx) => {
    e.stopPropagation();
    try {
      const response = isCurrentlyFollowed
        ? await authApi.unfollowUser({ toUser: targetUserId })
        : await authApi.followUser({ toUser: targetUserId });

      if (response?.status) {
        setPeople((prev) => {
          const next = [...prev];
          if (next[idx]) {
            next[idx] = { ...next[idx], isFollowed: !isCurrentlyFollowed };
          }
          return next;
        });
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  if (!show) return null;

  const isFollowers = activeTab === "followers";
  const sheetTitle = isFollowers
    ? (language === "mn" ? "Дагагч" : "Followers")
    : (language === "mn" ? "Дагаж байна" : "Following");
  const sheetSub = isFollowers
    ? `${orgName || ""}${language === "mn" ? "-ыг дагаж байгаа" : " followers"}`
    : `${orgName || ""}${language === "mn" ? " дагаж байгаа" : " following"}`;

  return (
    <div
      className="op-scrim"
      onClick={(e) => {
        if (e.target.classList.contains("op-scrim")) onClose();
      }}
    >
      <div className="op-sheet" data-sheet>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--bd-font-ui)", fontSize: 20, fontWeight: 700, letterSpacing: "-.014em", color: "var(--bd-white)" }}>
              {sheetTitle}
            </h2>
            <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--bd-gray-500)" }}>
              {sheetSub}
            </p>
          </div>
          <button
            type="button"
            aria-label="Хаах"
            onClick={onClose}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              flexShrink: 0,
              padding: 0,
              border: "1px solid var(--bd-border)",
              borderRadius: 999,
              background: "transparent",
              color: "var(--bd-gray-400)",
              fontSize: 20,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {/* Tab pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            marginTop: 16,
            padding: 4,
            borderRadius: 999,
            background: "var(--bd-ink-800)",
            border: "1px solid var(--bd-border)",
          }}
        >
          <button
            type="button"
            onClick={() => handleTabChange("followers")}
            style={{
              flex: 1,
              height: 36,
              padding: "0 15px",
              border: "none",
              borderRadius: 999,
              fontFamily: "var(--bd-font-ui)",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              background: isFollowers ? "var(--acc)" : "transparent",
              color: isFollowers ? "var(--bd-white)" : "var(--bd-gray-400)",
              transition: "background 180ms ease, color 180ms ease",
            }}
          >
            {language === "mn" ? "Дагагч" : "Followers"}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("following")}
            style={{
              flex: 1,
              height: 36,
              padding: "0 15px",
              border: "none",
              borderRadius: 999,
              fontFamily: "var(--bd-font-ui)",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              background: !isFollowers ? "var(--acc)" : "transparent",
              color: !isFollowers ? "var(--bd-white)" : "var(--bd-gray-400)",
              transition: "background 180ms ease, color 180ms ease",
            }}
          >
            {language === "mn" ? "Дагаж байна" : "Following"}
          </button>
        </div>

        {/* Skeletons while initial loading */}
        {loading && people.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
            <div className="op-skel" style={{ height: 68 }} />
            <div className="op-skel" style={{ height: 68 }} />
            <div className="op-skel" style={{ height: 68 }} />
          </div>
        )}

        {/* Error state */}
        {!loading && error && people.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 16, padding: "30px 14px", textAlign: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 54, height: 54, borderRadius: 999, background: "rgba(255,90,90,.12)", color: "#FF5A5A" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </span>
            <b style={{ fontSize: 16, fontWeight: 700, color: "var(--bd-white)" }}>
              {language === "mn" ? "Жагсаалтыг татаж чадсангүй" : "Failed to load list"}
            </b>
            <button
              type="button"
              onClick={() => fetchPeople(activeTab, 1)}
              style={{
                height: 42,
                padding: "0 20px",
                border: "none",
                borderRadius: 999,
                background: "var(--acc)",
                color: "var(--bd-white)",
                fontFamily: "var(--bd-font-ui)",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {language === "mn" ? "Дахин оролдох" : "Retry"}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && people.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 16, padding: "30px 14px", textAlign: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 54, height: 54, borderRadius: 999, background: "var(--bd-ink-800)", color: "var(--bd-gray-500)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </span>
            <b style={{ fontSize: 16, fontWeight: 700, color: "var(--bd-white)" }}>
              {isFollowers ? (language === "mn" ? "Дагагч байхгүй" : "No followers yet") : (language === "mn" ? "Хэнийг ч дагаагүй" : "Not following anyone")}
            </b>
            <p style={{ margin: 0, maxWidth: "32ch", fontSize: 13.5, lineHeight: 1.55, color: "var(--bd-gray-500)" }}>
              {isFollowers
                ? (language === "mn" ? "Эвент нийтлэх тусам дагагч нэмэгдэнэ." : "Followers will appear here as people discover your events.")
                : (language === "mn" ? "Зохион байгуулагч хэнийг ч дагаагүй байна." : "This organizer is not currently following anyone.")}
            </p>
          </div>
        )}

        {/* People list */}
        {people.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
            {people.map((p, idx) => {
              const pId = p._id || p.id;
              const pName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.name || "User";
              const pImg = p.profileImage ? getFullImageUrl(p.profileImage) : "/img/sidebar-logo.svg";
              const pMeta = p.role === "ORGANIZER"
                ? (language === "mn" ? "Зохион байгуулагч" : "Organizer")
                : (p.bio ? p.bio.slice(0, 36) : (language === "mn" ? "Хэрэглэгч" : "User"));
              const isPFollowed = Boolean(p.isFollowed);

              return (
                <div
                  key={pId || idx}
                  onClick={() => {
                    onClose();
                    router.push(`/profile?id=${pId}`);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 13,
                    padding: "13px 15px",
                    border: "1px solid var(--bd-border)",
                    borderRadius: 16,
                    background: "var(--bd-ink-800)",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={pImg}
                    alt={pName}
                    style={{
                      width: 42,
                      height: 42,
                      flexShrink: 0,
                      borderRadius: 999,
                      objectFit: "cover",
                      background: "var(--bd-ink-850)",
                    }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/img/sidebar-logo.svg";
                    }}
                  />
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <b style={{ fontSize: 14.5, fontWeight: 600, color: "var(--bd-white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {pName}
                    </b>
                    <span style={{ fontSize: 12.5, color: "var(--bd-gray-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {pMeta}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleFollowToggle(e, pId, isPFollowed, idx)}
                    style={
                      isPFollowed
                        ? {
                          flexShrink: 0,
                          height: 34,
                          padding: "0 14px",
                          border: "1px solid var(--acc)",
                          borderRadius: 999,
                          background: "rgba(35,173,164,.13)",
                          color: "var(--acc-bright)",
                          fontFamily: "var(--bd-font-ui)",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }
                        : {
                          flexShrink: 0,
                          height: 34,
                          padding: "0 14px",
                          border: "none",
                          borderRadius: 999,
                          background: "var(--acc)",
                          color: "var(--bd-white)",
                          fontFamily: "var(--bd-font-ui)",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }
                    }
                  >
                    {isPFollowed
                      ? (language === "mn" ? "Дагаж байна" : "Following")
                      : (language === "mn" ? "Дагах" : "Follow")}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Profile Component ───────────────────────────────────────────────────
function ProfileContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");
  const router = useRouter();
  const { t, language } = useLanguage();

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [followBusy, setFollowBusy] = useState(false);

  // Modals & Menu
  const [showFollowSheet, setShowFollowSheet] = useState(false);
  const [followSheetTab, setFollowSheetTab] = useState("followers");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportError, setReportError] = useState("");
  const [showAllInterests, setShowAllInterests] = useState(false);

  // Favorites
  const [favorites, setFavorites] = useState({});

  const menuRef = useRef(null);

  // Load favorites from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bondy_favorites");
      if (stored) {
        const arr = JSON.parse(stored);
        const map = {};
        arr.forEach((id) => {
          map[id] = true;
        });
        setFavorites(map);
      }
    } catch { }
  }, []);

  const handleFavoriteToggle = async (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const id = item._id || item.id;
    if (!id) return;
    const isFav = Boolean(favorites[id]);
    const nextMap = { ...favorites, [id]: !isFav };
    if (isFav) delete nextMap[id];
    setFavorites(nextMap);

    try {
      localStorage.setItem("bondy_favorites", JSON.stringify(Object.keys(nextMap)));
    } catch { }

    try {
      if (isFav) {
        await wishlistApi.removeFromWishlist({ entityId: id });
      } else {
        const isCourse = Boolean(item.courseTitle || item.schedules);
        await wishlistApi.addToWishlist({ entityId: id, entityModel: isCourse ? "Course" : "Event" });
      }
    } catch (err) {
      console.error("Failed to update wishlist:", err);
    }
  };

  // Click outside to close menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch target user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (userId) {
        try {
          setLoading(true);
          const response = await authApi.getUserProfileById(userId);
          if (response?.status) {
            setUserProfile(response?.data?.user);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserProfile();
  }, [userId]);

  // Fetch logged in user self profile for role detection
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await authApi.getSelfProfile();
        if (response?.status) {
          setCurrentUserRole(response?.data?.user?.role);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Document Title
  useEffect(() => {
    if (userProfile?.firstName || userProfile?.lastName) {
      document.title = `${userProfile.firstName || ""} ${userProfile.lastName || ""} · Bondy`;
    } else if (userProfile?.name) {
      document.title = `${userProfile.name} · Bondy`;
    } else {
      document.title = "Profile · Bondy";
    }
  }, [userProfile]);

  // Follow/Unfollow Handler
  const handleFollowToggle = async () => {
    if (followBusy || !userId) return;
    setFollowBusy(true);
    const isCurrentlyFollowed = Boolean(userProfile?.isFollowed);
    try {
      if (isCurrentlyFollowed) {
        const response = await authApi.unfollowUser({ toUser: userId });
        if (response?.status) {
          setUserProfile((prev) => ({
            ...prev,
            isFollowed: false,
            totalFollowers: Math.max((prev.totalFollowers || 0) - 1, 0),
          }));
        }
      } else {
        const response = await authApi.followUser({ toUser: userId });
        if (response?.status) {
          setUserProfile((prev) => ({
            ...prev,
            isFollowed: true,
            totalFollowers: (prev.totalFollowers || 0) + 1,
          }));
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setFollowBusy(false);
    }
  };

  // Block/Unblock Confirm Action
  const handleAction = (type) => {
    setActionType(type);
    setShowMenu(false);
    if (type === "report") {
      setShowReportModal(true);
    } else {
      setShowConfirm(true);
    }
  };

  const handleConfirm = async () => {
    try {
      if (actionType === "block") {
        const res = await blockUserApi.blockUser({ toUser: userId });
        setShowConfirm(false);
        if (res?.status === true) {
          toast.success(t("userBlockedSuccessfully") || res?.message);
          setUserProfile((prev) => ({
            ...prev,
            isBlocked: true,
          }));
        }
      } else if (actionType === "unblock") {
        const res = await blockUserApi.unblockUser({ toUser: userId });
        setShowConfirm(false);
        if (res?.status === true) {
          toast.success(t("userUnblockedSuccessfully") || res?.message);
          setUserProfile((prev) => ({
            ...prev,
            isBlocked: false,
          }));
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleReportSubmit = async () => {
    const reason = reportReason.trim();
    const description = reportDescription.trim();

    if (!reason) {
      setReportError(language === "mn" ? "Шалтгаанаа оруулна уу" : "Reason is required");
      return;
    }
    setReportError("");

    try {
      const res = await reportUserApi.reportUser({
        toUser: userId,
        reason,
        description,
      });

      setShowReportModal(false);
      setReportReason("");
      setReportDescription("");
      if (res?.status === true) {
        toast.success(t("userReportedSuccessfully") || res?.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--bd-ink-900, #0D0D0D)", color: "#fff", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <span className="op-spin" style={{ width: 24, height: 24, borderWidth: 3 }} />
          <span>{t("loadingProfile") || "Уншиж байна…"}</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (!userProfile && !loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--bd-ink-900, #0D0D0D)", color: "#fff", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <span style={{ fontSize: 18, color: "var(--bd-gray-400)" }}>{t("userNotFound") || "Хэрэглэгч олдсонгүй"}</span>
          <Link
            href="/Organizers"
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              background: "var(--acc)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {language === "mn" ? "Зохион байгуулагчид руу буцах" : "Back to Organizers"}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const orgName = `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim() || userProfile.name || userProfile.organizerName || "Organizer";
  const avatarUrl = userProfile.profileImage ? getFullImageUrl(userProfile.profileImage) : "/img/sidebar-logo.svg";
  const coverUrl = userProfile.backgroundImage ? getFullImageUrl(userProfile.backgroundImage) : "";
  const isVerified = Boolean(
    userProfile.role === "ORGANIZER" && (userProfile.organizerVerificationStatus === "approved" || userProfile.isVerified)
  );
  const orgCategory = userProfile.category || (userProfile.role === "ORGANIZER" ? (t("eventOrganizer") || "Зохион байгуулагч") : (t("userRole") || "Хэрэглэгч"));
  const orgIntro = userProfile.bio || (language === "mn" ? "Танилцуулга оруулаагүй байна." : "No introduction provided yet.");

  const upcomingEvents = [
    ...(userProfile?.events?.upcoming_events || []),
    ...(userProfile?.courses?.upcoming_courses || []),
  ];

  const pastEvents = [
    ...(userProfile?.events?.previous_events || []),
    ...(userProfile?.courses?.previous_courses || []),
  ];

  const isFollowing = Boolean(userProfile?.isFollowed);
  const isSelf = Boolean(userProfile?.isMyProfile);

  return (
    <div style={{ width: "100%", background: "var(--bd-ink-900, #0D0D0D)", minHeight: "100vh", overflowX: "hidden" }}>
      {/* Global & Injected Styles exactly matching Bondy Organizer Profile.dc.html */}
      <style jsx global>{`
        @keyframes opSpin { to { transform: rotate(360deg); } }
        @keyframes opShim { from { background-position: 100% 0; } to { background-position: 0 0; } }

        .op-scrim {
          position: fixed; inset: 0; z-index: 80;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, .66);
          backdrop-filter: blur(4px);
        }
        .op-sheet {
          box-sizing: border-box; width: 100%; max-width: 520px; max-height: 86vh;
          overflow-y: auto; padding: 24px;
          border: 1px solid var(--bd-border-strong, #363636);
          border-radius: 24px;
          background: var(--bd-ink-850, #161616);
          box-shadow: 0 30px 80px rgba(0, 0, 0, .6);
        }
        .op-skel {
          border-radius: 16px;
          background: linear-gradient(90deg, var(--bd-ink-800, #1A1A1A) 25%, var(--bd-ink-850, #161616) 37%, var(--bd-ink-800, #1A1A1A) 63%);
          background-size: 400% 100%;
          animation: opShim 1.4s ease-in-out infinite;
        }
        .op-spin {
          display: inline-block;
          width: 16px; height: 16px;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, .32);
          border-top-color: currentColor;
          animation: opSpin 700ms linear infinite;
        }

        .op-railwrap { position: relative; }
        .bd-rail {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: calc((100% - 76px) / 4.17);
          grid-template-columns: none;
          gap: 19px;
          overflow-x: auto;
          overflow-y: visible;
          scroll-snap-type: x mandatory;
          scroll-padding-left: 32px;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        .bd-rail::-webkit-scrollbar { display: none; }
        .bd-rail > * { scroll-snap-align: start; min-width: 0; }

        .op-fade {
          position: absolute; top: 0; bottom: 0; width: 42px; z-index: 3;
          pointer-events: none; opacity: 0;
          transition: opacity 220ms cubic-bezier(.2, .8, .2, 1);
        }
        .op-fade-l {
          left: 0;
          background: linear-gradient(to right, rgba(13, 13, 13, .8) 0%, rgba(13, 13, 13, .32) 55%, rgba(13, 13, 13, 0) 76%, rgba(13, 13, 13, 0) 100%);
        }
        .op-fade-r {
          right: 0;
          background: linear-gradient(to left, rgba(13, 13, 13, .8) 0%, rgba(13, 13, 13, .32) 55%, rgba(13, 13, 13, 0) 76%, rgba(13, 13, 13, 0) 100%);
        }

        .op-arw {
          position: absolute; top: 50%; transform: translateY(-50%); z-index: 4;
          display: flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; padding: 0;
          border-radius: 999px;
          border: 1px solid var(--bd-border-strong, #363636);
          background: rgba(11, 11, 11, .86);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: var(--bd-white, #FFFFFF);
          font-family: var(--bd-font-ui);
          font-size: 19px; line-height: 1; cursor: pointer;
          transition: border-color 200ms cubic-bezier(.2, .8, .2, 1), background 200ms cubic-bezier(.2, .8, .2, 1);
        }
        .op-arw:hover { border-color: var(--acc, #23ADA4); }
        .op-arw-l { left: -14px; }
        .op-arw-r { right: -2px; }

        .bd-c {
          position: relative; display: block;
          aspect-ratio: 3/4;
          border-radius: 22px;
          overflow: hidden;
          background: var(--bd-ink-850, #161616);
          border: 1px solid var(--bd-border, rgba(255, 255, 255, .08));
          color: inherit; text-decoration: none;
          box-sizing: border-box;
          transition: border-color 160ms cubic-bezier(.2, .8, .2, 1), transform 160ms cubic-bezier(.2, .8, .2, 1);
        }
        .bd-c:hover {
          border-color: var(--bd-border-strong, #363636);
          transform: translateY(-2px);
        }
        .bd-c-img {
          position: absolute; inset: 0; display: block;
          background-color: var(--bd-ink-800, #1A1A1A);
          background-size: cover;
          background-position: center;
          transition: transform 180ms cubic-bezier(.2, .8, .2, 1);
        }
        .bd-c:hover .bd-c-img { transform: scale(1.02); }
        .bd-c-img::after {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 32%, rgba(0, 0, 0, .22) 48%, rgba(3, 3, 3, .76) 63%, rgba(2, 2, 2, .94) 78%, rgba(1, 1, 1, .99) 100%);
        }

        .bd-c-fav {
          position: absolute; top: 12px; right: 12px; z-index: 3;
          display: inline-flex; align-items: center; justify-content: center;
          width: 36px; height: 36px;
          border-radius: 999px;
          background: rgba(11, 11, 11, .6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, .14);
          color: var(--bd-white, #FFFFFF);
          cursor: pointer;
          transition: transform 160ms ease, background 160ms ease, color 160ms ease;
        }
        .bd-c-fav:hover {
          transform: scale(1.08);
          background: rgba(11, 11, 11, .85);
        }
        .bd-c-fav.active {
          color: #FF4D6D;
          border-color: rgba(255, 77, 109, .4);
        }
        .bd-c-fav svg { width: 18px; height: 18px; }

        .bd-c-b {
          position: absolute; z-index: 2; left: 0; right: 0; bottom: 0;
          display: flex; flex-direction: column; gap: 5px;
          padding: 0 17px 17px; min-width: 0;
        }
        .bd-c-t {
          font-family: var(--bd-font-ui);
          font-size: 17px; font-weight: 700; line-height: 1.26; letter-spacing: -.012em;
          color: var(--bd-white, #FFFFFF);
          text-shadow: 0 1px 14px rgba(0, 0, 0, .55);
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .bd-c-m {
          font-size: 13px; line-height: 1.35;
          color: rgba(255, 255, 255, .76);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .bd-c-p {
          margin-top: 7px;
          font-family: var(--bd-font-ui);
          font-size: 18px; font-weight: 700;
          color: var(--bd-white, #FFFFFF);
        }

        .op-mobbar { display: none; }

        @media (max-width: 760px) {
          main[data-screen-label="Organizer profile"] {
            padding-left: 16px !important;
            padding-right: 16px !important;
            padding-top: 0 !important;
          }
          main[data-screen-label="Organizer profile"] > nav.bd-crumb {
            display: none !important;
          }
          .op-mobbar {
            display: flex; align-items: center; gap: 12px;
            position: sticky; top: 0; z-index: 30;
            margin: 0 -16px 14px; padding: 12px 16px;
            background: rgba(11, 11, 11, .92);
            backdrop-filter: blur(20px) saturate(140%);
            border-bottom: 1px solid var(--bd-border-soft, rgba(255, 255, 255, .08));
          }
          .op-mobback {
            display: inline-flex; align-items: center; justify-content: center;
            width: 38px; height: 38px; flex-shrink: 0; padding: 0;
            border: 1px solid var(--bd-border, rgba(255, 255, 255, .08));
            border-radius: 999px;
            background: var(--bd-ink-850, #161616);
            color: var(--bd-white, #FFFFFF);
            cursor: pointer; text-decoration: none;
          }
          .op-mobbarT {
            flex: 1; min-width: 0; text-align: center;
            font-family: var(--bd-font-ui);
            font-size: 15.5px; font-weight: 700;
            color: var(--bd-white, #FFFFFF);
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          }
          .op-mobbar-sp { width: 38px; height: 38px; flex-shrink: 0; }

          .bd-h1 { font-size: 26px !important; line-height: 1.16 !important; }
          .bd-h2 { font-size: 22px !important; line-height: 1.22 !important; }
          .bd-intro { font-size: 14px !important; line-height: 1.55 !important; }
          .bd-actions button, .bd-actions a { font-size: 13px !important; font-weight: 600 !important; }

          .op-arw { display: none !important; }
          .op-fade { display: none !important; }
          .bd-rail {
            grid-auto-columns: calc(50vw - 34px) !important;
            gap: 12px !important;
            padding: 2px 16px 6px 0 !important;
            margin: 0 -16px 0 0 !important;
          }
          .bd-c { aspect-ratio: 2/3; border-radius: 18px; }
          .bd-c-b { gap: 4px; padding: 0 12px 13px; }
          .bd-c-t { font-size: 14.5px; line-height: 1.26; }
          .bd-c-m { font-size: 11.5px; color: rgba(255, 255, 255, .72); }
          .bd-c-p { font-size: 16px; margin-top: 5px; }
        }
      `}</style>

      {/* Main Global Header */}
      <Header />

      <main
        id="top"
        data-screen-label="Organizer profile"
        style={{
          maxWidth: 1224,
          margin: "0 auto",
          padding: "clamp(20px, 2.4vw, 28px) clamp(20px, 4vw, 32px) clamp(56px, 5vw, 80px)",
        }}
      >
        {/* Mobile Sticky Bar */}
        <div className="op-mobbar">
          <button
            type="button"
            className="op-mobback"
            aria-label={language === "mn" ? "Буцах" : "Back"}
            onClick={() => router.back()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="op-mobbarT">{language === "mn" ? "Профайл" : "Profile"}</span>
          <span className="op-mobbar-sp" />
        </div>

        {/* Breadcrumb Navigation */}
        <nav
          className="bd-crumb"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "var(--bd-gray-600, #979797)",
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <Link href="/" style={{ color: "var(--bd-gray-600, #979797)", textDecoration: "none" }}>
            {t("home") || "Нүүр"}
          </Link>
          <span>/</span>
          <Link href="/Organizers" style={{ color: "var(--bd-gray-600, #979797)", textDecoration: "none" }}>
            {t("organizersTitle") || "Зохион байгуулагчид"}
          </Link>
          <span>/</span>
          <span style={{ color: "var(--bd-gray-400, #BCC8C8)" }}>{orgName}</span>
        </nav>

        {/* Cover Image Banner */}
        <div
          style={{
            position: "relative",
            height: "clamp(180px, 22vw, 280px)",
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid var(--bd-border, rgba(255,255,255,.08))",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "var(--bd-ink-800, #1A1A1A)",
              backgroundPosition: "center 40%",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundImage: coverUrl ? `url(${coverUrl})` : "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(8, 8, 8, .30) 0%, transparent 40%, rgba(13, 13, 13, .86) 100%)",
            }}
          />
        </div>

        {/* Organizer Header Details Row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
            margin: "-44px 0 0",
            padding: "0 clamp(4px, 1.5vw, 24px)",
            position: "relative",
          }}
        >
          {/* Avatar & Info */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18, minWidth: 0 }}>
            <span
              style={{
                display: "inline-flex",
                borderRadius: 26,
                padding: 5,
                background: "var(--bd-ink-900, #0D0D0D)",
                flexShrink: 0,
              }}
            >
              <img
                src={avatarUrl}
                alt={orgName}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 22,
                  objectFit: "cover",
                  background: "var(--bd-ink-800, #1A1A1A)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/img/sidebar-logo.svg";
                }}
              />
            </span>

            <div style={{ minWidth: 0, paddingBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1
                  className="bd-h1"
                  style={{
                    margin: 0,
                    fontFamily: "var(--bd-font-ui)",
                    fontSize: 32,
                    fontWeight: 700,
                    lineHeight: 1.12,
                    letterSpacing: "-.02em",
                    color: "var(--bd-white, #FFFFFF)",
                  }}
                >
                  {orgName}
                </h1>

                {isVerified && (
                  <span
                    title={language === "mn" ? "Баталгаажсан зохион байгуулагч" : "Verified Organizer"}
                    style={{ display: "inline-flex", flexShrink: 0, color: "var(--acc-bright, #36CEC2)" }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </span>
                )}
              </div>

              {orgCategory && (
                <p style={{ margin: "7px 0 0", fontSize: 14, color: "var(--bd-gray-500, #B3B3B3)" }}>
                  {orgCategory}
                </p>
              )}

              {/* Stats badges */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 8, fontSize: 13, color: "var(--bd-gray-400)" }}>
                {/* Followers */}
                <button
                  type="button"
                  onClick={() => {
                    setFollowSheetTab("followers");
                    setShowFollowSheet(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "var(--bd-gray-400)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    transition: "color 150ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--bd-white)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--bd-gray-400)")}
                >
                  <strong style={{ color: "var(--bd-white)", fontWeight: 700 }}>
                    {(userProfile?.totalFollowers || 0).toLocaleString()}
                  </strong>{" "}
                  {t("followers") || "Дагагч"}
                </button>

                <span>·</span>

                {/* Following */}
                <button
                  type="button"
                  onClick={() => {
                    setFollowSheetTab("following");
                    setShowFollowSheet(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "var(--bd-gray-400)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    transition: "color 150ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--bd-white)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--bd-gray-400)")}
                >
                  <strong style={{ color: "var(--bd-white)", fontWeight: 700 }}>
                    {(userProfile?.totalFollowing || 0).toLocaleString()}
                  </strong>{" "}
                  {t("following") || "Дагаж байна"}
                </button>

                {/* Events Hosted if organizer */}
                {userProfile?.role === "ORGANIZER" && userProfile?.totalEventsHosted > 0 && (
                  <>
                    <span>·</span>
                    <span>
                      <strong style={{ color: "var(--bd-white)", fontWeight: 700 }}>
                        {userProfile.totalEventsHosted}
                      </strong>{" "}
                      {t("eventsHosted") || "эвент"}
                    </span>
                  </>
                )}

                {/* Rating if organizer */}
                {userProfile?.role === "ORGANIZER" && (
                  <>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(true)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        color: "var(--bd-gray-400)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 13,
                        transition: "color 150ms ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--bd-white)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--bd-gray-400)")}
                    >
                      <span style={{ color: "#FBBF24" }}>★</span>
                      <strong style={{ color: "var(--bd-white)", fontWeight: 700 }}>
                        {userProfile?.averageRating || 0}/5
                      </strong>{" "}
                      ({userProfile?.reviewCount || 0})
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bd-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, paddingBottom: 6 }}>
            {!isSelf && (
              <>
                {/* Follow / Following Button */}
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  disabled={followBusy}
                  style={
                    isFollowing
                      ? {
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 9,
                        height: 48,
                        padding: "0 26px",
                        border: "1px solid var(--acc, #23ADA4)",
                        borderRadius: 999,
                        background: "rgba(35, 173, 164, .14)",
                        color: "var(--acc-bright, #36CEC2)",
                        fontFamily: "var(--bd-font-ui)",
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 180ms ease",
                      }
                      : {
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 9,
                        height: 48,
                        padding: "0 26px",
                        border: "none",
                        borderRadius: 999,
                        background: "var(--acc, #23ADA4)",
                        color: "var(--bd-white, #FFFFFF)",
                        fontFamily: "var(--bd-font-ui)",
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 180ms ease",
                      }
                  }
                >
                  {followBusy ? (
                    <span className="op-spin" />
                  ) : isFollowing ? (
                    t("followed") || "Дагаж байна"
                  ) : (
                    t("follow") || "Дагах"
                  )}
                </button>

                {/* Chat / Message Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (currentUserRole === "ORGANIZER") {
                      router.push(`/Message?userId=${userId}`);
                    } else {
                      router.push(`/Messagee?userId=${userId}`);
                    }
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    height: 48,
                    padding: "0 26px",
                    border: "1px solid var(--bd-border-strong, #363636)",
                    borderRadius: 999,
                    background: "transparent",
                    color: "var(--bd-white, #FFFFFF)",
                    fontFamily: "var(--bd-font-ui)",
                    fontSize: 15,
                    fontWeight: 600,
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "border-color 200ms cubic-bezier(.2,.8,.2,1), background 200ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--acc, #23ADA4)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--bd-border-strong, #363636)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {t("messages") || "Чат"}
                </button>

                {/* More Menu (three dots) */}
                <div ref={menuRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setShowMenu(!showMenu)}
                    aria-label="More actions"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 44,
                      height: 48,
                      border: "1px solid var(--bd-border, rgba(255,255,255,.08))",
                      borderRadius: 999,
                      background: "transparent",
                      color: "var(--bd-white)",
                      fontSize: 22,
                      cursor: "pointer",
                    }}
                  >
                    ⋮
                  </button>

                  {showMenu && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "100%",
                        marginTop: 8,
                        background: "var(--bd-ink-850, #161616)",
                        border: "1px solid var(--bd-border-strong, #363636)",
                        borderRadius: 16,
                        boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                        minWidth: 160,
                        zIndex: 50,
                        overflow: "hidden",
                        padding: "6px 0",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleAction(userProfile?.isBlocked ? "unblock" : "block")}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 18px",
                          background: "none",
                          border: "none",
                          color: userProfile?.isBlocked ? "var(--acc-bright)" : "#FF5A5A",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {userProfile?.isBlocked
                          ? (t("unblock") || "Блок цуцлах")
                          : (t("block") || "Блоклох")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction("report")}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 18px",
                          background: "none",
                          border: "none",
                          color: "var(--bd-gray-300)",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {t("report") || "Мэдэгдэх"}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {isSelf && (
              <Link
                href="/Account#profile"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  height: 48,
                  padding: "0 26px",
                  border: "1px solid var(--bd-border-strong, #363636)",
                  borderRadius: 999,
                  background: "transparent",
                  color: "var(--bd-white, #FFFFFF)",
                  fontFamily: "var(--bd-font-ui)",
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "border-color 200ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--bd-border-strong)")}
              >
                {language === "mn" ? "Профайл засах" : "Edit Profile"}
              </Link>
            )}
          </div>
        </div>

        {/* Introduction / About Section */}
        <section
          style={{
            marginTop: "clamp(30px, 3vw, 42px)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "clamp(24px, 3vw, 40px)",
            alignItems: "start",
          }}
        >
          <div>
            <h2
              className="bd-h2"
              style={{
                margin: 0,
                fontFamily: "var(--bd-font-ui)",
                fontSize: 26,
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: "-.016em",
                color: "var(--bd-white, #FFFFFF)",
              }}
            >
              {t("aboutMe") || "Танилцуулга"}
            </h2>
            <p
              className="bd-intro"
              style={{
                margin: "12px 0 0",
                fontSize: 15,
                fontWeight: 450,
                lineHeight: 1.6,
                color: "var(--bd-gray-300, #D9D9D9)",
                maxWidth: "62ch",
                whiteSpace: "pre-line",
              }}
            >
              {orgIntro}
            </p>

            {/* Interest categories tags */}
            {userProfile?.categories && userProfile.categories.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "var(--bd-gray-400)" }}>
                  {t("interest") || "Сонирхол"} ({userProfile.categories.length})
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(showAllInterests ? userProfile.categories : userProfile.categories.slice(0, 10)).map((cat) => {
                    const catName = language === "mn" ? (cat?.name_thi || cat?.name) : cat?.name;
                    return (
                      <span
                        key={cat._id || cat.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 14px",
                          borderRadius: 999,
                          background: "var(--bd-ink-800, #1A1A1A)",
                          border: "1px solid var(--bd-border, rgba(255,255,255,.08))",
                          fontSize: 13,
                          color: "var(--bd-white)",
                        }}
                      >
                        {cat.image && (
                          <img
                            src={getFullImageUrl(cat.image)}
                            alt=""
                            style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }}
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        )}
                        {catName}
                      </span>
                    );
                  })}
                </div>
                {userProfile.categories.length > 10 && (
                  <button
                    type="button"
                    onClick={() => setShowAllInterests(!showAllInterests)}
                    style={{
                      marginTop: 10,
                      background: "none",
                      border: "none",
                      color: "var(--bd-teal-400, #36CEC2)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {showAllInterests
                      ? (t("viewLess") || "Хаах")
                      : (t("viewMore") || "Бүгдийг харах")}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Events Carousel Section ("Удахгүй болох") */}
        <section style={{ marginTop: "clamp(40px, 4vw, 58px)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <h2
              className="bd-h2"
              style={{
                margin: 0,
                fontFamily: "var(--bd-font-ui)",
                fontSize: 26,
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: "-.016em",
                color: "var(--bd-white, #FFFFFF)",
              }}
            >
              {language === "mn" ? "Удахгүй болох" : "Upcoming"}
            </h2>
            <Link
              href="/Explore"
              className="bd-viewall"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 38,
                padding: "0 16px",
                borderRadius: 999,
                border: "1px solid var(--bd-border, rgba(255,255,255,.08))",
                color: "var(--bd-gray-300, #D9D9D9)",
                fontSize: 12,
                fontWeight: 550,
                whiteSpace: "nowrap",
                textDecoration: "none",
                transition: "border-color 200ms cubic-bezier(.2,.8,.2,1), color 200ms cubic-bezier(.2,.8,.2,1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--acc, #23ADA4)";
                e.currentTarget.style.color = "var(--bd-white, #FFFFFF)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--bd-border, rgba(255,255,255,.08))";
                e.currentTarget.style.color = "var(--bd-gray-300, #D9D9D9)";
              }}
            >
              {language === "mn" ? "Бүгдийг харах" : "View all"}
            </Link>
          </div>

          {upcomingEvents.length > 0 ? (
            <CarouselRail
              items={upcomingEvents}
              isPast={false}
              language={language}
              onFavToggle={handleFavoriteToggle}
              favorites={favorites}
            />
          ) : (
            <div
              style={{
                padding: "36px 20px",
                borderRadius: 20,
                background: "var(--bd-ink-850, #161616)",
                border: "1px solid var(--bd-border, rgba(255,255,255,.08))",
                textAlign: "center",
                color: "var(--bd-gray-500)",
                fontSize: 14.5,
              }}
            >
              {language === "mn"
                ? "Удахгүй болох эвент хараахан байхгүй байна."
                : "No upcoming events scheduled at this moment."}
            </div>
          )}
        </section>

        {/* Past Events Carousel Section ("Өнгөрсөн") */}
        <section style={{ marginTop: "clamp(40px, 4vw, 58px)" }}>
          <h2
            className="bd-h2"
            style={{
              margin: 0,
              fontFamily: "var(--bd-font-ui)",
              fontSize: 26,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-.016em",
              color: "var(--bd-white, #FFFFFF)",
              marginBottom: 20,
            }}
          >
            {language === "mn" ? "Өнгөрсөн" : "Past"}
          </h2>

          {pastEvents.length > 0 ? (
            <CarouselRail
              items={pastEvents}
              isPast={true}
              language={language}
            />
          ) : (
            <div
              style={{
                padding: "36px 20px",
                borderRadius: 20,
                background: "var(--bd-ink-850, #161616)",
                border: "1px solid var(--bd-border, rgba(255,255,255,.08))",
                textAlign: "center",
                color: "var(--bd-gray-500)",
                fontSize: 14.5,
              }}
            >
              {language === "mn"
                ? "Өнгөрсөн эвент бүртгэгдээгүй байна."
                : "No past events recorded yet."}
            </div>
          )}
        </section>
      </main>

      {/* Confirmation Modal (Block / Unblock) */}
      {showConfirm && (
        <div
          className="op-scrim"
          onClick={(e) => {
            if (e.target.classList.contains("op-scrim")) setShowConfirm(false);
          }}
        >
          <div className="op-sheet" style={{ maxWidth: 440 }}>
            <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
              {actionType === "block"
                ? (t("confirmBlockUser") || "Хэрэглэгчийг блоклох уу?")
                : (t("confirmUnblockUser") || "Блок цуцлах уу?")}
            </h4>

            {actionType === "block" && (
              <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--bd-gray-500)", lineHeight: 1.5 }}>
                {t("blockUserWarning") || "Блоклосон хэрэглэгч тантай мессеж бичих болон дагах боломжгүй болно."}
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                style={{
                  height: 40,
                  padding: "0 18px",
                  borderRadius: 999,
                  background: "transparent",
                  border: "1px solid var(--bd-border)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("cancel") || "Болих"}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  height: 40,
                  padding: "0 20px",
                  borderRadius: 999,
                  background: actionType === "block" ? "#FF5A5A" : "var(--acc)",
                  border: "none",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {actionType === "block"
                  ? (t("block") || "Блоклох")
                  : (t("unblock") || "Цуцлах")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div
          className="op-scrim"
          onClick={(e) => {
            if (e.target.classList.contains("op-scrim")) setShowReportModal(false);
          }}
        >
          <div className="op-sheet" style={{ maxWidth: 480 }}>
            <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
              {t("reportUser") || "Хэрэглэгчийг мэдэгдэх"}
            </h4>

            <input
              type="text"
              placeholder={t("enterReasonPlaceholder") || "Шалтгаан оруулах…"}
              value={reportReason}
              onChange={(e) => {
                setReportReason(e.target.value);
                setReportError("");
              }}
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginTop: 16,
                padding: "12px 16px",
                borderRadius: 14,
                background: "var(--bd-ink-800)",
                border: "1px solid var(--bd-border)",
                color: "#fff",
                fontSize: 14,
                outline: "none",
              }}
            />

            {reportError && (
              <p style={{ color: "#FF5A5A", fontSize: 12.5, margin: "6px 0 0" }}>
                {reportError}
              </p>
            )}

            <textarea
              placeholder={t("descriptionPlaceholder") || "Дэлгэрэнгүй тайлбар…"}
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginTop: 12,
                padding: "12px 16px",
                borderRadius: 14,
                background: "var(--bd-ink-800)",
                border: "1px solid var(--bd-border)",
                color: "#fff",
                fontSize: 14,
                outline: "none",
                resize: "none",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                style={{
                  height: 40,
                  padding: "0 18px",
                  borderRadius: 999,
                  background: "transparent",
                  border: "1px solid var(--bd-border)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("cancel") || "Болих"}
              </button>
              <button
                type="button"
                onClick={handleReportSubmit}
                style={{
                  height: 40,
                  padding: "0 22px",
                  borderRadius: 999,
                  background: "var(--acc)",
                  border: "none",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t("submit") || "Илгээх"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Followers / Following List Sheet Modal */}
      <FollowListSheet
        show={showFollowSheet}
        onClose={() => setShowFollowSheet(false)}
        userId={userId}
        initialTab={followSheetTab}
        orgName={orgName}
        language={language}
      />

      {/* Reviews Modal */}
      <ReviewListModal
        show={showReviewModal}
        onHide={() => setShowReviewModal(false)}
        entityId={userId}
        entityModel="User"
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", backgroundColor: "var(--bd-ink-900, #0D0D0D)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Loading…
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
