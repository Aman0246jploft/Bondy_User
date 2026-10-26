"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/apiClient";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import "./settings.css";

const STR_COLOR = ["#FF5A5A", "#FF5A5A", "#FFB273", "#FFB273", "#34C759", "#34C759"];

const EMPTY_PW = { current: "", next: "", confirm: "" };

function Glyph({ name, size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {name === "bell" && (
        <path fillRule="evenodd" d="M 10.085 0 C 5.805 0 2.335 3.47 2.335 7.75 L 2.335 8.454 C 2.335 9.151 2.129 9.832 1.742 10.412 L 0.594 12.135 C -0.74 14.135 0.278 16.853 2.597 17.485 C 3.352 17.691 4.114 17.866 4.881 18.008 L 4.883 18.013 C 5.652 20.065 7.707 21.5 10.085 21.5 C 12.463 21.5 14.518 20.065 15.287 18.013 L 15.289 18.008 C 16.056 17.866 16.818 17.691 17.573 17.485 C 19.892 16.853 20.91 14.135 19.576 12.135 L 18.428 10.412 C 18.041 9.832 17.835 9.151 17.835 8.454 L 17.835 7.75 C 17.835 3.47 14.365 0 10.085 0 Z M 13.461 18.287 C 11.218 18.555 8.951 18.555 6.708 18.287 C 7.419 19.308 8.656 20 10.085 20 C 11.514 20 12.75 19.308 13.461 18.287 Z M 3.835 7.75 C 3.835 4.298 6.633 1.5 10.085 1.5 C 13.537 1.5 16.335 4.298 16.335 7.75 L 16.335 8.454 C 16.335 9.447 16.629 10.418 17.18 11.244 L 18.328 12.967 C 19.094 14.115 18.509 15.675 17.179 16.038 C 12.534 17.305 7.636 17.305 2.991 16.038 C 1.661 15.675 1.076 14.115 1.842 12.967 L 2.99 11.244 C 3.541 10.418 3.835 9.447 3.835 8.454 L 3.835 7.75 Z" transform="matrix(1 0 0 1 1.915 1.25)" />
      )}
      {name === "calendar" && (
        <path fillRule="evenodd" d="M 5.75 0 C 6.164 0 6.5 0.336 6.5 0.75 L 6.5 1.513 C 7.162 1.5 7.891 1.5 8.693 1.5 L 12.806 1.5 C 13.609 1.5 14.338 1.5 15 1.513 L 15 0.75 C 15 0.336 15.336 0 15.75 0 C 16.164 0 16.5 0.336 16.5 0.75 L 16.5 1.577 C 16.76 1.597 17.006 1.622 17.239 1.653 C 18.411 1.811 19.36 2.143 20.109 2.891 C 20.857 3.64 21.189 4.589 21.347 5.761 C 21.5 6.9 21.5 8.356 21.5 10.194 L 21.5 12.306 C 21.5 14.144 21.5 15.6 21.347 16.739 C 21.189 17.911 20.857 18.86 20.109 19.609 C 19.36 20.357 18.411 20.689 17.239 20.847 C 16.1 21 14.644 21 12.806 21 L 8.694 21 C 6.856 21 5.4 21 4.261 20.847 C 3.089 20.689 2.14 20.357 1.391 19.609 C 0.643 18.86 0.311 17.911 0.153 16.739 C 0 15.6 0 14.144 0 12.306 L 0 10.194 C 0 8.356 0 6.9 0.153 5.761 C 0.311 4.589 0.643 3.64 1.391 2.891 C 2.14 2.143 3.089 1.811 4.261 1.653 C 4.494 1.622 4.74 1.597 5 1.577 L 5 0.75 C 5 0.336 5.336 0 5.75 0 Z M 4.461 3.14 C 3.455 3.275 2.875 3.529 2.452 3.952 C 2.029 4.375 1.775 4.955 1.64 5.961 C 1.617 6.131 1.598 6.311 1.582 6.5 L 19.918 6.5 C 19.902 6.311 19.883 6.131 19.86 5.961 C 19.725 4.955 19.471 4.375 19.048 3.952 C 18.625 3.529 18.045 3.275 17.039 3.14 C 16.011 3.002 14.657 3 12.75 3 L 8.75 3 C 6.843 3 5.489 3.002 4.461 3.14 Z M 1.5 10.25 C 1.5 9.396 1.5 8.653 1.513 8 L 19.987 8 C 20 8.653 20 9.396 20 10.25 L 20 12.25 C 20 14.157 19.998 15.511 19.86 16.539 C 19.725 17.545 19.471 18.125 19.048 18.548 C 18.625 18.971 18.045 19.225 17.039 19.36 C 16.011 19.498 14.657 19.5 12.75 19.5 L 8.75 19.5 C 6.843 19.5 5.489 19.498 4.461 19.36 C 3.455 19.225 2.875 18.971 2.452 18.548 C 2.029 18.125 1.775 17.545 1.64 16.539 C 1.502 15.511 1.5 14.157 1.5 12.25 L 1.5 10.25 Z" transform="matrix(1 0 0 1 1.25 1.75)" />
      )}
      {name === "user" && (
        <>
          <path fillRule="evenodd" d="M 8.75 0 C 6.127 0 4 2.127 4 4.75 C 4 7.373 6.127 9.5 8.75 9.5 C 11.373 9.5 13.5 7.373 13.5 4.75 C 13.5 2.127 11.373 0 8.75 0 Z M 5.5 4.75 C 5.5 2.955 6.955 1.5 8.75 1.5 C 10.545 1.5 12 2.955 12 4.75 C 12 6.545 10.545 8 8.75 8 C 6.955 8 5.5 6.545 5.5 4.75 Z" transform="matrix(1 0 0 1 3.25 1.25)" />
          <path fillRule="evenodd" d="M 8.75 11 C 6.437 11 4.305 11.526 2.726 12.414 C 1.17 13.29 0 14.616 0 16.25 L 0 16.352 C -0.001 17.514 -0.002 18.972 1.277 20.014 C 1.906 20.526 2.787 20.891 3.976 21.131 C 5.169 21.373 6.724 21.5 8.75 21.5 C 10.776 21.5 12.331 21.373 13.524 21.131 C 14.714 20.891 15.594 20.526 16.224 20.014 C 17.503 18.972 17.501 17.514 17.5 16.352 L 17.5 16.25 C 17.5 14.616 16.331 13.29 14.775 12.414 C 13.195 11.526 11.064 11 8.75 11 Z M 1.5 16.25 C 1.5 15.399 2.122 14.475 3.461 13.722 C 4.777 12.981 6.645 12.5 8.75 12.5 C 10.855 12.5 12.723 12.981 14.039 13.722 C 15.379 14.475 16 15.399 16 16.25 C 16 17.558 15.96 18.294 15.277 18.85 C 14.906 19.152 14.287 19.447 13.226 19.661 C 12.169 19.875 10.724 20 8.75 20 C 6.776 20 5.331 19.875 4.274 19.661 C 3.214 19.447 2.594 19.152 2.224 18.85 C 1.54 18.294 1.5 17.558 1.5 16.25 Z" transform="matrix(1 0 0 1 3.25 1.25)" />
        </>
      )}
      {name === "letter" && (
        <path fillRule="evenodd" d="M 8.694 0 L 12.806 0 C 14.644 0 16.1 0 17.239 0.153 C 18.411 0.311 19.36 0.643 20.109 1.391 C 20.857 2.14 21.189 3.089 21.347 4.261 C 21.5 5.4 21.5 6.856 21.5 8.694 L 21.5 8.806 C 21.5 10.644 21.5 12.1 21.347 13.239 C 21.189 14.411 20.857 15.36 20.109 16.109 C 19.36 16.857 18.411 17.189 17.239 17.347 C 16.1 17.5 14.644 17.5 12.806 17.5 L 8.694 17.5 C 6.856 17.5 5.4 17.5 4.261 17.347 C 3.089 17.189 2.14 16.857 1.391 16.109 C 0.643 15.36 0.311 14.411 0.153 13.239 C 0 12.1 0 10.644 0 8.806 L 0 8.694 C 0 6.856 0 5.4 0.153 4.261 C 0.311 3.089 0.643 2.14 1.391 1.391 C 2.14 0.643 3.089 0.311 4.261 0.153 C 5.4 0 6.856 0 8.694 0 Z M 4.461 1.64 C 3.455 1.775 2.875 2.029 2.452 2.452 C 2.029 2.875 1.775 3.455 1.64 4.461 C 1.502 5.489 1.5 6.843 1.5 8.75 C 1.5 10.657 1.502 12.011 1.64 13.039 C 1.775 14.045 2.029 14.625 2.452 15.048 C 2.875 15.471 3.455 15.725 4.461 15.86 C 5.489 15.998 6.843 16 8.75 16 L 12.75 16 C 14.657 16 16.011 15.998 17.039 15.86 C 18.045 15.725 18.625 15.471 19.048 15.048 C 19.471 14.625 19.725 14.045 19.86 13.039 C 19.998 12.011 20 10.657 20 8.75 C 20 6.843 19.998 5.489 19.86 4.461 C 19.725 3.455 19.471 2.875 19.048 2.452 C 18.625 2.029 18.045 1.775 17.039 1.64 C 16.011 1.502 14.657 1.5 12.75 1.5 L 8.75 1.5 C 6.843 1.5 5.489 1.502 4.461 1.64 Z M 4.174 4.27 C 4.439 3.952 4.912 3.909 5.23 4.174 L 7.389 5.973 C 8.322 6.75 8.97 7.288 9.517 7.64 C 10.046 7.981 10.405 8.095 10.75 8.095 C 11.095 8.095 11.454 7.981 11.983 7.64 C 12.53 7.288 13.178 6.75 14.111 5.973 L 16.27 4.174 C 16.588 3.909 17.061 3.952 17.326 4.27 C 17.591 4.588 17.548 5.061 17.23 5.326 L 15.034 7.157 C 14.147 7.895 13.429 8.494 12.795 8.902 C 12.134 9.327 11.491 9.595 10.75 9.595 C 10.009 9.595 9.366 9.327 8.705 8.902 C 8.071 8.494 7.353 7.895 6.466 7.157 L 4.27 5.326 C 3.952 5.061 3.909 4.588 4.174 4.27 Z" transform="matrix(1 0 0 1 1.25 3.25)" />
      )}
      {name === "shield" && (
        <>
          <path d="M 12.809 9.25 C 13.085 8.941 13.058 8.466 12.75 8.191 C 12.441 7.915 11.966 7.942 11.691 8.25 L 8.679 11.624 L 7.809 10.65 C 7.534 10.342 7.059 10.315 6.75 10.591 C 6.442 10.866 6.415 11.341 6.691 11.65 L 8.119 13.25 C 8.261 13.409 8.465 13.5 8.679 13.5 C 8.892 13.5 9.096 13.409 9.238 13.25 L 12.809 9.25 Z" transform="matrix(1 0 0 1 2.25 1.25)" />
          <path fillRule="evenodd" d="M 9.75 0 C 8.812 0 7.917 0.307 6.473 0.801 L 5.746 1.05 C 4.265 1.557 3.121 1.949 2.303 2.281 C 1.891 2.448 1.536 2.611 1.251 2.776 C 0.976 2.936 0.701 3.135 0.514 3.402 C 0.329 3.665 0.233 3.989 0.173 4.301 C 0.11 4.626 0.073 5.015 0.048 5.461 C 0 6.348 0 7.564 0 9.14 L 0 10.741 C 0 16.842 4.608 19.768 7.348 20.965 L 7.375 20.976 C 7.715 21.125 8.035 21.264 8.402 21.358 C 8.789 21.458 9.201 21.5 9.75 21.5 C 10.299 21.5 10.711 21.458 11.098 21.358 C 11.465 21.264 11.785 21.125 12.125 20.976 L 12.152 20.965 C 14.892 19.768 19.5 16.842 19.5 10.741 L 19.5 9.14 C 19.5 7.564 19.5 6.348 19.452 5.461 C 19.427 5.015 19.39 4.626 19.327 4.301 C 19.267 3.989 19.171 3.665 18.986 3.402 C 18.799 3.135 18.524 2.936 18.249 2.776 C 17.964 2.611 17.609 2.448 17.197 2.281 C 16.379 1.949 15.235 1.557 13.754 1.05 L 13.027 0.801 C 11.583 0.307 10.688 0 9.75 0 Z M 6.831 2.264 C 8.445 1.712 9.092 1.5 9.75 1.5 C 10.408 1.5 11.055 1.712 12.669 2.264 L 13.242 2.46 C 14.755 2.978 15.858 3.356 16.632 3.671 C 17.019 3.828 17.299 3.959 17.496 4.074 C 17.593 4.13 17.66 4.176 17.704 4.213 C 17.742 4.243 17.757 4.261 17.759 4.263 C 17.761 4.267 17.773 4.287 17.791 4.337 C 17.811 4.393 17.833 4.473 17.854 4.585 C 17.898 4.812 17.931 5.123 17.954 5.543 C 18 6.384 18 7.558 18 9.167 L 18 10.741 C 18 15.916 14.13 18.463 11.551 19.59 C 11.18 19.752 10.965 19.844 10.726 19.905 C 10.498 19.964 10.22 20 9.75 20 C 9.28 20 9.002 19.964 8.774 19.905 C 8.535 19.844 8.32 19.752 7.949 19.59 C 5.37 18.463 1.5 15.916 1.5 10.741 L 1.5 9.167 C 1.5 7.558 1.5 6.384 1.546 5.543 C 1.569 5.123 1.602 4.812 1.646 4.585 C 1.667 4.473 1.689 4.393 1.709 4.337 C 1.727 4.287 1.739 4.267 1.741 4.263 C 1.743 4.261 1.758 4.244 1.796 4.213 C 1.84 4.176 1.907 4.13 2.004 4.074 C 2.201 3.959 2.481 3.828 2.868 3.671 C 3.642 3.356 4.745 2.978 6.258 2.46 L 6.831 2.264 Z" transform="matrix(1 0 0 1 2.25 1.25)" />
        </>
      )}
      {name === "chevron" && (
        <path fillRule="evenodd" d="M 0.262 0.181 C 0.576 -0.089 1.05 -0.053 1.319 0.262 L 7.319 7.262 C 7.56 7.543 7.56 7.957 7.319 8.238 L 1.319 15.238 C 1.05 15.553 0.576 15.589 0.262 15.319 C -0.053 15.05 -0.089 14.576 0.181 14.262 L 5.762 7.75 L 0.181 1.238 C -0.089 0.924 -0.053 0.45 0.262 0.181 Z" transform="matrix(1 0 0 1 8.25 4.25)" />
      )}
    </svg>
  );
}

