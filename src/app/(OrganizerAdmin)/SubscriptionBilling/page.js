import Link from "next/link";
import React from "react";
import { Col, Row } from "react-bootstrap";

function page() {
  return (
    <div>
      <div className="cards subscription">
        <div className="card-header">
          <div>
            <h2 className="card-title">Subscription & Billing</h2>
          </div>
        </div>
        <Row>
          <Col md={7}>
            <div className="analytics-chart">
              <div className="plan-header">
                <h3>Standard Plan</h3>
                <span className="status-pill">Active</span>
              </div>
              <p className="plan-sub">$299 / 7 Days • Renew 12 Oct 2025</p>
              <div className="pricing-cards border-0 p-0">
                <p>
                  <img
                    src="/img/check-mark-color.svg"
                    className="me-3"
                    alt=""
                  />
                  Unlimited Event Listings
                </p>
                <p>
                  <img
                    src="/img/check-mark-color.svg"
                    className="me-3"
                    alt=""
                  />
                  Featured Placement (Homeage, Maps & Areas)
                </p>
                <p>
                  <img
                    src="/img/check-mark-color.svg"
                    className="me-3"
                    alt=""
                  />
                  Boosted Visibility & Ranking
                </p>
                <p>
                  <img
                    src="/img/check-mark-color.svg"
                    className="me-3"
                    alt=""
                  />
                  Advanced Analytics Dashboard
                </p>
                <p>
                  <img
                    src="/img/check-mark-color.svg"
                    className="me-3"
                    alt=""
                  />
                  Promotions & Discounts
                </p>
                <p>
                  <img
                    src="/img/check-mark-color.svg"
                    className="me-3"
                    alt=""
                  />
                  Auto Reminders & Scheduled Messages
                </p>
                <p>
                  <img
                    src="/img/check-mark-color.svg"
                    className="me-3"
                    alt=""
                  />
                  Priority Support
                </p>
              </div>
              <div className="renew-on mt-3">
                <span>Renew on: 12 Oct 2025</span>
              </div>
              <div className="d-flex justify-content-between mt-3">
                <button className="outline-btn">Cancel Plan</button>
                <Link href="/Promotions" className="custom-btn">
                  Upgrade Plan
                </Link>
              </div>
            </div>
          </Col>
          <Col md={5}>
            <div className="analytics-chart payment-cards h-100">
              <h3 className="section-title">Payment Methods</h3>
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
                <h4>Billing Address</h4>
                <p>
                  123 Event Horizon Way
                  <br />
                  San Francisco, CA 94107
                </p>
              </div>
              <div className="mt-2">
                <button className="outline-btn w-100" type="button">
                  Edit payment method
                </button>
              </div>
            </div>
          </Col>
        </Row>
        <div className="custom-table-cards billing-history">
          <div className="card-header">
            <div>
              <h5 className="table-title">Billing History</h5>
            </div>
            <div className="table-search">
              <input
                type="text"
                className="form-control"
                placeholder="Search Billing ... "
              />
              <button type="button">
                <img src="/img/org-img/search-white.svg" />
              </button>
            </div>
          </div>
          <div className="table table-responsive custom-table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Invoice</th>
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
