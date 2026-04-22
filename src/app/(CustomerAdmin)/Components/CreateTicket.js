"use client";
import React, { useEffect, useState } from "react";
import { Col, Form, Row } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import authApi from "../../../api/authApi";
import supportTicketApi from "../../../api/supportTicketApi";
import toast from "react-hot-toast";

import { useLanguage } from "@/context/LanguageContext";

export default function CreateTicket(props) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    category: "",
    subject: "",
    description: "",
    priority: "Open",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (props.show) {
      fetchCategories();
    }
  }, [props.show]);

  const fetchCategories = async () => {
    try {
      const response = await authApi.getCategoryList({
        type: "support_ticket",
      });
      if (response.status && response.data) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.subject || !formData.description) {
      toast.error(t("fillRequiredFields") || "Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const selectedCategory = categories.find(cat => cat._id === formData.category);
      if (!selectedCategory) {
        toast.error(t("invalidCategorySelected") || "Invalid Category Selected");
        setLoading(false);
        return;
      }

      const payload = {
        category: selectedCategory.name,
        subject: formData.subject,
        description: formData.description,
      };

      const response = await supportTicketApi.createTicket(payload);
      if (response?.status === true || response.status === 201 || response.status === 200) {
        toast.success(t("ticketCreatedSuccessfully") || "Ticket created successfully");
        props.onHide();
        setFormData({
          category: "",
          subject: "",
          description: "",
          priority: "Open"
        });
        if (props.onSuccess) props.onSuccess();
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error(error.response?.data?.message || t("errorCreatingTicket") || "Error creating ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        show={props.show}
        onHide={props.onHide}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        className="common_modal gradientsSc create-ticket-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{t("createTicketsModalTitle") || "Create Tickets"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={12}>
                <div className="event-frm-bx">
                  <label className="form-label">{t("ticketCategory") || "Ticket Category"}</label>
                  <select
                    className="form-select"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="">{t("selectCategory") || "Select Category"}</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </Col>
              <Col md={6}>
                <div className="event-frm-bx">
                  <label className="form-label">{t("subject") || "Subject"}</label>
                  <input
                    type="text"
                    className="form-control"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </div>
              </Col>
              <Col md={12}>
                <div className="event-frm-bx">
                  <label className="form-label">{t("description") || "Description"}</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </Col>
            </Row>
            <div className="text-center">
              <button
                type="button"
                className="custom-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? t("submitting") : t("submitTicket")}
              </button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}
