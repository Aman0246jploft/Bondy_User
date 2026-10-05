"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import wishlistApi from "@/api/wishlistApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import { formatDate } from "@/utils/dateFormater";
import { useLanguage } from "@/context/LanguageContext";
import "./favorites-unified.css";

export default function UnifiedFavorites() {
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
    document.title = `${t("myFavorite") || "Saved & Favorites"} - Bondy`;
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
        toast.success(t("removedFromWishlist") || "Removed from saved items");
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
          <h2 className="ac-saved-title">{t("myFavorite") || "Saved & Favorites"}</h2>

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
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
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
