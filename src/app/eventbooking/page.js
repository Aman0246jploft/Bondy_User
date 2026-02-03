"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Row, Col, Button } from "react-bootstrap";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TicketBooking from "@/components/TicketBooking";
import eventApi from "@/api/eventApi";

export default function page() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      try {
        const response = await eventApi.getEventDetails(eventId);
        if (response.status) {
          setEvent(response.data.event);
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      }
    };
    fetchEvent();
  }, [eventId]);

  if (!event) return <div>Loading...</div>;


  return (
    <>
      <Header />
      <div className="event-page-wrapper">
        <Container>
          <Row className="align-items-start ">
            <Col lg={7} className="mb-4">
              <div className="header-box">
                <h1 className="event-title">{event.eventTitle}</h1>
                <p className="event-meta">
                  {event.duration} • {event.eventCategory?.name} •{" "}
                  {event.status}
                </p>
                <Button className="book_mark_icon">
                  <img src="/img/bookmark_icon.svg" />
                </Button>
              </div>
            </Col>

            <Col lg={5} className="">
              <p className="event-desc mb-4">{event.shortdesc}</p>
              <div className="onwards_sec">
                <h4 className="mb-0">
                  <span className="price-text">${event.ticketPrice}</span>{" "}
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

      <TicketBooking event={event} />

      <Footer />
    </>
  );
}