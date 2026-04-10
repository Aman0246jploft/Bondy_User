"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Header from "../../components/Header";
import FAQ from "../../components/FAQ";
import Footer from "../../components/Footer";
import Field from "../../components/Field";
import { Container } from "react-bootstrap";
import ProgramCart from "@/components/ProgramCart";
import PaginationComponent from "@/components/PaginationComponent";
import courseApi from "@/api/courseApi";

/* ── helpers ───────────────────────────────────────────── */
const SECTION_META = {
  featured: {
    filter: "featured",
    title: "Featured Courses",
    subtitle: "Top-tier courses selected for you 🌟✨",
  },
  recommended: {
    filter: "recommended",
    title: "Recommended",
    subtitle: "Hand-picked courses just for you 🎯✨",
  },
  nearYou: {
    filter: "nearYou",
    title: "Near You",
    subtitle: "Discover learning opportunities around you 📍📚",
  },
  all: {
    filter: "all",
    title: "All Courses",
    subtitle: "Browse our full catalog of programs 🎉",
  },
};

const LIMIT = 12;

/* ── inner component (needs Suspense boundary for useSearchParams) ── */
function ListingContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "all";

  const meta = SECTION_META[type] || SECTION_META.all;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterParams, setFilterParams] = useState({
    search: "",
    latitude: null,
    longitude: null,
    filter: "" // additional filters from Field component
  });

  const totalPages = Math.ceil(total / LIMIT);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        // Build combined filter string
        let combinedFilters = [meta.filter];
        if (filterParams.filter && filterParams.filter !== "all") {
          combinedFilters.push(filterParams.filter);
        }

        let params = {
          limit: LIMIT,
          page,
          filter: combinedFilters.join(","),
          search: filterParams.search,
          latitude: filterParams.latitude,
          longitude: filterParams.longitude,
        };

        // geolocation for "nearYou" ONLY if no manual location is provided
        if (combinedFilters.includes("nearYou") && !params.latitude) {
          try {
            const pos = await new Promise((resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject),
            );
            params.latitude = pos.coords.latitude;
            params.longitude = pos.coords.longitude;
          } catch {
            console.warn("Location access denied");
            // If nearYou is the ONLY filter, we might want to return 0, 
            // but the backend handler also does fallback logic
          }
        }

        const response = await courseApi.getCourses(params);
        if (response.data) {
          // Backend structure might be { totalCourses, courses, ... }
          setCourses(response.data.courses || []);
          setTotal(response.data.totalCourses || 0);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [page, type, filterParams]);

  const handleSearch = (newFilters) => {
    setFilterParams({
      search: newFilters.search || "",
      latitude: newFilters.latitude || null,
      longitude: newFilters.longitude || null,
      filter: newFilters.filter || ""
    });
    setPage(1); // Reset to first page on search
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <div className="listing_page">
        <div className="breadcrumb_text">
          <h1>{meta.title}</h1>
          <p
            style={{
              maxWidth: '800px',
              margin: '0 auto'
            }}
          >
            {meta.subtitle}
          </p>
        </div>
        <Header />
      </div>

      <div className="listing_bannr_field">
        <Container>
          <Field
            onSearch={handleSearch}
            label="Course Name/Type"
            placeholder="e.g. music course"
          />
          <div className="book_mark_list">
            <ul>
              <li>
                <img src="/img/bookanytime.svg " />
                Book Anytime
              </li>
              <li>
                <img src="/img/refundable.svg " />
                Refundable Tickets
              </li>
              <li>
                <img src="/img/smart_icon.svg " />
                Smart Deals
              </li>
            </ul>
          </div>
        </Container>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <p>Loading programs...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-5">
          <p>No programs found matching your criteria.</p>
        </div>
      ) : (
        <>
          <ProgramCart programsArray={courses} pagination={{ currentPage: page, totalPages }} />

          <PaginationComponent
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      <FAQ />
      <Footer />
    </>
  );
}

/* ── Page wrapper (Suspense required by Next.js for useSearchParams) ── */
export default function Page() {
  return (
    <Suspense fallback={<div className="text-center py-5"><p>Loading…</p></div>}>
      <ListingContent />
    </Suspense>
  );
}
