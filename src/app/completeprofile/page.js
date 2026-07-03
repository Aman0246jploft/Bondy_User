"use client";
import React, { useState, useEffect, useRef } from "react";
import { Col, Container, Form, Row, Button } from "react-bootstrap";
import { useRouter } from "next/navigation";
import authApi from "@/api/authApi";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import VerificationModl from "@/components/Modal/VerificationModl";
import { Upload, Camera } from "lucide-react";
import { getFullImageUrl } from "@/utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";

export default function CompleteProfile() {
  return (
    <ProtectedRoute>
      <CompleteProfileContent />
    </ProtectedRoute>
  );
}

function CompleteProfileContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [categories, setCategories] = useState([]);
  const [modalShow, setModalShow] = useState(false);

  // Customer Profile State
  const [customerData, setCustomerData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    bio: "",
    profileImage: "",
    backgroundImage: "",
  });

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handleProfileFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImageFile(file);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
  };

  const handleBackgroundFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBackgroundImageFile(file);
    const localPreview = URL.createObjectURL(file);
    setBackgroundPreview(localPreview);
  };

  // Organizer Business details state
  const [organizerData, setOrganizerData] = useState({
    businessName: "",
    businessCategory: "",
    shortDesc: "",
    socialMediaLink: "",
  });

  useEffect(() => {
    document.title = "Complete Profile - Bondy";

    const fetchInitialData = async () => {
      try {
        // Fetch categories first for organizer dropdown
        const catRes = await authApi.getCategoryList();
        if (catRes?.status) {
          setCategories(catRes?.data?.categories || []);
        }

        // Fetch self profile to detect role and verification state
        const response = await authApi.getSelfProfile();
        if (response?.status) {
          const profile = response?.data?.user;
          // Check role: 2 is Organizer
          if (profile?.roleId === 2 || profile?.organizerVerificationStatus) {
            setIsOrganizer(true);
            const isVerified = profile?.isVerified ?? false;

            const hasBusinessDetails = (
              profile?.businessName ||
              profile?.businessCategory ||
              profile?.shortDesc ||
              profile?.socialMediaLink
            );

            if (!isVerified) {
              if (hasBusinessDetails) {
                // Already submitted details but still not verified -> Open verification modal directly
                setModalShow(true);
              } else {
                // Fields are null -> show details page
                setOrganizerData({
                  businessName: profile?.businessName || "",
                  businessCategory: profile?.businessCategory || "",
                  shortDesc: profile?.shortDesc || "",
                  socialMediaLink: profile?.socialMediaLink || "",
                });
              }
            } else {
              // Verified -> Redirect to homepage
              router.push("/");
            }
          } else {
            setIsOrganizer(false);

            // If customer already has profile data filled, skip this step
            if (profile?.firstName && profile?.lastName) {
              if (!profile?.categories || profile?.categories.length === 0) {
                return router.push("/insterest");
              } else {
                return router.push("/");
              }
            }

            setCustomerData({
              firstName: profile?.firstName || "",
              lastName: profile?.lastName || "",
              gender: profile?.gender || "",
              dob: profile?.dob ? profile.dob.split("T")[0] : "",
              bio: profile?.bio || "",
              profileImage: profile?.profileImage || "",
              backgroundImage: profile?.backgroundImage || "",
            });
            if (profile?.profileImage) {
              setPreview(getFullImageUrl(profile.profileImage));
            }
            if (profile?.backgroundImage) {
              setBackgroundPreview(getFullImageUrl(profile.backgroundImage));
            }
          }
        }
      } catch (error) {
        console.error("Failed to load profile data:", error);
      } finally {
        setIsChecking(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOrganizerChange = (e) => {
    const { name, value } = e.target;
    setOrganizerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!customerData.firstName || !customerData.lastName) {
      toast.error("Please enter your name");
      return;
    }
    if (!customerData.dob) {
      toast.error("Please enter your date of birth");
      return;
    }

    try {
      setLoading(true);
      let uploadedProfileImage = customerData.profileImage;
      let uploadedBackgroundImage = customerData.backgroundImage;

      // 1. Upload profile image if a new file was selected
      if (profileImageFile) {
        const formData = new FormData();
        formData.append("files", profileImageFile);
        const response = await authApi.uploadFile(formData);
        if (response?.status && response.data?.files?.length > 0) {
          uploadedProfileImage = response.data.files[0];
        }
      }

      // 2. Upload background/cover image if a new file was selected
      if (backgroundImageFile) {
        const formData = new FormData();
        formData.append("files", backgroundImageFile);
        const response = await authApi.uploadFile(formData);
        if (response?.status && response.data?.files?.length > 0) {
          uploadedBackgroundImage = response.data.files[0];
        }
      }

      const payload = {
        ...customerData,
        profileImage: uploadedProfileImage,
        backgroundImage: uploadedBackgroundImage,
      };

      const response = await authApi.updateProfile(payload);
      if (response?.status) {
        router.push("/insterest");
      }
    } catch (error) {
      console.error("Customer profile update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizerSubmit = async (e) => {
    e.preventDefault();
    if (!organizerData.businessName || !organizerData.businessCategory) {
      toast.error("Business Name and Primary Category are required");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        businessVerification: {
          businessName: organizerData.businessName,
          businessCategory: organizerData.businessCategory,
          shortDesc: organizerData.shortDesc,
          socialMediaLink: organizerData.socialMediaLink,
        },
      };

      const response = await authApi.submitVerification(payload);
      if (response?.status) {
        setModalShow(true);
      }
    } catch (error) {
      console.error("Organizer verification submission failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return null; // Don't flash the form while checking profile
  }

  if (isOrganizer) {
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
                    <div style={{ color: "white" }} className="text-center mb-4">
                      <img src="/img/business_store.svg" alt="business" style={{ width: "80px", marginBottom: "20px" }} onError={(e) => { e.target.src = "/img/Success.svg"; }} />
                      <h2 className="fz_32">Tell us about your organization</h2>
                      <p>Help us review your organizer account.</p>
                    </div>

                    <Form className="common_field" onSubmit={handleOrganizerSubmit}>
                      <Form.Group className="mb-3" controlId="businessName">
                        <Form.Label className="text-light">Organizer / Business name</Form.Label>
                        <Form.Control
                          type="text"
                          name="businessName"
                          placeholder="Enter business name"
                          className="custom_field_input"
                          value={organizerData.businessName}
                          onChange={handleOrganizerChange}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="businessCategory">
                        <Form.Label className="text-light">Primary category</Form.Label>
                        <Form.Select
                          name="businessCategory"
                          className="custom_field_input"
                          value={organizerData.businessCategory}
                          onChange={handleOrganizerChange}
                          required
                        >
                          <option value="" disabled>Select category</option>
                          {categories?.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="shortDesc">
                        <Form.Label className="text-light">Short description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="shortDesc"
                          placeholder="Tell us about your organization"
                          className="custom_field_input custom_bio"
                          value={organizerData.shortDesc}
                          onChange={handleOrganizerChange}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="socialMediaLink">
                        <Form.Label className="text-light">Instagram or Facebook link (optional)</Form.Label>
                        <Form.Control
                          type="text"
                          name="socialMediaLink"
                          placeholder="Paste social link"
                          className="custom_field_input"
                          value={organizerData.socialMediaLink}
                          onChange={handleOrganizerChange}
                        />
                      </Form.Group>

                      <Button
                        type="submit"
                        className="common_btn w-100 mt-4 border-0"
                        disabled={loading}
                      >
                        {loading ? "Submitting..." : "Submit for review"}
                      </Button>
                    </Form>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
        <VerificationModl
          show={modalShow}
          onHide={() => {
            setModalShow(false);
            localStorage.removeItem("token");
            router.push("/");
          }}
          onGoBack={() => {
            localStorage.removeItem("token");
          }}
          redirectPath="/"
        />
      </div>
    );
  }

  // Customer Profile layout (original fallback/default)
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

                  <Form className="common_field" onSubmit={handleCustomerSubmit}>
                    {/* Cover/Avatar Setup Box */}
                    <div className="profile-images-setup">
                      {/* Cover Banner Uploader */}
                      <div className="profile-cover-upload" onClick={() => coverInputRef.current.click()}>
                        {backgroundPreview ? (
                          <img src={backgroundPreview} alt="Cover Preview" className="cover-preview-img" onError={(e) => { e.target.src = "/img/sidebar-logo.svg"; }} />
                        ) : (
                          <div className="cover-placeholder">
                            <Upload size={20} className="mb-1 text-teal" />
                            <span>Add Cover Photo</span>
                          </div>
                        )}
                        <input
                          type="file"
                          ref={coverInputRef}
                          style={{ display: "none" }}
                          accept="image/*"
                          onChange={handleBackgroundFileChange}
                        />
                      </div>

                      {/* Profile Image Uploader */}
                      <div className="profile-avatar-upload" onClick={() => avatarInputRef.current.click()}>
                        <div className="avatar-preview-box">
                          <img
                            src={preview || "/img/default-user.png"}
                            alt="Avatar Preview"
                            onError={(e) => {
                              e.target.src = "/img/default-user.png";
                            }}
                          />
                          <div className="avatar-edit-icon">
                            <Camera size={12} />
                          </div>
                        </div>
                        <input
                          type="file"
                          ref={avatarInputRef}
                          style={{ display: "none" }}
                          accept="image/*"
                          onChange={handleProfileFileChange}
                        />
                      </div>
                    </div>
                    <Row className="gy-3">
                      <Col md={6}>
                        <Form.Group controlId="firstName">
                          <Form.Control
                            type="text"
                            name="firstName"
                            placeholder="First name"
                            className="custom_field_input"
                            value={customerData.firstName}
                            onChange={handleCustomerChange}
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
                            value={customerData.lastName}
                            onChange={handleCustomerChange}
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
                              value={customerData.gender}
                              onChange={handleCustomerChange}
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
                        <div className="select_gender">
                          <span>{t("dob") || "Date of birth"}</span>
                          <Form.Group controlId="dob">
                            <Form.Control
                              type="date"
                              name="dob"
                              className="custom_field_input custom_date_input"
                              value={customerData.dob}
                              onChange={handleCustomerChange}
                              max={new Date().toISOString().split("T")[0]}
                              required
                            />
                          </Form.Group>
                        </div>
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
      <style jsx>{`
        .profile-images-setup {
          position: relative;
          width: 100%;
          margin-bottom: 45px;
        }
        .profile-cover-upload {
          width: 100%;
          height: 140px;
          border-radius: 12px;
          background-color: #262626;
          border: 2px dashed rgba(255, 255, 255, 0.1);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }
        .profile-cover-upload:hover {
          border-color: #23ada4;
        }
        .cover-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cover-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #9ca3af;
          font-size: 13px;
        }
        .profile-avatar-upload {
          position: absolute;
          bottom: -25px;
          left: 20px;
          cursor: pointer;
          z-index: 10;
        }
        .avatar-preview-box {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid #161616;
          overflow: hidden;
          background-color: #374151;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }
        .avatar-preview-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-edit-icon {
          position: absolute;
          bottom: 0;
          right: 0;
          background-color: #23ada4;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          border: 1px solid #161616;
        }
        :global(.compplete_profile_sec .custom_date_input) {
          color: #fff !important;
          background-color: transparent !important;
          border: none !important;
          width: 140px !important;
          font-size: 14px !important;
          outline: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          height: auto !important;
        }
        :global(.compplete_profile_sec .custom_date_input::-webkit-calendar-picker-indicator) {
          filter: invert(1);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
