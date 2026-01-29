"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Tab from "react-bootstrap/Tab";
import { Container } from "react-bootstrap";
import SessionCart from "@/components/SessionCart";
import VerifyDropdwons from "@/components/VerifyDropdwons";
import Footer from "@/components/Footer";
import GiveRating from "@/components/Modal/GiveRating";

export default function page() {
  const [modalShow, setModalShow] = useState(false);
  return (
    <>
      <Header />
      <div className="profile-page">
        <div className="profile_cover">
          <img
            src="/img/profile_cover.png"
            alt="Background"
            className="banner-img"
          />
        </div>

        <Container>
          <div className="profile-content-wrapper">
            <div className="row align-items-start">
              <div className="col-auto">
                <div className="profile-image-box">
                  <img src="/img/profile_img.png" alt="Esther Howard" />
                </div>
              </div>

              <div className="col">
                <div className="user_profile_content">
                  <div className="user-info">
                    <h2 className="user-name">
                      Esther Howard
                      <span className="verified-badge">
                        <VerifyDropdwons />
                      </span>
                    </h2>
                    <p className="designation">Concert Organizer Ulaanbaatar</p>
                    <div className="stats-row">
                      <span className="me-3">
                        {" "}
                        <img src="/img/event_icon_01.svg" />
                        50+ Events Hosted
                      </span>
                      <span className="me-3">
                        <img src="/img/user_icon.svg" /> 1.2K Followers
                      </span>
                      <span>
                        <img src="/img/star-icon.svg" /> 4/5 Rating
                      </span>
                    </div>
                  </div>

                  <div className="action-buttons">
                    <button
                      className="btn-message"
                      onClick={() => setModalShow(true)}>
                      <img src="/img/star-icon.svg" /> Give Rating
                    </button>
                    <button className="btn-follow">
                      <img src="/img/User_plus.svg" /> Follow
                    </button>

                    <button className="btn-message">
                      <img src="/img/message.svg" /> Messages
                    </button>
                  </div>
                </div>

                {/* Statistics */}

                <div className="about-section mt-4">
                  <h4 className="about-title">About me</h4>
                  <p className="about-text">
                    I'm an event organizer dedicated to creating memorable and
                    well-managed experiences. From planning to execution, I
                    focus on delivering events that run smoothly and exceed
                    expectations. I work closely with vendors, partners, and
                    attendees to ensure every detail is handled with care. This
                    platform helps me manage events, track performance, and
                    connect with the right audience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <div className="new_session_sec">
        <Container>
          <div>
            <Tab.Container id="left-tabs-example" defaultActiveKey="first">
              <Row>
                <Col sm={12}>
                  <Nav variant="pills">
                    <Nav.Item>
                      <Nav.Link eventKey="first">Concert</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="second">Music</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="Third">Art</Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Col>
                <Col sm={12}>
                  <Tab.Content>
                    <Tab.Pane eventKey="first">
                      <SessionCart type="NextSession" />
                      <SessionCart type="PastSessions" />
                    </Tab.Pane>
                    <Tab.Pane eventKey="second">
                      <SessionCart type="NextSession" />
                      <SessionCart type="PastSessions" />
                    </Tab.Pane>
                    <Tab.Pane eventKey="Third">
                      <SessionCart type="NextSession" />
                      <SessionCart type="PastSessions" />
                    </Tab.Pane>
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>
          </div>
        </Container>
      </div>

      <Footer />
      <GiveRating show={modalShow} onHide={() => setModalShow(false)} />
    </>
  );
}
