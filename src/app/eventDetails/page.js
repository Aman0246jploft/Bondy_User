"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Autoplay } from "swiper/modules";
import Map from "@/components/Map";
import Reviews from "@/components/Reviews";
import Header from "@/components/Header";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import EventSection from "@/components/EventSection";
import Link from "next/link";

export default function page() {
  const images = [
    "/img/interactive-process-image-1.png",
    "/img/interactive-process-image-2.png",
    "/img/interactive-process-image-4.png",
    "/img/interactive-process-image-1.png",
  ];

  return (
    <>
      <Header />
      <div className="event-page-wrapper">
        <Container>
          <Row className="align-items-start mb-5">
            <Col lg={7} className="mb-4">
              <div className="header-box">
                <h1 className="event-title">
                  Connecting Minds to Shape
                  <br /> Tomorrow's Big Ideas
                </h1>
                <p className="event-meta">2h29m • Comedy show • Live</p>
                <Button className="book_mark_icon">
                  <img src="/img/bookmark_icon.svg" />
                </Button>
              </div>
            </Col>

            <Col lg={5} className="">
              <p className="event-desc mb-4">
                Discover the vision that drives this event—a commitment to
                bringing together innovators, leaders, and changemakers to share
                knowledge, spark inspiration, and create meaningful connections.
              </p>
              <div className="onwards_sec">
                <h4 className="mb-0">
                  <span className="price-text">$599 to $799</span> onwards
                </h4>
                <Link href="/eventbooking" className="common_btn">
                  Book Ticket Now
                </Link>
                <Button className="book_mark_icon">
                  <img src="/img/share_icon.svg" />
                </Button>
              </div>
            </Col>
          </Row>
        </Container>

        <div className="event_details_slider">
          <Row>
            <Col xs={12}>
              <Swiper
                modules={[Autoplay]}
                spaceBetween={20}
                slidesPerView={1.5}
                centeredSlides={true}
                loop={true}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: false,
                }}
                speed={800}
                breakpoints={{
                  768: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                  },
                  1024: {
                    slidesPerView: 2.5,
                    spaceBetween: 20,
                  },
                }}>
                {images.map((img, index) => (
                  <SwiperSlide key={index}>
                    <div
                      className="event-card-img"
                      style={{ backgroundImage: `url(${img})` }}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </Col>
          </Row>
        </div>
      </div>

      <Container>
        <Row>
          <Col lg={8}>
            <Container>
              <div className="event-details-container details_Event_box">
                <div className="details_Event_time">
                  <div className="event_time_mange">
                    <h5>Date & Time</h5>
                    <span>
                      Fri oct 25 2024 at 06:30 pm to 11:00 pm (GMT + 05:30)
                    </span>
                  </div>
                  <div className="event_time_mange">
                    <h5>Location</h5>
                    <span>
                      45/2 Central Business Innovation Near International Trade
                      Tower
                    </span>
                  </div>
                  <div className="event_time_mange">
                    <h5>Date & Time</h5>
                    <span>
                      Fri oct 25 2024 at 06:30 pm to 11:00 pm (GMT + 05:30)
                    </span>
                  </div>
                </div>
                <div className="map-container">
                  <Map />
                </div>

                {/* Text Content Sections */}
                <div className="content-section">
                  <h2 className="section-heading">
                    Leadership & Growth Conference
                  </h2>
                  <p className="section-text">
                    Join us for an inspiring and action-packed event designed to
                    bring together creators, professionals, and innovators from
                    all walks of life. This event features expert-led sessions,
                    interactive workshops, and powerful networking opportunities
                    that help you learn, grow, and connect with like-minded
                    individuals.
                  </p>
                </div>

                <div className="content-section">
                  <h3 className="section-heading">What to expect</h3>
                  <p className="section-text">
                    Experience a dynamic gathering filled with insightful
                    sessions, expert speakers, hands-on workshops, and endless
                    networking opportunities. From inspiring keynotes to
                    real-world learning, our event is designed to spark ideas,
                    build connections, and help you grow personally and
                    professionally.
                  </p>
                </div>

                {/* Event Gallery Section */}
                <div className="content-section">
                  <h3 className="section-heading">Event Gallery</h3>
                  <div className="gallery-grid">
                    {/* Main Large Image */}
                    <img
                      src="/img/details_img01.png"
                      className="gallery-item large-gallery-item"
                      alt="Conference Hall"
                    />

                    {/* Small Images */}
                    <img
                      src="/img/details_img02.png"
                      className="gallery-item"
                      alt="Live Music"
                    />
                    <img
                      src="/img/details_img03.png"
                      className="gallery-item"
                      alt="Drums"
                    />
                    <img
                      src="/img/details_img04.png"
                      className="gallery-item"
                      alt="Stage Crowd"
                    />

                    {/* Second row of small images */}
                    <img
                      src="/img/details_img05.png"
                      className="gallery-item"
                      alt="Networking"
                    />
                    <img
                      src="/img/details_img06.png"
                      className="gallery-item"
                      alt="Audience"
                    />
                    <img
                      src="/img/details_img07.png"
                      className="gallery-item"
                      alt="Presentation"
                    />
                  </div>
                  <div className="onwards_sec mt-4">
                    <h4 className="mb-0">
                      <span className="price-text">$599 to $799</span> onwards
                    </h4>
                    <Link href="/eventbooking" className="common_btn">
                      Book Ticket Now
                    </Link>
                    <Button className="book_mark_icon">
                      <img src="/img/share_icon.svg" />
                    </Button>
                  </div>
                </div>
              </div>
              <Reviews />
            </Container>
          </Col>
          <Col lg={4}>
            <div className="crowd_main">
              <div className="Insights_box">
                <div className="title_crowd">
                  <h3 className="">Crowd Insights</h3>
                </div>

                <div className="insights-card">
                  <span className="">Who is going</span>

                  <div className="  whisiGoing_box">
                    <div>
                      <h2>48</h2>
                      <small className="text-secondary">Attendees</small>
                    </div>

                    <div className="">
                      <div className="avatar-stack me-3">
                        <img
                          src="/img/Ellipse.png"
                          className="avatar-img"
                          alt="user"
                          style={{ marginLeft: 0 }}
                        />
                        <img
                          src="/img/Ellipse-1.png"
                          className="avatar-img"
                          alt="user"
                        />
                        <img
                          src="/img/Ellipse-2.png"
                          className="avatar-img"
                          alt="user"
                        />
                        <img
                          src="/img/Ellipse-3.png"
                          className="avatar-img"
                          alt="user"
                        />
                        <div className="avatar-count">5k+</div>
                      </div>
                    </div>
                    <a
                      href="#"
                      className="text-teal text-decoration-none small"
                      style={{ color: "#26a69a" }}>
                      View All
                    </a>
                  </div>

                  <hr className="border-secondary opacity-25 my-4" />

                  <div className="mt-3">
                    <span>Events Seats</span>
                    <p className="small mb-2">Seats Booked - 1000</p>
                    <div className="custom-progress-bg mb-2">
                      <div
                        className="custom-progress-bar"
                        style={{ width: "65%" }}></div>
                    </div>
                    <div className="text-end">
                      <small className="small">Seats left - 500</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="title_crowd mt-4">
                <h3 className="">This event sponsored by</h3>
              </div>
              <div className="sponsor-card">
                <div className="sponsor-card_profile">
                  <img
                    src="/img/img.svg"
                    className="sponsor-img"
                    alt="Sponsor"
                  />
                  <h5 className="mb-0 fw-semibold">Esther Howard</h5>
                </div>
                <Button className="btn-book py-2 px-4">View Details</Button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <div className="details_fq">
        <FAQ />
      </div>
      <EventSection
        type="recommended"
        limit={4}
        showSeeAll={false}
        customTitle="Events You May Like"
      />
      <Footer />
    </>
  );
}
