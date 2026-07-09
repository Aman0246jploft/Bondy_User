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
import InterestSelector from "@/components/InterestSelector";

function PersonalInfoContent() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [backupProfileData, setBackupProfileData] = useState(null);

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
    backgroundImage: "",
    latitude: 0,
    longitude: 0,
    address: "",
  });

  const [countries] = useState(Country.getAllCountries());
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileResponse, categoriesResponse] = await Promise.all([
          authApi.getSelfProfile(),
          authApi.getCategoryList(),
        ]);

        if (categoriesResponse?.status) {
          setCategories(categoriesResponse?.data?.categories || []);
        }

        if (profileResponse?.status) {
          const profile = profileResponse?.data?.user;
          const location = profile?.location || {};

          let countryCode = profile?.countryCode || "";
          let stateCode = "";
          let initialStates = [];
          let initialCities = [];

          // Find Country Code and Load States
          if (location.country) {
            const countryObj = countries.find(
              (c) => c.name === location.country,
            );
            if (countryObj) {
              countryCode = countryObj.isoCode;
              initialStates = State.getStatesOfCountry(countryCode);
              setStates(initialStates);

              // Find State Code and Load Cities
              if (location.state) {
                const stateObj = initialStates.find(
                  (s) => s.name === location.state,
                );
                if (stateObj) {
                  stateCode = stateObj.isoCode;
                  initialCities = City.getCitiesOfState(countryCode, stateCode);
                  setCities(initialCities);
                }
              }
            }
          }

          const fetchedData = {
            firstName: profile?.firstName || "",
            lastName: profile?.lastName || "",
            email: profile?.email || "",
            state: location?.state || "",
            stateCode: stateCode,
            city: location?.city || "",
            country: location?.country || "",
            countryCode: countryCode,
            dob: profile?.dob ? profile.dob.split("T")[0] : "",
            contactNumber: profile?.contactNumber
              ? profile?.countryCode
                ? `${profile.countryCode}${profile.contactNumber}`
                : profile.contactNumber
              : "",
            zipcode: location?.zipcode || "",
            profileImage: profile?.profileImage || "",
            backgroundImage: profile?.backgroundImage || "",
            latitude: location?.coordinates?.[1] || 0,
            longitude: location?.coordinates?.[0] || 0,
            address: location?.address || "",
          };

          setProfileData(fetchedData);
          setSelectedCategoryIds(
            (profile?.categories || []).map(
              (category) => category._id || category,
            ),
          );
          setPreview(getFullImageUrl(profile?.profileImage));
          setBackgroundPreview(getFullImageUrl(profile?.backgroundImage));

          setBackupProfileData({
            ...fetchedData,
            selectedCategoryIds: (profile?.categories || []).map(
              (category) => category._id || category,
            ),
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
    document.title = t("personalInfoPageTitle");
  }, [t]);

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

  const handleDiscard = () => {
    if (backupProfileData) {
      const { selectedCategoryIds: backupCatIds, ...rest } = backupProfileData;
      setProfileData({ ...rest });
      setSelectedCategoryIds(backupCatIds || []);
      setPreview(getFullImageUrl(backupProfileData.profileImage));
      setBackgroundPreview(getFullImageUrl(backupProfileData.backgroundImage));
    }
    setProfileImageFile(null);
    setBackgroundImageFile(null);
    setIsEditMode(false);
    setErrors({});
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      let uploadedProfileImage = profileData.profileImage;
      let uploadedBackgroundImage = profileData.backgroundImage;

      // 1. Upload profile image if a new file was selected
      if (profileImageFile) {
        const formData = new FormData();
        formData.append("files", profileImageFile);
        const response = await authApi.uploadFile(formData);
        if (response?.status) {
          uploadedProfileImage = response.data.files[0];
        }
      }

      // 2. Upload background image if a new file was selected
      if (backgroundImageFile) {
        const formData = new FormData();
        formData.append("files", backgroundImageFile);
        const response = await authApi.uploadFile(formData);
        if (response?.status) {
          uploadedBackgroundImage = response.data.files[0];
        }
      }

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
        profileImage: uploadedProfileImage,
        backgroundImage: uploadedBackgroundImage,
        categories: selectedCategoryIds,
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
      if (response?.status) {
        toast.success(t("profileUpdatedSuccessfully"));

        const finalProfile = response.data.user;
        const location = finalProfile.location || {};

        const updatedFetchedData = {
          firstName: finalProfile.firstName || "",
          lastName: finalProfile.lastName || "",
          email: finalProfile.email || "",
          state: location.state || "",
          stateCode: profileData.stateCode,
          city: location.city || "",
          country: location.country || "",
          countryCode: profileData.countryCode,
          dob: finalProfile.dob ? finalProfile.dob.split("T")[0] : "",
          contactNumber: finalProfile.contactNumber
            ? finalProfile.countryCode
              ? `${finalProfile.countryCode}${finalProfile.contactNumber}`
              : finalProfile.contactNumber
            : "",
          zipcode: location.zipcode || "",
          profileImage: finalProfile.profileImage || "",
          backgroundImage: finalProfile.backgroundImage || "",
          latitude: location.coordinates?.[1] || 0,
          longitude: location.coordinates?.[0] || 0,
          address: location.address || "",
        };

        setProfileData(updatedFetchedData);
        setPreview(getFullImageUrl(finalProfile.profileImage));
        setBackgroundPreview(getFullImageUrl(finalProfile.backgroundImage));

        setBackupProfileData({
          ...updatedFetchedData,
          selectedCategoryIds: (finalProfile.categories || []).map(
            (category) => category._id || category,
          ),
        });

        setProfileImageFile(null);
        setBackgroundImageFile(null);
        setIsEditMode(false);
        setErrors({});
      }
    } catch (error) {
      console.error("Update failed:", error);
      toast.error(error?.message || t("failedToUpdateProfile"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="cards">
        <Form onSubmit={handleSave}>
          {/* Cover/Background Image Container */}
          <div className="profile-cover-banner">
            <img
              src={backgroundPreview || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='200' viewBox='0 0 800 200'><rect width='100%' height='100%' fill='%231f1f1f'/><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%231a1a1a'/><stop offset='100%25' stop-color='%2323ada4' stop-opacity='0.15'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23g)'/></svg>"}
              alt="Cover"
              className="profile-cover-img"
              onError={(e) => {
                e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='200' viewBox='0 0 800 200'><rect width='100%' height='100%' fill='%231f1f1f'/><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%231a1a1a'/><stop offset='100%25' stop-color='%2323ada4' stop-opacity='0.15'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23g)'/></svg>";
              }}
            />
            {isEditMode && (
              <label htmlFor="cover-upload-input" className="cover-edit-overlay">
                <img src="/img/edit-icon.svg" alt="Edit Cover" className="edit-icon-img" />
                <span>{t("changeCover") || "Change Cover"}</span>
                <input
                  id="cover-upload-input"
                  type="file"
                  hidden
                  onChange={handleBackgroundFileChange}
                  accept="image/*"
                />
              </label>
            )}
          </div>

          <div className="personal-profile">
            <div className="personal-profile-lft">
              <div className="personal-profile-img-container">
                <div className="personal-profile-img">
                  <img
                    src={preview || "/img/default-user.png"}
                    alt="Profile"
                    onError={(e) => {
                      e.target.src = "/img/default-user.png";
                    }}
                  />
                </div>
                {isEditMode && (
                  <label htmlFor="profile-upload-input" className="profile-image-edit-overlay">
                    <img src="/img/edit-icon.svg" alt="Edit Profile" className="edit-icon-img" />
                    <input
                      id="profile-upload-input"
                      type="file"
                      hidden
                      onChange={handleProfileFileChange}
                      accept="image/*"
                    />
                  </label>
                )}
              </div>
              <div className="personal-profile-info">
                <h4>
                  {t("heyUser")} {profileData.firstName || t("defaultUser")}!
                </h4>
                <p>{profileData.email}</p>
              </div>
            </div>
            <div className="personal-profile-rgt">
              {!isEditMode ? (
                <button
                  className="edit-profile-btn"
                  type="button"
                  onClick={() => setIsEditMode(true)}>
                  <img src="/img/edit-icon.svg" alt="Edit" />
                  <span>{t("EditProfile") || t("edit")}</span>
                </button>
              ) : (
                <div className="d-flex gap-2">
                  <button
                    className="outline-btn"
                    type="button"
                    onClick={handleDiscard}
                    style={{ borderRadius: "50px", padding: "8px 16px", fontSize: "14px" }}>
                    {t("discard") || "Discard"}
                  </button>
                  <button
                    className="custom-btn"
                    type="submit"
                    disabled={loading}
                    style={{ borderRadius: "50px", padding: "8px 16px", fontSize: "14px" }}>
                    {loading
                      ? t("saving") || "Saving..."
                      : t("saveChanges") || "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>
          <Row className="profile-cms-inpt">
            {/* Row 1: Names */}
            <Col md={6}>
              <div className="profile-input-container">
                <label htmlFor="firstName">{t("firstName")}</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="form-control"
                    id="firstName"
                    placeholder={t("firstName")}
                    value={profileData.firstName}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  />
                  <span className="form-icon">
                    <img src="/img/form-user.svg" alt="" />
                  </span>
                </div>
                {errors.firstName && (
                  <small className="text-danger ps-2">{errors.firstName}</small>
                )}
              </div>
            </Col>
            <Col md={6}>
              <div className="profile-input-container">
                <label htmlFor="lastName">{t("lastName")}</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="form-control"
                    id="lastName"
                    placeholder={t("lastName")}
                    value={profileData.lastName}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  />
                  <span className="form-icon">
                    <img src="/img/form-user.svg" alt="" />
                  </span>
                </div>
                {errors.lastName && (
                  <small className="text-danger ps-2">{errors.lastName}</small>
                )}
              </div>
            </Col>

            {/* Row 2: Email and DOB */}
            <Col md={6}>
              <div className="profile-input-container">
                <label htmlFor="email">{t("email")}</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    placeholder={t("email")}
                    value={profileData.email}
                    disabled
                  />
                  <span className="form-icon">
                    <img src="/img/form-email.svg" alt="" />
                  </span>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="profile-input-container">
                <label htmlFor="dob">{t("dob")}</label>
                <div className="input-wrapper">
                  <input
                    type="date"
                    className="form-control"
                    id="dob"
                    value={profileData.dob}
                    onChange={handleChange}
                    max={new Date().toISOString().split("T")[0]}
                    disabled={!isEditMode}
                  />
                  <span className="form-icon">
                    <img src="/img/form-calendar.svg" alt="" />
                  </span>
                </div>
              </div>
            </Col>

            {/* Row 3: Country and State */}
            <Col md={6}>
              <div className="profile-input-container">
                <label htmlFor="country">{t("country")}</label>
                <div className="input-wrapper">
                  <select
                    className="form-select"
                    id="country"
                    value={profileData.country}
                    onChange={handleCountryChange}
                    disabled={!isEditMode}>
                    <option value="">{t("selectCountry")}</option>
                    {countries.map((c) => (
                      <option key={c.isoCode} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <span className="form-icon">
                    <img src="/img/form-globe.svg" alt="" />
                  </span>
                </div>
                {errors.country && (
                  <small className="text-danger ps-2">{errors.country}</small>
                )}
              </div>
            </Col>
            <Col md={6}>
              <div className="profile-input-container">
                <label htmlFor="state">{t("state")}</label>
                <div className="input-wrapper">
                  <select
                    className="form-select"
                    id="state"
                    value={profileData.state}
                    onChange={handleStateChange}
                    disabled={!isEditMode || !profileData.country}>
                    <option value="">{t("selectState")}</option>
                    {states.map((s) => (
                      <option key={s.isoCode} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <span className="form-icon">
                    <img src="/img/form-globe.svg" alt="" />
                  </span>
                </div>
                {errors.state && (
                  <small className="text-danger ps-2">{errors.state}</small>
                )}
              </div>
            </Col>

            {/* Row 4: City and Zipcode */}
            <Col md={6}>
              <div className="profile-input-container">
                <label htmlFor="city">{t("city")}</label>
                <div className="input-wrapper">
                  <select
                    className="form-select"
                    id="city"
                    value={profileData.city}
                    onChange={handleCityChange}
                    disabled={!isEditMode || !profileData.state}>
                    <option value="">{t("selectCity")}</option>
                    {cities.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                  <span className="form-icon">
                    <img src="/img/form-mark.svg" alt="" />
                  </span>
                </div>
                {errors.city && (
                  <small className="text-danger ps-2">{errors.city}</small>
                )}
              </div>
            </Col>

            {/* Row 5: Contact Number */}
            <Col md={6}>
              <div className="profile-input-container">
                <label>{t("contactNumber")}</label>
                <div
                  className={`phone_input_wrapper ${!isEditMode ? "disabled" : ""}`}>
                  <PhoneInput
                    country={"us"}
                    value={profileData.contactNumber}
                    onChange={(phone) => handlePhoneChange("+" + phone)}
                    inputClass="form-control"
                    containerClass="phone_input"
                    dropdownClass="phone_input_dropdown"
                    buttonClass="phone_input_button"
                    disabled={!isEditMode}
                  />
                </div>
              </div>
            </Col>

            <Col md={12}>
              <div className="mb-4">
                <h5 className="mb-2">{t("interestCategories")}</h5>
                <p className="text-secondary mb-3 small">
                  {t("interestCategoriesHelper")}
                </p>
                <div className="interest-scroll-area">
                  <InterestSelector
                    categories={categories}
                    selectedIds={selectedCategoryIds}
                    onToggle={(id) => {
                      setSelectedCategoryIds((prev) =>
                        prev.includes(id)
                          ? prev.filter((item) => item !== id)
                          : [...prev, id],
                      );
                    }}
                    disabled={!isEditMode}
                  />
                </div>
              </div>
            </Col>
          </Row>
        </Form>
      </div>

      <style jsx>{`
        .profile-cover-banner {
          position: relative;
          width: 100%;
          height: 200px;
          border-radius: 20px 20px 0 0;
          overflow: hidden;
          background-color: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-bottom: none;
        }
        .profile-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cover-edit-overlay {
          position: absolute;
          top: 15px;
          right: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          padding: 8px 16px;
          border-radius: 30px;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.2s ease;
        }
        .cover-edit-overlay:hover {
          background: var(--primary-teal, #23ada4);
          border-color: var(--primary-teal, #23ada4);
          transform: translateY(-1px);
        }
        .cover-edit-overlay span {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
        }
        .edit-icon-img {
          width: 14px;
          height: 14px;
          filter: brightness(0) invert(1);
        }
        .personal-profile {
          border-radius: 0 0 20px 20px !important;
          margin-top: 0 !important;
          border-top: none !important;
          background: rgba(26, 26, 26, 0.65) !important;
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .personal-profile-img-container {
          position: relative;
        }
        .profile-image-edit-overlay {
          position: absolute;
          bottom: 0;
          right: 0;
          background: var(--primary-teal, #23ada4);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
          border: 2px solid #1a1a1a;
          transition: transform 0.2s ease;
        }
        .profile-image-edit-overlay:hover {
          transform: scale(1.1);
        }
        .bg-teal-soft {
          background-color: rgba(35, 173, 164, 0.12);
          color: #23ada4;
          font-size: 11px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 30px;
          border: 1px solid rgba(35, 173, 164, 0.25);
          display: inline-flex;
          align-items: center;
        }
        .phone_input_wrapper.disabled {
          opacity: 0.8;
          pointer-events: none;
        }
        .profile-input-container {
          position: relative;
          margin-bottom: 24px;
        }
        .profile-input-container label {
          display: block;
          color: #999;
          font-size: 14px;
          margin-bottom: 8px;
          padding-left: 10px;
          font-weight: 500;
        }
        .profile-input-container .input-wrapper {
          position: relative;
        }
        .profile-input-container .form-control,
        .profile-input-container .form-select {
          text-transform: capitalize;
          padding: 0.7rem 1rem 0.7rem 2.8rem !important;
          height: 56px;
          background-color: #323232 !important;
          border-radius: 50px !important;
          color: #fff !important;
          box-shadow: none;
          border: 1px solid #737373 !important;
        }
        .profile-input-container .form-control[type="email"] {
          text-transform: none;
        }
        .profile-input-container .form-control:disabled,
        .profile-input-container .form-select:disabled {
          background-color: #242424 !important;
          border-color: #444 !important;
          color: #888 !important;
        }
        .profile-input-container .form-icon {
          position: absolute;
          top: 50%;
          left: 15px;
          transform: translateY(-50%);
          pointer-events: none;
          display: flex;
          align-items: center;
        }
        .profile-input-container .form-icon img {
          opacity: 0.8;
          width: 18px;
          height: 18px;
        }
        @media (max-width: 768px) {
          .personal-profile {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            padding: 20px !important;
            gap: 20px !important;
          }
          .personal-profile-lft {
            flex-direction: column !important;
            align-items: center !important;
            gap: 15px !important;
            text-align: center !important;
          }
          .personal-profile-rgt {
            width: 100% !important;
            display: flex !important;
            justify-content: center !important;
          }
          .personal-profile-rgt .d-flex {
            width: 100% !important;
            justify-content: center !important;
          }
          .personal-profile-rgt button {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>
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
