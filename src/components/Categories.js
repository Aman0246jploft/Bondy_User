import React from "react";

const categoryData = [
  {
    title: "Social Activities",
    count: "20+ Events",
    bg: "bg-movies",
    img: "/img/fetures_img01.png",
  },
  {
    title: "Events",
    count: "10 concerts",
    bg: "bg-events",
    img: "/img/fetures_img02.png",
  },
  {
    title: "Workshops",
    count: "15 shows",
    bg: "bg-comedy",
    img: "/img/fetures_img03.png",
  },
  {
    title: "Sports",
    count: "5 Events",
    bg: "bg-sports",
    img: "/img/fetures_img04.png",
  },
  {
    title: "Courses",
    count: "2 events",
    bg: "bg-upskill",
    img: "/img/fetures_img05.png",
  },
  {
    title: "Fitness",
    count: "3 events",
    bg: "bg-esports",
    img: "/img/fetures_img07.png",
  },
];

const Categories = () => {
  return (
    <section className="category_sec">
      <div className="container">
        <div className="row g-4">
          {categoryData.map((cat, index) => (
            <div key={index} className="col-lg-4 col-md-6">
              <div className={`category-card ${cat.bg}`}>
                <div className="position-relative" style={{ zIndex: 2 }}>
                  <h3>{cat.title}</h3>
                  <p>{cat.count}</p>
                  <a href="#" className="view-btn">
                    View All <img src="/img/arrow.svg" />
                  </a>
                </div>
                {/* Overlapping Character Image */}
                <img src={cat.img} alt={cat.title} className="char-img" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
