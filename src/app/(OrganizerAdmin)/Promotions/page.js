"use client";
import React, { useEffect, useState } from "react";
import { Col, Row, Tab, Tabs, Spinner } from "react-bootstrap";
import promotionsApi from "../../../api/promotionsApi";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

export default function PromotionsPage() {
  const { t } = useLanguage();
  const [eventPackages, setEventPackages] = useState([]);
  const [coursePackages, setCoursePackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
    document.title = "Promotions - Bondy";
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const [eventRes, courseRes] = await Promise.all([
        promotionsApi.getEventPackages(),
        promotionsApi.getCoursePackages(),
      ]);

      if (eventRes?.status) {
        setEventPackages(eventRes?.data?.packages || []);
      }
      if (courseRes?.status) {
        setCoursePackages(courseRes?.data || []);
      }
    } catch (error) {
      console.error("Error fetching promotion packages:", error);
      toast.error(t("failedToLoadPromotionPackages"));
    } finally {
      setLoading(false);
    }
  };

  const renderPackages = (packages, type) => {
    if (packages.length === 0) {
      return (
        <div className="text-center p-5 text-muted">
          {type === "event" ? t("noPromotionPackagesEvent") : t("noPromotionPackagesCourse")}
        </div>
      );
    }

    return (
      <Row className="gx-5 mt-4">
        {packages.map((pkg) => (
          <Col lg={4} xs={12} key={pkg._id} className="mb-4">
            <div style={{ textTransform: "capitalize" }} className="pricing-cards h-100 d-flex flex-column">
              <div>
                <h5>{pkg.name}</h5>
                <h2>
                  ₮{pkg.price?.toLocaleString()} <span>{pkg.durationInDays} {t("days")}</span>
                </h2>
              </div>
              <div className="  flex-grow-1 mt-3">
                {pkg.placements && pkg.placements.length > 0 ? (
                  pkg.placements.map((placement, index) => (
                    <p key={index}>
                      <img src="/img/checkmark-vector.svg" className="me-3" alt="" />
                      {placement}
                    </p>
                  ))
                ) : (
                  <p>
                    <img src="/img/checkmark-vector.svg" className="me-3" alt="" />
                    {t("standardPlacement")}
                  </p>
                )}
              </div>
              {/* <button type="button" className="custom-btn w-100 mt-3" onClick={() => alert("Checkout flow to be implemented")}>
                Select
              </button> */}
            </div>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div>
      <div className="cards">
        <div className="card-header border-0 pb-0">
          <div>
            <h2 className="card-title">{t("promotionPackages")}</h2>
            <p className="card-desc">
              {t("promotionPackagesDesc")}
            </p>
          </div>
        </div>

        <div className="p-4 pt-0">
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <div className="ticket-tabs">
              <Tabs
                defaultActiveKey="events"
                id="promotion-tabs"
                className="mb-4"
              >
                <Tab eventKey="events" title={t("eventPackages")}>
                  <h5 className="promation-title mt-4">{t("boostEventVisibility")}</h5>
                  {renderPackages(eventPackages, "event")}
                </Tab>
                <Tab eventKey="courses" title={t("coursePackages")}>
                  <h5 className="promation-title mt-4">{t("boostCourseVisibility")}</h5>
                  {renderPackages(coursePackages, "course")}
                </Tab>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
