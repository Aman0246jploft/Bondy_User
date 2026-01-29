"use client";
import Link from "next/link";
import React from "react";
import { useRef } from "react";
import { Col, Form, Row } from "react-bootstrap";

function page() {
  const inputRef = useRef(null);
  return (
    <div>
      <Row className="justify-content-center">
        <Col md={8}>
          <ul className="event-steps">
            <li className="steps-item">
              <Link href="" className="steps-link active">
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
              <Link href="" className="steps-link active">
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
              <Link href="" className="steps-link active">
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
              <Link href="" className="steps-link">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-04.svg" className="me-2" />
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
                    <label className="form-label">Ticket Name</label>
                    <input type="text" className="form-control" />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Quantity Available</label>
                    <input type="number" className="form-control" />
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Price per Ticket</label>
                    <input type="number" className="form-control" />
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Start Date</label>
                    <div className="date-input-wrapper">
                      <input
                        ref={inputRef}
                        type="date"
                        className="date-input form-control"
                      />

                      <span
                        className="calendar-icon"
                        onClick={() => inputRef.current.showPicker()}
                      >
                        <img src="/img/date_icon.svg" alt="calendar" />
                      </span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">End Date</label>
                    <div className="date-input-wrapper">
                      <input
                        ref={inputRef}
                        type="date"
                        className="date-input form-control"
                      />

                      <span
                        className="calendar-icon"
                        onClick={() => inputRef.current.showPicker()}
                      >
                        <img src="/img/date_icon.svg" alt="calendar" />
                      </span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Refund Policy</label>
                    <input type="text" className="form-control" />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Coupon</label>
                    <input type="text" className="form-control" />
                  </div>
                </Col>
              </Row>
              <div className="d-flex gap-2 justify-content-end mt-2">
                <Link href="/DateTime" className="outline-btn">
                  {" "}
                  Back
                </Link>
                <Link href="/Gallery" className="custom-btn">
                  {" "}
                  Save and Continue
                </Link>
              </div>
            </div>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default page;
