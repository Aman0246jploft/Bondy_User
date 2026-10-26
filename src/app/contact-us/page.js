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
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

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
      const formattedPhone = formData.phone && formData.phone.trim()
        ? (formData.phone.startsWith("+") ? formData.phone.trim() : `+${formData.phone.trim()}`)
        : undefined;

      const response = await contactApi.createContact({
        ...formData,
        fullName: nameVal,
        phone: formattedPhone,
        topic: formData.topic || undefined,
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
                      <div className="phone_input w-100">
                        <PhoneInput
                          country={"mn"}
                          enableSearch
                          value={formData.phone}
                          onChange={(phone) => {
                            const formatted = phone ? (phone.startsWith("+") ? phone : `+${phone}`) : "";
                            setFormData((prev) => ({ ...prev, phone: formatted }));
                          }}
                          inputClass="form-control w-100"
                          containerClass="phone_input w-100"
                          dropdownClass="phone_input_dropdown"
                          buttonClass="phone_input_button"
                          placeholder={t("phonePlaceholder") || (language === "en" ? "Enter phone number" : "Утасны дугаараа оруулна уу")}
                          searchPlaceholder={language === "mn" ? "Улс хайх" : "Search country"}
                          inputProps={{
                            name: "phone",
                            id: "phone",
                            placeholder: t("phonePlaceholder") || (language === "en" ? "Enter phone number" : "Утасны дугаараа оруулна уу"),
                          }}
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  <Col lg={6}>
                    <Form.Group controlId="topic">
                      <Form.Label>{t("selectTopic")}</Form.Label>
                      <div style={{ position: "relative" }}>
                        <Form.Control
                          as="select"
                          name="topic"
                          value={formData.topic}
                          onChange={handleChange}
                          style={{
                            cursor: "pointer",
                            appearance: "none",
                            WebkitAppearance: "none",
                            MozAppearance: "none",
                            paddingRight: "48px",
                            color: formData.topic ? "var(--white)" : "var(--bd-gray-600, #888)",
                          }}
                        >
                          <option value="" style={{ background: "#181a1f", color: "#888" }}>
                            {t("selectTopicPlaceholder")}
                          </option>
                          {topics.map((topic) => (
                            <option
                              key={topic._id}
                              value={topic.name}
                              style={{ background: "#181a1f", color: "#fff" }}
                            >
                              {language === "mn" && topic.name_mn ? topic.name_mn : topic.name}
                            </option>
                          ))}
                        </Form.Control>
                        <span
                          style={{
                            position: "absolute",
                            right: "22px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                            color: "var(--primary-teal, #23ada4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </div>
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
                      {loading ? (
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <span className="op-spin" style={{ width: 16, height: 16, borderWidth: 2 }} />
                          <span>{t("sending")}</span>
                        </span>
                      ) : (
                        t("sendMessage")
                      )}
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
