"use client";
import Link from "next/link";
import React from "react";
import { useRef } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import LocationMap from "../Components/LocationMap";

function page() {
  const inputRef = useRef(null);
  return (
    <div>
      <Row className="justify-content-center">
        <Col md={8}>
          <Form className="row">
            <div className="event-form-card">
              <Row>
                <Col md={12}>
                  <div className="event-frm-bx upload">
                    <div>
                      <h5>Upload Image</h5>
                      <p>Drag and drop or browse to upload an image or video</p>
                    </div>
                    <input type="file" id="upload" className="d-none" />
                    <label htmlFor="upload">Upload</label>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Course Name</label>
                    <input type="text" className="form-control" />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Course Category</label>
                    <select className="form-select">
                      <option>Select Course Category</option>
                    </select>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Quantity Available</label>
                    <input type="number" className="form-control" />
                  </div>
                </Col>
                <Col md={12}>
                  <div className="event-frm-bx">
                    <label className="form-label">Venue Address</label>
                    <input type="number" className="form-control" />
                  </div>
                </Col>
                <Col md={12}>
                  <LocationMap />
                </Col>
              </Row>
            </div>
            <div className="event-form-card">
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
                    <label className="form-label">Start Time</label>
                    <div className="date-input-wrapper">
                      <input
                        ref={inputRef}
                        type="time"
                        className="date-input form-control"
                      />

                      <span
                        className="calendar-icon"
                        onClick={() => inputRef.current.showPicker()}
                      >
                        <img src="/img/org-img/clock.svg" alt="calendar" />
                      </span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Start Time</label>
                    <div className="date-input-wrapper">
                      <input
                        ref={inputRef}
                        type="time"
                        className="date-input form-control"
                      />

                      <span
                        className="calendar-icon"
                        onClick={() => inputRef.current.showPicker()}
                      >
                        <img src="/img/org-img/clock.svg" alt="calendar" />
                      </span>
                    </div>
                  </div>
                </Col>
                <Col md={8}>
                  <div className="event-frm-bx">
                    <label className="form-label">Weekly Sessions</label>
                    <div className="d-flex gap-3">
                      <div className="schedule-card w-100">
                        <img src="/img/org-img/sessions-icon.svg" />
                        <div className="text-content">
                          <p className="days-text">MON, WED, FRI</p>
                          <p className="time-text">07:00 AM - 07:45 AM</p>
                        </div>
                      </div>
                      <Button type="button" className="add-slot ">
                        + Add another time slot
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <div className="event-frm-bx ">
                    <label className="form-label">Session Price</label>
                    <input type="number" className="form-control text-white" />
                    <button type="button" className="session-link">
                      + Add Session
                    </button>
                  </div>
                </Col>
              </Row>
              <div className="d-flex gap-2 justify-content-center mt-2">
                <button className="custom-btn" type="button">
                  Create Course
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
