"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Col, Row } from "react-bootstrap";
import { useEventContext } from "@/context/EventContext";
import eventApi from "@/api/eventApi";
import authApi from "@/api/authApi";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { getFullImageUrl } from "@/utils/imageHelper";

function page() {
  const { eventData } = useEventContext();
  const [publishing, setPublishing] = useState(false);
  const [categories, setCategories] = useState([]);
  const router = useRouter();


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await authApi.getCategoryList({ type: "event" });
        if (response.data && response.data.categories) {
          setCategories(response.data.categories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const getCategoryName = (id) => {
    const category = categories.find((cat) => cat._id === id);
    return category ? category.name : "-";
  };

  const handlePublish = async (isDraft = false) => {
    setPublishing(true);
    try {
      const payload = { ...eventData, isDraft };

      // Clean the payload - extract IDs from populated fields
      if (payload.eventCategory && typeof payload.eventCategory === 'object') {
        payload.eventCategory = payload.eventCategory._id;
      }
      if (payload.createdBy && typeof payload.createdBy === 'object') {
        payload.createdBy = payload.createdBy._id;
      }

      // Remove fields that shouldn't be sent
      const fieldsToRemove = ['duration', 'status', 'totalAttendees', 'isBooked', 'totalRevenue', 'createdAt', 'updatedAt', '__v'];
      fieldsToRemove.forEach(field => delete payload[field]);

      const isEditMode = !!eventData._id;

      let response;
      if (isEditMode) {
        // Remove _id and creation-only fields from payload before sending
        const { _id, fetcherEvent, featureEventFee, createdBy, ...updatePayload } = payload;
        response = await eventApi.updateEvent(_id, updatePayload);
      } else {
        response = await eventApi.createEvent(payload);
      }

      if (response.status) {
        const action = isEditMode ? "updated" : "created";
        const draftMsg = isDraft ? "as draft" : "successfully";
        toast.success(`Event ${action} ${draftMsg}`);
        router.push("/EventsManagement");
      }
    } catch (error) {
      console.error("Error saving event:", error);
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
                  src={getFullImageUrl(eventData.posterImage[0]) || "/img/org-img/event-dtl-img.png"}
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
                <p>{getCategoryName(eventData.eventCategory)}</p>
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
              <p style={{ wordBreak: "break-word" }}>
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
          <p style={{ wordBreak: "break-word" }}>
            {eventData.shortdesc}
          </p>
        </div>
        <div className="long-desc mt-20">
          <h4 className="line-title">
            <span>Detailed Description/Highlights</span>
          </h4>
          <p style={{ wordBreak: "break-word" }}>
            {eventData.longdesc}
          </p>
        </div>
        {eventData.shortTeaserVideo && eventData.shortTeaserVideo.length > 0 && (
          <div className="video-section mt-20">
            <h4 className="line-title">
              <span>Teaser Video</span>
            </h4>
            <video
              src={getFullImageUrl(eventData.shortTeaserVideo[0])}
              controls
              width="100%"
              style={{ borderRadius: "12px" }}
            />
          </div>
        )}
        <div className="gellry-images">
          <h4 className="line-title">
            <span>Gallery</span>
          </h4>
          <div className="gallery-grid">
            {eventData.mediaLinks.map((link, index) => (
              <div className={`gallery-item ${index === 0 ? "large" : ""}`} key={index}>
                <img src={getFullImageUrl(link)} alt={`Gallery ${index}`} onError={(e) => { e.target.src = "/img/org-img/gallery-img-01.png" }} />
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
