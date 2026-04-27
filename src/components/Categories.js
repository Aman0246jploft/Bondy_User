"use client";
import React, { useEffect, useState } from "react";
import categoryApi from "../api/categoryApi";
import { useLanguage } from "@/context/LanguageContext";

const Categories = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const featuredCardBackgrounds = [
    "bg-movies",
    "bg-comedy",
    "bg-sports",
    "bg-esports",
  ];
  const featuredCardImages = [
    "/img/fetures_img01.png",
    "/img/fetures_img03.png",
    "/img/fetures_img04.png",
    "/img/fetures_img06.png",
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await categoryApi.getCategoryStats();
        if (response?.data) {
          console.log("Category Statistics Response:", response);
          setStats(response?.data);
          console.log("Category Statistics Fetched:", response?.data);
        }
      } catch (error) {
        console.error("Error calling category stats API:", error);
      }
    };

    fetchStats();
  }, []);

  const totalCards = [
    {
      title: t("events"),
      count: `${stats?.totalEvents || 0} ${(stats?.totalEvents || 0) === 1 ? t("concert") : t("concerts")}`,
      bg: "bg-events",
      img: "/img/fetures_img06.png",
      path: "/Listing?type=all",
    },
    {
      title: t("courses"),
      count: `${stats?.totalCourses || 0} ${(stats?.totalCourses || 0) === 1 ? t("course") : t("courses")}`,
      bg: "bg-upskill",
      img: "/img/fetures_img05.png",
      path: "/Programs-Listing",
    },
  ];

  const featuredCategoryCards = (stats?.categoryStats || []).map((cat, index) => ({
    _id: cat._id,
    title: cat.name,
    count: `${cat.eventCount || 0} ${(cat.eventCount || 0) === 1 ? t("event") : t("events")}`,
    bg: featuredCardBackgrounds[index % featuredCardBackgrounds.length],
    img: cat.posterImage || featuredCardImages[index % featuredCardImages.length],
    path: `/Listing?category=${cat._id}`,
  }));

  const cardsToRender = [...totalCards, ...featuredCategoryCards];

  return (
    <section className="category_sec">
      <div className="container">
        <div className="row g-4">
          {cardsToRender.map((cat, index) => {
            return (
              <div key={cat._id || cat.path || index} className="col-lg-4 col-md-6">
                <div className={`category-card ${cat.bg}`}>
                  <div className="position-relative" style={{ zIndex: 2 }}>
                    <h3>{cat.title.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</h3>
                    <p>{cat.count}</p>
                    <a href={cat.path} className="view-btn">
                      {t("seeAll")} <img src="/img/arrow.svg" />
                    </a>
                  </div>
                  {/* Overlapping Character Image */}
                  <img src={cat.img} alt={cat.title} className="char-img" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
