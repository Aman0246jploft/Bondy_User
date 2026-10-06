"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import courseApi from "@/api/courseApi";
import promotionsApi from "@/api/promotionsApi";
import { getFullImageUrl } from "@/utils/imageHelper";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatCourseDate(dateStr, isMn) {
  if (!dateStr) return isMn ? "Огноо тодорхойгүй" : "Date not set";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return isMn ? "Огноо тодорхойгүй" : "Date not set";

  const mnMonths = ["1-р", "2-р", "3-р", "4-р", "5-р", "6-р", "7-р", "8-р", "9-р", "10-р", "11-р", "12-р"];
  const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const m = d.getMonth();
  const dayNum = d.getDate();
  return isMn ? `${mnMonths[m]} сарын ${dayNum}` : `${enMonths[m]} ${dayNum}`;
}

function getCourseBadge(course, tab, isMn) {
  if (tab === "draft") {
    return { hasStatus: false, status: "", statusColor: "gray" };
  }
  if (tab === "past" || course.status?.toLowerCase() === "past") {
    return { hasStatus: true, status: isMn ? "Дууссан" : "Completed", statusColor: "gray" };
  }
  if (course.status?.toLowerCase() === "cancelled" || course.closed) {
    return { hasStatus: true, status: isMn ? "Бүртгэл хаагдсан" : "Closed", statusColor: "gray" };
  }

  const taken = Number(course.totalEnrollments ?? course.totalBooked ?? course.acquiredSeats ?? 0);
  const cap = Number(course.totalSeats ?? 0);
  const full = cap > 0 && taken >= cap;

  if (full) {
    return { hasStatus: true, status: isMn ? "Дүүрсэн" : "Full", statusColor: "warning" };
  }

  return { hasStatus: true, status: isMn ? "Элсэлт нээлттэй" : "Open", statusColor: "brand" };
}

function getEnrolledString(course) {
  const taken = Number(course.totalEnrollments ?? course.totalBooked ?? course.acquiredSeats ?? 0);
  const cap = Number(course.totalSeats ?? 0);
  return cap > 0 ? `${taken} / ${cap}` : `${taken}`;
}

