"use client";
import { Container, Row, Col, Button } from "react-bootstrap";
import Header from "@/components/Header";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import EventSection from "@/components/EventSection";
import EventGallery from "@/components/EventGallery";
import EventEaseUI from "@/components/EventEaseUI";

export default function page() {
  const images = [
    "/img/interactive-process-image-1.png",
    "/img/interactive-process-image-2.png",
    "/img/interactive-process-image-4.png",
    "/img/interactive-process-image-1.png",
  ];

  return (
    <>
      <Header />
      <div className="event-page-wrapper">
        <Container>
          <Row className="align-items-start mb-5">
            <Col lg={7} className="mb-4">
              <div className="header-box">
                <h1 className="event-title">
                  Create & Manage Your
                  <br /> Events in One Place
                </h1>
              </div>
            </Col>

            <Col lg={5} className="">
              <p className="event-desc mb-4">
                Tech Event 2026 showcases groundbreaking innovations, featuring
                keynote talks, interactive workshops, and networking sessions
                for tech enthusiasts and industry leaders.
              </p>
            </Col>
          </Row>
        </Container>

        <EventGallery />

        <div className="pt_70">
          <Container>
            <Row className="align-items-start mb-5">
              <Col lg={7} className="mb-4">
                <div className="header-box">
                  <h1 className="event-title">
                    Why Create Events <br /> With Us?
                  </h1>
                </div>
              </Col>

              <Col lg={5} className="">
                <p className="event-desc mb-4">
                  Tech Event 2026 showcases groundbreaking innovations,
                  featuring keynote talks, interactive workshops, and networking
                  sessions for tech enthusiasts and industry leaders.
                </p>
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      <section className="mb-4">
        <Container>
          <Row className="g-4 justify-content-between align-items-center">
            <Col lg={4} className="order-1 order-lg-1">
              <div className="creatEvent_img">
                <img src="/img/creatEvent_Img01.png" />
              </div>
            </Col>

            <Col lg={6} className="order-2 order-lg-2">
              <div className="reatEvent_text">
                <h3>Easy Event Creation</h3>
                <p>
                  {" "}
                  Create and publish events in just a few minutes using our
                  simple and intuitive form. No technical knowledge required —
                  everything is quick and hassle-free.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      <section className="mb-4">
        <Container>
          <Row className="g-4 justify-content-between align-items-center">
            <Col lg={6} className="order-2 order-lg-1">
              <div className="reatEvent_text">
                <h3>Manage Attendees</h3>
                <p>
                  {" "}
                  Easily track registrations, check attendee details and monitor
                  event attendance. All participant information is available in
                  one organized dashboard.
                </p>
              </div>
            </Col>
            <Col lg={4} className="order-1 order-lg-2">
              <div className="creatEvent_img">
                <img src="/img/creatEvent_Img02.png" />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="mb-4 ">
        <Container>
          <Row className="g-4 justify-content-between align-items-center">
            <Col lg={4} className="order-1 order-lg-1">
              <div className="creatEvent_img">
                <img src="/img/creatEvent_Img03.png" />
              </div>
            </Col>

            <Col lg={6} className="order-2 order-lg-2">
              <div className="reatEvent_text">
                <h3>Event Promotion</h3>
                <p>
                  {" "}
                  Get your events featured and discovered by users on our
                  platform. Boost visibility and attract more participants
                  without extra marketing effort.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      <section className="mb-lg-5">
        <Container>
          <Row className="g-4 justify-content-between align-items-center">
            <Col lg={6} className="order-2 order-lg-1">
              <div className="reatEvent_text">
                <h3>Earn More</h3>
                <p>
                  {" "}
                  Sell tickets and programs directly through our platform with
                  secure payments. Increase your revenue by reaching a wider and
                  targeted audience.
                </p>
              </div>
            </Col>
            <Col lg={4} className="order-1 order-lg-2">
              <div className="creatEvent_img">
                <img src="/img/creatEvent_Img04.png" />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <EventEaseUI />

      <section className="what_create_sc">
        <Container>
          <div className="what_create_Inner event-page-wrapper">
            <Row className="align-items-start mb-5">
              <Col lg={7} className="mb-4">
                <div className="header-box">
                  <h1 className="event-title">
                    What You Can
                    <br /> Create
                  </h1>
                </div>
              </Col>

              <Col lg={5} className="">
                <p className="event-desc mb-4">
                  Create technology-focused events featuring keynote sessions,
                  interactive workshops, and networking opportunities for
                  industry professionals and enthusiasts.
                </p>
              </Col>
            </Row>

            <Row>
              <Col lg={4}>
                <div className="what_create_Card">
                  <h2>Workshops & Seminars</h2>
                  <p>
                    Host professional learning sessions with easy registrations.
                  </p>
                </div>
              </Col>
              <Col lg={4}>
                <div className="what_create_Card">
                  <h2>Live Events</h2>
                  <p>Manage concerts, meetups and public events smoothly.</p>
                </div>
              </Col>
              <Col lg={4}>
                <div className="what_create_Card">
                  <h2>Training Programs</h2>
                  <p>Run structured training programs with flexible pricing.</p>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      <div className="details_fq">
        <FAQ />
      </div>
      <EventSection
        type="recommended"
        limit={4}
        showSeeAll={false}
        customTitle="Events You May Like"
      />
      <Footer />
    </>
  );
}
