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
    const limits = {
      ticketName: 100,
      refundPolicy: 500,
      addOns: 200,
    };

    if (limits[name] && value.length > limits[name]) {
      return;
    }
    updateEventData({ [name]: value });
  };

  const today = new Date().toISOString().split("T")[0];

  const handleNext = (e) => {
    e.preventDefault();
    if (!eventData.ticketName) {
      toast.error("Ticket name is required");
      return;
    }

    if (!eventData.ticketQtyAvailable || eventData.ticketQtyAvailable <= 0) {
      toast.error("Quantity available must be greater than 0");
      return;
    }

    if (!eventData.ticketPrice || eventData.ticketPrice < 0) {
      toast.error("Ticket price is required (enter 0 for free events)");
      return;
    }

    if (!eventData.totalTickets || eventData.totalTickets <= 0) {
      toast.error("Total tickets must be greater than 0");
      return;
    }

    if (!eventData.ticketSelesStartDate) {
      toast.error("Sales start date is required");
      return;
    }

    if (eventData.ticketSelesStartDate < today) {
      toast.error("Ticket sales start date cannot be in the past");
      return;
    }

    if (!eventData.ticketSelesEndDate) {
      toast.error("Sales end date is required");
      return;
    }

    if (eventData.ticketSelesEndDate < eventData.ticketSelesStartDate) {
      toast.error("Ticket sales end date must be after start date");
      return;
    }

    if (!eventData.refundPolicy || eventData.refundPolicy.trim() === "") {
      toast.error("Refund policy is required");
      return;
    }

    if (!eventData.addOns || eventData.addOns.trim() === "") {
      toast.error("Add-ons are required (enter 'None' if not applicable)");
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
                      value={eventData.ticketName || ""}
                      onChange={handleInputChange}
                      placeholder="Enter ticket name"
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
                    <label className="form-label">Quantity Available <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      name="ticketQtyAvailable"
                      value={eventData.ticketQtyAvailable || ""}
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
                      value={eventData.ticketPrice || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Total Tickets <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      name="totalTickets"
                      value={eventData.totalTickets || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Sales Start Date <span className="text-danger">*</span></label>
                    <div className="date-input-wrapper">
                      <input
                        type="date"
                        className="date-input form-control"
                        name="ticketSelesStartDate"
                        value={eventData.ticketSelesStartDate || ""}
                        onChange={handleInputChange}
                        min={today}
                      />
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Sales End Date <span className="text-danger">*</span></label>
                    <div className="date-input-wrapper">
                      <input
                        type="date"
                        className="date-input form-control"
                        name="ticketSelesEndDate"
                        value={eventData.ticketSelesEndDate || ""}
                        onChange={handleInputChange}
                        min={eventData.ticketSelesStartDate || today}
                      />
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Refund Policy <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="refundPolicy"
                      value={eventData.refundPolicy || ""}
                      onChange={handleInputChange}
                      placeholder="e.g. No Refunds"
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
                    <label className="form-label">Add-ons <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="addOns"
                      value={eventData.addOns || ""}
                      onChange={handleInputChange}
                      placeholder="Optional add-ons (enter 'None' if NA)"
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
