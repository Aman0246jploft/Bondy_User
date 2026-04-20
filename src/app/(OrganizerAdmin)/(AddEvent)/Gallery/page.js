"use client";
import Link from "next/link";
import React, { useState,useEffect } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { useEventContext } from "@/context/EventContext";
import authApi from "@/api/authApi";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { getFullImageUrl } from "@/utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";

function page() {
  const { t } = useLanguage();
  const { eventData, updateEventData } = useEventContext();
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentImageCount = eventData.mediaLinks.length;
    if (currentImageCount + files.length > 5) {
      toast.error(t("maxGalleryImagesExceededDynamic", { count: currentImageCount }));
      return;
    }

    setUploading(true);
    try {
      // Upload one by one or loop
      // Assuming api supports single file update mostly, but we can call it multiple times
      const newLinks = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("files", file);
        const response = await authApi.uploadFile(formData);
        if (
          response.data &&
          response.data.files &&
          response.data.files.length > 0
        ) {
          newLinks.push(response.data.files[0]);
        }
      }

      updateEventData({
        mediaLinks: [...eventData.mediaLinks, ...newLinks],
      });
      toast.success(t("imagesUploadedSuccessfully"));
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(t("failedToUploadImage"));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const updatedLinks = eventData.mediaLinks.filter((_, i) => i !== index);
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

    setUploading(true);
    try {
      const newLinks = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("files", file);
        const response = await authApi.uploadFile(formData);
        if (
          response.data &&
          response.data.files &&
          response.data.files.length > 0
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
      setUploading(false);
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
    router.push("/EventPreview");
  };

  useEffect(() => {
    document.title = t("galleryPageTitle");
  }, []);


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
              <Link href="/Agerestraction" className="steps-link active">
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
              <Link href="/Gallery" className="steps-link active">
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
                <Col md={12}>
                  <div className="event-frm-bx upload">
                    <div>
                      <h5>{t("mediaAndGalleryTitle")}</h5>
                      <p>
                        {t("mediaAndGalleryDesc")}
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
                    <label htmlFor="upload">
                      {uploading ? t("uploading") : t("upload")}
                    </label>
                  </div>
                  <div className="upload-images">
                    {eventData.mediaLinks.map((link, index) => (
                      <div className="images-innr" key={index}>
                        <img
                          src={getFullImageUrl(link)}
                          alt={`gallery-${index}`}
                        />
                        <button
                          type="button"
                          className="close-btn"
                          onClick={() => removeImage(index)}>
                          <img src="/img/org-img/close.svg" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="event-frm-bx upload mt-4">
                    <div>
                      <h5>{t("shortTeaserClipsTitle")}</h5>
                      <p>
                        {t("shortTeaserClipsDesc")}
                      </p>
                    </div>
                    <input
                      type="file"
                      id="upload-video"
                      className="d-none"
                      multiple
                      onChange={handleVideoUpload}
                      accept="video/*"
                    />
                    <label htmlFor="upload-video">
                      {uploading ? t("uploading") : t("uploadVideo")}
                    </label>
                  </div>
                  <div className="upload-images">
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
                          <img src="/img/org-img/close.svg" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>

              <div className="d-flex gap-2 justify-content-end mt-2">
                <Link href="/Agerestraction" className="outline-btn">
                  {t("back")}
                </Link>

                <button
                  type="button"
                  onClick={handleNext}
                  className="custom-btn">
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

export default page;
