"use client";
import Link from "next/link";
import React, { useRef,useEffect } from "react";
import { Col, Form, Row } from "react-bootstrap";
import LocationMap from "../../Components/LocationMap"; // Assuming this component exists
import VenueAutocomplete from "../../Components/VenueAutocomplete";
import { useEventContext } from "@/context/EventContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

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

  const today = new Date().toISOString().split("T")[0];

  const handleNext = (e) => {
    e.preventDefault();

    if (!eventData.startDate || !eventData.endDate || !eventData.venueName) {
      toast.error(t("pleaseFillRequiredFields"));
      return;
    }

    if (eventData.venueName.length > 100) {
      toast.error(t("venueNameTooLong"));
      return;
    }

    // Combine date and time for validation
    const startDateTime = new Date(
      `${eventData.startDate}T${eventData.startTime || "00:00"}`,
    );
    const endDateTime = new Date(
      `${eventData.endDate}T${eventData.endTime || "00:00"}`,
    );
    const now = new Date();

    // Validate Start Date is in the future
    if (startDateTime < now) {
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
                <Col md={12}>
                  <div className="event-frm-bx">
                    <label className="form-label">{t("venueAddressLabel")}</label>
                    <VenueAutocomplete
                      defaultValue={eventData.venueAddress && eventData.venueAddress.address}
                      placeholder={t("searchVenuePlaceholder")}
                      onPlaceSelected={handleVenueSelected}
                    />
                  </div>
                </Col>
                <Col md={6}>
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
                <Col md={6}>
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

                {/* <Col md={12}>
                  <LocationMap />
                </Col> */}
              </Row>
            </div>
            <div className="event-form-card">
              <Row>
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
                        min={today}
                      />
                    </div>
                  </div>
                </Col>
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
                        min={eventData.startDate || today}
                      />
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">{t("startTime")}</label>
                    <div className="date-input-wrapper">
                      <input
                        type="time"
                        className="date-input form-control"
                        name="startTime"
                        value={eventData.startTime}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">{t("endTime")}</label>
                    <div className="date-input-wrapper">
                      <input
                        type="time"
                        className="date-input form-control"
                        name="endTime"
                        value={eventData.endTime}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </Col>
              </Row>
              <div className="d-flex gap-2 justify-content-end mt-2">
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
