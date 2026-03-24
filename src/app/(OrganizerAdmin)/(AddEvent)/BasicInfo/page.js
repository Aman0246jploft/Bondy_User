"use client";
import Link from "next/link";
import React, { useEffect, useState, Suspense } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { useEventContext } from "@/context/EventContext";
import authApi from "@/api/authApi";
import eventApi from "@/api/eventApi";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { getFullImageUrl } from "@/utils/imageHelper";

function BasicInfoContent() {
  const { eventData, updateEventData, loadEventForEdit } = useEventContext();
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchCategories();

    // Check if we're in edit mode
    const eventId = searchParams.get("eventId");
    if (eventId) {
      setIsEditMode(true);
      loadEventData(eventId);
    }
  }, []);

  const loadEventData = async (eventId) => {
    setLoading(true);
    try {
      const response = await eventApi.getEventDetails(eventId);
      if (response.data && response.data.event) {
        loadEventForEdit(response.data.event);
        toast.success("Event loaded for editing");
      }
    } catch (error) {
      console.error("Error loading event:", error);
      toast.error("Failed to load event");
      router.push("/EventsManagement");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await authApi.getCategoryList({ type: "event" });
      if (response.data && response.data.categories) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const limits = {
      eventTitle: 100,
      shortdesc: 250,
      longdesc: 2000,
    };

    if (limits[name] && value.length > limits[name]) {
      return;
    }
    updateEventData({ [name]: value });
  };

  const handleTagsChange = (e) => {
    const value = e.target.value;
    // Simple comma separated tags
    let tagsArray = value.split(",").map((tag) => tag.trim());

    // Limit to 5 tags
    if (tagsArray.length > 5) {
      tagsArray = tagsArray.slice(0, 5);
      toast.error("Maximum 5 tags allowed");
    }

    // Limit each tag to 20 characters
    tagsArray = tagsArray.map((tag) =>
      tag.length > 20 ? tag.substring(0, 20) : tag
    );

    updateEventData({ tags: tagsArray });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation: Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Validation: Check file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, JPEG, PNG, and WEBP formats are allowed");
      return;
    }

    const formData = new FormData();
    formData.append("files", file);

    setUploading(true);
    try {
      const response = await authApi.uploadFile(formData);
      if (
        response.data &&
        response.data.files &&
        response.data.files.length > 0
      ) {
        updateEventData({ posterImage: [response.data.files[0]] });
        toast.success("Image uploaded successfully");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!eventData.eventTitle) {
      toast.error("Event title is required");
      return;
    }

    if (eventData.eventTitle.length < 5) {
      toast.error("Event title must be at least 5 characters long");
      return;
    }

    if (!eventData.eventCategory) {
      toast.error("Event category is required");
      return;
    }

    if (!eventData.posterImage || eventData.posterImage.length === 0) {
      toast.error("Please upload an event poster image");
      return;
    }

    if (!eventData.shortdesc || eventData.shortdesc.trim() === "") {
      toast.error("Short description is required");
      return;
    }

    if (eventData.shortdesc.length < 10) {
      toast.error("Short description must be at least 10 characters long");
      return;
    }

    if (!eventData.longdesc || eventData.longdesc.trim() === "") {
      toast.error("Detailed description is required");
      return;
    }

    if (eventData.longdesc.length < 50) {
      toast.error("Detailed description must be at least 50 characters long");
      return;
    }

    if (!eventData.tags || eventData.tags.length === 0 || (eventData.tags.length === 1 && eventData.tags[0] === "")) {
      toast.error("At least one tag is required");
      return;
    }

    router.push("/DateTime");
  };

  return (
    <div>
      <Row className="justify-content-center">
        <Col lg={10} md={12} xs={12}>
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
              <Link href="/DateTime" className="steps-link">
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
              <Link href="/TicketsPricing" className="steps-link">
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
              <Link href="/Agerestraction" className="steps-link">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-04.svg" className="me-2" />
                  Age Restriction
                </span>
                <span className="steps-arrow">
                  <img src="/img/Arrow-Right.svg" className="ms-3" />
                </span>
              </Link>
            </li>
            <li className="steps-item">
              <Link href="/Gallery" className="steps-link">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-01.svg" className="me-2" />
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
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">
                      Event Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="eventTitle"
                      value={eventData.eventTitle || ""}
                      onChange={handleInputChange}
                      placeholder="Enter event title"
                    />
                    <div className="text-end mt-1">
                      <small className="text-white">
                        {(eventData.eventTitle?.length || 0)}/100
                      </small>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">
                      Event Category <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      name="eventCategory"
                      value={eventData.eventCategory}
                      onChange={handleInputChange}>
                      <option value="">Select Event Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </Col>
                <Col md={12}>
                  <div className="event-frm-bx upload">
                    <div>
                      <h5>Upload Event Poster <span className="text-danger">*</span></h5>
                      <p>Drag and drop or browse to upload (Max 5MB, JPG/PNG/WEBP)</p>
                    </div>
                    <input
                      type="file"
                      id="upload"
                      className="d-none"
                      onChange={handleImageUpload}
                      accept="image/*"
                    />
                    <label htmlFor="upload">
                      {uploading ? "Uploading..." : "Upload"}
                    </label>
                  </div>
                  {eventData.posterImage &&
                    eventData.posterImage.length > 0 && (

                      <div className="mt-3">
                        <div className="d-flex align-items-start gap-3">
                          <div style={{ position: "relative" }}>
                            <img
                              src={getFullImageUrl(eventData.posterImage[0])}
                              alt="Event Poster"
                              style={{
                                width: "150px",
                                height: "150px",
                                objectFit: "cover",
                                borderRadius: "8px",
                                border: "2px solid #ddd",
                              }}
                              onError={(e) => {
                                e.target.src = "/img/details_img02.png";
                              }}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateEventData({ posterImage: [] })
                              }
                              style={{
                                position: "absolute",
                                top: "-8px",
                                right: "-8px",
                                background: "#ff4444",
                                color: "white",
                                border: "none",
                                borderRadius: "50%",
                                width: "24px",
                                height: "24px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "14px",
                                fontWeight: "bold",
                              }}
                            >
                              ×
                            </button>
                          </div>
                          <div>
                            <p className="text-success mb-1">
                              ✓ Event poster uploaded successfully
                            </p>
                            <p className="text-white" style={{ fontSize: "14px" }}>
                              Click the × button to remove and upload a different image
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </Col>
              </Row>
            </div>
            <div className="event-form-card">
              <div className="event-frm-bx">
                <label className="form-label">Short Description <span className="text-danger">*</span></label>
                <textarea
                  name="shortdesc"
                  value={eventData.shortdesc || ""}
                  onChange={handleInputChange}
                  placeholder="Brief summary"></textarea>
                <div className="text-end mt-1">
                  <small className="text-white">
                    {(eventData.shortdesc?.length || 0)}/250
                  </small>
                </div>
              </div>
              <div className="event-frm-bx">
                <label className="form-label">
                  Detailed Description/Highlights <span className="text-danger">*</span>
                </label>
                <textarea
                  name="longdesc"
                  value={eventData.longdesc || ""}
                  onChange={handleInputChange}
                  placeholder="Full details about the event"></textarea>
                <div className="text-end mt-1">
                  <small className="text-white">
                    {(eventData.longdesc?.length || 0)}/2000
                  </small>
                </div>
              </div>
              <div className="event-frm-bx">
                <label className="form-label">Tags <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add relevant tags (comma separated)"
                  onChange={handleTagsChange}
                  value={eventData.tags && eventData.tags.join(", ")}
                />
              </div>
              <div className="d-flex gap-2 justify-content-end mt-2">
                <button
                  className="outline-btn"
                  type="button"
                  onClick={() => router.back()}>
                  Back
                </button>
                <button
                  className="custom-btn"
                  type="button"
                  onClick={handleNext}>
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

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BasicInfoContent />
    </Suspense>
  );
}
