import React from "react";
import { getFullImageUrl } from "@/utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";
import { formatTime } from "@/utils/timeHelper";


const EventTicketscart = ({ item }) => {
  const posterImage =
    item?.posterImage && item.posterImage.length > 0
      ? item.posterImage[0]
      : null;

  const { t,language } = useLanguage();

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
               onError={(e) => { e.target.src = "/img/sidebar-logo.svg"; }}
            />
          </div>

          <div className="card-overlay">
            <div className="overlay-content">
              <h5 className="artist-name text-capitalize">
                {item?.title || t("namePlaceholder")}
              </h5>

              <ul className="list_event text-capitalize">
                <li>{(language === "mn" ? item?.durationTranslation || item?.duration : item?.duration) || t("durationNotAvailable")}</li>
                <li>{item?.categoryName || t("categoryPlaceholder")}</li>
                <li>{item?.status || t("statusPlaceholder")}</li>
                {/* <li>7:30 PM</li> */}
              </ul>
              <span className="text-capitalize">
                {item?.venueAddress?.address || t("locationPlaceholder")}
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