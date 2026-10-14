"use client";
import React, { useState, useEffect, useRef } from "react";
import { Col, Row, Spinner, Modal } from "react-bootstrap";
import toast from "react-hot-toast";
import staffApi from "@/api/staffApi";
import authApi from "@/api/authApi";
import eventApi from "@/api/eventApi";
import courseApi from "@/api/courseApi";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";

function StaffPage() {
  const { t } = useLanguage();

  // Page view states
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingStaff, setLoadingStaff] = useState(true);

  // Form states for creating staff
  const [formFullName, setFormFullName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submittingStaff, setSubmittingStaff] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const fileInputRef = useRef(null);
  const entityListRef = useRef(null);

  // Edit and Delete states
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(false);



  // Assignment Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignStep, setAssignStep] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [activeTab, setActiveTab] = useState("events"); // "events" | "courses"
  const [entitySearchQuery, setEntitySearchQuery] = useState("");
  const [assignedMap, setAssignedMap] = useState({}); // itemId -> boolean
  const [savingAssignments, setSavingAssignments] = useState(false);

  // Fetch list of staff members
  const fetchStaffList = async () => {
    try {
      setLoadingStaff(true);
      const res = await staffApi.listStaff();
      if (res?.status) {
        setStaffList(res.data?.staff || res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch staff list", err);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Fetch all organizer events & courses
  const fetchOrganizerEntities = async () => {
    try {
      setLoadingEntities(true);
      const [eventsRes, coursesRes] = await Promise.all([
        eventApi.getOrganizerEvents({
          filter: "organizer",
          status: "Upcoming,Live",
          isDraft: false,
          limit: 1000,
        }),
        courseApi.getOrganizerCourses({
          filter: "organizer",
          status: "Upcoming,Live",
          isDraft: false,
          limit: 1000,
        }),
      ]);
      if (eventsRes?.status) {
        setEvents(eventsRes.data?.events || []);
      }
      if (coursesRes?.status) {
        setCourses(coursesRes.data?.courses || []);
      }
    } catch (err) {
      console.error("Failed to fetch events or courses", err);
    } finally {
      setLoadingEntities(false);
    }
  };

  useEffect(() => {
    fetchStaffList();
    fetchOrganizerEntities();
    document.title = t("staffManagementTitle") || "Staff Management - Bondy";
  }, []);

  // Reset scroll position to top when switching tabs in the assignment modal
  useEffect(() => {
    if (entityListRef.current) {
      entityListRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Handle file select and upload for staff avatar photo
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const okType = file.type === "image/png" || file.type === "image/jpeg";
    if (!okType || file.size > 2 * 1024 * 1024) {
      toast.error(t("stPhotoBig"));
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("files", file);

    try {
      setUploadingPhoto(true);
      const res = await authApi.uploadFile(formData);
      if (res.data && res.data.files && res.data.files.length > 0) {
        setFormPhoto(res.data.files[0]);
        toast.success(t("photoUploadedSuccessfully") || "Photo uploaded successfully");
      }
    } catch (err) {
      console.error("Photo upload failed", err);
      toast.error(t("photoUploadFailed") || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle click for Add Staff button to reset edit state
  const handleAddClick = () => {
    setEditingStaffId(null);
    setFormFullName("");
    setFormEmail("");
    setFormPassword("");
    setFormPhoto("");
    setShowAddStaff(true);
    setShowPassword(false);
    setPasswordError("");
    setNameError("");
    setEmailError("");
  };

  // Open edit view for a specific staff member
  const handleOpenEdit = (staff) => {
    setEditingStaffId(staff._id);
    setFormFullName(`${staff.firstName || ""} ${staff.lastName || ""}`.trim());
    setFormEmail(staff.email || "");
    setFormPassword(""); // optional during edit
    setFormPhoto(staff.profileImage || "");
    setShowAddStaff(true);
    setShowPassword(false);
    setPasswordError("");
    setNameError("");
    setEmailError("");
  };

  // Handle password change with real-time validation
  const handlePasswordChange = (val) => {
    setFormPassword(val);
    const password = val.trim();
    if (!password) {
      setPasswordError(editingStaffId ? "" : t("stPwLen"));
    } else {
      if (password.length < 8 || password.length > 64) {
        setPasswordError(t("stPwLen"));
      } else {
        setPasswordError("");
      }
    }
  };

  // Handle deletion of a staff member
  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      setDeletingStaff(true);
      const res = await staffApi.removeStaff(staffToDelete._id);
      if (res?.status) {
        toast.success(t("staffDeletedSuccessfully") || "Staff member deleted successfully");
        setShowDeleteModal(false);
        setStaffToDelete(null);
        fetchStaffList();
      }
    } catch (err) {
      console.error("Failed to delete staff member", err);
      toast.error(err?.response?.data?.message || t("failedToDeleteStaff") || "Failed to delete staff member");
    } finally {
      setDeletingStaff(false);
    }
  };

  // Handle submission of the Add/Edit Staff form
  const handleStaffFormSubmit = async (e) => {
    e.preventDefault();
    const name = formFullName.trim();
    const email = formEmail.trim();
    const password = formPassword.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    let valid = true;
    if (!name) {
      setNameError(t("stNameErr"));
      valid = false;
    } else if (name.length > 80) {
      setNameError(t("stNameLen"));
      valid = false;
    } else {
      setNameError("");
    }
    if (!email || !emailOk) {
      setEmailError(t("stEmailErr"));
      valid = false;
    } else if (email.length > 120) {
      setEmailError(t("stEmailLen"));
      valid = false;
    } else {
      setEmailError("");
    }
    if ((!editingStaffId && !password) || (password && (password.length < 8 || password.length > 64))) {
      setPasswordError(t("stPwLen"));
      valid = false;
    } else {
      setPasswordError("");
    }
    if (!valid) return;

    try {
      setSubmittingStaff(true);
      const payload = {
        fullname: name.slice(0, 80),
        email: email.slice(0, 120),
        profilePhoto: formPhoto || null,
      };
      if (password) {
        payload.password = password.slice(0, 64);
      }

      let res;
      if (editingStaffId) {
        res = await staffApi.editStaff(editingStaffId, payload);
      } else {
        res = await staffApi.addStaff(payload);
      }

      if (res?.status) {
        toast.success(
          editingStaffId
            ? t("staffUpdatedSuccessfully") || "Staff member updated successfully"
            : t("staffAddedSuccessfully") || "Staff member added successfully"
        );
        // Reset form
        setFormFullName("");
        setFormEmail("");
        setFormPassword("");
        setFormPhoto("");
        setEditingStaffId(null);
        setShowAddStaff(false);
        // Refresh list
        fetchStaffList();
      }
    } catch (err) {
      console.error("Failed to save staff member", err);
      toast.error(err?.response?.data?.message || t("failedToSaveStaff") || "Failed to save staff member");
    } finally {
      setSubmittingStaff(false);
    }
  };

  // Open assignment modal for a specific staff member
  const handleOpenAssign = (staff) => {
    setSelectedStaff(staff);

    // Build initial assignment map
    const initialMap = {};
    events.forEach((event) => {
      const isAssigned = event.assignedStaff?.some(
        (id) => id === staff._id || id?._id === staff._id,
      );
      initialMap[event._id] = !!isAssigned;
    });
    courses.forEach((course) => {
      const isAssigned = course.assignedStaff?.some(
        (id) => id === staff._id || id?._id === staff._id,
      );
      initialMap[course._id] = !!isAssigned;
    });

    setAssignedMap(initialMap);
    setEntitySearchQuery("");
    setAssignStep("type");
    setShowAssignModal(true);
  };

  // Toggle state of event/course in modal
  const handleToggleAssignItem = (id) => {
    setAssignedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Save assignment changes
  const handleSaveAssignments = async () => {
    if (!selectedStaff) return;

    try {
      setSavingAssignments(true);

      // We will loop through events and courses and see which ones changed assignment state for this staff member
      const eventPromises = events.map(async (event) => {
        const wasAssigned = event.assignedStaff?.some(
          (id) => id === selectedStaff._id || id?._id === selectedStaff._id,
        );
        const isNowAssigned = !!assignedMap[event._id];

        if (wasAssigned !== isNowAssigned) {
          // Assignment changed!
          let newStaffIds =
            event.assignedStaff?.map((id) => id?._id || id) || [];
          if (isNowAssigned) {
            newStaffIds = [...newStaffIds, selectedStaff._id];
          } else {
            newStaffIds = newStaffIds.filter((id) => id !== selectedStaff._id);
          }

          // Call assign staff endpoint
          return staffApi.assignStaffToEvent({
            entityId: event._id,
            staffIds: newStaffIds,
          });
        }
      });

      const coursePromises = courses.map(async (course) => {
        const wasAssigned = course.assignedStaff?.some(
          (id) => id === selectedStaff._id || id?._id === selectedStaff._id,
        );
        const isNowAssigned = !!assignedMap[course._id];

        if (wasAssigned !== isNowAssigned) {
          // Assignment changed!
          let newStaffIds =
            course.assignedStaff?.map((id) => id?._id || id) || [];
          if (isNowAssigned) {
            newStaffIds = [...newStaffIds, selectedStaff._id];
          } else {
            newStaffIds = newStaffIds.filter((id) => id !== selectedStaff._id);
          }

          // Call assign staff endpoint
          return staffApi.assignStaffToCourse({
            entityId: course._id,
            staffIds: newStaffIds,
          });
        }
      });

      await Promise.all([...eventPromises, ...coursePromises]);
      toast.success(t("assignmentsSavedSuccessfully") || "Assignments saved successfully");
      setShowAssignModal(false);
      // Refresh events/courses cache to reflect new assignments
      fetchOrganizerEntities();
    } catch (err) {
      console.error("Failed to save assignments", err);
      toast.error(t("failedToSaveAssignments") || "Failed to save some assignments");
    } finally {
      setSavingAssignments(false);
    }
  };

  // Filter staff by name or email
  const filteredStaffList = staffList.filter((staff) => {
    const q = searchQuery.toLowerCase();
    const fullName =
      `${staff.firstName || ""} ${staff.lastName || ""}`.toLowerCase();
    return (
      fullName.includes(q) ||
      staff.email?.toLowerCase().includes(q) ||
      staff._id?.toLowerCase().includes(q)
    );
  });

  // Filter events/courses inside the modal
  const filteredEntities = (activeTab === "events" ? events : courses).filter(
    (item) => {
      const q = entitySearchQuery.toLowerCase();
      const title = (item.eventTitle || item.courseTitle || "").toLowerCase();
      return title.includes(q);
    },
  );

  const assignPool = activeTab === "events" ? events : courses;
  const selectedCount = assignPool.filter((item) => assignedMap[item._id]).length;
  const staffName = (staff) =>
    `${staff?.firstName || ""} ${staff?.lastName || ""}`.trim() || t("staffMember");
  const MONTH_KEYS = ["monthJan", "monthFeb", "monthMar", "monthApr", "monthMay", "monthJun", "monthJul", "monthAug", "monthSep", "monthOct", "monthNov", "monthDec"];
  const itemMeta = (item) => {
    let when = "";
    if (item.startDate) {
      const d = new Date(item.startDate);
      if (!Number.isNaN(d.getTime())) {
        when = `${t(MONTH_KEYS[d.getMonth()])} ${d.getDate()}`;
        if (item.startTime) when += ` · ${item.startTime}`;
      }
    }
    const place = item.venueName || "";
    return [when, place].filter(Boolean).join(" · ");
  };
  const clearAssignSelection = () => {
    setAssignedMap((prev) => {
      const next = { ...prev };
      assignPool.forEach((item) => {
        next[item._id] = false;
      });
      return next;
    });
  };

  return (
    <div className="staff-container col-12">
      <style jsx global>{`
        .staff-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }
        .staff-header h2 {
          font-size: 28px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }
        .add-staff-btn-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(35, 173, 164, 0.1);
          border: 1px solid rgba(35, 173, 164, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #23ada4;
          cursor: pointer;
          font-size: 24px;
          transition: all 0.2s ease;
        }
        .add-staff-btn-circle:hover {
          background: #23ada4;
          color: #fff;
          transform: scale(1.05);
        }
        .search-wrapper-staff {
          position: relative;
          margin-bottom: 20px;
        }
        .search-wrapper-staff input {
          width: 100%;
          height: 50px;
          background: #1e1e1e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 25px;
          padding: 0 20px 0 50px;
          color: #fff;
          outline: none;
        }
        .search-wrapper-staff .search-icon {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.5;
        }
        .staff-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .staff-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #191919;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 16px;
        }
        .staff-info-box {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .staff-avatar-circle {
          width: 55px;
          height: 55px;
          border-radius: 50%;
          background: #2e2e2e;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .staff-avatar-circle img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .staff-details h5 {
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
          text-transform: capitalize;
        }
        .staff-details p {
          color: #7c7c7c;
          font-size: 14px;
          margin: 0;
        }
        .assign-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #23ada4;
          font-size: 12px;
          cursor: pointer;
          background: transparent;
          border: none;
          transition: opacity 0.2s ease;
        }
        .assign-action-btn:hover {
          opacity: 0.8;
        }
        .assign-action-btn img {
          width: 20px;
          height: 20px;
          margin-bottom: 4px;
        }
        .staff-actions-wrapper {
          position: relative;
          display: inline-block;
        }
        .three-dots-btn {
          background: transparent;
          border: none;
          color: #7c7c7c;
          font-size: 20px;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 50%;
          transition: background-color 0.2s ease, color 0.2s ease;
          line-height: 1;
        }
        .three-dots-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }
        .staff-dropdown-menu {
          position: absolute;
          right: 0;
          top: 100%;
          background: #1e1e1e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          z-index: 1000;
          min-width: 120px;
          display: flex;
          flex-direction: column;
          padding: 4px 0;
          margin-top: 4px;
        }
        .staff-dropdown-item {
          background: transparent;
          border: none;
          color: #fff;
          text-align: left;
          padding: 10px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          width: 100%;
        }
        .staff-dropdown-item:hover {
          background: rgba(35, 173, 164, 0.1);
          color: #23ada4;
        }
        .staff-dropdown-item.delete {
          color: #ff4d4d;
        }
        .staff-dropdown-item.delete:hover {
          background: rgba(255, 77, 77, 0.1);
          color: #ff4d4d;
        }
        /* Add Staff View */
        .add-staff-header {
          display: flex;
          align-items: center;
          gap: 15px; 
        }
       .overlay-header .back-arrow-btn{
          outline: none;       
          background: #121212;
          border: 1px solid rgba(255, 255, 255, .06);
          color: #fff;
          border-radius: 12px;
      }
          .back-arrow-btn {
           color: white;
    background: transparent;
    padding: 0px;
    font-size: 26px;
        }
        .photo-upload-circle {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          border: 1px dashed rgba(255, 255, 255, 0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto 30px auto;
          cursor: pointer;
          position: relative;
          background: #111;
          transition: border-color 0.2s ease;
        }
        .photo-upload-circle:hover {
          border-color: #23ada4;
        }
        .photo-upload-circle img.photo-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        .photo-upload-circle .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 11px;
          color: #8c8c8c;
          gap: 5px;
        }
        .photo-upload-circle .upload-placeholder svg {
          width: 28px;
          height: 28px;
          fill: #8c8c8c;
        }
        .staff-form-group {
          margin-bottom: 20px;
        }
        .staff-form-group label {
          color: #fff;
          font-size: 14px;
          margin-bottom: 8px;
          display: block;
        }
        .staff-form-group input {
          width: 100%;
          height: 55px;
          background: #111;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0 16px;
          color: #fff;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .staff-form-group input:focus {
          border-color: #23ada4;
        }
        .submit-staff-btn {
          width: 100%;
          height: 55px;
          background: #23ada4;
          color: #fff;
          border-radius: 28px;
          font-weight: 600;
          font-size: 16px;
          border: none;
          margin-top: 20px;
          transition: background 0.2s ease;
        }
        .submit-staff-btn:hover {
          background: #1d9088;
        }

        /* Modal styling */
        .dark-modal .modal-content {
          background: #161616 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 20px !important;
          color: #fff !important;
        }
        .dark-modal .modal-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          justify-content: center;
          position: relative;
          padding: 0px !important;
          padding-bottom: 10px !important;
        }
        .dark-modal .modal-header .btn-close {
          filter: invert(1);
          position: absolute;
          right: 20px;
        }
        .dark-modal .modal-title {
          font-size: 20px;
          font-weight: 700;
        }
        .modal-tabs {
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 15px;
        }
        .modal-tab-btn {
          flex: 1;
          text-align: center;
          padding: 12px;
          background: transparent;
          border: none;
          color: #7c7c7c;
          font-weight: 600;
          font-size: 15px;
          border-bottom: 2px solid transparent;
          cursor: pointer;
        }
        .modal-tab-btn.active {
          color: #23ada4;
          border-bottom-color: #23ada4;
        }
        .entity-list-container {
          max-height: 380px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-right: 5px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .entity-item-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #1e1e1e;
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          padding: 10px;
        }
        .entity-thumbnail {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          overflow: hidden;
          background: #333;
          flex-shrink: 0;
        }
        .entity-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .entity-text-details {
          flex: 1;
          margin-left: 12px;
          margin-right: 12px;
        }
        .entity-text-details h6 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 3px 0;
          width: 30ch;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .entity-text-details p {
          font-size: 12px;
          color: #7c7c7c;
          margin: 0; 
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .toggle-assign-btn {
          background: transparent;
          border: none;
          color: #7c7c7c;
          cursor: pointer;
          font-size: 18px;
          padding: 5px;
        }
        .toggle-assign-btn.assigned {
          color: #23ada4;
        }
        .save-assignment-btn {
          width: 100%;
          height: 50px;
          background: #23ada4;
          color: #fff;
          border-radius: 25px;
          font-weight: 600;
          border: none;
          margin-top: 15px;
          transition: background 0.2s ease;
        }
        .save-assignment-btn:hover {
          background: #1d9088;
        }

        @media (max-width: 767px) {
          .staff-header {
            flex-direction: row;
            gap: 10px;
          }
          .staff-header h2 {
            font-size: 22px;
          }
          .add-staff-btn-circle {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }
          .search-wrapper-staff input {
            height: 45px;
            font-size: 14px;
          }
          .staff-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          .staff-info-box {
            width: 100%;
          }
          .staff-card > div.d-flex {
            width: 100%;
            justify-content: space-between;
          }
          .entity-item-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .entity-text-details {
            margin-left: 0;
            margin-right: 0;
            width: 100%;
          }
          .entity-text-details h6 {
            width: 100%;
            white-space: normal;
          }
          .toggle-assign-btn {
            align-self: flex-end;
          }
        }
      `}</style>

      <div className="sf-tools">
        <label className="sf-search">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("stSearch")}
          />
        </label>
        <button type="button" className="sf-add" onClick={handleAddClick}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {t("stAdd")}
        </button>
      </div>

      {loadingStaff ? (
        <div className="sf-list">
          <div className="sf-skel" style={{ height: 74 }} />
          <div className="sf-skel" style={{ height: 74 }} />
          <div className="sf-skel" style={{ height: 74 }} />
        </div>
      ) : staffList.length === 0 ? (
        <div className="sf-state">
          <span className="sf-stateI">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M5 19c1.2-3 3.4-4.5 7-4.5S17.8 16 19 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <b>{t("stEmpty")}</b>
          <p>{t("stEmptyBody")}</p>
          <button type="button" className="sf-go" onClick={handleAddClick}>{t("stAdd")}</button>
        </div>
      ) : filteredStaffList.length === 0 ? (
        <div className="sf-state">
          <b>{t("stNoMatch")}</b>
          <p>{t("stNoMatchBody")}</p>
          <button type="button" className="sf-go" onClick={() => setSearchQuery("")}>{t("stClearSearch")}</button>
        </div>
      ) : (
        <section className="sf-list">
          {filteredStaffList.map((staff) => {
            const inactive = staff.status === "inactive" || staff.isActive === false;
            return (
              <div className="sf-row" key={staff._id}>
                {staff.profileImage ? (
                  <img className="sf-av" src={getFullImageUrl(staff.profileImage)} alt="" />
                ) : (
                  <span className="sf-av sf-av-empty" aria-hidden="true" />
                )}
                <span className="sf-who">
                  <b>
                    {staffName(staff)}
                    <span className={`sf-pill ${inactive ? "is-off" : "is-on"}`}>
                      {inactive ? t("stInactive") : t("stActive")}
                    </span>
                  </b>
                  <i>{staff.email}</i>
                </span>
                <span className="sf-acts">
                  {!inactive && (
                    <button type="button" className="sf-assign" onClick={() => handleOpenAssign(staff)}>
                      {t("stAssign")}
                    </button>
                  )}
                  <button
                    type="button"
                    className="sf-kebab"
                    aria-label={t("actions")}
                    onClick={() => setActiveDropdownId(activeDropdownId === staff._id ? null : staff._id)}
                  >
                    ⋯
                  </button>
                  {activeDropdownId === staff._id && (
                    <>
                      <button type="button" className="sf-menu-back" aria-label={t("close")} onClick={() => setActiveDropdownId(null)} />
                      <span className="sf-menu">
                        <button type="button" onClick={() => { setActiveDropdownId(null); handleOpenEdit(staff); }}>{t("edit")}</button>
                        <button type="button" data-del onClick={() => { setActiveDropdownId(null); setStaffToDelete(staff); setShowDeleteModal(true); }}>{t("delete")}</button>
                      </span>
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </section>
      )}

      {showAddStaff && (
        <div className="sf-scrim" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddStaff(false); setEditingStaffId(null); } }}>
          <form className="sf-sheet" noValidate onSubmit={handleStaffFormSubmit}>
            <div className="sf-sheetHead">
              <div>
                <b>{editingStaffId ? t("stEdit") : t("stAdd")}</b>
                <span>{editingStaffId ? t("stEditSub") : t("stAddSub")}</span>
              </div>
              <button type="button" className="sf-x" aria-label={t("close")} onClick={() => { setShowAddStaff(false); setEditingStaffId(null); }}>×</button>
            </div>
            <p className="sf-note">{t("stNote")}</p>
            <div className="sf-photo">
              {formPhoto ? (
                <img className="sf-av" src={getFullImageUrl(formPhoto)} alt="" />
              ) : (
                <span className="sf-av sf-av-empty" aria-hidden="true" />
              )}
              <span className="sf-photoTxt">
                <b>{formPhoto ? t("stImageAdded") : t("stNoImage")}</b>
                <span>{formPhoto ? t("stPhotoSaved") : t("stPhotoType")}</span>
              </span>
              <label className="sf-gh sf-pick">
                {uploadingPhoto ? "…" : t("stAddImage")}
                <input type="file" accept="image/png,image/jpeg" ref={fileInputRef} onChange={handlePhotoUpload} />
              </label>
            </div>
            <label className="sf-f">
              <span className="sf-lb">{t("stFullName")} <i>*</i></span>
              <input className="sf-in" type="text" maxLength={80} value={formFullName} onChange={(e) => { setFormFullName(e.target.value); setNameError(""); }} placeholder={t("stNamePh")} aria-invalid={nameError ? "true" : "false"} />
              {nameError ? <span className="sf-er">{nameError}</span> : null}
            </label>
            <label className="sf-f">
              <span className="sf-lb">{t("stEmail")} <i>*</i></span>
              <input className="sf-in" type="email" maxLength={120} value={formEmail} onChange={(e) => { setFormEmail(e.target.value); setEmailError(""); }} placeholder={t("stEmailPh")} aria-invalid={emailError ? "true" : "false"} />
              {emailError ? <span className="sf-er">{emailError}</span> : null}
            </label>
            <div className="sf-f">
              <span className="sf-lb">{t("stPassword")} <i>*</i></span>
              <span className="sf-pw">
                <input
                  className="sf-in"
                  type={showPassword ? "text" : "password"}
                  maxLength={64}
                  value={formPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder={t("stPwPh")}
                  aria-invalid={passwordError ? "true" : "false"}
                />
                <button type="button" className="sf-eye" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? t("stHide") : t("stView")}
                </button>
              </span>
              {passwordError ? <span className="sf-er">{passwordError}</span> : null}
              <span className="sf-hint">{editingStaffId ? t("stPwEdit") : t("stPwAdd")}</span>
            </div>
            <div className="sf-sheetActs sf-formActs">
              <button type="submit" className="sf-go" disabled={submittingStaff || uploadingPhoto}>
                {submittingStaff ? "…" : editingStaffId ? t("stSave") : t("stAdd")}
              </button>
              <button type="button" className="sf-gh" onClick={() => { setShowAddStaff(false); setEditingStaffId(null); }}>{t("cancel")}</button>
            </div>
          </form>
        </div>
      )}

      {showAssignModal && assignStep === "type" && (
        <div className="sf-scrim" onClick={(e) => { if (e.target === e.currentTarget) setShowAssignModal(false); }}>
          <div className="sf-sheet sf-sheet-sm">
            <div className="sf-sheetHead">
              <div>
                <b>{t("stChooseType")}</b>
                <span>{staffName(selectedStaff)}</span>
              </div>
              <button type="button" className="sf-x" aria-label={t("close")} onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div className="sf-pick-grid">
              <button type="button" className="sf-opt" onClick={() => { setActiveTab("events"); setEntitySearchQuery(""); setAssignStep("list"); }}>
                <b>{t("stAssignEvent")}</b>
                <span>{t("stAssignEventBody")}</span>
              </button>
              <button type="button" className="sf-opt" onClick={() => { setActiveTab("courses"); setEntitySearchQuery(""); setAssignStep("list"); }}>
                <b>{t("stAssignCourse")}</b>
                <span>{t("stAssignCourseBody")}</span>
              </button>
            </div>
            <div className="sf-sheetActs">
              <button type="button" className="sf-gh" onClick={() => setShowAssignModal(false)}>{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && assignStep === "list" && (
        <div className="sf-scrim" onClick={(e) => { if (e.target === e.currentTarget) setShowAssignModal(false); }}>
          <div className="sf-sheet">
            <div className="sf-sheetHead">
              <div>
                <b>{activeTab === "courses" ? t("stAssignCourse") : t("stAssignEvent")}</b>
                <span>{staffName(selectedStaff)}</span>
              </div>
              <button type="button" className="sf-x" aria-label={t("close")} onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <label className="sf-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={entitySearchQuery}
                onChange={(e) => setEntitySearchQuery(e.target.value)}
                placeholder={activeTab === "courses" ? t("stSearchCourses") : t("stSearchEvents")}
              />
            </label>
            {loadingEntities ? (
              <div className="sf-list">
                <div className="sf-skel" style={{ height: 62 }} />
                <div className="sf-skel" style={{ height: 62 }} />
              </div>
            ) : filteredEntities.length === 0 ? (
              <div className="sf-state">
                <b>{entitySearchQuery.trim() ? t("stNoAssignMatch") : activeTab === "courses" ? t("stNoCourses") : t("stNoEvents")}</b>
                <p>{entitySearchQuery.trim() ? t("stCheckSearch") : t("stAssignLater")}</p>
                {entitySearchQuery.trim() ? (
                  <button type="button" className="sf-gh" onClick={() => setEntitySearchQuery("")}>{t("stClearSearch")}</button>
                ) : null}
              </div>
            ) : (
              <div className="sf-list">
                {filteredEntities.map((item) => {
                  const on = !!assignedMap[item._id];
                  return (
                    <button
                      type="button"
                      key={item._id}
                      className="sf-arow"
                      aria-selected={on ? "true" : "false"}
                      onClick={() => handleToggleAssignItem(item._id)}
                    >
                      <span className="sf-check">✓</span>
                      <span>
                        <b>{item.eventTitle || item.courseTitle}</b>
                        <i>{itemMeta(item)}</i>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {selectedCount > 0 && (
              <div className="sf-sel">
                <span>{t("stSelected", { count: selectedCount })}</span>
                <button type="button" onClick={clearAssignSelection}>{t("stClearSel")}</button>
              </div>
            )}
            <div className="sf-sheetActs">
              <button type="button" className="sf-go" onClick={handleSaveAssignments} disabled={savingAssignments}>
                {savingAssignments ? "…" : t("stSave")}
              </button>
              <button type="button" className="sf-gh" onClick={() => setShowAssignModal(false)}>{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="sf-scrim" onClick={(e) => { if (e.target === e.currentTarget && !deletingStaff) setShowDeleteModal(false); }}>
          <div className="sf-sheet sf-sheet-sm">
            <b className="sf-ask">{t("stRemoveAsk")}</b>
            <p className="sf-askBody">
              {staffToDelete ? staffName(staffToDelete) : ""} — {t("stRemoveBody")}
            </p>
            <div className="sf-sheetActs">
              <button type="button" className="sf-danger" onClick={handleDeleteStaff} disabled={deletingStaff}>
                {deletingStaff ? "…" : t("stRemove")}
              </button>
              <button type="button" className="sf-gh" onClick={() => setShowDeleteModal(false)}>{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffPage;
