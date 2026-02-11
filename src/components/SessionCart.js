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

const SessionCart = ({ type, title, events }) => {
  // If events are passed via props, use them, otherwise check local data (optional fallback)
  const dataToRender = events || (eventData[type] ? eventData[type].data : []);
  const displayTitle = title || (eventData[type] ? eventData[type].title : "");

  if (!dataToRender || dataToRender.length === 0) return null;

  return (
    <section className="recommended-section">
      <div className="container">
        <div className="main_title align_title position-relative z-2 border-bottm">
          <h2>{displayTitle}</h2>
          <Link href="/Listing" className="see-all">
            See all
          </Link>
        </div>

        <div className="row gy-5">
          {dataToRender.map((item) => {
            // Map API data to component variables
            const id = item._id || item.id;
            const name = item.eventTitle || item.courseTitle || item.name;
            const img = Array.isArray(item.posterImage) ? item.posterImage[0] : item.posterImage || item.img;
            const date = item.startDate ? new Date(item.startDate).toLocaleDateString() : item.date;

            // Location mapping
            let location = item.location;
            if (!location && item.venueAddress) {
              location = item.venueAddress.city || item.venueAddress.address;
            }

            const price = item.ticketPrice !== undefined ? `$${item.ticketPrice}` : item.price;

            // Calculate seats left
            const seatsLeft = item.totalTickets && item.ticketQtyAvailable
              ? `${item.ticketQtyAvailable}/${item.totalTickets} Seat left`
              : "42/50 Sheet left";

            // Booking URL Logic
            const isCourse = item.courseTitle || item.schedules;
            const now = new Date();
            let bookingUrl = "#";
            let scheduleId = null;

            if (isCourse && item.schedules && item.schedules.length > 0) {
              const futureSchedule = item.schedules.find(s => new Date(s.endDate) >= now);
              const pastSchedule = item.schedules[item.schedules.length - 1];
              const targetSchedule = futureSchedule || pastSchedule;
              scheduleId = targetSchedule?._id;
              bookingUrl = `/eventbooking?id=${id}&scheduleId=${scheduleId}`;
            } else {
              bookingUrl = `/eventbooking?eventId=${id}`;
            }

            return (
              <div key={id} className="col-lg-3 col-md-6 col-sm-12">
                <div className="event_main_cart">
                  <div className="recommended-card">
                    <img src={img} alt={name} onError={(e) => e.target.src = "/img/event_img.png"} />
                  </div>

                  <div className="card-overlay">
                    <div className="overlay-content">
                      <Link href={`/eventDetails?id=${id}`}>
                        <span className="artist-name">{name}</span>
                      </Link>

                      <div className="event-meta">
                        <span>
                          <img src="/img/date_icon.svg" alt="date" /> {date}
                        </span>
                        <span>
                          <img src="/img/loc_icon.svg" alt="location" /> {location || "Online"}
                        </span>
                      </div>

                      <div className="price-tag">from {price}</div>
                      <div className="event_cart_footer">
                        <Link href={bookingUrl} className="common_btn max_170">
                          Book
                        </Link>
                        <span>{seatsLeft}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SessionCart;