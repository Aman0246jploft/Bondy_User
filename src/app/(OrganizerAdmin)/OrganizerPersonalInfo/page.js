"use client";

import React, { useState, useEffect, useRef } from "react";
import { Col, Form, Row, Button } from "react-bootstrap";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import authApi from "@/api/authApi";
import toast from "react-hot-toast";
import { getFullImageUrl } from "@/utils/imageHelper";
import ProtectedRoute from "@/components/ProtectedRoute";

function PersonalInfoContent() {
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    state: "",
    city: "",
    country: "",
    dob: "",
    contactNumber: "",
    zipcode: "",
    profileImage: "",
    latitude: 0,
    longitude: 0,
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authApi.getSelfProfile();
        if (response.status) {
          const profile = response.data.profile;
          console.log("Profile Data:", profile);
          setProfileData({
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            email: profile.email || "",
            state: profile.location?.state || "",
            city: profile.location?.city || "",
            country: profile.location?.country || "",
            dob: profile.dob ? profile.dob.split("T")[0] : "",
            contactNumber: profile.contactNumber || "",
            zipcode: profile.location?.zipcode || "",
            profileImage: profile.profileImage || "",
            latitude: profile.location?.coordinates?.[1] || 0,
            longitude: profile.location?.coordinates?.[0] || 0,
            address: profile.location?.address || "",
          });
          setPreview(getFullImageUrl(profile.profileImage));
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setProfileData((prev) => ({ ...prev, [id]: value }));
  };

  const handlePhoneChange = (value) => {
    setProfileData((prev) => ({ ...prev, contactNumber: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    const formData = new FormData();
    formData.append("files", file);

    try {
      setLoading(true);
      const response = await authApi.uploadFile(formData);
      if (response.status) {
        const filePath = response.data.files[0];
        setProfileData((prev) => ({ ...prev, profileImage: filePath }));
        setPreview(getFullImageUrl(filePath));
        toast.success("Image uploaded successfully");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Image upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Construct location object to match backend requirement exactly
      const updatePayload = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        dob: profileData.dob,
        contactNumber: profileData.contactNumber,
        profileImage: profileData.profileImage,
        location: {
          latitude: Number(profileData.latitude) || 0,
          longitude: Number(profileData.longitude) || 0,
          city: profileData.city,
          country: profileData.country,
          address: profileData.state,
          state: profileData.state,
          zipcode: profileData.zipcode,
        },
      };

      const response = await authApi.updateProfile(updatePayload);
      if (response.status) {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Update failed:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="cards">
        <Form onSubmit={handleSave}>
          <div className="personal-profile">
            <div className="personal-profile-lft">
              <div
                className="personal-profile-img"
                style={{ cursor: "pointer" }}
                onClick={() => fileRef.current.click()}
              >
                <img
                  style={{
                    width: "95px",
                    height: "95px",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                  src={preview || "/img/avtar.png"}
                  alt="Profile"
                />
                <input
                  type="file"
                  hidden
                  ref={fileRef}
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </div>
              <div className="personal-profile-info">
                <h4>Hey {profileData.firstName || "User"}!</h4>
                <p>{profileData.email}</p>
              </div>
            </div>
            <div className="personal-profile-rgt">
              <button
                className="edit-profile-btn"
                type="button"
                onClick={() => fileRef.current.click()}
              >
                <img src="/img/edit-icon.svg" alt="Edit" />
                <span>Edit</span>
              </button>
            </div>
          </div>
          <Row>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <input
                  type="text"
                  className="form-control"
                  id="firstName"
                  placeholder="First Name"
                  value={profileData.firstName}
                  onChange={handleChange}
                />
                <label htmlFor="firstName">First Name</label>
                <span className="form-icon">
                  <img src="/img/form-user.svg" alt="" />
                </span>
              </div>
            </Col>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <input
                  type="text"
                  className="form-control"
                  id="lastName"
                  placeholder="Last Name"
                  value={profileData.lastName}
                  onChange={handleChange}
                />
                <label htmlFor="lastName">Last Name</label>
                <span className="form-icon">
                  <img src="/img/form-user.svg" alt="" />
                </span>
              </div>
            </Col>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  placeholder="Email"
                  value={profileData.email}
                  disabled
                />
                <label htmlFor="email">Email</label>
                <span className="form-icon">
                  <img src="/img/form-email.svg" alt="" />
                </span>
              </div>
            </Col>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <select
                  className="form-select"
                  id="state"
                  aria-label="State"
                  value={profileData.state}
                  onChange={handleChange}
                >
                  <option value="" disabled hidden></option>
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                </select>
                <label htmlFor="state">State</label>
                <span className="form-icon">
                  <img src="/img/form-globe.svg" alt="" />
                </span>
              </div>
            </Col>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <input
                  type="text"
                  className="form-control"
                  id="country"
                  placeholder="Country"
                  value={profileData.country}
                  onChange={handleChange}
                />
                <label htmlFor="country">Country</label>
                <span className="form-icon">
                  <img src="/img/form-globe.svg" alt="" />
                </span>
              </div>
            </Col>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <input
                  type="text"
                  className="form-control"
                  id="city"
                  placeholder="City"
                  value={profileData.city}
                  onChange={handleChange}
                />
                <label htmlFor="city">City</label>
                <span className="form-icon">
                  <img src="/img/form-mark.svg" alt="" />
                </span>
              </div>
            </Col>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <input
                  type="date"
                  className="form-control"
                  id="dob"
                  value={profileData.dob}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                />
                <label htmlFor="dob">Date of birth</label>
                <span className="form-icon">
                  <img src="/img/form-calendar.svg" alt="" />
                </span>
              </div>
            </Col>
            <Col md={6}>
              <div className="custom-tel-input custom-floting">
                <PhoneInput
                  defaultCountry="US"
                  international
                  countryCallingCodeEditable={false}
                  value={profileData.contactNumber}
                  onChange={handlePhoneChange}
                />
              </div>
            </Col>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <input
                  type="text"
                  className="form-control"
                  id="zipcode"
                  placeholder="Zip code"
                  value={profileData.zipcode}
                  onChange={handleChange}
                />
                <label htmlFor="zipcode">Zip code</label>
                <span className="form-icon">
                  <img src="/img/form-has.svg" alt="" />
                </span>
              </div>
            </Col>
            <Col md={12}>
              <div className="d-flex gap-2 justify-content-end mt-2">
                <button
                  className="outline-btn"
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  Discard
                </button>
                <button className="custom-btn" type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}

export default function PersonalInfoPage() {
  return (
    <ProtectedRoute>
      <PersonalInfoContent />
    </ProtectedRoute>
  );
}
