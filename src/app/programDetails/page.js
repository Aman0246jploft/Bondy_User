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
    "/img/program-process-image-1.png",
    "/img/program-process-image-2.png",
    "/img/program-process-image-4.png",
    "/img/program-process-image-1.png",
  ];

  return (
    <>
      <Header />
      <div className="event-page-wrapper">
        <Container>
          <Row className="align-items-start mb-5">
            <Col lg={7} className="mb-4">
              <div className="header-box">
                <h1 className="event-title">Salsa for Beginners</h1>
                <p className="event-meta">
                  2h29m • May 1 – Jun 1 • 12 sessions
                </p>
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
                  <span className="price-text">$200</span> onwards
                </h4>
                <Link href="/eventbooking" className="common_btn">
                  Book Now
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
                spaceBetween={20} // Gap ko zero kar diya
                slidesPerView={1} // Default mobile ke liye 1 slide
                centeredSlides={true}
                loop={true}
                speed={800}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: false,
                }}
                breakpoints={{
                  // Jab screen 768px se badi ho
                  768: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                  },
                  // Jab screen 1024px se badi ho
                  1024: {
                    slidesPerView: 3, // Ya phir 'auto' agar images ki width fixed hai
                    spaceBetween: 20,
                  },
                }}
                className="mySwiper">
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

                  <Link className="view-map" href="">
                    View in Map
                  </Link>
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

                <div className="organization_profile">
                  <h4>Organized By</h4>
                  <div className="item_org">
                    <img src="/img/prfl.png" />
                    <span>Marco & Elena</span>
                  </div>
                </div>

                <div className="content-section m-0">
                  <h3 className="section-heading">Event Gallery</h3>
                  <div className="gallery-grid">
                    {/* Main Large Image */}
                    <img
                      src="/img/program-process-image-01.png"
                      className="gallery-item large-gallery-item"
                      alt="Conference Hall"
                    />

                    {/* Small Images */}
                    <img
                      src="/img/program-process-image-02.png"
                      className="gallery-item"
                      alt="Live Music"
                    />
                    <img
                      src="/img/program-process-image-03.png"
                      className="gallery-item"
                      alt="Drums"
                    />
                    <img
                      src="/img/program-process-image-04.png"
                      className="gallery-item"
                      alt="Stage Crowd"
                    />

                    {/* Second row of small images */}
                    <img
                      src="/img/program-process-image-05.png"
                      className="gallery-item"
                      alt="Networking"
                    />
                    <img
                      src="/img/program-process-image-06.png"
                      className="gallery-item"
                      alt="Audience"
                    />
                    <img
                      src="/img/program-process-image-07.png"
                      className="gallery-item"
                      alt="Presentation"
                    />
                  </div>
                  <div className="onwards_sec mt-4">
                    <h4 className="mb-0">
                      <span className="price-text">$200</span>
                    </h4>
                    <Link href="/eventbooking" className="common_btn">
                      Book Now
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
            <div className="upcming_session">
              <h4>Upcoming Sessions</h4>
              <div className="upcming_session_box">
                <div className="upcming_session_item">
                  <div className="content">
                    <div className="date_box">
                      <span>Oct</span>
                      <span>12</span>
                    </div>
                    <div className="upcming_session_content">
                      <span>Mon • 18:00 - 19:00</span>
                      <h6>Core Integration</h6>
                    </div>
                  </div>
                  <div className="booking_bx">
                    <span className="text_pr">$150</span>
                    <Link href="/eventbooking" className="common_btn">
                      Book Now
                    </Link>
                  </div>
                </div>
                <div className="upcming_session_item">
                  <div className="content">
                    <div className="date_box">
                      <span>Oct</span>
                      <span>13</span>
                    </div>
                    <div className="upcming_session_content">
                      <span>Wed • 18:00 - 19:00</span>
                      <h6>Flow & Balance</h6>
                    </div>
                  </div>
                  <div className="booking_bx">
                    <span className="text_pr">$160</span>
                    <Link href="/eventbooking" className="common_btn">
                      Book Now
                    </Link>
                  </div>
                </div>
                <div className="upcming_session_item">
                  <div className="content">
                    <div className="date_box">
                      <span>Oct</span>
                      <span>14</span>
                    </div>
                    <div className="upcming_session_content">
                      <span>Mon • 18:00 - 19:00</span>
                      <h6>Core Integration</h6>
                    </div>
                  </div>
                  <div className="booking_bx">
                    <span className="text_pr">$110</span>
                    <Link href="/eventbooking" className="common_btn">
                      Book Now
                    </Link>
                  </div>
                </div>
                <div className="upcming_session_item">
                  <div className="content">
                    <div className="date_box">
                      <span>Oct</span>
                      <span>15</span>
                    </div>
                    <div className="upcming_session_content">
                      <span>Fri • 10:00 - 11:30</span>
                      <h6>Morning Hatha Yoga</h6>
                    </div>
                  </div>
                  <div className="booking_bx">
                    <span className="text_pr">$180</span>
                    <Link href="/eventbooking" className="common_btn">
                      Book Now
                    </Link>
                  </div>
                </div>
                <div className="upcming_session_item">
                  <div className="content">
                    <div className="date_box">
                      <span>Oct</span>
                      <span>16</span>
                    </div>
                    <div className="upcming_session_content">
                      <span>Sat • 14:00 - 15:30</span>
                      <h6>Morning Hatha Yoga</h6>
                    </div>
                  </div>
                  <div className="booking_bx">
                    <span className="text_pr">$170</span>
                    <Link href="/eventbooking" className="common_btn">
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        <div className="recommended-section program_page">
          <Row className="gy-5">
            <div className="fz_32">
              <h2>Event You May like</h2>
            </div>

            <Col xl={3} lg={4} md={6}>
              <div className="event_main_cart">
                <div className="recommended-card">
                  <img src="/img/imageholder.png" alt="Nora Bayes" />
                </div>

                <div className="card-overlay">
                  <div className="overlay-content program_cart">
                    <div className="program_cart_inner">
                      <Link href="/programDetails">
                        <div className="program_cart_cntent">
                          <h4>Salsa for Beginners</h4>
                          <span>With Marco & Elena</span>
                        </div>
                      </Link>
                      <Link href="/profile">
                        {" "}
                        <img src="/img/prfl.png" />
                      </Link>
                    </div>
                    <ul className="program_time">
                      <li>
                        <img src="/img/session_icon.svg" />
                        2hrs
                      </li>
                      <li>
                        <img src="/img/time_icon.svg" />
                        12 sessions
                      </li>
                      <li>
                        <img src="/img/0date_icon.svg" />
                        May 1 – Jun 1
                      </li>
                    </ul>

                    <div className="price_align">
                      <span>$300</span>
                      <Link href="/eventbooking" className="common_btn">
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            <Col xl={3} lg={4} md={6}>
              <div className="event_main_cart">
                <div className="recommended-card">
                  <img src="/img/imageholder-1.png" alt="Nora Bayes" />
                </div>

                <div className="card-overlay">
                  <div className="overlay-content program_cart">
                    <div className="program_cart_inner">
                      <Link href="/programDetails">
                        <div className="program_cart_cntent">
                          <h4>Salsa for Beginners</h4>
                          <span>With Marco & Elena</span>
                        </div>
                      </Link>
                      <Link href="/profile">
                        {" "}
                        <img src="/img/prfl.png" />
                      </Link>
                    </div>
                    <ul className="program_time">
                      <li>
                        <img src="/img/session_icon.svg" />
                        2hrs
                      </li>
                      <li>
                        <img src="/img/time_icon.svg" />
                        12 sessions
                      </li>
                      <li>
                        <img src="/img/0date_icon.svg" />
                        May 1 – Jun 1
                      </li>
                    </ul>

                    <div className="price_align">
                      <span className="redText">Seats Full</span>
                      <Link href="" className="common_btn">
                        Join Waitlist
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            <Col xl={3} lg={4} md={6}>
              <div className="event_main_cart">
                <div className="recommended-card">
                  <img src="/img/imageholder-2.png" alt="Nora Bayes" />
                </div>

                <div className="card-overlay">
                  <div className="overlay-content program_cart">
                    <div className="program_cart_inner">
                      <Link href="/programDetails">
                        <div className="program_cart_cntent">
                          <h4>Salsa for Beginners</h4>
                          <span>With Marco & Elena</span>
                        </div>
                      </Link>
                      <Link href="/profile">
                        {" "}
                        <img src="/img/prfl.png" />
                      </Link>
                    </div>
                    <ul className="program_time">
                      <li>
                        <img src="/img/session_icon.svg" />
                        2hrs
                      </li>
                      <li>
                        <img src="/img/time_icon.svg" />
                        12 sessions
                      </li>
                      <li>
                        <img src="/img/0date_icon.svg" />
                        May 1 – Jun 1
                      </li>
                    </ul>

                    <div className="price_align">
                      <span>$300</span>
                      <Link href="/eventbooking" className="common_btn">
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            <Col xl={3} lg={4} md={6}>
              <div className="event_main_cart">
                <div className="recommended-card">
                  <img src="/img/imageholder-3.png" alt="Nora Bayes" />
                </div>

                <div className="card-overlay">
                  <div className="overlay-content program_cart">
                    <div className="program_cart_inner">
                      <Link href="/programDetails">
                        <div className="program_cart_cntent">
                          <h4>Salsa for Beginners</h4>
                          <span>With Marco & Elena</span>
                        </div>
                      </Link>
                      <Link href="/profile">
                        {" "}
                        <img src="/img/prfl.png" />
                      </Link>
                    </div>
                    <ul className="program_time">
                      <li>
                        <img src="/img/session_icon.svg" />
                        2hrs
                      </li>
                      <li>
                        <img src="/img/time_icon.svg" />
                        12 sessions
                      </li>
                      <li>
                        <img src="/img/0date_icon.svg" />
                        May 1 – Jun 1
                      </li>
                    </ul>

                    <div className="price_align">
                      <span className="redText">Seats Full</span>
                      <Link href="" className="common_btn">
                        Join Waitlist
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Container>

      <FAQ />
      <Footer />
    </>
  );
}
