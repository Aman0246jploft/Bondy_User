"use client";
import Link from "next/link";
import React, { useState, useRef } from "react";
import { Col, Form, Row } from "react-bootstrap";
import "react-datepicker/dist/react-datepicker.css";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
function page() {
  const [startDate, setStartDate] = useState(new Date());
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  };
  const inputRef = useRef(null);
  const [value, setValue] = useState();
  return (
    <div>
      <Row className="justify-content-center">
        <Col md={5}>
          <Form className="row">
            <div className="event-form-card">
              <Row>
                <Col md={12}>
                  <div
                    className="doc_upload_sec"
                    onClick={() => fileRef.current.click()}>
                    <div className="photo_circle">
                      {preview ? (
                        <img
                          src={preview}
                          alt="Preview"
                          className="preview-img"
                        />
                      ) : (
                        <div className="upload-doc">
                          Upload Gov ID
                          <p>
                            Drag and drop or browse to upload an image or video
                          </p>
                          <span className="add_photo_text">
                            {preview ? "Change Photo" : "Upload Photo"}
                          </span>
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      ref={fileRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                  </div>
                </Col>

                <Col md={12}>
                  <div className="event-frm-bx">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="estherhowardxxx@gmail.com"
                    />
                  </div>
                </Col>
                <Col md={12}>
                  <div className="event-frm-bx">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="331 623 8413"
                    />
                  </div>
                </Col>

                <Col md={12}>
                  <div className="event-frm-bx">
                    <div className="form-label mb-1">Price per Ticket</div>
                    <Link href="" className="merchant-linked">
                      Merchant Linked
                    </Link>
                  </div>
                </Col>
                <Col md={12}>
                  <div
                    className="doc_upload_sec mt-0"
                    onClick={() => fileRef.current.click()}>
                    <div className="photo_circle">
                      {preview ? (
                        <img
                          src={preview}
                          alt="Preview"
                          className="preview-img"
                        />
                      ) : (
                        <div className="upload-doc">
                          Upload Business Document
                          <p>
                            Drag and drop or browse to upload an image or video
                          </p>
                          <span className="add_photo_text">
                            {preview ? "Change Photo" : "Upload Photo"}
                          </span>
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      ref={fileRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                  </div>
                </Col>
              </Row>

              <div className="d-flex gap-2 justify-content-end mt-2">
                <Link href="/Gallery" className="custom-btn">
                  {" "}
                  Confirm
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
