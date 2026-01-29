"use client";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { Col, Container, Form, Nav, Row, Tab } from "react-bootstrap";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
export default function Page() {
  const [selected, setSelected] = useState("card");
  const [accepted, setAccepted] = useState(false);
  const [show2, setShow2] = useState(false);
  const [show, setShow] = useState(false);

  const [value, setValue] = useState();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  };
  return (
    <div className="login_sec">
      <Container fluid>
        <Row className="justify-content-between align-items-center gy-4">
          <Col xl={5} lg={7}>
            <div className="login_img">
              <img src="/img/login_side_img.png" alt="login side" />
              <div className="content_img_box">
                <h4>Explore Events Effortlessly</h4>
                <p>
                  Discover, book, and track events seamlessly with calendar
                  integration and personalized event curation
                </p>
              </div>
            </div>
          </Col>

          <Col xl={6} lg={5}>
            <Row className="justify-content-center align-items-center">
              <Col xxl={7} xl={9} lg={10} md={12}>
                <div className="common_field">
                  <div className="fz_32">
                    <h2 className="">Get started</h2>
                    <p>
                      Register for events and create images of the activities
                      you plan to attend.
                    </p>
                  </div>

                  <Tab.Container id="Login" defaultActiveKey="Customer">
                    <Row>
                      <Col sm={12} className="mb-4">
                        <Nav
                          variant="pills"
                          className="custom-nav-pills justify-content-center m-auto">
                          <Nav.Item>
                            <Nav.Link eventKey="Customer">Customer</Nav.Link>
                          </Nav.Item>
                          <Nav.Item>
                            <Nav.Link eventKey="Organizer">Organizer</Nav.Link>
                          </Nav.Item>
                        </Nav>
                      </Col>

                      <Col sm={12}>
                        <Tab.Content>
                          <Tab.Pane eventKey="Customer">
                            <Form className="login_field">
                              <Form.Group
                                className="mb-3"
                                controlId="exampleForm.ControlInput1">
                                <Form.Control
                                  type="email"
                                  placeholder="Email"
                                />
                              </Form.Group>

                              <Form.Group className="mb-3">
                                <PhoneInput
                                  defaultCountry="US"
                                  international
                                  countryCallingCodeEditable={false}
                                  value={value}
                                  onChange={setValue}
                                  className="phone_input"
                                />
                              </Form.Group>
                              <Form.Group
                                className="mb-3"
                                controlId="exampleForm.ControlPassword">
                                <div className="d-flex gap-2 position-relative">
                                  <Form.Control
                                    type={show ? "text" : "Password"}
                                    placeholder="Password"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShow(!show)}
                                    className="password-eye-btn">
                                    <img
                                      src={
                                        show
                                          ? "/img/lock.svg"
                                          : "/img/unlock.svg"
                                      }
                                      alt="toggle password"
                                    />
                                  </button>
                                </div>
                              </Form.Group>
                              <Form.Group className="mb-3">
                                <div className="d-flex gap-2 position-relative">
                                  <Form.Control
                                    type={show2 ? "text" : "password"}
                                    placeholder="Confirm Password"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShow2(!show2)}
                                    className="password-eye-btn">
                                    <img
                                      src={
                                        show2
                                          ? "/img/unlock.svg"
                                          : "/img/lock.svg"
                                      }
                                      alt="toggle confirm password"
                                    />
                                  </button>
                                </div>
                              </Form.Group>
                              <Form.Group
                                controlId="exampleForm.ControlSelect1"
                                className="mb-3">
                                <Form.Label>Choose Business Type</Form.Label>
                                <Form.Select>
                                  <option value="">Choose Business Type</option>
                                  <option value="react"></option>
                                  <option value="next"></option>
                                  <option value="uiux"></option>
                                  <option value="frontend"></option>
                                </Form.Select>
                              </Form.Group>
                            </Form>

                            <Link
                              href="/otp"
                              className="common_btn w-100 d-block text-center text-decoration-none">
                              Sing Up
                            </Link>

                            <div className="other_text">
                              <span></span>
                              <h6>or sign up with</h6>
                              <span></span>
                            </div>

                            <div className="social_icon">
                              <Link href="">
                                <img src="/img/app_icon.svg" alt="apple" />
                              </Link>
                              <Link href="">
                                <img src="/img/google_icon.svg" alt="google" />
                              </Link>
                              <Link href="">
                                <img
                                  src="/img/facebook_icon.svg"
                                  alt="facebook"
                                />
                              </Link>
                            </div>

                            <div className="other_signup">
                              <span>
                                {" "}
                                Don't have an account?{" "}
                                <Link href="/register">Sign Up</Link>
                              </span>
                            </div>
                          </Tab.Pane>

                          {/* ORGANIZER TAB CONTENT */}
                          <Tab.Pane eventKey="Organizer">
                            <Form className="login_field">
                              <Form.Group
                                className="mb-3"
                                controlId="exampleForm.ControlInput1">
                                <Form.Control
                                  type="email"
                                  placeholder="Email"
                                />
                              </Form.Group>

                              <Form.Group className="mb-3">
                                <PhoneInput
                                  defaultCountry="US"
                                  international
                                  countryCallingCodeEditable={false}
                                  value={value}
                                  onChange={setValue}
                                  className="phone_input"
                                />
                              </Form.Group>
                              <Form.Group
                                className="mb-3"
                                controlId="exampleForm.ControlPassword">
                                <div className="d-flex gap-2 position-relative">
                                  <Form.Control
                                    type={show ? "text" : "Password"}
                                    placeholder="Password"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShow(!show)}
                                    className="password-eye-btn">
                                    <img
                                      src={
                                        show
                                          ? "/img/lock.svg"
                                          : "/img/unlock.svg"
                                      }
                                      alt="toggle password"
                                    />
                                  </button>
                                </div>
                              </Form.Group>
                              <Form.Group className="mb-3">
                                <div className="d-flex gap-2 position-relative">
                                  <Form.Control
                                    type={show2 ? "text" : "password"}
                                    placeholder="Confirm Password"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShow2(!show2)}
                                    className="password-eye-btn">
                                    <img
                                      src={
                                        show2
                                          ? "/img/unlock.svg"
                                          : "/img/lock.svg"
                                      }
                                      alt="toggle confirm password"
                                    />
                                  </button>
                                </div>
                              </Form.Group>
                              <Form.Group controlId="exampleForm.ControlSelect1">
                                <Form.Label>Choose Business Type</Form.Label>
                                <Form.Select>
                                  <option value="">Choose Business Type</option>
                                  <option value="react"></option>
                                  <option value="next"></option>
                                  <option value="uiux"></option>
                                  <option value="frontend"></option>
                                </Form.Select>
                              </Form.Group>
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
                                      Attach Documents
                                      <p>
                                        Drag and drop or browse to upload an
                                        image or video
                                      </p>
                                      <span className="add_photo_text">
                                        {preview
                                          ? "Change Photo"
                                          : "Upload Photo"}
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
                              <Form.Group
                                className="mb-3"
                                controlId="termsCheckbox">
                                <div className="custom-checkbox">
                                  <input type="checkbox" id="terms" />
                                  <label htmlFor="terms">
                                    Accept <span>Terms &amp; Conditions</span>
                                  </label>
                                </div>
                              </Form.Group>
                            </Form>

                            <Link
                              href="/otpSinup"
                              className="common_btn w-100 d-block text-center text-decoration-none">
                              Sing Up
                            </Link>

                            <div className="other_text">
                              <span></span>
                              <h6>or sign up with</h6>
                              <span></span>
                            </div>

                            <div className="social_icon">
                              <Link href="">
                                <img src="/img/app_icon.svg" alt="apple" />
                              </Link>
                              <Link href="">
                                <img src="/img/google_icon.svg" alt="google" />
                              </Link>
                              <Link href="">
                                <img
                                  src="/img/facebook_icon.svg"
                                  alt="facebook"
                                />
                              </Link>
                            </div>

                            <div className="other_signup">
                              <span>
                                {" "}
                                Don't have an account?{" "}
                                <Link href="/register">Sign Up</Link>
                              </span>
                            </div>
                          </Tab.Pane>
                        </Tab.Content>
                      </Col>
                    </Row>
                  </Tab.Container>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
