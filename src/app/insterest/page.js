"use client";
import InterestSelector from "@/components/InterestSelector";
import Link from "next/link";
import React, { useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function DittoDesign() {
  const [startDate, setStartDate] = useState(new Date());

  return (
    <div className="login_sec compplete_profile_sec">
      <Container fluid>
        <Row className="justify-content-between align-items-center gy-4">
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
            <Row className="justify-content-center align-items-center">
              <Col xl={7} lg={9} md={12}>
                <div className="fz_32">
                  <h2 className="">Interest Categories</h2>
                  <p>
                    Tell us what you’re interested in. We’ll customize things
                    just for you.
                  </p>
                </div>
                <main>
                  <InterestSelector />
                  <Link href="/Personalinfo" className="common_btn w-100 mt-4">
                    Continue
                  </Link>
                </main>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