function Switch({ id, checked, onChange }) {
  return (
    <div className="form-check form-switch st-switch">
      <input
        className="form-check-input"
        type="checkbox"
        role="switch"
        id={id}
        checked={checked}
        onChange={onChange}
      />
    </div>
  );
}

function strengthOf(pw) {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[a-zA-Z]/.test(pw)) score += 1;
  if (/[^0-9a-zA-Z]/.test(pw)) score += 1;
  if (pw.length >= 12) score += 1;
  return { score, pct: Math.round((score / 5) * 100) };
}

export default function SettingsPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [sheet, setSheet] = useState("");
  const [toast, setToast] = useState("");

  const [settings, setSettings] = useState({
    pushNotification: true,
    bookingNotification: true,
    reminderNotification: true,
    organizerUpdateNotification: true,
    messageNotification: true,
  });

  const [pw, setPw] = useState(EMPTY_PW);
  const [pwErr, setPwErr] = useState({});
  const [pwShow, setPwShow] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwAlert, setPwAlert] = useState("");
  const [pwDone, setPwDone] = useState(false);

  const [blocked, setBlocked] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [blockedErr, setBlockedErr] = useState(false);
  const [unblocking, setUnblocking] = useState("");

  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");

  const flash = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const loadSettings = useCallback(async () => {
    try {
      const res = await apiClient.get("/userSetting", { skipToast: true });
      if (res?.status && res?.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
          pushNotification: res.data.pushNotification !== false,
          bookingNotification: res.data.bookingNotification !== false,
          reminderNotification: res.data.reminderNotification !== false,
          organizerUpdateNotification: res.data.organizerUpdateNotification !== false,
          messageNotification: res.data.messageNotification !== false,
        }));
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }, []);

  const loadBlocked = useCallback(async () => {
    setBlockedLoading(true);
    setBlockedErr(false);
    try {
      const res = await apiClient.get("/block/list", { params: { pageNo: 1, size: 100 }, skipToast: true });
      if (res?.status) {
        setBlocked(res.data?.blockedUsers || []);
      } else {
        setBlockedErr(true);
      }
    } catch (e) {
      setBlockedErr(true);
    } finally {
      setBlockedLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = `${t("settings") || "Settings"} - Bondy`;
    loadSettings();
    loadBlocked();
  }, [t, loadSettings, loadBlocked]);

  const handleToggle = async (field) => {
    const currentValue = settings ? settings[field] !== false : true;
    const newValue = !currentValue;

    setSettings((prev) => {
      const base = prev || {
        pushNotification: true,
        bookingNotification: true,
        reminderNotification: true,
        organizerUpdateNotification: true,
        messageNotification: true,
      };
      const updated = { ...base, [field]: newValue };

      if (field === "pushNotification") {
        updated.bookingNotification = newValue;
        updated.reminderNotification = newValue;
        updated.organizerUpdateNotification = newValue;
        updated.messageNotification = newValue;
      } else {
        const anyActiveSub =
          updated.bookingNotification !== false ||
          updated.reminderNotification !== false ||
          updated.organizerUpdateNotification !== false ||
          updated.messageNotification !== false;
        if (anyActiveSub && base.pushNotification === false) {
          updated.pushNotification = true;
        } else if (!anyActiveSub && base.pushNotification !== false) {
          updated.pushNotification = false;
        }
      }
      return updated;
    });

    try {
      const res = await apiClient.post("/userSetting", { [field]: newValue }, { skipToast: true });
      if (res?.status && res?.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
          pushNotification: res.data.pushNotification !== false,
          bookingNotification: res.data.bookingNotification !== false,
          reminderNotification: res.data.reminderNotification !== false,
          organizerUpdateNotification: res.data.organizerUpdateNotification !== false,
          messageNotification: res.data.messageNotification !== false,
        }));
      }
      flash(t("settingsUpdated") || t("osNotifSaved") || "Settings updated");
    } catch (e) {
      console.error("Failed to update setting:", e);
      flash(t("failedToUpdateSettings") || t("osNotifFailed") || "Failed to update settings");
      loadSettings();
    }
  };

  const openPassword = () => {
    setPw(EMPTY_PW);
    setPwErr({});
    setPwAlert("");
    setPwDone(false);
    setPwShow(false);
    setSheet("password");
  };

  const closeSheet = () => {
    if (pwBusy || deleteBusy) return;
    setSheet("");
  };

  useEffect(() => {
    if (!sheet) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const setPwField = (key, value) => {
    setPw((prev) => ({ ...prev, [key]: value }));
    setPwErr((prev) => ({ ...prev, [key]: "" }));
    setPwAlert("");
  };

  const passwordIssues = () => {
    const e = {};
    if (!pw.current) e.current = t("osPwErrCurrent");
    if (!pw.next) e.next = t("osPwErrNext");
    else if (pw.next.length < 8) e.next = t("osPwErrLen");
    else if (!/[0-9]/.test(pw.next) || !/[a-zA-Z]/.test(pw.next)) e.next = t("osPwErrMix");
    else if (pw.current && pw.next === pw.current) e.next = t("osPwErrSame");
    if (!pw.confirm) e.confirm = t("osPwErrConfirm");
    else if (pw.next && pw.confirm !== pw.next) e.confirm = t("osPwErrMatch");
    return e;
  };

  const savePassword = async () => {
    const issues = passwordIssues();
    if (Object.keys(issues).length) {
      setPwErr(issues);
      setPwAlert(t("osPwCheck"));
      return;
    }
    setPwBusy(true);
    setPwAlert("");
    try {
      const res = await apiClient.post(
        "/user/change-password",
        { oldPassword: pw.current, newPassword: pw.next, confirmPassword: pw.confirm },
        { skipToast: true },
      );
      if (res?.status) {
        setPwDone(true);
        setPw(EMPTY_PW);
      } else {
        setPwAlert(res?.message || t("osNotifFailed"));
      }
    } catch (e) {
      setPwAlert(e?.response?.data?.message || t("osNotifFailed"));
    } finally {
      setPwBusy(false);
    }
  };

  const unblock = async (userId) => {
    setUnblocking(userId);
    try {
      const res = await apiClient.post("/block/delete", { toUser: userId }, { skipToast: true });
      if (res?.status) {
        setBlocked((prev) => prev.filter((row) => String(row.toUser?._id || row.toUser) !== String(userId)));
        flash(t("osUnblocked"));
      }
    } catch (e) {
      flash(t("osBlockedFailed"));
    } finally {
      setUnblocking("");
    }
  };

  const deleteAccount = async () => {
    setDeleteBusy(true);
    setDeleteErr("");
    try {
      const res = await apiClient.delete("/user/delete-account", { skipToast: true });
      if (res?.status) {
        localStorage.removeItem("token");
        localStorage.removeItem("userProfile");
        window.location.href = "/login";
        return;
      }
      setDeleteErr(res?.message || t("osDeleteFailed"));
    } catch (e) {
      setDeleteErr(e?.response?.data?.message || t("osDeleteFailed"));
    } finally {
      setDeleteBusy(false);
    }
  };

  const blockedLabel = () => {
    if (!Array.isArray(blocked)) return "";
    if (blocked.length === 0) return t("stBlockedEmptyCount") || "Empty";
    if (blocked.length === 1) return t("stBlockedOne", { count: 1 }) || "1 user";
    return t("stBlockedCount", { count: blocked.length }) || `${blocked.length} users`;
  };

  const strength = strengthOf(pw.next || "");

  return (
    <div className="os-wrap st-page">
      {/* General Section */}
      <section className="st-card">
        <h2>{t("general")}</h2>
        <div className="st-list">
          <div className="st-row">
            <span className="st-ico"><Glyph name="bell" /></span>
            <span className="st-copy">
              <b>{t("pushNotifications")}</b>
              <span>{t("pushNotificationsDesc")}</span>
            </span>
            <Switch
              id="os-pushNotification"
              checked={settings ? settings.pushNotification !== false : true}
              onChange={() => handleToggle("pushNotification")}
            />
          </div>
        </div>
      </section>

      {/* Notification Preferences Section */}
      <section className="st-card">
        <h2>{t("notificationPreferences")}</h2>
        <div className="st-list">
          <div className="st-row">
            <span className="st-ico"><Glyph name="calendar" /></span>
            <span className="st-copy">
              <b>{t("bookings")}</b>
              <span>{t("bookingsDesc")}</span>
            </span>
            <Switch
              id="os-bookingNotification"
              checked={settings ? settings.bookingNotification !== false : true}
              onChange={() => handleToggle("bookingNotification")}
            />
          </div>
          <div className="st-row">
            <span className="st-ico"><Glyph name="bell" /></span>
            <span className="st-copy">
              <b>{t("reminders")}</b>
              <span>{t("remindersDesc")}</span>
            </span>
            <Switch
              id="os-reminderNotification"
              checked={settings ? settings.reminderNotification !== false : true}
              onChange={() => handleToggle("reminderNotification")}
            />
          </div>
          <div className="st-row">
            <span className="st-ico"><Glyph name="user" /></span>
            <span className="st-copy">
              <b>{t("organizerUpdates")}</b>
              <span>{t("organizerUpdatesDesc")}</span>
            </span>
            <Switch
              id="os-organizerUpdateNotification"
              checked={settings ? settings.organizerUpdateNotification !== false : true}
              onChange={() => handleToggle("organizerUpdateNotification")}
            />
          </div>
          <div className="st-row">
            <span className="st-ico"><Glyph name="letter" /></span>
            <span className="st-copy">
              <b>{t("messages")}</b>
              <span>{t("messagesDesc")}</span>
            </span>
            <Switch
              id="os-messageNotification"
              checked={settings ? settings.messageNotification !== false : true}
              onChange={() => handleToggle("messageNotification")}
            />
          </div>
        </div>
      </section>

      {/* Account & Security Section */}
      <section className="st-card">
        <h2>{t("security") || "Security"}</h2>
        <div className="st-list">
          <button type="button" className="st-row" onClick={openPassword}>
            <span className="st-ico"><Glyph name="shield" /></span>
            <span className="st-copy"><b>{t("osChangePassword")}</b></span>
            <span className="st-chev"><Glyph name="chevron" size={17} /></span>
          </button>
          <button
            type="button"
            className="st-row"
            onClick={() => {
              setSheet("blocked");
              loadBlocked();
            }}
          >
            <span className="st-ico"><Glyph name="user" /></span>
            <span className="st-copy"><b>{t("osBlocked")}</b></span>
            <span className="st-meta">{blockedLabel()}</span>
            <span className="st-chev"><Glyph name="chevron" size={17} /></span>
          </button>
          <button type="button" className="st-row" onClick={() => router.push("/SupportTickets")}>
            <span className="st-copy"><b>{t("osHelp")}</b></span>
            <span className="st-chev"><Glyph name="chevron" size={17} /></span>
          </button>
          <button type="button" className="st-row" onClick={() => router.push("/privacy-policy")}>
            <span className="st-copy"><b>{t("osPrivacy")}</b></span>
            <span className="st-chev"><Glyph name="chevron" size={17} /></span>
          </button>
          <button type="button" className="st-row" onClick={() => router.push("/terms")}>
            <span className="st-copy"><b>{t("osTerms")}</b></span>
            <span className="st-chev"><Glyph name="chevron" size={17} /></span>
          </button>
        </div>
      </section>

      {/* Delete Account Section */}
      <section className="st-card">
        <div className="st-list">
          <button
            type="button"
            className="st-row"
            data-danger="1"
            onClick={() => {
              setDeleteErr("");
              setSheet("delete");
            }}
          >
            <span className="st-copy"><b>{t("osDeleteAccount")}</b></span>
            <span className="st-chev"><Glyph name="chevron" size={17} /></span>
          </button>
        </div>
      </section>

      {sheet === "password" && (
        <div className="os-scrim" onClick={closeSheet}>
          <div className="os-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="os-head">
              <div>
                <b>{t("osPwTitle")}</b>
                <span>{t("osPwSub")}</span>
              </div>
              <button type="button" className="os-x" onClick={closeSheet} aria-label={t("osClose")}>×</button>
            </div>
            {pwDone ? (
              <>
                <div className="os-res os-res-ok">
                  <b>{t("osPwDone")}</b>
                  <p>{t("osPwDoneNote")}</p>
                </div>
                <div className="os-acts">
                  <button type="button" className="os-go" onClick={closeSheet}>{t("osPwFinish")}</button>
                </div>
              </>
            ) : (
              <>
                <label className="os-f">
                  <span className="os-lb">{t("osPwCurrent")} <i>*</i></span>
                  <span className="os-pw">
                    <input
                      type={pwShow ? "text" : "password"}
                      className="os-in"
                      value={pw.current}
                      aria-invalid={!!pwErr.current}
                      onChange={(e) => setPwField("current", e.target.value)}
                    />
                    <button type="button" className="os-eye" onClick={() => setPwShow((v) => !v)}>
                      {pwShow ? t("osHide") : t("osShow")}
                    </button>
                  </span>
                  {pwErr.current && <span className="os-er">{pwErr.current}</span>}
                </label>
                <label className="os-f">
                  <span className="os-lb">{t("osPwNext")} <i>*</i></span>
                  <input
                    type={pwShow ? "text" : "password"}
                    className="os-in"
                    value={pw.next}
                    aria-invalid={!!pwErr.next}
                    onChange={(e) => setPwField("next", e.target.value)}
                  />
                  {pw.next && (
                    <span className="os-str">
                      <span className="os-strBar"><span style={{ width: `${strength.pct}%`, background: STR_COLOR[strength.score] }} /></span>
                      <span className="os-strT" style={{ color: STR_COLOR[strength.score] }}>{t(`osStr${strength.score}`)}</span>
                    </span>
                  )}
                  {pwErr.next && <span className="os-er">{pwErr.next}</span>}
                  <span className="os-hint">{t("osPwHint")}</span>
                </label>
                <label className="os-f">
                  <span className="os-lb">{t("osPwConfirm")} <i>*</i></span>
                  <input
                    type={pwShow ? "text" : "password"}
                    className="os-in"
                    value={pw.confirm}
                    aria-invalid={!!pwErr.confirm}
                    onChange={(e) => setPwField("confirm", e.target.value)}
                  />
                  {pwErr.confirm && <span className="os-er">{pwErr.confirm}</span>}
                </label>
                {pwAlert && <div className="os-alert">{pwAlert}</div>}
                <div className="os-acts">
                  <button type="button" className="os-go" disabled={pwBusy} onClick={savePassword}>
                    {pwBusy && <span className="os-sp" />}
                    {pwBusy ? t("osPwSaving") : t("osPwSave")}
                  </button>
                  <button type="button" className="os-gh" onClick={closeSheet}>{t("osClose")}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {sheet === "blocked" && (
        <div className="os-scrim" onClick={closeSheet}>
          <div className="os-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="os-head">
              <div>
                <b>{t("osBlockedTitle")}</b>
                <span>{t("osBlockedSub")}</span>
              </div>
              <button type="button" className="os-x" onClick={closeSheet} aria-label={t("osClose")}>×</button>
            </div>
            {blockedLoading && <span className="os-hint"><span className="os-sp" /> {t("osLoading")}</span>}
            {blockedErr && (
              <div className="os-empty">
                <b>{t("osBlockedFailed")}</b>
                <button type="button" className="os-gh" onClick={loadBlocked}>{t("osRetry")}</button>
              </div>
            )}
            {!blockedLoading && !blockedErr && blocked.length === 0 && (
              <div className="os-empty">
                <b>{t("osBlockedEmpty")}</b>
                <p>{t("osBlockedEmptyNote")}</p>
              </div>
            )}
            {!blockedLoading && !blockedErr && blocked.length > 0 && (
              <div className="os-people">
                {blocked.map((row) => {
                  const user = row.toUser || {};
                  const id = user._id || row.toUser;
                  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "—";
                  return (
                    <div className="os-person" key={row._id || id}>
                      <span
                        className="os-av"
                        style={user.profileImage ? { backgroundImage: `url(${getFullImageUrl(user.profileImage)})` } : undefined}
                      />
                      <b>{name}</b>
                      <button
                        type="button"
                        className="os-unblock"
                        disabled={unblocking === id}
                        onClick={() => unblock(id)}
                      >
                        {unblocking === id ? t("osSaving") : t("osUnblock")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {sheet === "delete" && (
        <div className="os-scrim" onClick={closeSheet}>
          <div className="os-sheet os-sheet-sm" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="os-head">
              <div>
                <b>{t("osDeleteTitle")}</b>
                <span>{t("osDeleteSub")}</span>
              </div>
              <button type="button" className="os-x" onClick={closeSheet} aria-label={t("osClose")}>×</button>
            </div>
            <p className="os-askp">{t("osDeleteWarn")}</p>
            {deleteErr && <div className="os-alert">{deleteErr}</div>}
            <div className="os-acts">
              <button type="button" className="os-danger" disabled={deleteBusy} onClick={deleteAccount}>
                {deleteBusy && <span className="os-sp" />}
                {deleteBusy ? t("osDeleting") : t("osDeleteConfirm")}
              </button>
              <button type="button" className="os-gh" onClick={closeSheet}>{t("osClose")}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="os-toast" role="status">{toast}</div>}
    </div>
  );
}
