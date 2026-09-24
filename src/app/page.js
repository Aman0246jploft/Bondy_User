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
import CourseSection from "../components/CourseSection";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const [view, setView] = useState("hero"); // hero | grid
  const [searchParams, setSearchParams] = useState({});

  const { t } = useLanguage();
  useEffect(() => {
    document.title = `${t("home")} | Bondy`;
  }, [t]);

  return (
    <>
      <Header />
      {view === "hero" && <Hero setView={setView} onSearch={setSearchParams} />}
      {view === "grid" && (
        <GridSystem
          setView={setView}
          searchParams={searchParams}
          onSearch={setSearchParams}
        />
      )}
      <TopEvents />

      <div className="event_bg">
        <EventSection type="recommended" extraParams={{ placement: "homePage", page: 1, limit: 4 }} />
        <EventSection type="nearYou" extraParams={{ placement: "homePage", page: 1, limit: 4 }} />
        <EventSection type="thisWeekend" extraParams={{ placement: "homePage", page: 1, limit: 4 }} />
        <EventSection type="nextWeek" extraParams={{ placement: "homePage", page: 1, limit: 4 }} />
        <EventSection type="upcoming" extraParams={{ placement: "homePage", page: 1, limit: 4 }} />
        <EventSection type="happeningSoon" extraParams={{ placement: "homePage", page: 1, limit: 4 }} />
        <CourseSection type="featured" extraParams={{ placement: "homePage" }} />
      </div>

      <Categories />
      <FAQ />
      <CTASections />
      <Footer />
    </>
  );
}
