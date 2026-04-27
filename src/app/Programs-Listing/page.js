"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useLanguage } from "@/context/LanguageContext";
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
    titleKey: "featuredCourses",
    subtitleKey: "featuredSubtitle",
  },
  recommended: {
    filter: "recommended",
    titleKey: "recommended",
    subtitleKey: "recommendedSubtitle",
  },
  nearYou: {
    filter: "nearYou",
    titleKey: "nearYou",
    subtitleKey: "nearYouSubtitle",
  },
  all: {
    filter: "all",
    titleKey: "allCourses",
    subtitleKey: "allSubtitle",
  },
};

const LIMIT = 12;

/* ── inner component (needs Suspense boundary for useSearchParams) ── */
function ListingContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "all";

  const meta = SECTION_META[type] || SECTION_META.all;

  const { t } = useLanguage();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const title = meta?.titleKey ? t(meta.titleKey) : meta?.title || "";
    if (title) {
      document.title = `${title} | Bondy`;
    }
  }, [meta, t]);
  const [filterParams, setFilterParams] = useState({
    search: "",
    latitude: null,
    longitude: null,
    filter: "",
    startDate: "",
    endDate: "",
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
          startDate: filterParams.startDate || undefined,
          endDate: filterParams.endDate || undefined,
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
        if (response?.data) {
          // Backend structure might be { totalCourses, courses, ... }
          setCourses(response?.data?.courses || []);
          setTotal(response?.data?.totalCourses || 0);
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
      search: newFilters?.search || "",
      latitude: newFilters?.latitude || null,
      longitude: newFilters?.longitude || null,
      filter: newFilters?.filter || "",
      startDate: newFilters?.startDate || "",
      endDate: newFilters?.endDate || "",
    });
    setPage(1);
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
          <h1>{meta.titleKey ? t(meta.titleKey) : meta.title}</h1>
          <p
            style={{
              maxWidth: '800px',
              margin: '0 auto'
            }}
          >
            {meta.subtitleKey ? t(meta.subtitleKey) : meta.subtitle}
          </p>
        </div>
        <Header />
      </div>

      <div className="listing_bannr_field">
        <Container>
          <Field
            onSearch={handleSearch}
            label={t("courseNameType")}
            placeholder={t("exampleMusicCourse")}
          />
          <div className="book_mark_list">
            <ul>
              <li>
                <img src="/img/bookanytime.svg " />
                {t("bookAnytime")}
              </li>
              <li>
                <img src="/img/refundable.svg " />
                {t("refundableTickets")}
              </li>
              <li>
                <img src="/img/smart_icon.svg " />
                {t("smartDeals")}
              </li>
            </ul>
          </div>
        </Container>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <p>{t("loadingPrograms")}</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-5">
          <p>{t("noProgramsFound")}</p>
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
