"use client";
import Link from "next/link";
import React, { useState } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { useEventContext } from "@/context/EventContext";
import authApi from "@/api/authApi";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

function page() {
  const { eventData, updateEventData } = useEventContext();
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      // Upload one by one or loop
      // Assuming api supports single file update mostly, but we can call it multiple times
      const newLinks = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("files", file);
        const response = await authApi.uploadFile(formData);
        if (response.data && response.data.files && response.data.files.length > 0) {
          newLinks.push(response.data.files[0].url);
        }
      }

      updateEventData({
        mediaLinks: [...eventData.mediaLinks, ...newLinks]
      });
      toast.success("Images uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const updatedLinks = eventData.mediaLinks.filter((_, i) => i !== index);
    updateEventData({ mediaLinks: updatedLinks });
  };

  const handleNext = (e) => {
    e.preventDefault();
    router.push("/EventPreview");
  }

  return (
    <div>
      <Row className="justify-content-center">
        <Col md={8}>
          <ul className="event-steps">
            <li className="steps-item">
              <Link href="/BasicInfo" className="steps-link active">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-01.svg" className="me-2" />
                  Event Basic Info
                </span>
                <span className="steps-arrow">
                  <img src="/img/Arrow-Right.svg" className="ms-3" />
                </span>
              </Link>
            </li>
            <li className="steps-item">
              <Link href="/DateTime" className="steps-link active">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-02.svg" className="me-2" />
                  Date, Time and Location
                </span>
                <span className="steps-arrow">
                  <img src="/img/Arrow-Right.svg" className="ms-3" />
                </span>
              </Link>
            </li>
            <li className="steps-item">
              <Link href="/TicketsPricing" className="steps-link active">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-03.svg" className="me-2" />
                  Tickets & Pricing
                </span>
                <span className="steps-arrow">
                  <img src="/img/Arrow-Right.svg" className="ms-3" />
                </span>
              </Link>
            </li>
            <li className="steps-item">
              <Link href="/Gallery" className="steps-link active">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-04.svg" className="me-2" />
                  Gallery
                </span>
                <span className="steps-arrow">
                  <img src="/img/Arrow-Right.svg" className="ms-3" />
                </span>
              </Link>
            </li>
          </ul>
          <Form className="row">
            <div className="event-form-card">
              <Row>
                <Col md={12}>
                  <div className="event-frm-bx upload">
                    <div>
                      <h5>Media & Gallery</h5>
                      <p>
                        Upload images, promotional videos, or short teaser clips
                        to showcase <br /> your event. Drag and drop files or
                        click to browse.
                      </p>
                    </div>
                    <input
                      type="file"
                      id="upload"
                      className="d-none"
                      multiple
                      onChange={handleImageUpload}
                      accept="image/*"
                    />
                    <label htmlFor="upload">{uploading ? "Uploading..." : "Upload"}</label>
                  </div>
                  <div className="upload-images">
                    {eventData.mediaLinks.map((link, index) => (
                      <div className="images-innr" key={index}>
                        <img src={link} alt={`gallery-${index}`} />
                        <button type="button" className="close-btn" onClick={() => removeImage(index)}>
                          <img src="/img/org-img/close.svg" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>

              <div className="d-flex gap-2 justify-content-end mt-2">
                <Link href="/TicketsPricing" className="outline-btn">
                  Back
                </Link>

                <button type="button" onClick={handleNext} className="custom-btn">
                  Save and Continue
                </button>
              </div>
            </div>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default page;
