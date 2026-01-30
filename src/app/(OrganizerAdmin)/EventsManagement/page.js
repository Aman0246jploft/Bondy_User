"use client";
import Link from "next/link";
import React from "react";
import { Col, Row, Tabs, Tab, Form } from "react-bootstrap";

function page() {
  return (
    <div>
      <div className="cards">
        <div className="card-header">
          <div>
            <h2 className="card-title">Events Management</h2>
            <p className="card-desc">
              Welcome back, Alex! Here's a snapshot of your events and tasks.
            </p>
          </div>

          <Link href="/BasicInfo" className="custom-btn">
            Create New
          </Link>
        </div>
        <Row>
          <Col md={4}>
            <div className="event-cards">
              <h5>Total Revenue</h5>
              <h3>$67,500</h3>
              <p>+15%</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="event-cards">
              <h5>Total Attendees</h5>
              <h3>1300</h3>
              <p>+10%</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="event-cards">
              <h5>Average Rating</h5>
              <h3>1300</h3>
              <p>+10%</p>
            </div>
          </Col>
        </Row>
        <div className="ticket-tabs">
          <Tabs defaultActiveKey="all">
            <Tab eventKey="all" title="All (6)">
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
                          fill="none"
                        >
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
                          fill="none"
                        >
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
                        <img src="/img/details_img02.png" alt="" />
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
                          fill="none"
                        >
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
            </Tab>
            <Tab eventKey="upcoming" title="Upcoming (4)">
              <div className="ticket-listing">
                <div className="ticket-cards">
                  <div className="ticket-inner">
                    <div className="ticket-lft">
                      <Form.Check />
                      <div className="event-info-box-img">
                        <img src="/img/details_img03.png" alt="" />
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
                          fill="none"
                        >
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
                          fill="none"
                        >
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
                        <img src="/img/details_img03.png" alt="" />
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
                          fill="none"
                        >
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
                        <img src="/img/details_img04.png" alt="" />
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
                          fill="none"
                        >
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
            </Tab>
            <Tab eventKey="ongoing" title="Ongoing (2))">
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
                          fill="none"
                        >
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
                        <img src="/img/details_img05.png" alt="" />
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
                          fill="none"
                        >
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
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default page;
