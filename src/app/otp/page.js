"use client";
import React, { useState, useRef, useEffect, Suspense } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import authApi from "@/api/authApi";
import toast from "react-hot-toast";
import GuestRoute from "@/components/GuestRoute";
import VerificationModl from "@/components/Modal/VerificationModl";

function OTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/");
  const inputRefs = useRef([]);

  useEffect(() => {
    document.title = "OTP - Bondy";
  }, []);

  useEffect(() => {
    const flow = searchParams.get("flow");
    const storedEmail = flow === "login"
      ? localStorage.getItem("loginEmail")
      : localStorage.getItem("registerEmail");

    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, [searchParams]);

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

    const flow = searchParams.get("flow");
    const type = flow === "login"
      ? "LOGIN"
      : localStorage.getItem("registerType");

    setLoading(true);
    try {
      const response = await authApi.verifyUniversalOtp({
        email,
        otp: otpValue,
        type: type || "CUSTOMER",
      });

      if (response.status) {
        // Clear stored data
        if (flow === "login") {
          localStorage.removeItem("loginEmail");
          localStorage.removeItem("loginType");
        } else {
          localStorage.removeItem("registerEmail");
          localStorage.removeItem("registerType");
        }

        // Save token
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }

        // Determine destination
        let nextPath = "/";
        try {
          const profileRes = await authApi.getSelfProfile();
          if (profileRes.status) {
            const profile = profileRes.data.user;
            if (!profile.firstName || !profile.lastName) {
              nextPath = "/completeprofile";
            } else if (!profile.categories || profile.categories.length === 0) {
              nextPath = "/insterest";
            } else {
              nextPath = "/";
            }
          } else {
            nextPath = "/completeprofile";
          }
        } catch (err) {
          console.error("Profile check failed:", err);
          nextPath = "/completeprofile";
        }

        if (flow === "signup") {
          setRedirectPath(nextPath);
          setModalShow(true);
        } else {
          router.push(nextPath);
        }
      }
    } catch (error) {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email not found");
      return;
    }

    const flow = searchParams.get("flow");
    const type = flow === "login"
      ? "LOGIN"
      : localStorage.getItem("registerType");

    try {
      const response = await authApi.resendUniversalOtp({
        email,
        type: type || "CUSTOMER"
      });
      if (response.status) {
        toast.success("OTP resent successfully");
      }
    } catch (error) {
      // error handled by apiClient
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
                          Didn’t receive the code?{" "}
                          <Link href="#" onClick={handleResend}>
                            Resend
                          </Link>
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
    </GuestRoute>
  );
}

export default function OTPPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OTPContent />
    </Suspense>
  );
}

