"use client";

import Header from "../../components/Header";
import FAQ from "../../components/FAQ";
import Footer from "../../components/Footer";
import Field from "../../components/Field";
import { Container } from "react-bootstrap";
import ProgramCart from "@/components/ProgramCart";
import { useState, useEffect } from "react";
import courseApi from "@/api/courseApi";

export default function Page() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await courseApi.getCourses();

        if (response.status && response.data.courses) {
          setPrograms(response.data.courses || []);
          setPagination(response.data.pagination || {});
        } else if (
          response.data &&
          response.data.data &&
          response.data.data.courses
        ) {
          setPrograms(response.data.data.courses || []);
          setPagination(response.data.data.pagination || {});
        }
      } catch (error) {
        console.error("Error fetching programs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);



  return (
    <>
      <div className="listing_page">
        <div className="breadcrumb_text">
          <h1>Course</h1>
          <p>"A Night to Remember: Adele Live with Her Greatest Hits " 🎶✨</p>
        </div>
        <Header />
      </div>

      <div className="listing_bannr_field">
        <Container>
          <Field />
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

      <div className="ms-auto me-auto mt-4 text-center mb-5 mt-5">
        <button className="common_btn">View More Concerts</button>
      </div>

      <FAQ />
      <Footer />
    </>
  );
}
