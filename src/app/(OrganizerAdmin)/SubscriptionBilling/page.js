'use client';

import Link from "next/link";
import React from "react";
import { Col, Row } from "react-bootstrap";
import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

function page() {
  const { t } = useLanguage();
  useEffect(() => {
    document.title = "Subscription & Billing - Bondy";
  }, []);


  return (
    <div>
      <div className="cards subscription">
        <div className="card-header">
          <div>
            <h2 className="card-title">{t("subscriptionBilling")}</h2>
          </div>
        </div>
        <Row>
          <Col md={7}>
            <div className="analytics-chart">
              <div className="plan-header">
                <h3>{t("standardPlan")}</h3>
                <span className="status-pill">{t("active")}</span>
              </div>
              <p className="plan-sub">$299 / 7 Days • Renew 12 Oct 2025</p>
              <div className="pricing-cards border-0 p-0">
                <p>
                  <img
                    src="/img/check-mark-color.svg"
                    className="me-3"
                    alt=""
                  />
                  {t("unlimitedEventListings")}
                </p>
                <p>
                  <img
                    src="/img/check-mark-color.svg"
                    className="me-3"
                    alt=""
                  />
                  {t("featuredPlacement")}
                </p>
                <p>
                  <img
                    src="/img/check-mark-color.svg"
                    className="me-3"
                    alt=""
                  />
                  {t("boostedVisibility")}
                </p>
                <p>
                  <img
                    src="/img/check-mark-color.svg"
                    className="me-3"
                    alt=""
                  />
                  {t("advancedAnalyticsDashboard")}
                </p>
                <p>
                  <img
                    src="/img/check-mark-color.svg"
                    className="me-3"
                    alt=""
                  />
                  {t("promotionsDiscounts")}
                </p>
                <p>
                  <img
                    src="/img/check-mark-color.svg"
                    className="me-3"
                    alt=""
                  />
                  {t("autoReminders")}
                </p>
                <p>
                  <img
                    src="/img/check-mark-color.svg"
                    className="me-3"
                    alt=""
                  />
                  {t("prioritySupport")}
                </p>
              </div>
              <div className="renew-on mt-3">
                <span>{t("renewOn")}: 12 Oct 2025</span>
              </div>
              <div className="d-flex justify-content-between mt-3">
                <button className="outline-btn">{t("cancelPlan")}</button>
                <Link href="/Promotions" className="custom-btn">
                  {t("upgradePlan")}
                </Link>
              </div>
            </div>
          </Col>

          <Col md={5}>
            <div className="analytics-chart payment-cards h-100">
              <h3 className="section-title">{t("paymentMethods")}</h3>
              <div className="card-row">
                <div className="card-icon">
                  <img
                    src="/img/org-img/master-card-img.svg"
                    alt="Mastercard"
                  />
                </div>

                <div>
                  <div className="card-title">Master Card Ending 4242</div>
                  <div className="card-sub">Expire 05/26</div>
                </div>
              </div>
              <div className="billing">
                <h4>{t("billingAddress")}</h4>
                <p>
                  123 Event Horizon Way
                  <br />
                  San Francisco, CA 94107
                </p>
              </div>
              <div className="mt-2">
                <button className="outline-btn w-100" type="button">
                  {t("editPaymentMethod")}
                </button>
              </div>
            </div>
          </Col>
        </Row>
        <div className="custom-table-cards billing-history">
          <div className="card-header">
            <div>
              <h5 className="table-title">{t("billingHistory")}</h5>
            </div>

            <div className="table-search">
              <input
                type="text"
                className="form-control"
                placeholder={t("searchBilling")}
              />
              <button type="button">
                <img src="/img/org-img/search-white.svg" width={16} />
              </button>
            </div>
          </div>
          <div className="table table-responsive custom-table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("date")}</th>
                  <th>{t("plan")}</th>
                  <th>{t("amount")}</th>
                  <th>{t("status")}</th>
                  <th>{t("invoice")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>05 Oct 2025</td>
                  <td>Standard plan (3 days)</td>
                  <td>$199</td>
                  <td>
                    <span className="status-badge complete">Paid</span>
                  </td>
                  <td>
                    <button type="button">
                      <img src="/img/org-img/invoice-icon.svg" />
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>05 Oct 2025</td>
                  <td>Standard plan (3 days)</td>
                  <td>$199</td>
                  <td>
                    <span className="status-badge complete">Paid</span>
                  </td>
                  <td>
                    <button type="button">
                      <img src="/img/org-img/invoice-icon.svg" />
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>05 Oct 2025</td>
                  <td>Standard plan (3 days)</td>
                  <td>$199</td>
                  <td>
                    <span className="status-badge complete">Paid</span>
                  </td>
                  <td>
                    <button type="button">
                      <img src="/img/org-img/invoice-icon.svg" />
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>05 Oct 2025</td>
                  <td>Standard plan (3 days)</td>
                  <td>$199</td>
                  <td>
                    <span className="status-badge complete">Paid</span>
                  </td>
                  <td>
                    <button type="button">
                      <img src="/img/org-img/invoice-icon.svg" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default page;
