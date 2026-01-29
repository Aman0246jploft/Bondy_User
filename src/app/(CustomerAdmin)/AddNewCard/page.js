"use client";
import Link from "next/link";
import React from "react";
import { Col, Form, Image, Row } from "react-bootstrap";
import { useState } from "react";

function page() {
  const [showCvv, setShowCvv] = useState(false);
  return (
    <div>
      <div className="cards">
        <div className="card-title">
          <h3>Payment methods</h3>
        </div>
        <Row className="justify-content-between">
          <Col md={6}>
            <div className="payment-type">
              <button className="payment-card-btn" type="button">
                <img src="/img/apple-pay.svg" alt="" />
              </button>
              <button className="payment-card-btn" type="button">
                <img src="/img/visa-card.svg" alt="" />
              </button>
              <button className="payment-card-btn" type="button">
                <img src="/img/bitpay.svg" alt="" />
              </button>
              <button className="payment-card-btn" type="button">
                <img src="/img/google-pay.svg" alt="" />
              </button>
            </div>
            <p className="txt">
              This credit card will be used by default for billing.
            </p>
            <div className="add-card-form">
              <Form>
                <Row>
                  <Col md={12}>
                    <div className="form-floating custom-floting">
                      <input
                        type="text"
                        className="form-control"
                        id="name-card"
                      />
                      <label htmlFor="name-card">Name on card</label>
                    </div>
                  </Col>
                  <Col md={12}>
                    <div className="form-floating custom-floting">
                      <input
                        type="text"
                        className="form-control"
                        id="card-number"
                        value="9870 8890 8890 8890"
                      />
                      <label htmlFor="card-number">Card number</label>
                      <span className="success-icn">
                        <img src="/img/success-icon.svg" alt="" />
                      </span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="form-floating custom-floting">
                      <input
                        type="text"
                        className="form-control"
                        id="expiry"
                        value="16 / 26"
                      />
                      <label htmlFor="expiry">Expiry</label>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="form-floating custom-floting position-relative">
                      <input
                        type={showCvv ? "text" : "password"}
                        className="form-control"
                        id="cvv"
                        value="123"
                        readOnly
                      />

                      <label htmlFor="cvv">CVC / CVV</label>

                      <span
                        className="eye-button"
                        onClick={() => setShowCvv(!showCvv)}
                      >
                        <img
                          src={
                            showCvv ? "/img/eye-hide.svg" : "/img/eye-show.svg"
                          }
                          alt=""
                        />
                      </span>
                    </div>
                  </Col>
                  <Col md={12}>
                    <button className="custom-btn w-100" type="button">
                      Add Card
                    </button>
                  </Col>
                </Row>
              </Form>
            </div>
          </Col>
          <Col md={5}>
            <div className="credit-card-main">
              <div className="credit-card">
                {/* Top Row */}
                <div className="d-flex justify-content-between align-items-start">
                  <h6 className="credit-card-title">Credit Card</h6>

                  <img src="/img/wifi.svg" alt="Visa Logo" />
                </div>

                {/* Chip & Visa */}
                <div className=" mt-3">
                  <img src="/img/chip.png" />
                  {/* <span className="visa-text">VISA</span> */}
                </div>

                {/* Card Number */}
                <div className="card-number mt-4">
                  •••• &nbsp;&nbsp; •••• &nbsp;&nbsp; •••• &nbsp;&nbsp; 8557
                </div>

                {/* Bottom */}
                <div className="d-flex justify-content-between mt-4">
                  <div>
                    <span className="label">CardHolder Name</span>
                    <p className="value">Negar Khosravi</p>
                  </div>

                  <div className="text-end">
                    <span className="label">Expiry date</span>
                    <p className="value">08 / 25</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="add-card-box">
              <Link href="#">
                <img src="/img/Add-Circle.svg" alt="" />
              </Link>
              <h6>Add payment method</h6>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default page;
