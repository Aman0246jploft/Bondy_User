"use client";

import React, { useEffect, useState } from "react";
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
  const [searchParams, setSearchParams] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSearchParams({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            filter: "nearYou"
          });
        },
        (error) => {
          console.warn("Initial geolocation failed or denied:", error);
        }
      );
    }
  }, []);

  return (
    <>
      <Header />
      {view === "hero" && <Hero setView={setView} onSearch={setSearchParams} />}
      {view === "grid" && <GridSystem setView={setView} />}
      <TopEvents />

      <div className="event_bg">
        <EventSection type="recommended" extraParams={searchParams} />
        <EventSection type="nearYou" extraParams={searchParams} />
        <EventSection type="week" extraParams={searchParams} />
      </div>

      <Categories />
      <FAQ />
      <CTASections />
      <Footer />
    </>
  );
}
