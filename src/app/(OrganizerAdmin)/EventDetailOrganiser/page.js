"use client";
import Link from "next/link";
import React, { useState, useEffect, Suspense } from "react";
import { Col, Row, Spinner } from "react-bootstrap";
import { useSearchParams } from "next/navigation";
import eventApi from "@/api/eventApi";

function ExpandableText({ text, limit = 200, className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return <p className={className}>N/A</p>;

  const shouldShowToggle = text.length > limit;
  const displayText = isExpanded || !shouldShowToggle ? text : `${text.substring(0, limit)}...`;

  return (
    <div className={className}>
      <p style={{ whiteSpace: "pre-line", margin: 0 }}>{displayText}</p>
      {shouldShowToggle && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="view-more-btn mt-1"
          style={{
            background: "none",
            border: "none",
            color: "#007bff",
            padding: 0,
            fontSize: "0.85rem",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          {isExpanded ? "View Less" : "View More"}
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

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await eventApi.getEventDetails(eventId);
      if (response && response.data && response.status) {
        setEvent(response.data.event);
        setAttendees(response.data.attendees);
      }
    } catch (error) {
      console.error("Failed to fetch event details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchDetails();
    }
  }, [eventId]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-white">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-5">
        <h4 className="text-white">Event not found</h4>
        <Link href="/EventsManagement" className="custom-btn mt-3">
          Back to List
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="cards event-details">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Link href="/EventsManagement" className="back-btn m-0">
            <img src="/img/arrow-left-white.svg" alt="Back" />
            Back to List
          </Link>
          <div className="d-flex gap-2">
            {event.isFeatured && <span className="status-badge featured">Featured</span>}
            {/* {event.isBooked && <span className="status-badge booked">Booked</span>} */}
            {event.isWishlisted && <span className="status-badge wishlisted">Wishlisted</span>}
          </div>
        </div>

        <h4 className="line-title">
          <span>Event Overview</span>
        </h4>
        <Row className="align-items-start">
          <Col md={3}>
            <div className="event-dtl-card">
              <div className="event-dtl-card-img" style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}>
                <img
                  src={event.posterImage?.[0] || "/img/org-img/event-dtl-img.png"}
                  alt={event.eventTitle}
                  style={{ width: "100%", height: "auto", minHeight: "200px", objectFit: "cover" }}
                />
              </div>
              <h3 className="mt-3" style={{ fontSize: "1.5rem", fontWeight: "700" }}>{event.eventTitle}</h3>
            </div>
          </Col>
          <Col md={9}>
            <ul className="event-dtl-rgt custom-grid-list">
              <li>
                <h6>Category</h6>
                <p>{event.eventCategory?.name || "N/A"}</p>
              </li>
              <li>
                <h6>Created Date</h6>
                <p>
                  {new Date(event.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </li>
              <li>
                <h6>Organizer Name</h6>
                <p>
                  {event.createdBy?.firstName
                    ? `${event.createdBy.firstName} ${event.createdBy.lastName || ""}`
                    : event.createdBy?.username || "N/A"}
                </p>
              </li>
              <li>
                <h6>Tags</h6>
                <ExpandableText text={event.tags?.join(", ")} limit={50} />
              </li>
              <li>
                <h6>Status</h6>
                <span className={`status-badge ${event.status?.toLowerCase() || "upcoming"}`}>
                  {event.status || "Upcoming"}
                </span>
              </li>
            </ul>
          </Col>
        </Row>

        <div className="time-location common-dtl-list mt-40">
          <h4 className="line-title">
            <span>Date, Time and Location</span>
          </h4>
          <ul className="event-dtl-rgt">
            <li>
              <h6>Venue Name</h6>
              <ExpandableText text={event.venueName} limit={100} />
            </li>
            <li className="flex-row gap-4">
              <div>
                <h6>
                  <img src="/img/white-calendar.svg" alt="" className="me-2" />
                  Start Date
                </h6>
                <p>
                  {new Date(event.startDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  <span className="mx-2">•</span>
                  {event.startTime || "N/A"}
                </p>
              </div>
              <div>
                <h6>
                  <img src="/img/white-calendar.svg" alt="" className="me-2" />
                  End Date
                </h6>
                <p>
                  {new Date(event.endDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  <span className="mx-2">•</span>
                  {event.endTime || "N/A"}
                </p>
              </div>
            </li>
            <li>
              <h6>
                <img src="/img/Map-Point.svg" alt="" className="me-2" />
                Location
              </h6>
              <div className="text-white">
                <ExpandableText
                  text={event.venueAddress?.address}
                  limit={100}
                />
                <p className="mt-1 opacity-75">
                  {event.venueAddress?.city && `${event.venueAddress.city}, `}
                  {event.venueAddress?.country || ""}
                </p>
              </div>
            </li>
            {event.dressCode && (
              <li>
                <h6>Dress Code</h6>
                <ExpandableText text={event.dressCode} limit={50} />
              </li>
            )}
            {event.ageRestriction && (
              <li>
                <h6>Age Restriction</h6>
                <p>
                  {event.ageRestriction.type === "RANGE"
                    ? `${event.ageRestriction.minAge} - ${event.ageRestriction.maxAge} Yrs`
                    : event.ageRestriction.minAge || "No restriction"}
                </p>
              </li>
            )}
            {event.duration && (
              <li>
                <h6>Duration</h6>
                <p>{event.duration}</p>
              </li>
            )}
          </ul>
        </div>

        <div className="ticket-pricing common-dtl-list mt-40">
          <h4 className="line-title">
            <span>Ticket & Pricing</span>
          </h4>
          <ul className="event-dtl-rgt">
            <li>
              <h6>Ticket Name</h6>
              <ExpandableText text={event.ticketName} limit={50} />
            </li>
            <li>
              <h6>Availability</h6>
              <p>{event.ticketQtyAvailable?.toLocaleString() || 0} / {event.totalTickets?.toLocaleString() || 0} Tickets</p>
            </li>
            <li>
              <h6>Price</h6>
              <p className="text-primary" style={{ fontSize: "1.2rem", fontWeight: "700" }}>
                ${event.ticketPrice?.toLocaleString() || 0}
              </p>
            </li>
            {event.addOns && (
              <li>
                <h6>Add-ons</h6>
                <ExpandableText text={event.addOns} limit={100} />
              </li>
            )}
            <li>
              <h6>Sale Period</h6>
              <p>
                {event.ticketSelesStartDate
                  ? new Date(event.ticketSelesStartDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                  : "N/A"}
                <span className="mx-2">to</span>
                {event.ticketSelesEndDate
                  ? new Date(event.ticketSelesEndDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                  : "N/A"}
              </p>
            </li>
            <li>
              <h6>Refund Policy</h6>
              <ExpandableText text={event.refundPolicy} limit={150} />
            </li>
          </ul>
        </div>

        {attendees && (
          <div className="attendees-section mt-40">
            <h4 className="line-title">
              <span>Attendees ({attendees.total})</span>
            </h4>
            <div className="d-flex align-items-center gap-3 bg-dark-soft p-3 rounded-3">
              <div className="attendee-profiles d-flex">
                {attendees.recent?.map((attendee, idx) => (
                  <img
                    key={idx}
                    src={attendee.profileImage || "/img/user-default.png"}
                    alt={`${attendee.firstName}`}
                    className="rounded-circle attendee-img"
                    style={{
                      width: "45px",
                      height: "45px",
                      marginLeft: idx > 0 ? "-18px" : "0",
                      border: "3px solid #1a1a1a",
                      objectFit: "cover"
                    }}
                    title={`${attendee.firstName} ${attendee.lastName}`}
                  />
                ))}
              </div>
              {attendees.total > (attendees.recent?.length || 0) && (
                <span className="text-white fw-bold">+{attendees.total - (attendees.recent?.length || 0)} others</span>
              )}
            </div>
          </div>
        )}

        {event.shortTeaserVideo && event.shortTeaserVideo.length > 0 && (
          <div className="teaser-video mt-40">
            <h4 className="line-title">
              <span>Teaser Video</span>
            </h4>
            <div className="video-wrapper shadow-lg">
              <video width="100%" controls poster={event.posterImage?.[0]} className="rounded-3">
                <source src={event.shortTeaserVideo[0]} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        <div className="descriptions-section mt-40">
          <Row>
            <Col md={6}>
              <h4 className="line-title">
                <span>Short Description</span>
              </h4>
              <ExpandableText text={event.shortdesc} limit={300} className="text-description" />
            </Col>
            <Col md={6}>
              <h4 className="line-title">
                <span>Detailed Highlights</span>
              </h4>
              <ExpandableText text={event.longdesc} limit={500} className="text-description" />
            </Col>
          </Row>
        </div>

        {event.mediaLinks && event.mediaLinks.length > 0 && (
          <div className="gellry-images mt-40">
            <h4 className="line-title">
              <span>Gallery</span>
            </h4>
            <div className="gallery-grid">
              {event.mediaLinks.map((link, idx) => (
                <div key={idx} className={`gallery-item ${idx === 0 ? "large" : ""}`}>
                  <img src={link} alt={`Gallery ${idx}`} className="rounded-3 shadow-sm" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .custom-grid-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }
        .bg-dark-soft {
          background: rgba(255, 255, 255, 0.05);
        }
        .attendee-img:hover {
          transform: translateY(-5px);
          z-index: 10;
          transition: transform 0.2s ease;
        }
        .video-wrapper {
          max-width: 800px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .status-badge.featured { background-color: #ffc107; color: #000; font-weight: 700; }
        .status-badge.booked { background-color: #28a745; color: #fff; font-weight: 600; }
        .status-badge.wishlisted { background-color: #e83e8c; color: #fff; font-weight: 600; }
        .text-description {
          color: #ccc;
          line-height: 1.6;
        }
        .mt-40 { margin-top: 40px; }
      `}</style>
    </div>
  );
}

function page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventDetailsContent />
    </Suspense>
  );
}

export default page;
