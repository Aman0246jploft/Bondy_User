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
  };

  // Open edit view for a specific staff member
  const handleOpenEdit = (staff) => {
    setEditingStaffId(staff._id);
    setFormFullName(`${staff.firstName || ""} ${staff.lastName || ""}`.trim());
    setFormEmail(staff.email || "");
    setFormPassword(""); // optional during edit
    setFormPhoto(staff.profileImage || "");
    setShowAddStaff(true);
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
    if (!formFullName.trim() || !formEmail.trim()) {
      toast.error(t("fillRequiredFields") || "Please fill in all required fields.");
      return;
    }
    if (!editingStaffId && !formPassword.trim()) {
      toast.error(t("passwordRequired") || "Password is required for new staff.");
      return;
    }

    try {
      setSubmittingStaff(true);
      const payload = {
        fullname: formFullName,
        email: formEmail,
        profilePhoto: formPhoto || null,
      };
      if (formPassword.trim()) {
        payload.password = formPassword;
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

  return (
    <div className="staff-container">
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
          margin-bottom: 25px;
        }
       .overlay-header .back-arrow-btn{
          outline: none;       
          background: #121212;
          border: 1px solid rgba(255, 255, 255, .06);
          color: #fff;
          border-radius: 12px;
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
      `}</style>

      {/* --------------------------------------------------------------- */}
      {/* ADD STAFF VIEW */}
      {/* --------------------------------------------------------------- */}
      {showAddStaff ? (
        <div className="cards">
          <div className="add-staff-header">
            <button
              className="back-arrow-btn"
              onClick={() => {
                setShowAddStaff(false);
                setEditingStaffId(null);
              }}>
              &#8592;
            </button>
            <h2>{editingStaffId ? (t("editStaff") || "Edit Staff") : (t("addStaff") || "Add Staff")}</h2>
          </div>
          <p
            style={{
              color: "#7c7c7c",
              fontSize: "14px",
              marginBottom: "30px",
            }}>
            {editingStaffId
              ? (t("editStaffDesc") || "Update this team member's information.")
              : (t("addStaffDesc") || "Assign a new team member to your scanning pool. They will be able to access the event check-in tools immediately.")}
          </p>

          <form onSubmit={handleStaffFormSubmit}>
            {/* Circle Upload Photo */}
            <div
              className="photo-upload-circle"
              onClick={() => !uploadingPhoto && fileInputRef.current.click()}>
              {uploadingPhoto ? (
                <Spinner animation="border" size="sm" variant="light" />
              ) : formPhoto ? (
                <img
                  src={getFullImageUrl(formPhoto)}
                  alt="Avatar Preview"
                  className="photo-preview"
                  onError={(e) => { e.target.src = "/img/sidebar-logo.svg"; }}
                />
              ) : (
                <div className="upload-placeholder">
                  {/* <svg viewBox="0 0 24 24">
                    <path d="M19 12h-2v3h-3v2h3v3h2v-3h3v-2h-3zM11.5 8.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM17 9.5V6H7L4.5 9.5 3 8v11h11v-2H5.4l1.6-2.2 2.2 2.2h3.8z" />
                  </svg> */}
                  <span>{t("addPhoto") || "Add Photo"}</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handlePhotoUpload}
              />
            </div>

            {/* Inputs */}
            <div className="staff-form-group">
              <label>{t("fullNameLabel") || "Full Name"} *</label>
              <input
                type="text"
                placeholder={t("enterFullNamePlaceholder") || "Enter full name"}
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                required
              />
            </div>

            <div className="staff-form-group">
              <label>{t("staffEmailLabel") || "Staff Email"} *</label>
              <input
                type="email"
                placeholder={t("enterStaffEmailPlaceholder") || "Enter staff email"}
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </div>

            <div className="staff-form-group">
              <label>{t("passwordLabel") || "Password"}{!editingStaffId && " *"}</label>
              <input
                type="password"
                placeholder={editingStaffId ? (t("enterNewPasswordPlaceholder") || "Enter new password (optional)") : (t("enterPasswordPlaceholder") || "Enter password")}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required={!editingStaffId}
              />
            </div>

            <button
              type="submit"
              className="submit-staff-btn"
              disabled={submittingStaff}>
              {submittingStaff ? (
                <Spinner animation="border" size="sm" />
              ) : editingStaffId ? (
                t("saveChanges") || "Save Changes"
              ) : (
                t("addStaffMember") || "Add Staff Member"
              )}
            </button>
          </form>
        </div>
      ) : (
        /* --------------------------------------------------------------- */
        /* STAFF LIST VIEW */
        /* --------------------------------------------------------------- */
        <div className="cards">
          <div className="staff-header">
            <h2>{t("staffHeader") || "Staff"}</h2>
            <button
              className="add-staff-btn-circle"
              onClick={handleAddClick}>
              +
            </button>
          </div>

          <div className="search-wrapper-staff">
            <svg
              className="search-icon"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
            </svg>
            <input
              type="text"
              placeholder={t("searchStaffPlaceholder") || "Search by name, email or Staff ID..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loadingStaff ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="teal" />
            </div>
          ) : filteredStaffList.length === 0 ? (
            <div className="text-center py-5" style={{ color: "#7c7c7c" }}>
              {t("noStaffMembersFound") || "No staff members found."}
            </div>
          ) : (
            <div className="staff-list">
              {filteredStaffList.map((staff) => (
                <div className="staff-card" key={staff._id}>
                  <div className="staff-info-box">
                    <div className="staff-avatar-circle">
                      <img
                        src={staff.profileImage ? getFullImageUrl(staff.profileImage) : "/img/sidebar-logo.svg"}
                        alt="Avatar"
                        onError={(e) => { e.target.src = "/img/sidebar-logo.svg"; }}
                      />
                    </div>
                    <div className="staff-details">
                      <h5>
                        {`${staff.firstName || ""} ${staff.lastName || ""}`.trim() ||
                          t("staffMember") || "Staff Member"}
                      </h5>
                      <p>{staff.email}</p>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <button
                      className="assign-action-btn"
                      onClick={() => handleOpenAssign(staff)}>
                      <img src="/img/ticket-icon.svg" alt="Assign" />
                      <span>{t("assignEvent") || "Assign Event"}</span>
                    </button>

                    <div className="staff-actions-wrapper">
                      <button
                        type="button"
                        className="three-dots-btn"
                        onClick={() => {
                          setActiveDropdownId(activeDropdownId === staff._id ? null : staff._id);
                        }}>
                        ⋮
                      </button>
                      {activeDropdownId === staff._id && (
                        <>
                          <div
                            style={{
                              position: "fixed",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              zIndex: 999,
                              background: "transparent",
                            }}
                            onClick={() => setActiveDropdownId(null)}
                          />
                          <div className="staff-dropdown-menu" style={{ zIndex: 1000 }}>
                            <button
                              type="button"
                              className="staff-dropdown-item"
                              onClick={() => {
                                setActiveDropdownId(null);
                                handleOpenEdit(staff);
                              }}>
                              {t("edit") || "Edit"}
                            </button>
                            <button
                              type="button"
                              className="staff-dropdown-item delete"
                              onClick={() => {
                                setActiveDropdownId(null);
                                setStaffToDelete(staff);
                                setShowDeleteModal(true);
                              }}>
                              {t("delete") || "Delete"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* ASSIGNED EVENTS/COURSES MODAL */}
      {/* --------------------------------------------------------------- */}
      <Modal
        show={showAssignModal}
        onHide={() => setShowAssignModal(false)}
        centered
        className="dark-modal">
        <Modal.Header closeButton>
          <Modal.Title>{t("assignedEventsTitle") || "Assigned Events"}</Modal.Title>
        </Modal.Header>
        <Modal.Body
          className="p-0"
          style={{ background: "#161616", padding: "0 !important" }}>
          {/* Tabs */}
          <div className="modal-tabs">
            <button
              className={`modal-tab-btn ${activeTab === "events" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("events");
                setEntitySearchQuery("");
              }}>
              {t("eventsTab") || "Events"}
            </button>
            <button
              className={`modal-tab-btn ${activeTab === "courses" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("courses");
                setEntitySearchQuery("");
              }}>
              {t("coursesTab") || "Courses"}
            </button>
          </div>

          {/* Search */}
          <div
            className="search-wrapper-staff"
            style={{ marginBottom: "15px" }}>
            <svg
              className="search-icon"
              width="14"
              height="14"
              fill="currentColor"
              viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
            </svg>
            <input
              type="text"
              placeholder={activeTab === "events" ? (t("searchByEventName") || "Search by event name...") : (t("searchByCourseName") || "Search by course name...")}
              value={entitySearchQuery}
              onChange={(e) => setEntitySearchQuery(e.target.value)}
              style={{
                height: "42px",
                borderRadius: "21px",
                paddingLeft: "42px",
              }}
            />
          </div>

          {/* Scrollable list */}
          {loadingEntities ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="teal" />
            </div>
          ) : filteredEntities.length === 0 ? (
            <div className="text-center py-4" style={{ color: "#7c7c7c" }}>
              {activeTab === "events" ? (t("noEventsFound") || "No events found.") : (t("noCoursesFound") || "No courses found.")}
            </div>
          ) : (
            <div className="entity-list-container" ref={entityListRef}>
              {filteredEntities.map((item) => {
                const title = item.eventTitle || item.courseTitle;
                const isAssigned = !!assignedMap[item._id];
                const dateStr = item.startDate
                  ? new Date(item.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                  : "";
                const endDateStr = item.endDate
                  ? new Date(item.endDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                  : "";
                const location = item.venueName || "Online";

                const poster =
                  Array.isArray(item.posterImage) && item.posterImage.length > 0
                    ? getFullImageUrl(item.posterImage[0])
                    : "";

                return (
                  <div className="entity-item-card" key={item._id}>
                    <div className="entity-thumbnail">
                      <img
                        src={poster || "/img/sidebar-logo.svg"}
                        alt="Thumbnail"
                        onError={(e) => { e.target.src = "/img/sidebar-logo.svg"; }}
                      />
                    </div>
                    <div className="entity-text-details">
                      <h6>{title}</h6>
                      <p>{`${dateStr} - ${endDateStr} , ${location}`}</p>
                    </div>

                    <button
                      className={`toggle-assign-btn ${isAssigned ? "assigned" : ""}`}
                      onClick={() => handleToggleAssignItem(item._id)}>
                      {isAssigned ? (
                        <svg
                          width="24"
                          height="24"
                          fill="currentColor"
                          viewBox="0 0 16 16">
                          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                        </svg>
                      ) : (
                        <svg
                          width="24"
                          height="24"
                          fill="currentColor"
                          viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Save Button */}
          <button
            className="save-assignment-btn"
            onClick={handleSaveAssignments}
            disabled={savingAssignments}>
            {savingAssignments ? (
              <Spinner animation="border" size="sm" />
            ) : (
              t("save") || "Save"
            )}
          </button>
        </Modal.Body>
      </Modal>

      {/* --------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* --------------------------------------------------------------- */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        className="dark-modal">
        <Modal.Header closeButton>
          <Modal.Title>{t("deleteStaffTitle") || "Delete Staff Member"}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#161616", padding: "20px" }}>
          <p style={{ color: "#fff", fontSize: "16px", marginBottom: "25px" }}>
            {t("deleteStaffConfirmText") || "Are you sure you want to delete this staff member? This action cannot be undone."}
          </p>
          <div className="d-flex gap-3 justify-content-end">
            <button
              className="btn btn-secondary px-4 py-2"
              style={{ borderRadius: "20px", fontSize: "14px" }}
              onClick={() => setShowDeleteModal(false)}>
              {t("cancel") || "Cancel"}
            </button>
            <button
              className="btn btn-danger px-4 py-2"
              style={{ borderRadius: "20px", fontSize: "14px" }}
              onClick={handleDeleteStaff}
              disabled={deletingStaff}>
              {deletingStaff ? (
                <Spinner animation="border" size="sm" />
              ) : (
                t("yesDelete") || "Yes, Delete"
              )}
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default StaffPage;
