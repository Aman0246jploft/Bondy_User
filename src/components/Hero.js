"use client";
import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Navigation } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import HeroSearchFilter from "./HeroSearchFilter";

const HeroSlider = ({ setView }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 60, damping: 12 },
    },
  };

  const slides = [
    "/img/banner_img.png",
    "https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070",
  ];

  return (
    <div className="hero-wrapper">
      {/* ---------- SLIDER ---------- */}
      <Swiper
        modules={[Autoplay, EffectFade, Navigation]}
        effect="fade"
        speed={1500}
        autoplay={{ delay: 5000 }}
        navigation={{ prevEl: ".prev-el", nextEl: ".next-el" }}
        loop
        className="h-100">
        {slides.map((img, index) => (
          <SwiperSlide key={index}>
            <div
              className="slide-bg"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.9)), url(${img})`,
              }}
            />

            <div className="banner_video">
              <video autoPlay muted loop playsInline className="bg_video">
                <source src="/img/video_banner.mp4" type="video/mp4" />
              </video>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* ---------- NAV BUTTONS ---------- */}
      <button className="nav-btn prev-el">
        <ChevronLeft size={24} />
      </button>
      <button className="nav-btn next-el">
        <ChevronRight size={24} />
      </button>

      {/* ---------- CONTENT ---------- */}
      <AnimatePresence>
        {isReady && (
          <motion.div
            className="hero-content"
            variants={containerVariants}
            initial="hidden"
            animate="visible">
            <motion.h1 variants={itemVariants}>
              Discover Events, Workshops, Courses <br />
              <span>& Experiences in Ulaanbaatar</span>
            </motion.h1>

            <motion.p variants={itemVariants}>
              Explore a world of concerts, movies, and events tailored just for
              you!
            </motion.p>

            {/* ---------- SEARCH CARD ---------- */}
            <motion.div
              className="search-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80, delay: 0.5 }}>
              <div className="search-fields ">
                <div className="search-field one_field">
                  <img src="/img/event_icon.svg" />
                  <div>
                    <small>Event Type</small>
                    <input type="text" placeholder="exp: music event" />
                  </div>
                </div>

                <div className="divider" />

                <div className="search-field two_field">
                  <img src="/img/loc_icon.svg" />
                  <div>
                    <small>Where</small>
                    <input type="text" placeholder="Location" />
                  </div>
                </div>

                <div className="divider" />
                <HeroSearchFilter />
              </div>

              <div className="search-actions">
                <button className="icon-btn teal">
                  <Search size={18} />
                </button>

                {/* 👇 SWITCH TO GRID VIEW */}
                <button
                  className="icon-btn outline"
                  onClick={() => setView("grid")}>
                  <img src="/img/location_icon.svg" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeroSlider;
