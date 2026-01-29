import Link from "next/link";
import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";

const EventEaseUI = () => {
  return (
    <div className="eventEase-section">
      <Container>
        <div className="eventEaseBox">
          <Row>
            <Col lg={6}>
              <div className="main_title">
                <h2>How It Works</h2>
                <p>
                  Getting started with EventEase is easy. Follow these simple
                  steps to discover and attend amazing events.
                </p>
              </div>
            </Col>
          </Row>

          <Row className="align-items-center justify-content-between">
            <Col lg={6}>
              <div className="step-container icon_arrow">
                <div className="icon-wrapper">
                  <img src="/img/how_icon01.svg" />
                </div>
                <div>
                  <h3 className="step-heading">Register as Organizer</h3>
                  <p className="step-text">
                    Create your organizer account in just a few simple steps.
                  </p>
                </div>
              </div>
              <div className="step-container icon_arrow">
                <div className="icon-wrapper">
                  <img src="/img/how_icon02.svg" />
                </div>
                <div>
                  <h3 className="step-heading">Create Event / Program</h3>
                  <p className="step-text">
                    Add event details like title, date, location, pricing and
                    schedule.
                  </p>
                </div>
              </div>
              <div className="step-container icon_arrow">
                <div className="icon-wrapper">
                  <img src="/img/how_icon03.svg" />
                </div>
                <div>
                  <h3 className="step-heading">Publish & Promote</h3>
                  <p className="step-text">
                    Publish your event and make it visible to your audience
                    instantly.
                  </p>
                </div>
              </div>
              <div className="step-container mb-0">
                <div className="icon-wrapper">
                  <img src="/img/how_icon04.svg" />
                </div>
                <div>
                  <h3 className="step-heading">Manage & Track</h3>
                  <p className="step-text">
                    Track registrations, attendees, earnings and event
                    performance in one dashboard.
                  </p>
                </div>
              </div>
            </Col>

            <Col lg={5}>
              <div className="image-mosaic">
                <img src="/img/side_img_easeui.png" />
              </div>
            </Col>
          </Row>
        </div>
        <Row className="justify-content-center">
          <Col lg={10}>
            <div className="cta-box">
              <h2 className="cta-title">Ready to Get Started?</h2>
              <p className="cta-desc">
                Join thousands of event enthusiasts who've discovered their next
                favorite experience.
              </p>
              <Link href="/Explore" className="btn-teal">
                Start Exploring Events
              </Link>
              <Link href="" className="btn-white">
                Create Your First Event
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EventEaseUI;