export default function CoursesManagementPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isMn = language === "mn";

  // ─── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("published"); // 'published' | 'draft' | 'past'
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Separate caches for accurate tab badge counts
  const [publishedCourses, setPublishedCourses] = useState([]);
  const [draftCourses, setDraftCourses] = useState([]);
  const [pastCourses, setPastCourses] = useState([]);

  // Kebab Menu State
  const [activeMenu, setActiveMenu] = useState(null); // { id, course, left, top }
  const [toastMessage, setToastMessage] = useState("");

  // Promotion Modal
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [selectedCourseForPromo, setSelectedCourseForPromo] = useState(null);
  const [promoPackages, setPromoPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Delete Draft Modal
  const [deleteDraftModal, setDeleteDraftModal] = useState(null); // course object
  const [deleting, setDeleting] = useState(false);
  const [delDone, setDelDone] = useState(false);
  const [delErr, setDelErr] = useState("");

  // ─── Fetch All Categories of Courses ────────────────────────────────────────
  const fetchAllCourses = useCallback(async () => {
    try {
      setLoading(true);

      const [pubRes, draftRes, pastRes] = await Promise.allSettled([
        // Published (Upcoming & Live)
        courseApi.getOrganizerCourses({ isDraft: "false", status: "Upcoming,Live", limit: 50 }),
        // Drafts
        courseApi.getOrganizerCourses({ isDraft: "true", limit: 50 }),
        // Past
        courseApi.getOrganizerCourses({ isDraft: "false", status: "Past", limit: 50 }),
      ]);

      if (pubRes.status === "fulfilled" && pubRes.value?.data) {
        const cs = pubRes.value.data.courses || pubRes.value.data || [];
        setPublishedCourses(Array.isArray(cs) ? cs : []);
      }

      if (draftRes.status === "fulfilled" && draftRes.value?.data) {
        const cs = draftRes.value.data.courses || draftRes.value.data || [];
        setDraftCourses(Array.isArray(cs) ? cs : []);
      }

      if (pastRes.status === "fulfilled" && pastRes.value?.data) {
        const cs = pastRes.value.data.courses || pastRes.value.data || [];
        setPastCourses(Array.isArray(cs) ? cs : []);
      }
    } catch (err) {
      console.error("Failed to load courses list:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCourses();
    document.title = isMn ? "Сургалт - Bondy" : "Courses - Bondy";
  }, [fetchAllCourses, isMn]);

  // Flash Toast Notification
  const flashToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 2400);
  };

  // Close floating menu on document click
  useEffect(() => {
    const handleDocClick = (e) => {
      if (!e.target.closest("[data-rowmenu]") && !e.target.closest(".lm-menu")) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  // ─── Filtered Courses by Search & Tab ───────────────────────────────────────
  const currentList = useMemo(() => {
    let base = [];
    if (activeTab === "published") base = publishedCourses;
    else if (activeTab === "draft") base = draftCourses;
    else if (activeTab === "past") base = pastCourses;

    if (!searchQuery.trim()) return base;

    const q = searchQuery.toLowerCase().trim();
    return base.filter((c) => {
      const title = (c.courseTitle || c.title || "").toLowerCase();
      const cat = (c.courseCategory?.name || c.category?.name || "").toLowerCase();
      const desc = (c.description || "").toLowerCase();
      return title.includes(q) || cat.includes(q) || desc.includes(q);
    });
  }, [activeTab, publishedCourses, draftCourses, pastCourses, searchQuery]);

  // ─── Menu Action Handlers ──────────────────────────────────────────────────
  const handleOpenMenu = (e, course) => {
    e.stopPropagation();
    if (activeMenu?.id === course._id) {
      setActiveMenu(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const W = 196;
    const H = 210;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = Math.max(12, Math.min(rect.right - W, windowWidth - W - 12));
    let top = rect.bottom + 8 + H > windowHeight ? Math.max(12, rect.top - H - 8) : rect.bottom + 8;

    setActiveMenu({
      id: course._id,
      course,
      left: Math.round(left),
      top: Math.round(top),
    });
  };

  const handleRowClick = (course) => {
    if (course.isDraft || activeTab === "draft") {
      router.push(`/AddProgram?courseId=${course._id}`);
    } else {
      router.push(`/CourseDetailOrganiser?courseId=${course._id}`);
    }
  };

  // Share Link Action
  const handleShareLink = (course) => {
    setActiveMenu(null);
    const url = `${window.location.origin}/programDetails?id=${course._id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    flashToast(isMn ? "Нийтийн хуудасны линк хуулагдлаа" : "Public link copied to clipboard");
  };

  // Duplicate / Copy Action
  const handleDuplicateCourse = async (course) => {
    setActiveMenu(null);
    const cloneTitle = `${course.courseTitle || course.title || "Сургалт"} (хуулбар)`;
    try {
      const payload = {
        courseTitle: cloneTitle,
        description: course.description || "",
        courseCategory: course.courseCategory?._id || course.courseCategory,
        duration: course.duration,
        enrollmentType: course.enrollmentType || "fixedStart",
        startDate: course.startDate,
        endDate: course.endDate,
        price: course.price,
        coverImage: course.coverImage,
        posterImage: course.posterImage || [],
        isDraft: true,
      };

      const res = await courseApi.createCourse(payload);
      if (res?.data?.data || res?.data?.course) {
        const created = res.data.data || res.data.course;
        setDraftCourses((prev) => [created, ...prev]);
      } else {
        setDraftCourses((prev) => [
          {
            ...course,
            _id: `copy-${Date.now()}`,
            courseTitle: cloneTitle,
            isDraft: true,
            totalEnrollments: 0,
            totalRevenue: 0,
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.warn("Optimistic duplicate:", err);
      setDraftCourses((prev) => [
        {
          ...course,
          _id: `copy-${Date.now()}`,
          courseTitle: cloneTitle,
          isDraft: true,
          totalEnrollments: 0,
          totalRevenue: 0,
        },
        ...prev,
      ]);
    }
    setActiveTab("draft");
    flashToast(isMn ? "Ноорог хуулбар үүслээ" : "Draft copy created");
  };

  // Delete Draft Action
  const handleDeleteDraft = async () => {
    if (!deleteDraftModal) return;
    setDeleting(true);
    setDelErr("");

    try {
      await courseApi.deleteDraftCourse(deleteDraftModal._id);
      setDraftCourses((prev) => prev.filter((c) => c._id !== deleteDraftModal._id));
      setDelDone(true);
    } catch (err) {
      console.error("Failed to delete draft:", err);
      const msg =
        err.response?.data?.message ||
        (isMn ? "Устгаж чадсангүй. Сүлжээгээ шалгаад дахин оролдоно уу." : "Failed to delete. Please try again.");
      setDelErr(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Open Promotion Modal
  const openPromoModal = async (course) => {
    setActiveMenu(null);
    setSelectedCourseForPromo(course);
    setShowPromoModal(true);
    setSelectedPackage(null);

    try {
      setLoadingPackages(true);
      const res = await promotionsApi.getCoursePackages();
      if (res?.data?.data) {
        setPromoPackages(res.data.data);
      } else if (Array.isArray(res?.data)) {
        setPromoPackages(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch promo packages:", err);
    } finally {
      setLoadingPackages(false);
    }
  };

  // Checkout Promotion
  const handleCheckoutPromo = async () => {
    if (!selectedPackage || !selectedCourseForPromo) return;
    try {
      setCheckingOut(true);
      const res = await promotionsApi.checkoutCoursePromotion({
        courseId: selectedCourseForPromo._id,
        packageId: selectedPackage._id,
      });

      if (res?.data?.invoiceUrl || res?.data?.paymentUrl) {
        window.location.href = res.data.invoiceUrl || res.data.paymentUrl;
      } else {
        flashToast(isMn ? "Сурталчилгаа амжилттай захиалагдлаа!" : "Promotion activated successfully!");
        setShowPromoModal(false);
      }
    } catch (err) {
      console.error("Failed to checkout promotion:", err);
      flashToast(isMn ? "Алдаа гарлаа. Дахин оролдоно уу." : "Checkout failed. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  const isPastTab = activeTab === "past";
  const dateColHeader = isPastTab
    ? isMn
      ? "Дууссан огноо"
      : "End Date"
    : isMn
    ? "Эхлэх огноо"
    : "Start Date";

  return (
    <main
      data-screen-label="Сургалт"
      style={{
        flex: 1,
        padding: "clamp(20px, 2.4vw, 30px) clamp(18px, 2.4vw, 32px) clamp(48px, 4vw, 64px)",
      }}
    >
      {/* ─── Mobile Top Header ────────────────────────────────────────────── */}
      <div className="lm-mobbar">
        <button
          type="button"
          className="lm-mobback"
          onClick={() => router.push("/Dashboard")}
          aria-label={isMn ? "Буцах" : "Back"}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="lm-mobbarT">
          {isMn ? "Миний сургалтууд" : "My Courses"}
        </span>
      </div>
        {/* ─── Tabs List ────────────────────────────────────────────────────── */}
        <div className="og-tabs bd-scroll" role="tablist">
          <button
            type="button"
            className="og-tab"
            role="tab"
            data-tab="published"
            aria-selected={activeTab === "published"}
            onClick={() => setActiveTab("published")}
          >
            {isMn ? "Нийтлэгдсэн" : "Published"}
            <span className="og-tab-n" data-tab-n="published">
              {publishedCourses.length}
            </span>
          </button>

          <button
            type="button"
            className="og-tab"
            role="tab"
            data-tab="draft"
            aria-selected={activeTab === "draft"}
            onClick={() => setActiveTab("draft")}
          >
            {isMn ? "Ноорог" : "Draft"}
            <span className="og-tab-n" data-tab-n="draft">
              {draftCourses.length}
            </span>
          </button>

          <button
            type="button"
            className="og-tab"
            role="tab"
            data-tab="past"
            aria-selected={activeTab === "past"}
            onClick={() => setActiveTab("past")}
          >
            {isMn ? "Өнгөрсөн" : "Past"}
            <span className="og-tab-n" data-tab-n="past">
              {pastCourses.length}
            </span>
          </button>
        </div>

        {/* ─── Tools Row: Search + Create CTA ───────────────────────────────── */}
        <div
          className="lm-tools"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flex: "1 1 260px",
              minWidth: 0,
              maxWidth: "380px",
              height: "44px",
              padding: "0 14px",
              borderRadius: "14px",
              background: "var(--bd-ink-850)",
              border: "1px solid var(--bd-border)",
              boxSizing: "border-box",
              cursor: "text",
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--bd-gray-600)", flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder={isMn ? "Сургалт хайх" : "Search courses..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--bd-white)",
                fontFamily: "var(--bd-font-ui)",
                fontSize: "14px",
              }}
            />
          </label>

          <Link
            href="/AddProgram"
            className="lm-new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              height: "40px",
              padding: "0 18px",
              borderRadius: "999px",
              background: "var(--acc)",
              color: "var(--bd-white)",
              fontFamily: "var(--bd-font-ui)",
              fontSize: "13.5px",
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "filter 160ms ease, transform 160ms ease",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span>{isMn ? "Сургалт үүсгэх" : "Create Course"}</span>
          </Link>
        </div>

        {/* ─── Courses Table Panel ─────────────────────────────────────────── */}
        <section className="lm-panel" data-past={isPastTab ? "1" : "0"}>
          {/* Header Row */}
          <div className="lm-row og-head">
            <span>{isMn ? "Нэр" : "Name"}</span>
            <span>{dateColHeader}</span>
            <span>{isMn ? "Бүртгүүлсэн" : "Enrolled"}</span>
            <span></span>
            <span></span>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{ padding: "48px 18px", textAlign: "center", color: "var(--bd-gray-500)" }}>
              <div
                className="lm-sp"
                style={{
                  width: "24px",
                  height: "24px",
                  borderWidth: "2.5px",
                  margin: "0 auto 12px",
                  borderColor: "rgba(35, 173, 164, 0.25)",
                  borderTopColor: "var(--acc-bright)",
                }}
              />
              <p style={{ margin: 0, fontSize: "14px" }}>
                {isMn ? "Сургалтын жагсаалтыг уншиж байна..." : "Loading courses..."}
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && currentList.length === 0 && (
            <p style={{ margin: 0, padding: "38px 18px", textAlign: "center", fontSize: "13.5px", color: "var(--bd-gray-600)" }}>
              {searchQuery.trim()
                ? isMn
                  ? "Хайлтад тохирох сургалт олдсонгүй."
                  : "No courses match your search."
                : isMn
                ? "Энэ хэсэгт сургалт байхгүй байна."
                : "No courses found."}
            </p>
          )}

          {/* Course Rows */}
          {!loading &&
            currentList.map((course) => {
              const coverUrl = getFullImageUrl(
                course.coverImage || course.posterImage?.[0] || course.media?.[0]
              );
              const badge = getCourseBadge(course, activeTab, isMn);
              const enrolledText = getEnrolledString(course);
              const dateVal = isPastTab
                ? formatCourseDate(course.endDate || course.startDate, isMn)
                : formatCourseDate(course.startDate, isMn);

              return (
                <button
                  key={course._id}
                  type="button"
                  className="lm-row"
                  onClick={() => handleRowClick(course)}
                >
                  {/* Column 1: Cover + Title */}
                  <span style={{ display: "flex", alignItems: "center", gap: "13px", minWidth: 0 }}>
                    <span
                      className="lm-cover"
                      style={{
                        backgroundImage: `url("${coverUrl}")`,
                      }}
                    />
                    <span style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                      <b
                        style={{
                          fontSize: "14.5px",
                          fontWeight: 700,
                          color: "var(--bd-white)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {course.courseTitle || course.title || (isMn ? "Гарчиггүй сургалт" : "Untitled Course")}
                      </b>
                    </span>
                  </span>

                  {/* Column 2: Date */}
                  <span style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                    <span className="lm-cLbl">{dateColHeader}</span>
                    <b
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 600,
                        color: "var(--bd-white)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {dateVal}
                    </b>
                  </span>

                  {/* Column 3: Enrolled */}
                  <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--bd-white)", whiteSpace: "nowrap" }}>
                    {enrolledText}
                  </span>

                  {/* Column 4: Status Badge (Hidden for Past tab via CSS) */}
                  <span>
                    {badge.hasStatus && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "24px",
                          padding: "0 10px",
                          borderRadius: "999px",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          ...(badge.statusColor === "brand"
                            ? {
                                background: "rgba(35, 173, 164, 0.14)",
                                color: "var(--acc-bright, #36cec2)",
                                border: "1px solid rgba(35, 173, 164, 0.28)",
                              }
                            : badge.statusColor === "warning"
                            ? {
                                background: "rgba(255, 170, 0, 0.12)",
                                color: "#ffaa00",
                                border: "1px solid rgba(255, 170, 0, 0.28)",
                              }
                            : {
                                background: "rgba(255, 255, 255, 0.08)",
                                color: "var(--bd-gray-400, #aaa)",
                                border: "1px solid rgba(255, 255, 255, 0.12)",
                              }),
                        }}
                      >
                        {badge.status}
                      </span>
                    )}
                  </span>

                  {/* Column 5: Actions (Kebab Dots Menu) */}
                  <span className="lm-acts">
                    <span
                      className="lm-dots"
                      data-rowmenu
                      role="button"
                      aria-label={isMn ? "Үйлдэл" : "Actions"}
                      onClick={(e) => handleOpenMenu(e, course)}
                    >
                      <i />
                      <i />
                      <i />
                    </span>
                  </span>
                </button>
              );
            })}
        </section>

      {/* ─── Floating Kebab Action Menu ──────────────────────────────────── */}
      {activeMenu && (
        <>
          <div
            className="lm-menuScrim"
            onClick={() => setActiveMenu(null)}
          />
          <div
            className="lm-menu"
            style={{
              left: `${activeMenu.left}px`,
              top: `${activeMenu.top}px`,
            }}
          >
            {/* Edit */}
            <button
              type="button"
              className="lm-mi"
              onClick={() => {
                const c = activeMenu.course;
                setActiveMenu(null);
                router.push(`/AddProgram?courseId=${c._id}`);
              }}
            >
              {isMn ? "Засах" : "Edit"}
            </button>

            {/* View */}
            <button
              type="button"
              className="lm-mi"
              onClick={() => {
                const c = activeMenu.course;
                setActiveMenu(null);
                if (c.isDraft) {
                  router.push(`/AddProgram?courseId=${c._id}`);
                } else {
                  router.push(`/CourseDetailOrganiser?courseId=${c._id}`);
                }
              }}
            >
              {isMn ? "Үзэх" : "View"}
            </button>

            {/* Share */}
            {!activeMenu.course.isDraft && (
              <button
                type="button"
                className="lm-mi"
                onClick={() => handleShareLink(activeMenu.course)}
              >
                {isMn ? "Хуваалцах" : "Share"}
              </button>
            )}

            {/* Duplicate */}
            <button
              type="button"
              className="lm-mi"
              onClick={() => handleDuplicateCourse(activeMenu.course)}
            >
              {isMn ? "Хуулбарлах" : "Duplicate"}
            </button>

            {/* Promote (if not draft & upcoming) */}
            {!activeMenu.course.isDraft && activeTab !== "past" && (
              <button
                type="button"
                className="lm-mi"
                onClick={() => openPromoModal(activeMenu.course)}
              >
                ⭐ {isMn ? "Сурталчилгаа" : "Promote"}
              </button>
            )}

            {/* Delete Draft */}
            {activeMenu.course.isDraft && (
              <button
                type="button"
                className="lm-mi lm-del-mi"
                onClick={() => {
                  const c = activeMenu.course;
                  setActiveMenu(null);
                  setDeleteDraftModal(c);
                  setDelDone(false);
                  setDelErr("");
                }}
              >
                {isMn ? "Устгах" : "Delete"}
              </button>
            )}
          </div>
        </>
      )}

      {/* ─── Flash Toast ─────────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="lm-toast">
          {toastMessage}
        </div>
      )}

      {/* ─── Delete Draft Confirmation Modal ──────────────────────────────── */}
      {deleteDraftModal && (
        <div
          className="lm-scrim"
          onClick={() => {
            setDeleteDraftModal(null);
            setDelDone(false);
            setDelErr("");
          }}
        >
          <div
            className="lm-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {delDone ? (
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "60px",
                    height: "60px",
                    borderRadius: "999px",
                    background: "rgba(35, 173, 164, 0.14)",
                    color: "var(--acc-bright)",
                  }}
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <b
                  style={{
                    display: "block",
                    marginTop: "14px",
                    fontFamily: "var(--bd-font-ui)",
                    fontSize: "19px",
                    fontWeight: 700,
                    color: "var(--bd-white)",
                  }}
                >
                  {isMn ? "Ноорог устгагдлаа" : "Draft deleted"}
                </b>
                <p style={{ margin: "8px 0 0", fontSize: "14px", lineHeight: 1.55, color: "var(--bd-gray-400)" }}>
                  {isMn ? "Жагсаалтаас хасагдлаа." : "Removed from drafts list."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteDraftModal(null);
                    setDelDone(false);
                    setDelErr("");
                  }}
                  style={{
                    marginTop: "18px",
                    height: "46px",
                    padding: "0 24px",
                    border: "none",
                    borderRadius: "999px",
                    background: "var(--acc)",
                    color: "var(--bd-white)",
                    fontFamily: "var(--bd-font-ui)",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {isMn ? "Хаах" : "Close"}
                </button>
              </div>
            ) : (
              <>
                <b
                  style={{
                    display: "block",
                    fontFamily: "var(--bd-font-ui)",
                    fontSize: "19px",
                    fontWeight: 700,
                    color: "var(--bd-white)",
                  }}
                >
                  {isMn ? "Ноорогийг устгах уу?" : "Delete draft?"}
                </b>
                <p style={{ margin: "9px 0 0", fontSize: "14px", lineHeight: 1.6, color: "var(--bd-gray-400)" }}>
                  <span style={{ color: "var(--bd-white)", fontWeight: 600 }}>
                    {deleteDraftModal.courseTitle || deleteDraftModal.title || (isMn ? "Энэ сургалт" : "This course")}
                  </span>{" "}
                  — {isMn ? "бөглөсөн мэдээлэл бүрмөсөн устна. Үйлдлийг буцаах боломжгүй." : "all data will be permanently removed. This action cannot be undone."}
                </p>

                {delErr && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "12px 14px",
                      border: "1px solid rgba(255, 90, 90, 0.55)",
                      borderRadius: "13px",
                      background: "rgba(255, 90, 90, 0.1)",
                      fontSize: "13px",
                      lineHeight: 1.45,
                      color: "#FFC9C9",
                    }}
                  >
                    {delErr}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "9px", flexWrap: "wrap", marginTop: "20px" }}>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleDeleteDraft}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "9px",
                      height: "46px",
                      padding: "0 24px",
                      border: "none",
                      borderRadius: "999px",
                      background: "#FF5A5A",
                      color: "#fff",
                      fontFamily: "var(--bd-font-ui)",
                      fontSize: "15px",
                      fontWeight: 700,
                      cursor: deleting ? "not-allowed" : "pointer",
                      opacity: deleting ? 0.6 : 1,
                    }}
                  >
                    {deleting && <span className="lm-sp" />}
                    {isMn ? "Устгах" : "Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteDraftModal(null);
                      setDelErr("");
                    }}
                    style={{
                      height: "46px",
                      padding: "0 20px",
                      border: "1px solid var(--bd-border-strong)",
                      borderRadius: "999px",
                      background: "transparent",
                      color: "var(--bd-white)",
                      fontFamily: "var(--bd-font-ui)",
                      fontSize: "14.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {isMn ? "Болих" : "Cancel"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── Promotion Packages Modal ────────────────────────────────────── */}
      {showPromoModal && (
        <div className="lm-scrim" onClick={() => setShowPromoModal(false)}>
          <div
            className="lm-sheet"
            style={{ maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <b style={{ fontSize: "18px", fontWeight: 700, color: "var(--bd-white)", fontFamily: "var(--bd-font-ui)" }}>
                ⭐ {isMn ? "Сургалт сурталчлах" : "Promote Course"}
              </b>
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "999px",
                  border: "1px solid var(--bd-border)",
                  background: "transparent",
                  color: "var(--bd-gray-400)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "0 0 16px", fontSize: "13.5px", color: "var(--bd-gray-400)", lineHeight: 1.5 }}>
              {isMn
                ? "Нүүр хуудас болон Сургалтын хэсэгт илүү олон хүнд харуулах багцаа сонгоно уу."
                : "Select a plan to boost visibility on the Courses feed and Homepage."}
            </p>

            {loadingPackages ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--bd-gray-500)" }}>
                {isMn ? "Уншиж байна..." : "Loading packages..."}
              </div>
            ) : promoPackages.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--bd-gray-500)" }}>
                {isMn ? "Идэвхтэй багц байхгүй байна." : "No promotion packages available."}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                {promoPackages.map((pkg) => {
                  const isSelected = selectedPackage?._id === pkg._id;
                  return (
                    <div
                      key={pkg._id}
                      onClick={() => setSelectedPackage(pkg)}
                      style={{
                        background: isSelected ? "rgba(35, 173, 164, 0.12)" : "var(--bd-ink-800)",
                        border: `1.5px solid ${isSelected ? "var(--acc)" : "var(--bd-border)"}`,
                        borderRadius: "16px",
                        padding: "16px",
                        cursor: "pointer",
                        transition: "all 180ms ease",
                      }}
                    >
                      <b style={{ color: "var(--bd-white)", fontSize: "14px", display: "block", marginBottom: "6px" }}>
                        {pkg.name}
                      </b>
                      <h4 style={{ color: "var(--acc-bright)", margin: "0 0 6px", fontSize: "17px", fontWeight: 700 }}>
                        ₮{pkg.price?.toLocaleString()}
                      </h4>
                      <span style={{ fontSize: "12px", color: "var(--bd-gray-500)", display: "block" }}>
                        {pkg.durationInDays} {isMn ? "хоног" : "days"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                style={{
                  height: "44px",
                  padding: "0 20px",
                  border: "1px solid var(--bd-border-strong)",
                  borderRadius: "999px",
                  background: "transparent",
                  color: "var(--bd-white)",
                  fontFamily: "var(--bd-font-ui)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {isMn ? "Болих" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={!selectedPackage || checkingOut}
                onClick={handleCheckoutPromo}
                style={{
                  height: "44px",
                  padding: "0 24px",
                  border: "none",
                  borderRadius: "999px",
                  background: "var(--acc)",
                  color: "var(--bd-white)",
                  fontFamily: "var(--bd-font-ui)",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: selectedPackage ? "pointer" : "not-allowed",
                  opacity: selectedPackage ? 1 : 0.5,
                }}
              >
                {checkingOut ? (isMn ? "Төлж байна..." : "Processing...") : (isMn ? "Баталгаажуулах" : "Confirm & Pay")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
