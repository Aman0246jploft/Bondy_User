import { getFullImageUrl } from "@/utils/imageHelper";
import React from "react";
import { useLanguage } from "@/context/LanguageContext";

const InterestSelector = ({ categories = [], selectedIds = [], onToggle }) => {
  const { language } = useLanguage();

  const getCategoryName = (item) => {
    const localizedName = language === "mn" && item?.name_thi ? item.name_thi : item?.name;
    return localizedName?.charAt(0).toUpperCase() + localizedName?.slice(1);
  };

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
                alt={getCategoryName(item)}
                style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
                onError={(e) => { e.target.src = "/img/sidebar-logo.svg"; }}
                
              />
            ) : (
              <div style={{ width: "24px", height: "24px", background: "#eee", borderRadius: "50%" }} />
            )}
          </span>
          <span>{getCategoryName(item)}</span>
        </div>
      ))}
    </div>
  );
};

export default InterestSelector;
