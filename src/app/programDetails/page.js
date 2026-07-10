"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Autoplay } from "swiper/modules";
import Map from "@/components/Map";
import Header from "@/components/Header";
import FAQ from "@/components/FAQ";
import ExpandableText from "@/components/ExpandableText";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useLanguage } from "@/context/LanguageContext";
import courseApi from "@/api/courseApi";
import wishlistApi from "@/api/wishlistApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import { formatDate } from "@/utils/dateFormater";
import { formatTime } from "@/utils/timeHelper";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthGuard } from "@/context/AuthGuardContext";
import AuthButton from "@/components/AuthButton";
import { Flame } from "lucide-react";

function ProgramDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [courseDetails, setCourseDetails] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchDetails = async () => {
        try {
          const response = await courseApi.getCourseDetails(id);
          if (response && response?.data) {
            setCourseDetails(response?.data);
            setIsWishlisted(response?.data?.isWishlisted || false);
          }
        } catch (error) {
          console.error("Error fetching course details:", error);
        }
      };
      fetchDetails();
    }
  }, [id]);

  const { t, language } = useLanguage();
  const { checkAuth } = useAuthGuard();

  const formatPrice = (amount) => {
    if (amount == null || amount === undefined) return t("priceNotAvailable") || "N/A";
    try {
      const locale = language === "mn" ? "mn-MN" : "en-US";
      const formatted = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
      return `₮${formatted}`;
    } catch (e) {
      return `₮${amount}`;
    }
  };

  const handleWishlistToggle = () => {
    checkAuth(async () => {
      if (wishlistLoading) return;
      setWishlistLoading(true);
      try {
        if (isWishlisted) {
          const response = await wishlistApi.removeFromWishlist({ entityId: id });
          if (response?.status === true) {
            toast.success(response?.message);
            setIsWishlisted(false);
          }
        } else {
          const response = await wishlistApi.addToWishlist({
            entityId: id,
            entityModel: "Course",
          });
          if (response?.status === true) {
            toast.success(response?.message);
            setIsWishlisted(true);
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
    const shareUrl = window.location.href;

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

  useEffect(() => {
    if (courseDetails?.courseTitle) {
      document.title = `${courseDetails.courseTitle} | Bondy`;
    }
  }, [courseDetails]);

  if (!courseDetails) {
    return (
      <>
        <Header />
        <Container className="my-5 text-center">
          <h2>{t("loading")}</h2>
        </Container>
        <Footer />
      </>
    );
  }

  const {
    courseTitle,
    posterImage,
    shortdesc,
    longdesc,
    price,
    duration,
    durationTranslation,
    currentSchedule,
    venueAddress,
    createdBy,
    enrollmentType,
    whatYouWillLearn,
    mediaLinks,
    shortTeaserVideo,
    totalSessions,
    batches,
    bookingCutOff,
  } = courseDetails;

  const allBatchesCutOff = batches && batches.length > 0
    ? batches.filter(b => b.status === "Active").every(b => !!b.bookingCutOffPassed)
    : false;

  const mediaItems = [
    ...(shortTeaserVideo || []).map((url) => ({ type: "video", url })),
    ...(Array.isArray(posterImage) ? posterImage : [posterImage]).map((url) => ({ type: "image", url })),
    ...(mediaLinks || []).map((url) => ({ type: "image", url })),
  ].filter(item => !!item.url);

  const hasSingleMedia = mediaItems.length <= 1;

  const images = mediaItems.filter(item => item.type === "image").map(item => getFullImageUrl(item.url));

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
                  {(language === "mn" ? durationTranslation || duration : duration) || "N/A"} •{" "}
                  {enrollmentType === "Ongoing" ? (
                    <>
                      {t("ongoing") || "Ongoing"} • {t("startDate") || "Starts"}: {formatDate(currentSchedule?.startDate)}
                    </>
                  ) : (
                    <>
                      {currentSchedule
                        ? `${formatDate(currentSchedule.startDate)} – ${formatDate(
                          currentSchedule.endDate,
                        )}`
                        : "Dates N/A"}{" "}
                      • {totalSessions || 0} sessions
                    </>
                  )}
                </p>
                <Button
                  className="book_mark_icon"
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                >
                  <img
                    src={
                      isWishlisted
                        ? "/img/bookmark_filled_icon.svg"
                        : "/img/bookmark_icon.svg"
                    }
                    alt="Bookmark"
                  />
                </Button>
              </div>
            </Col>

            <Col lg={5} className="">
              <div className="mb-4">
                <ExpandableText
                  text={shortdesc}
                  limit={150}
                  className="event-desc"
                />
              </div>
              <div className="onwards_sec">
                <h4 className="mb-0">
                  <span className="price-text">{formatPrice(price)}</span> {t("onwards")}
                </h4>
                {allBatchesCutOff ? (
                  <Button className="common_btn bg-secondary border-0" disabled>
                    {t("bookingClosed") || "Closed"}
                  </Button>
                ) : (
                  <AuthButton
                    requiresAuth
                    onClick={() => router.push(
                      currentSchedule?._id
                        ? `/eventbooking?id=${courseDetails._id}&scheduleId=${currentSchedule._id}`
                        : `/eventbooking?id=${courseDetails._id}`
                    )}
                    className="common_btn"
                  >
                    {t("bookNow")}
                  </AuthButton>
                )}
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
                slidesPerView={1}
                centeredSlides={true}
                loop={!hasSingleMedia}
                speed={800}
                autoplay={
                  hasSingleMedia
                    ? false
                    : {
                      delay: 3000,
                      disableOnInteraction: false,
                    }
                }
                breakpoints={
                  hasSingleMedia
                    ? {}
                    : {
                      768: {
                        slidesPerView: 2,
                        spaceBetween: 20,
                      },
                      1024: {
                        slidesPerView: 3,
                        spaceBetween: 20,
                      },
                    }
                }
                className="mySwiper"
              >
                {mediaItems && mediaItems.map((item, index) => (
                  <SwiperSlide key={index}>
                    {item.type === "video" ? (
                      <video
                        src={getFullImageUrl(item.url)}
                        className="event-card-img object-fit-cover img-placeholder w-100 h-100"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        src={getFullImageUrl(item.url) || "/img/sidebar-logo.svg"}
                        onError={(e) => (e.target.src = "/img/sidebar-logo.svg")}
                        loading="lazy"
                        className="event-card-img object-fit-cover img-placeholder"
                        alt={`Gallery ${index}`}
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
                    <h5>{t("dateAndTime")}</h5>
                    <span>
                      {enrollmentType === "Ongoing" ? (
                        <>
                          {t("ongoing") || "Ongoing"} • {t("startDate") || "Starts"}: {formatDate(currentSchedule?.startDate)}
                        </>
                      ) : (
                        currentSchedule
                          ? `${formatDate(
                            currentSchedule.startDate,
                          )} ${t("at")} ${formatTime(currentSchedule.startTime, true, language)} ${t("to")} ${formatTime(currentSchedule.endTime, true, language)}`
                          : t("detailedTimingNotAvailable")
                      )}
                    </span>
                  </div>
                  <div className="event_time_mange">
                    <h5>{t("location")}</h5>
                    <span>{locationString || t("locationNotAvailable")}</span>
                  </div>
                  {bookingCutOff && (
                    <div className="event_time_mange">
                      <h5>{t("bookingCutOff") || "Booking Cut-off"}</h5>
                      <span>{bookingCutOff}</span>
                    </div>
                  )}

                  <Link className="view-map" href="">
                    {t("viewInMap")}
                  </Link>
                </div>
                <div className="map-container">
                  <Map
                    latitude={courseDetails.venueAddress?.latitude ?? courseDetails.venueAddress?.coordinates?.[1]}
                    longitude={courseDetails.venueAddress?.longitude ?? courseDetails.venueAddress?.coordinates?.[0]}
                    title={courseTitle}
                    address={venueAddress?.address}
                    venueName={courseDetails?.venueName}
                    imageUrl={images?.[0]}
                    ticketPrice={price}
                    startDate={currentSchedule?.startDate}
                    startTime={currentSchedule?.startTime}
                    endTime={currentSchedule?.endTime}
                  />
                </div>

                {/* Text Content Sections */}
                <div className="content-section">
                  <h2 className="section-heading">{t("shortDescription")}</h2>
                  <ExpandableText text={shortdesc} limit={300} />
                </div>

                <div className="content-section">
                  <h2 className="section-heading">{t("whatYouWillLearn")}</h2>
                  <ExpandableText text={whatYouWillLearn} limit={300} />
                </div>

                {longdesc && (
                  <div className="content-section">
                    <h2 className="section-heading">{t("detailedOverview")}</h2>
                    <ExpandableText text={longdesc} limit={300} />
                  </div>
                )}

                <div className="organization_profile">
                  <h4>{t("organizedBy")}</h4>

                  <div
                    className="item_org"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <img
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          router.push(`/profile?id=${createdBy?._id}`)
                        }
                        src={
                          getFullImageUrl(createdBy?.profileImage) ||
                          "/img/sidebar-logo.svg"
                        }
                        onError={(e) =>
                          (e.target.src = "/img/sidebar-logo.svg")
                        }
                        loading="lazy"
                        className="img-placeholder"
                        alt="Organizer"
                      />
                    </div>

                    {/*
                     <span>
                      {createdBy?.firstName} {createdBy?.lastName}
                    </span> 
                    */}

                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {createdBy?.firstName} {createdBy?.lastName}
                      {createdBy?.isVerified && (
                        <span className="verified_tag">✓ {t("verified")}</span>
                      )}
                      <span
                        className="view_details"
                        onClick={() => checkAuth(() => router.push(`/profile?id=${createdBy?._id}`))}
                      >
                        {t("viewDetails")}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="content-section m-0">
                  <h3 className="section-heading">{t("gallery")}</h3>
                  <div className="gallery-grid">
                    {images &&
                      images?.map((img, idx) => (
                        <img
                          key={idx}
                          src={img || "/img/sidebar-logo.svg"}
                          onError={(e) =>
                            (e.target.src = "/img/sidebar-logo.svg")
                          }
                          loading="lazy"
                          className={`gallery-item img-placeholder ${idx === 0 ? "large-gallery-item" : ""
                            }`}
                          alt={`Gallery ${idx}`}
                        />
                      ))}
                  </div>
                  <div className="onwards_sec mt-4">
                    <h4 className="mb-0">
                      <span className="price-text">{formatPrice(price)}</span>
                    </h4>
                    {allBatchesCutOff ? (
                      <Button className="common_btn bg-secondary border-0" disabled>
                        {t("bookingClosed") || "Closed"}
                      </Button>
                    ) : (
                      <AuthButton
                        requiresAuth
                        onClick={() => router.push(
                          currentSchedule?._id
                            ? `/eventbooking?id=${courseDetails._id}&scheduleId=${currentSchedule._id}`
                            : `/eventbooking?id=${courseDetails._id}`
                        )}
                        className="common_btn"
                      >
                        {t("bookNow")}
                      </AuthButton>
                    )}
                    <Button className="book_mark_icon" onClick={handleShare}>
                      <img src="/img/share_icon.svg" />
                    </Button>
                  </div>
                </div>
              </div>
              {/* <Reviews /> */}
              {/* {id && <CommentsSection entityId={id} entityModel="Course" />} */}
            </Container>
          </Col>
          <Col lg={4}>
            <div className="upcming_session">
              <div className="d-flex align-items-center gap-3 mb-3">
                <h4 className="mb-0">{enrollmentType === "Ongoing" ? (t("weeklySchedule") || "Weekly Schedule") : (t("availableBatches") || "Available Batches")}</h4>
                {courseDetails?.showHurryBadge && (
                  <span style={{ color: "#F59E0B", fontSize: "12px", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap", textTransform: "none" }}>
                    <Flame size={14} color="#F59E0B" /> {t("almostSoldOut")}
                  </span>
                )}
              </div>
              <div className="upcming_session_box">
                {enrollmentType === "Ongoing" ? (
                  (() => {
                    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                    const orderedSchedule = weekdays.filter(d => courseDetails.weeklySchedule?.[d]);
                    if (orderedSchedule.length === 0) {
                      return <p>{t("noUpcomingSessionsFound")}</p>;
                    }
                    return orderedSchedule.map((day) => {
                      const dayData = courseDetails.weeklySchedule[day];
                      const slots = dayData.slots || [];
                      return (
                        <div key={day} className="mb-3">
                          <h6 style={{ color: "#23ada4", fontWeight: 700, fontSize: "14px", textTransform: "uppercase" }}>{day} ({dayData.date})</h6>
                          {slots.map((slot, idx) => (
                            <div className="upcming_session_item mb-2" key={idx}>
                              <div className="content" style={{ flex: 1, minWidth: 0 }}>
                                <div className="upcming_session_content ps-0">
                                  <h6 style={{ color: "#fff", fontWeight: 600, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                    <span style={{ textTransform: "none" }}>{formatTime(slot.startTime, true, language)} {t("to")} {formatTime(slot.endTime, true, language)}</span>
                                  </h6>
                                </div>
                              </div>
                              <div className="booking_bx">
                                {!slot.isBooked && !slot.isFull && (
                                  <span className="text_pr">
                                    {formatPrice(price)}
                                  </span>
                                )}
                                {slot.isBooked ? (
                                  <span className="badge bg-success">{t("booked")}</span>
                                ) : slot.isFull ? (
                                  <span className="badge bg-danger">{t("full")}</span>
                                ) : (
                                  <AuthButton
                                    requiresAuth
                                    onClick={() => router.push(`/eventbooking?id=${courseDetails._id}`)}
                                    className="common_btn"
                                  >
                                    {t("bookNow")}
                                  </AuthButton>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    });
                  })()
                ) : batches && batches.length > 0 ? (
                  batches.map((batch, idx) => {
                    return (
                      <div className="upcming_session_item mb-3" key={batch._id || idx}>
                        <div className="content" style={{ flex: 1, minWidth: 0 }}>
                          <div className="upcming_session_content ps-0">
                            <h6 style={{ color: "#fff", fontWeight: 600, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <span style={{ textTransform: "none" }}>{batch.batchName}</span>
                            </h6>
                            <span className="text-secondary" style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>
                              📅 {batch.days?.join(", ")}
                            </span>
                            <span className="text-secondary" style={{ fontSize: "12px", display: "block" }}>
                              🕒 {formatTime(batch.startTime, true, language)} {t("to")} {formatTime(batch.endTime, true, language)}
                            </span>
                            {!batch.bookingCutOffPassed && (
                              <span className="text-muted" style={{ fontSize: "11px", display: "block", marginTop: "2px" }}>
                                {batch.isFull ? t("full") : `${batch.availableSeats} seats left`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="booking_bx">
                          <span className="text_pr">
                            {batch.isBooked
                              ? t("booked")
                              : batch.isFull
                                ? t("full")
                                : formatPrice(price)}
                          </span>
                          {batch.isBooked ? (
                            <span className="badge bg-success">{t("booked")}</span>
                          ) : batch.bookingCutOffPassed ? (
                            <span className="badge bg-danger">{t("bookingClosed") || "Closed"}</span>
                          ) : batch.isFull ? (
                            <span className="badge bg-danger">{t("full")}</span>
                          ) : (
                            <AuthButton
                              requiresAuth
                              onClick={() => router.push(`/eventbooking?id=${courseDetails._id}&scheduleId=${batch._id}`)}
                              className="common_btn"
                            >
                              {t("bookNow")}
                            </AuthButton>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p>{t("noUpcomingSessionsFound")}</p>
                )}
              </div>

              {enrollmentType === "Ongoing" && (courseDetails.oneMonthPassEnabled || courseDetails.threeMonthPassEnabled) && (
                <div className="mt-4 p-3 rounded" style={{ backgroundColor: "#141414", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <h5 className="text-white mb-3" style={{ fontSize: "15px", fontWeight: 700 }}>{t("availablePasses") || "Available Passes"}</h5>
                  <div className="d-flex flex-column gap-2">
                    {courseDetails.oneMonthPassEnabled && (
                      <div className="d-flex justify-content-between align-items-center p-3 rounded" style={{ backgroundColor: "#242424", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div>
                          <p className="mb-0 text-white" style={{ fontSize: "13px", fontWeight: 600 }}>{t("oneMonthPass") || "1 Month Pass"}</p>
                          <span className="text-muted" style={{ fontSize: "11px" }}>{t("thirtyDaysUnlimitedAccess") || "30 days unlimited access"}</span>
                        </div>
                        <span style={{ color: "#23ada4", fontWeight: 700 }}>{formatPrice(courseDetails.oneMonthPassPrice)}</span>
                      </div>
                    )}
                    {courseDetails.threeMonthPassEnabled && (
                      <div className="d-flex justify-content-between align-items-center p-3 rounded" style={{ backgroundColor: "#242424", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div>
                          <p className="mb-0 text-white" style={{ fontSize: "13px", fontWeight: 600 }}>{t("threeMonthPass") || "3 Month Pass"}</p>
                          <span className="text-muted" style={{ fontSize: "11px" }}>{t("ninetyDaysUnlimitedAccess") || "90 days unlimited access"}</span>
                        </div>
                        <span style={{ color: "#23ada4", fontWeight: 700 }}>{formatPrice(courseDetails.threeMonthPassPrice)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>

      <FAQ />
      <Footer />
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProgramDetailsContent />
    </Suspense>
  );
}
