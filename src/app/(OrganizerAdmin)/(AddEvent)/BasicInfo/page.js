import Link from "next/link";
import React from "react";
import { Col, Form, Row } from "react-bootstrap";

function page() {
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
              <Link href="" className="steps-link">
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
              <Link href="" className="steps-link">
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
                    <label className="form-label">Event Title</label>
                    <input type="text" className="form-control" />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Event Category</label>
                    <select className="form-select">
                      <option>Select Event Category</option>
                    </select>
                  </div>
                </Col>
                <Col md={12}>
                  <div className="event-frm-bx upload">
                    <div>
                      <h5>Upload Event Poster</h5>
                      <p>Drag and drop or browse to upload an image or video</p>
                    </div>
                    <input type="file" id="upload" className="d-none" />
                    <label htmlFor="upload">Upload</label>
                  </div>
                </Col>
              </Row>
            </div>
            <div className="event-form-card">
              <div className="event-frm-bx">
                <label className="form-label">Short Description</label>
                <textarea></textarea>
              </div>
              <div className="event-frm-bx">
                <label className="form-label">
                  Detailed Description/Highlights
                </label>
                <textarea></textarea>
              </div>
              <div className="event-frm-bx">
                <label className="form-label">Tags</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add relevant tags (e.g., music, conference, workshop)"
                />
              </div>
              <div className="d-flex gap-2 justify-content-end mt-2">
                <button className="outline-btn" type="button">
                  Back
                </button>
                {/* <button className="custom-btn" type="button">
                  Save and Continue
                </button> */}
                <Link href="/DateTime" className="custom-btn">
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
