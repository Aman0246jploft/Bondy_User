"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import Mapview from "./Mapview";
import HeroSearchFilter from "./HeroSearchFilter";
import VenueAutocomplete from "@/app/(OrganizerAdmin)/Components/VenueAutocomplete";

export default function GridSystem({ setView, searchParams, onSearch }) {
  const [isReady, setIsReady] = useState(false);
  const [keyword, setKeyword] = useState(searchParams?.search || "");
  const [location, setLocation] = useState(null); // VenueAutocomplete handles this

  useEffect(() => {
    setIsReady(true);
  }, []);

  const handleSearchClick = () => {
    if (onSearch) {
      onSearch({
        ...searchParams,
        search: keyword,
        latitude: location?.latitude || searchParams?.latitude,
        longitude: location?.longitude || searchParams?.longitude,
      });
    }
  };

  return (
    <>
      <div className="grid_sytem">
        <AnimatePresence>
          {isReady && (
            <motion.div
              className="search-card "
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 80, delay: 0.3 }}>
              <div className="search-fields one_field">
                <div className="search-field">
                  <img src="/img/event_icon.svg" alt="event" />
                  <div>
                    <small>Event Type</small>
                    <input
                      type="text"
                      placeholder="exp: music event"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="divider" />

                <div className="search-field two_field">
                  <img src="/img/loc_icon.svg" alt="location" />
                  <div style={{ width: "100%" }}>
                    <small>Where</small>
                    <VenueAutocomplete
                      onPlaceSelected={(place) => setLocation(place)}
                      placeholder="Location"
                    />
                  </div>
                </div>

                <div className="divider" />

                <HeroSearchFilter />
              </div>

              <div className="search-actions">
                <button className="icon-btn teal" onClick={handleSearchClick}>
                  <Search size={18} />
                </button>
                <button
                  className="icon-btn outline"
                  onClick={() => setView("hero")}>
                  <img src="/img/grid_icon.svg" alt="gps" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="">
        <Mapview searchParams={searchParams} />
      </div>
    </>
  );
}
