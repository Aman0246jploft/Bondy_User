"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Row, Col, Button } from "react-bootstrap";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import TicketBooking from "@/components/TicketBooking";
import eventApi from "@/api/eventApi";
import bookingApi from "@/api/bookingApi";
import courseApi from "@/api/courseApi";
import wishlistApi from "@/api/wishlistApi";
import toast from "react-hot-toast";

function BookingPageContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const courseId = searchParams.get("id");
  const scheduleId = searchParams.get("scheduleId");

  const [bookingItem, setBookingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingType, setBookingType] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const { t, language } = useLanguage();

  useEffect(() => {
    if (bookingItem?.title) {
      document.title = `${bookingItem.title} | Bondy`;
    }
  }, [bookingItem]);

  const formatPrice = (amount) => {
    if (amount == null || amount === undefined) return t("priceNotAvailable") || "N/A";
    try {
      const locale = language === "mn" ? "mn-MN" : "en-US";
      return new Intl.NumberFormat(locale, { style: "currency", currency: "MNT", maximumFractionDigits: 0 }).format(amount);
    } catch (e) {
      return `₮${amount}`;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (eventId) {
          const response = await eventApi.getEventDetails(eventId);
          if (response?.status && response?.data?.event) {
            const evt = response?.data?.event;
            setBookingType("EVENT");
            setIsWishlisted(evt?.isWishlisted || false);
            setBookingItem({
              _id: evt?._id,
              title: evt?.eventTitle,
              categoryName: evt?.eventCategory?.name,
              status: evt?.status,
              shortdesc: evt?.shortdesc,
              price: evt?.ticketPrice,
              duration: evt?.duration,
              durationTranslation: evt?.durationTranslation,
              posterImage: evt?.posterImage,
              venueAddress: evt?.venueAddress,
              startDate: evt?.startDate,
              endDate: evt?.endDate,
              original: evt,
            });
          }
        } else if (courseId) {
          const response = await courseApi.getCourseDetails(courseId);
          if (response?.data) {
            const course = response?.data;
            setBookingType("COURSE");
            setIsWishlisted(course?.isWishlisted || false);
            setBookingItem({
              _id: course?._id,
              title: course?.courseTitle,
              categoryName: course?.courseCategory?.name,
              status: course?.status || "Active",
              shortdesc: course?.shortdesc,
              price: course?.price,
              duration: course?.duration,
              durationTranslation: course?.durationTranslation,
              posterImage: course?.posterImage,
              venueAddress: course?.venueAddress,
              schedules: course?.schedules,
              currentSchedule: course?.currentSchedule,
              enrollmentType: course?.enrollmentType,
              original: course,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching booking details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId || courseId) {
      fetchData();
    }
  }, [eventId, courseId]);

  const handleWishlistToggle = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (wishlistLoading || !bookingItem) return;
    setWishlistLoading(true);

    try {
      const entityId = bookingItem._id;
      const entityModel = bookingType === "COURSE" ? "Course" : "Event";

      if (isWishlisted) {
        const response = await wishlistApi.removeFromWishlist({ entityId });
        if (response?.status) {
          setIsWishlisted(false);
        }
      } else {
        const response = await wishlistApi.addToWishlist({
          entityId,
          entityModel
        });
        if (response?.status) {
          setIsWishlisted(true);
        }
      }
    } catch (error) {
      console.error("Wishlist toggle error:", error);
    } finally {
      setWishlistLoading(false);
    }
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

  if (loading) {
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

  if (!bookingItem) {
    return (
      <>
        <Header />
        <Container className="my-5 text-center">
          <h2>{t("itemNotFound")}</h2>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="event-page-wrapper">
        <Container>
          <Row className="align-items-start ">
            <Col lg={7} className="mb-4">
              <div className="header-box">
                <h1 className="event-title">{bookingItem.title}</h1>
                <p className="event-meta">
                  {(language === "mn" ? bookingItem.durationTranslation || bookingItem.duration : bookingItem.duration) ? `${language === "mn" ? bookingItem.durationTranslation || bookingItem.duration : bookingItem.duration} • ` : ""}
                  {bookingItem.categoryName
                    ? `${bookingItem.categoryName} • `
                    : ""}
                  {bookingItem.status}
                </p>
                <Button className="book_mark_icon" onClick={handleWishlistToggle} disabled={wishlistLoading}>
                  <img
                    src={isWishlisted ? "/img/bookmark_filled_icon.svg" : "/img/bookmark_icon.svg"}
                    alt="Bookmark"
                  />
                </Button>
              </div>
            </Col>

            <Col lg={5}>
              <p className="event-desc mb-4">{bookingItem.shortdesc}</p>
              <div className="onwards_sec">
                <h4 className="mb-0">
                  <span className="price-text">₮{bookingItem.price}</span>{" "}
                  <span>{t("onwards")}</span>
                </h4>
                <Button className="book_mark_icon" onClick={handleShare}>
                  <img src="/img/share_icon.svg" />
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <TicketBooking
        item={bookingItem}
        type={bookingType}
        scheduleId={scheduleId}
      />

      <Footer />
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingPageContent />
    </Suspense>
  );
}
