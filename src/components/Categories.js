"use client";
import React, { useEffect, useState } from "react";
import categoryApi from "../api/categoryApi";

const categoryData = [
  {
    title: "Social Activities",
    count: "20+ Events",
    bg: "bg-movies",
    img: "/img/fetures_img01.png",
    path: "/Listing?category=69ddd334e0818c1a0f51d866",
  },
  {
    title: "Events",
    count: "10 concerts",
    bg: "bg-events",
    img: "/img/fetures_img02.png",
    path: "/Listing?type=all",
  },
  {
    title: "Workshops",
    apiName: "art",
    count: "15 shows",
    bg: "bg-comedy",
    img: "/img/fetures_img03.png",
    path: "/Listing?category=696f303e0fd4ccfb59d80a59",
  },
  {
    title: "Sports",
    apiName: "sports",
    count: "5 Events",
    bg: "bg-sports",
    img: "/img/fetures_img04.png",
    path: "/Listing?category=69b3df23d6628ab854c0843f",
  },
  {
    title: "Courses",
    count: "2 events",
    bg: "bg-upskill",
    img: "/img/fetures_img05.png",
    path: "/Programs-Listing",
  },
  {
    title: "Fitness",
    apiName: "FITNESS",
    count: "3 events",
    bg: "bg-esports",
    img: "/img/fetures_img07.png",
    path: "/Listing?category=69ddd241e0818c1a0f51d864",
  },
];

const Categories = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await categoryApi.getCategoryStats();
        if (response.data) {
          setStats(response.data);
          console.log("Category Statistics Fetched:", response.data);
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
              if (cat.title === "Events") {
                const count = stats.totalEvents || 0;
                displayCount = `${count} ${count === 1 ? "Concert" : "Concerts"}`;
              } else if (cat.title === "Courses") {
                const count = stats.totalCourses || 0;
                displayCount = `${count} ${count === 1 ? "Course" : "Courses"}`;
              } else {
                const searchName = (cat.apiName || cat.title).toLowerCase();
                const catStat = stats.categoryStats?.find(
                  (s) => s.name.toLowerCase() === searchName
                );
                if (catStat) {
                  displayCount = `${catStat.eventCount} ${catStat.eventCount === 1 ? "Event" : "Events"}`;
                }
              }
            }

            return (
              <div key={index} className="col-lg-4 col-md-6">
                <div className={`category-card ${cat.bg}`}>
                  <div className="position-relative" style={{ zIndex: 2 }}>
                    <h3>{cat.title}</h3>
                    <p>{displayCount}</p>
                    <a href={cat.path} className="view-btn">
                      View All <img src="/img/arrow.svg" />
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
