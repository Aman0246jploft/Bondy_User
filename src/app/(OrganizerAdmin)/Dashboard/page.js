"use client";
import React from "react";
import { Col, Row, Form } from "react-bootstrap";
import TicketDistributionChart from "../Components/TicketDistributionChart";
import GenderRatioChart from "../Components/GenderRatioChart";
import Link from "next/link";

function page() {
  return (
    <div>
      <div className="cards">
        <div className="card-header">
          <div>
            <h2 className="card-title">Dashboard</h2>
            <p className="card-desc">
              Welcome back, Alex! Here's a snapshot of your events and tasks.
            </p>
          </div>
        </div>
        <div className="dashbord-card-grid">
          <div className="dashboard-counter">
            <h5>Drafts Events</h5>
            <span className="counter">2</span>
          </div>

          <div className="dashboard-counter">
            <h5>Pending Events</h5>
            <span className="counter pending">2</span>
          </div>

          <div className="dashboard-counter">
            <h5>Live Events</h5>
            <span className="counter live">1</span>
          </div>

          <div className="dashboard-counter">
            <h5>Total Ticket</h5>
            <span className="counter live">50</span>
          </div>
          <div className="dashboard-counter">
            <h5>Completed Events</h5>
            <span className="counter completed">10</span>
          </div>
        </div>
        <Row>
          <Col sm={12} md={4}>
            <div className="card-varticl mb-3">
              <span>Net Revenue</span>
              <h3>₮15,2400</h3>
            </div>
            <div className="card-varticl mb-3">
              <span>Total Tickets Sold</span>
              <h3>240</h3>
            </div>
            <div className="card-varticl mb-3">
              <span>Total Attendees</span>
              <h3>231</h3>
            </div>
          </Col>
          <Col md={8} sm={12}>
            <div className="analytics-chart">
              <h4 className="mb-2">Needs Attention</h4>
              <div className="card-varticl-attention mb-2">
                <div>
                  <h3>Event starts in 24h - setup incomplete</h3>
                  <p>Dua Lipa Concert</p>
                </div>
                <div>
                  <button className="status-badge complete">
                    Complete Setup
                  </button>
                </div>
              </div>
              <div className="card-varticl-attention mb-2">
                <div>
                  <h3>Low seats remaining (3 leff)</h3>
                  <p>Photography Basics Workshop</p>
                </div>
                <div>
                  <button className="status-badge pending">
                    Promote Event
                  </button>
                </div>
              </div>
              <div className="card-varticl-attention mb-2">
                <div>
                  <h3>Pending event approval</h3>
                  <p>Intro to Coding Bootcamp</p>
                </div>
                <div>
                  <button className="status-badge cancel">
                    Edit & Resubmit
                  </button>
                </div>
              </div>
              <div className="card-varticl-attention">
                <div>
                  <h3>Payout blocked - verification required</h3>
                  <p>$1,245 pending</p>
                </div>
                <div>
                  <button className="status-badge pending">Resolve</button>
                </div>
              </div>
            </div>
          </Col>
        </Row>
        <div className="recomanded-head">
          <h5>Upcoming</h5>
          <Link href="/EventsManagement">See all</Link>
        </div>
        <div className="ticket-listing">
          <div className="ticket-cards">
            <div className="ticket-inner">
              <div className="ticket-lft">
                <Form.Check />
                <div className="event-info-box-img">
                  <img src="/img/details_img02.png" alt="" />
                  <div>
                    <h5>Dua Lipa Concert</h5>
                    <p className="ref">Sports</p>
                  </div>
                </div>
              </div>
              <div className="ticket-rgt">
                <span className="status-badge ongoing">Ongoing</span>
                <p>
                  Venue <span>Arena Stadium</span>
                </p>
              </div>
            </div>
            <div className="ticket-bottom">
              <p>
                Create Date <span>Tue 30 Sep</span>{" "}
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="4"
                    height="4"
                    viewBox="0 0 4 4"
                    fill="none">
                    <circle cx="2" cy="2" r="2" fill="#999999" />
                  </svg>
                </span>{" "}
                <span>7:30 PM</span>
              </p>
              <p>
                Total Booking Revenue <span>$200</span>
              </p>
              <p>
                <span>
                  <img src="/img/ticket-white.svg" />
                </span>{" "}
                <span>2 tickets</span>
              </p>
              <Link href="/EventDetails">
                Event Details <img src="/img/Arrow-Right.svg" />
              </Link>
            </div>
          </div>
          <div className="ticket-cards">
            <div className="ticket-inner">
              <div className="ticket-lft">
                <Form.Check />
                <div className="event-info-box-img">
                  <img src="/img/details_img01.png" alt="" />
                  <div>
                    <h5>Dua Lipa Concert</h5>
                    <p className="ref">Sports</p>
                  </div>
                </div>
              </div>
              <div className="ticket-rgt">
                <span className="status-badge pending">Upcoming</span>
                <p>
                  Venue <span>Arena Stadium</span>
                </p>
              </div>
            </div>
            <div className="ticket-bottom">
              <p>
                Create Date <span>Tue 30 Sep</span>{" "}
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="4"
                    height="4"
                    viewBox="0 0 4 4"
                    fill="none">
                    <circle cx="2" cy="2" r="2" fill="#999999" />
                  </svg>
                </span>{" "}
                <span>7:30 PM</span>
              </p>
              <p>
                Total Booking Revenue <span>$200</span>
              </p>
              <p>
                <span>
                  <img src="/img/ticket-white.svg" />
                </span>{" "}
                <span>2 tickets</span>
              </p>
              <Link href="/EventDetails">
                Event Details <img src="/img/Arrow-Right.svg" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default page;
