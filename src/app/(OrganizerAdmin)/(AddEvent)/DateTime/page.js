"use client";
import Link from "next/link";
import React, { useRef, useEffect } from "react";
import { Col, Form, Row } from "react-bootstrap";
import LocationMap from "../../Components/LocationMap"; // Assuming this component exists
import VenueAutocomplete from "../../Components/VenueAutocomplete";
import { useEventContext } from "@/context/EventContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import eventApi from "@/api/eventApi";

function page() {
  const { t } = useLanguage();
  const { eventData, updateEventData } = useEventContext();
  const inputRef = useRef(null);
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Handle nested venueAddress separately or flattened inputs
    if (
      name === "venueName" ||
      name === "startDate" ||
      name === "endDate" ||
      name === "startTime" ||
      name === "endTime"
    ) {
      updateEventData({ [name]: value });
    } else if (name === "address" || name === "city" || name === "country") {
      updateEventData({
        venueAddress: {
          ...eventData.venueAddress,
          [name]: value,
        },
      });
    }
  };

  const handleVenueSelected = (venueAddressData) => {
    updateEventData({
      venueAddress: venueAddressData,
    });
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextDay = tomorrow.toISOString().split("T")[0];

  const handleNext = (e) => {
    e.preventDefault();

    if (!eventData.startDate || !eventData.endDate || !eventData.startTime || !eventData.endTime || !eventData.venueName) {
      toast.error(t("pleaseFillRequiredFields"));
      return;
    }

    if (!eventData.venueAddress || !eventData.venueAddress.address || !eventData.venueAddress.latitude || !eventData.venueAddress.longitude) {
      toast.error(t("venueAddressRequired") || "Venue address with valid coordinates is required");
      return;
    }

    if (eventData.venueName.length > 100) {
      toast.error(t("venueNameTooLong"));
      return;
    }

    // Check same-day timing order
    if (eventData.startDate === eventData.endDate) {
      const [startHour, startMin] = eventData.startTime.split(":").map(Number);
      const [endHour, endMin] = eventData.endTime.split(":").map(Number);
      const startVal = startHour * 60 + startMin;
      const endVal = endHour * 60 + endMin;
      if (endVal <= startVal) {
        toast.error(t("endTimeMustBeAfterStartTime") || "End time must be after start time on the same day");
        return;
      }
    }

    // Combine date and time for validation
    const startDateTime = new Date(
      `${eventData.startDate}T${eventData.startTime}`,
    );
    const endDateTime = new Date(
      `${eventData.endDate}T${eventData.endTime}`,
    );
    const now = new Date();

    // Validate Start Date is in the future only for new events or drafts
    const isNewOrDraft = !eventData._id || eventData.isDraft;
    if (isNewOrDraft && startDateTime < now) {
      toast.error(t("startDateMustBeInFuture"));
      return;
    }

    // Validate End Date is after Start Date
    if (endDateTime <= startDateTime) {
      toast.error(t("endDateMustBeAfterStart"));
      return;
    }

    router.push("/TicketsPricing");
  };

  useEffect(() => { document.title = t("dateTimePageTitle"); }, []);


  return (
    <div>
      <Row className="justify-content-center">
        <Col lg={10} md={12} xs={12}>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
            <h2 className="text-white mb-0">{t("createEvent")}</h2>
            <button
              type="button"
              className="outline-btn"
              onClick={async () => {
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
              }}
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
              <Link href="/TicketsPricing" className="steps-link">
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
              <Link href="/Agerestraction" className="steps-link">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-04.svg" className="me-2" />
                  {t("ageRestrictionStep")}
                </span>
              </Link>
            </li>
          </ul>
          <Form className="row">
            <div className="event-form-card">
              <Row>
                {/* Start Date & Start Time */}
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">
                      {t("startDate")} <span className="text-danger">*</span>
                    </label>
                    <div className="date-input-wrapper">
                      <input
                        type="date"
                        className="date-input form-control"
                        name="startDate"
                        value={eventData.startDate}
                        onChange={handleInputChange}
                        min={nextDay}
                      />
                      <span className="calendar-icon" onClick={(e) => e.currentTarget.previousSibling?.showPicker()}>
                        <img src="/img/white-calendar.svg" alt="calendar" />
                      </span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">{t("startTime")} <span className="text-danger">*</span></label>
                    <div className="date-input-wrapper">
                      <input
                        type="time"
                        className="date-input form-control"
                        name="startTime"
                        value={eventData.startTime}
                        onChange={handleInputChange}
                      />
                      <span className="calendar-icon" onClick={(e) => e.currentTarget.previousSibling?.showPicker()}>
                        <img src="/img/org-img/clock.svg" alt="clock" />
                      </span>
                    </div>
                  </div>
                </Col>

                {/* End Date & End Time */}
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">
                      {t("endDate")} <span className="text-danger">*</span>
                    </label>
                    <div className="date-input-wrapper">
                      <input
                        type="date"
                        className="date-input form-control"
                        name="endDate"
                        value={eventData.endDate}
                        onChange={handleInputChange}
                        min={eventData.startDate || nextDay}
                      />
                      <span className="calendar-icon" onClick={(e) => e.currentTarget.previousSibling?.showPicker()}>
                        <img src="/img/white-calendar.svg" alt="calendar" />
                      </span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">{t("endTime")} <span className="text-danger">*</span></label>
                    <div className="date-input-wrapper">
                      <input
                        type="time"
                        className="date-input form-control"
                        name="endTime"
                        value={eventData.endTime}
                        onChange={handleInputChange}
                      />
                      <span className="calendar-icon" onClick={(e) => e.currentTarget.previousSibling?.showPicker()}>
                        <img src="/img/org-img/clock.svg" alt="clock" />
                      </span>
                    </div>
                  </div>
                </Col>

                {/* Venue Name */}
                <Col md={12}>
                  <div className="event-frm-bx mt-3">
                    <label className="form-label">
                      {t("venueName")} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="venueName"
                      value={eventData.venueName}
                      onChange={handleInputChange}
                      placeholder={t("venueNamePlaceholder")}
                      maxLength={100}
                    />
                    <div className="text-end">
                      <small className="text-secondary">
                        {eventData.venueName?.length || 0}/100
                      </small>
                    </div>
                  </div>
                </Col>

                {/* Address (VenueAutocomplete) */}
                <Col md={12}>
                  <div className="event-frm-bx">
                    <label className="form-label">{t("venueAddressLabel")} <span className="text-danger">*</span></label>
                    <VenueAutocomplete
                      defaultValue={eventData.venueAddress && eventData.venueAddress.address}
                      placeholder={t("searchVenuePlaceholder")}
                      onPlaceSelected={handleVenueSelected}
                    />
                  </div>
                </Col>

                {/* Hidden/readOnly location info (keeping state structure, but hiding or keeping secondary) */}
                <Col md={6} style={{ display: "none" }}>
                  <div className="event-frm-bx">
                    <label className="form-label">{t("cityLabel")}</label>
                    <input
                      type="text"
                      className="form-control"
                      name="city"
                      value={eventData.venueAddress && eventData.venueAddress.city}
                      onChange={handleInputChange}
                      placeholder={t("cityPlaceholder")}
                      readOnly
                    />
                  </div>
                </Col>
                <Col md={6} style={{ display: "none" }}>
                  <div className="event-frm-bx">
                    <label className="form-label">{t("countryLabel")}</label>
                    <input
                      type="text"
                      className="form-control"
                      name="country"
                      value={eventData.venueAddress && eventData.venueAddress.country}
                      onChange={handleInputChange}
                      placeholder={t("countryPlaceholder")}
                      readOnly
                    />
                  </div>
                </Col>

                {/* Location Map */}
                <Col md={12} className="mt-3">
                  <LocationMap />
                </Col>
              </Row>

              <div className="d-flex gap-2 justify-content-end mt-4">
                <Link href="/BasicInfo" className="outline-btn">
                  {t("back")}
                </Link>

                <button
                  type="button"
                  onClick={handleNext}
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
