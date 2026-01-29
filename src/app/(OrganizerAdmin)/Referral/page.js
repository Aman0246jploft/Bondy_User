import React from "react";
import { Col, Row } from "react-bootstrap";

function page() {
  return (
    <div>
      <div className="cards">
        <div className="card-header">
          <div>
            <h2 className="card-title">Referral</h2>
          </div>
        </div>
        <Row>
          <Col md={6}>
            <div className="analytics-chart link-cards border-0">
              <h4 className="mb-2">Share your unique link</h4>
              <p>
                Get $50 credit for every organizer who joins and hosts their
                first event.
              </p>
              <div className="link-bx">
                <input
                  type="text"
                  className="form-control"
                  value="https://bondy.com/r/john-doe-123"
                />
                <button className="common_btn" type="button">
                  Copy Link
                </button>
                <span className="link-icon">
                  <img src="/img/link.svg" />
                </span>
              </div>
              <h4 className="mb-2">Share your unique link</h4>
              <button type="button" className="common_btn">
                <img src="/img/org-img/email.svg" className="me-1" />
                Invite via Email
              </button>
            </div>
          </Col>
          <Col md={6}>
            <div className="referal-cards analytics-chart border-0">
              <h6>Total Referrals</h6>
              <h3>12</h3>
            </div>
            <div className="referal-cards analytics-chart border-0">
              <h6>Successful Signup</h6>
              <h3>5</h3>
            </div>
          </Col>
        </Row>
        <div className="custom-table-cards billing-history">
          <div className="card-header">
            <div>
              <h5 className="table-title">Referral History</h5>
            </div>
            <div className="table-search">
              <input
                type="text"
                className="form-control"
                placeholder="Search Referral ...  "
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
                  <th>User</th>
                  <th>Date Invited</th>
                  <th>Status</th>
                  <th>Reward</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div>
                      Sarah Smith <br />
                      <span className="sub">sarah.s@example.com </span>
                    </div>
                  </td>
                  <td>05 Oct 2025</td>
                  <td>
                    <span className="status-badge complete">Signup</span>
                  </td>
                  <td>$10</td>
                </tr>
                <tr>
                  <td>
                    <div>
                      Michael Jordan <br />
                      <span className="sub">mike.j@example.com</span>
                    </div>
                  </td>
                  <td>07 Oct 2025</td>
                  <td>
                    <span className="status-badge pending">Pending</span>
                  </td>
                  <td>--</td>
                </tr>
                <tr>
                  <td>
                    <div>
                      Amy Lee <br />
                      <span className="sub">amy.lee@example.com</span>
                    </div>
                  </td>
                  <td>10 Oct 2025</td>
                  <td>
                    <span className="status-badge complete">$10</span>
                  </td>
                  <td>--</td>
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
