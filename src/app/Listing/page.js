"use client";

import Header from "../../components/Header";
import EventSection from "../../components/EventSection";
import FAQ from "../../components/FAQ";
import Footer from "../../components/Footer";
import Field from "../../components/Field";
import { Container } from "react-bootstrap";

export default function Page() {
  return (
    <>
      <div className="listing_page">
        <div className="breadcrumb_text">
          <h1>Recommended</h1>
          <p>"A Night to Remember: Adele Live with Her Greatest Hits " 🎶✨</p>
        </div>
        <Header />
      </div>

      <div className="listing_bannr_field">
        <Container>
          <Field />
        </Container>
      </div>
      <EventSection
        type="recommended"
        limit={12}
        hideHeader={true}
        showSeeAll={false}
        isListing={true}
      />

      <div className="ms-auto me-auto mt-4 text-center mb-5 mt-5">
        <button className="common_btn">View More Concerts</button>
      </div>

      <FAQ />
      <Footer />
    </>
  );
}
