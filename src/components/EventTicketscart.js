import React from "react";
import { getFullImageUrl } from "@/utils/imageHelper";

const EventTicketscart = ({ item }) => {
  const posterImage =
    item?.posterImage && item.posterImage.length > 0
      ? item.posterImage[0]
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
              alt={item?.title || "Image"}
            />
          </div>

          <div className="card-overlay">
            <div className="overlay-content">
              <h5 className="artist-name text-capitalize">
                {item?.title || "Name"}
              </h5>

              <ul className="list_event text-capitalize">
                <li>{item?.duration || "Duration N/A"}</li>
                <li>{item?.categoryName || "Category"}</li>
                <li>{item?.status || "Status"}</li>
                {/* <li>7:30 PM</li> */}
              </ul>
              <span className="text-capitalize">
                {item?.venueAddress?.address || "Location"}
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