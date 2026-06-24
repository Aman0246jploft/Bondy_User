"use client";
import Link from "next/link";
import React, { useEffect, useRef, useState, Suspense } from "react";
import { Col, Container, Form, Nav, Row, Tab } from "react-bootstrap";
import LanguageSelector from "@/components/LanguageSelector";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumber } from "react-phone-number-input";
import authApi from "@/api/authApi";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import GuestRoute from "@/components/GuestRoute";
import { useLanguage } from "@/context/LanguageContext";
import { useGoogleLogin } from "@react-oauth/google";

const STRONG_PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$&*~%^()_+=\[\]{};:<>|./?,-]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const [selectedTab, setSelectedTab] = useState("Customer");
  const [show2, setShow2] = useState(false);
  const [show, setShow] = useState(false);
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [customerErrors, setCustomerErrors] = useState({});
  const [organizerErrors, setOrganizerErrors] = useState({});

  // Customer Form State
  const [customerData, setCustomerData] = useState({
    email: "",
    contactNumber: "",
    countryCode: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
    acceptTerms: false,
  });

  // Organizer Form State
  const [organizerData, setOrganizerData] = useState({
    fullname: "",
    email: "",
    contactNumber: "",
    countryCode: "",
    password: "",
    confirmPassword: "",
    businessType: "",
    acceptTerms: false,
    documents: [],
    referralCode: "",
  });

  // Pre-fill referral code from URL param (?ref=CODE)
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setOrganizerData((prev) => ({ ...prev, referralCode: refCode }));
      setCustomerData((prev) => ({ ...prev, referralCode: refCode }));
    }
  }, [searchParams]);

  const validatePassword = (password) => {
    if (!password) return t("passwordRequired");
    if (!STRONG_PASSWORD_REGEX.test(password)) return t("passwordComplexity");
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) return t("emailRequired");
    if (!EMAIL_REGEX.test(email.trim())) return t("invalidEmail");
    return "";
  };

  const validateCustomerForm = (data) => {
    const errors = {};
    const emailError = validateEmail(data.email);
    if (emailError) errors.email = emailError;
    if (!data.contactNumber) errors.contactNumber = t("contactNumberRequired");

    const passwordError = validatePassword(data.password);
    if (passwordError) errors.password = passwordError;

    if (!data.confirmPassword) {
      errors.confirmPassword = t("confirmPasswordRequired");
    } else if (data.password !== data.confirmPassword) {
      errors.confirmPassword = t("passwordsNotMatch");
    }

    if (!data.acceptTerms) errors.acceptTerms = t("acceptTerms");

    return errors;
  };

  const validateOrganizerForm = (data) => {
    const errors = {};
    if (!data.fullname?.trim()) errors.fullname = t("fullNameRequired") || "Full Name is required";

    const emailError = validateEmail(data.email);
    if (emailError) errors.email = emailError;

    if (!data.contactNumber) errors.contactNumber = t("contactNumberRequired");

    const passwordError = validatePassword(data.password);
    if (passwordError) errors.password = passwordError;

    if (!data.confirmPassword) {
      errors.confirmPassword = t("confirmPasswordRequired");
    } else if (data.password !== data.confirmPassword) {
      errors.confirmPassword = t("passwordsNotMatch");
    }

    if (!data.acceptTerms) errors.acceptTerms = t("acceptTerms");

    return errors;
  };

  const handleCustomerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustomerData((prev) => {
      const nextValue = type === "checkbox" ? checked : value;
      const next = { ...prev, [name]: nextValue };
      const nextErrors = { ...customerErrors };

      if (name === "email") {
        nextErrors.email = validateEmail(value);
      }

      if (name === "password") {
        nextErrors.password = validatePassword(value);
        if (next.confirmPassword) {
          nextErrors.confirmPassword =
            value === next.confirmPassword ? "" : t("passwordsNotMatch");
        }
      }

      if (name === "confirmPassword") {
        nextErrors.confirmPassword = value
          ? value === next.password
            ? ""
            : t("passwordsNotMatch")
          : t("confirmPasswordRequired");
      }

      if (name === "acceptTerms") {
        nextErrors.acceptTerms = checked ? "" : t("acceptTerms");
      }

      setCustomerErrors(nextErrors);
      return next;
    });
  };

  const handleOrganizerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOrganizerData((prev) => {
      const nextValue = type === "checkbox" ? checked : value;
      const next = {
        ...prev,
        [name]: nextValue,
      };
      const nextErrors = { ...organizerErrors };

      if (name === "fullname") nextErrors.fullname = value.trim() ? "" : (t("fullNameRequired") || "Full Name is required");
      if (name === "email") nextErrors.email = validateEmail(value);
      if (name === "password") {
        nextErrors.password = validatePassword(value);
        if (next.confirmPassword) {
          nextErrors.confirmPassword =
            value === next.confirmPassword ? "" : t("passwordsNotMatch");
        }
      }
      if (name === "confirmPassword") {
        nextErrors.confirmPassword = value
          ? value === next.password
            ? ""
            : t("passwordsNotMatch")
          : t("confirmPasswordRequired");
      }
      if (name === "acceptTerms") {
        nextErrors.acceptTerms = checked ? "" : t("acceptTerms");
      }

      setOrganizerErrors(nextErrors);
      return next;
    });
  };

  const handlePhoneChange = (value, role) => {
    if (role === "Customer") {
      setCustomerData((prev) => ({ ...prev, contactNumber: value }));
      setCustomerErrors((prev) => ({
        ...prev,
        contactNumber: value ? "" : t("contactNumberRequired"),
      }));
    } else {
      setOrganizerData((prev) => ({ ...prev, contactNumber: value }));
      setOrganizerErrors((prev) => ({
        ...prev,
        contactNumber: value ? "" : t("contactNumberRequired"),
      }));
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
      if (response?.status) {
        setOrganizerData((prev) => ({
          ...prev,
          documents: response?.data?.files.map((uploadedFile) => ({
            file: uploadedFile,
            name: "Business Proof",
          })),
        }));
      }
    } catch (error) {
      // toast handled by interceptor
    }
  };

  const handleCustomerSignup = async (e) => {
    e.preventDefault();

    const trimmedData = {
      email: customerData.email ? customerData.email.trim() : "",
      contactNumber: customerData.contactNumber ? customerData.contactNumber.trim() : "",
      password: customerData.password ? customerData.password.trim() : "",
      confirmPassword: customerData.confirmPassword ? customerData.confirmPassword.trim() : "",
      referralCode: customerData.referralCode ? customerData.referralCode.trim() : "",
    };
    setCustomerData((prev) => ({ ...prev, ...trimmedData }));

    const errors = validateCustomerForm({ ...customerData, ...trimmedData });
    setCustomerErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      let finalCountryCode = "+1";
      let finalContactNumber = trimmedData.contactNumber;

      if (trimmedData.contactNumber) {
        const parsed = parsePhoneNumber(trimmedData.contactNumber);
        if (parsed) {
          finalCountryCode = `+${parsed.countryCallingCode}`;
          finalContactNumber = parsed.nationalNumber;
        }
      }

      const payload = {
        email: customerData.email,
        contactNumber: finalContactNumber,
        countryCode: finalCountryCode,
        password: customerData.password,
        confirmPassword: customerData.confirmPassword,
        referralCode: customerData.referralCode,
      };
      const response = await authApi.customerSignup(payload);
      if (response?.status) {
        localStorage.setItem("registerEmail", customerData.email);
        localStorage.setItem("registerType", "CUSTOMER");
        router.push("/otp?flow=signup");
      }
    } catch (error) {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizerSignup = async (e) => {
    e.preventDefault();

    const errors = validateOrganizerForm(organizerData);
    setOrganizerErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      let finalCountryCode = "+1";
      let finalContactNumber = organizerData.contactNumber;

      if (organizerData.contactNumber) {
        const parsed = parsePhoneNumber(organizerData.contactNumber);
        if (parsed) {
          finalCountryCode = `+${parsed.countryCallingCode}`;
          finalContactNumber = parsed.nationalNumber;
        }
      }

      const payload = {
        ...organizerData,
        contactNumber: finalContactNumber,
        countryCode: finalCountryCode,
      };
      const response = await authApi.organizerSignup(payload);
      if (response?.status) {
        localStorage.setItem("registerEmail", organizerData.email);
        localStorage.setItem("registerType", "ORGANIZER");
        router.push("/otp?flow=signup");
      }
    } catch (error) {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = `${t("signUp")} | Bondy`;
  }, [t]);

  const handlePostLoginRedirect = async () => {
    try {
      const profileRes = await authApi.getSelfProfile();
      if (profileRes?.status) {
        const profile = profileRes?.data?.user;
        if (!profile.firstName || !profile.lastName) return router.push("/completeprofile");
        if (!profile.categories || profile.categories.length === 0) return router.push("/insterest");
        router.push("/");
      } else {
        router.push("/completeprofile");
      }
    } catch {
      router.push("/completeprofile");
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!userInfoRes.ok) throw new Error("Failed to fetch Google user info");
        const userInfo = await userInfoRes.json();
        const roleType = selectedTab === "Organizer" ? "ORGANIZER" : "CUSTOMER";
        const response = await authApi.socialLogin({
          socialId: userInfo.sub,
          socialType: "GOOGLE",
          type: roleType,
          email: userInfo.email || "",
          firstName: userInfo.given_name || "",
          lastName: userInfo.family_name || "",
          profileImage: userInfo.picture || "",
        });
        if (response?.status) {
          if (response?.data?.token) localStorage.setItem("token", response.data.token);
          await handlePostLoginRedirect();
        }
      } catch (error) {
        // handled by interceptor
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => toast.error("Google sign-up failed. Please try again."),
  });

  const SocialButtons = () => (
    <>
      <div className="other_text">
        <span></span>
        <h6>{t("orSignInWith")}</h6>
        <span></span>
      </div>
      <div className="social_icon">
        <button
          type="button"
          disabled
          title="Apple login coming soon"
          style={{ background: "none", border: "none", padding: 0, opacity: 0.4, cursor: "not-allowed" }}
        >
          <img src="/img/app_icon.svg" alt="apple" />
        </button>
        <button
          type="button"
          onClick={() => googleLogin()}
          disabled={googleLoading}
          title="Sign up with Google"
          style={{ background: "none", border: "none", padding: 0, opacity: googleLoading ? 0.6 : 1, cursor: "pointer" }}
        >
          <img src="/img/google_icon.svg" alt="google" />
        </button>
      </div>
    </>
  );

  return (
    <GuestRoute>
      <div className="login_sec" style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 1050 }}>
          <LanguageSelector />
        </div>
        <Container fluid>
          <Row className="justify-content-between align-items-center gy-4">
            <Col xl={5} lg={7}>
              <div className="login_img">
                <img src="/img/login_side_img.png" alt="login side" />
                <div className="content_img_box">
                  <h4>{t("exploreEventsEffortlessly")}</h4>
                  <p>
                    {t("exploreEventsEffortlesslyDesc")}
                  </p>
                </div>
              </div>
            </Col>

            <Col xl={6} lg={5}>
              <Row className="justify-content-center align-items-center">
                <Col xxl={7} xl={9} lg={10} md={12}>
                  <div className="common_field">
                    <div className="fz_32">
                      <h2 className="">{t("getStarted")}</h2>
                      <p>
                        {t("registerForEventsDesc")}
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
                            className="custom-nav-pills justify-content-center m-auto"
                          >
                            <Nav.Item>
                              <Nav.Link eventKey="Customer">{t("customer")}</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                              <Nav.Link eventKey="Organizer">{t("organizer")}</Nav.Link>
                            </Nav.Item>
                          </Nav>
                        </Col>

                        <Col sm={12}>
                          <Tab.Content>
                            <Tab.Pane eventKey="Customer">
                              <Form
                                className="login_field"
                                noValidate
                                onSubmit={handleCustomerSignup}
                              >
                                <Form.Group className="mb-3">
                                  <Form.Control
                                    type="email"
                                    name="email"
                                    placeholder={t("email")}
                                    value={customerData.email}
                                    onChange={handleCustomerChange}
                                    aria-required="true"
                                  />
                                  {customerErrors.email && (
                                    <div className="text-danger small mt-1">{customerErrors.email}</div>
                                  )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                  <PhoneInput
                                    country={"us"}
                                    value={customerData.contactNumber}
                                    onChange={(phone) =>
                                      handlePhoneChange("+" + phone, "Customer")
                                    }
                                    inputClass="form-control w-100"
                                    containerClass="phone_input"
                                    dropdownClass="phone_input_dropdown"
                                    buttonClass="phone_input_button"
                                  />
                                  {customerErrors.contactNumber && (
                                    <div className="text-danger small mt-1">{customerErrors.contactNumber}</div>
                                  )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                  <div className="d-flex gap-2 position-relative">
                                    <Form.Control
                                      type={show ? "text" : "password"}
                                      name="password"
                                      placeholder={t("password")}
                                      value={customerData.password}
                                      onChange={handleCustomerChange}
                                      aria-required="true"
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
                                  {customerErrors.password && (
                                    <div className="text-danger small mt-1">{customerErrors.password}</div>
                                  )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                  <div className="d-flex gap-2 position-relative">
                                    <Form.Control
                                      type={show2 ? "text" : "password"}
                                      name="confirmPassword"
                                      placeholder={t("confirmPassword")}
                                      value={customerData.confirmPassword}
                                      onChange={handleCustomerChange}
                                      aria-required="true"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShow2(!show2)}
                                      className="password-eye-btn"
                                    >
                                      <img
                                        src={
                                          show2
                                            ? "/img/lock.svg"
                                            : "/img/unlock.svg"
                                        }
                                        alt="toggle confirm password"
                                      />
                                    </button>
                                  </div>
                                  {customerErrors.confirmPassword && (
                                    <div className="text-danger small mt-1">{customerErrors.confirmPassword}</div>
                                  )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                  <div className="custom-checkbox">
                                    <input
                                      type="checkbox"
                                      id="terms-customer"
                                      name="acceptTerms"
                                      checked={customerData.acceptTerms}
                                      onChange={handleCustomerChange}
                                    />
                                    <label htmlFor="terms-customer">
                                      {language === "mn" ? (
                                        <>
                                          Би{" "}
                                          <Link
                                            href="/terms"
                                            target="_blank"
                                            className="text-decoration-underline text-primary"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            Үйлчилгээний нөхцөл
                                          </Link>{" "}
                                          болон{" "}
                                          <Link
                                            href="/privacy-policy"
                                            target="_blank"
                                            className="text-decoration-underline text-primary"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            Нууцлалын бодлогыг
                                          </Link>{" "}
                                          зөвшөөрч байна
                                        </>
                                      ) : (
                                        <>
                                          I agree to the{" "}
                                          <Link
                                            href="/terms"
                                            target="_blank"
                                            className="text-decoration-underline text-primary"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            Terms & Conditions
                                          </Link>{" "}
                                          and{" "}
                                          <Link
                                            href="/privacy-policy"
                                            target="_blank"
                                            className="text-decoration-underline text-primary"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            Privacy Policy
                                          </Link>
                                        </>
                                      )}
                                    </label>
                                  </div>
                                  {customerErrors.acceptTerms && (
                                    <div className="text-danger small mt-1">{customerErrors.acceptTerms}</div>
                                  )}
                                </Form.Group>

                                <button
                                  type="submit"
                                  disabled={loading}
                                  className="common_btn w-100 d-block text-center text-decoration-none"
                                >
                                  {loading ? t("signingUp") : t("signUp")}
                                </button>
                              </Form>

                              <SocialButtons />

                              <div className="other_signup">
                                <span>
                                  {t("alreadyHaveAccount")}{" "}
                                  <Link href="/login">{t("login")}</Link>
                                </span>
                              </div>
                              <div className="other_signup mt-2">
                                <span>
                                  <Link href="/" className="text-decoration-underline" style={{ color: "#23ada4" }}>
                                    {t("continueAsGuest")}
                                  </Link>
                                </span>
                              </div>
                            </Tab.Pane>

                            <Tab.Pane eventKey="Organizer">
                              <Form
                                className="login_field"
                                noValidate
                                onSubmit={handleOrganizerSignup}
                              >
                                <Form.Group className="mb-3">
                                  <Form.Control
                                    type="text"
                                    name="fullname"
                                    placeholder={t("fullName") || "Full Name"}
                                    value={organizerData.fullname || ""}
                                    onChange={handleOrganizerChange}
                                    aria-required="true"
                                  />
                                  {organizerErrors.fullname && (
                                    <div className="text-danger small mt-1">{organizerErrors.fullname}</div>
                                  )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                  <Form.Control
                                    type="email"
                                    name="email"
                                    placeholder={t("email")}
                                    value={organizerData.email}
                                    onChange={handleOrganizerChange}
                                    aria-required="true"
                                  />
                                  {organizerErrors.email && (
                                    <div className="text-danger small mt-1">{organizerErrors.email}</div>
                                  )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                  <PhoneInput
                                    country={"us"}
                                    value={organizerData.contactNumber}
                                    onChange={(phone) =>
                                      handlePhoneChange("+" + phone, "Organizer")
                                    }
                                    inputClass="form-control w-100"
                                    containerClass="phone_input"
                                    dropdownClass="phone_input_dropdown"
                                    buttonClass="phone_input_button"
                                  />
                                  {organizerErrors.contactNumber && (
                                    <div className="text-danger small mt-1">{organizerErrors.contactNumber}</div>
                                  )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                  <div className="d-flex gap-2 position-relative">
                                    <Form.Control
                                      type={show ? "text" : "password"}
                                      name="password"
                                      placeholder={t("password")}
                                      value={organizerData.password}
                                      onChange={handleOrganizerChange}
                                      aria-required="true"
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
                                  {organizerErrors.password && (
                                    <div className="text-danger small mt-1">{organizerErrors.password}</div>
                                  )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                  <div className="d-flex gap-2 position-relative">
                                    <Form.Control
                                      type={show2 ? "text" : "password"}
                                      name="confirmPassword"
                                      placeholder={t("confirmPassword")}
                                      value={organizerData.confirmPassword}
                                      onChange={handleOrganizerChange}
                                      aria-required="true"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShow2(!show2)}
                                      className="password-eye-btn"
                                    >
                                      <img
                                        src={
                                          show2
                                            ? "/img/lock.svg"
                                            : "/img/unlock.svg"
                                        }
                                        alt="toggle confirm password"
                                      />
                                    </button>
                                  </div>
                                  {organizerErrors.confirmPassword && (
                                    <div className="text-danger small mt-1">{organizerErrors.confirmPassword}</div>
                                  )}
                                </Form.Group>

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
                                      {language === "mn" ? (
                                        <>
                                          Би{" "}
                                          <Link
                                            href="/terms"
                                            target="_blank"
                                            className="text-decoration-underline text-primary"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            Үйлчилгээний нөхцөл
                                          </Link>{" "}
                                          болон{" "}
                                          <Link
                                            href="/privacy-policy"
                                            target="_blank"
                                            className="text-decoration-underline text-primary"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            Нууцлалын бодлогыг
                                          </Link>{" "}
                                          зөвшөөрч байна
                                        </>
                                      ) : (
                                        <>
                                          I agree to the{" "}
                                          <Link
                                            href="/terms"
                                            target="_blank"
                                            className="text-decoration-underline text-primary"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            Terms & Conditions
                                          </Link>{" "}
                                          and{" "}
                                          <Link
                                            href="/privacy-policy"
                                            target="_blank"
                                            className="text-decoration-underline text-primary"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            Privacy Policy
                                          </Link>
                                        </>
                                      )}
                                    </label>
                                  </div>
                                  {organizerErrors.acceptTerms && (
                                    <div className="text-danger small mt-1">{organizerErrors.acceptTerms}</div>
                                  )}
                                </Form.Group>

                                <button
                                  type="submit"
                                  disabled={loading}
                                  className="common_btn w-100 d-block text-center text-decoration-none"
                                >
                                  {loading ? t("signingUp") : t("signUp")}
                                </button>
                              </Form>

                              <SocialButtons />

                              <div className="other_signup">
                                <span>
                                  {t("alreadyHaveAccount")}{" "}
                                  <Link href="/login">{t("login")}</Link>
                                </span>
                              </div>
                              <div className="other_signup mt-2">
                                <span>
                                  <Link href="/" className="text-decoration-underline" style={{ color: "#23ada4" }}>
                                    {t("continueAsGuest")}
                                  </Link>
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
    </GuestRoute>
  );
}


export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
