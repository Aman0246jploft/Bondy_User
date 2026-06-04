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

    // Validation for non-drafts
    for (let i = 0; i < ticketsList.length; i++) {
      const tck = ticketsList[i];
      const tPrefix = `[Ticket ${i + 1}] `;

      if (!tck.ticketName || tck.ticketName.trim() === "") {
        toast.error(`${tPrefix}${t("ticketNameRequired") || "Ticket name is required"}`);
        return false;
      }

      if (tck.qty === undefined || tck.qty === null || tck.qty === "" || tck.qty <= 0) {
        toast.error(`${tPrefix}${t("quantityMustBeGreaterThanZero") || "Quantity must be greater than zero"}`);
        return false;
      }

      if (tck.price === undefined || tck.price === null || tck.price === "" || tck.price < 0) {
        toast.error(`${tPrefix}${t("ticketPriceRequired") || "Ticket price is required"}`);
        return false;
      }

      if (!tck.salesStart) {
        toast.error(`${tPrefix}${t("salesStartDateRequired") || "Sales start date is required"}`);
        return false;
      }

      if (!tck.salesEnd) {
        toast.error(`${tPrefix}${t("salesEndDateRequired") || "Sales end date is required"}`);
        return false;
      }

      if (tck.salesEnd < tck.salesStart) {
        toast.error(`${tPrefix}${t("ticketSalesEndDateMustBeAfterStart") || "Sales end date must be after start date"}`);
        return false;
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
    router.push("/Agerestraction");
  };

  const handleSaveDraft = async () => {
    try {
      const payload = { ...eventData, isDraft: true };
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
        toast.success(t("draftSavedSuccessfully") || "Draft saved successfully");
        router.push("/EventsManagement");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error(error.response?.data?.message || "Failed to save draft");
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
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
            <h2 className="text-white mb-0">{t("createEvent")}</h2>
            <button
              type="button"
              className="outline-btn"
              onClick={handleSaveDraft}
              style={{ padding: "8px 24px", borderRadius: "20px" }}
            >
              {t("saveDraft") || "Save Draft"}
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
              <Link href="/Agerestraction" className="steps-link">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-04.svg" className="me-2" />
                  {t("ageRestrictionStep")}
                </span>
              </Link>
            </li>
          </ul>
          <Form onSubmit={handleNext}>
            <div className="event-form-card">
              {ticketsList.map((ticket, index) => (
                <div key={index} className="mb-4 pb-4 border-bottom border-secondary">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="text-white" style={{ color: "#23ada4" }}>{t("ticketTitle") || `Ticket ${index + 1}`}</h5>
                    {ticketsList.length > 1 && (
                      <button type="button" onClick={() => removeTicketType(index)} className="btn p-0 border-0 bg-transparent">
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                  <Row>
                    <Col md={12} className="mb-3">
                      <div className="event-frm-bx">
                        <label className="form-label">
                          {t("ticketNameLabel")} <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={ticket.ticketName || ""}
                          onChange={(e) => handleTicketChange(index, "ticketName", e.target.value)}
                          placeholder={t("ticketNamePlaceholder")}
                          maxLength={100}
                        />
                      </div>
                    </Col>
                    <Col md={12} className="mb-3">
                      <div className="event-frm-bx">
                        <label className="form-label">
                          {t("shortDescriptionOptional") || "Short Description (Optional)"}
                        </label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={ticket.ticketShortDesc || ""}
                          onChange={(e) => handleTicketChange(index, "ticketShortDesc", e.target.value)}
                          placeholder={t("ticketShortDescPlaceholder") || "Enter short description"}
                        />
                      </div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <div className="event-frm-bx">
                        <label className="form-label">
                          {t("pricePerTicketLabel")} <span className="text-danger">*</span>
                        </label>
                        <div className="price-input-wrapper position-relative">
                          <span className="price-symbol position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#23ada4', fontWeight: 'bold' }}>₮</span>
                          <input
                            type="number"
                            className="form-control"
                            style={{ paddingLeft: '30px' }}
                            value={ticket.price === "" ? "" : ticket.price}
                            placeholder="0"
                            onChange={(e) => handleTicketChange(index, "price", e.target.value)}
                            min={0}
                          />
                        </div>
                      </div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <div className="event-frm-bx">
                        <label className="form-label">{t("quantityAvailableLabel")} <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          className="form-control"
                          value={ticket.qty === "" ? "" : ticket.qty}
                          placeholder="1"
                          onChange={(e) => handleTicketChange(index, "qty", e.target.value)}
                          min={1}
                        />
                      </div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <div className="event-frm-bx">
                        <label className="form-label">{t("salesStartDateLabel")} <span className="text-danger">*</span></label>
                        <div className="date-input-wrapper">
                          <input
                            type="date"
                            className="date-input form-control"
                            value={formatDateVal(ticket.salesStart)}
                            onChange={(e) => handleTicketChange(index, "salesStart", e.target.value)}
                            min={today}
                          />
                          <span className="calendar-icon" onClick={(e) => {
                            e.currentTarget.previousSibling?.showPicker();
                          }}>
                            <img src="/img/white-calendar.svg" alt="calendar" />
                          </span>
                        </div>
                      </div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <div className="event-frm-bx">
                        <label className="form-label">{t("salesEndDateLabel")} <span className="text-danger">*</span></label>
                        <div className="date-input-wrapper">
                          <input
                            type="date"
                            className="date-input form-control"
                            value={formatDateVal(ticket.salesEnd)}
                            onChange={(e) => handleTicketChange(index, "salesEnd", e.target.value)}
                            min={formatDateVal(ticket.salesStart) || today}
                          />
                          <span className="calendar-icon" onClick={(e) => {
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
                  style={{ borderRadius: "8px", borderStyle: "dashed" }}
                >
                  + {t("addAnotherTicketType") || "Add Another Ticket Type"}
                </button>
              </div>

              <Row className="mb-3">
                <Col md={12}>
                  <div className="event-frm-bx">
                    <label className="form-label">{t("refundPolicyLabel")} <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      name="refundPolicy"
                      value={eventData.refundPolicy || ""}
                      onChange={handleRefundPolicyChange}
                      style={{
                        backgroundColor: "#1a1a1a",
                        color: "white",
                        border: "1px solid rgba(35, 173, 164, 0.3)",
                        height: "45px"
                      }}
                    >
                      <option value="">{t("selectRefundPolicy") || "Select Refund Policy"}</option>
                      {refundPolicies.map((policy) => {
                        const translationKey = policy === "No Refund" ? "noRefund" :
                          policy === "1 Day Before" ? "oneDayBefore" :
                            policy === "7 Days Before" ? "sevenDaysBefore" : "";
                        return (
                          <option key={policy} value={policy}>
                            {translationKey ? (t(translationKey) || policy) : policy}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </Col>
              </Row>

              <div className="d-flex gap-2 justify-content-end mt-4">
                <Link href="/DateTime" className="outline-btn">
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
