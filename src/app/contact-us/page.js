"use client";

import Header from "../../components/Header";
import EventSection from "../../components/EventSection";
import FAQ from "../../components/FAQ";
import Footer from "../../components/Footer";
import Field from "../../components/Field";
import { Col, Container, Form, Row } from "react-bootstrap";
import ProgramCart from "@/components/ProgramCart";

export default function Page() {
  return (
    <>
      <div className="listing_page">
        <div className="breadcrumb_text">
          <h1>Contact Us</h1>
          <p>
            Whether you have questions, need advice on your hair care routine,
            or simply want to share your experience, our team will be happy to
            answer you.
          </p>
        </div>
        <Header />
      </div>

      <section className="contact_Sec">
        <Container>
          <Row className="justify-content-center">
            <Col lg={7}>
              <div className="contact_title">
                <h2>Send Us a Message</h2>
                <p>
                  Have a question or need help? Fill out the form below and
                  we'll respond as soon as possible.
                </p>
              </div>
              <Form className="common_field">
                <Row className="g-4">
                  <Col lg={6}>
                    <Form.Group controlId="exampleForm.ControlInput1">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control type="text" placeholder="Full Name" />
                    </Form.Group>
                  </Col>
                  <Col lg={6}>
                    <Form.Group controlId="exampleForm.ControlInput1">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control type="email" placeholder="Email" />
                    </Form.Group>
                  </Col>
                  <Col lg={6}>
                    <Form.Group controlId="exampleForm.ControlInput1">
                      <Form.Label>Phone (Optional)</Form.Label>
                      <Form.Control type="text" placeholder="Phone " />
                    </Form.Group>
                  </Col>
                  <Col lg={6}>
                    <Form.Group controlId="exampleForm.ControlSelect1">
                      <Form.Label>Select Topic</Form.Label>
                      <Form.Select>
                        <option value="">Select Topic</option>
                        <option value="react"></option>
                        <option value="next"></option>
                        <option value="uiux"></option>
                        <option value="frontend"></option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={12}>
                    <Form.Group controlId="exampleForm.ControlTextarea1">
                      <Form.Label>Your Message*</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4} // Aap rows ki sankhya badha ya ghata sakte hain
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={12}>
                    <button className="common_btn w-100 ">Send Message</button>
                  </Col>
                </Row>
              </Form>
            </Col>
          </Row>
        </Container>
      </section>

      <Footer />
    </>
  );
}
