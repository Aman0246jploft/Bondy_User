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
              <Link href="" className="steps-link active">
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
                <Col md={12}>
                  <div className="event-frm-bx upload">
                    <div>
                      <h5>Media & Gallery</h5>
                      <p>
                        Upload images, promotional videos, or short teaser clips
                        to showcase <br /> your event. Drag and drop files or
                        click to browse.
                      </p>
                    </div>
                    <input type="file" id="upload" className="d-none" />
                    <label htmlFor="upload">Upload</label>
                  </div>
                  <div className="upload-images">
                    <div className="images-innr">
                      <img src="/img/org-img/upload-img-01.png" />
                      <button type="button" className="close-btn">
                        <img src="/img/org-img/close.svg" />
                      </button>
                    </div>
                    <div className="images-innr">
                      <img src="/img/org-img/upload-img-02.png" />
                      <button type="button" className="close-btn">
                        <img src="/img/org-img/close.svg" />
                      </button>
                    </div>
                    <div className="images-innr">
                      <img src="/img/org-img/upload-img-03.png" />
                      <button type="button" className="close-btn">
                        <img src="/img/org-img/close.svg" />
                      </button>
                    </div>
                    <div className="images-innr">
                      <img src="/img/org-img/upload-img-04.png" />
                      <button type="button" className="close-btn">
                        <img src="/img/org-img/close.svg" />
                      </button>
                    </div>
                    <div className="images-innr">
                      <img src="/img/org-img/upload-img-05.png" />
                      <button type="button" className="close-btn">
                        <img src="/img/org-img/close.svg" />
                      </button>
                    </div>
                    <div className="images-innr">
                      <img src="/img/org-img/upload-img-06.png" />
                      <button type="button" className="close-btn">
                        <img src="/img/org-img/close.svg" />
                      </button>
                    </div>
                    <div className="images-innr">
                      <img src="/img/org-img/upload-img-07.png" />
                      <button type="button" className="close-btn">
                        <img src="/img/org-img/close.svg" />
                      </button>
                    </div>
                  </div>
                </Col>
              </Row>

              <div className="d-flex gap-2 justify-content-end mt-2">
                <Link href="/TicketsPricing" className="outline-btn">
                  {" "}
                  Back
                </Link>

                <Link href="/EventPreview" className="custom-btn">
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
