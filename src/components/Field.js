"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export default function Field() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <AnimatePresence>
      {isReady && (
        <motion.div
          className="search-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 80, delay: 0.3 }}>
          <div className="search-fields">
            <div className="search-field one_field">
              <img src="/img/event_icon.svg" alt="event" />
              <div>
                <small>Event Type</small>
                <input type="text" placeholder="exp: music event" />
              </div>
            </div>

            <div className="divider" />

            <div className="search-field two_field">
              <img src="/img/loc_icon.svg" alt="location" />
              <div>
                <small>Where</small>
                <input type="text" placeholder="Location" />
              </div>
            </div>

            <div className="divider" />

            <div className="search-field three_field">
              <img src="/img/date_icon.svg" alt="date" />
              <div>
                <small>When</small>
                <input type="text" placeholder="Date" />
              </div>
            </div>
          </div>

          <div className="search-actions">
            <button className="icon-btn teal">
              <Search size={18} />
            </button>
            <button className="icon-btn outline">
              <img src="/img/location_icon.svg" alt="gps" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
