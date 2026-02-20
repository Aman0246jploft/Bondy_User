"use client";

import React, { useState } from "react";
import GridSystem from "@/components/GridSystem";
import Categories from "../components/Categories";
import CTASections from "../components/CTASections";
import EventSection from "../components/EventSection";
import FAQ from "../components/FAQ";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Hero from "../components/Hero";
import TopEvents from "../components/TopEvents";

export default function HomePage() {

  const [view, setView] = useState("hero"); // hero | grid

  return (
    <>
      <Header />
      {view === "hero" && <Hero setView={setView} />}
      {view === "grid" && <GridSystem setView={setView} />}
      <TopEvents />

      <div className="event_bg">
        <EventSection type="recommended" />
        <EventSection type="nearYou" />
        <EventSection type="week" />
      </div>

      <Categories />
      <FAQ />
      <CTASections />
      <Footer />
    </>
  );
}
