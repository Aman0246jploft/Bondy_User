"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import FAQ from "../../components/FAQ";
import Footer from "../../components/Footer";
import Field from "../../components/Field";
import { Container, Pagination } from "react-bootstrap";
import eventApi from "@/api/eventApi";
import categoryApi from "@/api/categoryApi";

/* ── helpers ───────────────────────────────────────────── */
const SECTION_META = {
  recommended: {
    filter: "recommended",
    title: "Recommended",
    subtitle: "Hand-picked events just for you 🎯✨",
  },
  nearYou: {
    filter: "nearYou",
    title: "Near You",
    subtitle: "Discover what's happening around you 📍🎶",
  },
  week: {
    filter: "thisWeek",
    title: "Happening Soon",
    subtitle: "Don't miss out — these events are right around the corner 🗓️🔥",
  },
  all: {
    filter: "all",
    title: "Events",
    subtitle: "Browse all events 🎉",
  },
};

const LIMIT = 12;

/* ── inner component (needs Suspense boundary for useSearchParams) ── */
function ListingContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "all"; // Default to all if category might be present
  const categoryId = searchParams.get("category");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryDetail, setCategoryDetail] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterParams, setFilterParams] = useState({
    search: "",
    latitude: null,
    longitude: null,
    date: ""
  });

  const totalPages = Math.ceil(total / LIMIT);

  // Determine metadata display
  let meta = SECTION_META[type] || SECTION_META.all;
  if (categoryId && categoryDetail) {
    meta = {
      title: categoryDetail.name.charAt(0).toUpperCase() + categoryDetail.name.slice(1),
      subtitle: `Discover the best events in ${categoryDetail.name} 🌟`,
    };
  }
  
    useEffect(() => {
      if (meta?.title) {
        document.title = `${meta.title} | Bondy`;
      }
    }, [meta]);

  // Fetch Category Details if categoryId is present
  useEffect(() => {
    if (categoryId) {
      const fetchCategory = async () => {
        try {
          const res = await categoryApi.getCategoryDetails(categoryId);
          if (res.data && res.data.category) {
            setCategoryDetail(res.data.category);
          }
        } catch (err) {
          console.error("Error fetching category details:", err);
        }
      };
      fetchCategory();
    } else {
      setCategoryDetail(null);
    }
  }, [categoryId]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let params = {
          limit: LIMIT,
          page,
          filter: meta.filter || "all",
          search: filterParams.search,
          latitude: filterParams.latitude,
          longitude: filterParams.longitude,
          date: filterParams.date,
          categoryId: categoryId || ""
        };

        // geolocation for "nearYou" ONLY if no manual location is provided
        if (meta.filter === "nearYou" && !params.latitude) {
          try {
            const pos = await new Promise((resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject),
            );
            params.latitude = pos.coords.latitude;
            params.longitude = pos.coords.longitude;
          } catch {
            console.warn("Location access denied");
            setLoading(false);
            return;
          }
        }

        const response = await eventApi.getEvents(params);
        if (response.data) {
          setEvents(response.data.events || []);
          setTotal(response.data.total || 0);
        }
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [page, type, filterParams, categoryId]);

  const handleSearch = (newFilters) => {
    setFilterParams({
      search: newFilters.search || "",
      latitude: newFilters.latitude || null,
      longitude: newFilters.longitude || null,
      date: newFilters.date || ""
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
      {/* ── Banner ─────────────────────────────── */}
      <div className="listing_page">
        <div className="breadcrumb_text">
          <h1>{meta.title}</h1>
          <p>{meta.subtitle}</p>
        </div>
        <Header />
      </div>

      {/* ── Search field ───────────────────────── */}
      <div className="listing_bannr_field">
        <Container>
          <Field
            onSearch={handleSearch}
            label="Event Name/Type"
            placeholder="e.g. music festival"
          />
        </Container>
      </div>

      {/* ── Event grid ─────────────────────────── */}
      <section className="recommended-section">
        <div className="container">
          {loading ? (
            <p className="text-center py-5">Loading…</p>
          ) : events.length === 0 ? (
            <p className="text-center py-5">No events found.</p>
          ) : (
            <div className="row gy-5">
              {events.map((item, index) => (
                <div key={item._id} className="col-lg-3 col-md-6 col-sm-12">
                  <Link href={`/eventDetails?id=${item._id}`}>
                    <div className="event_main_cart">
                      <div className="recommended-card">
                        <img
                          src={
                            item.posterImage && item.posterImage[0]
                              ? item.posterImage[0]
                              : "/img/no-image.png"
                          }
                          alt={item.eventTitle}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/img/no-image.png";
                          }}
                        />
                      </div>

                      <div className="card-overlay">
                        <div className="overlay-content">
                          {/* timer for first 2 cards */}
                          {/* {index < 2 && (
                            <div className="time_main">
                              <div className="timing_box">
                                <span>
                                  <img src="/img/Stopwatch.svg" alt="timer" />{" "}
                                  Time to end
                                </span>
                                <span>06:34:15</span>
                              </div>
                            </div>
                          )} */}

                          <span className="artist-name">{item.eventTitle}</span>

                          <div className="event-meta">
                            <span>
                              <img src="/img/date_icon.svg" alt="date" />{" "}
                              {item.startDate
                                ? new Date(item.startDate).toLocaleDateString()
                                : "Date TBD"}
                            </span>
                            <span>
                              <img src="/img/loc_icon.svg" alt="location" />{" "}
                              {item.venueAddress
                                ? item.venueAddress.city
                                  ? item.venueAddress.city.length > 20
                                    ? item.venueAddress.city.substring(0, 20) +
                                    "..."
                                    : item.venueAddress.city
                                  : "Location"
                                : "Online"}
                            </span>
                          </div>

                          <div className="price-tag">
                            {/* from{" "} */}
                            {item.ticketPrice ? `$${item.ticketPrice}` : "Free"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* ── Pagination ────────────────────── */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-5 mb-5">
              <Pagination>
                <Pagination.First
                  onClick={() => handlePageChange(1)}
                  disabled={page === 1}
                />
                <Pagination.Prev
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                />

                {[...Array(totalPages)].map((_, idx) => (
                  <Pagination.Item
                    key={idx + 1}
                    active={idx + 1 === page}
                    onClick={() => handlePageChange(idx + 1)}
                  >
                    {idx + 1}
                  </Pagination.Item>
                ))}

                <Pagination.Next
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                />
                <Pagination.Last
                  onClick={() => handlePageChange(totalPages)}
                  disabled={page === totalPages}
                />
              </Pagination>
            </div>
          )}
        </div>
      </section>

      <FAQ />
      <Footer />
    </>
  );
}

/* ── Page wrapper (Suspense required by Next.js for useSearchParams) ── */
export default function Page() {
  return (
    <Suspense fallback={<p className="text-center py-5">Loading…</p>}>
      <ListingContent />
    </Suspense>
  );
}
