"use client";
import Link from "next/link";
import React, { useRef } from "react";
import { Col, Form, Row } from "react-bootstrap";
import LocationMap from "../../Components/LocationMap"; // Assuming this component exists
import { useEventContext } from "@/context/EventContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

function page() {
  const { eventData, updateEventData } = useEventContext();
  const inputRef = useRef(null);
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Handle nested venueAddress separately or flattened inputs
    if (name === "venueName" || name === "startDate" || name === "endDate" || name === "startTime" || name === "endTime") {
      updateEventData({ [name]: value });
    } else if (name === "address" || name === "city" || name === "country") {
      updateEventData({
        venueAddress: {
          ...eventData.venueAddress,
          [name]: value
        }
      });
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const handleNext = (e) => {
    e.preventDefault();

    if (!eventData.startDate || !eventData.endDate || !eventData.venueName) {
      toast.error("Please fill in required fields");
      return;
    }

    // Combine date and time for validation
    const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime || "00:00"}`);
    const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime || "00:00"}`);
    const now = new Date();

    // Validate Start Date is in the future
    if (startDateTime < now) {
      toast.error("Start date/time must be in the future");
      return;
    }

    // Validate End Date is after Start Date
    if (endDateTime <= startDateTime) {
      toast.error("End date/time must be after start date/time");
      return;
    }

    router.push("/TicketsPricing");
  };

  return (
    <div>
      <Row className="justify-content-center">
        <Col md={8}>
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
              <Link href="/TicketsPricing" className="steps-link">
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
                    <label className="form-label">Venue Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="venueName"
                      value={eventData.venueName}
                      onChange={handleInputChange}
                      placeholder="Enter venue name"
                    />
                  </div>
                </Col>
                <Col md={12}>
                  <div className="event-frm-bx">
                    <label className="form-label">Venue Address</label>
                    <input
                      type="text"
                      className="form-control"
                      name="address"
                      value={eventData.venueAddress.address}
                      onChange={handleInputChange}
                      placeholder="Street Address"
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-control"
                      name="city"
                      value={eventData.venueAddress.city}
                      onChange={handleInputChange}
                      placeholder="City"
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      className="form-control"
                      name="country"
                      value={eventData.venueAddress.country}
                      onChange={handleInputChange}
                      placeholder="Country"
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
                    <label className="form-label">Start Date <span className="text-danger">*</span></label>
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
                    <label className="form-label">End Date <span className="text-danger">*</span></label>
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
                    <label className="form-label">Start Time</label>
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
                    <label className="form-label">End Time</label>
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
                  Back
                </Link>

                <button type="button" onClick={handleNext} className="custom-btn">
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
