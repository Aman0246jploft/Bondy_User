"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Col, Container, Form, Nav, Row, Tab, Modal, Spinner } from "react-bootstrap";
import LanguageSelector from "@/components/LanguageSelector";
import authApi from "@/api/authApi";
import staffApi from "@/api/staffApi";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import GuestRoute from "@/components/GuestRoute";
import { useLanguage } from "@/context/LanguageContext";
import { useGoogleLogin } from "@react-oauth/google";

export default function Page() {
  const router = useRouter();
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Customer");



  useEffect(() => {
    document.title = `${t("login")} - Bondy`;
  }, [t]);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const validateForm = (data) => {
    const newErrors = {};
    const email = data.email.trim();
    const password = data.password.trim();
    if (!email) {
      newErrors.email = t("emailRequired");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = t("pleaseEnterValidEmail");
      }
    }
    if (!password) {
      newErrors.password = t("passwordRequired");
    } else {
      const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$&*~%^()_+=\[\]{};:<>|./?,-]).{8,}$/;
      if (!passwordRegex.test(password)) {
        newErrors.password = t("passwordComplexity");
      }
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const trimmedData = {
      email: formData.email.trim(),
      password: formData.password.trim(),
    };
    setFormData(trimmedData);

    const validationErrors = validateForm(trimmedData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      if (activeTab === "Staff") {
        const response = await staffApi.loginStaff({
          email: trimmedData.email,
          password: trimmedData.password
        });
        if (response?.status) {
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("userProfile", JSON.stringify(response.data.user));
          toast.success("Logged in successfully as Staff");
          router.push("/StaffHome");
        }
      } else {
        const roleType = activeTab === "Organizer" ? "ORGANIZER" : "CUSTOMER";
        const response = await authApi.loginInit({
          email: trimmedData.email,
          password: trimmedData.password,
          type: roleType,
        });
        if (response?.status) {
          localStorage.setItem("loginEmail", trimmedData.email);
          localStorage.setItem("loginType", roleType);
          router.push("/otp?flow=login");
        }
      }
    } catch (error) {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handlePostLoginRedirect = async () => {
    try {
      const profileRes = await authApi.getSelfProfile();
      if (profileRes?.status) {
        const profile = profileRes?.data?.user;
        if (profile) {
          localStorage.setItem("userProfile", JSON.stringify(profile));
        }
        const isOrganizer = profile?.roleId === 2 || profile?.organizerVerificationStatus;

        if (isOrganizer) {
          if (!profile?.businessName || !profile?.businessCategory) {
            return router.push("/completeprofile");
          }
          if (!(profile?.hasBeenApproved || profile?.isVerified)) {
            // Redirect to completeprofile or root where verification modal will be shown
            return router.push("/completeprofile");
          }
          router.push("/");
        } else {
          if (!profile?.firstName || !profile?.lastName) return router.push("/completeprofile");
          if (!profile?.categories || profile?.categories.length === 0) return router.push("/insterest");
          router.push("/");
        }
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
        const userInfo = await userInfoRes.json();
        const roleType = activeTab === "Organizer" ? "ORGANIZER" : "CUSTOMER";
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
          if (response?.data?.token) localStorage.setItem("token", response?.data?.token);
          await handlePostLoginRedirect();
        }
      } catch (error) {
        // handled by interceptor
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => toast.error("Google login failed. Please try again."),
  });



  const SocialButtons = () => (
    <>
      <div className="other_text">
        <span></span>
        <h6>{t("orSignUpWith")}</h6>
        <span></span>
      </div>
      <div className="social_icon">
        {/* Apple — disabled */}
        <button
          type="button"
          disabled
          title="Apple login coming soon"
          style={{ background: "none", border: "none", padding: 0, opacity: 0.4, cursor: "not-allowed" }}
        >
          <img src="/img/app_icon.svg" alt="apple" />
        </button>

        {/* Google — active */}
        <button
          type="button"
          onClick={() => googleLogin()}
          disabled={googleLoading}
          title="Sign in with Google"
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
                  <p>{t("exploreEventsEffortlesslyDesc")}</p>
                </div>
              </div>
            </Col>

            <Col xl={6} lg={5}>
              <Row className="justify-content-center align-items-center">
                <Col xxl={7} xl={9} lg={10} md={12}>
                  <div className="common_field">
                    <div className="fz_32">
                      <h2>{t("goodToSeeYouAgain")}</h2>
                      <p>{t("smartTravelPlans")}</p>
                    </div>

                    <Tab.Container id="Login" activeKey={activeTab} onSelect={(k) => { setActiveTab(k); setErrors({}); }}>
                      <Row>
                        {activeTab !== "Staff" && (
                          <Col sm={12} className="mb-4">
                            <Nav variant="pills" className="custom-nav-pills justify-content-center m-auto">
                              <Nav.Item>
                                <Nav.Link eventKey="Customer">{t("customer")}</Nav.Link>
                              </Nav.Item>
                              <Nav.Item>
                                <Nav.Link eventKey="Organizer">{t("organizer")}</Nav.Link>
                              </Nav.Item>
                            </Nav>
                          </Col>
                        )}

                        <Col sm={12}>
                          <Tab.Content>
                            {/* ── Customer Tab ── */}
                            <Tab.Pane eventKey="Customer">
                              <Form className="login_field" noValidate onSubmit={handleLogin}>
                                <Form.Group className="mb-3" controlId="customerEmail">
                                  <Form.Control type="email" name="email" placeholder={t("email")} value={formData.email} onChange={handleChange} />
                                  {errors.email && (
                                    <div className="text-danger small mt-1">{errors.email}</div>
                                  )}
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="customerPassword">
                                  <div className="d-flex gap-2 position-relative">
                                    <Form.Control type={show ? "text" : "password"} name="password" placeholder={t("enterPassword")} value={formData.password} onChange={handleChange} />
                                    <button type="button" onClick={() => setShow(!show)} className="password-eye-btn">
                                      <img src={show ? "/img/lock.svg" : "/img/unlock.svg"} alt="toggle password" />
                                    </button>
                                  </div>
                                  {errors.password && (
                                    <div className="text-danger small mt-1">{errors.password}</div>
                                  )}
                                </Form.Group>
                                <div className="text-end mb-3">
                                  <Link href="/forgot-password" className="forgot-password">{t("forgotPasswordQuestion")}</Link>
                                </div>
                                <button type="submit" disabled={loading} className="common_btn w-100 d-block text-center text-decoration-none border-0">
                                  {loading ? t("signingIn") : t("signIn")}
                                </button>
                              </Form>
                              <SocialButtons />
                              <div className="other_signup">
                                <span>{" "}{t("dontHaveAccount")}{" "}<Link href="/register">{t("signUp")}</Link></span>
                              </div>
                              <div className="other_signup mt-2">
                                <span>
                                  <Link href="/" className="text-decoration-underline" style={{ color: "#23ada4" }}>
                                    {t("continueAsGuest")}
                                  </Link>
                                </span>
                              </div>
                              <div className="text-center mt-3 border-top pt-3">
                                <button
                                  type="button"
                                  onClick={() => setActiveTab("Staff")}
                                  className="border-0 bg-transparent text-decoration-underline"
                                  style={{ color: "#23ada4", fontSize: "14px", fontWeight: "500" }}
                                >
                                  {t("loginAsStaff")}
                                </button>
                              </div>
                            </Tab.Pane>

                            {/* ── Organizer Tab ── */}
                            <Tab.Pane eventKey="Organizer">
                              <Form className="login_field" noValidate onSubmit={handleLogin}>
                                <Form.Group className="mb-3" controlId="organizerEmail">
                                  <Form.Control type="email" name="email" placeholder={t("email")} value={formData.email} onChange={handleChange} />
                                  {errors.email && (
                                    <div className="text-danger small mt-1">{errors.email}</div>
                                  )}
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="organizerPassword">
                                  <div className="d-flex gap-2 position-relative">
                                    <Form.Control type={show ? "text" : "password"} name="password" placeholder={t("enterPassword")} value={formData.password} onChange={handleChange} />
                                    <button type="button" onClick={() => setShow(!show)} className="password-eye-btn">
                                      <img src={show ? "/img/lock.svg" : "/img/unlock.svg"} alt="toggle password" />
                                    </button>
                                  </div>
                                  {errors.password && (
                                    <div className="text-danger small mt-1">{errors.password}</div>
                                  )}
                                </Form.Group>
                                <div className="text-end mb-3">
                                  <Link href="/forgot-password" className="forgot-password">{t("forgotPasswordQuestion")}</Link>
                                </div>
                                <button type="submit" disabled={loading} className="common_btn w-100 d-block text-center text-decoration-none border-0">
                                  {loading ? t("signingIn") : t("signIn")}
                                </button>
                              </Form>
                              <SocialButtons />
                              <div className="other_signup">
                                <span>{" "}{t("dontHaveAccount")}{" "}<Link href="/register">{t("signUp")}</Link></span>
                              </div>
                              <div className="other_signup mt-2">
                                <span>
                                  <Link href="/" className="text-decoration-underline" style={{ color: "#23ada4" }}>
                                    {t("continueAsGuest")}
                                  </Link>
                                </span>
                              </div>
                              <div className="text-center mt-3 border-top pt-3">
                                <button
                                  type="button"
                                  onClick={() => setActiveTab("Staff")}
                                  className="border-0 bg-transparent text-decoration-underline"
                                  style={{ color: "#23ada4", fontSize: "14px", fontWeight: "500" }}
                                >
                                  {t("loginAsStaff")}
                                </button>
                              </div>
                            </Tab.Pane>

                            {/* ── Staff Tab ── */}
                            <Tab.Pane eventKey="Staff">
                              <Form className="login_field" noValidate onSubmit={handleLogin}>
                                <Form.Group className="mb-3" controlId="staffEmail">
                                  <Form.Control type="email" name="email" placeholder={t("email")} value={formData.email} onChange={handleChange} />
                                  {errors.email && (
                                    <div className="text-danger small mt-1">{errors.email}</div>
                                  )}
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="staffPassword">
                                  <div className="d-flex gap-2 position-relative">
                                    <Form.Control type={show ? "text" : "password"} name="password" placeholder={t("enterPassword")} value={formData.password} onChange={handleChange} />
                                    <button type="button" onClick={() => setShow(!show)} className="password-eye-btn">
                                      <img src={show ? "/img/lock.svg" : "/img/unlock.svg"} alt="toggle password" />
                                    </button>
                                  </div>
                                  {errors.password && (
                                    <div className="text-danger small mt-1">{errors.password}</div>
                                  )}
                                </Form.Group>
                                <div className="text-end mb-3">
                                  <Link href="/forgot-password?role=staff" className="forgot-password">
                                    {t("forgotPasswordQuestion")}
                                  </Link>
                                </div>
                                <button type="submit" disabled={loading} className="common_btn w-100 d-block text-center text-decoration-none border-0 mt-3">
                                  {loading ? t("signingIn") : t("signIn")}
                                </button>
                              </Form>
                              <div className="text-center mt-4 border-top pt-3">
                                <button
                                  type="button"
                                  onClick={() => setActiveTab("Customer")}
                                  className="border-0 bg-transparent text-decoration-underline"
                                  style={{ color: "#23ada4", fontSize: "14px", fontWeight: "500" }}
                                >
                                  {t("backToUserLogin")}
                                </button>
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
