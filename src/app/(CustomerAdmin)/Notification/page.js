"use client";
import React from "react";
import { Tabs, Tab } from "react-bootstrap";

function page() {
  return (
    <div>
      <div className="cards notification-card">
        <div className="card-title">
          <h3>Notifications</h3>
          <p>
            Mark All as Read{" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M15.4933 6.93502C15.8053 7.20743 15.8374 7.68122 15.565 7.99325L7.70786 16.9933C7.56543 17.1564 7.35943 17.25 7.14287 17.25C6.9263 17.25 6.72031 17.1564 6.57788 16.9933L3.43502 13.3933C3.16261 13.0812 3.19473 12.6074 3.50677 12.335C3.8188 12.0626 4.29259 12.0947 4.565 12.4068L7.14287 15.3596L14.435 7.00677C14.7074 6.69473 15.1812 6.66261 15.4933 6.93502Z"
                fill="#999999"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M20.5175 7.01946C20.8174 7.30513 20.829 7.77986 20.5433 8.07981L11.9716 17.0798C11.8201 17.2389 11.6065 17.3235 11.3872 17.3114C11.1679 17.2993 10.9649 17.1917 10.8318 17.0169L10.4035 16.4544C10.1526 16.1249 10.2163 15.6543 10.5458 15.4034C10.8289 15.1878 11.2161 15.2044 11.4787 15.4223L19.4571 7.04531C19.7428 6.74537 20.2175 6.73379 20.5175 7.01946Z"
                fill="#999999"
              />
            </svg>
          </p>
        </div>
        <div className="ticket-tabs">
          <Tabs defaultActiveKey="all">
            <Tab eventKey="all" title="All (7)">
              <div className="notification-cards">
                <div>
                  <h5>
                    Welcome to <span>Bondy!</span>
                  </h5>
                  <p>
                    We’re glad to have you here! 🎉 Explore and book tickets for
                    the best concerts, theaters, and events. To get started,
                    complete your profile.
                  </p>
                </div>
                <p>Yesterday at 4:42 PM</p>
              </div>
              <div className="notification-cards">
                <div>
                  <h5>Your purchase is confirmed ✅</h5>
                  <p>
                    You can easily access your ticket anytime by heading over to
                    the "Tickets" section of your account.Get ready for an
                    unforgettable night filled with music, energy, and amazing
                    filled with music, energy, and amazing vibes! 💃🎶
                  </p>
                </div>
                <p>Yesterday at 4:42 PM</p>
              </div>
              <div className="notification-cards">
                <div>
                  <h5>Get 30% off on Summer Music Festival tickets 🎉 </h5>
                  <p>
                    Don’t miss this special offer! Use discount code: MUSIC30
                    (Valid until midnight).
                  </p>
                </div>
                <p>Yesterday at 4:42 PM</p>
              </div>
              <div className="notification-cards">
                <div>
                  <h5> Your payment was unsuccessful ❌</h5>
                  <p>
                    Your payment for Startup Summit 2025 was not completed.
                    Please try again or contact support.
                  </p>
                </div>
                <p>Yesterday at 4:42 PM</p>
              </div>
              <div className="notification-cards">
                <div>
                  <h5> Response from Support 📩</h5>
                  <p>
                    Our support team has responded to your request regarding
                    "Canceling your Shakespeare Theater Ticket." Check the
                    "Support Messages" section for details. To view the full
                    details and next steps, please head over to the “Support
                    Messages” section in your account.
                  </p>
                </div>
                <p>Yesterday at 4:42 PM</p>
              </div>
            </Tab>
            <Tab eventKey="unread" title="Unread (3)">
              <div className="notification-cards">
                <div>
                  <h5>
                    Welcome to <span>Bondy!</span>
                  </h5>
                  <p>
                    We’re glad to have you here! 🎉 Explore and book tickets for
                    the best concerts, theaters, and events. To get started,
                    complete your profile.
                  </p>
                </div>
                <p>Yesterday at 4:42 PM</p>
              </div>
              <div className="notification-cards">
                <div>
                  <h5>Your purchase is confirmed ✅</h5>
                  <p>
                    You can easily access your ticket anytime by heading over to
                    the "Tickets" section of your account.Get ready for an
                    unforgettable night filled with music, energy, and amazing
                    filled with music, energy, and amazing vibes! 💃🎶
                  </p>
                </div>
                <p>Yesterday at 4:42 PM</p>
              </div>
              <div className="notification-cards">
                <div>
                  <h5>Get 30% off on Summer Music Festival tickets 🎉 </h5>
                  <p>
                    Don’t miss this special offer! Use discount code: MUSIC30
                    (Valid until midnight).
                  </p>
                </div>
                <p>Yesterday at 4:42 PM</p>
              </div>
            </Tab>
            <Tab eventKey="read" title="Read (4)">
              <div className="notification-cards">
                <div>
                  <h5>
                    Welcome to <span>Bondy!</span>
                  </h5>
                  <p>
                    We’re glad to have you here! 🎉 Explore and book tickets for
                    the best concerts, theaters, and events. To get started,
                    complete your profile.
                  </p>
                </div>
                <p>Yesterday at 4:42 PM</p>
              </div>
              <div className="notification-cards">
                <div>
                  <h5>Your purchase is confirmed ✅</h5>
                  <p>
                    You can easily access your ticket anytime by heading over to
                    the "Tickets" section of your account.Get ready for an
                    unforgettable night filled with music, energy, and amazing
                    filled with music, energy, and amazing vibes! 💃🎶
                  </p>
                </div>
                <p>Yesterday at 4:42 PM</p>
              </div>
              <div className="notification-cards">
                <div>
                  <h5>Get 30% off on Summer Music Festival tickets 🎉 </h5>
                  <p>
                    Don’t miss this special offer! Use discount code: MUSIC30
                    (Valid until midnight).
                  </p>
                </div>
                <p>Yesterday at 4:42 PM</p>
              </div>
              <div className="notification-cards">
                <div>
                  <h5> Your payment was unsuccessful ❌</h5>
                  <p>
                    Your payment for Startup Summit 2025 was not completed.
                    Please try again or contact support.
                  </p>
                </div>
                <p>Yesterday at 4:42 PM</p>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default page;
