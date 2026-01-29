"use client";
import React, { useState, useRef, useEffect } from "react";
import { Col, Container, Form, Row, Button } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useRouter } from "next/navigation";
import authApi from "@/api/authApi";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getFullImageUrl } from "@/utils/imageHelper";

export default function CompleteProfile() {
  return (
    <ProtectedRoute>
      <CompleteProfileContent />
    </ProtectedRoute>
  );
}

function CompleteProfileContent() {
  const router = useRouter();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dob: null,
    bio: "",
    profileImage: "",
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authApi.getSelfProfile();
        if (response.status) {
          const profile = response.data.profile;
          setProfileData({
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            gender: profile.gender || "",
            dob: profile.dob ? new Date(profile.dob) : null,
            bio: profile.bio || "",
            profileImage: profile.profileImage || "",
            location: profile.location || null,
          });
          if (profile.profileImage) {
            setPreview(getFullImageUrl(profile.profileImage));
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    const formData = new FormData();
    formData.append("files", file);

    try {
      setLoading(true);
      const response = await authApi.uploadFile(formData);
      if (response.status) {
        // Response format: { data: { files: ["path/to/img"] } }
        const filePath = response.data.files[0];
        setProfileData((prev) => ({ ...prev, profileImage: filePath }));
        setPreview(getFullImageUrl(filePath));
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Image upload failed");
    } finally {
      setLoading(false);
    }
  };

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setProfileData((prev) => ({ ...prev, dob: date }));
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!profileData.firstName || !profileData.lastName) {
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.updateProfile({
        ...profileData,
        location: profileData.location // Preserve existing location object
      });
      if (response.status) {
        router.push("/insterest");
      }
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login_sec compplete_profile_sec">
      <Container fluid>
        <Row className="justify-content-between align-items-center gy-4">
          <Col xl={5} lg={7}>
            <div className="login_img">
              <img src="/img/login_side_img.png" alt="login side" />
              <div className="content_img_box">
                <h4>Explore Events Effortlessly</h4>
                <p>
                  Discover, book, and track events seamlessly with calendar
                  integration and personalized event curation
                </p>
              </div>
            </div>
          </Col>
          <Col xl={6} lg={5}>
            <Row className="justify-content-center align-items-center">
              <Col xl={7} lg={9} md={12}>
                <div className="profile_setup_container">
                  <div className="fz_32">
                    <h2 className="">Complete Profile</h2>
                    <p>
                      Complete your personal details to get started. This helps
                      us personalize your experience
                    </p>
                  </div>
                  <div
                    className="photo_upload_sec"
                    style={{ cursor: "pointer" }}
                    onClick={() => fileRef.current.click()}>
                    <div className="photo_circle">
                      {preview ? (
                        <img
                          src={preview}
                          alt="Preview"
                          className="preview-img"
                          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        <img
                          src="/img/icon-park-outline_add-picture.svg"
                          alt="Add"
                          style={{ width: "30px", opacity: 0.7 }}
                        />
                      )}
                    </div>

                    <span className="add_photo_text">
                      {preview ? "Change Photo" : "Add Photo"}
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      ref={fileRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                  </div>

                  <Form className="common_field" onSubmit={handleContinue}>
                    <Row className="gy-3">
                      <Col md={6}>
                        <Form.Group controlId="firstName">
                          <Form.Control
                            type="text"
                            name="firstName"
                            placeholder="First name"
                            className="custom_field_input"
                            value={profileData.firstName}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="lastName">
                          <Form.Control
                            type="text"
                            name="lastName"
                            placeholder="Last name"
                            className="custom_field_input"
                            value={profileData.lastName}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mt-3">
                      <Col xs={12}>
                        <div className="select_gender">
                          <span>Gender</span>
                          <Form.Group controlId="gender">
                            <Form.Select
                              name="gender"
                              className="custom_field_input custom_select"
                              value={profileData.gender}
                              onChange={handleChange}
                            >
                              <option value="" disabled>
                                Gender
                              </option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </Form.Select>
                          </Form.Group>
                        </div>
                      </Col>
                    </Row>
                    <Row className="mt-3">
                      <Col xs={12}>
                        <Form.Group controlId="dob">
                          <DatePicker
                            selected={profileData.dob}
                            onChange={handleDateChange}
                            placeholderText="Date of Birth"
                            className="form-control w-100"
                            dateFormat="dd/MM/yyyy"
                            maxDate={new Date()}
                            showYearDropdown
                            showMonthDropdown
                            dropdownMode="select"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mt-3">
                      <Col xs={12}>
                        <Form.Group controlId="bio">
                          <Form.Control
                            as="textarea"
                            rows={4}
                            name="bio"
                            placeholder="Bio"
                            className="custom_field_input custom_bio"
                            value={profileData.bio}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Button
                      type="submit"
                      className="common_btn w-100 mt-4 border-0"
                      disabled={loading}
                    >
                      {loading ? "Updating..." : "Continue"}
                    </Button>
                  </Form>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
