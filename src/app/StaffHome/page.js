"use client";
import React, { useState, useEffect, useRef } from "react";
import { Spinner, Modal } from "react-bootstrap";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import staffApi from "@/api/staffApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import jsQR from "jsqr";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

function StaffHome() {
  const router = useRouter();
  const { t } = useLanguage();

  // Authentication check
  const [authorized, setAuthorized] = useState(false);
  const [staffProfile, setStaffProfile] = useState(null);

  // Tab navigation: "home" | "scan" | "attendees" | "history"
  const [activeTab, setActiveTab] = useState("home");

  // Assigned entities (events/courses) states
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(true);
  const [activeEntity, setActiveEntity] = useState(null); // The selected active event/course
  const [entityType, setEntityType] = useState("event"); // "event" | "course"

  // Attendees states (manual check-in tab)
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [attendeeStats, setAttendeeStats] = useState({ total: 0, checkedIn: 0 });

  // Scan History states
  const [scanHistory, setScanHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Overlay states
  const [showAssignedEventsOverlay, setShowAssignedEventsOverlay] = useState(false);
  const [showEventDetailsOverlay, setShowEventDetailsOverlay] = useState(false);
  const [detailsSource, setDetailsSource] = useState("home"); // "home" | "list"
  const [detailEntity, setDetailEntity] = useState(null);
  const [pendingTabSelection, setPendingTabSelection] = useState(null); // null | "scan" | "attendees" | "history"
  const [overlayTab, setOverlayTab] = useState("events"); // "events" | "courses"

  // Scanner states
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [manualTicketNumber, setManualTicketNumber] = useState("");
  const [checkingInScanner, setCheckingInScanner] = useState(false);

  // Ticket Verification States
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifiedTicket, setVerifiedTicket] = useState(null);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [originalCode, setOriginalCode] = useState("");

  // Profile & Password Update Overlay States
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  const [showChangePasswordOverlay, setShowChangePasswordOverlay] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check authorization
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const profileStr = localStorage.getItem("userProfile");
      if (!token || !profileStr) {
        toast.error("Access denied. Please login.");
        router.push("/login");
        return;
      }
      try {
        const profile = JSON.parse(profileStr);
        if (profile.roleId !== 5 && profile.userRole !== "STAFF") {
          toast.error("Access denied. Staff only.");
          router.push("/login");
          return;
        }
        setStaffProfile(profile);
        setAuthorized(true);
      } catch (err) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  // Load Assigned Events/Courses
  const loadAssignedData = async () => {
    try {
      setLoadingAssigned(true);
      const res = await staffApi.getAssigned();
      if (res?.status) {
        const events = res.data?.events || [];
        const courses = res.data?.courses || [];
        setAssignedEvents(events);
        setAssignedCourses(courses);
        setActiveEntity(null); // No event selected by default
        setEntityType("event");
      }
    } catch (err) {
      console.error("Failed to load assigned items", err);
      // toast.error("Failed to load assigned events/courses");
    } finally {
      setLoadingAssigned(false);
    }
  };

  const handleTabClick = (tabName) => {
    if (tabName === "home") {
      setActiveTab("home");
      return;
    }

    if (!activeEntity) {
      setPendingTabSelection(tabName);
      setShowAssignedEventsOverlay(true);
      // toast.error("Please select an event or course first.");
      return;
    }

    setActiveTab(tabName);
  };

  const [detailStats, setDetailStats] = useState({ total: 0, checkedIn: 0 });
  const [loadingDetailStats, setLoadingDetailStats] = useState(false);

  useEffect(() => {
    const fetchDetailStats = async () => {
      if (!detailEntity) return;
      try {
        setLoadingDetailStats(true);
        const res = await staffApi.getEventAttendees(detailEntity._id, { limit: 1 });
        if (res?.status) {
          const list = res.data?.attendees || [];
          setDetailStats({
            total: res.data?.stats?.totalAttendees || list.length,
            checkedIn: res.data?.stats?.checkedIn || list.filter(a => a.isCheckedIn).length,
          });
        }
      } catch (err) {
        console.error("Failed to load details stats", err);
      } finally {
        setLoadingDetailStats(false);
      }
    };
    fetchDetailStats();
  }, [detailEntity]);

  useEffect(() => {
    if (authorized) {
      loadAssignedData();
    }
  }, [authorized]);

  // Fetch attendees list whenever active entity changes
  const fetchAttendeesList = async () => {
    if (!activeEntity) return;
    try {
      setLoadingAttendees(true);
      const entityId = activeEntity._id;
      let res;
      if (entityType === "event") {
        res = await staffApi.getEventBookingAttendees(entityId, { limit: 1000 });
      } else {
        res = await staffApi.getCourseBookingAttendees(entityId, { limit: 1000 });
      }
      if (res?.status) {
        const list = res.data?.attendees || [];
        setAttendees(list);

        let total = 0;
        let checkedIn = 0;
        list.forEach(a => {
          total += a.qty || a.tickets?.totalQty || 0;
          checkedIn += a.checkedInQty || a.tickets?.checkedInQty || 0;
        });

        setAttendeeStats({
          total,
          checkedIn,
        });
      }
    } catch (err) {
      console.error("Failed to load attendees", err);
    } finally {
      setLoadingAttendees(false);
    }
  };

  useEffect(() => {
    if (activeEntity) {
      fetchAttendeesList();
    }
  }, [activeEntity]);

  // Load Scan History
  const fetchScanHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await staffApi.getScanHistory();
      if (res?.status) {
        setScanHistory(res.data?.scanHistory || res.data || []);
      }
    } catch (err) {
      console.error("Failed to load scan history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history" && authorized) {
      fetchScanHistory();
    }
  }, [activeTab, authorized]);

  // Camera handling for QR Scanner
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const isProcessingQR = useRef(false);

  const handleVerifyCode = async (code) => {
    if (!code || !code.trim()) {
      toast.error("Invalid ticket or QR code");
      return;
    }
    setOriginalCode(code);
    setVerifyError(null);
    setVerifiedTicket(null);
    setShowVerifyModal(true);
    setLoadingVerify(true);
    try {
      const payload = {
        code: code.trim()
      };
      if (activeEntity) {
        payload.entityId = activeEntity._id;
      }
      const res = await staffApi.verifyTicket(payload);
      if (res?.status) {
        setVerifiedTicket(res.data);
      } else {
        setVerifyError(res?.message || "Failed to verify ticket");
      }
    } catch (err) {
      console.error("Verification failed", err);
      setVerifyError(err?.response?.data?.message || "Verification failed");
    } finally {
      setLoadingVerify(false);
    }
  };

  const handlePerformCheckIn = async () => {
    if (!originalCode) return;
    try {
      setCheckingIn(true);
      const payload = {
        ticketNumber: originalCode.trim()
      };
      if (activeEntity) {
        payload.entityId = activeEntity._id;
      }
      const res = await staffApi.checkInAttendee(payload);
      if (res?.status) {
        toast.success(res.message || `Check-in successful: ${res.data?.attendee?.firstName || ""} ${res.data?.attendee?.lastName || ""}`);
        setShowVerifyModal(false);
        setManualTicketNumber("");
        setVerifiedTicket(null);
        setOriginalCode("");
        fetchAttendeesList();
        fetchScanHistory();
      }
    } catch (err) {
      console.error("Check-in failed", err);
      toast.error(err?.response?.data?.message || "Check-in failed");
    } finally {
      setCheckingIn(false);
      setTimeout(() => {
        isProcessingQR.current = false;
      }, 1500);
    }
  };

  const handlePerformCheckInForSlot = async (selectedDate, batchId) => {
    if (!originalCode) return;
    try {
      setCheckingIn(true);
      const payload = {
        ticketNumber: originalCode.trim(),
        selectedDate,
        batchId
      };
      if (activeEntity) {
        payload.entityId = activeEntity._id;
      }
      const res = await staffApi.checkInAttendee(payload);
      if (res?.status) {
        toast.success(res.message || "Session Check-in successful");
        setShowVerifyModal(false);
        setManualTicketNumber("");
        setVerifiedTicket(null);
        setOriginalCode("");
        fetchAttendeesList();
        fetchScanHistory();
      }
    } catch (err) {
      console.error("Session Check-in failed", err);
      toast.error(err?.response?.data?.message || "Session Check-in failed");
    } finally {
      setCheckingIn(false);
      setTimeout(() => {
        isProcessingQR.current = false;
      }, 1500);
    }
  };

  const closeVerifyModal = () => {
    setShowVerifyModal(false);
    setVerifiedTicket(null);
    setVerifyError(null);
    setOriginalCode("");
    setTimeout(() => {
      isProcessingQR.current = false;
    }, 1500);
  };

  const handleQRDetected = async (qrData) => {
    if (isProcessingQR.current) return;
    isProcessingQR.current = true;
    handleVerifyCode(qrData);
  };

  useEffect(() => {
    if (activeTab === "scan") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab]);

  useEffect(() => {
    let active = true;
    let animationFrameId;

    const scanFrame = () => {
      if (!active) return;
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code) {
          handleQRDetected(code.data);
        }
      }
      animationFrameId = requestAnimationFrame(scanFrame);
    };

    if (activeTab === "scan") {
      scanFrame();
    }

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeTab, activeEntity]);

  const handleCheckInSubmit = async (ticketNum) => {
    if (!ticketNum.trim()) {
      toast.error("Please enter a ticket number");
      return;
    }
    handleVerifyCode(ticketNum);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$&*~%^()_+=\[\]{};:<>|./?,-]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error("Password must be at least 8 characters and include uppercase, lowercase, number, and special character");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setUpdatingPassword(true);
      const res = await staffApi.changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });
      if (res?.status) {
        toast.success("Password updated successfully");
        setShowChangePasswordOverlay(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error("Failed to update password", err);
      toast.error(err?.response?.data?.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (!authorized) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-black text-white">
        <Spinner animation="border" variant="teal" />
      </div>
    );
  }

  // Filtered attendees for manual check-in list
  const filteredAttendees = attendees.filter(a => {
    const q = attendeeSearch.toLowerCase();
    const name = `${a.user?.firstName || ""} ${a.user?.lastName || ""}`.toLowerCase();
    return name.includes(q) || a.bookingId?.toLowerCase().includes(q) || a.user?.email?.toLowerCase().includes(q);
  });

  return (
    <div className="staff-app-container">
      <style jsx global>{`
        body {
          background: #000 !important;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
        }
        .staff-app-container {
          width: 100%;
          max-width: 440px;
          min-height: 100vh;
          background: #000;
          position: relative;
          padding-bottom: 90px; /* space for bottom nav bar */
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
        }

        /* Bottom Nav Bar */
        .bottom-nav-bar {
          position: fixed;
          bottom: 0;
          width: 100%;
          max-width: 440px;
          height: 75px;
          background: rgba(18, 18, 18, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 1000;
          border-radius: 20px 20px 0 0;
        }
        .nav-tab-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: transparent;
          border: none;
          color: #7c7c7c;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s ease;
          gap: 4px;
        }
        .nav-tab-item.active {
          color: #23ada4;
        }
        .nav-tab-item svg {
          width: 22px;
          height: 22px;
        }

        /* Common Screen Header */
        .screen-header {
          padding: 20px 20px 10px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .screen-header h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          color: #fff;
        }
        .logout-btn-header {
          background: transparent;
          border: none;
          color: #ff5c5c;
          font-weight: 600;
          font-size: 14px;
        }

        /* Screen Wrapper */
        .screen-body {
          flex: 1;
          padding: 10px 20px;
        }

        /* Event Card styling */
        .event-main-card {
          background: #121212;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 16px;
          margin-bottom: 25px;
          display: flex;
          align-items: center;
          gap: 15px;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }
        .event-main-card:hover {
          border-color: rgba(35, 173, 164, 0.5);
        }
        .event-main-card.active-entity-card {
          border-color: #23ada4 !important;
          box-shadow: 0 0 10px rgba(35, 173, 164, 0.2);
        }
        .active-badge {
          background: rgba(35, 173, 164, 0.15);
          color: #23ada4;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 10px;
          text-transform: uppercase;
        }
        .event-card-img {
          width: 75px;
          height: 75px;
          border-radius: 12px;
          object-fit: cover;
          background: #2a2a2a;
        }
        .event-card-details h5 {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 4px 0;
        }
        .event-card-details p.category {
          color: #7c7c7c;
          font-size: 12px;
          margin: 0 0 6px 0;
        }
        .event-card-details p.info-line {
          font-size: 12px;
          color: #23ada4;
          margin: 0 0 3px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Quick Actions list */
        .quick-action-row {
          background: #121212;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 18px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .quick-action-row:hover {
          background: #181818;
        }
        .quick-action-lft {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .quick-action-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: rgba(35, 173, 164, 0.1);
          color: #23ada4;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .quick-action-icon svg {
          width: 20px;
          height: 20px;
        }
        .quick-action-text h6 {
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 2px 0;
        }
        .quick-action-text p {
          font-size: 12px;
          color: #7c7c7c;
          margin: 0;
        }

        /* Scan Tab */
        .scan-camera-wrapper {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 24px;
          background: #000;
          overflow: hidden;
          position: relative;
          border: 2px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 25px;
        }
        .scan-camera-wrapper video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .scan-overlay-guides {
          position: absolute;
          inset: 40px;
          border: 2px dashed rgba(35, 173, 164, 0.8);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .scan-laser-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: #23ada4;
          box-shadow: 0 0 8px #23ada4;
          animation: scanAnimation 2s infinite linear;
        }
        @keyframes scanAnimation {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .scanner-manual-input-box {
          background: #121212;
          border-radius: 16px;
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .scanner-manual-input-box input {
          width: 100%;
          height: 48px;
          background: #1e1e1e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #fff;
          padding: 0 15px;
          outline: none;
          font-weight: 500;
          text-align: center;
          margin-bottom: 12px;
        }
        .scanner-manual-input-box button {
          width: 100%;
          height: 48px;
          background: #23ada4;
          color: #fff;
          border-radius: 24px;
          border: none;
          font-weight: 600;
        }

        /* Attendees list view */
        .attendees-search-box {
          width: 100%;
          height: 48px;
          background: #121212;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 0 20px;
          color: #fff;
          outline: none;
          margin-bottom: 15px;
        }
        .attendees-stats-header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #7c7c7c;
          margin-bottom: 15px;
          padding: 0 5px;
        }
        .attendee-list-scroll {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: calc(100vh - 270px);
          overflow-y: auto;
        }
        .attendee-item-row {
          background: #121212;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .attendee-item-row:hover {
          background: #181818;
          border-color: rgba(35, 173, 164, 0.5);
        }
        .attendee-item-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }
        .attendee-item-avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: #2e2e2e;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        .attendee-item-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .attendee-item-text {
          min-width: 0;
        }
        .attendee-item-text h6 {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 3px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .attendee-item-text p {
          font-size: 12px;
          color: #7c7c7c;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .checkin-action-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(35, 173, 164, 0.1);
          color: #23ada4;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .checkin-action-btn.checked {
          background: rgba(52, 199, 89, 0.1);
          color: #34c759;
          cursor: default;
        }

        /* Scan History View */
        .history-list-scroll {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }
        .history-item-row {
          background: #121212;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .history-info h6 {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 3px 0;
        }
        .history-info p {
          font-size: 11px;
          color: #7c7c7c;
          margin: 0;
        }
        .history-time {
          font-size: 12px;
          color: #23ada4;
          font-weight: 500;
        }

        /* Overlay views */
        .custom-staff-overlay {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 440px;
          height: 100%;
          background: #000;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          animation: slideUpAnimation 0.25s ease-out;
        }
        @keyframes slideUpAnimation {
          from { transform: translate(-50%, 100%); }
          to { transform: translate(-50%, 0%); }
        }
        .overlay-header {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .overlay-header h2 {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          color: #fff;
        }
        .overlay-body {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        /* Details Overlay view card styling */
        .details-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          background: #121212;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 30px;
          text-align: center;
        }
        .details-stat-box h3 {
          font-size: 20px;
          font-weight: 700;
          color: #23ada4;
          margin: 0 0 4px 0;
        }
        .details-stat-box p {
          font-size: 11px;
          color: #7c7c7c;
          margin: 0;
        }

        /* Quick action bottom bar inside details view */
        .details-quick-actions-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: auto;
        }
        .details-action-btn {
          height: 50px;
          background: #121212;
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #fff;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .details-action-btn:hover {
          background: #181818;
          border-color: #23ada4;
        }

        .verify-modal-content {
          background: #121212 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 20px !important;
          color: #fff !important;
        }
        .verify-error-icon {
          font-size: 48px;
          color: #ff5c5c;
        }
        .verify-label {
          color: #8c8c8c;
          font-size: 12px;
          display: block;
          margin-bottom: 2px;
        }
        .verify-val {
          font-size: 15px;
          font-weight: 600;
          color: #fff;
        }
        .verify-section {
          background: #1a1a1a;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .verify-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }
        .verify-row .verify-label {
          margin: 0;
        }
        .verify-row .verify-val {
          font-size: 13px;
        }
        .badge-status {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          width: 100%;
        }
        .badge-status.valid {
          background: rgba(35, 173, 164, 0.15);
          color: #23ada4;
        }
        .badge-status.checked-in {
          background: rgba(255, 160, 0, 0.15);
          color: #ffa000;
        }
        .badge-status.expired {
          background: rgba(255, 92, 92, 0.15);
          color: #ff5c5c;
        }
      `}</style>

      {/* --------------------------------------------------------------- */}
      {/* 1. HOME VIEW */}
      {/* --------------------------------------------------------------- */}
      {activeTab === "home" && (
        <>
          <div className="screen-header">
            <h1>{t("staff") || "Staff"}</h1>
            {(() => {
              const imageUrl = staffProfile?.profileImage || staffProfile?.profilePhoto;
              if (imageUrl) {
                return (
                  <img
                    src={getFullImageUrl(imageUrl)}
                    alt="profile"
                    onClick={() => setShowProfileOverlay(true)}
                    style={{ width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", objectFit: "cover", border: "2px solid #23ada4" }}
                  />
                );
              }
              return (
                <div
                  onClick={() => setShowProfileOverlay(true)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    background: "#23ada4",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "14px",
                    border: "2px solid #23ada4"
                  }}
                >
                  {staffProfile?.firstName?.charAt(0).toUpperCase() || "S"}
                </div>
              );
            })()}
          </div>
          <div className="screen-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0" style={{ fontSize: "15px", fontWeight: "600", color: "#8c8c8c" }}>
                {activeEntity ? (activeEntity.courseTitle ? (t("activeCourse") || "Your Active Course") : (t("activeEvent") || "Your Active Event")) : (t("activeEventOrCourse") || "Your Active Event / Course")}
              </h5>
              <button
                onClick={() => {
                  setDetailsSource("home");
                  setShowAssignedEventsOverlay(true);
                }}
                style={{
                  background: "transparent",
                  color: "#23ada4",
                  border: "none",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                {t("viewAll") || "View All"}
              </button>
            </div>

            {loadingAssigned ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="teal" />
              </div>
            ) : activeEntity ? (
              <div
                className="event-main-card active-entity-card"
                onClick={() => {
                  setDetailEntity(activeEntity);
                  setDetailsSource("home");
                  setShowEventDetailsOverlay(true);
                }}
              >
                <img
                  src={
                    (Array.isArray(activeEntity.posterImage) && activeEntity.posterImage.length > 0)
                      ? getFullImageUrl(activeEntity.posterImage[0])
                      : "/img/sidebar-logo.svg"
                  }
                  className="event-card-img"
                  alt="cover"
                />
                <div className="event-card-details flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h5 className="m-0" style={{ fontSize: "15px" }}>{activeEntity.eventTitle || activeEntity.courseTitle}</h5>
                    <span className="active-badge">{t("active") || "Active"}</span>
                  </div>
                  <p className="category mb-2">
                    {entityType === "event"
                      ? (activeEntity.eventCategory?.name || "Event")
                      : (activeEntity.courseCategory?.name || "Course")}
                  </p>
                  <p className="info-line mb-1">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
                    </svg>
                    <span>
                      {activeEntity.startDate
                        ? new Date(activeEntity.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                        : "N/A"}
                    </span>
                  </p>
                  <p className="info-line" style={{ color: "#7c7c7c" }}>
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                      <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                    </svg>
                    <span>{activeEntity.venueName || "Online"}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 px-3 mb-4" style={{ background: "#121212", border: "1px dashed rgba(255, 255, 255, 0.15)", borderRadius: "20px" }}>
                <p style={{ color: "#8c8c8c", fontSize: "14px", marginBottom: "15px" }}>{t("noEventCourseSelectedDesc") || "No event or course selected. Please select one to start checking in attendees."}</p>
                <button
                  className="common_btn"
                  style={{ background: "#23ada4", border: "none", borderRadius: "20px", padding: "8px 20px", fontSize: "13px", fontWeight: "600", color: "#fff" }}
                  onClick={() => {
                    setDetailsSource("home");
                    setShowAssignedEventsOverlay(true);
                  }}
                >
                  {t("selectEventCourse") || "Select Event / Course"}
                </button>
              </div>
            )}

            <h5 className="mb-3" style={{ fontSize: "15px", fontWeight: "600", color: "#8c8c8c" }}>{t("quickActions") || "Quick Actions"}</h5>

            <div className="quick-action-row" onClick={() => handleTabClick("scan")}>
              <div className="quick-action-lft">
                <div className="quick-action-icon">
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5ZM4 4h1v1H4V4Zm2 0h2v1H6V4Zm3 0h1v1H9V4Zm1 1h1v2h-1V5Zm-1 3H8v1H7V8H6v1H5V8H4v1H3V7h1V6h1v1h2V6h1v2Zm2-1h1v1h-1V7Zm-2 3h1v1h-1v-1Zm-1 1H7v1H6v-1Zm2 0h1v1H9v-1Zm1-2h1v1h-1V9Zm1 1h1v1h-1v-1Z" />
                  </svg>
                </div>
                <div className="quick-action-text">
                  <h6>{t("scanQr") || "Scan QR"}</h6>
                  <p>{t("scanTicketsAtDoor") || "Scan tickets at the door"}</p>
                </div>
              </div>
              <span style={{ color: "#7c7c7c" }}>&#8250;</span>
            </div>

            <div className="quick-action-row" onClick={() => handleTabClick("attendees")}>
              <div className="quick-action-lft">
                <div className="quick-action-icon">
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  </svg>
                </div>
                <div className="quick-action-text">
                  <h6>{t("attendees") || "Attendees"}</h6>
                  <p>{t("viewAttendeesStatus") || "View attendees & status"}</p>
                </div>
              </div>
              <span style={{ color: "#7c7c7c" }}>&#8250;</span>
            </div>

            <div className="quick-action-row" onClick={() => handleTabClick("history")}>
              <div className="quick-action-lft">
                <div className="quick-action-icon">
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm8-1a.5.5 0 0 1 .5.5v1.5H12.5a.5.5 0 0 1 0 1H11.5v1.5a.5.5 0 0 1-1 0v-1.5H9a.5.5 0 0 1 0-1h1.5V10a.5.5 0 0 1 .5-.5zm3 2a.5.5 0 0 1 .5.5v1.5h1.5a.5.5 0 0 1 0 1H15.5v1.5a.5.5 0 0 1-1 0v-1.5H13a.5.5 0 0 1 0-1h1.5V11a.5.5 0 0 1 .5-.5z" />
                  </svg>
                </div>
                <div className="quick-action-text">
                  <h6>{t("scanHistory") || "Scan History"}</h6>
                  <p>{t("viewRecentCheckins") || "View recent check-ins"}</p>
                </div>
              </div>
              <span style={{ color: "#7c7c7c" }}>&#8250;</span>
            </div>

            {activeEntity && (
              <div className="text-center mt-4">
                <button
                  onClick={() => {
                    setDetailEntity(activeEntity);
                    setDetailsSource("home");
                    setShowEventDetailsOverlay(true);
                  }}
                  style={{
                    background: "transparent",
                    color: "#23ada4",
                    border: "none",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  {t("viewEventDetails") || "View Event Details"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* --------------------------------------------------------------- */}
      {/* 2. SCAN QR VIEW */}
      {/* --------------------------------------------------------------- */}
      {activeTab === "scan" && (
        <>
          <div className="screen-header">
            <button className="back-arrow-btn" onClick={() => setActiveTab("home")}>
              &#8592;
            </button>
            <h1 className="w-100 text-center" style={{ marginRight: "30px" }}>{t("scanQr") || "Scan QR"}</h1>
          </div>
          <div className="screen-body text-center">
            <p style={{ color: "#8c8c8c", fontSize: "15px", marginBottom: "20px" }}>
              {t("alignQrWithinFrame") || "Align QR code within the frame"}
            </p>

            <div className="scan-camera-wrapper">
              <video ref={videoRef} autoPlay playsInline muted />
              <div className="scan-overlay-guides">
                <div className="scan-laser-line" />
              </div>
            </div>

            <div className="scanner-manual-input-box">
              <input
                type="text"
                placeholder={t("enterTicketManually") || "Enter ticket number manually"}
                value={manualTicketNumber}
                onChange={(e) => setManualTicketNumber(e.target.value)}
              />
              <button onClick={() => handleCheckInSubmit(manualTicketNumber)} disabled={checkingInScanner}>
                {checkingInScanner ? <Spinner animation="border" size="sm" /> : (t("verifyAndCheckin") || "Verify & Check-in")}
              </button>
            </div>
          </div>
        </>
      )}

      {/* --------------------------------------------------------------- */}
      {/* 3. ATTENDEES VIEW (ENTER MANUALLY) */}
      {/* --------------------------------------------------------------- */}
      {activeTab === "attendees" && (
        <>
          <div className="screen-header">
            <button className="back-arrow-btn" onClick={() => setActiveTab("home")}>
              &#8592;
            </button>
            <h1 className="w-100 text-center" style={{ marginRight: "30px" }}>{t("enterManually") || "Enter Manually"}</h1>
          </div>
          <div className="screen-body">
            <input
              type="text"
              className="attendees-search-box"
              placeholder={t("searchAttendeesPlaceholder") || "Search by name, email or ticket ID..."}
              value={attendeeSearch}
              onChange={(e) => setAttendeeSearch(e.target.value)}
            />

            <div className="attendees-stats-header">
              <span>{t("listOfAttendees") || "List of Attendees"}</span>
              {/* <span>
                {attendeeStats.checkedIn} / {attendeeStats.total} checked-in
              </span> */}
            </div>

            {loadingAttendees ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="teal" />
              </div>
            ) : filteredAttendees.length === 0 ? (
              <div className="text-center py-5" style={{ color: "#7c7c7c" }}>
                {t("noAttendeesFound") || "No attendees found."}
              </div>
            ) : (
              <div className="attendee-list-scroll">
                {filteredAttendees.map((a) => (
                  <div
                    className="attendee-item-row"
                    key={a.transactionId || a._id}
                    onClick={() => handleVerifyCode(a.bookingId)}
                  >
                    <div className="attendee-item-info">
                      <div className="attendee-item-avatar">
                        {a.user?.profileImage ? (
                          <img src={a.user.profileImage} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <svg width="20" height="20" fill="#7c7c7c" viewBox="0 0 16 16">
                            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
                          </svg>
                        )}
                      </div>
                      <div className="attendee-item-text">
                        <h6>{`${a.user?.firstName || ""} ${a.user?.lastName || ""}`}</h6>
                        <p>{`${t("bookingID") || "Booking ID"}: ${a.bookingId || "N/A"}`}</p>
                      </div>
                    </div>

                    {(a.isFullyCheckedIn || a.tickets?.isFullyCheckedIn) ? (
                      <button className="checkin-action-btn checked" disabled onClick={(e) => e.stopPropagation()}>
                        &#10003;
                      </button>
                    ) : (
                      <button
                        className="checkin-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckInSubmit(a.bookingId);
                        }}
                      >
                        &#10142;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* --------------------------------------------------------------- */}
      {/* 4. HISTORY VIEW */}
      {/* --------------------------------------------------------------- */}
      {activeTab === "history" && (
        <>
          <div className="screen-header">
            <button className="back-arrow-btn" onClick={() => setActiveTab("home")}>
              &#8592;
            </button>
            <h1 className="w-100 text-center" style={{ marginRight: "30px" }}>{t("scanHistory") || "Scan History"}</h1>
          </div>
          <div className="screen-body">
            {loadingHistory ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="teal" />
              </div>
            ) : scanHistory.length === 0 ? (
              <div className="text-center py-5" style={{ color: "#7c7c7c" }}>
                {t("noRecentCheckinsRecorded") || "No recent check-ins recorded."}
              </div>
            ) : (
              <div className="history-list-scroll">
                {scanHistory.map((h, i) => {
                  const eventTitle = h.eventId?.eventTitle || h.courseId?.courseTitle || "Assigned Entity";
                  const checkedTime = h.checkedInAt
                    ? new Date(h.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "";
                  const checkedDate = h.checkedInAt
                    ? new Date(h.checkedInAt).toLocaleDateString([], { month: "short", day: "numeric" })
                    : "";

                  return (
                    <div className="history-item-row" key={h._id || i}>
                      <div className="history-info">
                        <h6>{`${h.firstName || ""} ${h.lastName || ""}`}</h6>
                        <p>{eventTitle}</p>
                      </div>
                      <div className="history-time text-end">
                        <div>{checkedTime}</div>
                        <div style={{ color: "#7c7c7c", fontSize: "10px" }}>{checkedDate}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* --------------------------------------------------------------- */}
      {/* BOTTOM NAVIGATION BAR */}
      {/* --------------------------------------------------------------- */}
      <div className="bottom-nav-bar">
        <button className={`nav-tab-item ${activeTab === "home" ? "active" : ""}`} onClick={() => handleTabClick("home")}>
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z" />
          </svg>
          <span>{t("home") || "Home"}</span>
        </button>

        <button className={`nav-tab-item ${activeTab === "scan" ? "active" : ""}`} onClick={() => handleTabClick("scan")}>
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M.5 5A.5.5 0 0 1 0 4.5v-3A1.5 1.5 0 0 1 1.5 0h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 0 1 1.5v3A.5.5 0 0 1 .5 5Zm0 6a.5.5 0 0 1 .5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 1 0 1h-3A1.5 1.5 0 0 1 0 14.5v-3a.5.5 0 0 1 .5-.5Zm15-6a.5.5 0 0 1-.5-.5v-3A.5.5 0 0 0 14 1h-3a.5.5 0 0 1 0-1h3A1.5 1.5 0 0 1 16 1.5v3a.5.5 0 0 1-.5.5Zm0 6a.5.5 0 0 1 .5.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a.5.5 0 0 1 0-1h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 1 .5-.5ZM3 3h2v2H3V3Zm2 5H3v3h3V8ZM3 6h2v1H3V6Zm3-3h2v1H6V3Zm0 2h1v2H6V5Zm3-2h4v2H9V3Zm2 3h2v1h-2V6Zm-2 2h2v1H9V8Zm3 0h1v3h-2V9h1V8Zm-3 2h1v1H9v-1Zm-2 1v1H5v-1h1Z" />
          </svg>
          <span>{t("scan") || "Scan"}</span>
        </button>

        <button className={`nav-tab-item ${activeTab === "attendees" ? "active" : ""}`} onClick={() => handleTabClick("attendees")}>
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zm5.968-3.073L3.75 8.1l2.218-2.827L8 8l-2.032 2.927z" />
          </svg>
          <span>{t("attendees") || "Attendees"}</span>
        </button>

        <button className={`nav-tab-item ${activeTab === "history" ? "active" : ""}`} onClick={() => handleTabClick("history")}>
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z" />
            <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z" />
          </svg>
          <span>{t("history") || "History"}</span>
        </button>
      </div>

      {/* --------------------------------------------------------------- */}
      {/* 5. OVERLAY: ASSIGNED EVENTS */}
      {/* --------------------------------------------------------------- */}
      {showAssignedEventsOverlay && (
        <div className="custom-staff-overlay">
          <div className="overlay-header">
            <button className="back-arrow-btn" onClick={() => setShowAssignedEventsOverlay(false)}>
              &#8592;
            </button>
            <h2>{t("assignedEventsAndCourses") || "Assigned Events & Courses"}</h2>
          </div>
          <div className="overlay-body">
            {/* Dynamic Events / Courses Toggle */}
            <div className="d-flex justify-content-center mb-4" style={{ background: "#121212", padding: "4px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => setOverlayTab("events")}
                style={{
                  flex: 1,
                  background: overlayTab === "events" ? "#23ada4" : "transparent",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 0",
                  fontWeight: "600",
                  fontSize: "13px",
                  transition: "background 0.2s ease"
                }}
              >
                {t("events") || "Events"} ({assignedEvents.length})
              </button>
              <button
                onClick={() => setOverlayTab("courses")}
                style={{
                  flex: 1,
                  background: overlayTab === "courses" ? "#23ada4" : "transparent",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 0",
                  fontWeight: "600",
                  fontSize: "13px",
                  transition: "background 0.2s ease"
                }}
              >
                {t("courses") || "Courses"} ({assignedCourses.length})
              </button>
            </div>

            {overlayTab === "events" ? (
              assignedEvents.length === 0 ? (
                <div className="text-center py-5" style={{ color: "#7c7c7c" }}>
                  {t("noAssignedEventsFound") || "No assigned events found."}
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {assignedEvents.map(event => (
                    <div
                      key={event._id}
                      className={`event-main-card ${activeEntity?._id === event._id ? "active-entity-card" : ""}`}
                      style={{ margin: 0 }}
                      onClick={() => {
                        if (pendingTabSelection) {
                          setActiveEntity(event);
                          setEntityType("event");
                          setActiveTab(pendingTabSelection);
                          setPendingTabSelection(null);
                          setShowAssignedEventsOverlay(false);
                        } else {
                          setDetailEntity(event);
                          setDetailsSource("list");
                          setShowAssignedEventsOverlay(false);
                          setShowEventDetailsOverlay(true);
                        }
                      }}
                    >
                      <img
                        src={
                          (Array.isArray(event.posterImage) && event.posterImage.length > 0)
                            ? getFullImageUrl(event.posterImage[0])
                            : "/img/sidebar-logo.svg"
                        }
                        className="event-card-img"
                        alt="cover"
                      />
                      <div className="event-card-details">
                        <h5>{event.eventTitle}</h5>
                        <p className="category">{event.eventCategory?.name || "Event"}</p>
                        <p className="info-line" style={{ color: "#7c7c7c" }}>
                          <span>
                            {event.startDate
                              ? new Date(event.startDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                              : "N/A"}
                          </span>
                        </p>
                        <p className="info-line" style={{ color: "#7c7c7c" }}>
                          <span>{event.venueName || "Online"}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              assignedCourses.length === 0 ? (
                <div className="text-center py-5" style={{ color: "#7c7c7c" }}>
                  {t("noAssignedCoursesFound") || "No assigned courses found."}
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {assignedCourses.map(course => (
                    <div
                      key={course._id}
                      className="event-main-card"
                      style={{ margin: 0 }}
                      onClick={() => {
                        if (pendingTabSelection) {
                          setActiveEntity(course);
                          setEntityType("course");
                          setActiveTab(pendingTabSelection);
                          setPendingTabSelection(null);
                          setShowAssignedEventsOverlay(false);
                        } else {
                          setDetailEntity(course);
                          setDetailsSource("list");
                          setShowAssignedEventsOverlay(false);
                          setShowEventDetailsOverlay(true);
                        }
                      }}
                    >
                      <img
                        src={
                          (Array.isArray(course.posterImage) && course.posterImage.length > 0)
                            ? getFullImageUrl(course.posterImage[0])
                            : "/img/sidebar-logo.svg"
                        }
                        className="event-card-img"
                        alt="cover"
                      />
                      <div className="event-card-details">
                        <h5>{course.courseTitle}</h5>
                        <p className="category">{course.courseCategory?.name || "Course"}</p>
                        <p className="info-line" style={{ color: "#7c7c7c" }}>
                          <span>
                            {course.startDate
                              ? new Date(course.startDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                              : "N/A"}
                          </span>
                        </p>
                        <p className="info-line" style={{ color: "#7c7c7c" }}>
                          <span>{course.venueName || "Online"}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* 6. OVERLAY: EVENT DETAILS */}
      {/* --------------------------------------------------------------- */}
      {showEventDetailsOverlay && detailEntity && (
        <div className="custom-staff-overlay">
          <div className="overlay-header">
            <button
              className="back-arrow-btn"
              onClick={() => {
                setShowEventDetailsOverlay(false);
                if (detailsSource === "list") {
                  setShowAssignedEventsOverlay(true);
                }
              }}
            >
              &#8592;
            </button>
            <h2>{detailEntity.courseTitle ? (t("courseDetails") || "Course Details") : (t("eventDetails") || "Event Details")}</h2>
          </div>
          <div className="overlay-body d-flex flex-column">
            {/* Cover Image */}
            <div style={{ width: "100%", height: "200px", borderRadius: "20px", overflow: "hidden", marginBottom: "20px" }}>
              <img
                src={
                  (Array.isArray(detailEntity.posterImage) && detailEntity.posterImage.length > 0)
                    ? getFullImageUrl(detailEntity.posterImage[0])
                    : "/img/sidebar-logo.svg"
                }
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                alt="cover"
              />
            </div>

            {/* Title & description */}
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#fff", marginBottom: "10px" }}>
              {detailEntity.eventTitle || detailEntity.courseTitle}
            </h3>
            <p style={{ color: "#8c8c8c", fontSize: "14px", lineHeight: "1.5", marginBottom: "25px" }}>
              {detailEntity.shortdesc || detailEntity.longdesc || (t("noDescriptionProvided") || "No description provided.")}
            </p>

            {/* Venue & Date */}
            <div className="d-flex flex-column gap-2 mb-4" style={{ fontSize: "13px", color: "#8c8c8c" }}>
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: "#23ada4" }}>&#128205;</span>
                <span>{detailEntity.venueName || "Online"}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: "#23ada4" }}>&#128197;</span>
                <span>
                  {detailEntity.startDate
                    ? new Date(detailEntity.startDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                    : "Date N/A"}
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: "#23ada4" }}>&#9201;</span>
                <span>
                  {detailEntity.startTime
                    ? `${detailEntity.startTime} - ${detailEntity.endTime || "N/A"}`
                    : (detailEntity.batches && detailEntity.batches.length > 0
                      ? detailEntity.batches.map(b => `${b.startTime || "N/A"} - ${b.endTime || "N/A"}`).join(", ")
                      : "N/A"
                    )}
                </span>
              </div>
            </div>

            {/* Stats Card */}
            <div className="details-stats-row">
              <div className="details-stat-box">
                {loadingDetailStats ? (
                  <Spinner animation="border" size="sm" variant="teal" />
                ) : (
                  <h3>{detailStats.checkedIn}</h3>
                )}
                <p>{t("booked") || "Booked"}</p>
              </div>
              <div className="details-stat-box" style={{ borderLeft: "1px solid rgba(255, 255, 255, 0.08)", borderRight: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <h3>
                  {detailEntity.ReservedExternally !== undefined
                    ? detailEntity.ReservedExternally
                    : (detailEntity.batches && detailEntity.batches.length > 0
                      ? detailEntity.batches.reduce((acc, b) => acc + (b.ReservedExternally || 0), 0)
                      : 0
                    )}
                </h3>
                <p>{t("reserved") || "Reserved"}</p>
              </div>
              <div className="details-stat-box">
                <h3>
                  {detailEntity.totalTickets || detailEntity.totalSeats || detailEntity.tickets?.reduce((acc, t) => acc + (t.qty || 0), 0) || (detailEntity.batches && detailEntity.batches.length > 0
                    ? detailEntity.batches.reduce((acc, b) => acc + (b.seats || 0), 0)
                    : 100
                  )}
                </h3>
                <p>{t("capacity") || "Capacity"}</p>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="details-quick-actions-bar">
              <button
                className="details-action-btn"
                onClick={() => {
                  setActiveEntity(detailEntity);
                  setEntityType(detailEntity.courseTitle ? "course" : "event");
                  setShowEventDetailsOverlay(false);
                  setActiveTab("scan");
                }}
              >
                <span style={{ fontSize: "16px", marginBottom: "3px" }}>&#128247;</span>
                <span>{t("scanQr") || "Scan QR"}</span>
              </button>

              <button
                className="details-action-btn"
                onClick={() => {
                  setActiveEntity(detailEntity);
                  setEntityType(detailEntity.courseTitle ? "course" : "event");
                  setShowEventDetailsOverlay(false);
                  setActiveTab("attendees");
                }}
              >
                <span style={{ fontSize: "16px", marginBottom: "3px" }}>&#128100;</span>
                <span>{t("attendees") || "Attendees"}</span>
              </button>

              <button
                className="details-action-btn"
                onClick={() => {
                  setActiveEntity(detailEntity);
                  setEntityType(detailEntity.courseTitle ? "course" : "event");
                  setShowEventDetailsOverlay(false);
                  setActiveTab("history");
                }}
              >
                <span style={{ fontSize: "16px", marginBottom: "3px" }}>&#128196;</span>
                <span>{t("scanHistory") || "Scan History"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* TICKET VERIFICATION MODAL */}
      {/* --------------------------------------------------------------- */}
      <Modal show={showVerifyModal} onHide={closeVerifyModal} centered contentClassName="verify-modal-content">
        <Modal.Header closeButton closeVariant="white" className="border-0 pb-0">
          <Modal.Title style={{ fontSize: "18px", fontWeight: "700", color: "#fff" }}>{t("ticketVerification") || "Ticket Verification"}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          {loadingVerify ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="teal" className="mb-2" />
              <p className="m-0 text-muted" style={{ fontSize: "14px" }}>{t("verifyingTicketDetails") || "Verifying ticket/QR details..."}</p>
            </div>
          ) : verifyError ? (
            <div className="text-center py-3">
              <div className="verify-error-icon mb-3">&#9888;</div>
              <h5 className="text-danger mb-2" style={{ fontSize: "16px", fontWeight: "600" }}>{t("verificationFailed") || "Verification Failed"}</h5>
              <p className="text-muted mb-4" style={{ fontSize: "14px" }}>{verifyError}</p>
              <button className="common_btn w-100" onClick={closeVerifyModal} style={{ background: "#333", color: "#fff", border: "none", borderRadius: "20px", height: "40px" }}>
                {t("close") || "Close"}
              </button>
            </div>
          ) : verifiedTicket ? (() => {
            const isCheckedInToday = verifiedTicket.checkedInToday;

            return (
              <div className="verify-details-container">
                {/* Event Info */}
                <div className="verify-event-info mb-3">
                  <span className="verify-label">{t("eventOrCourse") || "Event / Course"}</span>
                  <div className="verify-val">{verifiedTicket.event?.title || "Unknown"}</div>
                </div>

                {/* Status Badge */}
                <div className="badge-wrapper mb-4">
                  {isCheckedInToday ? (
                    <div className="badge-status checked-in" style={{ background: "rgba(52, 199, 89, 0.15)", color: "#34c759" }}>
                      {t("checkedInToday") || "Checked In Today"}
                    </div>
                  ) : verifiedTicket.isAlreadyCheckedIn ? (
                    <div className="badge-status checked-in">
                      {t("alreadyCheckedIn") || "Already Checked In"}
                    </div>
                  ) : verifiedTicket.isExpired ? (
                    <div className="badge-status expired">
                      {t("expiredTicket") || "Expired Ticket"}
                    </div>
                  ) : (
                    <div className="badge-status valid">
                      {t("validTicket") || "Valid Ticket"}
                    </div>
                  )}
                </div>

                {/* Attendee Details */}
                {verifiedTicket.attendee && (
                  <div className="verify-section mb-3">
                    <div className="verify-row">
                      <span className="verify-label">{t("attendeeName") || "Attendee Name"}</span>
                      <span className="verify-val">{verifiedTicket.attendee.firstName} {verifiedTicket.attendee.lastName}</span>
                    </div>
                    <div className="verify-row">
                      <span className="verify-label">{t("email") || "Email"}</span>
                      <span className="verify-val" style={{ wordBreak: "break-all" }}>{verifiedTicket.attendee.email}</span>
                    </div>
                    <div className="verify-row">
                      <span className="verify-label">{t("ticketNumber") || "Ticket Number"}</span>
                      <span className="verify-val">{verifiedTicket.attendee.ticketNumber}</span>
                    </div>
                    {verifiedTicket.attendee.ticketName && (
                      <div className="verify-row">
                        <span className="verify-label">{t("ticketType") || "Ticket Type"}</span>
                        <span className="verify-val">{verifiedTicket.attendee.ticketName}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Transaction Details */}
                {verifiedTicket.transaction && (
                  <div className="verify-section mb-4">
                    <div className="verify-row">
                      <span className="verify-label">{t("bookingID") || "Booking ID"}</span>
                      <span className="verify-val">{verifiedTicket.transaction.bookingId}</span>
                    </div>
                    {verifiedTicket.transaction.passType && (
                      <div className="verify-row">
                        <span className="verify-label">{t("passType") || "Pass Type"}</span>
                        <span className="verify-val" style={{ textTransform: "capitalize" }}>{verifiedTicket.transaction.passType.replace("_", " ")}</span>
                      </div>
                    )}
                    {verifiedTicket.transaction.passExpiryDate && (
                      <div className="verify-row">
                        <span className="verify-label">{t("passExpiry") || "Pass Expiry"}</span>
                        <span className="verify-val">{new Date(verifiedTicket.transaction.passExpiryDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="verify-row">
                      <span className="verify-label">{t("totalQty") || "Total Qty"}</span>
                      <span className="verify-val">{verifiedTicket.transaction.qty} ticket(s)</span>
                    </div>
                    <div className="verify-row">
                      <span className="verify-label">{t("checkedInQty") || "Checked In Qty"}</span>
                      <span className="verify-val">{verifiedTicket.transaction.checkedInQty} / {verifiedTicket.transaction.qty}</span>
                    </div>
                  </div>
                )}

                {/* Ongoing Slots/Sessions (if present) */}
                {verifiedTicket.transaction && verifiedTicket.transaction.ongoingSlots && verifiedTicket.transaction.ongoingSlots.length > 0 && (
                  <div className="verify-section mb-4">
                    <div className="verify-label mb-2" style={{ fontWeight: "600", color: "#23ada4" }}>{t("bookedSlots") || "Booked Slots"} ({verifiedTicket.transaction.ongoingSlots.length})</div>
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: "150px", overflowY: "auto" }}>
                      {verifiedTicket.transaction.ongoingSlots.map((slot) => {
                        const slotDate = slot.selectedDate;
                        // Check if checked in via attendee history or slot flag
                        const isSlotChecked = verifiedTicket.attendee?.checkInHistory?.some(entry =>
                          entry.batchId === slot.batchId && entry.sessionDate === slotDate
                        ) || slot.isCheckedIn;

                        return (
                          <div key={slot._id} className="d-flex justify-content-between align-items-center p-2 rounded" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="d-flex flex-column text-start">
                              <span style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>{slot.selectedDay}, {slotDate || "N/A"}</span>
                              <span style={{ fontSize: "11px", color: "#8c8c8c" }}>Batch: {slot.batchId.slice(-6).toUpperCase()}</span>
                            </div>
                            {isSlotChecked ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1" style={{ borderRadius: "10px", fontSize: "11px" }}>{t("checkedIn") || "Checked In"}</span>
                            ) : (
                              <button
                                className="btn btn-sm"
                                disabled={checkingIn}
                                onClick={() => handlePerformCheckInForSlot(slotDate, slot.batchId)}
                                style={{ background: "#23ada4", color: "#fff", borderRadius: "10px", fontSize: "11px", border: "none", padding: "4px 10px" }}
                              >
                                {t("checkIn") || "Check In"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {verifiedTicket.isAlreadyCheckedIn && verifiedTicket.checkedInAt && (
                  <div className="verify-checkin-time text-muted mb-4" style={{ fontSize: "12px", textAlign: "center" }}>
                    {t("checkedInAtSuffix") || "Checked in at:"} {new Date(verifiedTicket.checkedInAt).toLocaleString()}
                  </div>
                )}

                {/* Actions */}
                <div className="verify-actions d-flex gap-2">
                  {!verifiedTicket.isAlreadyCheckedIn && !verifiedTicket.isExpired ? (
                    <>
                      <button className="common_btn flex-grow-1" onClick={closeVerifyModal} style={{ background: "#222", border: "1px solid #444", color: "#ccc", borderRadius: "20px", height: "40px" }}>
                        {t("cancel") || "Cancel"}
                      </button>
                      {(verifiedTicket.transaction?.passType || !verifiedTicket.transaction?.ongoingSlots || verifiedTicket.transaction.ongoingSlots.length === 0) && (
                        isCheckedInToday ? (
                          <button className="common_btn flex-grow-1" disabled style={{ background: "rgba(52, 199, 89, 0.15)", color: "#34c759", border: "1px solid #34c759", borderRadius: "20px", height: "40px" }}>
                            {t("scannedForToday") || "Scanned for Today"}
                          </button>
                        ) : (
                          <button className="common_btn flex-grow-1" onClick={handlePerformCheckIn} disabled={checkingIn} style={{ background: "#23ada4", color: "#fff", border: "none", borderRadius: "20px", height: "40px" }}>
                            {checkingIn ? (
                              <Spinner animation="border" size="sm" />
                            ) : verifiedTicket.transaction?.passType ? (
                              t("checkInPass") || "Check In Pass"
                            ) : (
                              t("checkIn") || "Check In"
                            )}
                          </button>
                        )
                      )}
                    </>
                  ) : (
                    <button className="common_btn w-100" onClick={closeVerifyModal} style={{ background: "#23ada4", color: "#fff", border: "none", borderRadius: "20px", height: "40px" }}>
                      {t("close") || "Close"}
                    </button>
                  )}
                </div>
              </div>
            );
          })() : null}
        </Modal.Body>
      </Modal>

      {/* 2. PROFILE OVERLAY */}

      {showProfileOverlay && (
        <div className="custom-staff-overlay" style={{ zIndex: 2100 }}>
          <div className="overlay-header">
            <button
              onClick={() => setShowProfileOverlay(false)}
              style={{ background: "transparent", border: "none", color: "#fff", fontSize: "20px", padding: 0 }}
            >
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
              </svg>
            </button>
            <h2 style={{ fontSize: "18px", fontWeight: "600", flexGrow: 1, textAlign: "center", marginRight: "24px" }}>{t("profile") || "Profile"}</h2>
          </div>
          <div className="overlay-body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Staff Card */}
            <div style={{ background: "#121212", borderRadius: "16px", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                {(() => {
                  const imageUrl = staffProfile?.profileImage || staffProfile?.profilePhoto;
                  if (imageUrl) {
                    return (
                      <img
                        src={getFullImageUrl(imageUrl)}
                        alt="profile"
                        style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover" }}
                      />
                    );
                  }
                  return (
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        background: "#23ada4",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "20px",
                      }}
                    >
                      {staffProfile?.firstName?.charAt(0).toUpperCase() || "S"}
                    </div>
                  );
                })()}
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "700", color: "#fff" }}>
                    {staffProfile?.firstName} {staffProfile?.lastName}
                  </h4>
                  <span style={{ fontSize: "12px", color: "#7c7c7c", display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
                    </svg>
                    {t("memberSince") || "Member since"} Jan 2025
                  </span>
                </div>
              </div>
              <span className="active-badge" style={{ background: "rgba(35, 173, 164, 0.15)", color: "#23ada4", padding: "4px 10px", borderRadius: "12px", fontSize: "10px", fontWeight: "700" }}>
                {t("active") || "Active"}
              </span>
            </div>

            {/* Assigned Badges Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div
                onClick={() => {
                  setOverlayTab("events");
                  setShowAssignedEventsOverlay(true);
                  setShowProfileOverlay(false);
                }}
                style={{ background: "#121212", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div style={{ background: "rgba(35, 173, 164, 0.1)", color: "#23ada4", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M0 4.5A1.5 1.5 0 0 1 1.5 3h13A1.5 1.5 0 0 1 16 4.5V6a.5.5 0 0 1-.5.5 1.5 1.5 0 0 0 0 3 .5.5 0 0 1 .5.5v1.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 11.5V10a.5.5 0 0 1 .5-.5 1.5 1.5 0 0 0 0-3A.5.5 0 0 1 0 6V4.5ZM1.5 4a.5.5 0 0 0-.5.5v1.05a2.5 2.5 0 0 1 0 4.9v1.05a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-1.05a2.5 2.5 0 0 1 0-4.9V4.5a.5.5 0 0 0-.5-.5h-13Z" />
                  </svg>
                </div>
                <span style={{ fontSize: "13px", fontWeight: "600" }}>{t("assignedEvents") || "Assigned Events"}</span>
              </div>
              <div
                onClick={() => {
                  setOverlayTab("courses");
                  setShowAssignedEventsOverlay(true);
                  setShowProfileOverlay(false);
                }}
                style={{ background: "#121212", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div style={{ background: "rgba(35, 173, 164, 0.1)", color: "#23ada4", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.73l1.176-.47a.5.5 0 0 0 .025-.917l-7.5-3.5ZM8 8.46 1.758 5.965 8 3.052l6.242 2.913L8 8.46Z" />
                  </svg>
                </div>
                <span style={{ fontSize: "13px", fontWeight: "600" }}>{t("assignedCourse") || "Assigned Course"}</span>
              </div>
            </div>

            {/* Options List */}
            <div style={{ background: "#121212", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
              {/* Email */}
              <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "15px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ color: "#23ada4" }}>
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
                  </svg>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "12px", color: "#7c7c7c" }}>{t("emailAddress") || "Email Address"}</span>
                  <span style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>{staffProfile?.email}</span>
                </div>
              </div>

              {/* Change Password */}
              <div
                onClick={() => setShowChangePasswordOverlay(true)}
                style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <div style={{ color: "#23ada4" }}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "14px", color: "#fff", fontWeight: "600" }}>{t("changePassword") || "Change Password"}</span>
                    <span style={{ fontSize: "11px", color: "#7c7c7c" }}>{t("updateYourPasswordDesc") || "Update your password"}</span>
                  </div>
                </div>
                <span style={{ color: "#7c7c7c", fontSize: "20px" }}>&#8250;</span>
              </div>

              {/* Language */}
              <div style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <div style={{ color: "#23ada4" }}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4.545 6.714 4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286H4.545zm1.634-.736L5.433 3.98 4.69 5.978h1.49z" />
                      <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "14px", color: "#fff", fontWeight: "600" }}>{t("preferredLanguage") || "Language"}</span>
                  </div>
                </div>
                <LanguageSelector />
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                handleLogout();
                setShowProfileOverlay(false);
              }}
              style={{
                marginTop: "auto",
                background: "transparent",
                border: "none",
                color: "#ff5c5c",
                fontWeight: "600",
                fontSize: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "20px"
              }}
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z" />
                <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z" />
              </svg>
              {t("logOut") || "Log out"}
            </button>
          </div>
        </div>
      )}

      {/* 3. CHANGE PASSWORD OVERLAY */}
      {showChangePasswordOverlay && (
        <div className="custom-staff-overlay" style={{ zIndex: 2200 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 0 }}></div>
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="overlay-header" style={{ borderBottom: "none" }}>
              <button
                onClick={() => setShowChangePasswordOverlay(false)}
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: "20px", padding: 0 }}
              >
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
                </svg>
              </button>
            </div>
            <div className="overlay-body" style={{ padding: "30px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "30px", color: "#fff", textAlign: "center" }}>{t("updateYourPasswordHeader") || "Update your Password"}</h2>

              <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Current Password */}
                <div style={{ position: "relative" }}>
                  <input
                    type={showOldPassword ? "text" : "password"}
                    placeholder={t("enterCurrentPassword") || "Enter Current Password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    style={{
                      width: "100%",
                      height: "54px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "27px",
                      padding: "0 50px 0 20px",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    style={{
                      position: "absolute",
                      right: "20px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "#8c8c8c",
                      padding: 0
                    }}
                  >
                    <img
                      src={showOldPassword ? "/img/lock.svg" : "/img/unlock.svg"}
                      alt="toggle password"
                      style={{ width: "20px", opacity: 0.7 }}
                    />
                  </button>
                </div>

                {/* New Password */}
                <div style={{ position: "relative" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder={t("enterNewPassword") || "Enter New Password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: "100%",
                      height: "54px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "27px",
                      padding: "0 50px 0 20px",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: "absolute",
                      right: "20px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "#8c8c8c",
                      padding: 0
                    }}
                  >
                    <img
                      src={showNewPassword ? "/img/lock.svg" : "/img/unlock.svg"}
                      alt="toggle password"
                      style={{ width: "20px", opacity: 0.7 }}
                    />
                  </button>
                </div>

                {/* Confirm Password */}
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("confirmPassword") || "Confirm Password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: "100%",
                      height: "54px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "27px",
                      padding: "0 50px 0 20px",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: "20px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "#8c8c8c",
                      padding: 0
                    }}
                  >
                    <img
                      src={showConfirmPassword ? "/img/lock.svg" : "/img/unlock.svg"}
                      alt="toggle password"
                      style={{ width: "20px", opacity: 0.7 }}
                    />
                  </button>
                </div>

                {/* Update Button */}
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="common_btn"
                  style={{
                    width: "100%",
                    height: "54px",
                    background: "#23ada4",
                    color: "#fff",
                    borderRadius: "27px",
                    border: "none",
                    fontWeight: "600",
                    fontSize: "16px",
                    marginTop: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {updatingPassword ? <Spinner animation="border" size="sm" /> : (t("update") || "Update")}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffHome;
