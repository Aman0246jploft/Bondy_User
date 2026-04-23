"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import AuthButton from "@/components/AuthButton";
import authApi from "@/api/authApi";

const EventEaseUI = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSelfProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await authApi.getSelfProfile();
        if (response?.status && isMounted) {
          setUserRole(response?.data?.user?.userRole || response?.data?.user?.role || null);
        }
      } catch (error) {
        console.error("Failed to fetch self profile:", error);
      }
    };

    fetchSelfProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const shouldHideCreateFirstEventButton = userRole === "CUSTOMER";

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
              <AuthButton requiresAuth onClick={() => router.push("/Explore")} className="btn-teal">
                {t("startExploringBtn")}
              </AuthButton>
              {!shouldHideCreateFirstEventButton && (
                <AuthButton requiresAuth onClick={() => router.push("/BasicInfo")} className="btn-white">
                  {t("createFirstEventBtn")}
                </AuthButton>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EventEaseUI;
