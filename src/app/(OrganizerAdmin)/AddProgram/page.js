"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import LocationMap from "../Components/LocationMap";
import apiClient from "../../../api/apiClient";
import courseApi from "../../../api/courseApi";
import { fetchCurrentLocation, formatLocationForApi } from "../../../utils/locationHelper";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getFullImageUrl } from "../../../utils/imageHelper";

function Page() {
  const inputRef = useRef(null);
  const router = useRouter();
  const [courseId, setCourseId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [formData, setFormData] = useState({
    courseTitle: "",
    courseCategory: "",
    totalSeats: "",
    price: "",
    shortdesc: "",
    whatYouWillLearn: "",
    isFeatured: false,
    // firstClassDate: "",
    posterImage: [], // Array of strings (URLs)
    galleryImages: [], // Array of strings (URLs)
    venueAddress: {
      latitude: 0,
      longitude: 0,
      city: "",
      country: "",
      address: "",
      state: "",
      zipcode: "",
    },
    enrollmentType: "Ongoing",
    schedules: [
      {
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
      },
    ],
  });

  // Get courseId from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('courseId');
      console.log("CourseId from URL:", id);
      setCourseId(id);
    }
  }, []);

  // Fetch Categories and Location on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Categories
        const catRes = await apiClient.get("/category/list?type=course&limit=100");
        if (catRes.data && catRes.data.categories) {
          setCategories(catRes.data.categories);
        }

        // If editing, fetch course details
        if (courseId) {
          console.log("Fetching course details for ID:", courseId);
          try {
            const courseRes = await courseApi.getCourseDetails(courseId);
            console.log("Course API Response:", courseRes);
            if (courseRes.data && courseRes.data) {
              console.log("Loading course for edit:", courseRes.data);
              loadCourseForEdit(courseRes.data);
            }
          } catch (error) {
            console.error("Error fetching course details", error);
            toast.error("Failed to load course details");
          }
        } else {
          // Fetch Location only for new courses
          try {
            const location = await fetchCurrentLocation();
            setFormData((prev) => ({
              ...prev,
              venueAddress: { ...prev.venueAddress, ...location },
            }));
          } catch (locErr) {
            console.warn("Could not fetch location automatically", locErr);
            toast.error("Could not fetch current location. Please enter address manually.");
          }
        }
      } catch (error) {
        console.error("Error fetching initial data", error);
        toast.error("Error loading page data");
      } finally {
        setInitialLoading(false);
      }
    };

    if (courseId !== null) {
      fetchData();
    } else if (courseId === null && typeof window !== 'undefined') {
      // Initially load without courseId
      fetchData();
    }
  }, [courseId]);

  // Load course data for editing
  const loadCourseForEdit = (course) => {
    console.log("loadCourseForEdit called with:", course);
    const transformedCourse = { ...course };

    // Transform GeoJSON venueAddress to flat structure
    if (course.venueAddress && course.venueAddress.type === "Point") {
      transformedCourse.venueAddress = {
        latitude: course.venueAddress.coordinates[1],
        longitude: course.venueAddress.coordinates[0],
        city: course.venueAddress.city || "",
        country: course.venueAddress.country || "",
        address: course.venueAddress.address || "",
        state: course.venueAddress.state || "",
        zipcode: course.venueAddress.zipcode || "",
      };
    }

    // Extract IDs from populated fields
    if (transformedCourse.courseCategory && typeof transformedCourse.courseCategory === 'object') {
      transformedCourse.courseCategory = transformedCourse.courseCategory._id;
    }
    if (transformedCourse.createdBy && typeof transformedCourse.createdBy === 'object') {
      transformedCourse.createdBy = transformedCourse.createdBy._id;
    }

    // Format dates for input fields (YYYY-MM-DD) and clean schedule objects
    if (transformedCourse.schedules && transformedCourse.schedules.length > 0) {
      transformedCourse.schedules = transformedCourse.schedules.map(sched => {
        // Only keep the fields we need for editing
        return {
          startDate: sched.startDate ? new Date(sched.startDate).toISOString().split('T')[0] : "",
          endDate: sched.endDate ? new Date(sched.endDate).toISOString().split('T')[0] : "",
          startTime: sched.startTime || "",
          endTime: sched.endTime || "",
          presentCount: sched.presentCount || 0,
        };
      });
    }

    // Remove computed/server-generated fields
    const fieldsToRemove = [
      '_id', 'createdAt', 'updatedAt', '__v',
      'currentSchedule', 'sessionStatus', 'isAvailable',
      'duration', 'acquiredSeats', 'leftSeats', 'isBooked',
      'totalRevenue', 'totalEnrollments'
    ];
    fieldsToRemove.forEach(field => delete transformedCourse[field]);

    console.log("Transformed course data:", transformedCourse);
    setFormData(transformedCourse);
    console.log("FormData updated");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleScheduleChange = (index, field, value) => {
    const updatedSchedules = [...formData.schedules];
    updatedSchedules[index][field] = value;
    setFormData((prev) => ({ ...prev, schedules: updatedSchedules }));
  };

  const handleAddressChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      venueAddress: { ...prev.venueAddress, address: value },
    }));
  };

  const handleEnrollmentTypeSelect = (type) => {
    setFormData((prev) => ({
      ...prev,
      enrollmentType: type,
      // If switching to fixedStart, ensure only 1 schedule is kept
      schedules: type === "fixedStart" ? [prev.schedules[0]] : prev.schedules,
    }));
  };

  const addScheduleSlot = () => {
    setFormData((prev) => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        { startDate: "", endDate: "", startTime: "", endTime: "" },
      ],
    }));
  };


  const removeScheduleSlot = (index) => {
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadData = new FormData();
    for (let i = 0; i < files.length; i++) {
      uploadData.append("files", files[i]);
    }

    try {
      setLoading(true);
      // Using /user/upload endpoint based on controllerUser.js
      const response = await apiClient.post("/user/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status && response.data && response.data.files) {
        setFormData(prev => ({
          ...prev,
          posterImage: [...prev.posterImage, ...response.data.files]
        }));
        toast.success("Image uploaded successfully");
      }
    } catch (error) {
      console.error("Upload error", error);
      toast.error("Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadData = new FormData();
    for (let i = 0; i < files.length; i++) {
      uploadData.append("files", files[i]);
    }

    try {
      setLoading(true);
      const response = await apiClient.post("/user/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status && response.data && response.data.files) {
        setFormData(prev => ({
          ...prev,
          galleryImages: [...prev.galleryImages, ...response.data.files]
        }));
        toast.success("Gallery images uploaded successfully");
      }
    } catch (error) {
      console.error("Upload error", error);
      toast.error("Failed to upload gallery images");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation 1: Required fields
    if (!formData.courseTitle || !formData.courseCategory || !formData.totalSeats || !formData.price) {
      toast.error("Please fill all required fields: Course Name, Category, Seats, and Price");
      return;
    }

    // Validation 2: Image upload
    if (formData.posterImage.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    // Validation 3: Price validation
    if (Number(formData.price) < 0) {
      toast.error("Price must be greater than or equal to 0");
      return;
    }

    // Validation 4: Total seats validation
    if (Number(formData.totalSeats) < 1) {
      toast.error("Total seats must be at least 1");
      return;
    }

    // Validation 5: Schedule validation
    if (!formData.schedules || formData.schedules.length === 0) {
      toast.error("Please add at least one schedule");
      return;
    }

    // Validation 6: Schedule date and time validation
    for (let i = 0; i < formData.schedules.length; i++) {
      const sched = formData.schedules[i];

      if (!sched.startDate || !sched.endDate || !sched.startTime || !sched.endTime) {
        toast.error(`Please fill all date and time fields for schedule ${i + 1}`);
        return;
      }

      // Check if start date is before end date
      if (new Date(sched.startDate) > new Date(sched.endDate)) {
        toast.error(`Schedule ${i + 1}: Start date must be before or equal to end date`);
        return;
      }

      // Check if start date is the same and start time is before end time
      if (sched.startDate === sched.endDate) {
        const [startH, startM] = sched.startTime.split(':').map(Number);
        const [endH, endM] = sched.endTime.split(':').map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        if (startMins >= endMins) {
          toast.error(`Schedule ${i + 1}: Start time must be before end time on the same day`);
          return;
        }
      }
    }

    // Validation 7: Enrollment type vs schedules count
    if (formData.enrollmentType === 'fixedStart' && formData.schedules.length !== 1) {
      toast.error("Fixed-start courses must have exactly one schedule");
      return;
    }

    setLoading(true);
    try {
      const isEditMode = !!courseId;

      // Construct payload
      let payload = {
        ...formData,
        totalSeats: Number(formData.totalSeats),
        price: Number(formData.price),
      };

      // Clean payload - extract IDs from populated fields if needed
      if (payload.courseCategory && typeof payload.courseCategory === 'object') {
        payload.courseCategory = payload.courseCategory._id;
      }

      // Remove server-generated and immutable fields
      const fieldsToRemove = ['_id', 'createdAt', 'updatedAt', '__v', 'createdBy', 'totalRevenue', 'totalEnrollments', 'leftSeats', 'duration'];
      fieldsToRemove.forEach(field => delete payload[field]);

      console.log("Submitting payload:", payload);

      if (isEditMode) {
        // Update existing course
        const res = await courseApi.updateCourse(courseId, payload);
        if (res.status) {
          toast.success("Course updated successfully!");
          router.push("/CoursesManagement");
        }
      } else {
        // Create new course
        const res = await apiClient.post("/course/create", payload);
        if (res.status) {
          toast.success("Course created successfully!");
          router.push("/CoursesManagement");
        }
      }
    } catch (error) {
      console.error("Course operation error", error);
      // toast.error is handled by interceptor usually, but safe to log
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="text-center p-5 text-white">Loading...</div>;
  }

  return (
    <div>
      <Row className="justify-content-center">
        <Col md={8}>
          <Form className="row" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="event-form-card">
              <Row>
                <Col md={12}>
                  <div className="event-frm-bx upload">
                    <div>
                      <h5>Upload Image</h5>
                      <p>Drag and drop or browse to upload an image or video</p>
                    </div>
                    <input type="file" id="upload" className="d-none" multiple onChange={handleImageUpload} />
                    <label htmlFor="upload">
                      {loading ? "Uploading..." : "Upload"}
                    </label>
                  </div>
                  {formData.posterImage.length > 0 && (
                    <div className="d-flex gap-2 mt-3 flex-wrap">
                      {formData.posterImage.map((imgUrl, index) => (
                        <div key={index} className="position-relative" style={{ width: '100px', height: '100px' }}>
                          <img
                            src={getFullImageUrl(imgUrl)}
                            alt={`Preview ${index}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center"
                            style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                            onClick={() => {
                              const newImages = formData.posterImage.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, posterImage: newImages }));
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Col>



                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Course Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="courseTitle"
                      value={formData.courseTitle}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Course Category <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      name="courseCategory"
                      value={formData.courseCategory}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Course Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="event-frm-bx">
                    <label className="form-label">Quantity Available <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      name="totalSeats"
                      value={formData.totalSeats}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </Col>
                <Col md={12}>
                  <div className="event-frm-bx">
                    <label className="form-label">Venue Address</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter address"
                      value={formData.venueAddress.address}
                      onChange={handleAddressChange}
                    />
                  </div>
                </Col>
                <Col md={12}>
                  <LocationMap />
                </Col>

                <Col md={12}>
                  <div className="event-frm-bx">
                    <label className="form-label">Short Description</label>
                    <textarea
                      className="form-control"
                      name="shortdesc"
                      rows="3"
                      value={formData.shortdesc}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </Col>

                <Col md={12}>
                  <div className="event-frm-bx">
                    <label className="form-label">What You Will Learn</label>
                    <textarea
                      className="form-control"
                      name="whatYouWillLearn"
                      rows="4"
                      value={formData.whatYouWillLearn}
                      onChange={handleChange}
                      placeholder="Describe what students will learn in this course..."
                    ></textarea>
                  </div>
                </Col>

                <Col md={12}>
                  <div className="event-frm-bx">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isFeatured"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      />
                      <label className="form-check-label text-white" htmlFor="isFeatured">
                        Mark as Featured Course
                      </label>
                    </div>
                  </div>
                </Col>

                <Col md={12}>
                  <div className="event-frm-bx upload">
                    <div>
                      <h5>Upload Gallery Images (Optional)</h5>
                      <p>Add additional images to showcase your course</p>
                    </div>
                    <input type="file" id="gallery-upload" className="d-none" multiple onChange={handleGalleryUpload} />
                    <label htmlFor="gallery-upload">
                      {loading ? "Uploading..." : "Upload Gallery"}
                    </label>
                  </div>
                  {formData.galleryImages.length > 0 && (
                    <div className="d-flex gap-2 mt-3 flex-wrap">
                      {formData.galleryImages.map((imgUrl, index) => (
                        <div key={index} className="position-relative" style={{ width: '100px', height: '100px' }}>
                          <img
                            src={getFullImageUrl(imgUrl)}
                            alt={`Gallery ${index}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center"
                            style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                            onClick={() => {
                              const newImages = formData.galleryImages.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, galleryImages: newImages }));
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Col>

              </Row>
            </div>

            <div className="event-form-card">


              {/* Enrollment Type Toggle */}
              <Col md={12} className="mb-4">
                <div className="p-3 rounded" style={{ backgroundColor: "#2a2a2a" }}>
                  <div
                    className={`d-flex align-items-center p-3 mb-2 rounded cursor-pointer`}
                    style={{
                      backgroundColor: formData.enrollmentType === 'Ongoing' ? '#333' : 'transparent',
                      cursor: 'pointer',
                      border: formData.enrollmentType === 'Ongoing' ? '1px solid #00d084' : '1px solid #444'
                    }}
                    onClick={() => handleEnrollmentTypeSelect('Ongoing')}
                  >
                    <div className="me-3">
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: formData.enrollmentType === 'Ongoing' ? '#00d084' : 'transparent',
                        border: formData.enrollmentType === 'Ongoing' ? 'none' : '2px solid #666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {formData.enrollmentType === 'Ongoing' && <span style={{ color: 'white', fontWeight: 'bold' }}>✓</span>}
                      </div>
                    </div>
                    <div>
                      <h6 className="mb-0 text-white">Ongoing Course / Program</h6>
                      <small className="text-secondary">Students can join anytime</small>
                    </div>
                  </div>

                  <div
                    className="d-flex align-items-center p-3 rounded cursor-pointer"
                    style={{
                      backgroundColor: formData.enrollmentType === 'fixedStart' ? '#333' : 'transparent',
                      cursor: 'pointer',
                      border: formData.enrollmentType === 'fixedStart' ? '1px solid #00d084' : '1px solid #444'
                    }}
                    onClick={() => handleEnrollmentTypeSelect('fixedStart')}
                  >
                    <div className="me-3">
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: formData.enrollmentType === 'fixedStart' ? '#00d084' : 'transparent',
                        border: formData.enrollmentType === 'fixedStart' ? 'none' : '2px solid #666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {formData.enrollmentType === 'fixedStart' && <span style={{ color: 'white', fontWeight: 'bold' }}>✓</span>}
                      </div>
                    </div>
                    <div className="d-flex flex-column">
                      <span className="text-white fw-bold">Fixed-start course</span>
                      <span className="text-secondary small">All students start and finish together</span>
                    </div>
                  </div>
                </div>
              </Col>



              {formData.schedules.map((schedule, index) => (
                <div key={index} className="mb-4 border-bottom pb-3">
                  <Row>
                    <Col md={6}>
                      <div className="event-frm-bx">
                        <label className="form-label">Start Date</label>
                        <div className="date-input-wrapper">
                          <input
                            type="date"
                            className="date-input form-control"
                            value={schedule.startDate}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={(e) => handleScheduleChange(index, 'startDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="event-frm-bx">
                        <label className="form-label">End Date</label>
                        <div className="date-input-wrapper">
                          <input
                            type="date"
                            className="date-input form-control"
                            value={schedule.endDate}
                            min={schedule.startDate || new Date().toISOString().split("T")[0]}
                            onChange={(e) => handleScheduleChange(index, 'endDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="event-frm-bx">
                        <label className="form-label">Start Time</label>
                        <div className="date-input-wrapper">
                          <input
                            type="time"
                            className="date-input form-control"
                            value={schedule.startTime}
                            onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                          />
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="event-frm-bx">
                        <label className="form-label">End Time</label>
                        <div className="date-input-wrapper">
                          <input
                            type="time"
                            className="date-input form-control"
                            value={schedule.endTime}
                            onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                          />
                        </div>
                      </div>
                    </Col>
                  </Row>
                  {formData.enrollmentType === 'Ongoing' && (
                    <div className="d-flex justify-content-end">
                      {index > 0 && (
                        <Button variant="danger" size="sm" onClick={() => removeScheduleSlot(index)}>
                          Remove Slot
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {formData.enrollmentType === 'Ongoing' && (
                <Col md={12}>
                  <div className="event-frm-bx">
                    <Button type="button" className="add-slot" onClick={addScheduleSlot}>
                      + Add another time slot
                    </Button>
                  </div>
                </Col>
              )}

              <Row>
                <Col md={6}>
                  <div className="event-frm-bx ">
                    <label className="form-label">Session Price <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className="form-control text-white"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </Col>
              </Row>
              <div className="d-flex gap-2 justify-content-center mt-2">
                <button className="custom-btn" type="submit" disabled={loading}>
                  {loading ? (courseId ? "Updating..." : "Creating...") : (courseId ? "Update Course" : "Create Course")}
                </button>
              </div>
            </div>
          </Form>
        </Col>
      </Row>
      <div style={{ height: 100 }}></div>
    </div>
  );
}

export default Page;
