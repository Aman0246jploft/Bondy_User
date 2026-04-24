"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Tabs, Tab, Form, Button, Modal } from "react-bootstrap";
import toast from "react-hot-toast";
import bookingApi from "@/api/bookingApi";
import reviewApi from "@/api/reviewApi";
import { useLanguage } from "@/context/LanguageContext";

function page() {
  const { t, language } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({});
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  // entityId -> { reviewId, rating, review }
  const [submittedReviews, setSubmittedReviews] = useState({});

  const fetchUserReviews = async () => {
    try {
      const res = await reviewApi.getUserReviews({ limit: 200 });
      const reviews = res?.data?.reviews || [];
      const mappedReviews = reviews.reduce((acc, item) => {
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
      setSubmittedReviews(mappedReviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
    }
  };

  const fetchTickets = async (tab, page) => {
    setLoading(true);
    try {
      let params = { page, limit: 10 };

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
      if (res.status && res.data) {
        setTickets(res.data.tickets);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(activeTab, currentPage);
    document.title = `${t("myTickets")} - Bondy`;
  }, [activeTab, currentPage]);

  useEffect(() => {
    fetchUserReviews();
  }, []);

  const handleTabSelect = (k) => {
    setActiveTab(k);
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const getEventDetails = (ticket) => {
    const item = ticket.eventId || ticket.courseId;
    if (!item) return { title: t("unknownEvent") || "Unknown Event", date: "N/A" };

    const title = ticket.bookingType === "EVENT" ? item.eventTitle : item.courseTitle;
    let dateStr = ticket.bookingType === "EVENT" ? item.startDate : item.createdAt;

    try {
      if (dateStr) {
        const d = new Date(dateStr);
        const locale = language === "mn" ? "mn-MN" : "en-US";
        dateStr = d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' }) +
          " " + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    } catch (e) {
      dateStr = "N/A";
    }
    return { title, dateStr };
  };

  const isPastTicket = (ticket) => {
    const item = ticket.eventId || ticket.courseId;
    if (!item) return false;
    return item.status === "Past";
  };

  const openReviewModal = (ticket) => {
    const item = ticket.eventId || ticket.courseId;
    const entityModel = ticket.bookingType === "EVENT" ? "Event" : "Course";
    const entityId = ticket.bookingType === "EVENT" ? ticket.eventId?._id : ticket.courseId?._id;
    const title = ticket.bookingType === "EVENT" ? item?.eventTitle : item?.courseTitle;
    const existing = submittedReviews[entityId];
    setReviewRating(existing?.rating || 0);
    setReviewText(existing?.review || "");
    setReviewError("");
    setReviewModal({ entityId, entityModel, title, reviewId: existing?.reviewId || null });
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
        res = await reviewApi.updateReview(reviewModal.reviewId, { review: trimmed, rating: reviewRating });
      } else {
        res = await reviewApi.addReview({ entityId: reviewModal.entityId, entityModel: reviewModal.entityModel, review: trimmed, rating: reviewRating });
      }
      if (res?.status === true && (res?.data?._id || res?.data?.review)) {
        const saved = res.data;
        setSubmittedReviews((prev) => ({
          ...prev,
          [reviewModal.entityId]: { reviewId: saved._id || reviewModal.reviewId, rating: reviewRating, review: trimmed },
        }));
        toast.success(reviewModal.reviewId ? t("reviewUpdatedSuccessfully") : t("reviewAddedSuccessfully"));
        setReviewModal(null);
      } else {
        setReviewError(t("reviewSubmitFailed") || "Failed to submit review.");
        toast.error(t("reviewSubmitFailed") || "Failed to submit review.");
      }
    } catch (e) {
      console.error("Review submit error:", e);
      setReviewError(t("reviewSubmitFailed") || "Failed to submit review.");
      toast.error(t("reviewSubmitFailed") || "Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PAID": return <span className="status-badge complete">{t("confirmed")}</span>;
      case "PENDING": return <span className="status-badge pending">{t("pending")}</span>;
      case "CANCELLED": return <span className="status-badge cancel">{t("canceled")}</span>;
      case "FAILED": return <span className="status-badge cancel">{t("failed")}</span>;
      case "REFUND_INITIATED": return <span className="status-badge cancel">{t("refunded")}</span>;
      default: return <span className="status-badge pending">{status}</span>;
    }
  };

  const renderTicketList = () => {
    if (loading) return <div className="text-center p-5">{t("loadingTickets")}</div>;

    if (tickets.length === 0) {
      return <div className="text-center p-5 text-muted">{t("noTicketsFound")}</div>;
    }

    const locale = language === "mn" ? "mn-MN" : "en-US";

    return (
      <div className="ticket-listing">
        {tickets.map((ticket) => {
          const { title, dateStr } = getEventDetails(ticket);
          return (
            <div className="ticket-cards" key={ticket._id}>
              <div className="ticket-inner">
                <div className="ticket-lft">
                  <Form.Check />
                  <div>
                    <h5 title={title}>{title}</h5>
                    <p className="ref" title={`# ${ticket.bookingId}`}># {ticket.bookingId}</p>
                  </div>
                </div>
                <div className="ticket-rgt">
                  {getStatusBadge(ticket.status)}
                </div>
              </div>
              <div className="ticket-bottom">
                <p>
                  {t("bookingDate")} <span>{new Date(ticket.createdAt).toLocaleDateString(locale)}</span>{" "}
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="4"
                      height="4"
                      viewBox="0 0 4 4"
                      fill="none"
                    >
                      <circle cx="2" cy="2" r="2" fill="#999999" />
                    </svg>
                  </span>{" "}
                  <span>{new Date(ticket.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                </p>
                <p>
                  {t("totalPaid")} <span>₮{ticket.totalAmount}</span>
                </p>
                <p>
                  <span>
                    <img src="/img/ticket-white.svg" />
                  </span>{" "}
                  <span>{ticket.qty} {t("ticketsSuffix")}</span>
                </p>
                <Link href={`/TicketDetails?id=${ticket._id}`}>
                  {t("ticketDetails")} <img src="/img/Arrow-Right.svg" />
                </Link>
                {isPastTicket(ticket) && (() => {
                  const entityId = ticket.bookingType === "EVENT" ? ticket.eventId?._id : ticket.courseId?._id;
                  const isEditing = !!submittedReviews[entityId];
                  return (
                    <button
                      onClick={() => openReviewModal(ticket)}
                      style={{ background: "none", border: "none", color: "var(--primary-teal)", fontSize: "16px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", padding: 0 }}
                    >
                      {isEditing ? (t("editReview") || "Edit Review") : (t("addReview") || "Add Review")}
                    </button>
                  );
                })()}
              </div>
            </div>
          );
        })}
        {pagination?.totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4">
            <Button
              variant="outline-secondary"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              {t("previous")}
            </Button>
            <span>{t("pageOf")?.replace("{current}", currentPage).replace("{total}", pagination.totalPages) || `Page ${currentPage} of ${pagination.totalPages}`}</span>
            <Button
              variant="outline-secondary"
              onClick={handleNextPage}
              disabled={currentPage === pagination.totalPages}
            >
              {t("next")}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="cards my-tickets">
        <div className="card-title">
          <h3>{t("myTickets")}</h3>
        </div>
        <div className="ticket-tabs">
          <Tabs
            activeKey={activeTab}
            onSelect={handleTabSelect}
            className="mb-3"
          >
            <Tab eventKey="all" title={t("all")}>
              {activeTab === "all" && renderTicketList()}
            </Tab>
            <Tab eventKey="upcoming" title={t("upcoming")}>
              {activeTab === "upcoming" && renderTicketList()}
            </Tab>
            <Tab eventKey="past" title={t("past")}>
              {activeTab === "past" && renderTicketList()}
            </Tab>
            {/* <Tab eventKey="canceled" title="Canceled">
              {activeTab === "canceled" && renderTicketList()}
            </Tab> */}
          </Tabs>
        </div>
      </div>

      <Modal show={!!reviewModal} onHide={() => setReviewModal(null)} centered contentClassName="review-modal-content">
        <Modal.Body style={{ background: "#2a2a2a", borderRadius: "16px", padding: "32px", textAlign: "center" }}>
          <h4 style={{ color: "#fff", fontWeight: "700", marginBottom: "8px" }}>
            {reviewModal?.reviewId ? (t("editReview") || "Edit Review") : (t("howWasYourEvent") || "How was your Event")}
          </h4>
          <p style={{ color: "#aaa", marginBottom: "24px", fontSize: "14px" }}>
            {t("shareYourExperience") || "Share your experience and let us know how your event went."}
          </p>
          <div className="d-flex justify-content-center gap-3 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setReviewRating(star)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                <svg width="42" height="42" viewBox="0 0 24 24" fill={star <= reviewRating ? "var(--primary-teal)" : "#555"}>
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </button>
            ))}
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => { setReviewText(e.target.value); setReviewError(""); }}
            placeholder={t("comment") || "Comment"}
            rows={4}
            style={{ width: "100%", background: "#1a1a1a", border: `1px solid ${reviewError ? "#e74c3c" : "#444"}`, borderRadius: "12px", color: "#fff", padding: "12px 16px", fontSize: "14px", resize: "none", outline: "none", marginBottom: reviewError ? "8px" : "20px" }}
          />
          {reviewError && <p style={{ color: "#e74c3c", fontSize: "13px", marginBottom: "12px", textAlign: "left" }}>{reviewError}</p>}
          <button
            onClick={handleSubmitReview}
            disabled={!reviewRating || reviewSubmitting}
            style={{ width: "100%", background: "var(--primary-teal)", border: "none", borderRadius: "50px", color: "#fff", fontWeight: "700", fontSize: "16px", padding: "14px", cursor: reviewRating ? "pointer" : "not-allowed", opacity: reviewRating ? 1 : 0.6 }}
          >
            {reviewSubmitting ? (t("submitting") || "Submitting...") : reviewModal?.reviewId ? (t("updateReview") || "Update Review") : (t("addReview") || "Add Review")}
          </button>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default page;
