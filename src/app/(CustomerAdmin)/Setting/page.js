"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import userSettingApi from "@/api/userSettingApi";
import blockUserApi from "@/api/blockUser";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import toast from "react-hot-toast";

function Glyph({ name, size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {name === "bell" && (
        <path fillRule="evenodd" d="M 10.085 0 C 5.805 0 2.335 3.47 2.335 7.75 L 2.335 8.454 C 2.335 9.151 2.129 9.832 1.742 10.412 L 0.594 12.135 C -0.74 14.135 0.278 16.853 2.597 17.485 C 3.352 17.691 4.114 17.866 4.881 18.008 L 4.883 18.013 C 5.652 20.065 7.707 21.5 10.085 21.5 C 12.463 21.5 14.518 20.065 15.287 18.013 L 15.289 18.008 C 16.056 17.866 16.818 17.691 17.573 17.485 C 19.892 16.853 20.91 14.135 19.576 12.135 L 18.428 10.412 C 18.041 9.832 17.835 9.151 17.835 8.454 L 17.835 7.75 C 17.835 3.47 14.365 0 10.085 0 Z M 13.461 18.287 C 11.218 18.555 8.951 18.555 6.708 18.287 C 7.419 19.308 8.656 20 10.085 20 C 11.514 20 12.75 19.308 13.461 18.287 Z M 3.835 7.75 C 3.835 4.298 6.633 1.5 10.085 1.5 C 13.537 1.5 16.335 4.298 16.335 7.75 L 16.335 8.454 C 16.335 9.447 16.629 10.418 17.18 11.244 L 18.328 12.967 C 19.094 14.115 18.509 15.675 17.179 16.038 C 12.534 17.305 7.636 17.305 2.991 16.038 C 1.661 15.675 1.076 14.115 1.842 12.967 L 2.99 11.244 C 3.541 10.418 3.835 9.447 3.835 8.454 L 3.835 7.75 Z" transform="matrix(1 0 0 1 1.915 1.25)" />
      )}
      {name === "calendar" && (
        <path fillRule="evenodd" d="M 5.75 0 C 6.164 0 6.5 0.336 6.5 0.75 L 6.5 1.513 C 7.162 1.5 7.891 1.5 8.693 1.5 L 12.806 1.5 C 13.609 1.5 14.338 1.5 15 1.513 L 15 0.75 C 15 0.336 15.336 0 15.75 0 C 16.164 0 16.5 0.336 16.5 0.75 L 16.5 1.577 C 16.76 1.597 17.006 1.622 17.239 1.653 C 18.411 1.811 19.36 2.143 20.109 2.891 C 20.857 3.64 21.189 4.589 21.347 5.761 C 21.5 6.9 21.5 8.356 21.5 10.194 L 21.5 12.306 C 21.5 14.144 21.5 15.6 21.347 16.739 C 21.189 17.911 20.857 18.86 20.109 19.609 C 19.36 20.357 18.411 20.689 17.239 20.847 C 16.1 21 14.644 21 12.806 21 L 8.694 21 C 6.856 21 5.4 21 4.261 20.847 C 3.089 20.689 2.14 20.357 1.391 19.609 C 0.643 18.86 0.311 17.911 0.153 16.739 C 0 15.6 0 14.144 0 12.306 L 0 10.194 C 0 8.356 0 6.9 0.153 5.761 C 0.311 4.589 0.643 3.64 1.391 2.891 C 2.14 2.143 3.089 1.811 4.261 1.653 C 4.494 1.622 4.74 1.597 5 1.577 L 5 0.75 C 5 0.336 5.336 0 5.75 0 Z M 4.461 3.14 C 3.455 3.275 2.875 3.529 2.452 3.952 C 2.029 4.375 1.775 4.955 1.64 5.961 C 1.617 6.131 1.598 6.311 1.582 6.5 L 19.918 6.5 C 19.902 6.311 19.883 6.131 19.86 5.961 C 19.725 4.955 19.471 4.375 19.048 3.952 C 18.625 3.529 18.045 3.275 17.039 3.14 C 16.011 3.002 14.657 3 12.75 3 L 8.75 3 C 6.843 3 5.489 3.002 4.461 3.14 Z M 1.5 10.25 C 1.5 9.396 1.5 8.653 1.513 8 L 19.987 8 C 20 8.653 20 9.396 20 10.25 L 20 12.25 C 20 14.157 19.998 15.511 19.86 16.539 C 19.725 17.545 19.471 18.125 19.048 18.548 C 18.625 18.971 18.045 19.225 17.039 19.36 C 16.011 19.498 14.657 19.5 12.75 19.5 L 8.75 19.5 C 6.843 19.5 5.489 19.498 4.461 19.36 C 3.455 19.225 2.875 18.971 2.452 18.548 C 2.029 18.125 1.775 17.545 1.64 16.539 C 1.502 15.511 1.5 14.157 1.5 12.25 L 1.5 10.25 Z" transform="matrix(1 0 0 1 1.25 1.75)" />
      )}
      {name === "globe" && (
        <path fillRule="evenodd" d="M 7.956 1.932 C 7.704 2.012 7.455 2.103 7.21 2.204 C 6.088 2.669 5.068 3.35 4.209 4.209 C 3.35 5.068 2.669 6.088 2.204 7.21 C 1.835 8.101 1.608 9.042 1.53 10 L 6.011 10 C 6.043 8.904 6.145 7.824 6.315 6.801 C 6.523 5.546 6.83 4.389 7.225 3.4 C 7.441 2.861 7.685 2.366 7.956 1.932 Z M 10.75 0 C 9.338 0 7.94 0.278 6.636 0.818 C 5.332 1.359 4.147 2.15 3.149 3.149 C 2.15 4.147 1.359 5.332 0.818 6.636 C 0.278 7.94 0 9.338 0 10.75 C 0 12.162 0.278 13.56 0.818 14.864 C 1.359 16.168 2.15 17.353 3.149 18.351 C 4.147 19.35 5.332 20.141 6.636 20.682 C 7.94 21.222 9.338 21.5 10.75 21.5 C 12.162 21.5 13.56 21.222 14.864 20.682 C 16.168 20.141 17.353 19.35 18.351 18.351 C 19.35 17.353 20.141 16.168 20.682 14.864 C 21.222 13.56 21.5 12.162 21.5 10.75 C 21.5 9.338 21.222 7.94 20.682 6.636 C 20.141 5.332 19.35 4.147 18.351 3.149 C 17.353 2.15 16.168 1.359 14.864 0.818 C 13.56 0.278 12.162 0 10.75 0 Z M 10.75 1.5 C 10.489 1.5 10.151 1.626 9.759 2.032 C 9.363 2.442 8.968 3.083 8.618 3.957 C 8.271 4.826 7.988 5.874 7.794 7.046 C 7.639 7.986 7.543 8.983 7.512 10 L 13.988 10 C 13.957 8.983 13.861 7.986 13.706 7.046 C 13.512 5.874 13.229 4.826 12.882 3.957 C 12.532 3.083 12.137 2.442 11.741 2.032 C 11.349 1.626 11.011 1.5 10.75 1.5 Z M 15.489 10 C 15.457 8.904 15.355 7.824 15.185 6.801 C 14.977 5.546 14.67 4.389 14.275 3.4 C 14.059 2.861 13.815 2.366 13.544 1.932 C 13.796 2.012 14.045 2.103 14.29 2.204 C 15.412 2.669 16.432 3.35 17.291 4.209 C 18.15 5.068 18.831 6.088 19.296 7.21 C 19.665 8.101 19.892 9.042 19.97 10 L 15.489 10 Z M 13.988 11.5 L 7.512 11.5 C 7.543 12.517 7.639 13.514 7.794 14.454 C 7.988 15.626 8.271 16.674 8.618 17.543 C 8.968 18.417 9.363 19.058 9.759 19.468 C 10.151 19.874 10.489 20 10.75 20 C 11.011 20 11.349 19.874 11.741 19.468 C 12.137 19.058 12.532 18.417 12.882 17.543 C 13.229 16.674 13.512 15.626 13.706 14.454 C 13.861 13.514 13.957 12.517 13.988 11.5 Z M 13.544 19.568 C 13.815 19.134 14.059 18.639 14.275 18.1 C 14.67 17.111 14.977 15.954 15.185 14.699 C 15.355 13.676 15.457 12.596 15.489 11.5 L 19.97 11.5 C 19.892 12.458 19.665 13.399 19.296 14.29 C 18.831 15.412 18.15 16.432 17.291 17.291 C 16.432 18.15 15.412 18.831 14.29 19.296 C 14.045 19.397 13.796 19.488 13.544 19.568 Z M 7.956 19.568 C 7.685 19.134 7.441 18.639 7.225 18.1 C 6.83 17.111 6.523 15.954 6.315 14.699 C 6.145 13.676 6.043 12.596 6.011 11.5 L 1.53 11.5 C 1.608 12.458 1.835 13.399 2.204 14.29 C 2.669 15.412 3.35 16.432 4.209 17.291 C 5.068 18.15 6.088 18.831 7.21 19.296 C 7.455 19.397 7.704 19.488 7.956 19.568 Z" transform="matrix(1 0 0 1 1.25 1.25)" />
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

function page() {
  const { t, language, changeLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [blocked, setBlocked] = useState(null);
  const [blockedErr, setBlockedErr] = useState(false);
  const [unblocking, setUnblocking] = useState("");

  const [settings, setSettings] = useState({
    pushNotification: true,
    bookingNotification: true,
    reminderNotification: true,
    organizerUpdateNotification: true,
    messageNotification: true,
    appTheme: "dark",
    language: "English"
  });

  useEffect(() => {
    document.title = `${t("settings") || "Settings"} - Bondy`;
  }, [t]);

  useEffect(() => {
    fetchSettings();
    fetchBlocked();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await userSettingApi.getUserSetting();
      if (res?.status && res?.data) {
        setSettings(res.data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocked = async () => {
    setBlockedErr(false);
    try {
      const res = await blockUserApi.getBlockedUsers({ pageNo: 1, size: 100 });
      if (res?.status) {
        setBlocked(res.data?.blockedUsers || []);
      } else {
        setBlockedErr(true);
      }
    } catch (error) {
      setBlockedErr(true);
    }
  };

  const handleToggle = async (field) => {
    const newValue = !settings[field];

    setSettings(prev => {
      const updated = { ...prev, [field]: newValue };

      if (field === "pushNotification") {
        updated.bookingNotification = newValue;
        updated.reminderNotification = newValue;
        updated.organizerUpdateNotification = newValue;
        updated.messageNotification = newValue;
      } else {
        const anyActiveSub = updated.bookingNotification ||
          updated.reminderNotification ||
          updated.organizerUpdateNotification ||
          updated.messageNotification;
        if (anyActiveSub && !prev.pushNotification) {
          updated.pushNotification = true;
        } else if (!anyActiveSub && prev.pushNotification) {
          updated.pushNotification = false;
        }
      }
      return updated;
    });

    try {
      await userSettingApi.updateUserSetting({ [field]: newValue });
      toast.success(t("settingsUpdated") || "Settings updated");
    } catch (error) {
      console.error("Failed to update setting:", error);
      toast.error(t("failedToUpdateSettings") || "Failed to update settings");
      fetchSettings();
    }
  };

  const handleLanguageChange = async (code) => {
    if (code === language) return;
    try {
      if (changeLanguage) await changeLanguage(code);
      toast.success(t("languageUpdated") || "Language updated");
    } catch (error) {
      console.error("Failed to update language:", error);
      toast.error(t("failedToUpdateLanguage") || "Failed to update language");
    }
  };

  const unblock = async (userId) => {
    setUnblocking(userId);
    try {
      const res = await blockUserApi.unblockUser({ toUser: userId }, { skipToast: true });
      if (res?.status) {
        setBlocked((prev) => (prev || []).filter((row) => String(row.toUser?._id || row.toUser) !== String(userId)));
        toast.success(t("stUnblocked"));
      }
    } catch (error) {
      toast.error(t("failedToUnblockUser"));
    } finally {
      setUnblocking("");
    }
  };

  const blockedLabel = () => {
    if (!Array.isArray(blocked)) return "";
    if (blocked.length === 0) return t("stBlockedEmptyCount");
    if (blocked.length === 1) return t("stBlockedOne", { count: 1 });
    return t("stBlockedCount", { count: blocked.length });
  };

  if (loading) {
    return <div className="text-center py-5">{t("loading")}...</div>;
  }

  return (
    <div className="st-page">
      <section className="st-card">
        <h2>{t("settings") || "Settings"}</h2>
        <p className="st-lead">{t("stLead")}</p>
        <div className="st-list">
          <div className="st-row st-lang">
            <span className="st-ico"><Glyph name="globe" /></span>
            <span className="st-copy"><b>{t("stLang")}</b></span>
            <span className="st-seg" role="group" aria-label={t("stLang")}>
              <button type="button" aria-selected={language === "mn"} onClick={() => handleLanguageChange("mn")}>
                {t("stLangMn")}
              </button>
              <button type="button" aria-selected={language === "en"} onClick={() => handleLanguageChange("en")}>
                {t("stLangEn")}
              </button>
            </span>
          </div>
          <button type="button" className="st-row" onClick={() => setBlockedOpen(true)}>
            <span className="st-ico"><Glyph name="user" /></span>
            <span className="st-copy"><b>{t("osBlocked")}</b></span>
            <span className="st-meta">{blockedLabel()}</span>
            <span className="st-chev"><Glyph name="chevron" size={17} /></span>
          </button>
          <Link href="/Security" className="st-row">
            <span className="st-ico"><Glyph name="shield" /></span>
            <span className="st-copy"><b>{t("security")}</b></span>
            <span className="st-chev"><Glyph name="chevron" size={17} /></span>
          </Link>
        </div>
      </section>

      <section className="st-card">
        <h2>{t("general")}</h2>
        <div className="st-list">
          <div className="st-row">
            <span className="st-ico"><Glyph name="bell" /></span>
            <span className="st-copy">
              <b>{t("pushNotifications")}</b>
              <span>{t("pushNotificationsDesc")}</span>
            </span>
            <Switch id="pushNotification" checked={!!settings.pushNotification} onChange={() => handleToggle("pushNotification")} />
          </div>
        </div>
      </section>

      <section className="st-card">
        <h2>{t("notificationPreferences")}</h2>
        <div className="st-list">
          <div className="st-row">
            <span className="st-ico"><Glyph name="calendar" /></span>
            <span className="st-copy">
              <b>{t("bookings")}</b>
              <span>{t("bookingsDesc")}</span>
            </span>
            <Switch id="bookingNotification" checked={!!settings.bookingNotification} onChange={() => handleToggle("bookingNotification")} />
          </div>
          <div className="st-row">
            <span className="st-ico"><Glyph name="bell" /></span>
            <span className="st-copy">
              <b>{t("reminders")}</b>
              <span>{t("remindersDesc")}</span>
            </span>
            <Switch id="reminderNotification" checked={!!settings.reminderNotification} onChange={() => handleToggle("reminderNotification")} />
          </div>
          <div className="st-row">
            <span className="st-ico"><Glyph name="user" /></span>
            <span className="st-copy">
              <b>{t("organizerUpdates")}</b>
              <span>{t("organizerUpdatesDesc")}</span>
            </span>
            <Switch id="organizerUpdateNotification" checked={!!settings.organizerUpdateNotification} onChange={() => handleToggle("organizerUpdateNotification")} />
          </div>
          <div className="st-row">
            <span className="st-ico"><Glyph name="letter" /></span>
            <span className="st-copy">
              <b>{t("messages")}</b>
              <span>{t("messagesDesc")}</span>
            </span>
            <Switch id="messageNotification" checked={!!settings.messageNotification} onChange={() => handleToggle("messageNotification")} />
          </div>
        </div>
      </section>

      {blockedOpen && (
        <div className="st-scrim" onClick={() => setBlockedOpen(false)}>
          <div className="st-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="st-sheet-head">
              <h2>{t("osBlocked")}</h2>
              <button type="button" className="st-x" aria-label={t("close")} onClick={() => setBlockedOpen(false)}>×</button>
            </div>
            {blockedErr && (
              <div className="st-empty">
                <b>{t("osBlockedFailed")}</b>
                <button type="button" className="st-unblock" onClick={fetchBlocked}>{t("osRetry") || t("retry")}</button>
              </div>
            )}
            {!blockedErr && Array.isArray(blocked) && blocked.length === 0 && (
              <div className="st-empty">
                <span className="st-empty-ico"><Glyph name="user" size={24} /></span>
                <b>{t("stBlockedNone")}</b>
                <p>{t("stBlockedHint")}</p>
              </div>
            )}
            {!blockedErr && Array.isArray(blocked) && blocked.length > 0 && (
              <div className="st-people">
                {blocked.map((row) => {
                  const user = row.toUser || {};
                  const id = user._id || row.toUser;
                  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "—";
                  return (
                    <div className="st-person" key={row._id || id}>
                      <span
                        className="st-av"
                        style={user.profileImage ? { backgroundImage: `url(${getFullImageUrl(user.profileImage)})` } : undefined}
                      />
                      <b>{name}</b>
                      <button type="button" className="st-unblock" disabled={unblocking === id} onClick={() => unblock(id)}>
                        {t("unblock")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default page;
