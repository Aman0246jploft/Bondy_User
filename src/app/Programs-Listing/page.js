"use client";

import Header from "../../components/Header";
import EventSection from "../../components/EventSection";
import FAQ from "../../components/FAQ";
import Footer from "../../components/Footer";
import Field from "../../components/Field";
import { Container } from "react-bootstrap";
import ProgramCart from "@/components/ProgramCart";

export default function Page() {
  return (
    <>
      <div className="listing_page">
        <div className="breadcrumb_text">
       <h1>Program</h1>
       <p>"A Night to Remember: Adele Live with Her Greatest Hits " 🎶✨</p>
        </div>
        <Header />
      </div>

    
      
      <div className="listing_bannr_field">
         <Container>
         <Field />
           <div className="book_mark_list">
         <ul>
          <li><img src="/img/bookanytime.svg " />Book Anytime</li>
          <li><img src="/img/refundable.svg " />Refundable Tickets</li>
          <li><img src="/img/smart_icon.svg " />Smart Deals</li>
         </ul>
      </div>
       </Container>
      </div>

     
<ProgramCart />



      <div className="ms-auto me-auto mt-4 text-center mb-5 mt-5">
        <button className="common_btn">View More Concerts</button>
      </div>

      <FAQ />
      <Footer />
    </>
  );
}
