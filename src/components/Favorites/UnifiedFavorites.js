"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import wishlistApi from "@/api/wishlistApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import { formatDate } from "@/utils/dateFormater";
import { useLanguage } from "@/context/LanguageContext";
import "./favorites-unified.css";

export default function UnifiedFavorites({ titleKey = "myFavorite" }) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("Event");
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalPages: 1,
    totalDocs: 0,
  });

  const fetchWishlist = async (type, page = 1) => {
    setLoading(true);
    try {
      const response = await wishlistApi.getMyWishlist({
        type,
        page,
        limit: pagination.limit,
      });
      if (response && response?.data) {
        setWishlistItems(response.data.docs || []);
        setPagination({
          page: response.data.page || 1,
          limit: response.data.limit || 12,
          totalPages: response.data.totalPages || 1,
          totalDocs: response.data.totalDocs || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist(activeTab, 1);
    document.title = `${t(titleKey)} - Bondy`;
  }, [activeTab]);

  const handleTabSelect = (tabKey) => {
    setActiveTab(tabKey);
    setWishlistItems([]);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchWishlist(activeTab, newPage);
    }
  };

  const handleRemove = async (e, entityId) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await wishlistApi.removeFromWishlist({ entityId });
      if (response?.status) {
        toast.success(t("removedFromFavourites") || "Removed from Favourites");
        setWishlistItems((prev) => prev.filter((item) => item.entityId?._id !== entityId));
      } else {
        toast.error(response?.message || t("failedToRemoveItem") || "Failed to remove item");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error(t("failedToRemoveItem") || "Failed to remove item");
    }
  };

  return (
    <div className="ac-saved-wrap">
      <div className="ac-card ac-saved">
        {/* Header Title + Category Chips */}
        <div className="ac-saved-header">
          <h2 className="ac-saved-title">{t(titleKey)}</h2>

          <div className="ac-saved-chips">
            <button
              type="button"
              className={`ac-chip ${activeTab === "Event" ? "active" : ""}`}
              aria-selected={activeTab === "Event"}
              onClick={() => handleTabSelect("Event")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{t("events") || "Events"}</span>
            </button>

            <button
              type="button"
              className={`ac-chip ${activeTab === "Course" ? "active" : ""}`}
              aria-selected={activeTab === "Course"}
              onClick={() => handleTabSelect("Course")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>{t("courses") || "Courses"}</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="ac-savedgrid">
            <div className="ac-skel-card" />
            <div className="ac-skel-card" />
            <div className="ac-skel-card" />
            <div className="ac-skel-card" />
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="ac-saved-empty">
            <span className="ac-saved-empty-icon">
              {titleKey === "saved" ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M 12.211 2.797 C 13.415 3.619 14.612 4.609 15.751 5.748 C 16.89 6.887 17.88 8.085 18.703 9.288 C 19.404 7.911 19.825 6.606 19.956 5.475 C 20.121 4.048 19.817 2.993 19.162 2.338 C 18.506 1.682 17.452 1.379 16.025 1.544 C 14.893 1.674 13.589 2.096 12.211 2.797 Z M 19.618 10.75 C 20.624 8.985 21.264 7.226 21.446 5.647 C 21.641 3.956 21.317 2.372 20.222 1.277 C 19.128 0.182 17.543 -0.142 15.853 0.053 C 14.273 0.236 12.515 0.876 10.75 1.881 C 8.984 0.876 7.226 0.236 5.647 0.054 C 3.956 -0.141 2.372 0.182 1.277 1.277 C 0.182 2.372 -0.142 3.956 0.053 5.647 C 0.236 7.227 0.876 8.985 1.881 10.75 C 0.876 12.515 0.236 14.273 0.054 15.853 C -0.141 17.543 0.182 19.127 1.277 20.222 C 2.372 21.317 3.956 21.641 5.647 21.446 C 7.226 21.264 8.985 20.624 10.75 19.618 C 12.515 20.624 14.273 21.264 15.853 21.446 C 17.543 21.641 19.127 21.317 20.222 20.222 C 21.317 19.128 21.641 17.543 21.446 15.853 C 21.264 14.273 20.624 12.515 19.618 10.75 Z M 17.869 10.75 C 17.032 9.425 15.964 8.082 14.69 6.809 C 13.417 5.536 12.075 4.467 10.75 3.63 C 9.425 4.467 8.082 5.536 6.809 6.809 C 5.536 8.082 4.467 9.425 3.63 10.75 C 4.467 12.075 5.536 13.417 6.809 14.691 C 8.082 15.964 9.425 17.032 10.75 17.869 C 12.075 17.032 13.417 15.964 14.691 14.69 C 15.964 13.417 17.032 12.075 17.869 10.75 Z M 12.211 18.703 C 13.415 17.881 14.612 16.89 15.751 15.751 C 16.89 14.612 17.88 13.415 18.703 12.212 C 19.404 13.589 19.825 14.893 19.956 16.025 C 20.12 17.452 19.817 18.506 19.162 19.162 C 18.506 19.817 17.452 20.121 16.024 19.956 C 14.893 19.825 13.589 19.404 12.211 18.703 Z M 9.288 18.703 C 8.084 17.881 6.887 16.89 5.748 15.751 C 4.609 14.612 3.619 13.415 2.797 12.212 C 2.096 13.589 1.674 14.893 1.544 16.025 C 1.379 17.452 1.682 18.506 2.338 19.162 C 2.994 19.817 4.048 20.12 5.475 19.956 C 6.606 19.825 7.911 19.404 9.288 18.703 Z M 2.797 9.288 C 3.619 8.085 4.609 6.887 5.748 5.748 C 6.887 4.609 8.085 3.619 9.288 2.797 C 7.91 2.096 6.606 1.674 5.475 1.544 C 4.048 1.379 2.993 1.682 2.338 2.338 C 1.682 2.993 1.379 4.048 1.544 5.475 C 1.674 6.606 2.095 7.911 2.797 9.288 Z M 10.75 9 C 9.783 9 9 9.783 9 10.75 C 9 11.716 9.783 12.5 10.75 12.5 C 11.716 12.5 12.5 11.716 12.5 10.75 C 12.5 9.783 11.716 9 10.75 9 Z M 7.5 10.75 C 7.5 8.955 8.955 7.5 10.75 7.5 C 12.545 7.5 14 8.955 14 10.75 C 14 12.545 12.545 14 10.75 14 C 8.955 14 7.5 12.545 7.5 10.75 Z" transform="matrix(1 0 0 1 1.25 1.25)" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              )}
            </span>
            <h3 className="ac-saved-empty-title">
              {t("noItemsFound")
                ? t("noItemsFound").replace("{type}", activeTab === "Event" ? t("events") : t("courses"))
                : `No saved ${activeTab.toLowerCase()}s found`}
            </h3>
            <p className="ac-saved-empty-desc">
              {language === "en"
                ? "Items you bookmark while browsing will appear here for easy access."
                : "Таны хадгалсан эвэнт болон сургалтууд энд харагдах болно."}
            </p>
          </div>
        ) : (
          <div className="ac-savedgrid">
            {wishlistItems.map((item) => {
              const entity = item.entityId;
              if (!entity) return null;

              const isEvent = activeTab === "Event";
              const title = isEvent
                ? entity.eventTitle || entity.title
                : entity.courseTitle || entity.title;

              let date = "";
              if (entity.startDate) {
                date = formatDate(entity.startDate);
              } else if (entity.schedules && entity.schedules.length > 0 && entity.schedules[0].startDate) {
                date = formatDate(entity.schedules[0].startDate);
              }

              const location = entity.venueAddress
                ? entity.venueAddress.city || entity.venueAddress.address
                : entity.locationName || entity.venue || "";

              const rawImg =
                entity.posterImage?.[0] ||
                entity.posterImage ||
                entity.galleryImages?.[0] ||
                entity.bannerImage ||
                entity.image;
              const image = rawImg ? getFullImageUrl(rawImg) : "/img/imageholder.png";

              const price = entity.ticketTypes?.[0]?.price
                ? `₮${Number(entity.ticketTypes[0].price).toLocaleString()}`
                : entity.price
                  ? `₮${Number(entity.price).toLocaleString()}`
                  : entity.isFree
                    ? "Free"
                    : "";

              const link = isEvent ? `/eventDetails?id=${entity._id}` : `/programDetails?id=${entity._id}`;

              return (
                <div className="bd-c" key={item._id}>
                  {/* Floating Heart / Bookmark Button */}
                  <button
                    type="button"
                    className="bd-c-fav active"
                    onClick={(e) => handleRemove(e, entity._id)}
                    aria-label={t("removeFavoriteConfirm") || "Remove from saved"}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z" />
                    </svg>
                  </button>

                  <Link href={link} className="bd-c-link">
                    <span className="bd-c-img" style={{ backgroundImage: `url(${image})` }} />
                    <span className="bd-c-b">
                      <b className="bd-c-t" title={title}>
                        {title}
                      </b>
                      {date && <span className="bd-c-m">{date}</span>}
                      {location && <span className="bd-c-m">{location}</span>}
                      {price && <span className="bd-c-p">{price}</span>}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="ac-pagination" style={{ marginTop: "24px", paddingTop: "16px" }}>
            <button
              type="button"
              className="ac-pg-btn"
              disabled={pagination.page === 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              ← {t("previous") || "Previous"}
            </button>
            <span>
              {t("pageOf")
                ? t("pageOf").replace("{current}", pagination.page).replace("{total}", pagination.totalPages)
                : `Page ${pagination.page} of ${pagination.totalPages}`}
            </span>
            <button
              type="button"
              className="ac-pg-btn"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              {t("next") || "Next"} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
