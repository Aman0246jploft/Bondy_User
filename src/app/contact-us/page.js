"use client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Col, Container, Form, Row } from "react-bootstrap";
import { useState, useEffect } from "react";
import contactApi from "@/api/contactApi";
import categoryApi from "@/api/categoryApi";
import { toast } from "react-hot-toast";

export default function Page() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    topic: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const { data } = await categoryApi.getCategories({ type: "support_ticket", limit: 1000 });
        if (data?.categories) {
          setTopics(data.categories);
        } else if (Array.isArray(data)) {
          setTopics(data);
        }
      } catch (err) {
        console.error("Failed to fetch topics:", err);
      }
    };
    fetchTopics();
  }, []);
        console.log("Fetched topics:1111111", topics);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.message) {
      toast.error("Please fill required fields!");
      return;
    }

    setLoading(true);
    try {
      const response = await contactApi.createContact(formData);
      if (response.status) {
        toast.success("Message sent successfully!");
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          topic: "",
          message: "",
        });
      }
    } catch (error) {
      console.error("Contact error:", error);
      // Error handled by interceptor usually, manual log here
    } finally {
      setLoading(false);
    }
  };

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
              <Form className="common_field" onSubmit={handleSubmit}>
                <Row className="g-4">
                  <Col lg={6}>
                    <Form.Group controlId="fullName">
                      <Form.Label>
                        Full Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Full Name"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={6}>
                    <Form.Group controlId="email">
                      <Form.Label>
                        Email Address <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={6}>
                    <Form.Group controlId="phone">
                      <Form.Label>Phone (Optional)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={6}>
                    <Form.Group controlId="topic">
                      <Form.Label>Select Topic</Form.Label>
                      <Form.Select
                        name="topic"
                        value={formData.topic}
                        onChange={handleChange}
                      >
                        <option value="">Select Topic</option>
                        {topics.map((t) => (
                          <option key={t._id} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={12}>
                    <Form.Group controlId="message">
                      <Form.Label>
                        Your Message <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={12}>
                    <button
                      className="common_btn w-100"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Send Message"}
                    </button>
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
