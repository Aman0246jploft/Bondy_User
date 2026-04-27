"use client";
import Link from "next/link";
import React, { useState,useEffect } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import authApi from "@/api/authApi";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import GuestRoute from "@/components/GuestRoute";
import { useLanguage } from "@/context/LanguageContext";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const { t } = useLanguage();

 useEffect(() => {
  document.title = `${t("forgotPasswordQuestion")} - Bondy`;
}, [t]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error(t("pleaseEnterEmail"));
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.forgotPasswordInit({ email });

      if (response?.status) {
        // Store email for the reset password page
        localStorage.setItem("resetEmail", email);
        toast.success(t("otpSentToEmail"));
        router.push("/reset-password");
      }
    } catch (error) {
      // Error handled by apiClient interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestRoute>
    <div className="login_sec">
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
                    <h2>{t("forgotPasswordQuestion")}</h2>
                    <p>{t("noWorriesEnterEmail")}</p>
                  </div>

                  <Form className="login_field" noValidate onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="email">
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder={t("enterYourEmail")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-required="true"
                      />
                    </Form.Group>

                    <button
                      type="submit"
                      disabled={loading}
                      className="common_btn w-100 d-block text-center text-decoration-none border-0"
                    >
                      {loading ? t("sending") : t("sendVerificationCode")}
                    </button>
                  </Form>

                  <div className="other_signup mt-4">
                    <span>
                      {t("rememberPassword")} {" "}
                      <Link href="/login">{t("backToLogin")}</Link>
                    </span>
                  </div>
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
