"use client";
import React, { useEffect, useState } from "react";
import categoryApi from "../api/categoryApi";
import { useLanguage } from "@/context/LanguageContext";

const Categories = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);

  const categoryData = [
    {
      titleKey: "socialActivities",
      apiName: "socialactivities",
      count: "20+ Events",
      bg: "bg-movies",
      img: "/img/fetures_img01.png",
      path: "/Listing?category=69ddd334e0818c1a0f51d866",
    },
    {
      titleKey: "events",
      count: "10 concerts",
      bg: "bg-events",
      img: "/img/fetures_img02.png",
      path: "/Listing?type=all",
    },
    {
      titleKey: "workshops",
      apiName: "art",
      count: "15 shows",
      bg: "bg-comedy",
      img: "/img/fetures_img03.png",
      path: "/Listing?category=696f303e0fd4ccfb59d80a59",
    },
    {
      titleKey: "sports",
      apiName: "sports",
      count: "5 Events",
      bg: "bg-sports",
      img: "/img/fetures_img04.png",
      path: "/Listing?category=69b3df23d6628ab854c0843f",
    },
    {
      titleKey: "courses",
      count: "2 events",
      bg: "bg-upskill",
      img: "/img/fetures_img05.png",
      path: "/Programs-Listing",
    },
    {
      titleKey: "fitness",
      apiName: "FITNESS",
      count: "3 events",
      bg: "bg-esports",
      img: "/img/fetures_img07.png",
      path: "/Listing?category=69ddd241e0818c1a0f51d864",
    },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await categoryApi.getCategoryStats();
        if (response?.data) {
          setStats(response?.data);
          console.log("Category Statistics Fetched:", response?.data);
        }
      } catch (error) {
        console.error("Error calling category stats API:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <section className="category_sec">
      <div className="container">
        <div className="row g-4">
          {categoryData.map((cat, index) => {
            // Find the count for this category from the API stats
            let displayCount = cat.count;

            if (stats) {
              if (cat.titleKey === "events") {
                const count = stats.totalEvents || 0;
                displayCount = `${count} ${count === 1 ? t("concert") : t("concerts")}`;
              } else if (cat.titleKey === "courses") {
                const count = stats.totalCourses || 0;
                displayCount = `${count} ${count === 1 ? t("course") : t("courses")}`;
              } else {
                const searchName = (cat.apiName || cat.titleKey).toLowerCase();
                const catStat = stats.categoryStats?.find(
                  (s) => s.name.toLowerCase() === searchName
                );
                if (catStat) {
                  displayCount = `${catStat.eventCount} ${catStat.eventCount === 1 ? t("event") : t("events")}`;
                }
              }
            }

            return (
              <div key={index} className="col-lg-4 col-md-6">
                <div className={`category-card ${cat.bg}`}>
                  <div className="position-relative" style={{ zIndex: 2 }}>
                    <h3>{t(cat.titleKey)}</h3>
                    <p>{displayCount}</p>
                    <a href={cat.path} className="view-btn">
                      {t("seeAll")} <img src="/img/arrow.svg" />
                    </a>
                  </div>
                  {/* Overlapping Character Image */}
                  <img src={cat.img} alt={t(cat.titleKey)} className="char-img" />
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
