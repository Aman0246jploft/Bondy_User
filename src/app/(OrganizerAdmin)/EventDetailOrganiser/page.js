"use client";
import Link from "next/link";
import React, { useState, useEffect, Suspense } from "react";
import { Col, Row, Spinner } from "react-bootstrap";
import { useSearchParams } from "next/navigation";
import eventApi from "@/api/eventApi";
import bookingApi from "@/api/bookingApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import { formatTime } from "@/utils/timeHelper";
import { useLanguage } from "@/context/LanguageContext";

function ExpandableText({ text, limit = 200, className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();
  if (!text) return <p className={className}>{t("na") || "N/A"}</p>;

  const shouldShowToggle = text.length > limit;
  const displayText = isExpanded || !shouldShowToggle ? text : `${text.substring(0, limit)}...`;

  return (
    <div className={className}>
      <p style={{ whiteSpace: "pre-line", margin: 0, color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: "1.6" }}>{displayText}</p>
      {shouldShowToggle && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-primary border-0 bg-transparent p-0"
          style={{
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            color: "#23ada4",
            transition: "all 0.2s"
          }}
        >
          {isExpanded ? t("viewLess") : t("viewMore")}
        </button>
      )}
    </div>
  );
}

function EventDetailsContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [tempReservedExternally, setTempReservedExternally] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("Event venue no longer available");
  const [customReasonText, setCustomReasonText] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const [attendeesList, setAttendeesList] = useState([]);
  const [attendeesPage, setAttendeesPage] = useState(1);
  const [attendeesSearch, setAttendeesSearch] = useState("");
  const [attendeesPagination, setAttendeesPagination] = useState(null);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  const fetchAttendeesList = async () => {
    try {
      setAttendeesLoading(true);
      const res = await eventApi.getAllAttendees(eventId, {
        page: attendeesPage,
        limit: 5,
        search: attendeesSearch
      });
      if (res && res.status && res.data) {
        setAttendeesList(res.data.attendees || []);
        setAttendeesPagination(res.data.pagination || null);
      }
    } catch (err) {
      console.error("Failed to fetch attendees list:", err);
    } finally {
      setAttendeesLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchAttendeesList();
    }
  }, [eventId, attendeesPage, attendeesSearch]);

  const handleCancelEvent = async () => {
    try {
      setIsCancelling(true);
      const finalReason = cancellationReason === "Other" ? customReasonText : cancellationReason;
      const res = await bookingApi.cancelEvent({
        eventId: eventId,
        reason: finalReason || "Event cancelled by organizer",
      });
      if (res && res.status) {
        await fetchDetails();
        setShowCancelModal(false);
      }
    } catch (err) {
      console.error("Failed to cancel event:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const res = await eventApi.updateEvent(eventId, {
        ReservedExternally: tempReservedExternally,
      });
      if (res && res.status) {
        await fetchDetails();
        setShowReservationModal(false);
      }
    } catch (err) {
      console.error("Failed to update external reservations:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await eventApi.getEventDetails(eventId);
      if (response && response?.data && response?.status) {
        setEvent(response?.data?.event);
        setAttendees(response?.data?.attendees);
      }
    } catch (error) {
      console.error("Failed to fetch event details", error);
    } finally {
      setLoading(false);
    }
  };

  const { t, language } = useLanguage();

  useEffect(() => {
    if (eventId) {
      fetchDetails();
    }
  }, [eventId]);

  useEffect(() => {
    if (event) {
      document.title = `${event.eventTitle || t("eventDetails")} - Control Center`;
    } else {
      document.title = `${t("eventDetails")} - Bondy`;
    }
  }, [event, t]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5 min-vh-50">
        <Spinner animation="border" style={{ color: "#23ada4" }} />
        <p className="mt-3 text-secondary">{t("loadingEventDetails") || "Loading details..."}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-5">
        <h4 className="text-white mb-3">{t("eventNotFound")}</h4>
        <Link href="/EventsManagement" className="custom-btn">
          {t("backToList")}
        </Link>
      </div>
    );
  }

  // Estimate total revenue based on tickets soldQty
  const estimatedRevenue = event.tickets?.reduce(
    (sum, ticket) => sum + (ticket.soldQty || 0) * (ticket.price || 0),
    0
  ) || 0;

  const status = event.status?.toLowerCase();
  const isPastOrEnded = status === "past" || new Date(event.endDate) < new Date();

  return (
    <div className="event-control-center">
      {/* Action Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <Link href="/EventsManagement" className="back-btn-dashboard">
          <span className="me-2">←</span> {t("backToList") || "Back to Events"}
        </Link>
        <div className="d-flex gap-2">
          {!isPastOrEnded && event.status?.toLowerCase() !== "cancelled" && (
            <>
              <Link href={`/BasicInfo?eventId=${event._id}`} className="custom-btn edit-event-btn">
                ✏️ {t("edit") || "Edit Event"}
              </Link>
              {!event.isDraft && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="custom-btn btn-danger-custom"
                >
                  🛑 {t("cancelEvent") || "Cancel Event"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="hero-details-card mb-4">
        <div className="hero-blur-bg" style={{ backgroundImage: `url(${getFullImageUrl(event.posterImage?.[0]) || "/img/sidebar-logo.svg"})` }}></div>
        <div className="hero-content-overlay d-flex flex-column flex-md-row gap-4 p-4 align-items-center align-items-md-stretch">
          <div className="hero-poster shadow-lg">
            <img
              src={getFullImageUrl(event.posterImage?.[0]) || "/img/sidebar-logo.svg"}
              alt={event.eventTitle}
              onError={(e) => { e.target.src = "/img/sidebar-logo.svg"; }}
            />
          </div>
          <div className="hero-text-details d-flex flex-column justify-content-between text-center text-md-start">
            <div>
              <div className="d-flex gap-2 flex-wrap mb-2 justify-content-center justify-content-md-start">
                <span className={`badge-status ${event.isDraft ? "draft" : (event.status?.toLowerCase() || "upcoming")}`}>
                  {event.isDraft ? (t("draftLabel") || "Draft") : (t(event.status?.toLowerCase()) || event.status)}
                </span>
                {event.isFeatured && <span className="badge-status featured">⭐ Featured</span>}
                {event.visibility && <span className="badge-status visibility">{event.visibility}</span>}
              </div>
              <h1 className="hero-title text-truncate-2">{event.eventTitle}</h1>
              <p className="hero-category text-muted mt-2">
                📂 {event.eventCategory?.name || t("na")}
              </p>
            </div>
            <div className="hero-meta text-muted mt-3 d-flex flex-wrap gap-3 justify-content-center justify-content-md-start">
              <span>📅 {t("createDate")}: <strong>{new Date(event.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
              <span>👤 {t("organizerName")}: <strong>{event.createdBy?.firstName ? `${event.createdBy.firstName} ${event.createdBy.lastName || ""}` : "N/A"}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Organizer KPI Dashboard Cards */}
      <Row className="gx-3 gy-3 mb-4">
        <Col lg={3} md={6} xs={12}>
          <div className="kpi-card shadow-sm">
            <div className="kpi-icon">💰</div>
            <div className="kpi-content">
              <h5>{t("estimatedRevenue") || "Gross Revenue"}</h5>
              <h3>₮{estimatedRevenue.toLocaleString()}</h3>
              <p className="small text-muted">{t("ticketsRevenueOnly") || "From direct ticket sales"}</p>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6} xs={12}>
          <div className="kpi-card shadow-sm">
            <div className="kpi-icon">🎟️</div>
            <div className="kpi-content">
              <h5>{t("ticketsSold") || "Tickets Sold"}</h5>
              <h3>
                {event.totalBooked?.toLocaleString() || 0} <span className="total-cap">/ {event.totalTickets?.toLocaleString() || 0}</span>
              </h3>
              <div className="progress-bar-container mt-2">
                <div
                  className="progress-bar-filled"
                  style={{ width: `${event.totalTickets > 0 ? (event.totalBooked / event.totalTickets) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6} xs={12}>
          <div className="kpi-card shadow-sm">
            <div className="kpi-icon">💺</div>
            <div className="kpi-content">
              <h5>{t("seatsLeft") || "Tickets Left"}</h5>
              <h3>{event.leftSeats?.toLocaleString() || 0}</h3>
              <p className="small text-muted">{event.ReservedExternally > 0 ? `+${event.ReservedExternally} Reserved Externally` : "Available for public booking"}</p>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6} xs={12}>
          <div className="kpi-card shadow-sm">
            <div className="kpi-icon">👥</div>
            <div className="kpi-content">
              <h5>{t("totalAttendees") || "Total Check-Ins"}</h5>
              <h3>{event.totalAttendees || 0}</h3>
              <p className="small text-muted">{t("checkedInSuffix") || "Attendees checked in"}</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Main Two-Column Grid */}
      <Row className="gx-4">
        {/* Left Column - Details, Media & Gallery */}
        <Col lg={7} md={12} className="mb-4">
          <div className="content-card mb-4 p-4 shadow-sm">
            <h4 className="card-heading-line mb-3"><span>{t("shortDescription")}</span></h4>
            <ExpandableText text={event.shortdesc} limit={250} />
          </div>

          <div className="content-card mb-4 p-4 shadow-sm">
            <h4 className="card-heading-line mb-3"><span>{t("detailedHighlights")}</span></h4>
            <ExpandableText text={event.longdesc} limit={450} />
          </div>

          {/* Optional Teaser Video */}
          {event.shortTeaserVideo && event.shortTeaserVideo.length > 0 && (
            <div className="content-card mb-4 p-4 shadow-sm">
              <h4 className="card-heading-line mb-3"><span>{t("teaserVideo")}</span></h4>
              <div className="video-card-container">
                <video
                  width="100%"
                  controls
                  poster={getFullImageUrl(event.posterImage?.[0])}
                  className="rounded-3 shadow-md"
                >
                  <source src={getFullImageUrl(event.shortTeaserVideo[0])} />
                  {t("videoNotSupported") || "Your browser does not support videos."}
                </video>
              </div>
            </div>
          )}

          {/* Gallery Images */}
          {event.mediaLinks && event.mediaLinks.length > 0 && (
            <div className="content-card p-4 shadow-sm">
              <h4 className="card-heading-line mb-3"><span>{t("gallery")}</span></h4>
              <div className="details-gallery-grid">
                {event.mediaLinks.map((link, idx) => (
                  <div key={idx} className="details-gallery-item">
                    <img
                      src={getFullImageUrl(link)}
                      alt={`Gallery ${idx}`}
                      onError={(e) => { e.target.src = "/img/sidebar-logo.svg"; }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Col>

        {/* Right Column - Location, Tickets, Attendees */}
        <Col lg={5} md={12} className="mb-4">
          {/* Capacity and Reservations Card */}
          <div className="content-card mb-4 p-4 shadow-sm">
            <h4 className="card-heading-line mb-3"><span>{t("capacityOverview") || "Capacity Overview"}</span></h4>
            <div className="d-flex justify-content-between align-items-center mb-4 text-center">
              <div className="flex-fill">
                <div style={{ fontSize: "24px", color: "#23ada4" }}>🎟️</div>
                <div className="small text-muted mt-1">{t("booked") || "Booked"}</div>
                <h4 className="fw-bold mb-0 text-white mt-1">{event.totalBooked || 0}</h4>
              </div>
              <div className="flex-fill" style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: "24px", color: "#f1c40f" }}>👥</div>
                <div className="small text-muted mt-1">{t("reservedExternally") || "Reserved Externally"}</div>
                <h4 className="fw-bold mb-0 mt-1" style={{ color: "#f1c40f" }}>{event.ReservedExternally || 0}</h4>
              </div>
              <div className="flex-fill">
                <div style={{ fontSize: "24px", color: "#23ada4" }}>💺</div>
                <div className="small text-muted mt-1">{t("capacity") || "Capacity"}</div>
                <h4 className="fw-bold mb-0 text-white mt-1">{event.totalTickets || 0}</h4>
              </div>
            </div>

            <hr style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

            <div className="mt-3">
              <div className="d-flex justify-content-between small mb-2">
                <span className="text-white-50">
                  <span className="text-white fw-bold">{event.totalBooked || 0}</span> / {event.totalTickets || 0} Booked
                </span>
                <span style={{ color: "#23ada4" }} className="fw-bold">
                  {event.leftSeats || 0} Available
                </span>
              </div>
              <div className="progress-bar-container light">
                <div
                  className="progress-bar-filled"
                  style={{
                    width: `${event.totalTickets > 0 ? ((event.totalBooked || 0) / event.totalTickets) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>

            <div className="text-center mt-4">
              <button
                onClick={() => {
                  setTempReservedExternally(event.ReservedExternally || 0);
                  setShowReservationModal(true);
                }}
                className="btn-update-outside"
              >
                {t("updateOutsideReservation") || "Update Outside Reservation"}
              </button>
            </div>
          </div>

          {/* DateTime & Location details */}
          <div className="content-card mb-4 p-4 shadow-sm">
            <h4 className="card-heading-line mb-3"><span>{t("dateTimeLocation")}</span></h4>
            <div className="schedule-box mb-3 d-flex flex-column gap-3">
              <div className="d-flex align-items-start gap-2">
                <span className="icon-schedule">📍</span>
                <div>
                  <h6 className="mb-1 text-muted" style={{ fontSize: "13px" }}>{t("venue")}</h6>
                  <p className="text-white mb-0 font-weight-bold" style={{ fontSize: "14px" }}>{event.venueName}</p>
                  <p className="small text-secondary mb-0">{event.venueAddress?.address}</p>
                  <p className="small text-secondary mb-0">{event.venueAddress?.city}, {event.venueAddress?.country}</p>
                </div>
              </div>

              <div className="d-flex align-items-start gap-2">
                <span className="icon-schedule">📅</span>
                <div>
                  <h6 className="mb-1 text-muted" style={{ fontSize: "13px" }}>{t("startDate")}</h6>
                  <p className="text-white mb-0" style={{ fontSize: "14px" }}>
                    {new Date(event.startDate).toLocaleDateString(language === "mn" ? "mn-MN" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    <span className="mx-2">•</span>
                    {formatTime(event.startTime, true, language)}
                  </p>
                </div>
              </div>

              <div className="d-flex align-items-start gap-2">
                <span className="icon-schedule">📅</span>
                <div>
                  <h6 className="mb-1 text-muted" style={{ fontSize: "13px" }}>{t("endDate")}</h6>
                  <p className="text-white mb-0" style={{ fontSize: "14px" }}>
                    {new Date(event.endDate).toLocaleDateString(language === "mn" ? "mn-MN" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    <span className="mx-2">•</span>
                    {formatTime(event.endTime, true, language)}
                  </p>
                </div>
              </div>
            </div>

            <hr style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

            <Row className="gy-2">
              <Col xs={6}>
                <h6 className="small text-muted mb-1">{t("ageRestriction") || "Age Limit"}</h6>
                <p className="text-white font-weight-medium mb-0">
                  {typeof event.ageRestriction === "string" ? event.ageRestriction : event.ageRestriction?.minAge ? `${event.ageRestriction.minAge}+` : "All Ages"}
                </p>
              </Col>
              <Col xs={6}>
                <h6 className="small text-muted mb-1">{t("dressCode") || "Dress Code"}</h6>
                <p className="text-white font-weight-medium mb-0">{event.dressCode || "Casual"}</p>
              </Col>
              {event.refundPolicy && (
                <Col xs={12} className="mt-2">
                  <h6 className="small text-muted mb-1">{t("refundPolicy") || "Refund Policy"}</h6>
                  <p className="text-white font-weight-medium mb-0">{event.refundPolicy}</p>
                </Col>
              )}
            </Row>
          </div>

          {/* Ticket Tiers Performance Breakdown */}
          <div className="content-card mb-4 p-4 shadow-sm">
            <h4 className="card-heading-line mb-3"><span>{t("ticketAndPricing") || "Ticket Types"}</span></h4>
            {event.tickets && event.tickets.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {event.tickets.map((tck, idx) => {
                  const tckPercent = tck.qty > 0 ? Math.round((tck.soldQty / tck.qty) * 100) : 0;
                  return (
                    <div className="ticket-tier-row p-3 rounded" key={tck._id || idx}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="text-white font-weight-bold mb-0" style={{ fontSize: "15px" }}>{tck.ticketName}</h6>
                          <p className="small text-secondary mb-0 mt-1">{tck.ticketShortDesc || "No description provided"}</p>
                        </div>
                        <h5 className="ticket-price-badge m-0">₮{tck.price?.toLocaleString()}</h5>
                      </div>

                      <div className="mt-3">
                        <div className="d-flex justify-content-between small text-muted mb-1">
                          <span>Sales Progress: {tck.soldQty} / {tck.qty} Sold</span>
                          <span>{tckPercent}%</span>
                        </div>
                        <div className="progress-bar-container light">
                          <div className="progress-bar-filled" style={{ width: `${tckPercent}%` }}></div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between small text-secondary mt-2" style={{ fontSize: "11px" }}>
                        <span>Sales Start: {tck.salesStart ? new Date(tck.salesStart).toLocaleDateString() : "N/A"}</span>
                        <span>End: {tck.salesEnd ? new Date(tck.salesEnd).toLocaleDateString() : "N/A"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-secondary small my-3 text-center">No ticket options defined for this event.</p>
            )}
          </div>

          {/* Attendees List Card */}
          <div className="content-card p-4 shadow-sm mb-4">
            <h4 className="card-heading-line mb-3">
              <span>{t("attendeesList") || "Event Attendees"}</span>
            </h4>

            {/* Search Input */}
            <div className="mb-3">
              <input
                type="text"
                className="form-control custom-select-dark"
                placeholder={t("searchAttendees") || "Search by name..."}
                value={attendeesSearch}
                onChange={(e) => {
                  setAttendeesSearch(e.target.value);
                  setAttendeesPage(1);
                }}
              />
            </div>

            {attendeesLoading ? (
              <div className="text-center py-4">
                <Spinner animation="border" size="sm" style={{ color: "#23ada4" }} />
              </div>
            ) : attendeesList && attendeesList.length > 0 ? (
              <>
                <div className="d-flex flex-column gap-3">
                  {attendeesList.map((attendee) => (
                    <div key={attendee._id} className="d-flex align-items-center justify-content-between p-3 rounded bg-dark-soft border border-secondary border-opacity-10">
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={getFullImageUrl(attendee.profileImage) || "/img/default-user.png"}
                          onError={(e) => { e.target.src = "/img/default-user.png"; }}
                          alt={attendee.firstName}
                          className="rounded-circle"
                          style={{ width: "40px", height: "40px", objectFit: "cover" }}
                        />
                        <div>
                          <h6 className="mb-0 text-white fw-bold">{attendee.firstName} {attendee.lastName}</h6>
                          <small className="text-secondary">{attendee.userRole || "GUEST"}</small>
                          {attendee.tickets && attendee.tickets.length > 0 && (
                            <div className="mt-1">
                              {attendee.tickets.map((tck, idx) => (
                                <span key={idx} className="badge bg-secondary me-1" style={{ fontSize: "10px" }}>
                                  {tck.ticketName} x{tck.qty}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/Message?userId=${attendee._id}`}
                        className="btn-message-attendee"
                      >
                        💬 {t("message") || "Message"}
                      </Link>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {attendeesPagination && attendeesPagination.totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <button
                      className="btn-pagination"
                      disabled={attendeesPage <= 1}
                      onClick={() => setAttendeesPage(prev => prev - 1)}
                    >
                      ← {t("prev") || "Prev"}
                    </button>
                    <span className="small text-secondary">
                      {t("page") || "Page"} {attendeesPage} / {attendeesPagination.totalPages}
                    </span>
                    <button
                      className="btn-pagination"
                      disabled={attendeesPage >= attendeesPagination.totalPages}
                      onClick={() => setAttendeesPage(prev => prev + 1)}
                    >
                      {t("next") || "Next"} →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-secondary small my-2 text-center">No attendees found.</p>
            )}
          </div>
        </Col>
      </Row>

      {showReservationModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-container">
            <div className="custom-modal-header">
              <button
                className="modal-back-btn"
                onClick={() => setShowReservationModal(false)}
              >
                ←
              </button>
              <h5 className="modal-title">{t("adjustReservedSeats") || "Adjust Reserved Seats"}</h5>
              <div style={{ width: "24px" }}></div>
            </div>

            <div className="custom-modal-body">
              <div className="modal-event-info-card">
                <div className="info-row">
                  <span className="info-icon">📅</span>
                  <span className="info-text">
                    {new Date(event.startDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-icon">📍</span>
                  <span className="info-text">{event.venueName}</span>
                </div>
                <div className="info-row">
                  <span className="info-icon">🕒</span>
                  <span className="info-text">
                    {formatTime(event.startTime, true, language)} - {formatTime(event.endTime, true, language)}
                  </span>
                </div>
                <div className="event-title-sub mt-2">{event.eventTitle}</div>
              </div>

              <div className="counter-section mt-4">
                <h6 className="counter-title">{t("reservedExternallyLabel") || "Reserved externally"}</h6>
                <p className="counter-subtitle">{t("reservedExternallyDesc") || "Add the number of seats reserved outside of Bondy"}</p>

                <div className="counter-widget-container">
                  <button
                    className="counter-btn"
                    onClick={() => setTempReservedExternally(prev => Math.max(0, prev - 1))}
                    disabled={tempReservedExternally <= 0}
                  >
                    —
                  </button>
                  <span className="counter-value">{tempReservedExternally}</span>
                  <button
                    className="counter-btn"
                    onClick={() => {
                      const maxAllowed = (event.totalTickets || 0) - (event.totalAttendees || 0);
                      setTempReservedExternally(prev => Math.min(maxAllowed, prev + 1));
                    }}
                    disabled={tempReservedExternally >= ((event.totalTickets || 0) - (event.totalAttendees || 0))}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="capacity-overview-section mt-4">
                <h6 className="overview-section-title">{t("updatedCapacityOverview") || "Updated capacity overview"}</h6>
                <div className="overview-row">
                  <span>{t("booked") || "Booked"}</span>
                  <span className="value-teal">{event.totalAttendees || 0}</span>
                </div>
                <div className="overview-row">
                  <span>{t("reservedExternally") || "Reserved externally"}</span>
                  <span className="value-yellow">{tempReservedExternally}</span>
                </div>
                <div className="overview-row">
                  <span>{t("available") || "Available"}</span>
                  <span className="value-teal">
                    {Math.max(0, (event.totalTickets || 0) - (event.totalAttendees || 0) - tempReservedExternally)}
                  </span>
                </div>
                <div className="overview-row">
                  <span>{t("capacity") || "Capacity"}</span>
                  <span className="value-white">{event.totalTickets || 0}</span>
                </div>
              </div>

              <p className="session-warning-text mt-4">
                {t("sessionWarning") || "This change applies only to this session."}
              </p>
            </div>

            <div className="custom-modal-footer">
              <button
                className="modal-btn-cancel"
                onClick={() => setShowReservationModal(false)}
                disabled={isSaving}
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                className="modal-btn-save"
                onClick={handleSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Spinner animation="border" size="sm" style={{ color: "#fff" }} />
                ) : (
                  t("saveChanges") || "Save changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-container">
            <div className="custom-modal-header">
              <button
                className="modal-back-btn"
                onClick={() => setShowCancelModal(false)}
              >
                ←
              </button>
              <h5 className="modal-title">{t("cancelEventTitle") || "Cancel Entire Event"}</h5>
              <div style={{ width: "24px" }}></div>
            </div>

            <div className="custom-modal-body">
              <p className="text-danger fw-bold mb-3" style={{ fontSize: "14px" }}>
                ⚠️ WARNING: This action is irreversible. All booked tickets will be fully refunded, and the event will be marked as Cancelled.
              </p>

              <div className="mb-3">
                <label className="small text-muted mb-2">{t("cancellationReason") || "Select Reason for Cancellation"}</label>
                <select
                  className="form-select custom-select-dark"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                >
                  <option value="Event venue no longer available">Event venue no longer available</option>
                  <option value="Cancelled due to severe weather conditions">Cancelled due to severe weather conditions</option>
                  <option value="Schedule conflict">Schedule conflict</option>
                  <option value="Low attendance">Low attendance</option>
                  <option value="Speaker/Artist unavailable">Speaker/Artist unavailable</option>
                  <option value="Other">Other (Write custom reason)</option>
                </select>
              </div>

              {cancellationReason === "Other" && (
                <div className="mb-3">
                  <label className="small text-muted mb-2">{t("customReasonLabel") || "Custom Cancellation Reason"}</label>
                  <textarea
                    className="form-control custom-textarea-dark"
                    rows="3"
                    placeholder="Enter reason details..."
                    value={customReasonText}
                    onChange={(e) => setCustomReasonText(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="custom-modal-footer">
              <button
                className="modal-btn-cancel"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                {t("keepEvent") || "Keep Event"}
              </button>
              <button
                className="modal-btn-confirm-cancel"
                onClick={handleCancelEvent}
                disabled={isCancelling || (cancellationReason === "Other" && !customReasonText.trim())}
              >
                {isCancelling ? (
                  <Spinner animation="border" size="sm" style={{ color: "#fff" }} />
                ) : (
                  t("confirmCancel") || "Cancel Event"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .event-control-center {
          color: #fff;
          font-family: 'Inter', sans-serif;
        }
        .back-btn-dashboard {
          color: #888;
          text-decoration: none;
          font-size: 14px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .back-btn-dashboard:hover {
          color: #23ada4;
        }
        .edit-event-btn {
          padding: 8px 20px;
          font-size: 13px;
          border-radius: 20px;
        }
        .hero-details-card {
          position: relative;
          background: #1e1e1e;
          border: 1px solid #2d2d2d;
          border-radius: 16px;
          overflow: hidden;
        }
        .hero-blur-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-size: cover;
          background-position: center;
          filter: blur(40px) brightness(0.25);
          z-index: 1;
        }
        .hero-content-overlay {
          position: relative;
          z-index: 2;
        }
        .hero-poster {
          width: 130px;
          height: 130px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid rgba(255,255,255,0.1);
        }
        .hero-poster img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .hero-text-details {
          flex: 1;
        }
        .hero-title {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }
        .badge-status {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
          text-transform: uppercase;
        }
        .badge-status.draft { background: rgba(255, 193, 7, 0.15); color: #ffc107; border: 1px solid rgba(255, 193, 7, 0.3); }
        .badge-status.upcoming { background: rgba(0, 123, 255, 0.15); color: #007bff; border: 1px solid rgba(0, 123, 255, 0.3); }
        .badge-status.ongoing { background: rgba(40, 167, 69, 0.15); color: #28a745; border: 1px solid rgba(40, 167, 69, 0.3); }
        .badge-status.past { background: rgba(108, 117, 125, 0.15); color: #999; border: 1px solid rgba(108, 117, 125, 0.3); }
        .badge-status.cancelled { background: rgba(220, 53, 69, 0.15); color: #dc3545; border: 1px solid rgba(220, 53, 69, 0.3); }
        .badge-status.featured { background: linear-gradient(135deg, #f6d365, #fda085); color: #000; }
        .badge-status.visibility { background: rgba(255,255,255,0.08); color: #ccc; border: 1px solid rgba(255,255,255,0.15); }
        
        .kpi-card {
          background: #1e1e1e;
          border: 1px solid #2d2d2d;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .kpi-icon {
          font-size: 28px;
          background: rgba(35, 173, 164, 0.1);
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .kpi-content {
          flex: 1;
        }
        .kpi-content h5 {
          color: #888;
          font-size: 12px;
          text-transform: uppercase;
          margin-bottom: 6px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .kpi-content h3 {
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }
        .kpi-content .total-cap {
          font-size: 13px;
          color: #666;
          font-weight: 500;
        }
        .progress-bar-container {
          background: #111;
          height: 6px;
          border-radius: 10px;
          overflow: hidden;
          width: 100%;
        }
        .progress-bar-container.light {
          background: rgba(255,255,255,0.05);
        }
        .progress-bar-filled {
          background: #23ada4;
          height: 100%;
          border-radius: 10px;
        }
        .content-card {
          background: #1e1e1e;
          border: 1px solid #2d2d2d;
          border-radius: 14px;
        }
        .card-heading-line {
          font-size: 15px;
          font-weight: 600;
          text-transform: uppercase;
          border-bottom: 1px solid #2d2d2d;
          padding-bottom: 12px;
          color: #23ada4;
          margin-bottom: 16px;
        }
        .card-heading-line span {
          position: relative;
        }
        .card-heading-line span::after {
          content: "";
          position: absolute;
          bottom: -13px;
          left: 0;
          width: 100%;
          height: 2px;
          background: #23ada4;
        }
        .details-gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 12px;
        }
        .details-gallery-item {
          aspect-ratio: 1;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #333;
        }
        .details-gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.25s ease;
        }
        .details-gallery-item img:hover {
          transform: scale(1.08);
        }
        .icon-schedule {
          font-size: 20px;
          background: rgba(255,255,255,0.05);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }
        .ticket-tier-row {
          background: #161616;
          border: 1px solid rgba(255,255,255,0.04);
        }
        .ticket-price-badge {
          color: #23ada4;
          font-weight: 700;
          font-size: 16px;
        }
        .bg-dark-soft {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255,255,255,0.02);
        }
        .attendee-img {
          transition: transform 0.2s ease, z-index 0.2s ease;
        }
        .attendee-img:hover {
          transform: translateY(-4px) scale(1.05);
          z-index: 10;
        }
        .btn-update-outside {
          background: transparent;
          border: 1px solid #23ada4;
          color: #23ada4;
          padding: 10px 24px;
          border-radius: 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }
        .btn-update-outside:hover {
          background: rgba(35, 173, 164, 0.1);
        }
        .custom-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(8px);
        }
        .custom-modal-container {
          background: #111111;
          border: 1px solid #2d2d2d;
          border-radius: 24px;
          width: 90%;
          max-width: 480px;
          padding: 24px;
          display: flex;
          flex-direction: column;
        }
        .custom-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .modal-back-btn {
          background: transparent;
          border: none;
          color: #fff;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        .modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }
        .modal-event-info-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        }
        .info-icon {
          font-size: 16px;
        }
        .event-title-sub {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
        }
        .counter-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .counter-title {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
        }
        .counter-subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 16px;
        }
        .counter-widget-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 12px 24px;
          width: 100%;
        }
        .counter-btn {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          border: none;
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .counter-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }
        .counter-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .counter-value {
          font-size: 28px;
          font-weight: 700;
          color: #f1c40f;
          min-width: 40px;
          text-align: center;
        }
        .capacity-overview-section {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 16px;
          padding: 16px;
        }
        .overview-section-title {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 12px;
        }
        .overview-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .overview-row:last-child {
          border-bottom: none;
        }
        .value-teal {
          color: #23ada4;
          font-weight: 600;
        }
        .value-yellow {
          color: #f1c40f;
          font-weight: 600;
        }
        .value-white {
          color: #fff;
          font-weight: 600;
        }
        .session-warning-text {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
        }
        .custom-modal-footer {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }
        .modal-btn-cancel {
          flex: 1;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          padding: 12px;
          border-radius: 24px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .modal-btn-cancel:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
        }
        .modal-btn-save {
          flex: 1;
          background: #23ada4;
          border: none;
          color: #111;
          padding: 12px;
          border-radius: 24px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-btn-save:hover:not(:disabled) {
          background: #1e968e;
        }
        .modal-btn-save:disabled, .modal-btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .custom-select-dark, .custom-textarea-dark {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #fff !important;
          border-radius: 10px;
          padding: 10px 14px;
        }
        .custom-select-dark option {
          background: #111;
          color: #fff;
        }
        .btn-danger-custom {
          background: #dc3545;
          border: none;
          color: #fff;
          padding: 8px 20px;
          font-size: 13px;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .btn-danger-custom:hover {
          background: #c82333;
        }
        .modal-btn-confirm-cancel {
          flex: 1;
          background: #dc3545;
          border: none;
          color: #fff;
          padding: 12px;
          border-radius: 24px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-btn-confirm-cancel:hover:not(:disabled) {
          background: #bd2130;
        }
        .modal-btn-confirm-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-message-attendee {
          background: #23ada4;
          border: none;
          color: #111;
          padding: 6px 14px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          display: inline-block;
          transition: background 0.2s ease;
        }
        .btn-message-attendee:hover {
          background: #1e968e;
          color: #111;
        }
        .btn-pagination {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 6px 16px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-pagination:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }
        .btn-pagination:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

function page() {
  return (
    <Suspense fallback={
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: "#23ada4" }} />
      </div>
    }>
      <EventDetailsContent />
    </Suspense>
  );
}

export default page;
