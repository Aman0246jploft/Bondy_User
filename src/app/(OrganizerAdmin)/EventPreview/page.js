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
import { formatTime } from "@/utils/timeHelper";
import { useLanguage } from "@/context/LanguageContext";

function page() {
  const { t, language } = useLanguage();
  const { eventData } = useEventContext();
  const [publishing, setPublishing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [categories, setCategories] = useState([]);
  const router = useRouter();
  const getAgeString = () => {
    if (!eventData.ageRestriction) return "ALL";
    if (typeof eventData.ageRestriction === "string") {
      return eventData.ageRestriction;
    }
    const minAge = eventData.ageRestriction?.minAge;
    if (minAge === 18) return "18+";
    if (minAge === 21) return "21+";
    return "ALL";
  };

  const activeAge = getAgeString();

  const formatDateString = (dateStr) => {
    if (!dateStr) return "";
    const cleanDateStr = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const dateObj = new Date(cleanDateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await authApi.getCategoryList();
        if (response?.data && response?.data?.categories) {
          setCategories(response?.data?.categories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
    document.title = t("eventPreviewPageTitle");
  }, []);

  const getCategoryName = (id) => {
    const category = categories.find((cat) => cat._id === id);
    return category ? category.name : "-";
  };

  const handlePublish = async (isDraft = false) => {
    setPublishing(true);
    try {
      const isPublishedEdit = eventData._id && eventData.isDraft === false;
      const targetIsDraft = isPublishedEdit ? false : isDraft;
      const payload = { ...eventData, isDraft: targetIsDraft };

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
        const actionKey = isEditMode ? "updatedLabel" : "createdLabel";
        const draftKey = isDraft ? "asDraft" : "successfully";
        toast.success(`${t("event")}: ${t(actionKey)} ${t(draftKey)}`);
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
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 768px) {
          .event-dtl-rgt {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .event-dtl-rgt li {
            flex-basis: 100% !important;
            width: 100% !important;
            margin-bottom: 15px !important;
            margin-top: 0 !important;
          }
        }
      `}} />
      <div className="cards event-details">
        <Link href="/Agerestraction" className="back-btn">
          <img src="/img/arrow-left-white.svg" alt={t("back")} />
          {t("backToSettings") || "Back to Settings"}
        </Link>
        <h4 className="line-title">
          <span>{t("eventPreview") || "Event Preview"}</span>
        </h4>
        <div>
          {/* Image + Title side by side */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
            <div className="event-dtl-card-img" style={{ flexShrink: 0 }}>
              <img
                src={getFullImageUrl(eventData.posterImage?.[0]) || "/img/sidebar-logo.svg"}
                alt="Event Poster"
                onError={(e) => { e.target.src = "/img/sidebar-logo.svg" }}
              />
            </div>
            <div>

             <span className="status-badge pending mb-3">{eventData.isDraft ? t("draftLabel") : t("reviewLabel")}</span>
            <h3 style={{ minWidth: 0, wordBreak: "break-word", overflowWrap: "anywhere", margin: 0, alignSelf: "center" }}>
              {eventData.eventTitle || "Event Title"}
            </h3>
            </div>
          </div>
          {/* Category / Start Date below image */}
          <ul className="event-dtl-rgt">
            <li>
              <h6>{t("category")}</h6>
              <p>{getCategoryName(eventData.eventCategory)}</p>
            </li>
            <li>
              <h6>{t("startDate")}</h6>
              <p>{formatDateString(eventData.startDate)} {formatTime(eventData.startTime, true, language)}</p>
            </li>
            
          </ul>
        </div>
        <div className="time-location common-dtl-list mt-20">
          <h4 className="line-title">
            <span>{t("dateTimeLocation")}</span>
          </h4>
          <ul className="event-dtl-rgt">
            <li>
              <h6>{t("venueName")}</h6>
              <p>{eventData.venueName}</p>
            </li>
            <li>
              <h6>
                <img src="/img/white-calendar.svg" alt="" />
                {t("startDate")}
              </h6>
              <p>
                <span>{formatDateString(eventData.startDate)}</span>
                <span className="mx-2 text-secondary">•</span>
                <span>{formatTime(eventData.startTime, true, language)}</span>
              </p>
            </li>
            <li>
              <h6>
                <img src="/img/white-calendar.svg" alt="" />
                {t("endDate")}
              </h6>
              <p>
                <span>{formatDateString(eventData.endDate)}</span>
                <span className="mx-2 text-secondary">•</span>
                <span>{formatTime(eventData.endTime, true, language)}</span>
              </p>
            </li>
            <li>
              <h6>
                <img src="/img/Map-Point.svg" alt="" />
                {t("location")}
              </h6>
              <p style={{ wordBreak: "break-word" }}>
                {eventData.venueAddress?.address} <br />
                {eventData.venueAddress?.city}, {eventData.venueAddress?.country}
              </p>
            </li>
          </ul>
        </div>
        <div className="ticket-pricing common-dtl-list">
          <h4 className="line-title">
            <span>{t("ticketAndPricing")}</span>
          </h4>
          {(!eventData.tickets || eventData.tickets.length === 0 || (eventData.tickets.length === 1 && Number(eventData.tickets[0].price) === 0)) ? (
            <div style={{
              background: "rgba(35,173,164,0.08)",
              border: "1px solid rgba(35,173,164,0.25)",
              borderRadius: "12px",
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: "16px"
            }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(35,173,164,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <img src="/img/ticket.svg" alt="" style={{ width: "22px", opacity: 0.85 }} onError={(e) => { e.target.style.display = "none" }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.55)", marginBottom: "2px" }}>{t("ticketType")}</p>
                <p style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#23ada4" }}>{t("freeEvent") || "Free Event"} &mdash; {t("free") || "Free"}</p>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {eventData.tickets && eventData.tickets.map((ticket, index) => (
                  <div key={index} style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "14px",
                    overflow: "hidden"
                  }}>
                    {/* Ticket Header */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 20px",
                      background: "rgba(35,173,164,0.1)",
                      borderBottom: "1px solid rgba(35,173,164,0.2)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{
                          background: "#23ada4",
                          color: "#fff",
                          borderRadius: "6px",
                          padding: "2px 10px",
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          textTransform: "uppercase"
                        }}>
                          #{index + 1}
                        </span>
                        <span style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>{ticket.ticketName}</span>
                      </div>
                      <span style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#23ada4"
                      }}>₮{ticket.price}</span>
                    </div>
                    {/* Ticket Body */}
                    <div style={{ padding: "16px 20px" }}>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                        gap: "14px 20px"
                      }}>
                        <div>
                          <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "4px" }}>{t("quantityAvailable")}</p>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#fff" }}>{ticket.qty}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "4px" }}>{t("pricePerTicketLabel")}</p>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#fff" }}>₮{ticket.price}</p>
                        </div>
                        {ticket.salesStart && (
                          <div>
                            <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "4px" }}>{t("salesStartDateLabel")}</p>
                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#fff" }}>{formatDateString(ticket.salesStart)}</p>
                          </div>
                        )}
                        {ticket.salesEnd && (
                          <div>
                            <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "4px" }}>{t("salesEndDateLabel")}</p>
                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#fff" }}>{formatDateString(ticket.salesEnd)}</p>
                          </div>
                        )}
                      </div>
                      {ticket.ticketShortDesc && (
                        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                          <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "4px" }}>{t("shortDescription")}</p>
                          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{ticket.ticketShortDesc}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Refund Policy Strip */}
              <div style={{
                marginTop: "14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "10px",
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.6px", whiteSpace: "nowrap" }}>{t("refundPolicy")}</span>
                <span style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.15)" }}></span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>
                  {eventData.refundPolicy === "No Refund"
                    ? t("noRefund")
                    : eventData.refundPolicy === "1 Day Before"
                      ? t("oneDayBefore")
                      : eventData.refundPolicy === "7 Days Before"
                        ? t("sevenDaysBefore")
                        : eventData.refundPolicy}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="additional-info common-dtl-list mt-20">
          <h4 className="line-title">
            <span>{t("additionalSettings") || "Settings & Restrictions"}</span>
          </h4>
          <ul className="event-dtl-rgt">
            <li>
              <h6>{t("visibilityLabel")}</h6>
              <p>{eventData.visibility === "PUBLIC" ? (t("publicLabel") || "Public") : (t("privateLabel") || "Private")}</p>
            </li>
            <li>
              <h6>{t("ageRestrictionLabel")}</h6>
              <p>
                {activeAge === "ALL"
                  ? (t("allAges") || "All Ages")
                  : activeAge}
              </p>
            </li>
            <li>
              <h6>{t("showAttendeesLabel")}</h6>
              <p>{eventData.showAttendees !== false ? (t("yes") || "Yes") : (t("no") || "No")}</p>
            </li>
          </ul>
          <div className="mt-4">
            <div style={{ marginBottom: "20px" }}>
              <h6 style={{ color: "var(--white)", fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>{t("entryNotesLabel")}</h6>
              <p style={{ color: "#737373", fontSize: "16px", fontWeight: 510, wordBreak: "break-all", whiteSpace: "pre-line", margin: 0 }}>{eventData.notes || "N/A"}</p>
            </div>
            <div>
              <h6 style={{ color: "var(--white)", fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>{t("dressCodeLabel")}</h6>
              <p style={{ color: "#737373", fontSize: "16px", fontWeight: 510, wordBreak: "break-all", whiteSpace: "pre-line", margin: 0 }}>{eventData.dressCode || "N/A"}</p>
            </div>
          </div>
        </div>
        <div className="short-desc">
          <h4 className="line-title">
            <span>{t("shortDescription")}</span>
          </h4>
          <p style={{ wordBreak: "break-word" }}>
            {eventData.shortdesc}
          </p>
        </div>
        <div className="long-desc mt-20">
          <h4 className="line-title">
            <span>{t("detailedDescriptionLabel")}</span>
          </h4>

          <p style={{ wordBreak: "break-word", margin: 0 }}>
            {eventData.longdesc && eventData.longdesc.length > 200
              ? (isExpanded ? eventData.longdesc : `${eventData.longdesc.slice(0, 200)}...`)
              : eventData.longdesc}
          </p>
          {eventData.longdesc && eventData.longdesc.length > 200 && (
            <span
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ color: "#23ada4", cursor: "pointer", fontWeight: "600", marginTop: "8px", display: "inline-block" }}
            >
              {isExpanded ? t("viewLess") || "View Less" : t("viewMore") || "View More"}
            </span>
          )}
        </div>
        {eventData.shortTeaserVideo && eventData.shortTeaserVideo.length > 0 && (
          <div className="video-section mt-20">
            <h4 className="line-title">
              <span>{t("teaserVideo")}</span>
            </h4>
            <video
              src={getFullImageUrl(eventData.shortTeaserVideo[0])}
              controls
              controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
              style={{ borderRadius: "12px", width: "100%", maxWidth: "320px", height: "auto" }}
            />
            <style dangerouslySetInnerHTML={{
              __html: `
              video::-webkit-media-controls-volume-control-container { display: none !important; }
              video::-webkit-media-controls-timeline { display: none !important; }
              video::-webkit-media-controls-current-time-display { display: none !important; }
              video::-webkit-media-controls-time-remaining-display { display: none !important; }
              video::-webkit-media-controls-mute-button { display: none !important; }
            `}} />
          </div>
        )}
        <div className="gellry-images">
          <h4 className="line-title">
            <span>{t("gallery")}</span>
          </h4>
          <div className="gallery-grid">
            {eventData.mediaLinks?.map((link, index) => (
              <div className={`gallery-item ${index === 0 ? "large" : ""}`} key={index}>
                <img src={getFullImageUrl(link)} alt={`Gallery ${index}`} onError={(e) => { e.target.src = "/img/sidebar-logo.svg" }} />
              </div>
            ))}
          </div>
        </div>
        <div className="d-flex gap-2 justify-content-end mt-5">
          <Link href="/Agerestraction" className="outline-btn">
            {t("back")}
          </Link>
          {!(eventData._id && eventData.isDraft === false) && (
            <button
              type="button"
              className="outline-btn"
              onClick={() => handlePublish(true)}
              disabled={publishing}
            >
              {publishing ? t("saving") || "Saving..." : t("saveDraft") || "Save Draft"}
            </button>
          )}
          <button
            type="button"
            className="custom-btn publish-btn"
            onClick={() => handlePublish(false)}
            disabled={publishing}
          >
            {publishing
              ? (eventData._id && eventData.isDraft === false ? t("saving") || "Saving..." : t("publishing"))
              : (eventData._id && eventData.isDraft === false ? t("saveChanges") || "Save Changes" : t("publish"))}
          </button>
        </div>
      </div>
    </div>
  );
}

export default page;
