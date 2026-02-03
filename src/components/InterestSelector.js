import { getFullImageUrl } from "@/utils/imageHelper";
import React from "react";

const InterestSelector = ({ categories = [], selectedIds = [], onToggle }) => {
  return (
    <div className="interest-container">
      {categories.map((item) => (
        <div
          key={item._id}
          onClick={() => onToggle && onToggle(item._id)}
          className={`chip ${selectedIds.includes(item._id) ? "selected" : ""}`}>
          <span className="icon">
            {item.image ? (
              <img
                src={getFullImageUrl(item.image)}
                alt={item.name}
                style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "24px", height: "24px", background: "#eee", borderRadius: "50%" }} />
            )}
          </span>
          <span>{item.name}</span>
        </div>
      ))}
    </div>
  );
};

export default InterestSelector;
