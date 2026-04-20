import Link from "next/link";
import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useLanguage } from "@/context/LanguageContext";

const EventEaseUI = () => {
  const { t } = useLanguage();
  return (
    <div className="eventEase-section">
      <Container>
        <div className="eventEaseBox">
          <Row>
            <Col lg={6}>
              <div className="main_title">
                <h2>{t("howItWorksTitle")}</h2>
                <p>{t("howItWorksDesc")}</p>
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
                  <h3 className="step-heading">{t("registerAsOrganizer")}</h3>
                  <p className="step-text">{t("registerAsOrganizerDesc")}</p>
                </div>
              </div>
              <div className="step-container icon_arrow">
                <div className="icon-wrapper">
                  <img src="/img/how_icon02.svg" />
                </div>
                <div>
                  <h3 className="step-heading">{t("createEventProgram")}</h3>
                  <p className="step-text">{t("createEventProgramDesc")}</p>
                </div>
              </div>
              <div className="step-container icon_arrow">
                <div className="icon-wrapper">
                  <img src="/img/how_icon03.svg" />
                </div>
                <div>
                  <h3 className="step-heading">{t("publishPromote")}</h3>
                  <p className="step-text">{t("publishPromoteDesc")}</p>
                </div>
              </div>
              <div className="step-container mb-0">
                <div className="icon-wrapper">
                  <img src="/img/how_icon04.svg" />
                </div>
                <div>
                  <h3 className="step-heading">{t("manageTrack")}</h3>
                  <p className="step-text">{t("manageTrackDesc")}</p>
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
              <h2 className="cta-title">{t("readyToGetStarted")}</h2>
              <p className="cta-desc">{t("ctaDesc")}</p>
              <Link href="/Explore" className="btn-teal">
                {t("startExploringBtn")}
              </Link>
              <Link href="/BasicInfo" className="btn-white">
                {t("createFirstEventBtn")}
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EventEaseUI;
