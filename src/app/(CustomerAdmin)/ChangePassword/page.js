"use client";
import React, { useState, useEffect } from "react";
import authApi from "@/api/authApi";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

function ChangePasswordPage() {
  const { t } = useLanguage();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    document.title = `Change Password - Bondy`;
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error(t("allFieldsRequired") || "All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("passwordsDoNotMatch") || "Passwords do not match");
      return;
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$&*~%^()_+=\[\]{};:<>|./?,-]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error(t("passwordComplexity") || "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
      return;
    }
    if (oldPassword === newPassword) {
      toast.error(t("passwordMustBeDifferent") || "New password must be different from old password");
      return;
    }

    try {
      setUpdatingPassword(true);
      const response = await authApi.changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });

      if (response?.status) {
        toast.success(response?.message || t("passwordChangedSuccessfully") || "Password changed successfully");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(response?.message || t("failedToChangePassword") || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        t("failedToChangePassword") ||
        "Failed to change password"
      );
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div>
      <div className="cards setting-card">
        <div className="card-title">
          <h3>{t("changePassword") || "Change Password"}</h3>
        </div>

        <div className="change-password-wrapper">
          <form onSubmit={handleChangePassword} className="change-password-form">
            <div className="form-group mb-3">
              <label className="form-label">{t("oldPassword") || "Old Password"}</label>
              <div className="password-input-container">
                <input
                  type={showOldPassword ? "text" : "password"}
                  className="form-control password-input"
                  placeholder={t("enterOldPassword") || "Enter old password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  <span className="toggle-text">
                    {showOldPassword ? (t("hide") || "Hide") : (t("show") || "Show")}
                  </span>
                </button>
              </div>
            </div>

            <div className="form-group mb-3">
              <label className="form-label">{t("newPassword") || "New Password"}</label>
              <div className="password-input-container">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="form-control password-input"
                  placeholder={t("enterNewPassword") || "Enter new password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  <span className="toggle-text">
                    {showNewPassword ? (t("hide") || "Hide") : (t("show") || "Show")}
                  </span>
                </button>
              </div>
              <div className="password-hint mt-1" style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "11px", paddingLeft: "4px" }}>
                {t("passwordComplexity")}
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">{t("confirmPassword") || "Confirm Password"}</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control password-input"
                  placeholder={t("confirmNewPassword") || "Confirm new password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="toggle-text">
                    {showConfirmPassword ? (t("hide") || "Hide") : (t("show") || "Show")}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-teal change-password-btn"
              disabled={updatingPassword}
            >
              {updatingPassword ? (t("updating") || "Updating...") : (t("updatePassword") || "Update Password")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangePasswordPage;
