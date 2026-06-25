"use client";
import Link from "next/link";
import React, { useEffect, useState, Suspense } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { useEventContext } from "@/context/EventContext";
import authApi from "@/api/authApi";
import eventApi from "@/api/eventApi";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";

function BasicInfoContent() {
  const { t, language } = useLanguage();
  const { eventData, updateEventData, loadEventForEdit } = useEventContext();
  const [categories, setCategories] = useState([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
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
      if (response?.data && response?.data?.event) {
        loadEventForEdit(response.data.event);
      }
    } catch (error) {
      console.error("Error loading event:", error);
      toast.error(t("failedToLoadEvent"));
      router.push("/EventsManagement");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await authApi.getCategoryList();
      if (response?.data && response?.data?.categories) {
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
      toast.error(t("maxTagsAllowed"));
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
      toast.error(t("imageSizeMustBeLessThan"));
      return;
    }

    // Validation: Check file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("invalidImageFormat"));
      return;
    }

    const formData = new FormData();
    formData.append("files", file);

    setUploadingPoster(true);
    try {
      const response = await authApi.uploadFile(formData);
      if (
        response?.data &&
        response?.data?.files &&
        response?.data?.files.length > 0
      ) {
        updateEventData({ posterImage: [response.data.files[0]] });
        toast.success(t("imageUploadedSuccessfully"));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(t("imageUploadFailed"));
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleGalleryImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentImageCount = (eventData.mediaLinks || []).length;
    if (currentImageCount + files.length > 5) {
      toast.error(t("maxGalleryImagesExceededDynamic", { count: currentImageCount }));
      return;
    }

    setUploadingGallery(true);
    try {
      const newLinks = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("files", file);
        const response = await authApi.uploadFile(formData);
        if (
          response?.data &&
          response?.data?.files &&
          response?.data?.files.length > 0
        ) {
          newLinks.push(response?.data?.files[0]);
        }
      }

      updateEventData({
        mediaLinks: [...(eventData.mediaLinks || []), ...newLinks],
      });
      toast.success(t("imagesUploadedSuccessfully"));
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(t("failedToUploadImage"));
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index) => {
    const updatedLinks = (eventData.mediaLinks || []).filter((_, i) => i !== index);
    updateEventData({ mediaLinks: updatedLinks });
  };

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentVideoCount = (eventData.shortTeaserVideo || []).length;
    if (currentVideoCount + files.length > 1) {
      toast.error(t("onlyOneVideoAllowed"));
      return;
    }

    setUploadingVideo(true);
    try {
      const newLinks = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("files", file);
        const response = await authApi.uploadFile(formData);
        if (
          response?.data &&
          response?.data?.files &&
          response?.data?.files.length > 0
        ) {
          newLinks.push(response.data.files[0]);
        }
      }

      updateEventData({
        shortTeaserVideo: [...(eventData.shortTeaserVideo || []), ...newLinks],
      });
      toast.success(t("videosUploadedSuccessfully"));
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error(t("failedToUploadVideo"));
    } finally {
      setUploadingVideo(false);
    }
  };

  const removeVideo = (index) => {
    const updatedLinks = (eventData.shortTeaserVideo || []).filter(
      (_, i) => i !== index,
    );
    updateEventData({ shortTeaserVideo: updatedLinks });
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!eventData.eventTitle) {
      toast.error(t("eventTitleRequired"));
      return;
    }

    if (eventData.eventTitle.length < 5) {
      toast.error(t("eventTitleMinLength"));
      return;
    }

    if (!eventData.eventCategory) {
      toast.error(t("eventCategoryRequired"));
      return;
    }

    if (!eventData.posterImage || eventData.posterImage.length === 0) {
      toast.error(t("pleaseUploadEventPoster"));
      return;
    }

    if (!eventData.shortdesc || eventData.shortdesc.trim() === "") {
      toast.error(t("shortDescriptionRequired"));
      return;
    }

    if (eventData.shortdesc.length < 10) {
      toast.error(t("shortDescriptionMinLength"));
      return;
    }

    if (!eventData.longdesc || eventData.longdesc.trim() === "") {
      toast.error(t("detailedDescriptionRequired"));
      return;
    }

    if (eventData.longdesc.length < 50) {
      toast.error(t("detailedDescriptionMinLength"));
      return;
    }

    router.push("/DateTime");
  };

  useEffect(() => {
    document.title = t("basicInfoPageTitle");
  }, []);


  return (
    <div>
      <Row className="justify-content-center">
        <Col lg={10} md={12} xs={12}>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
            <h2 className="text-white mb-0">{t("createEvent")}</h2>
            <button
              type="button"
              className="outline-btn"
              onClick={async () => {
                try {
                  const isPublishedEdit = eventData._id && eventData.isDraft === false;
                  const payload = { ...eventData, isDraft: !isPublishedEdit };
                  // Clean the payload
                  if (payload.eventCategory && typeof payload.eventCategory === 'object') {
                    payload.eventCategory = payload.eventCategory._id;
                  }
                  if (payload.createdBy && typeof payload.createdBy === 'object') {
                    payload.createdBy = payload.createdBy._id;
                  }
                  const fieldsToRemove = ['duration', 'status', 'totalAttendees', 'isBooked', 'totalRevenue', 'createdAt', 'updatedAt', '__v'];
                  fieldsToRemove.forEach(field => delete payload[field]);

                  const isEditMode = !!eventData._id;
                  let response;
                  if (isEditMode) {
                    const { _id, fetcherEvent, featureEventFee, createdBy, ...updatePayload } = payload;
                    response = await eventApi.updateEvent(_id, updatePayload);
                  } else {
                    response = await eventApi.createEvent(payload);
                  }
                  if (response.status) {
                    toast.success(isPublishedEdit ? (t("profileUpdatedSuccessfully") || "Changes saved successfully") : (t("draftSavedSuccessfully") || "Draft saved successfully"));
                    router.push("/EventsManagement");
                  }
                } catch (error) {
                  console.error("Error saving event:", error);
                  toast.error(error.response?.data?.message || "Failed to save event");
                }
              }}
              style={{ padding: "8px 24px", borderRadius: "20px" }}
            >
              {eventData._id && eventData.isDraft === false ? (t("saveChanges") || "Save Changes") : (t("saveDraft") || "Save Draft")}
            </button>
          </div>
          <ul className="event-steps">
            <li className="steps-item">
              <Link href="/BasicInfo" className="steps-link active">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-01.svg" className="me-2" />
                  {t("eventBasicInfoStep")}
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
                  {t("dateTimeStep")}
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
                  {t("ticketsPricingStep")}
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
                  {t("ageRestrictionStep")}
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
                      {t("eventTitleLabel")} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="eventTitle"
                      value={eventData.eventTitle || ""}
                      onChange={handleInputChange}
                      placeholder={t("eventTitlePlaceholder")}
                    />
                    <div className="text-end mt-1">
                      <small className="text-white">
                        {(eventData.eventTitle?.length || 0)}/100
                      </small>
                    </div>
                  </div>
                </Col>
                <Col md={12}>
                  <div className="event-frm-bx">
                    <label className="form-label">
                      {t("eventCategoryLabel")} <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {(showAllCategories ? categories : categories.slice(0, 8)).map((cat) => {
                        const isSelected = eventData.eventCategory === cat._id;
                        return (
                          <button
                            key={cat._id}
                            type="button"
                            className={`custom-btn ${isSelected ? "" : "outline-btn"}`}
                            style={{ borderRadius: "20px", padding: "8px 16px", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "8px" }}
                            onClick={() => updateEventData({ eventCategory: cat._id })}
                          >
                            {cat.image && (
                              <img
                                src={getFullImageUrl(cat.image)}
                                alt={cat.name}
                                style={{ width: "16px", height: "16px", borderRadius: "50%", objectFit: "cover" }}
                                onError={(e) => { e.target.src = "/img/sidebar-logo.svg" }}
                              />
                            )}
                            {(() => {
                              const displayName = language === "mn" && cat.name_thi ? cat.name_thi : cat.name;
                              return displayName ? displayName.charAt(0).toUpperCase() + displayName.slice(1) : "";
                            })()}
                          </button>
                        );
                      })}
                    </div>
                    {categories.length > 8 && (
                      <div className="mb-3">
                        <button
                          type="button"
                          className="btn btn-link p-0 text-decoration-none"
                          style={{ color: "#23ada4", fontSize: "14px", fontWeight: "600" }}
                          onClick={() => setShowAllCategories(!showAllCategories)}
                        >
                          {showAllCategories ? t("showLess") || "Show Less" : t("showMore") || "Show More"}
                        </button>
                      </div>
                    )}
                  </div>
                </Col>
                <Col md={12}>
                  <div className="event-frm-bx upload">
                    <div>
                      <h5>{t("uploadEventPosterTitle")} <span className="text-danger">*</span></h5>
                      <p>{t("uploadEventPosterDesc")}</p>
                    </div>
                    <input
                      type="file"
                      id="upload"
                      className="d-none"
                      onChange={handleImageUpload}
                      accept="image/*"
                    />
                    <label htmlFor="upload">
                      {uploadingPoster ? t("uploading") : t("upload")}
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
                                e.target.src = "/img/sidebar-logo.svg";
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
                              {t("eventPosterUploadedSuccessLine")}
                            </p>
                            <p className="text-white" style={{ fontSize: "14px" }}>
                              {t("clickToRemoveAndUploadDifferentImage")}
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
                <label className="form-label">{t("shortDescriptionLabel")} <span className="text-danger">*</span></label>
                <textarea
                  name="shortdesc"
                  value={eventData.shortdesc || ""}
                  onChange={handleInputChange}
                  placeholder={t("shortDescriptionPlaceholder")}></textarea>
                <div className="text-end mt-1">
                  <small className="text-white">
                    {(eventData.shortdesc?.length || 0)}/250
                  </small>
                </div>
              </div>
              <div className="event-frm-bx">
                <label className="form-label">
                  {t("detailedDescriptionLabel")} <span className="text-danger">*</span>
                </label>
                <textarea
                  name="longdesc"
                  value={eventData.longdesc || ""}
                  onChange={handleInputChange}
                  placeholder={t("detailedDescriptionPlaceholder")}></textarea>
                <div className="text-end mt-1">
                  <small className="text-white">
                    {(eventData.longdesc?.length || 0)}/2000
                  </small>
                </div>
              </div>
              {/* Image Gallery (Optional) */}
              <div className="event-frm-bx upload mt-4">
                <div>
                  <h5>{t("mediaAndGalleryTitle") || "Image Gallery (Optional)"}</h5>
                  <p>{t("mediaAndGalleryDesc") || "Upload images or videos of the event"}</p>
                </div>
                <input
                  type="file"
                  id="upload-gallery"
                  className="d-none"
                  multiple
                  onChange={handleGalleryImageUpload}
                  accept="image/*"
                />
                <label htmlFor="upload-gallery">
                  {uploadingGallery ? t("uploading") : t("upload")}
                </label>
              </div>
              <div className="upload-images mt-2">
                {(eventData.mediaLinks || []).map((link, index) => (
                  <div className="images-innr" key={index}>
                    <img
                      src={getFullImageUrl(link)}
                      alt={`gallery-${index}`}
                    />
                    <button
                      type="button"
                      className="close-btn"
                      onClick={() => removeGalleryImage(index)}>
                      <img src="/img/org-img/close.svg" alt="Remove" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Teaser Video Upload (Optional) */}
              <div className="event-frm-bx upload mt-4">
                <div>
                  <h5>{t("shortTeaserClipsTitle") || "Teaser Video Upload (Optional)"}</h5>
                  <p>{t("shortTeaserClipsDesc") || "Upload a short video of the event"}</p>
                </div>
                <input
                  type="file"
                  id="upload-video"
                  className="d-none"
                  onChange={handleVideoUpload}
                  accept="video/*"
                />
                <label htmlFor="upload-video">
                  {uploadingVideo ? t("uploading") : t("uploadVideo") || "Upload"}
                </label>
              </div>
              <div className="upload-images mt-2">
                {(eventData.shortTeaserVideo || []).map((link, index) => (
                  <div
                    className="images-innr"
                    key={index}
                    style={{ width: "150px", height: "150px" }}>
                    <video
                      src={getFullImageUrl(link)}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "10px",
                      }}
                      controls
                    />
                    <button
                      type="button"
                      className="close-btn"
                      onClick={() => removeVideo(index)}
                      style={{ top: "-10px", right: "-10px" }}>
                      <img src="/img/org-img/close.svg" alt="Remove" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="d-flex gap-2 justify-content-end mt-4">
                <button
                  className="outline-btn"
                  type="button"
                  onClick={() => router.back()}>
                  {t("back")}
                </button>
                <button
                  className="custom-btn"
                  type="button"
                  onClick={handleNext}>
                  {t("saveAndContinue")}
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
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div>{t("loading")}</div>}>
      <BasicInfoContent />
    </Suspense>
  );
}
