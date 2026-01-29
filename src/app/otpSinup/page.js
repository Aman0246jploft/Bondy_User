"use client";
import React, { useState, useRef } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import Link from "next/link";
import VerificationModl from "@/components/Modal/VerificationModl";

export default function OTPPage() {
  const [modalShow, setModalShow] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const inputRefs = useRef([]);

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

  return (
    <div className="login_sec otp_sec">
      <Container fluid>
        <Row className="justify-content-between align-items-center gy-4 m-0">
          <Col xl={5} lg={7}>
            <div className="login_img">
              <img src="/img/login_side_img.png" />
              <div className="content_img_box">
                <h4>Explore Events Effortlessly</h4>
                <p>
                  Discover, book, and track events seamlessly with calendar
                  integration and personalized event curation{" "}
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
                      <span>sara.cruz@example.com</span>
                    </p>
                  </div>

                  <Form>
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
                  </Form>

                  <div className="other_signup mb-4">
                    <span>
                      {" "}
                      Didn’t receive the code? <Link href="">Resend</Link>
                    </span>
                  </div>

                  <Link
                    href=""
                    className="common_btn w-100"
                    onClick={() => setModalShow(true)}>
                    Verify & Continue
                  </Link>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
        <VerificationModl show={modalShow} onHide={() => setModalShow(false)} />
      </Container>
    </div>
  );
}
