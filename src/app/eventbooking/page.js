"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Row, Col, Button } from "react-bootstrap";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TicketBooking from "@/components/TicketBooking";
import eventApi from "@/api/eventApi";
import bookingApi from "@/api/bookingApi";
import courseApi from "@/api/courseApi";

export default function page() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  // For courses, we expect "id" and optionally "scheduleId"
  const courseId = searchParams.get("id");
  const scheduleId = searchParams.get("scheduleId");

  const [bookingItem, setBookingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingType, setBookingType] = useState(null); // "EVENT" or "COURSE"

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (eventId) {
          // --- Fetch Event ---
          const response = await eventApi.getEventDetails(eventId);
          if (response.status && response.data?.event) {
            const evt = response.data.event;
            setBookingType("EVENT");
            setBookingItem({
              _id: evt._id,
              title: evt.eventTitle,
              categoryName: evt.eventCategory?.name,
              status: evt.status,
              shortdesc: evt.shortdesc,
              price: evt.ticketPrice,
              duration: evt.duration,
              posterImage: evt.posterImage,
              venueAddress: evt.venueAddress,
              startDate: evt.startDate,
              endDate: evt.endDate,
              // Keep original object if needed
              original: evt,
            });
          }
        } else if (courseId) {
          // --- Fetch Course ---
          const response = await courseApi.getCourseDetails(courseId);
          if (response && response.data) {
            const course = response.data;
            setBookingType("COURSE");

            // If a specific schedule is selected, we might want to show its specific details
            // otherwise show general course details.
            // For price, courses have a 'price' field.
            // For date, we can try to find the selected schedule or just show generic info.

            setBookingItem({
              _id: course._id,
              title: course.courseTitle,
              categoryName: course.courseCategory?.name, // Confirm if populated
              status: course.status || "Active", // Course doesn't have status enum like event, defaulting
              shortdesc: course.shortdesc,
              price: course.price,
              duration: course.duration, // Check if course has duration
              posterImage: course.posterImage,
              venueAddress: course.venueAddress,
              // Course dates logic
              schedules: course.schedules,
              currentSchedule: course.currentSchedule,
              enrollmentType: course.enrollmentType,

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

  if (loading) {
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

  if (!bookingItem) {
    return (
      <>
        <Header />
        <Container className="my-5 text-center">
          <h2>Item not found</h2>
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
                  {bookingItem.duration ? `${bookingItem.duration} • ` : ""}
                  {bookingItem.categoryName
                    ? `${bookingItem.categoryName} • `
                    : ""}
                  {bookingItem.status}
                </p>
                <Button className="book_mark_icon">
                  <img src="/img/bookmark_icon.svg" />
                </Button>
              </div>
            </Col>

            <Col lg={5} className="">
              <p className="event-desc mb-4">{bookingItem.shortdesc}</p>
              <div className="onwards_sec">
                <h4 className="mb-0">
                  <span className="price-text">${bookingItem.price}</span>{" "}
                  onwards
                </h4>
                {/* <Button className="common_btn">Book Ticket Now</Button> */}
                <Button className="book_mark_icon">
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
