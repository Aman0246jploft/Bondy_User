"use client";
import { Container, Row, Col, Button } from "react-bootstrap";
import Header from "@/components/Header";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import EventSection from "@/components/EventSection";
import EventGallery from "@/components/EventGallery";
import EventEaseUI from "@/components/EventEaseUI";
import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function page() {
  const { t } = useLanguage();
  const images = [
    "/img/interactive-process-image-1.png",
    "/img/interactive-process-image-2.png",
    "/img/interactive-process-image-4.png",
    "/img/interactive-process-image-1.png",
  ];

  useEffect(() => {
  document.title = t("organizersPageTitle");
}, []);

  return (
    <>
      <Header />
      <div className="event-page-wrapper">
        <Container>
          <Row className="align-items-start mb-5">
            <Col lg={7} className="mb-4">
              <div className="header-box">
                <h1 className="event-title">
                  {t("createManageEventsLine1")}<br />{t("createManageEventsLine2")}
                </h1>
              </div>
            </Col>

            <Col lg={5} className="">
              <p className="event-desc mb-4">{t("organizersHeaderDesc")}</p>
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
                    {t("whyCreateEventsTitle")}
                  </h1>
                </div>
              </Col>

              <Col lg={5} className="">
                <p className="event-desc mb-4">{t("organizersWhyDesc")}</p>
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
                <h3>{t("easyEventCreationTitle")}</h3>
                <p>{t("easyEventCreationDesc")}</p>
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
                <h3>{t("manageAttendeesTitle")}</h3>
                <p>{t("manageAttendeesDesc")}</p>
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
                <h3>{t("eventPromotionTitle")}</h3>
                <p>{t("eventPromotionDesc")}</p>
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
                <h3>{t("earnMoreTitle")}</h3>
                <p>{t("earnMoreDesc")}</p>
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
                      {t("whatYouCanCreateTitleLine1")}<br />{t("whatYouCanCreateTitleLine2")}
                    </h1>
                </div>
              </Col>

              <Col lg={5} className="">
                <p className="event-desc mb-4">{t("createTechEventsDesc")}</p>
              </Col>
            </Row>

            <Row>
              <Col lg={4}>
                <div className="what_create_Card">
                  <h2>{t("workshopsAndSeminars")}</h2>
                  <p>{t("workshopsAndSeminarsDesc")}</p>
                </div>
              </Col>
              <Col lg={4}>
                <div className="what_create_Card">
                  <h2>{t("liveEvents")}</h2>
                  <p>{t("liveEventsDesc")}</p>
                </div>
              </Col>
              <Col lg={4}>
                <div className="what_create_Card">
                  <h2>{t("trainingPrograms")}</h2>
                  <p>{t("trainingProgramsDesc")}</p>
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
        customTitle={t("eventsYouMayLike")}
      />
      <Footer />
    </>
  );
}
