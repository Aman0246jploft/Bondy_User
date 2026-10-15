import { getFullImageUrl } from "@/utils/imageHelper";
import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { formatCategoryName } from "@/utils/formatHelper";

const InterestSelector = ({ categories = [], selectedIds = [], onToggle, disabled = false }) => {
  const { language } = useLanguage();

  const getCategoryName = (item) => formatCategoryName(item, language);

  return (
    <div className="interest-container">
      {categories.map((item) => {
        const isSelected = selectedIds.includes(item._id);
        const name = getCategoryName(item);

        return (
          <button
            key={item._id}
            type="button"
            onClick={() => !disabled && onToggle && onToggle(item._id)}
            className={`chip ${isSelected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
            aria-pressed={isSelected}
          >
            <span className="icon">
              {item.image ? (
                <img
                  src={getFullImageUrl(item.image)}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: "20px",
                    height: "20px",
                    objectFit: "contain",
                    filter: isSelected ? "brightness(0) invert(1)" : "brightness(0) invert(0.92)",
                    transition: "filter 0.2s ease, transform 0.2s ease",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: isSelected ? "#fff" : "var(--acc, #23ada4)",
                    display: "inline-block",
                  }}
                />
              )}
            </span>
            <span>{name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default InterestSelector;
