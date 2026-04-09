"use client";

import React, { useState, useEffect, useRef } from "react";
import { Col, Form, Row, Button } from "react-bootstrap";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumber } from "react-phone-number-input";
import authApi from "@/api/authApi";
import toast from "react-hot-toast";
import { getFullImageUrl } from "@/utils/imageHelper";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLanguage } from "@/context/LanguageContext";
import { Country, State, City } from "country-state-city";
import { getCoordinatesFromAddress } from "@/utils/locationHelper";

function PersonalInfoContent() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    state: "",
    stateCode: "",
    city: "",
    country: "",
    countryCode: "",
    dob: "",
    contactNumber: "",
    zipcode: "",
    profileImage: "",
    latitude: 0,
    longitude: 0,
  });

  const [countries] = useState(Country.getAllCountries());
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authApi.getSelfProfile();
        if (response.status) {
          const profile = response.data.user;
          const location = profile.location || {};

          let countryCode = profile.countryCode || "";
          let stateCode = "";
          let initialStates = [];
          let initialCities = [];

          // Find Country Code and Load States
          if (location.country) {
            const countryObj = countries.find(c => c.name === location.country);
            if (countryObj) {
              countryCode = countryObj.isoCode;
              initialStates = State.getStatesOfCountry(countryCode);
              setStates(initialStates);

              // Find State Code and Load Cities
              if (location.state) {
                const stateObj = initialStates.find(s => s.name === location.state);
                if (stateObj) {
                  stateCode = stateObj.isoCode;
                  initialCities = City.getCitiesOfState(countryCode, stateCode);
                  setCities(initialCities);
                }
              }
            }
          }

          setProfileData({
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            email: profile.email || "",
            state: location.state || "",
            stateCode: stateCode,
            city: location.city || "",
            country: location.country || "",
            countryCode: countryCode,
            dob: profile.dob ? profile.dob.split("T")[0] : "",
            contactNumber: profile.contactNumber
              ? profile.countryCode
                ? `${profile.countryCode}${profile.contactNumber}`
                : profile.contactNumber
              : "",
            zipcode: location.zipcode || "",
            profileImage: profile.profileImage || "",
            latitude: location.coordinates?.[1] || 0,
            longitude: location.coordinates?.[0] || 0,
            address: location.address || "",
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

  const handleCountryChange = (e) => {
    const countryName = e.target.value;
    const countryObj = countries.find((c) => c.name === countryName);
    const countryCode = countryObj ? countryObj.isoCode : "";

    setProfileData((prev) => ({
      ...prev,
      country: countryName,
      countryCode: countryCode,
      state: "",
      stateCode: "",
      city: "",
    }));

    if (countryCode) {
      setStates(State.getStatesOfCountry(countryCode));
    } else {
      setStates([]);
    }
    setCities([]);
  };

  const handleStateChange = (e) => {
    const stateName = e.target.value;
    const stateObj = states.find((s) => s.name === stateName);
    const stateCode = stateObj ? stateObj.isoCode : "";

    setProfileData((prev) => ({
      ...prev,
      state: stateName,
      stateCode: stateCode,
      city: "",
    }));

    if (stateCode) {
      setCities(City.getCitiesOfState(profileData.countryCode, stateCode));
    } else {
      setCities([]);
    }
  };

  const handleCityChange = async (e) => {
    const cityName = e.target.value;
    setProfileData((prev) => ({ ...prev, city: cityName }));

    // Fetch coordinates for the selected city
    if (cityName && profileData.state && profileData.country) {
      try {
        const fullAddress = `${cityName}, ${profileData.state}, ${profileData.country}`;
        const coords = await getCoordinatesFromAddress(fullAddress);
        setProfileData((prev) => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }));
      } catch (error) {
        console.error("Failed to fetch coordinates:", error);
      }
    }
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
        toast.success(t("imageUploadSuccess") || "Image uploaded successfully");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(t("imageUploadFailed") || "Image upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!profileData.firstName) newErrors.firstName = t("firstNameRequired") || "First name is required";
    if (!profileData.lastName) newErrors.lastName = t("lastNameRequired") || "Last name is required";
    if (!profileData.country) newErrors.country = t("countryRequired") || "Country is required";
    if (!profileData.state) newErrors.state = t("stateRequired") || "State is required";
    if (!profileData.city) newErrors.city = t("cityRequired") || "City is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(t("pleaseFixErrors") || "Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);
      // Parse phone number
      let finalCountryCode = profileData.countryCode;
      let finalContactNumber = profileData.contactNumber;

      if (profileData.contactNumber) {
        try {
          const parsed = parsePhoneNumber(profileData.contactNumber);
          if (parsed) {
            finalCountryCode = `+${parsed.countryCallingCode}`;
            finalContactNumber = parsed.nationalNumber;
          }
        } catch (phoneErr) {
          console.warn("Phone parsing failed, using raw value", phoneErr);
        }
      }

      // Construct location object to match backend requirement exactly
      const updatePayload = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        dob: profileData.dob,
        contactNumber: finalContactNumber,
        countryCode: finalCountryCode,
        profileImage: profileData.profileImage,
        location: {
          latitude: Number(profileData.latitude) || 0,
          longitude: Number(profileData.longitude) || 0,
          city: profileData.city,
          country: profileData.country,
          address: `${profileData.city}, ${profileData.state}`,
          state: profileData.state,
          zipcode: profileData.zipcode,
        },
      };

      const response = await authApi.updateProfile(updatePayload);
      if (response.status) {
        toast.success(t("profileUpdateSuccess") || "Profile updated successfully");
        setErrors({});
      }
    } catch (error) {
      console.error("Update failed:", error);
      toast.error(error.message || t("profileUpdateFailed") || "Failed to update profile");
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
                onClick={() => fileRef.current.click()}
              >
                <img
                  src={preview || "/img/sidebar-logo.svg"}
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
                <h4>{t("heyUser")}, {profileData.firstName || "User"}!</h4>
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
                <span>{t("EditProfile") || t("Edit")}</span>
              </button>
            </div>
          </div>
          <Row>
            {/* Row 1: Names */}
            <Col md={6}>
              <div className="form-floating custom-floting">
                <input
                  type="text"
                  className="form-control"
                  id="firstName"
                  placeholder={t("firstName")}
                  value={profileData.firstName}
                  onChange={handleChange}
                />
                <label htmlFor="firstName">{t("firstName")}</label>
                <span className="form-icon">
                  <img src="/img/form-user.svg" alt="" />
                </span>
                {errors.firstName && (
                  <small className="text-danger ps-2">{errors.firstName}</small>
                )}
              </div>
            </Col>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <input
                  type="text"
                  className="form-control"
                  id="lastName"
                  placeholder={t("lastName")}
                  value={profileData.lastName}
                  onChange={handleChange}
                />
                <label htmlFor="lastName">{t("lastName")}</label>
                <span className="form-icon">
                  <img src="/img/form-user.svg" alt="" />
                </span>
                {errors.lastName && <small className="text-danger ps-2">{errors.lastName}</small>}
              </div>
            </Col>

            {/* Row 2: Email and DOB */}
            <Col md={6}>
              <div className="form-floating custom-floting">
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  placeholder={t("email")}
                  value={profileData.email}
                  disabled
                />
                <label htmlFor="email">{t("email")}</label>
                <span className="form-icon">
                  <img src="/img/form-email.svg" alt="" />
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
                <label htmlFor="dob">{t("dob")}</label>
                <span className="form-icon">
                  <img src="/img/form-calendar.svg" alt="" />
                </span>
              </div>
            </Col>

            {/* Row 3: Country and State */}
            <Col md={6}>
              <div className="form-floating custom-floting">
                <select
                  className="form-select"
                  id="country"
                  value={profileData.country}
                  onChange={handleCountryChange}
                >
                  <option value="">{t("selectCountry") || "Select Country"}</option>
                  {countries.map((c) => (
                    <option key={c.isoCode} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="country">{t("country")}</label>
                <span className="form-icon">
                  <img src="/img/form-globe.svg" alt="" />
                </span>
                {errors.country && <small className="text-danger ps-2">{errors.country}</small>}
              </div>
            </Col>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <select
                  className="form-select"
                  id="state"
                  value={profileData.state}
                  onChange={handleStateChange}
                  disabled={!profileData.country}
                >
                  <option value="">{t("selectState") || "Select State"}</option>
                  {states.map((s) => (
                    <option key={s.isoCode} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="state">{t("state")}</label>
                <span className="form-icon">
                  <img src="/img/form-globe.svg" alt="" />
                </span>
                {errors.state && <small className="text-danger ps-2">{errors.state}</small>}
              </div>
            </Col>

            {/* Row 4: City and Zipcode */}
            <Col md={6}>
              <div className="form-floating custom-floting">
                <select
                  className="form-select"
                  id="city"
                  value={profileData.city}
                  onChange={handleCityChange}
                  disabled={!profileData.state}
                >
                  <option value="">{t("selectCity") || "Select City"}</option>
                  {cities.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="city">{t("city")}</label>
                <span className="form-icon">
                  <img src="/img/form-mark.svg" alt="" />
                </span>
                {errors.city && <small className="text-danger ps-2">{errors.city}</small>}
              </div>
            </Col>
            {/* <Col md={6}>
              <div className="form-floating custom-floting">
                <input
                  type="text"
                  className="form-control"
                  id="zipcode"
                  placeholder="Zip code"
                  value={profileData.zipcode}
                  onChange={handleChange}
                />
                <label htmlFor="zipcode">{t("zipcode") || "Zip code"}</label>
                <span className="form-icon">
                  <img src="/img/form-has.svg" alt="" />
                </span>
              </div>
            </Col> */}

            {/* Row 5: Contact Number */}
            <Col md={6}>
              <div className={`phone_input_wrapper custom-floting ${profileData.contactNumber ? 'has-value' : ''}`}>
                <PhoneInput
                  country={"us"}
                  value={profileData.contactNumber}
                  onChange={(phone) => handlePhoneChange("+" + phone)}
                  inputClass="form-control"
                  containerClass="phone_input"
                  dropdownClass="phone_input_dropdown"
                  buttonClass="phone_input_button"
                />
                <label className="phone-field-label">{t("contactNumber") || "Contact Number"}</label>
              </div>
            </Col>

            <Col md={12}>
              <div className="d-flex gap-2 justify-content-end mt-2">
                <button
                  className="outline-btn"
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  {t("discard")}
                </button>
                <button className="custom-btn" type="submit" disabled={loading}>
                  {loading ? t("saving") || "Saving..." : t("saveChanges") || "Save Changes"}
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
