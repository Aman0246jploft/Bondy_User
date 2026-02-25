import Link from "next/link";
import React from "react";
import { Col, Row } from "react-bootstrap";

function page() {
  return (
    <div>
      <div className="cards event-details">
        <Link href="" className="back-btn">
          <img src="/img/arrow-left-white.svg" alt="Back" />
          Back to List
        </Link>
        <h4 className="line-title">
          <span>Event Details</span>
        </h4>
        <Row>
          <Col md={2}>
            <div className="event-dtl-card">
              <div className="event-dtl-card-img">
                <img src="/img/org-img/event-dtl-img.png" alt="Ticket Icon" />
              </div>
              <h3>Adele Concert</h3>
            </div>
          </Col>
          <Col md={10}>
            <ul className="event-dtl-rgt">
              <li>
                <h6>Category</h6>
                <p>Sports</p>
              </li>
              <li>
                <h6>Created Date</h6>
                <p>Tue 30 Sep - 7:30 PM</p>
              </li>
              <li>
                <h6>Organizer Name</h6>
                <p>Esther Howard</p>
              </li>
              <li>
                <h6>Tags</h6>
                <p>Music</p>
              </li>
              <li>
                <span className="status-badge pending">Upcoming</span>
              </li>
            </ul>
          </Col>
        </Row>
        <div className="time-location common-dtl-list mt-20">
          <h4 className="line-title">
            <span>Date time and Location</span>
          </h4>
          <ul className="event-dtl-rgt">
            <li>
              <h6>Venue Name</h6>
              <p>Arena Stadium </p>
            </li>
            <li>
              <h6>
                <img src="/img/white-calendar.svg" alt="" />
                Start Date
              </h6>
              <p>
                <span>Tue 30 Sep</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="4"
                  height="4"
                  viewBox="0 0 4 4"
                  fill="none"
                >
                  <circle cx="2" cy="2" r="2" fill="#999999" />
                </svg>
                <span>7:30 PM</span>
              </p>
            </li>
            <li>
              <h6>
                <img src="/img/white-calendar.svg" alt="" />
                End Date
              </h6>
              <p>
                <span>Thu 2 Oct</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="4"
                  height="4"
                  viewBox="0 0 4 4"
                  fill="none"
                >
                  <circle cx="2" cy="2" r="2" fill="#999999" />
                </svg>
                <span>7:30 PM</span>
              </p>
            </li>
            <li>
              <h6>
                <img src="/img/Map-Point.svg" alt="" />
                Location
              </h6>
              <p>
                American Airlines Center <br /> Dallas,Texas,USA
              </p>
            </li>
            <li>
              <h6>
                <img src="/img/clock.svg" alt="" />
                Time Zone
              </h6>
              <p>GMT-5</p>
            </li>
          </ul>
        </div>
        <div className="ticket-pricing common-dtl-list mt-20">
          <h4 className="line-title">
            <span>Ticket & Pricing</span>
          </h4>
          <ul className="event-dtl-rgt">
            <li>
              <h6>Ticket Name</h6>
              <p>Negar khosravi </p>
            </li>
            <li>
              <h6>Quantity Available</h6>
              <p>200</p>
            </li>
            <li>
              <h6>Price Per Ticket</h6>
              <p>$260</p>
            </li>
            <li>
              <h6>Coupon</h6>
              <p>zZVIxGUw</p>
            </li>
            <li>
              <h6>Sale Start Date</h6>
              <p>Tue 15 Sep</p>
            </li>
            <li>
              <h6>Sale End Date</h6>
              <p>Mon 29 Sep</p>
            </li>
            <li>
              <h6>Refund Policy</h6>
              <p>No Refunds</p>
            </li>
          </ul>
        </div>
        <div className="short-desc">
          <h4 className="line-title">
            <span>Short Description</span>
          </h4>
          <p>
            Experience an unforgettable music concert filled with energy,
            passion, and powerful live performances. Enjoy electrifying beats,
            stunning lights, and an atmosphere that brings music lovers
            together. From soulful melodies to high-energy rhythms, every moment
            is crafted to create lasting memories and pure musical excitement.
          </p>
        </div>
        <div className="long-desc mt-20">
          <h4 className="line-title">
            <span>Detailed Description/Highlights</span>
          </h4>
          <p>
            Experience a spectacular music concert that blends powerful live
            performances with immersive sound and vibrant lighting. Enjoy a
            carefully curated lineup delivering soulful melodies, energetic
            beats, and crowd-moving rhythms. The concert offers a dynamic
            atmosphere where music lovers connect, dance, and celebrate
            together. High-quality audio, stunning visuals, and engaging stage
            presence create an unforgettable experience. Whether you enjoy
            relaxing tunes or high-energy tracks, this event promises nonstop
            entertainment, memorable moments, and an electrifying vibe from
            start to finish.
          </p>
        </div>
        <div className="gellry-images">
          <h4 className="line-title">
            <span>Gallery</span>
          </h4>
          <div className="gallery-grid">
            <div className="gallery-item large">
              <img src="/img/org-img/gallery-img-01.png" alt="Event" />
            </div>

            <div className="gallery-item">
              <img src="/img/org-img/gallery-img-02.png" alt="Event" />
            </div>
            <div className="gallery-item">
              <img src="/img/org-img/gallery-img-03.png" alt="Event" />
            </div>
            <div className="gallery-item">
              <img src="/img/org-img/gallery-img-04.png" alt="Event" />
            </div>
            <div className="gallery-item">
              <img src="/img/org-img/gallery-img-05.png" alt="Event" />
            </div>
            <div className="gallery-item">
              <img src="/img/org-img/gallery-img-06.png" alt="Event" />
            </div>
            <div className="gallery-item">
              <img src="/img/org-img/gallery-img-07.png" alt="Event" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default page;
