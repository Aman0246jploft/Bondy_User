"use client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { Col, Container, Form, Row } from "react-bootstrap";
import { useState, useEffect } from "react";
import contactApi from "@/api/contactApi";
import categoryApi from "@/api/categoryApi";
import { toast } from "react-hot-toast";
import CharCounter from "@/components/CharCounter";

export default function Page() {
  const { t, language } = useLanguage();
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
    const nameVal = formData.fullName.trim();
    if (nameVal.length < 3 || nameVal.length > 30) {
      toast.error(language === "mn" ? "Нэр 3–30 тэмдэгттэй байх ёстой" : "Name must be 3–30 characters");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error(language === "mn" ? "И-мэйл хаяг буруу байна" : "Invalid email address");
      return;
    }
    const msgVal = formData.message.trim();
    if (msgVal.length < 10 || msgVal.length > 250) {
      toast.error(language === "mn" ? "Тайлбар 10–250 тэмдэгттэй байх ёстой" : "Description must be 10–250 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await contactApi.createContact({
        ...formData,
        fullName: nameVal,
        message: msgVal,
      });
      if (response && response.status !== false) {
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
                        maxLength={30}
                        placeholder={t("fullNamePlaceholder")}
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                      />
                      <CharCounter current={formData.fullName} max={30} lowThreshold={10} language={language} />
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
                      <Form.Control
                        as="select"
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
                      </Form.Control>
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
                        maxLength={250}
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                      />
                      <CharCounter current={formData.message} max={250} lowThreshold={25} language={language} />
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
