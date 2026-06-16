"use client";
import React, { useState, useRef, useEffect } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import Link from "next/link";
import VerificationModl from "@/components/Modal/VerificationModl";
import authApi from "@/api/authApi";
import toast from "react-hot-toast";
import GuestRoute from "@/components/GuestRoute";
import { useLanguage } from "@/context/LanguageContext";

export default function OTPPage() {
  const { t } = useLanguage();
  const [modalShow, setModalShow] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/");
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    const storedEmail = localStorage.getItem("registerEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  useEffect(() => {
    document.title = `${t("verifyAndContinue")} - Bondy`;
  }, []);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.value !== "" && index < 4) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 5) {
      toast.error(t("pleaseEnterFullOtp"));
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.organizerVerifyOtp({
        email,
        otp: otpValue,
      });

      if (response?.status) {
        // Clear registration email
        localStorage.removeItem("registerEmail");

        const token = response?.data?.token;
        let isApproved = false;
        let hasBusinessDetails = false;
        let user = response?.data?.user;

        // Check if profile is complete to determine next step
        try {
          const profileRes = await authApi.getSelfProfile(token ? {
            headers: { Authorization: `Bearer ${token}` }
          } : {});
          if (profileRes?.status) {
            user = profileRes?.data?.user;
          }
        } catch (err) {
          // ignore
        }

        if (user) {
          isApproved = user.hasBeenApproved === true || user.isVerified === true;
          hasBusinessDetails = !!(
            user.businessName ||
            user.businessCategory ||
            user.shortDesc ||
            user.socialMediaLink
          );
        }

        const isOrganizer = user?.role === "ORGANIZER" || user?.roleId === 2 || user?.organizerVerificationStatus;
        const isUnverifiedOrganizerWithBusiness = isOrganizer && !isApproved && hasBusinessDetails;

        if (isUnverifiedOrganizerWithBusiness) {
          localStorage.removeItem("token");
          localStorage.removeItem("userProfile");
          setRedirectPath("/");
        } else {
          if (token) {
            localStorage.setItem("token", token);
            if (user) {
              localStorage.setItem("userProfile", JSON.stringify(user));
            }
          }
          if (user) {
            if (!user.firstName || !user.lastName) {
              setRedirectPath("/completeprofile");
            } else if (!user.categories || user.categories.length === 0) {
              setRedirectPath("/insterest");
            } else {
              setRedirectPath("/");
            }
          } else {
            setRedirectPath("/completeprofile");
          }
        }
        setModalShow(true);
      }
    } catch (error) {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestRoute>
      <div className="login_sec otp_sec">
        <Container fluid>
          <Row className="justify-content-between align-items-center gy-4 m-0">
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
              <Row className="justify-content-center">
                <Col xl={7} lg={9} md={10}>
                  <div className="common_field">
                    <div className="fz_32">
                      <h2>{t("enterVerificationCode")}</h2>
                      <p>
                        {t("weSentCode")}
                        <br />
                        <span>{email || t("email")}</span>
                      </p>
                    </div>

                    <Form onSubmit={handleVerify}>
                      <div className="otp-container">
                        {otp.map((data, index) => (
                          <input
                            key={index}
                            type="text"
                            maxLength="1"
                            placeholder="—"
                            ref={(el) => (inputRefs.current[index] = el)}
                            value={data}
                            onChange={(e) => handleChange(e.target, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className="otp-input"
                          />
                        ))}
                      </div>

                      <div className="other_signup mb-4">
                        <span>
                          {t("didntReceiveCode")} {" "}
                          <Link href="">{t("resend")}</Link>
                        </span>
                      </div>

                      <button
                        type="submit"
                        className="common_btn w-100 border-0"
                        disabled={loading}
                      >
                        {loading ? t("verifying") : t("verifyAndContinue")}
                      </button>
                    </Form>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
          <VerificationModl
            show={modalShow}
            onHide={() => setModalShow(false)}
            redirectPath={redirectPath}
          />
        </Container>
      </div>
    </GuestRoute>
  );
}
