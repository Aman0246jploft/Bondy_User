"use client";
import Link from "next/link";
import React, { useState } from "react";
import { Col, Row } from "react-bootstrap";
import { useEventContext } from "@/context/EventContext";
import eventApi from "@/api/eventApi";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

function page() {
  const { eventData } = useEventContext();
  const [publishing, setPublishing] = useState(false);
  const router = useRouter();

  const handlePublish = async (isDraft = false) => {
    setPublishing(true);
    try {
      const payload = { ...eventData, isDraft };
      const response = await eventApi.createEvent(payload);
      if (response.status) {
        toast.success(isDraft ? "Event saved as draft" : "Event published successfully");
        router.push("/Dashboard"); // Redirect to dashboard or event list
      }
    } catch (error) {
      console.error("Error creating event:", error);
      // Error handled by apiClient toast usually, but explicitly log
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <div className="cards event-details">
        <Link href="/Gallery" className="back-btn">
          <img src="/img/arrow-left-white.svg" alt="Back" />
          Back to Gallery
        </Link>
        <h4 className="line-title">
          <span>Event Details</span>
        </h4>
        <Row>
          <Col md={2}>
            <div className="event-dtl-card">
              <div className="event-dtl-card-img">
                <img
                  src={eventData.posterImage[0] || "/img/org-img/event-dtl-img.png"}
                  alt="Event Poster"
                  onError={(e) => { e.target.src = "/img/org-img/event-dtl-img.png" }}
                />
              </div>
              <h3>{eventData.eventTitle || "Event Title"}</h3>
            </div>
          </Col>
          <Col md={10}>
            <ul className="event-dtl-rgt">
              <li>
                <h6>Category</h6>
                <p>{eventData.eventCategory || "-"}</p> {/* Ideally fetch name */}
              </li>
              <li>
                <h6>Start Date</h6>
                <p>{eventData.startDate} {eventData.startTime}</p>
              </li>
              <li>
                <h6>Tags</h6>
                <p>{eventData.tags && eventData.tags.join(", ")}</p>
              </li>
              <li>
                <span className="status-badge pending">{eventData.isDraft ? "Draft" : "Review"}</span>
              </li>
            </ul>
          </Col>
        </Row>
        <div className="time-location common-dtl-list mt-20">
          <h4 className="line-title">
            <span>Date time and Location</span>
          </h4>
          <ul className="event-dtl-rgt">
            <li>
              <h6>Venue Name</h6>
              <p>{eventData.venueName}</p>
            </li>
            <li>
              <h6>
                <img src="/img/white-calendar.svg" alt="" />
                Start Date
              </h6>
              <p>
                <span>{eventData.startDate}</span>
                <span className="mx-2 text-secondary">•</span>
                <span>{eventData.startTime}</span>
              </p>
            </li>
            <li>
              <h6>
                <img src="/img/white-calendar.svg" alt="" />
                End Date
              </h6>
              <p>
                <span>{eventData.endDate}</span>
                <span className="mx-2 text-secondary">•</span>
                <span>{eventData.endTime}</span>
              </p>
            </li>
            <li>
              <h6>
                <img src="/img/Map-Point.svg" alt="" />
                Location
              </h6>
              <p>
                {eventData.venueAddress.address} <br />
                {eventData.venueAddress.city}, {eventData.venueAddress.country}
              </p>
            </li>
          </ul>
        </div>
        <div className="ticket-pricing common-dtl-list mt-20">
          <h4 className="line-title">
            <span>Ticket & Pricing</span>
          </h4>
          <ul className="event-dtl-rgt">
            <li>
              <h6>Ticket Name</h6>
              <p>{eventData.ticketName}</p>
            </li>
            <li>
              <h6>Quantity Available</h6>
              <p>{eventData.ticketQtyAvailable}</p>
            </li>
            <li>
              <h6>Price Per Ticket</h6>
              <p>${eventData.ticketPrice}</p>
            </li>
            <li>
              <h6>Total Tickets</h6>
              <p>{eventData.totalTickets}</p>
            </li>
            <li>
              <h6>Add-ons</h6>
              <p>{eventData.addOns || "-"}</p>
            </li>
            <li>
              <h6>Sale Start Date</h6>
              <p>{eventData.ticketSelesStartDate}</p>
            </li>
            <li>
              <h6>Sale End Date</h6>
              <p>{eventData.ticketSelesEndDate}</p>
            </li>
            <li>
              <h6>Refund Policy</h6>
              <p>{eventData.refundPolicy}</p>
            </li>
          </ul>
        </div>
        <div className="short-desc">
          <h4 className="line-title">
            <span>Short Description</span>
          </h4>
          <p>
            {eventData.shortdesc}
          </p>
        </div>
        <div className="long-desc mt-20">
          <h4 className="line-title">
            <span>Detailed Description/Highlights</span>
          </h4>
          <p>
            {eventData.longdesc}
          </p>
        </div>
        <div className="gellry-images">
          <h4 className="line-title">
            <span>Gallery</span>
          </h4>
          <div className="gallery-grid">
            {eventData.mediaLinks.map((link, index) => (
              <div className={`gallery-item ${index === 0 ? "large" : ""}`} key={index}>
                <img src={link} alt={`Gallery ${index}`} onError={(e) => { e.target.src = "/img/org-img/gallery-img-01.png" }} />
              </div>
            ))}
          </div>
        </div>
        <div className="d-flex gap-2 justify-content-end mt-5">
          <Link href="/Gallery" className="outline-btn">
            Back
          </Link>
          <button
            type="button"
            className="custom-btn"
            onClick={() => handlePublish(true)}
            disabled={publishing}
          >
            {publishing ? "Saving..." : "Save / Draft"}
          </button>
          <button
            type="button"
            className="custom-btn publish-btn"
            onClick={() => handlePublish(false)}
            disabled={publishing}
          >
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default page;
