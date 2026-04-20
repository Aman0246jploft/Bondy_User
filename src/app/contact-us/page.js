"use client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { Col, Container, Form, Row } from "react-bootstrap";
import { useState, useEffect } from "react";
import contactApi from "@/api/contactApi";
import categoryApi from "@/api/categoryApi";
import { toast } from "react-hot-toast";

export default function Page() {
  const { t } = useLanguage();
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
  document.title = `${t("contactUs")} - Bondy`;
}, []);

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


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.message) {
      toast.error(t("pleaseFillRequiredFields"));
      return;
    }

    setLoading(true);
    try {
      const response = await contactApi.createContact(formData);
      if (response?.status === true) {
        toast.success(t("messageSentSuccess"));
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
          <h1>{t("contactUs")}</h1>
          <p>{t("contactUsDescription")}</p>
        </div>
        <Header />
      </div>

      <section className="contact_Sec">
        <Container>
          <Row className="justify-content-center">
            <Col lg={7}>
              <div className="contact_title">
                <h2>{t("sendUsMessage")}</h2>
                <p>{t("sendUsMessageDesc")}</p>
              </div>
              <Form className="common_field" onSubmit={handleSubmit}>
                <Row className="g-4">
                  <Col lg={6}>
                    <Form.Group controlId="fullName">
                      <Form.Label>
                        {t("fullName")} <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t("fullNamePlaceholder")}
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={6}>
                    <Form.Group controlId="email">
                      <Form.Label>
                        {t("emailAddress")} <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        placeholder={t("emailPlaceholder")}
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={6}>
                    <Form.Group controlId="phone">
                      <Form.Label>{t("phone")}</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t("phonePlaceholder")}
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={6}>
                    <Form.Group controlId="topic">
                      <Form.Label>{t("selectTopic")}</Form.Label>
                      <Form.Select
                        name="topic"
                        value={formData.topic}
                        onChange={handleChange}
                      >
                        <option value="">{t("selectTopicPlaceholder")}</option>
                        {topics.map((topic) => (
                          <option key={topic._id} value={topic.name}>
                            {topic.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={12}>
                    <Form.Group controlId="message">
                      <Form.Label>
                        {t("yourMessage")} <span className="text-danger">*</span>
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
                      {loading ? t("sending") : t("sendMessage")}
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
