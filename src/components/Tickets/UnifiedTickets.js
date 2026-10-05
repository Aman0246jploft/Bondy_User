"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import bookingApi from "@/api/bookingApi";
import reviewApi from "@/api/reviewApi";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import "./tickets-unified.css";

export default function UnifiedTickets({ role = "CUSTOMER" }) {
  const { t, language } = useLanguage();
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

  const isOrganizer = role === "ORGANIZER";
  const detailsBasePath = isOrganizer ? "/TicketDetailsOrganiser" : "/TicketDetails";

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
    document.title = `${t("myTickets") || "My Tickets"} - Bondy`;
  }, [activeTab, currentPage, bookingType]);

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
    let dateStr = ticket.bookingType === "EVENT" ? item.startDate : item.createdAt;

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

    const venue = item.locationName || item.venue || item.address || item.city || "";
    const rawImg = item.bannerImage || item.image || item.eventBanner || item.courseBanner || "";
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "PAID":
        return <span className="ac-status-badge paid">{t("confirmed") || "Confirmed"}</span>;
      case "PENDING":
        return <span className="ac-status-badge pending">{t("pending") || "Pending"}</span>;
      case "CANCELLED":
        return <span className="ac-status-badge cancelled">{t("canceled") || "Canceled"}</span>;
      case "FAILED":
        return <span className="ac-status-badge failed">{t("failed") || "Failed"}</span>;
      case "REFUND_INITIATED":
        return <span className="ac-status-badge cancelled">{t("refunded") || "Refunded"}</span>;
      default:
        return <span className="ac-status-badge pending">{status}</span>;
    }
  };

  return (
    <div className="ac-orders-wrap">
      <div className="ac-card ac-orders">
        {/* Header Title */}
        <div className="ac-orders-header">
          <h2 className="ac-orders-title">{t("myTickets") || "My Tickets & Bookings"}</h2>
          {pagination?.totalTickets > 0 && (
            <span className="ac-orders-count">
              {pagination.totalTickets} {t("tickets") || "tickets"}
            </span>
          )}
        </div>

        {/* Tab Switcher (Upcoming, Past, All, Canceled) */}
        <div className="ac-tabs-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "upcoming"}
            className={`ac-tab ${activeTab === "upcoming" ? "active" : ""}`}
            onClick={() => handleTabSelect("upcoming")}
          >
            <span>{t("upcoming") || "Upcoming"}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "past"}
            className={`ac-tab ${activeTab === "past" ? "active" : ""}`}
            onClick={() => handleTabSelect("past")}
          >
            <span>{t("past") || "Past"}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            className={`ac-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => handleTabSelect("all")}
          >
            <span>{t("all") || "All"}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "canceled"}
            className={`ac-tab ${activeTab === "canceled" ? "active" : ""}`}
            onClick={() => handleTabSelect("canceled")}
          >
            <span>{t("canceled") || "Canceled"}</span>
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
            className={`ac-chip ${bookingType === "COURSE" ? "active" : ""}`}
            aria-selected={bookingType === "COURSE"}
            onClick={() => handleTypeSelect("COURSE")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>{t("courses") || "Courses"}</span>
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
            <div className="ac-empty-box">
              <span className="ac-empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                  <path d="M13 5v2" />
                  <path d="M13 17v2" />
                  <path d="M13 11v2" />
                </svg>
              </span>
              <h3 className="ac-empty-title">{t("noTicketsFound") || "No tickets found"}</h3>
              <p className="ac-empty-desc">
                {activeTab === "upcoming"
                  ? t("noUpcomingTickets") || "You do not have any upcoming bookings yet."
                  : t("noTicketsCategory") || "No tickets match your selected filter."}
              </p>
            </div>
          ) : (
            tickets.map((ticket) => {
              const { title, dateStr, venue, imageSrc } = getItemDetails(ticket);
              const entityId = ticket.bookingType === "EVENT" ? ticket.eventId?._id : ticket.courseId?._id;
              const hasReview = !!submittedReviews[entityId];
              const isPast = isPastTicket(ticket);

              return (
                <div className="ac-book" key={ticket._id}>
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
                    <div className="ac-book-top">
                      <h4 className="ac-book-t" title={title}>
                        {title}
                      </h4>
                    </div>

                    <div className="ac-book-meta">
                      <span className="ac-book-ref">#{ticket.bookingId}</span>
                      {ticket.ticketName && <span className="ac-book-badge">{ticket.ticketName}</span>}
                      <span>
                        {ticket.qty} {t("ticketsSuffix") || "ticket(s)"}
                      </span>
                      <span className="ac-book-amount">₮{ticket.totalAmount?.toLocaleString()}</span>
                    </div>

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
                    <div>{getStatusBadge(ticket.status)}</div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {isPast && (
                        <button
                          type="button"
                          className="ac-review-btn"
                          onClick={() => openReviewModal(ticket)}
                        >
                          <span>★</span>
                          <span>{hasReview ? t("editReview") || "Edit Review" : t("addReview") || "Review"}</span>
                        </button>
                      )}

                      <Link href={`${detailsBasePath}?id=${ticket._id}`} className="ac-cta">
                        <span>{t("TicketDetails") || "View Details"}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                    </div>
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
