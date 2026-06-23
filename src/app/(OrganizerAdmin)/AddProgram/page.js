"use client";
import React, { useState, useRef, useEffect } from "react";
import { Col, Form, Row } from "react-bootstrap";
import LocationMap from "../Components/LocationMap";
import VenueAutocomplete from "../Components/VenueAutocomplete";
import apiClient from "../../../api/apiClient";
import courseApi from "../../../api/courseApi";
import { fetchCurrentLocation, formatLocationForApi } from "../../../utils/locationHelper";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getFullImageUrl } from "../../../utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: "pointer", color: "#e53e3e" }}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: "pointer", color: "#23ada4", marginRight: "10px" }}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
  </svg>
);

const PassIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#23ada4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px", display: "inline-block", verticalAlign: "middle" }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const CourseContextDummy = {
  venueAddress: {
    latitude: 47.9188,
    longitude: 106.9176,
    city: "Ulaanbaatar",
    country: "Mongolia",
    address: "",
    state: "",
    zipcode: "",
  }
};

// Create a small provider mockup if needed, but we can also just update state
function Page() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [step, setStep] = useState(1);
  const [courseId, setCourseId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refundPolicies, setRefundPolicies] = useState([]);
  const [bookingCutOffOptions, setBookingCutOffOptions] = useState([
    { key: "1h", label: "1 hour before session" },
    { key: "2h", label: "2 hours before session" },
    { key: "4h", label: "4 hours before session" },
    { key: "12h", label: "12 hours before session" },
    { key: "24h", label: "24 hours before session" },
    { key: "48h", label: "48 hours before session" }
  ]);

  // Batch Form Overlay State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingBatchIndex, setEditingBatchIndex] = useState(null);
  const [batchForm, setBatchForm] = useState({
    batchName: "",
    startTime: "",
    endTime: "",
    days: [],
    seats: 10,
  });

  const [formData, setFormData] = useState({
    courseTitle: "",
    courseCategory: "",
    totalSeats: "",
    price: "",
    shortdesc: "",
    longdesc: "",
    whatYouWillLearn: "",
    isFeatured: false,
    posterImage: [],
    mediaLinks: [], // Image Gallery
    shortTeaserVideo: [], // Teaser Video
    venueName: "",
    venueAddress: {
      latitude: 47.9188,
      longitude: 106.9176,
      city: "",
      country: "",
      address: "",
      state: "",
      zipcode: "",
    },
    enrollmentType: "Ongoing",
    startDate: "",
    endDate: "2099-12-31",
    totalSessions: "",
    batches: [],
    refundPolicy: "",
    bookingCutOff: "",
    oneMonthPassEnabled: false,
    oneMonthPassPrice: "",
    threeMonthPassEnabled: false,
    threeMonthPassPrice: "",
    isDraft: false,
  });

  const [noEndDate, setNoEndDate] = useState(true);

  // Track eventData helper context internally for LocationMap dependency compatibility
  const [eventData, setEventData] = useState({
    venueAddress: formData.venueAddress
  });

  const updateEventData = (updated) => {
    if (updated.venueAddress) {
      setFormData(prev => ({
        ...prev,
        venueAddress: { ...prev.venueAddress, ...updated.venueAddress }
      }));
      setEventData(prev => ({
        ...prev,
        venueAddress: { ...prev.venueAddress, ...updated.venueAddress }
      }));
    }
  };

  // Sync internal context compatibility state with changes
  useEffect(() => {
    setEventData({ venueAddress: formData.venueAddress });
  }, [formData.venueAddress]);

  // Handle manual input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    const limits = {
      courseTitle: 100,
      shortdesc: 250,
      whatYouWillLearn: 1000,
      price: 9,
      oneMonthPassPrice: 9,
      threeMonthPassPrice: 9,
      totalSeats: 9,
    };

    if (limits[name] && value.toString().length > limits[name]) {
      return;
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      localStorage.setItem("courseCreationData", JSON.stringify(updated));
      return updated;
    });
  };

  const handleVenueSelected = (venueAddressData) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        venueAddress: {
          ...prev.venueAddress,
          ...venueAddressData,
        },
      };
      localStorage.setItem("courseCreationData", JSON.stringify(updated));
      return updated;
    });
  };

  // Fetch initial configuration data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("courseId");
    if (id) {
      setCourseId(id);
    }

    const fetchData = async () => {
      try {
        const catRes = await apiClient.get("/category/list?limit=1000");
        if (catRes?.data && catRes?.data?.categories) {
          setCategories(catRes.data.categories);
        }

        const refundRes = await apiClient.get("/event/refund-policies", { skipToast: true });
        if (refundRes?.status && Array.isArray(refundRes.data)) {
          setRefundPolicies(refundRes.data);
        }

        const cutOffRes = await apiClient.get("/globalsetting/BOOKING_CUT_OFF_CONFIG", { skipToast: true });
        if (cutOffRes?.status && cutOffRes?.data?.value && Array.isArray(cutOffRes.data.value)) {
          setBookingCutOffOptions(cutOffRes.data.value);
        }
      } catch (err) {
        console.error("Error loading config:", err);
      }
    };
    fetchData();
    document.title = t("addEditCourseTitle") || "Create Course";
  }, []);

  // Fetch course details if editing
  useEffect(() => {
    if (!courseId) {
      setInitialLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        const res = await courseApi.getCourseDetails(courseId);
        if (res?.data) {
          const course = res.data;
          const transformed = { ...course };

          if (course.venueAddress && course.venueAddress.type === "Point") {
            transformed.venueAddress = {
              latitude: course.venueAddress.coordinates[1],
              longitude: course.venueAddress.coordinates[0],
              city: course.venueAddress.city || "",
              country: course.venueAddress.country || "",
              address: course.venueAddress.address || "",
              state: course.venueAddress.state || "",
              zipcode: course.venueAddress.zipcode || "",
            };
          }

          if (transformed.courseCategory && typeof transformed.courseCategory === "object") {
            transformed.courseCategory = transformed.courseCategory._id;
          }

          // Format Dates
          if (transformed.startDate) transformed.startDate = transformed.startDate.split("T")[0];
          if (transformed.endDate) transformed.endDate = transformed.endDate.split("T")[0];

          if (transformed.endDate === "2099-12-31") {
            setNoEndDate(true);
          } else {
            setNoEndDate(false);
          }

          // Populate pass details with fallbacks
          if (transformed.oneMonthPassEnabled === undefined) transformed.oneMonthPassEnabled = false;
          if (transformed.oneMonthPassPrice === undefined || transformed.oneMonthPassPrice === null) transformed.oneMonthPassPrice = "";
          if (transformed.threeMonthPassEnabled === undefined) transformed.threeMonthPassEnabled = false;
          if (transformed.threeMonthPassPrice === undefined || transformed.threeMonthPassPrice === null) transformed.threeMonthPassPrice = "";

          setFormData(transformed);
        }
      } catch (err) {
        console.error("Error loading details:", err);
        toast.error(t("failedToLoadCourseDetails") || "Failed to load course details");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchDetails();
  }, [courseId]);

  // Asset Upload Handlers
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const uploadData = new FormData();
    uploadData.append("files", files[0]);

    try {
      setLoading(true);
      const response = await apiClient.post("/user/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status && response.data && response.data.files) {
        setFormData(prev => ({
          ...prev,
          posterImage: [response.data.files[0]]
        }));
        toast.success(t("imageUploadedSuccessfully"));
      }
    } catch (err) {
      toast.error(t("imageUploadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if ((formData.mediaLinks || []).length + files.length > 5) {
      toast.error(t("max5GalleryImagesWarning") || "Max 5 gallery images allowed");
      return;
    }

    try {
      setLoading(true);
      const newLinks = [];
      for (const file of files) {
        const uploadData = new FormData();
        uploadData.append("files", file);
        const response = await apiClient.post("/user/upload", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (response.status && response.data?.files) {
          newLinks.push(response.data.files[0]);
        }
      }
      setFormData(prev => ({
        ...prev,
        mediaLinks: [...(prev.mediaLinks || []), ...newLinks]
      }));
      toast.success(t("galleryImagesUploaded") || "Gallery images uploaded successfully");
    } catch (err) {
      toast.error(t("failedToUploadGallery") || "Failed to upload gallery images");
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("files", file);

    try {
      setLoading(true);
      const response = await apiClient.post("/user/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status && response.data?.files) {
        setFormData(prev => ({
          ...prev,
          shortTeaserVideo: [response.data.files[0]]
        }));
        toast.success(t("teaserVideoUploaded") || "Teaser video uploaded successfully");
      }
    } catch (err) {
      toast.error(t("failedToUploadTeaser") || "Failed to upload teaser video");
    } finally {
      setLoading(false);
    }
  };

  // Batches CRUD
  const openAddBatch = () => {
    setBatchForm({
      batchName: "",
      startTime: "",
      endTime: "",
      days: [],
      seats: formData.enrollmentType === "Ongoing" ? (parseInt(formData.totalSeats) || 10) : 10,
    });
    setEditingBatchIndex(null);
    setShowBatchModal(true);
  };

  const openEditBatch = (index) => {
    setBatchForm(formData.batches[index]);
    setEditingBatchIndex(index);
    setShowBatchModal(true);
  };

  const saveBatch = () => {
    let formToSave = { ...batchForm };
    if (formData.enrollmentType === "Ongoing") {
      if (!formToSave.batchName) {
        const idx = editingBatchIndex !== null ? editingBatchIndex : (formData.batches || []).length;
        formToSave.batchName = `Class Time ${idx + 1}`;
      }
      formToSave.seats = formToSave.seats || parseInt(formData.totalSeats) || 10;
    }

    if (!formToSave.batchName || !formToSave.startTime || !formToSave.endTime || !formToSave.days.length || !formToSave.seats) {
      toast.error("Please fill all required schedule fields");
      return;
    }

    const updated = [...(formData.batches || [])];
    if (editingBatchIndex !== null) {
      updated[editingBatchIndex] = formToSave;
    } else {
      updated.push(formToSave);
    }

    setFormData(prev => ({ ...prev, batches: updated }));
    setShowBatchModal(false);
    toast.success(editingBatchIndex !== null ? "Schedule updated" : "Schedule added");
  };

  const removeBatch = (index) => {
    const updated = formData.batches.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, batches: updated }));
    toast.success("Schedule removed");
  };

  // Submit / Save Actions
  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        isDraft: true,
        price: formData.price ? Number(formData.price) : 0,
        totalSeats: formData.totalSeats ? Number(formData.totalSeats) : 0,
        totalSessions: formData.enrollmentType === "Ongoing" ? 9999 : (formData.totalSessions ? Number(formData.totalSessions) : 0),
        endDate: formData.enrollmentType === "Ongoing" && noEndDate ? "2099-12-31" : formData.endDate,
        venueAddress: formatLocationForApi(formData.venueAddress) || formData.venueAddress,
        oneMonthPassPrice: formData.oneMonthPassEnabled && formData.oneMonthPassPrice ? Number(formData.oneMonthPassPrice) : 0,
        threeMonthPassPrice: formData.threeMonthPassEnabled && formData.threeMonthPassPrice ? Number(formData.threeMonthPassPrice) : 0,
      };

      if (payload.courseCategory && typeof payload.courseCategory === "object") {
        payload.courseCategory = payload.courseCategory._id;
      }

      const fieldsToRemove = ["_id", "createdAt", "updatedAt", "__v", "createdBy", "totalRevenue", "totalEnrollments", "leftSeats", "duration"];
      fieldsToRemove.forEach(field => delete payload[field]);

      let res;
      if (courseId) {
        res = await courseApi.updateCourse(courseId, payload);
      } else {
        res = await apiClient.post("/course/create", payload);
      }

      if (res.status) {
        toast.success(t("draftSavedSuccessfully") || "Draft saved successfully");
        router.push("/CoursesManagement");
      }
    } catch (err) {
      toast.error("Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        isDraft: false,
        price: Number(formData.price),
        totalSeats: Number(formData.totalSeats) || 0,
        totalSessions: formData.enrollmentType === "Ongoing" ? 9999 : Number(formData.totalSessions),
        endDate: formData.enrollmentType === "Ongoing" && noEndDate ? "2099-12-31" : formData.endDate,
        venueAddress: formatLocationForApi(formData.venueAddress) || formData.venueAddress,
        oneMonthPassPrice: formData.oneMonthPassEnabled && formData.oneMonthPassPrice ? Number(formData.oneMonthPassPrice) : 0,
        threeMonthPassPrice: formData.threeMonthPassEnabled && formData.threeMonthPassPrice ? Number(formData.threeMonthPassPrice) : 0,
      };

      if (payload.courseCategory && typeof payload.courseCategory === "object") {
        payload.courseCategory = payload.courseCategory._id;
      }

      const fieldsToRemove = ["_id", "createdAt", "updatedAt", "__v", "createdBy", "totalRevenue", "totalEnrollments", "leftSeats", "duration"];
      fieldsToRemove.forEach(field => delete payload[field]);

      let res;
      if (courseId) {
        res = await courseApi.updateCourse(courseId, payload);
      } else {
        res = await apiClient.post("/course/create", payload);
      }

      if (res.status) {
        toast.success(formData.enrollmentType === "Ongoing" ? "Class published successfully" : "Course published successfully");
        router.push("/CoursesManagement");
      }
    } catch (err) {
      toast.error(formData.enrollmentType === "Ongoing" ? "Failed to publish class" : "Failed to publish course");
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (formData.enrollmentType === "Ongoing") {
        if (!formData.courseTitle || !formData.courseCategory || !formData.shortdesc || !formData.longdesc) {
          toast.error("Please fill all required basic info fields");
          return false;
        }
      } else {
        if (!formData.courseTitle || !formData.courseCategory || !formData.shortdesc || !formData.longdesc || !formData.whatYouWillLearn) {
          toast.error("Please fill all required basic info fields");
          return false;
        }
      }
      if (!formData.posterImage || formData.posterImage.length === 0) {
        toast.error(formData.enrollmentType === "Ongoing" ? "Please upload a class poster" : "Please upload a course poster");
        return false;
      }
    } else if (currentStep === 2) {
      if (formData.enrollmentType === "Ongoing") {
        if (!formData.startDate || !formData.venueName || !formData.venueAddress?.address) {
          toast.error("Please fill all location & start date fields");
          return false;
        }
        if (!noEndDate && !formData.endDate) {
          toast.error("Please select an end date or check 'No end date'");
          return false;
        }
        if (!formData.batches || formData.batches.length === 0) {
          toast.error("Please add at least one weekly schedule class time");
          return false;
        }
      } else {
        if (!formData.startDate || !formData.endDate || !formData.totalSessions || !formData.venueName || !formData.venueAddress?.address) {
          toast.error("Please fill all location & duration fields");
          return false;
        }
        if (!formData.batches || formData.batches.length === 0) {
          toast.error("Please add at least one batch schedule");
          return false;
        }
      }
    } else if (currentStep === 3) {
      if (formData.enrollmentType === "Ongoing") {
        if (!formData.price || formData.price < 0 || !formData.totalSeats || formData.totalSeats < 1 || !formData.refundPolicy) {
          toast.error("Please configure valid price, capacity per session, and refund policy");
          return false;
        }
        if (formData.oneMonthPassEnabled) {
          if (formData.oneMonthPassPrice === "" || formData.oneMonthPassPrice < 0) {
            toast.error("Please enter a valid price for the enabled 1 Month Pass");
            return false;
          }
        }
        if (formData.threeMonthPassEnabled) {
          if (formData.threeMonthPassPrice === "" || formData.threeMonthPassPrice < 0) {
            toast.error("Please enter a valid price for the enabled 3 Month Pass");
            return false;
          }
        }
      } else {
        if (!formData.price || formData.price < 0 || !formData.refundPolicy) {
          toast.error("Please configure a valid price and refund policy");
          return false;
        }
      }
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    setStep(step - 1);
  };

  if (initialLoading) {
    return <div className="text-center p-5 text-white">{t("loading")}</div>;
  }

  const activeCategory = categories.find(cat => cat._id === formData.courseCategory);

  return (
    <div>
      <Row className="justify-content-center">
        <Col lg={10} md={12} xs={12}>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
            <h2 className="text-white mb-0">
              {courseId
                ? (formData.enrollmentType === "Ongoing" ? t("editClass") || "Edit Class" : t("editCourse") || "Edit Course")
                : (formData.enrollmentType === "Ongoing" ? t("createClass") || "Create Class" : t("createCourse") || "Create Course")}
            </h2>
            <button
              type="button"
              className="outline-btn"
              onClick={handleSaveDraft}
              style={{ padding: "8px 24px", borderRadius: "20px" }}
            >
              {t("saveDraft") || "Save Draft"}
            </button>
          </div>

          {/* Steps Indicator */}
          <ul className="event-steps mb-4">
            <li className="steps-item">
              <span className={`steps-link ${step >= 1 ? "active" : ""}`}>
                <span className="steps-text">{t("basicInfoStep") || "Basic Info"}</span>
                <span className="steps-arrow"><img src="/img/Arrow-Right.svg" className="ms-3" /></span>
              </span>
            </li>
            <li className="steps-item">
              <span className={`steps-link ${step >= 2 ? "active" : ""}`}>
                <span className="steps-text">{t("locationScheduleStep") || "Location & Schedule"}</span>
                <span className="steps-arrow"><img src="/img/Arrow-Right.svg" className="ms-3" /></span>
              </span>
            </li>
            <li className="steps-item">
              <span className={`steps-link ${step >= 3 ? "active" : ""}`}>
                <span className="steps-text">{formData.enrollmentType === "Ongoing" ? (t("pricingCapacityStep") || "Pricing & Capacity") : (t("pricingStep") || "Pricing")}</span>
                <span className="steps-arrow"><img src="/img/Arrow-Right.svg" className="ms-3" /></span>
              </span>
            </li>
            <li className="steps-item">
              <span className={`steps-link ${step >= 4 ? "active" : ""}`}>
                <span className="steps-text">{t("reviewStep") || "Review"}</span>
              </span>
            </li>
          </ul>

          <div className="event-form-card">
            {/* STEP 1: BASIC INFO */}
            {step === 1 && (
              <div>
                {/* Enrollment Type Toggle Switcher */}
                <div className="d-flex justify-content-center gap-3 mb-4">
                  <button
                    type="button"
                    className={`custom-btn ${formData.enrollmentType === "Ongoing" ? "" : "outline-btn"}`}
                    style={{ borderRadius: "20px", padding: "10px 24px", fontSize: "14px" }}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, enrollmentType: "Ongoing", endDate: "2099-12-31" }));
                      setNoEndDate(true);
                    }}
                    disabled={!!courseId}
                  >
                    {t("ongoingClass") || "Ongoing Class"}
                  </button>
                  <button
                    type="button"
                    className={`custom-btn ${formData.enrollmentType === "fixedStart" ? "" : "outline-btn"}`}
                    style={{ borderRadius: "20px", padding: "10px 24px", fontSize: "14px" }}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, enrollmentType: "fixedStart", endDate: "" }));
                      setNoEndDate(false);
                    }}
                    disabled={!!courseId}
                  >
                    {t("fixedStartCourse") || "Fixed Start Course"}
                  </button>
                </div>

                <div className="event-frm-bx">
                  <label className="form-label">
                    {formData.enrollmentType === "Ongoing"
                      ? t("className") || "Class Name"
                      : t("courseName") || "Course Name"} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="courseTitle"
                    value={formData.courseTitle}
                    onChange={handleChange}
                    placeholder={
                      formData.enrollmentType === "Ongoing"
                        ? t("enterClassName") || "Enter class name"
                        : t("enterCourseName") || "Enter course name"
                    }
                  />
                </div>

                <div className="event-frm-bx">
                  <label className="form-label">
                    {formData.enrollmentType === "Ongoing"
                      ? t("shortSummary") || "Short Summary"
                      : t("shortDescription") || "Short Description"} <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    name="shortdesc"
                    value={formData.shortdesc}
                    onChange={handleChange}
                    placeholder={
                      formData.enrollmentType === "Ongoing"
                        ? t("briefClassSummary") || "Brief summary of the class"
                        : t("briefCourseSummary") || "Brief summary of the course"
                    }
                    rows={2}
                  />
                </div>

                <div className="event-frm-bx">
                  <label className="form-label">
                    {formData.enrollmentType === "Ongoing"
                      ? t("fullDescription") || "Full Description"
                      : t("courseDetails") || "Course Details"} <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    name="longdesc"
                    value={formData.longdesc}
                    onChange={handleChange}
                    placeholder={
                      formData.enrollmentType === "Ongoing"
                        ? t("classDetailsPlaceholder") || "In-depth details about the class structure"
                        : t("courseDetailsPlaceholder") || "In-depth details about the program structure"
                    }
                    rows={4}
                  />
                </div>

                {formData.enrollmentType !== "Ongoing" && (
                  <div className="event-frm-bx">
                    <label className="form-label">{t("whatYouWillLearn") || "What You'll Learn"} <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      name="whatYouWillLearn"
                      value={formData.whatYouWillLearn}
                      onChange={handleChange}
                      placeholder={t("whatYouWillLearnPlaceholder") || "Key takeaways or skills acquired"}
                      rows={3}
                    />
                  </div>
                )}

                {/* Categories */}
                <div className="event-frm-bx">
                  <label className="form-label">
                    {formData.enrollmentType === "Ongoing"
                      ? t("classCategory") || "Class Category"
                      : t("courseCategory") || "Course Category"} <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {categories.map((cat) => {
                      const isSelected = formData.courseCategory === cat._id;
                      return (
                        <button
                          key={cat._id}
                          type="button"
                          className={`custom-btn ${isSelected ? "" : "outline-btn"}`}
                          style={{ borderRadius: "20px", padding: "8px 16px", fontSize: "14px" }}
                          onClick={() => setFormData(prev => ({ ...prev, courseCategory: cat._id }))}
                        >
                          {language === "mn" && cat.name_thi ? cat.name_thi : cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Poster Image Upload */}
                <div className="event-frm-bx upload mb-3">
                  <div>
                    <h5>
                      {formData.enrollmentType === "Ongoing"
                        ? t("uploadClassPoster") || "Upload Class Poster"
                        : t("uploadCoursePoster") || "Upload Course Poster"} <span className="text-danger">*</span>
                    </h5>
                    <p>{t("standardPosterDesc") || "Standard poster image for listings"}</p>
                  </div>
                  <input type="file" id="upload-poster" className="d-none" onChange={handleImageUpload} accept="image/*" />
                  <label htmlFor="upload-poster" style={{ cursor: "pointer" }}>
                    {loading ? t("uploading") || "Uploading..." : t("uploadImage") || "Upload Image"}
                  </label>
                </div>
                {formData.posterImage && formData.posterImage.length > 0 && (
                  <div className="mb-4">
                    <img src={getFullImageUrl(formData.posterImage[0])} alt="Poster" style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                )}

                {/* Gallery Images Upload */}
                <div className="event-frm-bx upload mb-3">
                  <div>
                    <h5>{t("imageGalleryOptional") || "Image Gallery (Optional)"}</h5>
                    <p>{t("galleryDesc") || "Up to 5 images showing classrooms, facilities, etc."}</p>
                  </div>
                  <input type="file" id="upload-gallery" className="d-none" multiple onChange={handleGalleryUpload} accept="image/*" />
                  <label htmlFor="upload-gallery" style={{ cursor: "pointer" }}>
                    {t("uploadPhotos") || "Upload Photos"}
                  </label>
                </div>
                <div className="d-flex gap-2 flex-wrap mb-4">
                  {formData.mediaLinks && formData.mediaLinks.map((url, idx) => (
                    <div key={idx} className="position-relative" style={{ width: "90px", height: "90px" }}>
                      <img src={getFullImageUrl(url)} alt="Gallery" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, mediaLinks: prev.mediaLinks.filter((_, i) => i !== idx) }))}
                        className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center"
                        style={{ width: "20px", height: "20px", borderRadius: "50%" }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Teaser Video Upload */}
                <div className="event-frm-bx upload mb-3">
                  <div>
                    <h5>{t("teaserVideoOptional") || "Teaser Video (Optional)"}</h5>
                    <p>{t("teaserVideoDesc") || "Brief clip highlighting program details"}</p>
                  </div>
                  <input type="file" id="upload-video" className="d-none" onChange={handleVideoUpload} accept="video/*" />
                  <label htmlFor="upload-video" style={{ cursor: "pointer" }}>
                    {t("uploadVideo") || "Upload Video"}
                  </label>
                </div>
                {formData.shortTeaserVideo && formData.shortTeaserVideo.length > 0 && (
                  <div className="mb-4">
                    <video src={getFullImageUrl(formData.shortTeaserVideo[0])} controls style={{ width: "100%", maxWidth: "320px", borderRadius: "12px" }} />
                  </div>
                )}

                <div className="d-flex justify-content-end mt-4">
                  <button type="button" onClick={goNext} className="custom-btn">{t("continue") || "Continue"}</button>
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION & SCHEDULE */}
            {step === 2 && (
              <div>
                <h5 className="text-white mb-3">
                  {formData.enrollmentType === "Ongoing"
                    ? t("classDuration") || "Class Duration"
                    : t("courseDuration") || "Course Duration"}
                </h5>
                <Row className="mb-4">
                  <Col md={6} className="mb-3">
                    <div className="event-frm-bx">
                      <label className="form-label">{t("startDate") || "Start Date"} <span className="text-danger">*</span></label>
                      <div className="date-input-wrapper">
                        <input
                          type="date"
                          className="date-input form-control"
                          value={formData.startDate}
                          onChange={handleChange}
                          name="startDate"
                          min={new Date().toISOString().split("T")[0]}
                        />
                        <span className="calendar-icon" onClick={(e) => e.currentTarget.previousSibling?.showPicker()}>
                          <img src="/img/white-calendar.svg" alt="calendar" />
                        </span>
                      </div>
                    </div>
                  </Col>

                  {formData.enrollmentType === "Ongoing" ?
                    <Col md={6} className="mb-3 d-flex flex-column justify-content-center">
                      <div className="form-check form-switch pt-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="no-end-date-toggle"
                          checked={true}
                          disabled
                          style={{ cursor: "not-allowed" }}
                        />
                        <label className="form-check-label text-white ms-2" htmlFor="no-end-date-toggle" style={{ cursor: "not-allowed" }}>
                          {t("noEndDateIndefinitely") || "No end date (Ongoing indefinitely)"}
                        </label>
                      </div>
                    </Col>
                    :
                    <>
                      <Col md={6} className="mb-3">
                        <div className="event-frm-bx">
                          <label className="form-label">{t("endDate") || "End Date"} <span className="text-danger">*</span></label>
                          <div className="date-input-wrapper">
                            <input
                              type="date"
                              className="date-input form-control"
                              value={formData.endDate}
                              onChange={handleChange}
                              name="endDate"
                              min={formData.startDate || new Date().toISOString().split("T")[0]}
                            />
                            <span className="calendar-icon" onClick={(e) => e.currentTarget.previousSibling?.showPicker()}>
                              <img src="/img/white-calendar.svg" alt="calendar" />
                            </span>
                          </div>
                        </div>
                      </Col>
                      <Col md={6} className="mb-3">
                        <div className="event-frm-bx">
                          <label className="form-label">{t("totalSessions") || "Total Sessions"} <span className="text-danger">*</span></label>
                          <input
                            type="number"
                            className="form-control"
                            name="totalSessions"
                            value={formData.totalSessions}
                            onChange={handleChange}
                            placeholder={t("totalSessionsPlaceholder") || "e.g. 12"}
                            min={1}
                          />
                        </div>
                      </Col>
                    </>
                  }
                </Row>

                <h5 className="text-white mb-3">{t("location") || "Location"}</h5>
                <div className="event-frm-bx mb-3">
                  <label className="form-label">{t("venueNameLabel") || "Venue Name"} <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="venueName"
                    value={formData.venueName}
                    onChange={handleChange}
                    placeholder={t("venueNamePlaceholder") || "e.g. Creative Space"}
                  />
                </div>

                <div className="event-frm-bx mb-3">
                  <label className="form-label">{t("addressLabel") || "Address"} <span className="text-danger">*</span></label>
                  <VenueAutocomplete
                    defaultValue={formData.venueAddress?.address}
                    onPlaceSelected={handleVenueSelected}
                    placeholder={t("searchVenueAddressPlaceholder") || "Search venue address"}
                  />
                </div>

                {/* Google Maps Selector Component */}
                <div className="mb-4">
                  <LocationMap />
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="text-white m-0">
                    {formData.enrollmentType === "Ongoing"
                      ? t("weeklySchedule") || "Weekly Schedule"
                      : t("batches") || "Batches"}
                  </h5>
                  <button type="button" onClick={openAddBatch} className="outline-btn" style={{ borderRadius: "20px", padding: "6px 16px" }}>
                    {formData.enrollmentType === "Ongoing"
                      ? t("addClassTime") || "+ Add Class Time"
                      : t("addBatch") || "+ Add Batch"}
                  </button>
                </div>

                {/* Schedule List */}
                <div className="mb-4">
                  {formData.batches && formData.batches.length > 0 ? (
                    formData.batches.map((batch, index) => (
                      <div key={index} className="p-3 mb-2 rounded d-flex justify-content-between align-items-center" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div>
                          <h6 className="text-white mb-1" style={{ color: "#23ada4" }}>
                            {batch.batchName}
                          </h6>
                          <p className="small text-secondary mb-0">
                            <strong>{t("timeLabel") || "Time"}:</strong> {batch.startTime} - {batch.endTime} <br />
                            <strong>{t("daysLabel") || "Days"}:</strong> {batch.days.join(", ")} <br />
                            <strong>{t("seatsPerSessionLabel") || "Seats per Session"}:</strong> {batch.seats}
                          </p>
                        </div>
                        <div>
                          <button type="button" onClick={() => openEditBatch(index)} className="btn p-0 border-0 bg-transparent">
                            <EditIcon />
                          </button>
                          <button type="button" onClick={() => removeBatch(index)} className="btn p-0 border-0 bg-transparent">
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted small">
                      {formData.enrollmentType === "Ongoing"
                        ? t("noClassTimesConfigured") || "No class times configured. Please add at least one weekly class schedule."
                        : t("noBatchesConfigured") || "No batches configured. Please add at least one batch."}
                    </p>
                  )}
                </div>

                {/* Batch / Schedule Modal Dialog Form */}
                {showBatchModal && (
                  <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1050 }}>
                    <div className="event-form-card" style={{ width: "95%", maxWidth: "500px", padding: "24px", background: "#1a1a1a", borderRadius: "16px", border: "1px solid rgba(35, 173, 164, 0.3)" }}>
                      <h4 className="text-white mb-3">
                        {editingBatchIndex !== null
                          ? (formData.enrollmentType === "Ongoing" ? t("editClassTime") || "Edit Class Time" : t("editBatch") || "Edit Batch")
                          : (formData.enrollmentType === "Ongoing" ? t("addClassTimeTitle") || "Add Class Time" : t("addBatchTitle") || "Add Batch")}
                      </h4>

                      {formData.enrollmentType !== "Ongoing" && (
                        <div className="event-frm-bx mb-3">
                          <label className="form-label">{t("batchNameLabel") || "Batch Name"} *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={batchForm.batchName}
                            onChange={(e) => setBatchForm(prev => ({ ...prev, batchName: e.target.value }))}
                            placeholder={t("batchNamePlaceholder") || "e.g. Morning Class"}
                          />
                        </div>
                      )}

                      <Row className="mb-3">
                        <Col xs={6}>
                          <div className="event-frm-bx">
                            <label className="form-label">{t("startTimeLabel") || "Start Time"} *</label>
                            <input
                              type="time"
                              className="form-control"
                              value={batchForm.startTime}
                              onChange={(e) => setBatchForm(prev => ({ ...prev, startTime: e.target.value }))}
                            />
                          </div>
                        </Col>
                        <Col xs={6}>
                          <div className="event-frm-bx">
                            <label className="form-label">{t("endTimeLabel") || "End Time"} *</label>
                            <input
                              type="time"
                              className="form-control"
                              value={batchForm.endTime}
                              onChange={(e) => setBatchForm(prev => ({ ...prev, endTime: e.target.value }))}
                            />
                          </div>
                        </Col>
                      </Row>

                      <div className="event-frm-bx mb-3">
                        <label className="form-label">{t("daysTitle") || "Days"} *</label>
                        <div className="d-flex flex-wrap gap-2">
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => {
                            const isSelected = batchForm.days.includes(day);
                            return (
                              <button
                                type="button"
                                key={day}
                                className={`btn btn-sm ${isSelected ? "btn-success" : "btn-outline-secondary"}`}
                                onClick={() => {
                                  setBatchForm(prev => {
                                    const newDays = prev.days.includes(day)
                                      ? prev.days.filter(d => d !== day)
                                      : [...prev.days, day];
                                    return { ...prev, days: newDays };
                                  });
                                }}
                                style={{ minWidth: "52px" }}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {formData.enrollmentType !== "Ongoing" && (
                        <div className="event-frm-bx mb-4">
                          <label className="form-label">{t("seatsTitle") || "Seats"} *</label>
                          <input
                            type="number"
                            className="form-control"
                            value={batchForm.seats}
                            onChange={(e) => setBatchForm(prev => ({ ...prev, seats: parseInt(e.target.value) || 0 }))}
                            min={1}
                          />
                        </div>
                      )}

                      <div className="d-flex gap-2 justify-content-end">
                        <button type="button" className="outline-btn" onClick={() => setShowBatchModal(false)}>{t("cancel") || "Cancel"}</button>
                        <button type="button" className="custom-btn" onClick={saveBatch}>{t("save") || "Save"}</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="d-flex gap-2 justify-content-end mt-4">
                  <button type="button" onClick={goBack} className="outline-btn">{t("back") || "Back"}</button>
                  <button type="button" onClick={goNext} className="custom-btn">{t("continue") || "Continue"}</button>
                </div>
              </div>
            )}

            {/* STEP 3: PRICING & CAPACITY */}
            {step === 3 && (
              <div>
                <Row className="mb-4">
                  <Col md={12} className="mb-3">
                    <div className="event-frm-bx">
                      <label className="form-label">
                        {formData.enrollmentType === "Ongoing" ? t("pricePerSession") || "Price per session" : t("price") || "Price"} <span className="text-danger">*</span>
                      </label>
                      <div className="price-input-wrapper position-relative">
                        <span className="price-symbol position-absolute" style={{ left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontWeight: '500', fontSize: "16px" }}>₮</span>
                        <input
                          type="number"
                          className="form-control"
                          style={{ paddingLeft: '35px', backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "16px", height: "48px", borderRadius: "10px" }}
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="0"
                          min={0}
                        />
                      </div>
                      {formData.enrollmentType === "Ongoing" && (
                        <p className="text-muted small mt-2 mb-0">{t("pricePerSessionDesc") || "Set the price for each session."}</p>
                      )}
                    </div>
                  </Col>

                  {formData.enrollmentType === "Ongoing" && (
                    <Col md={12} className="mb-3">
                      <label className="form-label text-secondary mb-2" style={{ fontSize: "12px", letterSpacing: "1px", fontWeight: "bold" }}>{t("accessPassesOptional") || "ACCESS PASSES (OPTIONAL)"}</label>
                      <p className="text-muted mb-3" style={{ fontSize: "12px", marginTop: "-5px" }}>{t("accessPassesDesc") || "Offer prepaid passes for regular students. You manage attendance at the door."}</p>

                      {/* 1 Month Pass */}
                      <div className="p-3 mb-3 rounded" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px" }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h5 className="text-white mb-0" style={{ fontSize: "16px", fontWeight: "600" }}>{t("oneMonthPass") || "1-month pass"}</h5>
                            <p className="text-muted mb-0" style={{ fontSize: "12px" }}>{t("oneMonthPassDesc") || "30-day access from purchase date"}</p>
                          </div>
                          <div className="form-check form-switch m-0">
                            <input
                              className="form-check-input ms-0"
                              type="checkbox"
                              id="oneMonthPassEnabled"
                              checked={formData.oneMonthPassEnabled}
                              onChange={(e) => {
                                setFormData(prev => {
                                  const updated = { ...prev, oneMonthPassEnabled: e.target.checked };
                                  localStorage.setItem("courseCreationData", JSON.stringify(updated));
                                  return updated;
                                });
                              }}
                              style={{ cursor: "pointer", width: "45px", height: "22px" }}
                            />
                          </div>
                        </div>

                        {formData.oneMonthPassEnabled && (
                          <div className="mt-3 p-3 rounded" style={{ background: "#181818", border: "1px solid rgba(255,255,255,0.03)" }}>
                            <label className="form-label mb-2" style={{ fontSize: "14px", color: "#23ada4", display: "flex", alignItems: "center", gap: "6px" }}>
                              <PassIcon />
                              {t("oneMonthPassPriceLabel") || "1-month pass price"}
                            </label>
                            <div className="price-input-wrapper position-relative">
                              <span className="price-symbol position-absolute" style={{ left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'white', fontWeight: '500', fontSize: "16px" }}>₮</span>
                              <input
                                type="number"
                                className="form-control"
                                style={{ paddingLeft: '35px', backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "16px", height: "48px", borderRadius: "10px" }}
                                name="oneMonthPassPrice"
                                value={formData.oneMonthPassPrice}
                                onChange={handleChange}
                                placeholder="0"
                                min={0}
                              />
                            </div>
                            <p className="small mt-2 mb-0" style={{ color: "#23ada4", fontSize: "12px" }}>
                              {t("oneMonthPassPriceDesc") || "Valid 30 days from purchase. QR scanned at door."}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 3 Month Pass */}
                      <div className="p-3 mb-3 rounded" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px" }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h5 className="text-white mb-0" style={{ fontSize: "16px", fontWeight: "600" }}>{t("threeMonthPass") || "3-month pass"}</h5>
                            <p className="text-muted mb-0" style={{ fontSize: "12px" }}>{t("threeMonthPassDesc") || "90-day access from purchase date"}</p>
                          </div>
                          <div className="form-check form-switch m-0">
                            <input
                              className="form-check-input ms-0"
                              type="checkbox"
                              id="threeMonthPassEnabled"
                              checked={formData.threeMonthPassEnabled}
                              onChange={(e) => {
                                setFormData(prev => {
                                  const updated = { ...prev, threeMonthPassEnabled: e.target.checked };
                                  localStorage.setItem("courseCreationData", JSON.stringify(updated));
                                  return updated;
                                });
                              }}
                              style={{ cursor: "pointer", width: "45px", height: "22px" }}
                            />
                          </div>
                        </div>

                        {formData.threeMonthPassEnabled && (
                          <div className="mt-3 p-3 rounded" style={{ background: "#181818", border: "1px solid rgba(255,255,255,0.03)" }}>
                            <label className="form-label mb-2" style={{ fontSize: "14px", color: "#23ada4", display: "flex", alignItems: "center", gap: "6px" }}>
                              <PassIcon />
                              {t("threeMonthPassPriceLabel") || "3-month pass price"}
                            </label>
                            <div className="price-input-wrapper position-relative">
                              <span className="price-symbol position-absolute" style={{ left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'white', fontWeight: '500', fontSize: "16px" }}>₮</span>
                              <input
                                type="number"
                                className="form-control"
                                style={{ paddingLeft: '35px', backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "16px", height: "48px", borderRadius: "10px" }}
                                name="threeMonthPassPrice"
                                value={formData.threeMonthPassPrice}
                                onChange={handleChange}
                                placeholder="0"
                                min={0}
                              />
                            </div>
                            <p className="small mt-2 mb-0" style={{ color: "#23ada4", fontSize: "12px" }}>
                              {formData.oneMonthPassPrice && formData.threeMonthPassPrice && (3 * Number(formData.oneMonthPassPrice) - Number(formData.threeMonthPassPrice) > 0) ? (
                                t("threeMonthPassSave", { amount: (3 * Number(formData.oneMonthPassPrice) - Number(formData.threeMonthPassPrice)).toLocaleString() })
                              ) : (
                                t("threeMonthPassPriceDesc") || "Valid 90 days from purchase. Save vs monthly pricing."
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </Col>
                  )}

                  {formData.enrollmentType === "Ongoing" && (
                    <>
                      <Col md={12} className="mb-3">
                        <div className="event-frm-bx">
                          <label className="form-label">{t("capacityPerSession") || "Capacity per Session"} <span className="text-danger">*</span></label>
                          <input
                            type="number"
                            className="form-control"
                            name="totalSeats"
                            value={formData.totalSeats}
                            onChange={(e) => {
                              handleChange(e);
                              // Sync capacity to all batches if any are already defined
                              if (formData.batches && formData.batches.length > 0) {
                                const updatedBatches = formData.batches.map(b => ({
                                  ...b,
                                  seats: parseInt(e.target.value) || 0
                                }));
                                setFormData(prev => ({ ...prev, batches: updatedBatches }));
                              }
                            }}
                            placeholder={t("capacityPerSessionPlaceholder") || "Maximum students per session"}
                            min={1}
                          />
                        </div>
                      </Col>

                      <Col md={12} className="mb-3">
                        <div className="event-frm-bx">
                          <label className="form-label">{t("bookingCutOff") || "Booking Cut-off"}</label>
                          <select
                            className="form-select"
                            name="bookingCutOff"
                            value={formData.bookingCutOff}
                            onChange={handleChange}
                            style={{
                              backgroundColor: "#1a1a1a",
                              color: "white",
                              border: "1px solid rgba(35, 173, 164, 0.3)",
                              height: "45px"
                            }}
                          >
                            <option value="">{t("selectCutOffTime") || "Select Cut-off Time"}</option>
                            {bookingCutOffOptions.map((opt) => (
                              <option key={opt.key} value={opt.key}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </Col>
                    </>
                  )}

                  <Col md={12} className="mb-3">
                    <div className="event-frm-bx">
                      <label className="form-label">{t("refundPolicyLabel")} <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        name="refundPolicy"
                        value={formData.refundPolicy}
                        onChange={handleChange}
                        style={{
                          backgroundColor: "#1a1a1a",
                          color: "white",
                          border: "1px solid rgba(35, 173, 164, 0.3)",
                          height: "45px"
                        }}
                      >
                        <option value="">{t("selectRefundPolicy") || "Select Refund Policy"}</option>
                        {refundPolicies.map((policy) => (
                          <option key={policy} value={policy}>
                            {policy}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Col>
                </Row>

                <div className="d-flex gap-2 justify-content-end mt-4">
                  <button type="button" onClick={goBack} className="outline-btn">{t("back") || "Back"}</button>
                  <button type="button" onClick={goNext} className="custom-btn">{t("continue") || "Continue"}</button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & PUBLISH */}
            {step === 4 && (
              <div className="text-white">
                <h4 className="mb-4 pb-2 border-bottom border-secondary" style={{ color: "#23ada4" }}>
                  {formData.enrollmentType === "Ongoing" ? t("reviewClassSummary") || "Review Class Summary" : t("reviewCourseSummary") || "Review Course Summary"}
                </h4>

                <Row className="mb-3">
                  <Col md={4} className="text-secondary font-weight-bold">
                    {formData.enrollmentType === "Ongoing" ? t("classTitleLabel") || "Class Title:" : t("courseTitleLabel") || "Course Title:"}
                  </Col>
                  <Col md={8}>{formData.courseTitle}</Col>
                </Row>

                <Row className="mb-3">
                  <Col md={4} className="text-secondary font-weight-bold">{t("categoryLabel") || "Category:"}</Col>
                  <Col md={8}>
                    {activeCategory
                      ? (language === "mn" && activeCategory.name_thi ? activeCategory.name_thi : activeCategory.name)
                      : "-"}
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={4} className="text-secondary font-weight-bold">{t("durationLabel") || "Duration:"}</Col>
                  <Col md={8}>
                    {formData.enrollmentType === "Ongoing"
                      ? (noEndDate ? t("startsOnIndefinite", { date: formData.startDate }) : t("durationFormat", { startDate: formData.startDate, endDate: formData.endDate }))
                      : t("fixedStartDurationFormat", { startDate: formData.startDate, endDate: formData.endDate, sessions: formData.totalSessions })}
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={4} className="text-secondary font-weight-bold">{t("venueLocationLabel") || "Venue Location:"}</Col>
                  <Col md={8}>{formData.venueName} - {formData.venueAddress?.address}</Col>
                </Row>

                <Row className="mb-3">
                  <Col md={4} className="text-secondary font-weight-bold">
                    {formData.enrollmentType === "Ongoing" ? t("priceRefundSessionLabel") || "Price & Refund (Session):" : t("priceRefundLabel") || "Price & Refund:"}
                  </Col>
                  <Col md={8}>
                    {formData.enrollmentType === "Ongoing"
                      ? `${t("pricePerSessionFormat", { price: formData.price })} (${formData.refundPolicy})`
                      : `₮${formData.price} (${formData.refundPolicy})`}
                  </Col>
                </Row>

                {formData.enrollmentType === "Ongoing" && formData.oneMonthPassEnabled && (
                  <Row className="mb-3">
                    <Col md={4} className="text-secondary font-weight-bold">{t("oneMonthPassPriceReview") || "1 Month Pass Price:"}</Col>
                    <Col md={8}>₮{formData.oneMonthPassPrice}</Col>
                  </Row>
                )}

                {formData.enrollmentType === "Ongoing" && formData.threeMonthPassEnabled && (
                  <Row className="mb-3">
                    <Col md={4} className="text-secondary font-weight-bold">{t("threeMonthPassPriceReview") || "3 Month Pass Price:"}</Col>
                    <Col md={8}>₮{formData.threeMonthPassPrice}</Col>
                  </Row>
                )}

                {formData.enrollmentType === "Ongoing" && (
                  <>
                    <Row className="mb-3">
                      <Col md={4} className="text-secondary font-weight-bold">{t("capacityPerSessionReview") || "Capacity per Session:"}</Col>
                      <Col md={8}>{formData.totalSeats} {t("studentsCount") || "students"}</Col>
                    </Row>
                    {formData.bookingCutOff && (
                      <Row className="mb-3">
                        <Col md={4} className="text-secondary font-weight-bold">{t("bookingCutOffReview") || "Booking Cut-off:"}</Col>
                        <Col md={8}>{formData.bookingCutOff}</Col>
                      </Row>
                    )}
                  </>
                )}

                <h5 className="text-white mb-2 mt-4" style={{ color: "#23ada4" }}>
                  {formData.enrollmentType === "Ongoing" ? t("weeklyClassTimesHeader") || "Weekly Class Times" : t("configuredBatchesHeader") || "Configured Batches"}
                </h5>
                <div className="mb-4">
                  {formData.batches && formData.batches.map((batch, index) => (
                    <div key={index} className="p-2 mb-2 rounded bg-dark border border-secondary" style={{ fontSize: "14px" }}>
                      <strong>{batch.batchName}</strong> • {batch.startTime} - {batch.endTime} • {t("daysLabel") || "Days"}: {batch.days.join(", ")} • {t("seatsLabel") || "Seats"}: {batch.seats}
                    </div>
                  ))}
                </div>

                <div className="d-flex gap-2 justify-content-end mt-5">
                  <button type="button" onClick={goBack} className="outline-btn">{t("back") || "Back"}</button>
                  <button type="button" onClick={handleSubmit} className="custom-btn" disabled={loading}>
                    {loading ? t("publishing") || "Publishing..." : (formData.enrollmentType === "Ongoing" ? t("publishClass") || "Publish Class" : t("publishCourse") || "Publish Course")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>
      <div style={{ height: 100 }}></div>
    </div>
  );
}

export default Page;
