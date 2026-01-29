"use client";
import React, { useState, useRef, useEffect } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import Link from "next/link";
import VerificationModl from "@/components/Modal/VerificationModl";
import authApi from "@/api/authApi";
import toast from "react-hot-toast";

export default function OTPPage() {
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
      toast.error("Please enter full OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.organizerVerifyOtp({
        email,
        otp: otpValue,
      });

      if (response.status) {
        // Clear registration email
        localStorage.removeItem("registerEmail");
        // Save token if returned
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }

        // Check if profile is complete to determine next step
        try {
          const profileRes = await authApi.getSelfProfile();
          if (profileRes.status && profileRes.data.profile.firstName && profileRes.data.profile.lastName) {
            setRedirectPath("/");
          } else {
            setRedirectPath("/completeprofile");
          }
        } catch (err) {
          setRedirectPath("/completeprofile");
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
    <div className="login_sec otp_sec">
      <Container fluid>
        <Row className="justify-content-between align-items-center gy-4 m-0">
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
            <Row className="justify-content-center">
              <Col xl={7} lg={9} md={10}>
                <div className="common_field">
                  <div className="fz_32">
                    <h2>Enter code</h2>
                    <p>
                      We sent a verification code to your email
                      <br />
                      <span>{email || "your email"}</span>
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
                        Didn’t receive the code? <Link href="">Resend</Link>
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="common_btn w-100 border-0"
                      disabled={loading}
                    >
                      {loading ? "Verifying..." : "Verify & Continue"}
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
  );
}
