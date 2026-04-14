"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import courseApi from "../api/courseApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import { formatDate } from "@/utils/dateFormater";

const CourseSection = ({
  type = "featured",
  limit = 4,
  showSeeAll = true,
  hideHeader = false,
  customTitle = "",
  extraParams = null,
}) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(customTitle);

  // Map prop type to backend filter and display title
  const getFilterAndTitle = () => {
    switch (type) {
      case "featured":
        return { filter: "featured", defaultTitle: "Featured Courses" };
      case "recommended":
        return { filter: "recommended", defaultTitle: "Recommended for You" };
      case "nearYou":
        return { filter: "nearYou", defaultTitle: "Courses Near You" };
      default:
        return { filter: "all", defaultTitle: "All Courses" };
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const { filter, defaultTitle } = getFilterAndTitle();
        if (!customTitle) setTitle(defaultTitle);

        let params = {
          limit,
          page: 1,
          filter,
          ...extraParams,
        };

        const response = await courseApi.getCourses(params);
        if (response.data && response.data.courses) {
          setCourses(response.data.courses || []);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [type, limit, customTitle, extraParams]);

  if (loading) {
    return (
      <section className="recommended-section">
        <div className="container">
          <p>Loading Featured Courses...</p>
        </div>
      </section>
    );
  }

  if (!courses || courses.length === 0) return null;

  return (
    <section className="recommended-section">
      <div className="container">
        {/* 🔹 HEADER */}
        {!hideHeader && (
          <div className="main_title align_title position-relative z-2 border-bottm">
            <h2>{title}</h2>
            {showSeeAll && (
              <Link
                href={`/Programs-Listing?type=${type}`}
                className="see-all"
              >
                See all
              </Link>
            )}
          </div>
        )}

        <div className="row gy-5">
          {courses.map((item) => (
            <div key={item._id} className="col-lg-3 col-md-6 col-sm-12">
              <Link href={`/programDetails?id=${item._id}`}>
                <div className="event_main_cart">
                  <div className="recommended-card">
                    {item.isFeatured && (
                      <span className="event-badge">Featured</span>
                    )}
                    <img
                      src={getFullImageUrl(item.posterImage?.[0]) || "/img/no-image.png"}
                      alt={item.courseTitle}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/img/no-image.png";
                      }}
                    />
                  </div>

                  <div className="card-overlay">
                    <div className="overlay-content">
                      <span className="artist-name">{item.courseTitle}</span>

                      <div className="event-meta">
                        <span>
                          <img src="/img/date_icon.svg" alt="date" />{" "}
                          {item.currentSchedule?.startDate
                            ? formatDate(item.currentSchedule.startDate)
                            : "Flexible"}
                        </span>
                        <span>
                          <img src="/img/loc_icon.svg" alt="location" />{" "}
                          {item.venueAddress?.city || "Location TBD"}
                        </span>
                      </div>

                      <div className="price-tag">
                        {item.price ? `₮${item.price}` : "Free"}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CourseSection;
