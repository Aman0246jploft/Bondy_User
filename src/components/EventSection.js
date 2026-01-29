import Link from "next/link";
import React from "react";

/* 🔹 DATA */
const eventData = {
  recommended: {
    title: "Recommended",
    data: [
      { id: 1, name: "Nora Bayes", date: "May 6, 2025", location: "Hagen", price: "$778.58", img: "/img/img_01.png" },
      { id: 2, name: "Tony Bennett", date: "Aug 2, 2025", location: "Salem (OR)", price: "$388.89", img: "/img/img_02.png" },
      { id: 3, name: "Joan Baez", date: "Dec 28, 2025", location: "Naltchik", price: "$406.27", img: "/img/img_03.png" },
      { id: 4, name: "Devendra Banhart", date: "Feb 9, 2025", location: "Sterlitamak", price: "$275.43", img: "/img/img_04.png" },
      { id: 5, name: "Live Fusion", date: "Jun 11, 2025", location: "Berlin", price: "$199.00", img: "/img/img_05.png" },
      { id: 6, name: "Rock Night", date: "Jul 18, 2025", location: "London", price: "$249.00", img: "/img/img_06.png" },
      { id: 7, name: "Jazz Flow", date: "Aug 22, 2025", location: "Paris", price: "$189.00", img: "/img/img_07.png" },
      { id: 8, name: "Soul Vibes", date: "Sep 30, 2025", location: "New York", price: "$299.00", img: "/img/img_08.png" },
      { id: 9, name: "Indie Fest", date: "Oct 12, 2025", location: "Toronto", price: "$159.00", img: "/img/img_09.png" },
      { id: 10, name: "EDM Blast", date: "Nov 5, 2025", location: "Dubai", price: "$349.00", img: "/img/img_10.png" },
      { id: 11, name: "Acoustic Night", date: "Dec 1, 2025", location: "Sydney", price: "$129.00", img: "/img/img_11.png" },
      { id: 12, name: "Pop Mania", date: "Dec 20, 2025", location: "Tokyo", price: "$399.00", img: "/img/img_12.png" },
    ],
  },

  near: {
    title: "Near You",
    data: [
      { id: 101, name: "City Beats", date: "Mar 10", location: "Your City", price: "$99", img: "/img/img_01.png" },
      { id: 102, name: "Local Jam", date: "Mar 12", location: "Downtown", price: "$79", img: "/img/img_02.png" },
      { id: 103, name: "Street Vibes", date: "Mar 15", location: "Main Square", price: "$69", img: "/img/img_03.png" },
      { id: 104, name: "Open Mic", date: "Mar 18", location: "Cafe Zone", price: "$59", img: "/img/img_04.png" },
    ],
  },

  week: {
    title: "This Week",
    data: [
      { id: 201, name: "Friday Night", date: "Fri", location: "Club X", price: "$89", img: "/img/img_05.png" },
      { id: 202, name: "Weekend Bash", date: "Sat", location: "Arena", price: "$129", img: "/img/img_06.png" },
      { id: 203, name: "Sunday Chill", date: "Sun", location: "Open Park", price: "$49", img: "/img/img_07.png" },
      { id: 204, name: "Midweek Live", date: "Wed", location: "Studio Hall", price: "$79", img: "/img/img_08.png" },
    ],
  },
};

const EventSection = ({
  type = "recommended",
  limit = 4,
  showSeeAll = true,
  hideHeader = false,
  isListing = false,
  customTitle = "", // 🔹 ONLY ADDITION
}) => {
  const section = eventData[type];
  if (!section) return null;

  return (
    <section className="recommended-section">
      <div className="container">

        {/* 🔹 HEADER */}
        {!hideHeader && (
          <div className="main_title align_title position-relative z-2 border-bottm">
            <h2>{customTitle || section.title}</h2>
            {showSeeAll && <Link href="/Listing" className="see-all">See all</Link>}
          </div>
        )}

        <div className="row gy-5">
          {section.data.slice(0, limit).map((item, index) => (
            <div key={item.id} className="col-lg-3 col-md-6 col-sm-12">
             <Link href="/eventDetails" >
              <div className="event_main_cart">
                <div className="recommended-card">
                  <img src={item.img} alt={item.name} />
                </div>

                <div className="card-overlay">
                  <div className="overlay-content">

                    {/* ⏱ TIME BOX → ONLY LISTING & ONLY 2 CARDS */}
                    {isListing && index < 2 && (
                      <div className="time_main">
                        <div className="timing_box">
                          <span>
                            <img src="/img/Stopwatch.svg" /> Time to end
                          </span>
                          <span>06:34:15</span>
                        </div>
                      </div>
                    )}

                    <span className="artist-name">{item.name}</span>

                    <div className="event-meta">
                      <span><img src="/img/date_icon.svg" /> {item.date}</span>
                      <span><img src="/img/loc_icon.svg" /> {item.location}</span>
                    </div>

                    <div className="price-tag">from {item.price}</div>

                  </div>
                </div>

              </div></Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default EventSection;
