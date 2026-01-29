"use client";
import Link from "next/link";
import React from "react";
import { Tabs, Tab, Form } from "react-bootstrap";

function page() {
  return (
    <div>
      <div className="cards my-tickets">
        <div className="card-title">
          <h3>My Tickets</h3>
        </div>
        <div className="ticket-tabs">
          <Tabs defaultActiveKey="all">
            <Tab eventKey="all" title="All (7)">
              <div className="ticket-listing">
                <div className="ticket-cards">
                  <div className="ticket-inner">
                    <div className="ticket-lft">
                      <Form.Check />
                      <div>
                        <h5>Adele Concert</h5>
                        <p className="ref"># R123</p>
                      </div>
                    </div>
                    <div className="ticket-rgt">
                      <span className="status-badge complete">Completed</span>
                    </div>
                  </div>
                  <div className="ticket-bottom">
                    <p>
                      Booking Date <span>Tue 30 Sep</span>{" "}
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
                      Total paid <span>$200</span>
                    </p>
                    <p>
                      <span>
                        <img src="/img/ticket-white.svg" />
                      </span>{" "}
                      <span>2 tickets</span>
                    </p>
                    <Link href="/TicketDetails">
                      Ticket Details <img src="/img/Arrow-Right.svg" />
                    </Link>
                  </div>
                </div>
                <div className="ticket-cards">
                  <div className="ticket-inner">
                    <div className="ticket-lft">
                      <Form.Check />
                      <div>
                        <h5>Adele Concert</h5>
                        <p className="ref"># R123</p>
                      </div>
                    </div>
                    <div className="ticket-rgt">
                      <span className="status-badge complete">Completed</span>
                    </div>
                  </div>
                  <div className="ticket-bottom">
                    <p>
                      Booking Date <span>Tue 30 Sep</span>{" "}
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
                      Total paid <span>$200</span>
                    </p>
                    <p>
                      <span>
                        <img src="/img/ticket-white.svg" />
                      </span>{" "}
                      <span>2 tickets</span>
                    </p>
                    <Link href="/TicketDetails">
                      Ticket Details <img src="/img/Arrow-Right.svg" />
                    </Link>
                  </div>
                </div>
                <div className="ticket-cards">
                  <div className="ticket-inner">
                    <div className="ticket-lft">
                      <Form.Check />
                      <div>
                        <h5>Dua Lipa Concert</h5>
                        <p className="ref"># R123</p>
                      </div>
                    </div>
                    <div className="ticket-rgt">
                      <span className="status-badge cancel">Canceled</span>
                    </div>
                  </div>
                  <div className="ticket-bottom">
                    <p>
                      Booking Date <span>Tue 30 Sep</span>{" "}
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
                      Total paid <span>$200</span>
                    </p>
                    <p>
                      <span>
                        <img src="/img/ticket-white.svg" />
                      </span>{" "}
                      <span>2 tickets</span>
                    </p>
                    <Link href="/TicketDetails">
                      Ticket Details <img src="/img/Arrow-Right.svg" />
                    </Link>
                  </div>
                </div>
                <div className="ticket-cards">
                  <div className="ticket-inner">
                    <div className="ticket-lft">
                      <Form.Check />
                      <div>
                        <h5>Dua Lipa Concert</h5>
                        <p className="ref"># R123</p>
                      </div>
                    </div>
                    <div className="ticket-rgt">
                      <span className="status-badge pending">Pending</span>
                    </div>
                  </div>
                  <div className="ticket-bottom">
                    <p>
                      Booking Date <span>Tue 30 Sep</span>{" "}
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
                      Total paid <span>$200</span>
                    </p>
                    <p>
                      <span>
                        <img src="/img/ticket-white.svg" />
                      </span>{" "}
                      <span>2 tickets</span>
                    </p>
                    <Link href="/TicketDetails">
                      Ticket Details <img src="/img/Arrow-Right.svg" />
                    </Link>
                  </div>
                </div>
                <div className="ticket-cards">
                  <div className="ticket-inner">
                    <div className="ticket-lft">
                      <Form.Check />
                      <div>
                        <h5>Adele Concert</h5>
                        <p className="ref"># R123</p>
                      </div>
                    </div>
                    <div className="ticket-rgt">
                      <span className="status-badge complete">Completed</span>
                    </div>
                  </div>
                  <div className="ticket-bottom">
                    <p>
                      Booking Date <span>Tue 30 Sep</span>{" "}
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
                      Total paid <span>$200</span>
                    </p>
                    <p>
                      <span>
                        <img src="/img/ticket-white.svg" />
                      </span>{" "}
                      <span>2 tickets</span>
                    </p>
                    <Link href="/TicketDetails">
                      Ticket Details <img src="/img/Arrow-Right.svg" />
                    </Link>
                  </div>
                </div>
                <div className="ticket-cards">
                  <div className="ticket-inner">
                    <div className="ticket-lft">
                      <Form.Check />
                      <div>
                        <h5>Dua Lipa Concert</h5>
                        <p className="ref"># R123</p>
                      </div>
                    </div>
                    <div className="ticket-rgt">
                      <span className="status-badge cancel">Canceled</span>
                    </div>
                  </div>
                  <div className="ticket-bottom">
                    <p>
                      Booking Date <span>Tue 30 Sep</span>{" "}
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
                      Total paid <span>$200</span>
                    </p>
                    <p>
                      <span>
                        <img src="/img/ticket-white.svg" />
                      </span>{" "}
                      <span>2 tickets</span>
                    </p>
                    <Link href="/TicketDetails">
                      Ticket Details <img src="/img/Arrow-Right.svg" />
                    </Link>
                  </div>
                </div>
                <div className="ticket-cards">
                  <div className="ticket-inner">
                    <div className="ticket-lft">
                      <Form.Check />
                      <div>
                        <h5>Dua Lipa Concert</h5>
                        <p className="ref"># R123</p>
                      </div>
                    </div>
                    <div className="ticket-rgt">
                      <span className="status-badge pending">Pending</span>
                    </div>
                  </div>
                  <div className="ticket-bottom">
                    <p>
                      Booking Date <span>Tue 30 Sep</span>{" "}
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
                      Total paid <span>$200</span>
                    </p>
                    <p>
                      <span>
                        <img src="/img/ticket-white.svg" />
                      </span>{" "}
                      <span>2 tickets</span>
                    </p>
                    <Link href="/TicketDetails">
                      Ticket Details <img src="/img/Arrow-Right.svg" />
                    </Link>
                  </div>
                </div>
              </div>
            </Tab>
            <Tab eventKey="pending" title="Pending (4)">
              <div className="ticket-cards">
                <div className="ticket-inner">
                  <div className="ticket-lft">
                    <Form.Check />
                    <div>
                      <h5>Dua Lipa Concert</h5>
                      <p className="ref"># R123</p>
                    </div>
                  </div>
                  <div className="ticket-rgt">
                    <span className="status-badge pending">Pending</span>
                  </div>
                </div>
                <div className="ticket-bottom">
                  <p>
                    Booking Date <span>Tue 30 Sep</span>{" "}
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
                    Total paid <span>$200</span>
                  </p>
                  <p>
                    <span>
                      <img src="/img/ticket-white.svg" />
                    </span>{" "}
                    <span>2 tickets</span>
                  </p>
                  <Link href="/TicketDetails">
                    Ticket Details <img src="/img/Arrow-Right.svg" />
                  </Link>
                </div>
              </div>
              <div className="ticket-cards">
                <div className="ticket-inner">
                  <div className="ticket-lft">
                    <Form.Check />
                    <div>
                      <h5>Dua Lipa Concert</h5>
                      <p className="ref"># R123</p>
                    </div>
                  </div>
                  <div className="ticket-rgt">
                    <span className="status-badge pending">Pending</span>
                  </div>
                </div>
                <div className="ticket-bottom">
                  <p>
                    Booking Date <span>Tue 30 Sep</span>{" "}
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
                    Total paid <span>$200</span>
                  </p>
                  <p>
                    <span>
                      <img src="/img/ticket-white.svg" />
                    </span>{" "}
                    <span>2 tickets</span>
                  </p>
                  <Link href="/TicketDetails">
                    Ticket Details <img src="/img/Arrow-Right.svg" />
                  </Link>
                </div>
              </div>
              <div className="ticket-cards">
                <div className="ticket-inner">
                  <div className="ticket-lft">
                    <Form.Check />
                    <div>
                      <h5>Dua Lipa Concert</h5>
                      <p className="ref"># R123</p>
                    </div>
                  </div>
                  <div className="ticket-rgt">
                    <span className="status-badge pending">Pending</span>
                  </div>
                </div>
                <div className="ticket-bottom">
                  <p>
                    Booking Date <span>Tue 30 Sep</span>{" "}
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
                    Total paid <span>$200</span>
                  </p>
                  <p>
                    <span>
                      <img src="/img/ticket-white.svg" />
                    </span>{" "}
                    <span>2 tickets</span>
                  </p>
                  <Link href="/TicketDetails">
                    Ticket Details <img src="/img/Arrow-Right.svg" />
                  </Link>
                </div>
              </div>
              <div className="ticket-cards">
                <div className="ticket-inner">
                  <div className="ticket-lft">
                    <Form.Check />
                    <div>
                      <h5>Dua Lipa Concert</h5>
                      <p className="ref"># R123</p>
                    </div>
                  </div>
                  <div className="ticket-rgt">
                    <span className="status-badge pending">Pending</span>
                  </div>
                </div>
                <div className="ticket-bottom">
                  <p>
                    Booking Date <span>Tue 30 Sep</span>{" "}
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
                    Total paid <span>$200</span>
                  </p>
                  <p>
                    <span>
                      <img src="/img/ticket-white.svg" />
                    </span>{" "}
                    <span>2 tickets</span>
                  </p>
                  <Link href="/TicketDetails">
                    Ticket Details <img src="/img/Arrow-Right.svg" />
                  </Link>
                </div>
              </div>
            </Tab>
            <Tab eventKey="canceled" title="Canceled (3)">
              <div className="ticket-cards">
                <div className="ticket-inner">
                  <div className="ticket-lft">
                    <Form.Check />
                    <div>
                      <h5>Dua Lipa Concert</h5>
                      <p className="ref"># R123</p>
                    </div>
                  </div>
                  <div className="ticket-rgt">
                    <span className="status-badge cancel">Canceled</span>
                  </div>
                </div>
                <div className="ticket-bottom">
                  <p>
                    Booking Date <span>Tue 30 Sep</span>{" "}
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
                    Total paid <span>$200</span>
                  </p>
                  <p>
                    <span>
                      <img src="/img/ticket-white.svg" />
                    </span>{" "}
                    <span>2 tickets</span>
                  </p>
                  <Link href="/TicketDetails">
                    Ticket Details <img src="/img/Arrow-Right.svg" />
                  </Link>
                </div>
              </div>
              <div className="ticket-cards">
                <div className="ticket-inner">
                  <div className="ticket-lft">
                    <Form.Check />
                    <div>
                      <h5>Dua Lipa Concert</h5>
                      <p className="ref"># R123</p>
                    </div>
                  </div>
                  <div className="ticket-rgt">
                    <span className="status-badge cancel">Canceled</span>
                  </div>
                </div>
                <div className="ticket-bottom">
                  <p>
                    Booking Date <span>Tue 30 Sep</span>{" "}
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
                    Total paid <span>$200</span>
                  </p>
                  <p>
                    <span>
                      <img src="/img/ticket-white.svg" />
                    </span>{" "}
                    <span>2 tickets</span>
                  </p>
                  <Link href="/TicketDetails">
                    Ticket Details <img src="/img/Arrow-Right.svg" />
                  </Link>
                </div>
              </div>
              <div className="ticket-cards">
                <div className="ticket-inner">
                  <div className="ticket-lft">
                    <Form.Check />
                    <div>
                      <h5>Dua Lipa Concert</h5>
                      <p className="ref"># R123</p>
                    </div>
                  </div>
                  <div className="ticket-rgt">
                    <span className="status-badge cancel">Canceled</span>
                  </div>
                </div>
                <div className="ticket-bottom">
                  <p>
                    Booking Date <span>Tue 30 Sep</span>{" "}
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
                    Total paid <span>$200</span>
                  </p>
                  <p>
                    <span>
                      <img src="/img/ticket-white.svg" />
                    </span>{" "}
                    <span>2 tickets</span>
                  </p>
                  <Link href="/TicketDetails">
                    Ticket Details <img src="/img/Arrow-Right.svg" />
                  </Link>
                </div>
              </div>
            </Tab>
            <Tab eventKey="completed" title="Completed (3)">
              <div className="ticket-cards">
                <div className="ticket-inner">
                  <div className="ticket-lft">
                    <Form.Check />
                    <div>
                      <h5>Adele Concert</h5>
                      <p className="ref"># R123</p>
                    </div>
                  </div>
                  <div className="ticket-rgt">
                    <span className="status-badge complete">Completed</span>
                  </div>
                </div>
                <div className="ticket-bottom">
                  <p>
                    Booking Date <span>Tue 30 Sep</span>{" "}
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
                    Total paid <span>$200</span>
                  </p>
                  <p>
                    <span>
                      <img src="/img/ticket-white.svg" />
                    </span>{" "}
                    <span>2 tickets</span>
                  </p>
                  <Link href="/TicketDetails">
                    Ticket Details <img src="/img/Arrow-Right.svg" />
                  </Link>
                </div>
              </div>
              <div className="ticket-cards">
                <div className="ticket-inner">
                  <div className="ticket-lft">
                    <Form.Check />
                    <div>
                      <h5>Adele Concert</h5>
                      <p className="ref"># R123</p>
                    </div>
                  </div>
                  <div className="ticket-rgt">
                    <span className="status-badge complete">Completed</span>
                  </div>
                </div>
                <div className="ticket-bottom">
                  <p>
                    Booking Date <span>Tue 30 Sep</span>{" "}
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
                    Total paid <span>$200</span>
                  </p>
                  <p>
                    <span>
                      <img src="/img/ticket-white.svg" />
                    </span>{" "}
                    <span>2 tickets</span>
                  </p>
                  <Link href="/TicketDetails">
                    Ticket Details <img src="/img/Arrow-Right.svg" />
                  </Link>
                </div>
              </div>
              <div className="ticket-cards">
                <div className="ticket-inner">
                  <div className="ticket-lft">
                    <Form.Check />
                    <div>
                      <h5>Adele Concert</h5>
                      <p className="ref"># R123</p>
                    </div>
                  </div>
                  <div className="ticket-rgt">
                    <span className="status-badge complete">Completed</span>
                  </div>
                </div>
                <div className="ticket-bottom">
                  <p>
                    Booking Date <span>Tue 30 Sep</span>{" "}
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
                    Total paid <span>$200</span>
                  </p>
                  <p>
                    <span>
                      <img src="/img/ticket-white.svg" />
                    </span>{" "}
                    <span>2 tickets</span>
                  </p>
                  <Link href="/TicketDetails">
                    Ticket Details <img src="/img/Arrow-Right.svg" />
                  </Link>
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
