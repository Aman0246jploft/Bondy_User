"use client";
import Link from "next/link";
import React, { useEffect } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { useEventContext } from "@/context/EventContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import eventApi from "@/api/eventApi";

function page() {
  const { t } = useLanguage();
  const { eventData, updateEventData } = useEventContext();
  const router = useRouter();

  // Normalize visibility
  const visibility = eventData.visibility || "PUBLIC";

  // Normalize age restriction
  const getAgeString = () => {
    if (typeof eventData.ageRestriction === "string") {
      return eventData.ageRestriction;
    }
    // Handle legacy object if present
    const minAge = eventData.ageRestriction?.minAge;
    if (minAge === 18) return "18+";
    if (minAge === 21) return "21+";
    return "ALL";
  };

  const activeAge = getAgeString();

  const handleVisibilityChange = (value) => {
    updateEventData({ visibility: value });
  };

  const handleAgeChange = (value) => {
    updateEventData({ ageRestriction: value });
  };

  const handleToggleChange = (e) => {
    const { name, checked } = e.target;
    updateEventData({ [name]: checked });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateEventData({ [name]: value });
  };

  const handleNext = (e) => {
    e.preventDefault();
    router.push("/EventPreview");
  };

  const handleSaveDraft = async () => {
    try {
      const isPublishedEdit = eventData._id && eventData.isDraft === false;
      const payload = { ...eventData, isDraft: !isPublishedEdit };
      // Clean the payload
      if (payload.eventCategory && typeof payload.eventCategory === 'object') {
        payload.eventCategory = payload.eventCategory._id;
      }
      if (payload.createdBy && typeof payload.createdBy === 'object') {
        payload.createdBy = payload.createdBy._id;
      }
      const fieldsToRemove = ['duration', 'status', 'totalAttendees', 'isBooked', 'totalRevenue', 'createdAt', 'updatedAt', '__v'];
      fieldsToRemove.forEach(field => delete payload[field]);

      const isEditMode = !!eventData._id;
      let response;
      if (isEditMode) {
        const { _id, fetcherEvent, featureEventFee, createdBy, ...updatePayload } = payload;
        response = await eventApi.updateEvent(_id, updatePayload);
      } else {
        response = await eventApi.createEvent(payload);
      }
      if (response.status) {
        toast.success(isPublishedEdit ? (t("profileUpdatedSuccessfully") || "Changes saved successfully") : (t("draftSavedSuccessfully") || "Draft saved successfully"));
        router.push("/EventsManagement");
      }
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(error.response?.data?.message || "Failed to save event");
    }
  };

  useEffect(() => {
    document.title = t("ageRestrictionPageTitle") || "Settings";
  }, []);

  return (
    <div>
      <Row className="justify-content-center">
        <Col lg={10} md={12} xs={12}>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
            <h2 className="text-white mb-0">{t("createEvent")}</h2>
            <button
              type="button"
              className="outline-btn"
              onClick={handleSaveDraft}
              style={{ padding: "8px 24px", borderRadius: "20px" }}
            >
              {eventData._id && eventData.isDraft === false ? (t("saveChanges") || "Save Changes") : (t("saveDraft") || "Save Draft")}
            </button>
          </div>
          <ul className="event-steps">
            <li className="steps-item">
              <Link href="/BasicInfo" className="steps-link active">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-01.svg" className="me-2" />
                  {t("eventBasicInfoStep")}
                </span>
                <span className="steps-arrow">
                  <img src="/img/Arrow-Right.svg" className="ms-3" />
                </span>
              </Link>
            </li>
            <li className="steps-item">
              <Link href="/DateTime" className="steps-link active">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-02.svg" className="me-2" />
                  {t("dateTimeStep")}
                </span>
                <span className="steps-arrow">
                  <img src="/img/Arrow-Right.svg" className="ms-3" />
                </span>
              </Link>
            </li>
            <li className="steps-item">
              <Link href="/TicketsPricing" className="steps-link active">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-03.svg" className="me-2" />
                  {t("ticketsPricingStep")}
                </span>
                <span className="steps-arrow">
                  <img src="/img/Arrow-Right.svg" className="ms-3" />
                </span>
              </Link>
            </li>
            <li className="steps-item">
              <Link href="/Agerestraction" className="steps-link active">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-04.svg" className="me-2" />
                  {t("ageRestrictionStep")}
                </span>
              </Link>
            </li>
          </ul>
          <Form onSubmit={handleNext}>
            <div className="event-form-card">
              <Row>
                {/* Visibility */}
                <Col md={12} className="mb-4">
                  <div className="event-frm-bx">
                    <label className="form-label">{t("visibilityLabel") || "Visibility"}</label>
                    <div className="d-flex gap-3">
                      <button
                        type="button"
                        className={`flex-grow-1 py-3 custom-btn ${visibility === "PUBLIC" ? "" : "outline-btn"}`}
                        onClick={() => handleVisibilityChange("PUBLIC")}
                      >
                        {t("publicLabel") || "Public"}
                      </button>
                      <button
                        type="button"
                        className={`flex-grow-1 py-3 custom-btn ${visibility === "PRIVATE" ? "" : "outline-btn"}`}
                        onClick={() => handleVisibilityChange("PRIVATE")}
                      >
                        {t("privateLabel") || "Private"}
                      </button>
                    </div>
                  </div>
                </Col>

                {/* Age Restriction */}
                <Col md={12} className="mb-4">
                  <div className="event-frm-bx">
                    <label className="form-label">{t("ageRestrictionLabel") || "Age Restriction"}</label>
                    <div className="d-flex gap-3">
                      <button
                        type="button"
                        className={`flex-grow-1 py-3 custom-btn ${activeAge === "ALL" ? "" : "outline-btn"}`}
                        onClick={() => handleAgeChange("ALL")}
                      >
                        {t("allAges") || "All Ages"}
                      </button>
                      <button
                        type="button"
                        className={`flex-grow-1 py-3 custom-btn ${activeAge === "18+" ? "" : "outline-btn"}`}
                        onClick={() => handleAgeChange("18+")}
                      >
                        18+
                      </button>
                      <button
                        type="button"
                        className={`flex-grow-1 py-3 custom-btn ${activeAge === "21+" ? "" : "outline-btn"}`}
                        onClick={() => handleAgeChange("21+")}
                      >
                        21+
                      </button>
                    </div>
                  </div>
                </Col>

                {/* Show Attendees Toggle */}
                <Col md={12} className="mb-4">
                  <div className="event-frm-bx d-flex justify-content-between align-items-center p-3" style={{ background: "#1a1a1a", borderRadius: "12px" }}>
                    <div>
                      <label className="form-label mb-0" style={{ fontSize: "16px", fontWeight: "600" }}>
                        {t("showAttendeesLabel") || "Show attendees"}
                      </label>
                      <p className="text-secondary small mb-0 mt-1">
                        {t("showAttendeesDesc") || "Let users see who's going"}
                      </p>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="showAttendees"
                        checked={eventData.showAttendees !== false}
                        onChange={handleToggleChange}
                        style={{ width: "3.2em", height: "1.6em", cursor: "pointer" }}
                      />
                    </div>
                  </div>
                </Col>

                {/* Entry Notes (Optional) */}
                <Col md={12} className="mb-4">
                  <div className="event-frm-bx p-3" style={{ background: "#1a1a1a", borderRadius: "12px" }}>
                    <label className="form-label" style={{ fontSize: "16px", fontWeight: "600" }}>
                      {t("entryNotesLabel") || "Entry Notes (Optional)"}
                    </label>
                    <textarea
                      className="form-control mt-2"
                      name="notes"
                      value={eventData.notes || ""}
                      onChange={handleInputChange}
                      placeholder={t("entryNotesPlaceholder") || "Add any rules or information attendees should know..."}
                      rows={3}
                      style={{ background: "#242424", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                    />
                  </div>
                </Col>

                {/* Dress Code (Optional) */}
                <Col md={12} className="mb-4">
                  <div className="event-frm-bx p-3" style={{ background: "#1a1a1a", borderRadius: "12px" }}>
                    <label className="form-label" style={{ fontSize: "16px", fontWeight: "600" }}>
                      {t("dressCodeLabel") || "Dress Code (Optional)"}
                    </label>
                    <textarea
                      className="form-control mt-2"
                      name="dressCode"
                      value={eventData.dressCode || ""}
                      onChange={handleInputChange}
                      placeholder={t("dressCodePlaceholder") || "Let attendees know what to wear..."}
                      rows={3}
                      style={{ background: "#242424", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                    />
                  </div>
                </Col>
              </Row>

              <div className="d-flex gap-2 justify-content-end mt-4">
                <Link href="/TicketsPricing" className="outline-btn">
                  {t("back")}
                </Link>
                <button
                  type="submit"
                  className="custom-btn">
                  {t("saveAndContinue")}
                </button>
              </div>
            </div>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default page;
