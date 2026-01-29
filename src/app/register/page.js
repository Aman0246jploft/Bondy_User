"use client";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { Col, Container, Form, Nav, Row, Tab } from "react-bootstrap";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import authApi from "@/api/authApi";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Page() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("Customer");
  const [show2, setShow2] = useState(false);
  const [show, setShow] = useState(false);
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Customer Form State
  const [customerData, setCustomerData] = useState({
    email: "",
    contactNumber: "",
    countryCode: "",
    password: "",
    confirmPassword: "",
  });

  // Organizer Form State
  const [organizerData, setOrganizerData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    countryCode: "",
    password: "",
    confirmPassword: "",
    businessType: "",
    acceptTerms: false,
    documents: [],
  });

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOrganizerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOrganizerData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePhoneChange = (value, role) => {
    if (role === "Customer") {
      setCustomerData((prev) => ({ ...prev, contactNumber: value }));
    } else {
      setOrganizerData((prev) => ({ ...prev, contactNumber: value }));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);

    // Upload file immediately or on submit? Usually better on submit if possible, 
    // but the user's backend seems to have a separate upload endpoint.
    try {
      const formData = new FormData();
      formData.append("files", file);
      const response = await authApi.uploadFile(formData);
      if (response.success) {
        setOrganizerData((prev) => ({
          ...prev,
          documents: response.data.files,
        }));
      }
    } catch (error) {
      // toast handled by interceptor
    }
  };

  const handleCustomerSignup = async (e) => {
    e.preventDefault();
    if (customerData.password !== customerData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        email: customerData.email,
        contactNumber: customerData.contactNumber,
        countryCode: "+1", // Default for now, extract from phone input if needed
        password: customerData.password,
        confirmPassword: customerData.confirmPassword,
      };
      const response = await authApi.customerSignup(payload);
      if (response.status) {
        localStorage.setItem("registerEmail", customerData.email);
        router.push("/otp");
      }
    } catch (error) {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizerSignup = async (e) => {
    e.preventDefault();
    if (organizerData.password !== organizerData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!organizerData.acceptTerms) {
      toast.error("Please accept Terms & Conditions");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...organizerData,
        countryCode: "+1", // Default for now
      };
      const response = await authApi.organizerSignup(payload);
      if (response.status) {
        localStorage.setItem("registerEmail", organizerData.email);
        router.push("/otpSinup");
      }
    } catch (error) {
      // toast handled by interceptor
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
                    <h2 className="">Get started</h2>
                    <p>
                      Register for events and create images of the activities
                      you plan to attend.
                    </p>
                  </div>

                  <Tab.Container
                    id="Login"
                    activeKey={selectedTab}
                    onSelect={(k) => setSelectedTab(k)}
                  >
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
                            <Form className="login_field" onSubmit={handleCustomerSignup}>
                              <Form.Group className="mb-3">
                                <Form.Control
                                  type="email"
                                  name="email"
                                  placeholder="Email"
                                  value={customerData.email}
                                  onChange={handleCustomerChange}
                                  required
                                />
                              </Form.Group>

                              <Form.Group className="mb-3">
                                <PhoneInput
                                  defaultCountry="US"
                                  international
                                  countryCallingCodeEditable={false}
                                  value={customerData.contactNumber}
                                  onChange={(val) => handlePhoneChange(val, "Customer")}
                                  className="phone_input"
                                />
                              </Form.Group>

                              <Form.Group className="mb-3">
                                <div className="d-flex gap-2 position-relative">
                                  <Form.Control
                                    type={show ? "text" : "password"}
                                    name="password"
                                    placeholder="Password"
                                    value={customerData.password}
                                    onChange={handleCustomerChange}
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShow(!show)}
                                    className="password-eye-btn">
                                    <img
                                      src={show ? "/img/lock.svg" : "/img/unlock.svg"}
                                      alt="toggle password"
                                    />
                                  </button>
                                </div>
                              </Form.Group>

                              <Form.Group className="mb-3">
                                <div className="d-flex gap-2 position-relative">
                                  <Form.Control
                                    type={show2 ? "text" : "password"}
                                    name="confirmPassword"
                                    placeholder="Confirm Password"
                                    value={customerData.confirmPassword}
                                    onChange={handleCustomerChange}
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShow2(!show2)}
                                    className="password-eye-btn">
                                    <img
                                      src={show2 ? "/img/unlock.svg" : "/img/lock.svg"}
                                      alt="toggle confirm password"
                                    />
                                  </button>
                                </div>
                              </Form.Group>

                              <button
                                type="submit"
                                disabled={loading}
                                className="common_btn w-100 d-block text-center text-decoration-none">
                                {loading ? "Signing Up..." : "Sign Up"}
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
                                <img src="/img/facebook_icon.svg" alt="facebook" />
                              </Link>
                            </div>

                            <div className="other_signup">
                              <span>
                                Already have an account? <Link href="/login">Login</Link>
                              </span>
                            </div>
                          </Tab.Pane>

                          <Tab.Pane eventKey="Organizer">
                            <Form className="login_field" onSubmit={handleOrganizerSignup}>
                              <Row>
                                <Col md={6}>
                                  <Form.Group className="mb-3">
                                    <Form.Control
                                      type="text"
                                      name="firstName"
                                      placeholder="First Name"
                                      value={organizerData.firstName}
                                      onChange={handleOrganizerChange}
                                      required
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group className="mb-3">
                                    <Form.Control
                                      type="text"
                                      name="lastName"
                                      placeholder="Last Name"
                                      value={organizerData.lastName}
                                      onChange={handleOrganizerChange}
                                      required
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>

                              <Form.Group className="mb-3">
                                <Form.Control
                                  type="email"
                                  name="email"
                                  placeholder="Email"
                                  value={organizerData.email}
                                  onChange={handleOrganizerChange}
                                  required
                                />
                              </Form.Group>

                              <Form.Group className="mb-3">
                                <PhoneInput
                                  defaultCountry="US"
                                  international
                                  countryCallingCodeEditable={false}
                                  value={organizerData.contactNumber}
                                  onChange={(val) => handlePhoneChange(val, "Organizer")}
                                  className="phone_input"
                                />
                              </Form.Group>

                              <Form.Group className="mb-3">
                                <div className="d-flex gap-2 position-relative">
                                  <Form.Control
                                    type={show ? "text" : "password"}
                                    name="password"
                                    placeholder="Password"
                                    value={organizerData.password}
                                    onChange={handleOrganizerChange}
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShow(!show)}
                                    className="password-eye-btn">
                                    <img
                                      src={show ? "/img/lock.svg" : "/img/unlock.svg"}
                                      alt="toggle password"
                                    />
                                  </button>
                                </div>
                              </Form.Group>

                              <Form.Group className="mb-3">
                                <div className="d-flex gap-2 position-relative">
                                  <Form.Control
                                    type={show2 ? "text" : "password"}
                                    name="confirmPassword"
                                    placeholder="Confirm Password"
                                    value={organizerData.confirmPassword}
                                    onChange={handleOrganizerChange}
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShow2(!show2)}
                                    className="password-eye-btn">
                                    <img
                                      src={show2 ? "/img/unlock.svg" : "/img/lock.svg"}
                                      alt="toggle confirm password"
                                    />
                                  </button>
                                </div>
                              </Form.Group>

                              <Form.Group className="mb-3">
                                <Form.Label>Choose Business Type</Form.Label>
                                <Form.Select
                                  name="businessType"
                                  value={organizerData.businessType}
                                  onChange={handleOrganizerChange}
                                  required
                                >
                                  <option value="">Choose Business Type</option>
                                  <option value="react">React</option>
                                  <option value="next">Next.js</option>
                                  <option value="uiux">UI/UX</option>
                                  <option value="frontend">Frontend</option>
                                </Form.Select>
                              </Form.Group>

                              <div
                                className="doc_upload_sec"
                                onClick={() => fileRef.current.click()}
                                style={{ cursor: "pointer" }}
                              >
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
                                        Upload Photo
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

                              <Form.Group className="mb-3">
                                <div className="custom-checkbox">
                                  <input
                                    type="checkbox"
                                    id="terms"
                                    name="acceptTerms"
                                    checked={organizerData.acceptTerms}
                                    onChange={handleOrganizerChange}
                                  />
                                  <label htmlFor="terms">
                                    Accept <span>Terms &amp; Conditions</span>
                                  </label>
                                </div>
                              </Form.Group>

                              <button
                                type="submit"
                                disabled={loading}
                                className="common_btn w-100 d-block text-center text-decoration-none">
                                {loading ? "Signing Up..." : "Sign Up"}
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
                                <img src="/img/facebook_icon.svg" alt="facebook" />
                              </Link>
                            </div>

                            <div className="other_signup">
                              <span>
                                Already have an account? <Link href="/login">Login</Link>
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
