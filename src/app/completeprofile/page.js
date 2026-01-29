"use client";
import Link from "next/link";
import React, { useState, useRef } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function DittoDesign() {
  const [startDate, setStartDate] = useState(new Date());
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  };
  return (
    <div className="login_sec compplete_profile_sec">
      <Container fluid>
        <Row className="justify-content-between align-items-center gy-4">
          <Col xl={5} lg={7}>
            <div className="login_img">
              <img src="/img/login_side_img.png" />
              <div className="content_img_box">
                <h4>Explore Events Effortlessly</h4>
                <p>
                  Discover, book, and track events seamlessly with calendar
                  integration and personalized event curation{" "}
                </p>
              </div>
            </div>
          </Col>
          <Col xl={6} lg={5}>
            <Row className="justify-content-center align-items-center">
              <Col xl={7} lg={9} md={12}>
                <div className="profile_setup_container">
                  <div className="fz_32">
                    <h2 className="">Complete Profile</h2>
                    <p>
                      Complete your personal details to get started. This helps
                      us personalize your experience
                    </p>
                  </div>
                  <div
                    className="photo_upload_sec"
                    onClick={() => fileRef.current.click()}>
                    <div className="photo_circle">
                      {preview ? (
                        <img
                          src={preview}
                          alt="Preview"
                          className="preview-img"
                        />
                      ) : (
                        <img
                          src="/img/icon-park-outline_add-picture.svg"
                          alt="Add"
                          style={{ width: "30px", opacity: 0.7 }}
                        />
                      )}
                    </div>

                    <span className="add_photo_text">
                      {preview ? "Change Photo" : "Add Photo"}
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      ref={fileRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                  </div>

                  <Form className="common_field">
                    <Row className="gy-3">
                      <Col md={6}>
                        <Form.Group controlId="firstName">
                          <Form.Control
                            type="text"
                            placeholder="First name"
                            className="custom_field_input"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="lastName">
                          <Form.Control
                            type="text"
                            placeholder="Last name"
                            className="custom_field_input"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mt-3">
                      <Col xs={12}>
                        <div className="select_gender">
                          <span>Gender</span>
                          <Form.Group controlId="gender">
                            <Form.Select className="custom_field_input custom_select">
                              <option value="" disabled selected>
                                Gender
                              </option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </Form.Select>
                          </Form.Group>
                        </div>
                      </Col>
                    </Row>
                    <Row className="mt-3">
                      <Col xs={12}>
                        <Form.Group controlId="dob">
                          <Form.Group controlId="dob">
                            <DatePicker
                              selected={startDate}
                              onChange={(date) => setStartDate(date)}
                              placeholderText="Date of Birth"
                              className="form-control w-100"
                              dateFormat="dd/MM/yyyy"
                              showYearDropdown
                              showMonthDropdown
                              dropdownMode="select"
                            />
                          </Form.Group>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mt-3">
                      <Col xs={12}>
                        <Form.Group controlId="bio">
                          <Form.Control
                            as="textarea"
                            rows={4}
                            placeholder="Bio"
                            className="custom_field_input custom_bio"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Form>
                  <Link href="/insterest" className="common_btn w-100 mt-4">
                    Continue
                  </Link>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
