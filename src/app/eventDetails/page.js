"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import eventApi from "@/api/eventApi";
import wishlistApi from "@/api/wishlistApi";
import { useAuthGuard } from "@/context/AuthGuardContext";
import AuthButton from "@/components/AuthButton";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Autoplay } from "swiper/modules";
import Map from "@/components/Map";
import Header from "@/components/Header";
import FAQ from "@/components/FAQ";
import ExpandableText from "@/components/ExpandableText";
import Footer from "@/components/Footer";
import EventSection from "@/components/EventSection";
import Link from "next/link";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

import { getFullImageUrl } from "@/utils/imageHelper";
import { formatTime } from "@/utils/timeHelper";

function EventDetailsContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");
  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  const [attendees, setAttendees] = useState(null);
  const [similarEvents, setSimilarEvents] = useState([]);
  const [refundPolicy, setRefundPolicy] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { t, language } = useLanguage();
  const { checkAuth } = useAuthGuard();
  const router = useRouter();

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      try {
        const response = await eventApi.getEventDetails(eventId);
        if (response?.status) {
          setEvent(response?.data?.event);
          setReviews(response?.data?.reviews || []);
          setComments(response?.data?.comments || []);
          setAttendees(response?.data?.attendees);
          setSimilarEvents(response?.data?.similarEvents || []);
          setRefundPolicy(response?.data?.refundPolicy || response?.data?.event?.refundPolicy || "");
          setIsWishlisted(response?.data?.event?.isWishlisted || false);
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  useEffect(() => {
    if (event?.eventTitle) {
      document.title = `${event.eventTitle} | Bondy`;
    }
  }, [event]);


  const handleWishlistToggle = () => {
    checkAuth(async () => {
      if (wishlistLoading) return;
      setWishlistLoading(true);

      try {
        if (isWishlisted) {
          const response = await wishlistApi.removeFromWishlist({ entityId: eventId });
          if (response?.status === true) {
            toast.success(response?.message)
            setIsWishlisted(false);
          }
        } else {
          const response = await wishlistApi.addToWishlist({
            entityId: eventId,
            entityModel: "Event"
          });
          if (response?.status === true) {
            setIsWishlisted(true);
            toast.success(response?.message)
          }
        }
      } catch (error) {
        console.error("Wishlist toggle error:", error);
      } finally {
        setWishlistLoading(false);
      }
    });
  };

  const handleShare = async () => {
    const shareUrl = eventId
      ? `${window.location.origin}${window.location.pathname}?id=${eventId}`
      : window.location.href;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      toast.success(t("shareLinkCopied"));
    } catch (error) {
      console.error("Share failed:", error);
      toast.error(t("shareLinkCopyFailed"));
    }
  };

  const mediaItems = [
    ...(event?.shortTeaserVideo || []).map((url) => ({ type: "video", url })),
    ...(event?.posterImage || []).map((url) => ({ type: "image", url })),
    ...(event?.mediaLinks || []).map((url) => ({ type: "image", url })),
  ];

  const hasSingleMedia = mediaItems.length <= 1;

  const formatEventDateTime = (start, sTime, eTime) => {
    if (!start) return "";
    const date = new Date(start);
    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return `${dateStr} at ${formatTime(sTime, true, language)} to ${formatTime(eTime, true, language)}`;
  };

  // Get minimum ticket price from tickets array
  const getMinTicketPrice = (tickets) => {
    if (!tickets || tickets.length === 0) return null;
    const prices = tickets.map((tk) => tk.price).filter((p) => typeof p === "number");
    if (prices.length === 0) return null;
    return Math.min(...prices);
  };

  const minPrice = getMinTicketPrice(event?.tickets);

  // Check if "View All" attendees button should be shown
  const canShowViewAll = event?.showAttendees && attendees?.total > 0;

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
                  {language === "mn" ? event?.durationTranslation || event?.duration : event?.duration} • {event?.eventCategory?.name} •{" "}
                  {event?.status}
                </p>
                <Button className="book_mark_icon" onClick={handleWishlistToggle} disabled={wishlistLoading}>
                  <img src={isWishlisted ? "/img/bookmark_filled_icon.svg" : "/img/bookmark_icon.svg"} alt="Bookmark" />
                </Button>
              </div>
            </Col>

            <Col lg={5} className="">
              <div className="mb-4">
                <ExpandableText text={event?.shortdesc} limit={150} className="event-desc" />
              </div>
              <div className="onwards_sec">
                <h4 className="mb-0">
                  <span className="price-text">
                    {minPrice != null ? (minPrice === 0 ? (t("free") || "Free") : `₮${minPrice}`) : t("freeLabel")}
                  </span>
                </h4>
                <AuthButton
                  requiresAuth
                  onClick={() => router.push(`/eventbooking?eventId=${event?._id}`)}
                  className="common_btn"
                >
                  {t("bookTicketNow")}
                </AuthButton>
                <Button className="book_mark_icon" onClick={handleShare}>
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
                slidesPerView={hasSingleMedia ? 1 : 1.5}
                centeredSlides={!hasSingleMedia}
                loop={!hasSingleMedia}
                autoplay={
                  hasSingleMedia
                    ? false
                    : {
                      delay: 3000,
                      disableOnInteraction: false,
                    }
                }
                speed={800}
                breakpoints={
                  hasSingleMedia
                    ? {}
                    : {
                      768: {
                        slidesPerView: 2,
                        spaceBetween: 20,
                      },
                      1024: {
                        slidesPerView: 2.5,
                        spaceBetween: 20,
                      },
                    }
                }
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
                      >
                        <img
                          src={getFullImageUrl(item.url) || "/img/sidebar-logo.svg"}
                          onError={(e) => (e.target.src = "/img/sidebar-logo.svg")}
                          loading="lazy"
                          className="w-100 h-100 object-fit-cover rounded-4 img-placeholder"
                          alt={`Gallery item ${index + 1}`}
                        />
                      </a>
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
                    <h5>{t("dateAndTime")}</h5>
                    <span>
                      {formatEventDateTime(
                        event?.startDate,
                        event?.startTime,
                        event?.endTime,
                      )}
                    </span>
                  </div>
                  <div className="event_time_mange">
                    <h5>{t("location")}</h5>
                    <span>
                      {event?.venueName && <strong>{event.venueName}</strong>}
                      {event?.venueName && event?.venueAddress?.address && <br />}
                      {event?.venueAddress?.address}
                      {event?.venueAddress?.city && `, ${event.venueAddress.city}`}
                      {event?.venueAddress?.country && `, ${event.venueAddress.country}`}
                    </span>
                  </div>
                </div>
                <div className="map-container">
                  <Map
                    latitude={event?.venueAddress?.latitude ?? event?.venueAddress?.coordinates?.[1]}
                    longitude={event?.venueAddress?.longitude ?? event?.venueAddress?.coordinates?.[0]}
                    title={event?.eventTitle}
                    address={event?.venueAddress?.address}
                    venueName={event?.venueName}
                    imageUrl={event?.posterImage?.[0]}
                    ticketPrice={minPrice}
                    startDate={event?.startDate}
                    startTime={event?.startTime}
                    endTime={event?.endTime}
                  />
                </div>

                {/* Text Content Sections */}
                <div className="content-section">
                  <h2 className="section-heading">{event?.eventTitle}</h2>
                  <ExpandableText text={event?.shortdesc} limit={300} />
                </div>

                <div className="content-section">
                  <h3 className="section-heading">{t("whatToExpect")}</h3>
                  <ExpandableText text={event?.longdesc} limit={300} />
                </div>

                {/* Tickets Section */}
                {/* {event?.tickets && event.tickets.length > 0 && (
                  <div className="content-section">
                    <h3 className="section-heading">{t("tickets")}</h3>
                    <div className="tickets-list">
                      {event.tickets.map((ticket) => (
                        <div key={ticket._id} className="ticket-card">
                          <div className="ticket-card-header">
                            <h5 className="ticket-name">{ticket.ticketName}</h5>
                            <span className="ticket-price">₮{ticket.price}</span>
                          </div>
                          <p className="ticket-desc">{ticket.ticketShortDesc}</p>
                          <div className="ticket-meta">
                            <span className="ticket-avail">
                              {ticket.availableQty != null
                                ? `${ticket.availableQty} / ${ticket.qty} ${t("availability")}`
                                : `${ticket.qty} ${t("availability")}`}
                            </span>
                            {ticket.salesEnd && (
                              <span className="ticket-sale-end">
                                {t("salesEndOn")}{" "}
                                {new Date(ticket.salesEnd).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )} */}

                {/* Event Details Info */}
                <div className="content-section">
                  <h3 className="section-heading">{t("eventDetails")}</h3>
                  <div className="event-info-grid">
                    {event?.ageRestriction && (
                      <div className="event-info-item">
                        <span className="event-info-label">{t("ageRestriction")}</span>
                        <span className="event-info-value">{event.ageRestriction}</span>
                      </div>
                    )}
                    {event?.dressCode && (
                      <div className="event-info-item">
                        <span className="event-info-label">{t("dressCode")}</span>
                        <span className="event-info-value">{event.dressCode}</span>
                      </div>
                    )}
                    {/* {event?.visibility && (
                      <div className="event-info-item">
                        <span className="event-info-label">{t("visibility")}</span>
                        <span className="event-info-value">{event.visibility}</span>
                      </div>
                    )} */}
                    {(refundPolicy || event?.refundPolicy) && (
                      <div className="event-info-item">
                        <span className="event-info-label">{t("refundPolicy")}</span>
                        <span className="event-info-value">{refundPolicy || event?.refundPolicy}</span>
                      </div>
                    )}
                    {/* {event?.addOns && (
                      <div className="event-info-item">
                        <span className="event-info-label">{t("addons")}</span>
                        <span className="event-info-value">{event.addOns}</span>
                      </div>
                    )} */}
                    {event?.notes && (
                      <div className="event-info-item">
                        <span className="event-info-label">{t("notes")}</span>
                        <span className="event-info-value">{event.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Gallery Section */}
                <div className="content-section">
                  <h3 className="section-heading">{t("eventGallery")}</h3>
                  <div className="gallery-grid">
                    {mediaItems.length > 0 ? (
                      mediaItems.map((item, index) => (
                        <a
                          key={index}
                          href={getFullImageUrl(item.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`gallery-item ${index === 0 ? "large-gallery-item" : ""}
                            `}
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
                              src={getFullImageUrl(item.url) || "/img/sidebar-logo.svg"}
                              onError={(e) => (e.target.src = "/img/sidebar-logo.svg")}
                              loading="lazy"
                              className="w-100 h-100 object-fit-cover img-placeholder"
                              alt={`${t("galleryItemAlt")} ${index + 1}`}
                            />
                          )}
                        </a>
                      ))
                    ) : (
                      <p>{t("noGalleryItems")}</p>
                    )}
                  </div>
                  <div className="onwards_sec mt-4">
                    <h4 className="mb-0">
                      <span className="price-text">
                        {minPrice != null ? (minPrice === 0 ? (t("free") || "Free") : `₮${minPrice}`) : t("freeLabel")}
                      </span>
                    </h4>
                    <AuthButton
                      requiresAuth
                      onClick={() => router.push(`/eventbooking?eventId=${event?._id}`)}
                      className="common_btn"
                    >
                      {t("bookTicketNow")}
                    </AuthButton>
                    <Button className="book_mark_icon" onClick={handleShare}>
                      <img src="/img/share_icon.svg" />
                    </Button>
                  </div>
                </div>
              </div>
              {/* <Reviews /> */}
              {/* {eventId && <CommentsSection entityId={eventId} entityModel="Event" />} */}
            </Container>
          </Col>
          <Col lg={4}>
            <div className="crowd_main">
              <div className="Insights_box">
                <div className="title_crowd">
                  <h3 className="">{t("crowdInsights")}</h3>
                </div>

                <div className="insights-card">
                  <span className="">{t("whoIsGoing")}</span>

                  <div className="  whisiGoing_box">
                    <div>
                      <h2>{attendees?.total || 0}</h2>
                      <small className="text-secondary">{t("attendees")}</small>
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
                                    : "/img/sidebar-logo.svg"
                                }
                                onError={(e) => (e.target.src = "/img/sidebar-logo.svg")}
                                loading="lazy"
                                className="avatar-img img-placeholder"
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
                            {t("beFirstToJoin")}
                          </span>
                        )}
                      </div>
                    </div>
                    {canShowViewAll && (
                      <AuthButton
                        requiresAuth
                        onClick={() => router.push(`/eventAttendees?id=${event?._id}`)}
                        className="text-teal text-decoration-none small"
                        style={{ color: "#26a69a", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      >
                        {t("viewAll")}
                      </AuthButton>
                    )}
                  </div>

                  <hr className="border-secondary opacity-25 my-4" />

                  <div className="mt-3">
                    <span>{t("eventSeats")}</span>
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
                            {t("seatsBooked")} - {bookedSeats}
                          </p>
                          <div className="custom-progress-bg mb-2">
                            <div
                              className="custom-progress-bar"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <div className="text-end">
                            <small className="small">
                              {t("seatsLeft")} - {availableTickets}
                            </small>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="title_crowd mt-4">
                <h3 className="">{t("sponsoredBy")}</h3>
              </div>
              <div className="sponsor-card">
                <div className="sponsor-card_profile">
                  <img
                    src={
                      event?.createdBy?.profileImage
                        ? getFullImageUrl(event?.createdBy?.profileImage)
                        : "/img/sidebar-logo.svg"
                    }
                    onError={(e) => (e.target.src = "/img/sidebar-logo.svg")}
                    loading="lazy"
                    className="sponsor-img img-placeholder"
                    alt="Sponsor"
                  />
                  <h5 className="mb-0 fw-semibold">
                    {event?.createdBy?.firstName} {event?.createdBy?.lastName}
                  </h5>
                </div>
                <AuthButton
                  requiresAuth
                  onClick={() => router.push(`/profile?id=${event?.createdBy?._id}`)}
                  className="btn-book py-2 px-4 btn text-white text-decoration-none"
                >
                  {t("viewDetails")}
                </AuthButton>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <div className="details_fq">
        <FAQ />
      </div>

      {/* Similar Events Section */}
      {similarEvents && similarEvents.length > 0 ? (
        <section className="recommended-section">
          <div className="container">
            <div className="main_title align_title position-relative z-2 border-bottm">
              <h2>{t("eventsYouMayLike")}</h2>
            </div>
            <div className="row gy-5">
              {similarEvents.map((item) => (
                <div key={item._id} className="col-lg-3 col-md-6 col-sm-12">
                  <Link href={`/eventDetails?id=${item._id}`}>
                    <div className="event_main_cart">
                      <div className="recommended-card">
                        {(item.isFeatured || item.fetcherEvent) && (
                          <span className="event-badge">{t("featured")}</span>
                        )}
                        <img
                          src={
                            item.posterImage && item.posterImage[0]
                              ? item.posterImage[0]
                              : "/img/sidebar-logo.svg"
                          }
                          alt={item.eventTitle}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/img/sidebar-logo.svg";
                          }}
                        />
                      </div>
                      <div className="card-overlay">
                        <div className="overlay-content">
                          <span className="artist-name">{item.eventTitle}</span>
                          <div className="event-meta">
                            <span>
                              <img src="/img/date_icon.svg" alt="date" />{" "}
                              {item.startDate
                                ? new Date(item.startDate).toLocaleDateString()
                                : t("dateTBD")}
                            </span>
                            <span>
                              <img src="/img/loc_icon.svg" alt="location" />{" "}
                              {item.venueAddress
                                ? item.venueAddress.city || t("locationLabel")
                                : t("onlineLabel")}
                            </span>
                          </div>
                          <div className="price-tag">
                            {(() => {
                              if (!item.tickets || item.tickets.length === 0) return t("freeLabel");
                              const prices = item.tickets.map((tk) => tk.price).filter((p) => typeof p === "number");
                              if (prices.length === 0) return t("freeLabel");
                              const minP = Math.min(...prices);
                              return `₮${minP}`;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <EventSection
          type="recommended"
          limit={4}
          showSeeAll={false}
          customTitle={t("eventsYouMayLike")}
        />
      )}

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
