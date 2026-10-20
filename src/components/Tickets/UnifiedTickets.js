"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import bookingApi from "@/api/bookingApi";
import reviewApi from "@/api/reviewApi";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import "./tickets-unified.css";

export default function UnifiedTickets({ role = "CUSTOMER" }) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const organizerId = useSearchParams().get("organizerId") || "";
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({});
  const [activeTab, setActiveTab] = useState("upcoming");
  const [bookingType, setBookingType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [submittedReviews, setSubmittedReviews] = useState({});

  const fetchUserReviews = async () => {
    try {
      const res = await reviewApi.getUserReviews({ limit: 200 });
      const reviews = res?.data?.reviews || [];
      const mapped = reviews.reduce((acc, item) => {
        const entityKey = item?.entityId?._id || item?.entityId;
        if (entityKey) {
          acc[entityKey] = {
            reviewId: item._id,
            rating: item.rating,
            review: item.review,
          };
        }
        return acc;
      }, {});
      setSubmittedReviews(mapped);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
    }
  };

  const fetchTickets = async (tab, page, bType) => {
    setLoading(true);
    try {
      let params = { page, limit: 10 };

      if (organizerId) params.organizerId = organizerId;

      if (bType && bType !== "all") {
        params.bookingType = bType;
      }

      if (tab === "all") {
        params.status = "PAID,PENDING,CANCELLED,REFUND_INITIATED,FAILED";
      } else if (tab === "upcoming") {
        params.status = "PAID";
        params.type = "upcoming";
      } else if (tab === "past") {
        params.status = "PAID";
        params.type = "past";
      } else if (tab === "canceled") {
        params.status = "CANCELLED,FAILED,REFUND_INITIATED";
      }

      const res = await bookingApi.getTicketList(params);
      if (res?.status && res?.data) {
        setTickets(res?.data?.tickets || []);
        setPagination(res?.data?.pagination || {});
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(activeTab, currentPage, bookingType);
    document.title = `${t("bcOrders") || "My bookings"} - Bondy`;
  }, [activeTab, currentPage, bookingType, organizerId]);

  useEffect(() => {
    fetchUserReviews();
  }, []);

  const handleTabSelect = (tabKey) => {
    setActiveTab(tabKey);
    setCurrentPage(1);
  };

  const handleTypeSelect = (typeKey) => {
    setBookingType(typeKey);
    setCurrentPage(1);
  };

  const getItemDetails = (ticket) => {
    const item = ticket.eventId || ticket.courseId;
    if (!item) {
      return {
        title: t("unknownEvent") || "Unknown Event",
        dateStr: "N/A",
        venue: "",
        imageSrc: "",
      };
    }

    const title = ticket.bookingType === "EVENT" ? item.eventTitle : item.courseTitle;
    let dateStr = item.startDate || item.createdAt;

    try {
      if (dateStr) {
        const d = new Date(dateStr);
        const locale = language === "mn" ? "mn-MN" : "en-US";
        dateStr =
          d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" }) +
          " • " +
          d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
      }
    } catch (e) {
      dateStr = "N/A";
    }

    const venueRaw = item.venueName || item.venueAddress?.venueName || item.locationName || item.venue || item.address || "";
    const venue = String(venueRaw).split(",")[0].trim();
    const rawImg = (Array.isArray(item.posterImage) ? item.posterImage[0] : item.posterImage) || item.bannerImage || item.image || "";
    const imageSrc = rawImg ? getFullImageUrl(rawImg) : "";

    return { title, dateStr, venue, imageSrc };
  };

  const isPastTicket = (ticket) => {
    const item = ticket.eventId || ticket.courseId;
    if (!item) return false;
    return item.status === "Past" || activeTab === "past";
  };

  const openReviewModal = (ticket) => {
    const item = ticket.eventId || ticket.courseId;
    const entityModel = ticket.bookingType === "EVENT" ? "Event" : "Course";
    const entityId = ticket.bookingType === "EVENT" ? ticket.eventId?._id : ticket.courseId?._id;
    const title = ticket.bookingType === "EVENT" ? item?.eventTitle : item?.courseTitle;
    const existing = submittedReviews[entityId];
    setReviewRating(existing?.rating || 5);
    setReviewHoverRating(0);
    setReviewText(existing?.review || "");
    setReviewError("");
    setReviewModal({ entityId, entityModel, title, reviewId: existing?.reviewId || null });
  };

  const closeReviewModal = () => {
    setReviewModal(null);
    setReviewError("");
  };

  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewModal) return;
    const trimmed = reviewText.trim();
    if (trimmed.split(/\s+/).filter(Boolean).length < 2) {
      setReviewError(t("reviewMinWords") || "Please write at least 2 words.");
      return;
    }
    setReviewError("");
    setReviewSubmitting(true);
    try {
      let res;
      if (reviewModal.reviewId) {
        res = await reviewApi.updateReview(reviewModal.reviewId, {
          rating: reviewRating,
          review: trimmed,
        });
      } else {
        res = await reviewApi.addReview({
          entityId: reviewModal.entityId,
          entityModel: reviewModal.entityModel,
          rating: reviewRating,
          review: trimmed,
        });
      }

      if (res?.status) {
        toast.success(
          reviewModal.reviewId
            ? t("reviewUpdatedSuccess") || "Review updated successfully!"
            : t("reviewSubmittedSuccess") || "Review submitted successfully!"
        );
        fetchUserReviews();
        closeReviewModal();
      } else {
        toast.error(res?.message || t("reviewSubmitFailed") || "Failed to submit review.");
      }
    } catch (error) {
      toast.error(t("reviewSubmitFailed") || "Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getStatusBadge = (ticket) => {
    const isEvent = ticket.bookingType === "EVENT";
    const item = isEvent ? ticket.eventId : ticket.courseId;
    const isCancelled = String(item?.status || "").toLowerCase() === "cancelled" || ticket.status === "CANCELLED" || ticket.status === "FAILED" || Boolean(ticket.cancelledAt) || (typeof ticket.refundReason === "string" && /cancel/i.test(ticket.refundReason));
    if (isCancelled) {
      return <span className="ac-status-badge cancelled">{t("canceled") || "Cancelled"}</span>;
    }
    switch (ticket.status) {
      case "PAID":
        return <span className="ac-status-badge paid">{t("confirmed") || "Confirmed"}</span>;
      case "PENDING":
        return <span className="ac-status-badge pending">{t("pending") || "Pending"}</span>;
      case "CANCELLED":
        return <span className="ac-status-badge cancelled">{t("canceled") || "Cancelled"}</span>;
      case "FAILED":
        return <span className="ac-status-badge failed">{t("failed") || "Failed"}</span>;
      case "REFUND_INITIATED":
      case "REFUNDED":
        return <span className="ac-status-badge cancelled">{t("refunded") || "Refunded"}</span>;
      default:
        return <span className="ac-status-badge pending">{ticket.status}</span>;
    }
  };

  return (
    <div className="ac-orders-wrap">
      <div className="ac-card ac-orders">
        {/* Header Title */}
        <div className="ac-tabs-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "upcoming"}
            className={`ac-tab ${activeTab === "upcoming" ? "active" : ""}`}
            onClick={() => handleTabSelect("upcoming")}
          >
            <span>{t("ordActive")}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "past"}
            className={`ac-tab ${activeTab === "past" ? "active" : ""}`}
            onClick={() => handleTabSelect("past")}
          >
            <span>{t("ordPast")}</span>
          </button>
        </div>

        {/* Category Filter Chips (All, Events, Courses) */}
        <div className="ac-chips">
          <button
            type="button"
            className={`ac-chip ${bookingType === "all" ? "active" : ""}`}
            aria-selected={bookingType === "all"}
            onClick={() => handleTypeSelect("all")}
          >
            <span>{t("all") || "All"}</span>
          </button>
          <button
            type="button"
            className={`ac-chip ${bookingType === "EVENT" ? "active" : ""}`}
            aria-selected={bookingType === "EVENT"}
            onClick={() => handleTypeSelect("EVENT")}
          >
            <span>{t("obEvent")}</span>
          </button>
          <button
            type="button"
            className={`ac-chip ${bookingType === "COURSE" ? "active" : ""}`}
            aria-selected={bookingType === "COURSE"}
            onClick={() => handleTypeSelect("COURSE")}
          >
            <span>{t("obCourse")}</span>
          </button>
        </div>

        {/* Bookings List */}
        <div className="ac-booklist">
          {loading ? (
            <>
              <div className="ac-skel-book" />
              <div className="ac-skel-book" />
              <div className="ac-skel-book" />
            </>
          ) : tickets.length === 0 ? (
            <p className="ac-empty-line">{t("ordEmpty")}</p>
          ) : (
            tickets.map((ticket) => {
              const { title, dateStr, venue, imageSrc } = getItemDetails(ticket);
              const isEvent = ticket.bookingType === "EVENT";
              const sub = isEvent
                ? (ticket.ticketName ? t("ordSub", { count: ticket.qty || 1, name: ticket.ticketName }) : "")
                : (ticket.ticketName || "");
              const detailHref = `/TicketDetails?id=${ticket._id}`;

              return (
                <div
                  className="ac-book"
                  key={ticket._id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(detailHref)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push(detailHref);
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    className="ac-book-th"
                    style={imageSrc ? { backgroundImage: `url(${imageSrc})` } : {}}
                  >
                    {!imageSrc && (
                      <div className="ac-book-th-fallback">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                          <polyline points="17 2 12 7 7 2" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="ac-book-content">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                      <h4 className="ac-book-t" style={{ margin: 0 }} title={title}>{title}</h4>
                      {getStatusBadge(ticket)}
                    </div>
                    {sub && <span className="ac-book-sub">{sub}</span>}

                    {dateStr && (
                      <div className="ac-book-row">
                        <span className="ac-book-row-icon">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </span>
                        <span className="ac-book-row-text">{dateStr}</span>
                      </div>
                    )}

                    {venue && (
                      <div className="ac-book-row">
                        <span className="ac-book-row-icon">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                        </span>
                        <span className="ac-book-row-text">{venue}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Status */}
                  <div className="ac-book-side">
                    <Link
                      href={detailHref}
                      className="ac-cta"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{t("ordDetails")}</span>
                      <span>›</span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar */}
        {pagination?.totalPages > 1 && (
          <div className="ac-pagination">
            <button
              type="button"
              className="ac-pg-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ← {t("previous") || "Previous"}
            </button>
            <span>
              {t("pageOf")
                ? t("pageOf").replace("{current}", currentPage).replace("{total}", pagination.totalPages)
                : `Page ${currentPage} of ${pagination.totalPages}`}
            </span>
            <button
              type="button"
              className="ac-pg-btn"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              {t("next") || "Next"} →
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="ac-modal-overlay" onClick={closeReviewModal}>
          <div className="ac-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ac-modal-head">
              <div>
                <h3 className="ac-modal-title">
                  {reviewModal.reviewId ? t("editReview") || "Edit Review" : t("addReview") || "Rate & Review"}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--bd-gray-500)" }}>
                  {reviewModal.title}
                </p>
              </div>
              <button type="button" className="ac-modal-close" onClick={closeReviewModal}>
                ✕
              </button>
            </div>

            {/* Stars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--bd-gray-400)" }}>
                {t("yourRating") || "Your Rating"}
              </span>
              <div className="ac-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`ac-star-btn ${star <= (reviewHoverRating || reviewRating) ? "active" : ""}`}
                    onMouseEnter={() => setReviewHoverRating(star)}
                    onMouseLeave={() => setReviewHoverRating(0)}
                    onClick={() => setReviewRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--bd-gray-400)" }}>
                {t("writeReview") || "Write your feedback"}
              </span>
              <textarea
                className="ac-textarea"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={t("reviewPlaceholder") || "Share your thoughts about this event..."}
              />
              {reviewError && (
                <span style={{ fontSize: "12px", color: "#ff5a5a" }}>{reviewError}</span>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                className="ac-pg-btn"
                onClick={closeReviewModal}
                disabled={reviewSubmitting}
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                type="button"
                className="ac-cta"
                style={{ height: "38px" }}
                onClick={handleSubmitReview}
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? t("submitting") || "Submitting..." : t("submit") || "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
