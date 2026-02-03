import React from "react";
import { getFullImageUrl } from "@/utils/imageHelper";

const EventTicketscart = ({ event }) => {
  const posterImage =
    event?.posterImage && event.posterImage.length > 0
      ? event.posterImage[0]
      : null;

  return (
    <section className="recommended-section event_booking_card p-0">
      <div className="container">
        <div className="event_main_cart">
          <div className="recommended-card">
            <img
              src={
                posterImage
                  ? getFullImageUrl(posterImage)
                  : "/img/event_image.png"
              }
              alt={event?.eventTitle || "Event Image"}
            />
          </div>

          <div className="card-overlay">
            <div className="overlay-content">
              <h5 className="artist-name text-capitalize">
                {event?.eventTitle || "Event Name"}
              </h5>

              <ul className="list_event text-capitalize">
                <li>{event?.duration || "Duration"}</li>
                <li>{event?.eventCategory?.name || "Category"}</li>
                <li>{event?.status || "Status"}</li>
                {/* <li>7:30 PM</li> */}
              </ul>
              <span className="text-capitalize">
                {event?.venueAddress?.address || "Location"}
              </span>
              {/* <span>Las Vegas,Nevada,USA</span> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventTicketscart;