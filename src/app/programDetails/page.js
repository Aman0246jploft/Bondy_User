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
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import courseApi from "@/api/courseApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import { formatDate } from "@/utils/dateFormater";

export default function page() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [courseDetails, setCourseDetails] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchDetails = async () => {
        try {
          const response = await courseApi.getCourseDetails(id);
          if (response && response.data) {
            setCourseDetails(response.data);
          }
        } catch (error) {
          console.error("Error fetching course details:", error);
        }
      };
      fetchDetails();
    }
  }, [id]);

  console.log("Course Details:", courseDetails);

  if (!courseDetails) {
    return (
      <>
        <Header />
        <Container className="my-5 text-center">
          <h2>Loading...</h2>
        </Container>
        <Footer />
      </>
    );
  }

  const {
    courseTitle,
    posterImage,
    shortdesc,
    price,
    duration,
    currentSchedule,
    schedules,
    venueAddress,
    createdBy,
    enrollmentType,
  } = courseDetails;

  const images =
    posterImage && posterImage.length > 0
      ? posterImage.map(getFullImageUrl)
      : ["/img/program-process-image-1.png"];

  // Helper to resolve location string
  const locationString = venueAddress
    ? `${venueAddress.address}, ${venueAddress.city}, ${venueAddress.state}`
    : "Location not available";

  return (
    <>
      <Header />
      <div className="event-page-wrapper">
        <Container>
          <Row className="align-items-start mb-5">
            <Col lg={7} className="mb-4">
              <div className="header-box">
                <h1 className="event-title">{courseTitle}</h1>
                <p className="event-meta">
                  {duration || "N/A"} •{" "}
                  {currentSchedule
                    ? `${formatDate(currentSchedule.startDate)} – ${formatDate(
                      currentSchedule.endDate
                    )}`
                    : "Dates N/A"}{" "}
                  • {schedules?.length || 0} sessions
                </p>
                <Button className="book_mark_icon">
                  <img src="/img/bookmark_icon.svg" />
                </Button>
              </div>
            </Col>

            <Col lg={5} className="">
              <p className="event-desc mb-4">{shortdesc}</p>
              <div className="onwards_sec">
                <h4 className="mb-0">
                  <span className="price-text">${price}</span> onwards
                </h4>
                <Link
                  href={`/eventbooking?id=${courseDetails._id}`}
                  className="common_btn"
                >
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
                spaceBetween={20}
                slidesPerView={1}
                centeredSlides={true}
                loop={true}
                speed={800}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: false,
                }}
                breakpoints={{
                  768: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                  },
                  1024: {
                    slidesPerView: 3,
                    spaceBetween: 20,
                  },
                }}
                className="mySwiper"
              >
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
                      {currentSchedule
                        ? `${formatDate(
                          currentSchedule.startDate
                        )} at ${currentSchedule.startTime} to ${currentSchedule.endTime}`
                        : "Detailed timing not available"}
                    </span>
                  </div>
                  <div className="event_time_mange">
                    <h5>Location</h5>
                    <span>{locationString}</span>
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
                  <h2 className="section-heading">Description</h2>
                  <p className="section-text">{shortdesc}</p>
                </div>

                <div className="organization_profile">
                  <h4>Organized By</h4>
                  <div className="item_org">
                    <img
                      src={
                        getFullImageUrl(createdBy?.profileImage) ||
                        "/img/prfl.png"
                      }
                      alt="Organizer"
                    />
                    <span>
                      {createdBy?.firstName} {createdBy?.lastName}
                    </span>
                  </div>
                </div>

                <div className="content-section m-0">
                  <h3 className="section-heading">Event Gallery</h3>
                  <div className="gallery-grid">
                    {images.slice(0, 5).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        className={`gallery-item ${idx === 0 ? "large-gallery-item" : ""
                          }`}
                        alt={`Gallery ${idx}`}
                      />
                    ))}
                  </div>
                  <div className="onwards_sec mt-4">
                    <h4 className="mb-0">
                      <span className="price-text">${price}</span>
                    </h4>
                    <Link
                      href={`/eventbooking?id=${courseDetails._id}`}
                      className="common_btn"
                    >
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
                {schedules && schedules.length > 0 ? (
                  schedules.map((schedule, idx) => {
                    const dateObj = new Date(schedule.startDate);
                    const month = dateObj.toLocaleString("default", {
                      month: "short",
                    });
                    const day = dateObj.getDate();
                    const dayName = dateObj.toLocaleString("default", {
                      weekday: "short",
                    });

                    return (
                      <div className="upcming_session_item" key={idx}>
                        <div className="content">
                          <div className="date_box">
                            <span>{month}</span>
                            <span>{day}</span>
                          </div>
                          <div className="upcming_session_content">
                            <span>
                              {dayName} • {schedule.startTime} -{" "}
                              {schedule.endTime}
                            </span>
                            <h6>{courseTitle} (Session {idx + 1})</h6>
                          </div>
                        </div>
                        <div className="booking_bx">
                          <span className="text_pr">
                            {schedule.isBooked ? "Booked" : (schedule.isFull ? "Full" : `$${price}`)}
                          </span>
                          {schedule.isBooked ? (
                            <span className="badge bg-success">Booked</span>
                          ) : schedule.isFull ? (
                            <span className="badge bg-danger">Full</span>
                          ) : (
                            <Link
                              href={`/eventbooking?id=${courseDetails._id}&scheduleId=${schedule._id}`}
                              className="common_btn"
                            >
                              Book Now
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p>No upcoming sessions found.</p>
                )}
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
