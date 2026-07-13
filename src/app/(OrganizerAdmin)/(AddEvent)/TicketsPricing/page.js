"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { useEventContext } from "@/context/EventContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import eventApi from "@/api/eventApi";

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: "pointer", color: "#23ada4" }}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

function page() {
  const { t } = useLanguage();
  const { eventData, updateEventData } = useEventContext();
  const router = useRouter();
  const [refundPolicies, setRefundPolicies] = useState([]);

  // Get active tickets list or initialize with one empty ticket
  const ticketsList = eventData.tickets && Array.isArray(eventData.tickets) && eventData.tickets.length > 0
    ? eventData.tickets
    : [{ ticketName: "", ticketShortDesc: "", price: "", qty: "", salesStart: "", salesEnd: "" }];

  const [isFreeEvent, setIsFreeEvent] = useState(() => {
    if (eventData.tickets && Array.isArray(eventData.tickets)) {
      if (eventData.tickets.length === 0) return true;
      if (eventData.tickets.length === 1 && Number(eventData.tickets[0].price) === 0) return true;
    }
    return false;
  });

  const handleFreeEventToggle = (checked) => {
    setIsFreeEvent(checked);
    if (checked) {
      updateTickets([]);
      updateEventData({ refundPolicy: "" });
    } else {
      updateTickets([{ ticketName: "", ticketShortDesc: "", price: "", qty: "", salesStart: "", salesEnd: "" }]);
    }
  };

  const updateTickets = (updatedTickets) => {
    // Keep flat fields in sync with the first ticket for backward compatibility
    const firstTicket = updatedTickets[0] || {};
    updateEventData({
      tickets: updatedTickets,
      ticketName: firstTicket.ticketName || "",
      ticketQtyAvailable: firstTicket.qty || "",
      ticketPrice: firstTicket.price || "",
      ticketSelesStartDate: firstTicket.salesStart || "",
      ticketSelesEndDate: firstTicket.salesEnd || "",
    });
  };

  const handleTicketChange = (index, field, value) => {
    const updated = ticketsList.map((ticket, i) => {
      if (i === index) {
        let val = value;
        if (field === "qty") {
          val = value === "" ? "" : parseInt(value) || 0;
        } else if (field === "price") {
          val = value === "" ? "" : parseFloat(value) || 0;
        }
        return { ...ticket, [field]: val };
      }
      return ticket;
    });
    updateTickets(updated);
  };

  const addTicketType = () => {
    const updated = [
      ...ticketsList,
      { ticketName: "", ticketShortDesc: "", price: "", qty: "", salesStart: "", salesEnd: "" }
    ];
    updateTickets(updated);
  };

  const removeTicketType = (index) => {
    if (ticketsList.length <= 1) return;
    const updated = ticketsList.filter((_, i) => i !== index);
    updateTickets(updated);
  };

  const handleRefundPolicyChange = (e) => {
    updateEventData({ refundPolicy: e.target.value });
  };

  const today = new Date().toISOString().split("T")[0];

  const validateTickets = (isDraftMode = false) => {
    if (isDraftMode) return true; // Drafts skip validation
    if (isFreeEvent) return true; // Free events skip validation

    // Validation for non-drafts
    for (let i = 0; i < ticketsList.length; i++) {
      const tck = ticketsList[i];

      if (!tck.ticketName || tck.ticketName.trim() === "") {
        toast.error(t("ticketNameRequired") || "Ticket name is required");
        return false;
      }

      if (tck.qty === undefined || tck.qty === null || tck.qty === "" || tck.qty <= 0) {
        toast.error(t("quantityMustBeGreaterThanZero") || "Quantity must be greater than zero");
        return false;
      }

      if (tck.price === undefined || tck.price === null || tck.price === "" || tck.price < 0) {
        toast.error(t("ticketPriceRequired") || "Ticket price is required");
        return false;
      }

      if (!tck.salesStart) {
        toast.error(t("salesStartDateRequired") || "Sales start date is required");
        return false;
      }

      if (!tck.salesEnd) {
        toast.error(t("salesEndDateRequired") || "Sales end date is required");
        return false;
      }

      if (tck.salesEnd < tck.salesStart) {
        toast.error(t("ticketSalesEndDateMustBeAfterStart") || "Sales end date must be after start date");
        return false;
      }

      // Validate against event dates
      if (eventData.startDate) {
        const eventStartOnlyDate = formatDateVal(eventData.startDate);
        const ticketStartOnlyDate = formatDateVal(tck.salesStart);

        if (ticketStartOnlyDate > eventStartOnlyDate) {
          toast.error(t("salesStartDateMustBeBeforeEventStart") || "Ticket sales start date must be on or before the event start date");
          return false;
        }
      }

      if (eventData.endDate) {
        const eventEndOnlyDate = formatDateVal(eventData.endDate);
        const ticketEndOnlyDate = formatDateVal(tck.salesEnd);

        if (ticketEndOnlyDate > eventEndOnlyDate) {
          toast.error(t("salesEndDateMustBeBeforeEventEnd") || "Ticket sales end date must be on or before the event end date");
          return false;
        }
      }
    }

    if (!eventData.refundPolicy || eventData.refundPolicy.trim() === "") {
      toast.error(t("refundPolicyRequired") || "Refund Policy is required");
      return false;
    }

    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!validateTickets(false)) return;
    if (isFreeEvent) {
      updateEventData({
        tickets: [],
        refundPolicy: "",
      });
    }
    router.push("/Agerestraction");
  };

  const handleSaveDraft = async () => {
    try {
      const isPublishedEdit = eventData._id && eventData.isDraft === false;
      const payload = {
        ...eventData,
        tickets: isFreeEvent ? [] : ticketsList,
        refundPolicy: isFreeEvent ? "" : (eventData.refundPolicy || ""),
        isDraft: !isPublishedEdit
      };
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
    document.title = t("ticketsPricingPageTitle");
    const fetchPolicies = async () => {
      try {
        const response = await eventApi.getRefundPolicies();
        if (response && response.status && Array.isArray(response.data)) {
          setRefundPolicies(response.data);
        }
      } catch (error) {
        console.error("Failed to load refund policies from API, using default list:", error);
      }
    };
    fetchPolicies();
  }, []);

  const handleStepClick = (e, targetPath) => {
    const isBasicInfoValid = () => {
      return (
        eventData.eventTitle &&
        eventData.eventTitle.length >= 5 &&
        eventData.eventCategory &&
        eventData.posterImage &&
        eventData.posterImage.length > 0 &&
        eventData.shortdesc &&
        eventData.shortdesc.trim() !== "" &&
        eventData.shortdesc.length >= 10 &&
        eventData.longdesc &&
        eventData.longdesc.trim() !== "" &&
        eventData.longdesc.length >= 50
      );
    };

    const isDateTimeValid = () => {
      if (!isBasicInfoValid()) return false;
      return (
        eventData.startDate &&
        eventData.endDate &&
        eventData.startTime &&
        eventData.endTime &&
        eventData.venueName &&
        eventData.venueAddress &&
        eventData.venueAddress.address &&
        eventData.venueAddress.latitude &&
        eventData.venueAddress.longitude
      );
    };

    const isTicketsPricingValid = () => {
      if (!isDateTimeValid()) return false;
      const tickets = eventData.tickets || [];
      if (tickets.length === 0) {
        return (
          eventData.ticketName &&
          eventData.ticketQtyAvailable > 0 &&
          eventData.refundPolicy
        );
      }
      return tickets.every(tck => tck.ticketName && tck.qty > 0 && tck.salesStart && tck.salesEnd);
    };

    if (targetPath === "/DateTime" && !isBasicInfoValid()) {
      e.preventDefault();
      toast.error(t("pleaseCompleteBasicInfoFirst") || "Please complete the Basic Info step first");
    } else if (targetPath === "/TicketsPricing" && !isDateTimeValid()) {
      e.preventDefault();
      toast.error(t("pleaseCompleteDateTimeFirst") || "Please complete the Date & Time step first");
    } else if (targetPath === "/Agerestraction" && !isTicketsPricingValid()) {
      e.preventDefault();
      toast.error(t("pleaseCompleteTicketsPricingFirst") || "Please complete the Tickets & Pricing step first");
    }
  };

  const formatDateVal = (dateVal) => {
    if (!dateVal) return "";
    if (dateVal.includes("T")) {
      return dateVal.split("T")[0];
    }
    return dateVal;
  };

  return (
    <div>
      <Row className="justify-content-center">
        <Col lg={10} md={12} xs={12}>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-4">
            <h2 className="text-white mb-0">{t("createEvent")}</h2>
            <button
              type="button"
              className="outline-btn"
              onClick={handleSaveDraft}
              style={{ padding: "8px 24px", borderRadius: "20px" }}>
              {eventData._id && eventData.isDraft === false
                ? t("saveChanges") || "Save Changes"
                : t("saveDraft") || "Save Draft"}
            </button>
          </div>
          <ul className="event-steps">
            <li className="steps-item">
              <Link href="/BasicInfo" className="steps-link active" onClick={(e) => handleStepClick(e, "/BasicInfo")}>
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
              <Link href="/DateTime" className="steps-link active" onClick={(e) => handleStepClick(e, "/DateTime")}>
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
              <Link href="/TicketsPricing" className="steps-link active" onClick={(e) => handleStepClick(e, "/TicketsPricing")}>
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
              <Link href="/Agerestraction" className="steps-link" onClick={(e) => handleStepClick(e, "/Agerestraction")}>
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-04.svg" className="me-2" />
                  {t("ageRestrictionStep")}
                </span>
              </Link>
            </li>
          </ul>
          <Form onSubmit={handleNext}>
            <div className="event-form-card">
              {/* Free Event Toggle */}
              <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-secondary">
                <div>
                  <h5 className="text-white mb-1">{t("freeEvent") || "Free Event"}</h5>
                  {/* <p className="text-secondary small mb-0">
                    {t("freeEventDesc") || "Enable this option if entry to this event is completely free"}
                  </p> */}
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="free-event-switch"
                    checked={isFreeEvent}
                    onChange={(e) => handleFreeEventToggle(e.target.checked)}
                    style={{ width: "3.2em", height: "1.6em", cursor: "pointer" }}
                  />
                </div>
              </div>

              {!isFreeEvent ? (
                <>
                  {ticketsList.map((ticket, index) => (
                    <div
                      key={index}
                      className="mb-4 pb-4 border-bottom border-secondary">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="text-white" style={{ color: "#23ada4" }}>
                          {t("ticket") || "Ticket"} {index + 1}
                        </h5>
                        {ticketsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTicketType(index)}
                            className="btn p-0 border-0 bg-transparent">
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                      <Row>
                        <Col md={12} className="mb-3">
                          <div className="event-frm-bx">
                            <label className="form-label">
                              {t("ticketNameLabel")}{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={ticket.ticketName || ""}
                              onChange={(e) =>
                                handleTicketChange(
                                  index,
                                  "ticketName",
                                  e.target.value,
                                )
                              }
                              placeholder={t("ticketNamePlaceholder")}
                              maxLength={25}
                            />
                            <div className="text-end mt-1">
                              <small className="text-white">
                                {(ticket.ticketName?.length || 0)}/25
                              </small>
                            </div>
                          </div>
                        </Col>
                        <Col md={12} className="mb-3">
                          <div className="event-frm-bx">
                            <label className="form-label">
                              {t("shortDescriptionOptional") ||
                                "Short Description (Optional)"}
                            </label>
                            <textarea
                              className="form-control square-textarea"
                              rows={4}
                              style={{ height: "auto", borderRadius: "6px" }}
                              value={ticket.ticketShortDesc || ""}
                              onChange={(e) =>
                                handleTicketChange(
                                  index,
                                  "ticketShortDesc",
                                  e.target.value,
                                )
                              }
                              placeholder={
                                t("ticketShortDescPlaceholder") ||
                                "Enter short description"
                              }
                              maxLength={200}
                            />
                            <div className="text-end mt-1">
                              <small className="text-white">
                                {(ticket.ticketShortDesc?.length || 0)}/200
                              </small>
                            </div>
                          </div>
                        </Col>
                        <Col md={6} className="mb-3">
                          <div className="event-frm-bx">
                            <label className="form-label">
                              {t("pricePerTicketLabel")}{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <div className="price-input-wrapper position-relative">
                              <span
                                className="price-symbol position-absolute"
                                style={{
                                  left: "12px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  color: "#23ada4",
                                  fontWeight: "bold",
                                }}>
                                ₮
                              </span>
                              <input
                                type="number"
                                className="form-control px-cms-30"
                                value={ticket.price === "" ? "" : ticket.price}
                                placeholder="0"
                                onChange={(e) =>
                                  handleTicketChange(index, "price", e.target.value)
                                }
                                min={0}
                              />
                            </div>
                          </div>
                        </Col>
                        <Col md={6} className="mb-3">
                          <div className="event-frm-bx">
                            <label className="form-label">
                              {t("quantityAvailableLabel")}{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              value={ticket.qty === "" ? "" : ticket.qty}
                              placeholder="1"
                              onChange={(e) =>
                                handleTicketChange(index, "qty", e.target.value)
                              }
                              min={1}
                            />
                          </div>
                        </Col>
                        <Col md={6} className="mb-3">
                          <div className="event-frm-bx">
                            <label className="form-label">
                              {t("salesStartDateLabel")}{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <div className="date-input-wrapper">
                              <input
                                type="date"
                                className="date-input form-control"
                                value={formatDateVal(ticket.salesStart)}
                                onChange={(e) =>
                                  handleTicketChange(
                                    index,
                                    "salesStart",
                                    e.target.value,
                                  )
                                }
                                min={eventData._id ? undefined : today}
                                max={formatDateVal(eventData.endDate)}
                              />
                              <span
                                className="calendar-icon"
                                onClick={(e) => {
                                  e.currentTarget.previousSibling?.showPicker();
                                }}>
                                <img src="/img/white-calendar.svg" alt="calendar" />
                              </span>
                            </div>
                          </div>
                        </Col>
                        <Col md={6} className="mb-3">
                          <div className="event-frm-bx">
                            <label className="form-label">
                              {t("salesEndDateLabel")}{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <div className="date-input-wrapper">
                              <input
                                type="date"
                                className="date-input form-control"
                                value={formatDateVal(ticket.salesEnd)}
                                onChange={(e) =>
                                  handleTicketChange(
                                    index,
                                    "salesEnd",
                                    e.target.value,
                                  )
                                }
                                min={eventData._id ? undefined : (formatDateVal(ticket.salesStart) || today)}
                                max={formatDateVal(eventData.endDate)}
                              />
                              <span
                                className="calendar-icon"
                                onClick={(e) => {
                                  e.currentTarget.previousSibling?.showPicker();
                                }}>
                                <img src="/img/white-calendar.svg" alt="calendar" />
                              </span>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ))}

                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={addTicketType}
                      className="outline-btn w-100"
                      style={{ borderRadius: "8px", borderStyle: "dashed" }}>
                      + {t("addAnotherTicketType") || "Add Another Ticket Type"}
                    </button>
                  </div>

                  <Row className="mb-3">
                    <Col md={12}>
                      <div className="event-frm-bx">
                        <label className="form-label">
                          {t("refundPolicyLabel")}{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          name="refundPolicy"
                          value={eventData.refundPolicy || ""}
                          onChange={handleRefundPolicyChange}
                          style={{
                            backgroundColor: "#1a1a1a",
                            color: "white",
                            border: "1px solid rgba(35, 173, 164, 0.3)",
                            height: "45px",
                          }}>
                          <option value="">
                            {t("selectRefundPolicy") || "Select Refund Policy"}
                          </option>
                          {refundPolicies.map((policy) => {
                            const translationKey =
                              policy === "No Refund"
                                ? "noRefund"
                                : policy === "1 Day Before"
                                  ? "oneDayBefore"
                                  : policy === "7 Days Before"
                                    ? "sevenDaysBefore"
                                    : "";
                            return (
                              <option key={policy} value={policy}>
                                {translationKey
                                  ? t(translationKey) || policy
                                  : policy}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </Col>
                  </Row>
                </>
              ) : (
                <div className="text-center py-4 text-secondary">
                  {t("freeEventEnabledMessage") || t("This event is free of charge. No tickets or refund policy required.")}
                </div>
              )}

               <div className="d-flex gap-2 justify-content-end mt-4 flex-wrap">
                <Link href="/DateTime" className="outline-btn">
                  {t("back")}
                </Link>
                <button type="submit" className="custom-btn">
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
