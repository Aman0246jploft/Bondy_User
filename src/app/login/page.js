"use client";
import Link from "next/link";
import React, { useState } from "react";
import { Col, Container, Form, Nav, Row, Tab } from "react-bootstrap";

export default function Page() {
  const [selected, setSelected] = useState("card"); // Aapka original state
  const [show, setShow] = useState(false);

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
                    <h2 className="">Good to See You Again</h2>
                    <p>
                      Smart travel plans, tailored just for you. Sign in to
                      continue.
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
                                controlId="customerEmail">
                                <Form.Control
                                  type="email"
                                  placeholder="Email"
                                />
                              </Form.Group>
                              <Form.Group
                                className="mb-3"
                                controlId="customerPassword">
                                <div className="d-flex gap-2 position-relative">
                                  <Form.Control
                                    type={show ? "text" : "password"}
                                    placeholder="Enter your password"
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
                            </Form>

                            <Link
                              href="/otp?type=customer"
                              className="common_btn w-100 d-block text-center text-decoration-none">
                              Sign In
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
                                controlId="organizerEmail">
                                <Form.Control
                                  type="email"
                                  placeholder="Email"
                                />
                              </Form.Group>
                              <Form.Group
                                className="mb-3"
                                controlId="organizerPassword">
                                <div className="d-flex gap-2 position-relative">
                                  <Form.Control
                                    type={show ? "text" : "password"}
                                    placeholder="Enter your password"
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
                            </Form>

                            <Link
                              href="/otp?type=organizer"
                              className="common_btn w-100 d-block text-center text-decoration-none">
                              Sign In
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
