"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import LocationMap from "../Components/LocationMap";
import apiClient from "../../../api/apiClient";
import { fetchCurrentLocation, formatLocationForApi } from "../../../utils/locationHelper";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getFullImageUrl } from "../../../utils/imageHelper";

function Page() {
  const inputRef = useRef(null);
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [formData, setFormData] = useState({
    courseTitle: "",
    courseCategory: "",
    totalSeats: "",
    price: "",
    shortdesc: "",
    // firstClassDate: "",
    posterImage: [], // Array of strings (URLs)
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

  // Fetch Categories and Location on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Categories
        const catRes = await apiClient.get("/category/list?type=course&limit=100");
        if (catRes.data && catRes.data.categories) {
          setCategories(catRes.data.categories);
        }

        // Fetch Location
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
      } catch (error) {
        console.error("Error fetching initial data", error);
        toast.error("Error loading page data");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const handleSubmit = async () => {
    if (!formData.courseTitle || !formData.courseCategory || !formData.totalSeats || !formData.price || formData.posterImage.length === 0) {
      toast.error("Please fill all required fields and upload an image.");
      return;
    }

    setLoading(true);
    try {
      // Construct payload
      const payload = {
        ...formData,
        totalSeats: Number(formData.totalSeats),
        price: Number(formData.price),
      };

      const res = await apiClient.post("/course/create", payload);
      if (res.status) {
        toast.success("Course created successfully!");
        // router.push("/programs-list"); // Redirect to list page        
        router.push("/AddProgram"); // Redirect to list page        

      }
    } catch (error) {
      console.error("Create course error", error);
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
                  {loading ? "Creating..." : "Create Course"}
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
