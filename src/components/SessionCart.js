import Link from "next/link";
import React from "react";

/* 🔹 DATA - Keys updated to match props */
const eventData = {
  NextSession: {
    title: "Next Session",
    data: [
      { id: 1, name: "Nora Bayes", date: "May 6, 2025", location: "Hagen", price: "$778.58", img: "/img/img_01.png" },
      { id: 2, name: "Tony Bennett", date: "Aug 2, 2025", location: "Salem (OR)", price: "$388.89", img: "/img/img_02.png" },
      { id: 3, name: "Joan Baez", date: "Dec 28, 2025", location: "Naltchik", price: "$406.27", img: "/img/img_03.png" },
      { id: 4, name: "Devendra Banhart", date: "Feb 9, 2025", location: "Sterlitamak", price: "$275.43", img: "/img/img_04.png" },
    ],
  },
  PastSessions: {
    title: "Past Sessions",
    data: [
      { id: 101, name: "City Beats", date: "Mar 10", location: "Your City", price: "$99", img: "/img/img_01.png" },
      { id: 102, name: "Local Jam", date: "Mar 12", location: "Downtown", price: "$79", img: "/img/img_02.png" },
      { id: 103, name: "Street Vibes", date: "Mar 15", location: "Main Square", price: "$69", img: "/img/img_03.png" },
      { id: 104, name: "Open Mic", date: "Mar 18", location: "Cafe Zone", price: "$59", img: "/img/img_04.png" },
    ],
  },
};

const SessionCart = ({ type = "NextSession" }) => {
  // Props ke basis par data fetch karein
  const section = eventData[type];

  // Agar data nahi milta toh kuch return na karein
  if (!section) return null;

  return (
    <section className="recommended-section">
      <div className="container">
        
        {/* 🔹 HEADER - Title dynamic ayegi props ke according */}
        <div className="main_title align_title position-relative z-2 border-bottm">
          <h2>{section.title}</h2>
          <Link href="/Listing" className="see-all">See all</Link>
        </div>

        <div className="row gy-5">
          {section.data.map((item) => (
            <div key={item.id} className="col-lg-3 col-md-6 col-sm-12">
              <div className="event_main_cart">
                <div className="recommended-card">
                  <img src={item.img} alt={item.name} />
                </div>

                <div className="card-overlay">
                  <div className="overlay-content">
                    <Link href="/eventDetails"><span className="artist-name">{item.name}</span></Link>

                    <div className="event-meta">
                      <span><img src="/img/date_icon.svg" alt="date" /> {item.date}</span>
                      <span><img src="/img/loc_icon.svg" alt="location" /> {item.location}</span>
                    </div>

                    <div className="price-tag">from {item.price}</div>
                   <div className="event_cart_footer">
                     <Link href="/eventbooking"  className="common_btn max_170"> Book </Link>
                     <span>42/50 Sheet left</span>
                   </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default SessionCart;