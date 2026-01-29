"use client";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Autoplay } from 'swiper/modules';
import Map from '@/components/Map';
import Reviews from '@/components/Reviews';
import Header from '@/components/Header';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import EventSection from '@/components/EventSection';
import TicketBooking from '@/components/TicketBooking';

export default function page() {
  const images = ['/img/interactive-process-image-1.png', '/img/interactive-process-image-2.png', '/img/interactive-process-image-4.png', '/img/interactive-process-image-1.png'];

  return (

    <>

       <Header />
      <div className="event-page-wrapper">
 
        <Container>
          <Row className="align-items-start ">
            <Col lg={7} className="mb-4">
              <div className="header-box">
                <h1 className="event-title">
                  Connecting Minds to Shape<br /> Tomorrow's Big Ideas
                </h1>
                <p className="event-meta">2h29m • Comedy show • Live</p>
                <Button className="book_mark_icon">
                  <img src="/img/bookmark_icon.svg" />
                </Button>
              </div>
            </Col>

            <Col lg={5} className="">
              <p className="event-desc mb-4">
                Discover the vision that drives this event—a commitment to bringing together
                innovators, leaders, and changemakers to share knowledge, spark inspiration,
                and create meaningful connections.
              </p>
              <div className="onwards_sec">
                <h4 className="mb-0">
                  <span className="price-text">$599 to $799</span> onwards
                </h4>
                <Button className="common_btn">Book Ticket Now</Button>
                <Button className="book_mark_icon">
                  <img src="/img/share_icon.svg" />
                </Button>
              </div>
            </Col>
          </Row>
        </Container>


      


      </div>

    <TicketBooking />


      <Footer />

    </>


  );
}