"use client";
import Link from "next/link";
import React, { useState } from "react";
import { Col, Container, Form, Nav, Row, Tab } from "react-bootstrap";
import authApi from "@/api/authApi";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Page() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Customer");

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Map tab name to backend expected Role String
      // Organizer -> ORGANIZER, Customer -> CUSTOMER
      const roleType = activeTab === "Organizer" ? "ORGANIZER" : "CUSTOMER";

      const response = await authApi.loginInit({
        email: formData.email,
        password: formData.password,
        type: roleType,
      });

      if (response.status) {
        localStorage.setItem("loginEmail", formData.email);
        // Store the UPPERCASE standard role for OTP page to use
        localStorage.setItem("loginType", roleType);
        router.push("/otp?flow=login");
      }
    } catch (error) {
      // Toast error handled by apiClient interceptor
    } finally {
      setLoading(false);
    }
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
                    <h2 className="">Good to See You Again</h2>
                    <p>
                      Smart travel plans, tailored just for you. Sign in to
                      continue.
                    </p>
                  </div>

                  <Tab.Container
                    id="Login"
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                  >
                    <Row>
                      <Col sm={12} className="mb-4">
                        <Nav
                          variant="pills"
                          className="custom-nav-pills justify-content-center m-auto"
                        >
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
                            <Form
                              className="login_field"
                              onSubmit={handleLogin}
                            >
                              <Form.Group
                                className="mb-3"
                                controlId="customerEmail"
                              >
                                <Form.Control
                                  type="email"
                                  name="email"
                                  placeholder="Email"
                                  value={formData.email}
                                  onChange={handleChange}
                                  required
                                />
                              </Form.Group>
                              <Form.Group
                                className="mb-3"
                                controlId="customerPassword"
                              >
                                <div className="d-flex gap-2 position-relative">
                                  <Form.Control
                                    type={show ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShow(!show)}
                                    className="password-eye-btn"
                                  >
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
                              <div className="text-end mb-3">
                                <Link href="/forgot-password" className="text-decoration-none">
                                  Forgot Password?
                                </Link>
                              </div>
                              <button
                                type="submit"
                                disabled={loading}
                                className="common_btn w-100 d-block text-center text-decoration-none border-0"
                              >
                                {loading ? "Signing In..." : "Sign In"}
                              </button>
                            </Form>

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

                          <Tab.Pane eventKey="Organizer">
                            <Form
                              className="login_field"
                              onSubmit={handleLogin}
                            >
                              <Form.Group
                                className="mb-3"
                                controlId="organizerEmail"
                              >
                                <Form.Control
                                  type="email"
                                  name="email"
                                  placeholder="Email"
                                  value={formData.email}
                                  onChange={handleChange}
                                  required
                                />
                              </Form.Group>
                              <Form.Group
                                className="mb-3"
                                controlId="organizerPassword"
                              >
                                <div className="d-flex gap-2 position-relative">
                                  <Form.Control
                                    type={show ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShow(!show)}
                                    className="password-eye-btn"
                                  >
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
                              <div className="text-end mb-3">
                                <Link href="/forgot-password" className="text-decoration-none">
                                  Forgot Password?
                                </Link>
                              </div>
                              <button
                                type="submit"
                                disabled={loading}
                                className="common_btn w-100 d-block text-center text-decoration-none border-0"
                              >
                                {loading ? "Signing In..." : "Sign In"}
                              </button>
                            </Form>

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
