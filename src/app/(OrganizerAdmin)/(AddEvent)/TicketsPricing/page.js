"use client";
import Link from "next/link";
import React, { useRef,useEffect } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { useEventContext } from "@/context/EventContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

function page() {
  const { t } = useLanguage();
  const { eventData, updateEventData } = useEventContext();
  console.log("Current Event Data in TicketsPricing:", eventData);
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const limits = {
      ticketName: 100,
      refundPolicy: 500,
      addOns: 200,
      ticketQtyAvailable: 9,
      ticketPrice: 9,
      totalTickets: 9,
    };

    if (limits[name] && value.toString().length > limits[name]) {
      return;
    }
    updateEventData({ [name]: value });
  };

  const today = new Date().toISOString().split("T")[0];

  const handleNext = (e) => {
    e.preventDefault();
    if (!eventData.ticketName) {
      toast.error(t("ticketNameRequired"));
      return;
    }

    if (!eventData.ticketQtyAvailable || eventData.ticketQtyAvailable <= 0) {
      toast.error(t("quantityMustBeGreaterThanZero"));
      return;
    }

    if (!eventData.ticketPrice || eventData.ticketPrice < 0) {
      toast.error(t("ticketPriceRequired"));
      return;
    }

    if (!eventData.totalTickets || eventData.totalTickets <= 0) {
      toast.error(t("totalTicketsGreaterThanZero"));
      return;
    }

    if (Number(eventData.totalTickets) < Number(eventData.ticketQtyAvailable)) {
      toast.error(t("totalTicketsMustBeGEQuantityAvailable"));
      return;
    }

    if (!eventData.ticketSelesStartDate) {
      toast.error(t("salesStartDateRequired"));
      return;
    }

    if (eventData.ticketSelesStartDate < today) {
      toast.error(t("ticketSalesStartDateCannotBeInPast"));
      return;
    }

    if (!eventData.ticketSelesEndDate) {
      toast.error(t("salesEndDateRequired"));
      return;
    }

    if (eventData.ticketSelesEndDate < eventData.ticketSelesStartDate) {
      toast.error(t("ticketSalesEndDateMustBeAfterStart"));
      return;
    }

    if (!eventData.refundPolicy || eventData.refundPolicy.trim() === "") {
      toast.error(t("refundPolicyRequired"));
      return;
    }

    if (!eventData.addOns || eventData.addOns.trim() === "") {
      toast.error(t("addonsRequired"));
      return;
    }

    router.push("/Agerestraction");
  };

  useEffect(() => { document.title = t("ticketsPricingPageTitle"); }, []);

  return (
    <div>
      <Row className="justify-content-center">
        <Col lg={10} md={12} xs={12}>
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
                <span className="steps-arrow">
                  <img src="/img/Arrow-Right.svg" className="ms-3" />
                </span>
              </Link>
            </li>
            <li className="steps-item">
              <Link href="/Gallery" className="steps-link">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-01.svg" className="me-2" />
                  {t("galleryStep")}
                </span>
                <span className="steps-arrow">
                  <img src="/img/Arrow-Right.svg" className="ms-3" />
                </span>
              </Link>
            </li>
          </ul>
          <Form className="row">
            <div className="event-form-card">
              <Row>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">
                      {t("ticketNameLabel")} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="ticketName"
                      value={eventData.ticketName || ""}
                      onChange={handleInputChange}
                      placeholder={t("ticketNamePlaceholder")}
                    />
                    <div className="text-end mt-1">
                      <small className="text-white">
                        {(eventData.ticketName?.length || 0)}/100
                      </small>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">{t("quantityAvailableLabel")} <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      name="ticketQtyAvailable"
                      value={eventData.ticketQtyAvailable || ""}
                      placeholder={t("quantityPlaceholder")}
                      onChange={handleInputChange}
                    />
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">
                      {t("pricePerTicketLabel")} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="ticketPrice"
                      value={eventData.ticketPrice || ""}
                      placeholder={t("pricePlaceholder")}
                      onChange={handleInputChange}
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">{t("totalTicketsLabel")} <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      name="totalTickets"
                      value={eventData.totalTickets || ""}
                      placeholder={t("totalTicketsPlaceholder")}
                      onChange={handleInputChange}
                    />
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">{t("salesStartDateLabel")} <span className="text-danger">*</span></label>
                    <div className="date-input-wrapper">
                      <input
                        type="date"
                        className="date-input form-control"
                        name="ticketSelesStartDate"
                        value={eventData.ticketSelesStartDate || ""}
                        placeholder={t("salesStartDatePlaceholder")}
                        onChange={handleInputChange}
                        min={today}
                      />
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">{t("salesEndDateLabel")} <span className="text-danger">*</span></label>
                    <div className="date-input-wrapper">
                      <input
                        type="date"
                        className="date-input form-control"
                        name="ticketSelesEndDate"
                        value={eventData.ticketSelesEndDate || ""}
                        placeholder={t("salesEndDatePlaceholder")}
                        onChange={handleInputChange}
                        min={eventData.ticketSelesStartDate || today}
                      />
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">{t("refundPolicyLabel")} <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="refundPolicy"
                      value={eventData.refundPolicy || ""}
                      onChange={handleInputChange}
                      placeholder={t("refundPolicyPlaceholder")}
                    />
                    <div className="text-end mt-1">
                      <small className="text-white">
                        {(eventData.refundPolicy?.length || 0)}/500
                      </small>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">{t("addOnsLabel")} <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="addOns"
                      value={eventData.addOns || ""}
                      onChange={handleInputChange}
                      placeholder={t("addOnsPlaceholder")}
                    />
                    <div className="text-end mt-1">
                      <small className="text-white">
                        {(eventData.addOns?.length || 0)}/200
                      </small>
                    </div>
                  </div>
                </Col>
              </Row>
              <div className="d-flex gap-2 justify-content-end mt-2">
                <Link href="/DateTime" className="outline-btn">
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
