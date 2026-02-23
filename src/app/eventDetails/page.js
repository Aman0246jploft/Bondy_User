"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import eventApi from "@/api/eventApi";
import wishlistApi from "@/api/wishlistApi";
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

import { getFullImageUrl } from "@/utils/imageHelper";

function EventDetailsContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");
  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  const [attendees, setAttendees] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      try {
        const response = await eventApi.getEventDetails(eventId);
        if (response.status) {
          setEvent(response.data.event);
          setReviews(response.data.reviews || []);
          setComments(response.data.comments || []);
          setAttendees(response.data.attendees);
          setIsWishlisted(response.data.event.isWishlisted || false);
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
      }
    };

    fetchEventDetails();
  }, [eventId]);


  const handleWishlistToggle = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (wishlistLoading) return;
    setWishlistLoading(true);

    try {
      if (isWishlisted) {
        const response = await wishlistApi.removeFromWishlist({ entityId: eventId });
        if (response.status) {
          setIsWishlisted(false);
        }
      } else {
        const response = await wishlistApi.addToWishlist({
          entityId: eventId,
          entityModel: "Event"
        });
        if (response.status) {
          setIsWishlisted(true);
        }
      }
    } catch (error) {
      console.error("Wishlist toggle error:", error);
    } finally {
      setWishlistLoading(false);
    }
  };

  const mediaItems = [
    ...(event?.shortTeaserVideo || []).map((url) => ({ type: "video", url })),
    ...(event?.posterImage || []).map((url) => ({ type: "image", url })),
    ...(event?.mediaLinks || []).map((url) => ({ type: "image", url })),
  ];

  const formatEventDateTime = (start, sTime, eTime) => {
    if (!start) return "";
    const date = new Date(start);
    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const formatTime = (time) => {
      if (!time) return "";
      const [h, m] = time.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "pm" : "am";
      const h12 = hour % 12 || 12;
      return `${String(h12).padStart(2, "0")}:${m} ${ampm}`;
    };

    return `${dateStr} at ${formatTime(sTime)} to ${formatTime(eTime)}`;
  };

  return (
    <>
      <Header />
      <div className="event-page-wrapper">
        <Container>
          <Row className="align-items-start mb-5">
            <Col lg={7} className="mb-4">
              <div className="header-box">
                <h1 className="event-title">
                  {event?.eventTitle}
                  <br />
                </h1>
                <p className="event-meta">
                  {event?.duration} • {event?.eventCategory?.name} •{" "}
                  {event?.status}
                </p>
                <Button className="book_mark_icon" onClick={handleWishlistToggle} disabled={wishlistLoading}>
                  <img src={isWishlisted ? "/img/bookmark_filled_icon.svg" : "/img/bookmark_icon.svg"} alt="Bookmark" />
                </Button>
              </div>
            </Col>

            <Col lg={5} className="">
              <p className="event-desc mb-4">{event?.shortdesc}</p>
              <div className="onwards_sec">
                <h4 className="mb-0">
                  <span className="price-text">${event?.ticketPrice} </span>
                </h4>
                <Link
                  href={`/eventbooking?eventId=${event?._id}`}
                  className="common_btn"
                >
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
                }}
              >
                {mediaItems && mediaItems?.map((item, index) => (
                  <SwiperSlide key={index}>
                    {item.type === "video" ? (
                      <a
                        href={getFullImageUrl(item.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="event-card-img d-block"
                        style={{ display: "block" }}
                      >
                        <video
                          src={getFullImageUrl(item.url)}
                          className="w-100 h-100 object-fit-cover rounded-4"
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      </a>
                    ) : (
                      <a
                        href={getFullImageUrl(item.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="event-card-img d-block"
                        style={{
                          backgroundImage: `url(${getFullImageUrl(item.url)})`,
                        }}
                      />
                    )}
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
                      {formatEventDateTime(
                        event?.startDate,
                        event?.startTime,
                        event?.endTime,
                      )}
                    </span>
                  </div>
                  <div className="event_time_mange">
                    <h5>Location</h5>
                    <span>{event?.venueAddress?.address}</span>
                  </div>
                  {/* <div className="event_time_mange">
                    <h5>Date & Time</h5>
                    <span>
                      {formatEventDateTime(
                        event?.startDate,
                        event?.startTime,
                        event?.endTime
                      )}
                    </span>
                  </div> */}
                </div>
                <div className="map-container">
                  <Map />
                </div>

                {/* Text Content Sections */}
                <div className="content-section">
                  <h2 className="section-heading">{event?.eventTitle}</h2>
                  <p className="section-text">{event?.shortdesc}</p>
                </div>

                <div className="content-section">
                  <h3 className="section-heading">What to expect</h3>
                  <p className="section-text">{event?.longdesc}</p>
                </div>

                {/* Event Gallery Section */}
                <div className="content-section">
                  <h3 className="section-heading">Event Gallery</h3>
                  <div className="gallery-grid">
                    {mediaItems.length > 0 ? (
                      mediaItems.map((item, index) => (
                        <a
                          key={index}
                          href={getFullImageUrl(item.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`gallery-item ${index === 0 ? "large-gallery-item" : ""
                            }`}
                          style={{ display: "block", textDecoration: "none" }}
                        >
                          {item.type === "video" ? (
                            <video
                              src={getFullImageUrl(item.url)}
                              className="w-100 h-100 object-fit-cover"
                              muted
                              loop
                              playsInline
                              autoPlay
                            />
                          ) : (
                            <img
                              src={getFullImageUrl(item.url)}
                              className="w-100 h-100 object-fit-cover"
                              alt={`Gallery item ${index + 1}`}
                            />
                          )}
                        </a>
                      ))
                    ) : (
                      <p>No gallery items available.</p>
                    )}
                  </div>
                  <div className="onwards_sec mt-4">
                    <h4 className="mb-0">
                      <span className="price-text">${event?.ticketPrice} </span>
                    </h4>
                    <Link
                      href={`/eventbooking?eventId=${event?._id}`}
                      className="common_btn"
                    >
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
                      <h2>{attendees?.total || 0}</h2>
                      <small className="text-secondary">Attendees</small>
                    </div>

                    <div className="">
                      <div className="avatar-stack me-3">
                        {attendees?.recent?.length > 0 ? (
                          <>
                            {attendees.recent.slice(0, 4).map((user, index) => (
                              <img
                                key={user._id}
                                src={
                                  user.profileImage
                                    ? getFullImageUrl(user.profileImage)
                                    : "/img/default-user.png"
                                }
                                className="avatar-img"
                                alt={`${user.firstName} ${user.lastName}`}
                                style={index === 0 ? { marginLeft: 0 } : {}}
                              />
                            ))}
                            {attendees.total > 4 && (
                              <div className="avatar-count">
                                +{attendees.total - 4}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="small text-muted">
                            Be the first to join!
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={`/eventAttendees?id=${event?._id}`}
                      className="text-teal text-decoration-none small"
                      style={{ color: "#26a69a" }}
                    >
                      View All
                    </a>
                  </div>

                  <hr className="border-secondary opacity-25 my-4" />

                  <div className="mt-3">
                    <span>Events Seats</span>
                    {(() => {
                      const totalTickets = event?.totalTickets || 0;
                      const availableTickets = event?.ticketQtyAvailable || 0;
                      const bookedSeats = totalTickets - availableTickets;
                      const progress =
                        totalTickets > 0
                          ? (bookedSeats / totalTickets) * 100
                          : 0;

                      return (
                        <>
                          <p className="small mb-2">
                            Seats Booked - {bookedSeats}
                          </p>
                          <div className="custom-progress-bg mb-2">
                            <div
                              className="custom-progress-bar"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <div className="text-end">
                            <small className="small">
                              Seats left - {availableTickets}
                            </small>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="title_crowd mt-4">
                <h3 className="">This event sponsored by</h3>
              </div>
              <div className="sponsor-card">
                <div className="sponsor-card_profile">
                  <img
                    src={
                      event?.createdBy?.profileImage
                        ? getFullImageUrl(event?.createdBy?.profileImage)
                        : "/img/default-user.png"
                    }
                    className="sponsor-img"
                    alt="Sponsor"
                  />
                  <h5 className="mb-0 fw-semibold">
                    {event?.createdBy?.firstName} {event?.createdBy?.lastName}
                  </h5>
                </div>
                <Link href={`/profile?id=${event?.createdBy?._id}`} className="btn-book py-2 px-4 btn text-white text-decoration-none">
                  View Details
                </Link>
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

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventDetailsContent />
    </Suspense>
  );
}
