"use client";
import Link from "next/link";
import React, { useRef } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { useEventContext } from "@/context/EventContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

function page() {
  const { eventData, updateEventData } = useEventContext();
  console.log("Current Event Data in TicketsPricing:", eventData);
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateEventData({ [name]: value });
  };

  const today = new Date().toISOString().split("T")[0];

  const handleNext = (e) => {
    e.preventDefault();
    if (!eventData.ticketName || !eventData.ticketPrice) {
      toast.error("Please fill in required fields");
      return;
    }

    if (
      eventData.ticketSelesStartDate &&
      eventData.ticketSelesStartDate < today
    ) {
      toast.error("Ticket sales start date cannot be in the past");
      return;
    }

    if (
      eventData.ticketSelesStartDate &&
      eventData.ticketSelesEndDate &&
      eventData.ticketSelesEndDate < eventData.ticketSelesStartDate
    ) {
      toast.error("Ticket sales end date must be after start date");
      return;
    }

    router.push("/Agerestraction");
  };

  return (
    <div>
      <Row className="justify-content-center">
        <Col lg={10} md={12} xs={12}>
          <ul className="event-steps">
            <li className="steps-item">
              <Link href="/BasicInfo" className="steps-link active">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-01.svg" className="me-2" />
                  Event Basic Info
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
                  Date, Time and Location
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
                  Tickets & Pricing
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
                  Age Restriction
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
                  Gallery
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
                      Ticket Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="ticketName"
                      value={eventData.ticketName}
                      onChange={handleInputChange}
                      placeholder="Enter ticket name"
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Quantity Available</label>
                    <input
                      type="number"
                      className="form-control"
                      name="ticketQtyAvailable"
                      value={eventData.ticketQtyAvailable}
                      onChange={handleInputChange}
                    />
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">
                      Price per Ticket <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="ticketPrice"
                      value={eventData.ticketPrice}
                      onChange={handleInputChange}
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Total Tickets</label>
                    <input
                      type="number"
                      className="form-control"
                      name="totalTickets"
                      value={eventData.totalTickets}
                      onChange={handleInputChange}
                    />
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Sales Start Date</label>
                    <div className="date-input-wrapper">
                      <input
                        type="date"
                        className="date-input form-control"
                        name="ticketSelesStartDate"
                        value={eventData.ticketSelesStartDate}
                        onChange={handleInputChange}
                        min={today}
                      />
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Sales End Date</label>
                    <div className="date-input-wrapper">
                      <input
                        type="date"
                        className="date-input form-control"
                        name="ticketSelesEndDate"
                        value={eventData.ticketSelesEndDate}
                        onChange={handleInputChange}
                        min={eventData.ticketSelesStartDate || today}
                      />
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Refund Policy</label>
                    <input
                      type="text"
                      className="form-control"
                      name="refundPolicy"
                      value={eventData.refundPolicy}
                      onChange={handleInputChange}
                      placeholder="e.g. No Refunds"
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Add-ons</label>
                    <input
                      type="text"
                      className="form-control"
                      name="addOns"
                      value={eventData.addOns}
                      onChange={handleInputChange}
                      placeholder="Optional add-ons"
                    />
                  </div>
                </Col>
              </Row>
              <div className="d-flex gap-2 justify-content-end mt-2">
                <Link href="/DateTime" className="outline-btn">
                  Back
                </Link>
                <button
                  type="button"
                  onClick={handleNext}
                  className="custom-btn">
                  Save and Continue
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
