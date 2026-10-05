"use client";
import Link from "next/link";
import React, { useEffect, useRef, useState, Suspense } from "react";
import LanguageSelector from "@/components/LanguageSelector";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumber } from "react-phone-number-input";
import authApi from "@/api/authApi";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import GuestRoute from "@/components/GuestRoute";
import Header from "@/components/Header";
import { useLanguage } from "@/context/LanguageContext";
import { useGoogleLogin } from "@react-oauth/google";

const STRONG_PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$&*~%^()_+=\[\]{};:<>|./?,-]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const [selectedTab, setSelectedTab] = useState("Customer"); // "Customer" | "Organizer"
  const [show2, setShow2] = useState(false);
  const [show, setShow] = useState(false);
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [customerErrors, setCustomerErrors] = useState({});
  const [organizerErrors, setOrganizerErrors] = useState({});

  // Customer Form State
  const [customerData, setCustomerData] = useState({
    email: "",
    contactNumber: "",
    countryCode: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
    acceptTerms: false,
  });

  // Organizer Form State
  const [organizerData, setOrganizerData] = useState({
    fullname: "",
    email: "",
    contactNumber: "",
    countryCode: "",
    password: "",
    confirmPassword: "",
    businessType: "",
    acceptTerms: false,
    documents: [],
    referralCode: "",
  });

  // Pre-fill referral code from URL param (?ref=CODE)
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setOrganizerData((prev) => ({ ...prev, referralCode: refCode }));
      setCustomerData((prev) => ({ ...prev, referralCode: refCode }));
    }
  }, [searchParams]);

  const validatePassword = (password) => {
    if (!password) return t("passwordRequired");
    if (!STRONG_PASSWORD_REGEX.test(password)) return t("passwordComplexity");
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) return t("emailRequired");
    if (!EMAIL_REGEX.test(email.trim())) return t("invalidEmail");
    return "";
  };

  const validateCustomerForm = (data) => {
    const errors = {};
    const emailError = validateEmail(data.email);
    if (emailError) errors.email = emailError;
    if (!data.contactNumber) errors.contactNumber = t("contactNumberRequired");
    const passwordError = validatePassword(data.password);
    if (passwordError) errors.password = passwordError;
    if (!data.confirmPassword) {
      errors.confirmPassword = t("confirmPasswordRequired");
    } else if (data.password !== data.confirmPassword) {
      errors.confirmPassword = t("passwordsNotMatch");
    }
    if (!data.acceptTerms) errors.acceptTerms = t("acceptTerms");
    return errors;
  };

  const validateOrganizerForm = (data) => {
    const errors = {};
    if (!data.fullname?.trim()) errors.fullname = t("fullNameRequired") || "Full Name is required";
    const emailError = validateEmail(data.email);
    if (emailError) errors.email = emailError;
    if (!data.contactNumber) errors.contactNumber = t("contactNumberRequired");
    const passwordError = validatePassword(data.password);
    if (passwordError) errors.password = passwordError;
    if (!data.confirmPassword) {
      errors.confirmPassword = t("confirmPasswordRequired");
    } else if (data.password !== data.confirmPassword) {
      errors.confirmPassword = t("passwordsNotMatch");
    }
    if (!data.acceptTerms) errors.acceptTerms = t("acceptTerms");
    return errors;
  };

  const handleCustomerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustomerData((prev) => {
      const nextValue = type === "checkbox" ? checked : value;
      const next = { ...prev, [name]: nextValue };
      const nextErrors = { ...customerErrors };
      if (name === "email") nextErrors.email = validateEmail(value);
      if (name === "password") {
        nextErrors.password = validatePassword(value);
        if (next.confirmPassword) {
          nextErrors.confirmPassword = value === next.confirmPassword ? "" : t("passwordsNotMatch");
        }
      }
      if (name === "confirmPassword") {
        nextErrors.confirmPassword = value
          ? value === next.password ? "" : t("passwordsNotMatch")
          : t("confirmPasswordRequired");
      }
      if (name === "acceptTerms") nextErrors.acceptTerms = checked ? "" : t("acceptTerms");
      setCustomerErrors(nextErrors);
      return next;
    });
  };

  const handleOrganizerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOrganizerData((prev) => {
      const nextValue = type === "checkbox" ? checked : value;
      const next = { ...prev, [name]: nextValue };
      const nextErrors = { ...organizerErrors };
      if (name === "fullname") nextErrors.fullname = value.trim() ? "" : (t("fullNameRequired") || "Full Name is required");
      if (name === "email") nextErrors.email = validateEmail(value);
      if (name === "password") {
        nextErrors.password = validatePassword(value);
        if (next.confirmPassword) {
          nextErrors.confirmPassword = value === next.confirmPassword ? "" : t("passwordsNotMatch");
        }
      }
      if (name === "confirmPassword") {
        nextErrors.confirmPassword = value
          ? value === next.password ? "" : t("passwordsNotMatch")
          : t("confirmPasswordRequired");
      }
      if (name === "acceptTerms") nextErrors.acceptTerms = checked ? "" : t("acceptTerms");
      setOrganizerErrors(nextErrors);
      return next;
    });
  };

  const handlePhoneChange = (value, role) => {
    if (role === "Customer") {
      setCustomerData((prev) => ({ ...prev, contactNumber: value }));
      setCustomerErrors((prev) => ({
        ...prev,
        contactNumber: value ? "" : t("contactNumberRequired"),
      }));
    } else {
      setOrganizerData((prev) => ({ ...prev, contactNumber: value }));
      setOrganizerErrors((prev) => ({
        ...prev,
        contactNumber: value ? "" : t("contactNumberRequired"),
      }));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const response = await authApi.uploadFile(formData);
      if (response?.status) {
        setOrganizerData((prev) => ({
          ...prev,
          documents: response?.data?.files.map((uploadedFile) => ({
            file: uploadedFile,
            name: "Business Proof",
          })),
        }));
      }
    } catch (error) {
      // toast handled by interceptor
    }
  };

  const handleCustomerSignup = async (e) => {
    e.preventDefault();
    const trimmedData = {
      email: customerData.email ? customerData.email.trim() : "",
      contactNumber: customerData.contactNumber ? customerData.contactNumber.trim() : "",
      password: customerData.password ? customerData.password.trim() : "",
      confirmPassword: customerData.confirmPassword ? customerData.confirmPassword.trim() : "",
      referralCode: customerData.referralCode ? customerData.referralCode.trim() : "",
    };
    setCustomerData((prev) => ({ ...prev, ...trimmedData }));
    const errors = validateCustomerForm({ ...customerData, ...trimmedData });
    setCustomerErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      let finalCountryCode = "+1";
      let finalContactNumber = trimmedData.contactNumber;
      if (trimmedData.contactNumber) {
        const parsed = parsePhoneNumber(trimmedData.contactNumber);
        if (parsed) {
          finalCountryCode = `+${parsed.countryCallingCode}`;
          finalContactNumber = parsed.nationalNumber;
        }
      }
      const payload = {
        email: customerData.email,
        contactNumber: finalContactNumber,
        countryCode: finalCountryCode,
        password: customerData.password,
        confirmPassword: customerData.confirmPassword,
        referralCode: customerData.referralCode,
      };
      const response = await authApi.customerSignup(payload);
      if (response?.status) {
        localStorage.setItem("registerEmail", customerData.email);
        localStorage.setItem("registerType", "CUSTOMER");
        router.push("/otp?flow=signup");
      }
    } catch (error) {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizerSignup = async (e) => {
    e.preventDefault();
    const errors = validateOrganizerForm(organizerData);
    setOrganizerErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      let finalCountryCode = "+1";
      let finalContactNumber = organizerData.contactNumber;
      if (organizerData.contactNumber) {
        const parsed = parsePhoneNumber(organizerData.contactNumber);
        if (parsed) {
          finalCountryCode = `+${parsed.countryCallingCode}`;
          finalContactNumber = parsed.nationalNumber;
        }
      }
      const payload = {
        ...organizerData,
        contactNumber: finalContactNumber,
        countryCode: finalCountryCode,
      };
      const response = await authApi.organizerSignup(payload);
      if (response?.status) {
        localStorage.setItem("registerEmail", organizerData.email);
        localStorage.setItem("registerType", "ORGANIZER");
        router.push("/otp?flow=signup");
      }
    } catch (error) {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = `${t("signUp")} | Bondy`;
  }, [t]);

  const handlePostLoginRedirect = async () => {
    try {
      const profileRes = await authApi.getSelfProfile();
      if (profileRes?.status) {
        const profile = profileRes?.data?.user;
        if (profile) localStorage.setItem("userProfile", JSON.stringify(profile));
        const isOrganizer = profile?.roleId === 2 || profile?.organizerVerificationStatus;
        if (isOrganizer) {
          if (!profile?.businessName || !profile?.businessCategory) return router.push("/completeprofile");
          if (!(profile?.hasBeenApproved || profile?.isVerified)) return router.push("/completeprofile");
          router.push("/");
        } else {
          if (!profile?.firstName || !profile?.lastName) return router.push("/completeprofile");
          if (!profile?.categories || profile?.categories.length === 0) return router.push("/insterest");
          router.push("/");
        }
      } else {
        router.push("/completeprofile");
      }
    } catch {
      router.push("/completeprofile");
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!userInfoRes.ok) throw new Error("Failed to fetch Google user info");
        const userInfo = await userInfoRes.json();
        const roleType = selectedTab === "Organizer" ? "ORGANIZER" : "CUSTOMER";
        const response = await authApi.socialLogin({
          socialId: userInfo.sub,
          socialType: "GOOGLE",
          type: roleType,
          email: userInfo.email || "",
          firstName: userInfo.given_name || "",
          lastName: userInfo.family_name || "",
          profileImage: userInfo.picture || "",
        });
        if (response?.status) {
          if (response?.data?.token) localStorage.setItem("token", response.data.token);
          await handlePostLoginRedirect();
        }
      } catch (error) {
        // handled by interceptor
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => toast.error("Google sign-up failed. Please try again."),
  });

  const switchTab = (tab) => {
    setSelectedTab(tab);
    setCustomerErrors({});
    setOrganizerErrors({});
  };

  return (
    <GuestRoute>
      <Header />
      <main className="lg-shell">
        <section className="lg-panel">
          {/* ── Title ── */}
          <h1 className="lg-h1">{t("getStarted")}</h1>
          <p className="lg-sub">{t("registerForEventsDesc")}</p>

          {/* ── Customer / Organizer segment ── */}
          <div className="lg-seg" role="tablist">
            <button
              type="button"
              role="tab"
              className="lg-seg-btn"
              aria-selected={selectedTab === "Customer" ? "true" : "false"}
              onClick={() => switchTab("Customer")}
            >
              {t("customer")}
            </button>
            <button
              type="button"
              role="tab"
              className="lg-seg-btn"
              aria-selected={selectedTab === "Organizer" ? "true" : "false"}
              onClick={() => switchTab("Organizer")}
            >
              {t("organizer")}
            </button>
          </div>

          {/* ════════════════ CUSTOMER FORM ════════════════ */}
          {selectedTab === "Customer" && (
            <form className="login_field" noValidate onSubmit={handleCustomerSignup}>
              <div className="lg-fields">

                {/* Email */}
                <label>
                  <input
                    type="email"
                    name="email"
                    maxLength={50}
                    placeholder={t("email")}
                    value={customerData.email}
                    onChange={handleCustomerChange}
                    className="lg-in"
                    aria-invalid={!!customerErrors.email}
                    aria-required="true"
                  />
                  {customerErrors.email && <span className="lg-err">{customerErrors.email}</span>}
                </label>

                {/* Phone */}
                <div>
                  <div className={`lg-phone-wrap ${customerErrors.contactNumber ? "has-error" : ""}`}>
                    <PhoneInput
                      country={"us"}
                      value={customerData.contactNumber}
                      onChange={(phone) => handlePhoneChange("+" + phone, "Customer")}
                      inputClass="form-control w-100"
                      containerClass="phone_input"
                      dropdownClass="phone_input_dropdown"
                      buttonClass="phone_input_button"
                    />
                  </div>
                  {customerErrors.contactNumber && (
                    <span className="lg-err">{customerErrors.contactNumber}</span>
                  )}
                </div>

                {/* Password */}
                <label>
                  <div className="lg-pw">
                    <input
                      type={show ? "text" : "password"}
                      name="password"
                      maxLength={50}
                      placeholder={t("password")}
                      value={customerData.password}
                      onChange={handleCustomerChange}
                      className="lg-in"
                      aria-invalid={!!customerErrors.password}
                      aria-required="true"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="lg-eye-btn"
                      aria-label="Toggle password"
                    >
                      <img src={show ? "/img/lock.svg" : "/img/unlock.svg"} alt="toggle password" />
                    </button>
                  </div>
                  {customerErrors.password && <span className="lg-err">{customerErrors.password}</span>}
                </label>

                {/* Confirm Password */}
                <label>
                  <div className="lg-pw">
                    <input
                      type={show2 ? "text" : "password"}
                      name="confirmPassword"
                      maxLength={50}
                      placeholder={t("confirmPassword")}
                      value={customerData.confirmPassword}
                      onChange={handleCustomerChange}
                      className="lg-in"
                      aria-invalid={!!customerErrors.confirmPassword}
                      aria-required="true"
                    />
                    <button
                      type="button"
                      onClick={() => setShow2(!show2)}
                      className="lg-eye-btn"
                      aria-label="Toggle confirm password"
                    >
                      <img src={show2 ? "/img/lock.svg" : "/img/unlock.svg"} alt="toggle confirm password" />
                    </button>
                  </div>
                  {customerErrors.confirmPassword && <span className="lg-err">{customerErrors.confirmPassword}</span>}
                </label>

                {/* Terms */}
                <div>
                  <label className="lg-terms" htmlFor="terms-customer">
                    <input
                      type="checkbox"
                      id="terms-customer"
                      name="acceptTerms"
                      checked={customerData.acceptTerms}
                      onChange={handleCustomerChange}
                    />
                    <span>
                      {language === "mn" ? (
                        <>
                          Би{" "}
                          <Link href="/terms" target="_blank" onClick={(e) => e.stopPropagation()}>
                            Үйлчилгээний нөхцөл
                          </Link>{" "}
                          болон{" "}
                          <Link href="/privacy-policy" target="_blank" onClick={(e) => e.stopPropagation()}>
                            Нууцлалын бодлогыг
                          </Link>{" "}
                          зөвшөөрч байна
                        </>
                      ) : (
                        <>
                          I agree to the{" "}
                          <Link href="/terms" target="_blank" className="text-decoration-underline text-primary" onClick={(e) => e.stopPropagation()}>
                            Terms & Conditions
                          </Link>{" "}
                          and{" "}
                          <Link href="/privacy-policy" target="_blank" className="text-decoration-underline text-primary" onClick={(e) => e.stopPropagation()}>
                            Privacy Policy
                          </Link>
                        </>
                      )}
                    </span>
                  </label>
                  {customerErrors.acceptTerms && <span className="lg-err">{customerErrors.acceptTerms}</span>}
                </div>
              </div>

              <button type="submit" disabled={loading} className="lg-submit">
                {loading && <span className="lg-spin" />}
                {loading ? t("signingUp") : t("signUp")}
              </button>
            </form>
          )}

          {/* ════════════════ ORGANIZER FORM ════════════════ */}
          {selectedTab === "Organizer" && (
            <form className="login_field" noValidate onSubmit={handleOrganizerSignup}>
              <div className="lg-fields">

                {/* Full Name */}
                <label>
                  <input
                    type="text"
                    name="fullname"
                    maxLength={25}
                    placeholder={t("fullName") || "Full Name"}
                    value={organizerData.fullname || ""}
                    onChange={handleOrganizerChange}
                    className="lg-in"
                    aria-invalid={!!organizerErrors.fullname}
                    aria-required="true"
                  />
                  {organizerErrors.fullname && <span className="lg-err">{organizerErrors.fullname}</span>}
                </label>

                {/* Email */}
                <label>
                  <input
                    type="email"
                    name="email"
                    maxLength={50}
                    placeholder={t("email")}
                    value={organizerData.email}
                    onChange={handleOrganizerChange}
                    className="lg-in"
                    aria-invalid={!!organizerErrors.email}
                    aria-required="true"
                  />
                  {organizerErrors.email && <span className="lg-err">{organizerErrors.email}</span>}
                </label>

                {/* Phone */}
                <div>
                  <div className={`lg-phone-wrap ${organizerErrors.contactNumber ? "has-error" : ""}`}>
                    <PhoneInput
                      country={"us"}
                      value={organizerData.contactNumber}
                      onChange={(phone) => handlePhoneChange("+" + phone, "Organizer")}
                      inputClass="form-control w-100"
                      containerClass="phone_input"
                      dropdownClass="phone_input_dropdown"
                      buttonClass="phone_input_button"
                    />
                  </div>
                  {organizerErrors.contactNumber && (
                    <span className="lg-err">{organizerErrors.contactNumber}</span>
                  )}
                </div>

                {/* Password */}
                <label>
                  <div className="lg-pw">
                    <input
                      type={show ? "text" : "password"}
                      name="password"
                      maxLength={50}
                      placeholder={t("password")}
                      value={organizerData.password}
                      onChange={handleOrganizerChange}
                      className="lg-in"
                      aria-invalid={!!organizerErrors.password}
                      aria-required="true"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="lg-eye-btn"
                      aria-label="Toggle password"
                    >
                      <img src={show ? "/img/lock.svg" : "/img/unlock.svg"} alt="toggle password" />
                    </button>
                  </div>
                  {organizerErrors.password && <span className="lg-err">{organizerErrors.password}</span>}
                </label>

                {/* Confirm Password */}
                <label>
                  <div className="lg-pw">
                    <input
                      type={show2 ? "text" : "password"}
                      name="confirmPassword"
                      maxLength={50}
                      placeholder={t("confirmPassword")}
                      value={organizerData.confirmPassword}
                      onChange={handleOrganizerChange}
                      className="lg-in"
                      aria-invalid={!!organizerErrors.confirmPassword}
                      aria-required="true"
                    />
                    <button
                      type="button"
                      onClick={() => setShow2(!show2)}
                      className="lg-eye-btn"
                      aria-label="Toggle confirm password"
                    >
                      <img src={show2 ? "/img/lock.svg" : "/img/unlock.svg"} alt="toggle confirm password" />
                    </button>
                  </div>
                  {organizerErrors.confirmPassword && <span className="lg-err">{organizerErrors.confirmPassword}</span>}
                </label>

                {/* Terms */}
                <div>
                  <label className="lg-terms" htmlFor="terms-organizer">
                    <input
                      type="checkbox"
                      id="terms-organizer"
                      name="acceptTerms"
                      checked={organizerData.acceptTerms}
                      onChange={handleOrganizerChange}
                    />
                    <span>
                      {language === "mn" ? (
                        <>
                          Би{" "}
                          <Link href="/terms" target="_blank" onClick={(e) => e.stopPropagation()}>
                            Үйлчилгээний нөхцөл
                          </Link>{" "}
                          болон{" "}
                          <Link href="/privacy-policy" target="_blank" onClick={(e) => e.stopPropagation()}>
                            Нууцлалын бодлогыг
                          </Link>{" "}
                          зөвшөөрч байна
                        </>
                      ) : (
                        <>
                          I agree to the{" "}
                          <Link href="/terms" target="_blank" className="text-decoration-underline text-primary" onClick={(e) => e.stopPropagation()}>
                            Terms & Conditions
                          </Link>{" "}
                          and{" "}
                          <Link href="/privacy-policy" target="_blank" className="text-decoration-underline text-primary" onClick={(e) => e.stopPropagation()}>
                            Privacy Policy
                          </Link>
                        </>
                      )}
                    </span>
                  </label>
                  {organizerErrors.acceptTerms && <span className="lg-err">{organizerErrors.acceptTerms}</span>}
                </div>
              </div>

              <button type="submit" disabled={loading} className="lg-submit">
                {loading && <span className="lg-spin" />}
                {loading ? t("signingUp") : t("signUp")}
              </button>
            </form>
          )}

          {/* ── Social ── */}
          <div className="lg-or">
            <span>{t("orSignInWith")}</span>
          </div>
          <div className="lg-social">
            <button type="button" disabled className="lg-social-btn" title="Apple login coming soon">
              <span className="lg-circle">
                <img src="/img/app_icon.svg" alt="apple" />
              </span>
              <span>Apple</span>
            </button>
            <button
              type="button"
              onClick={() => googleLogin()}
              disabled={googleLoading}
              className="lg-social-btn"
              title="Sign up with Google"
            >
              <span className="lg-circle">
                {googleLoading
                  ? <span className="lg-spin" />
                  : <img src="/img/google_icon.svg" alt="google" />}
              </span>
              <span>Google</span>
            </button>
          </div>

          {/* ── Bottom links ── */}
          <div className="lg-switch">
            <span>{t("alreadyHaveAccount")}</span>
            <Link href="/login" className="lg-switch-link">{t("login")}</Link>
          </div>
          <Link href="/" className="lg-guest-link">{t("continueAsGuest")}</Link>
        </section>
      </main>
    </GuestRoute>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="lg-shell">
          <div className="lg-panel" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="lg-spin" />
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
