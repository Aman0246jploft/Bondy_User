"use client";

import Header from "../../components/Header";
import FAQ from "../../components/FAQ";
import Footer from "../../components/Footer";
import Field from "../../components/Field";
import { Container } from "react-bootstrap";
import ProgramCart from "@/components/ProgramCart";
import { useState, useEffect } from "react";
import courseApi from "@/api/courseApi";
import PaginationComponent from "@/components/PaginationComponent";

export default function Page() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCourses: 0,
    coursesPerPage: 10
  });

  const [filters, setFilters] = useState({});

  const fetchPrograms = async (page = 1, currentFilters = {}) => {
    try {
      setLoading(true);
      const response = await courseApi.getCourses({ page, limit: 12, ...currentFilters });

      if (response.status && response.data) {
        const data = response.data.data || response.data;
        if (data.courses) {
          setPrograms(data.courses);
          setPagination({
            currentPage: data.currentPage || 1,
            totalPages: data.totalPages || 1,
            totalCourses: data.totalCourses || 0,
            coursesPerPage: data.coursesPerPage || 10,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms(pagination.currentPage, filters);
  }, [pagination.currentPage, filters]);

  const handleSearch = (searchParams) => {
    setFilters(searchParams);
    if (pagination.currentPage !== 1) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    window.scrollTo(0, 0);
  };



  return (
    <>
      <div className="listing_page">
        <div className="breadcrumb_text">
          <h1>Course</h1>
          <p
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'break-word',
              maxWidth: '800px',
              margin: '0 auto'
            }}
          >
            "A Night to Remember: Adele Live with Her Greatest Hits " 🎶✨
          </p>
        </div>
        <Header />
      </div>

      <div className="listing_bannr_field">
        <Container>
          <Field onSearch={handleSearch} />
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

      <ProgramCart programsArray={programs} pagination={pagination} />

      <PaginationComponent
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />

      {/* <div className="ms-auto me-auto mt-4 text-center mb-5 mt-5">
        <button className="common_btn">View More Concerts</button>
      </div> */}

      <FAQ />
      <Footer />
    </>
  );
}
