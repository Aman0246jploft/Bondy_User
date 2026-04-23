"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getFullImageUrl } from "@/utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";

const getCategoryLabel = (category, language) => {
  if (!category) return "";

  const localizedName = language === "mn" && category.name_thi
    ? category.name_thi
    : category.name;

  if (!localizedName) return "";

  return localizedName.charAt(0).toUpperCase() + localizedName.slice(1);
};

export default function InterestMultiSelectDropdown({
  categories = [],
  selectedIds = [],
  onChange,
  label,
  placeholder,
  error,
}) {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCategories = useMemo(
    () => categories.filter((category) => selectedIds.includes(category._id)),
    [categories, selectedIds],
  );

  const handleToggle = (id) => {
    const nextSelectedIds = selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id];

    if (onChange) {
      onChange(nextSelectedIds);
    }
  };

  const displayText = selectedCategories.length > 0
    ? selectedCategories.map((category) => getCategoryLabel(category, language)).join(", ")
    : placeholder;

  return (
    <div className="custom-floting interest-dropdown-field" ref={wrapperRef}>
      <label className="interest-dropdown-label">{label}</label>
      <button
        type="button"
        className={`interest-dropdown-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className={`interest-dropdown-value ${selectedCategories.length === 0 ? "placeholder" : ""}`}>
          {displayText}
        </span>
        <span className="interest-dropdown-caret" aria-hidden="true">▾</span>
      </button>

      {isOpen && (
        <div className="interest-dropdown-menu">
          {categories.length > 0 ? (
            categories.map((category) => {
              const isSelected = selectedIds.includes(category._id);
              return (
                <label key={category._id} className={`interest-dropdown-option ${isSelected ? "selected" : ""}`}>
                  <div className="interest-dropdown-option-main">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(category._id)}
                    />
                    <span className="interest-dropdown-option-image">
                      {category.image ? (
                        <img
                          src={getFullImageUrl(category.image)}
                          alt={getCategoryLabel(category, language)}
                          onError={(event) => {
                            event.target.src = "/img/sidebar-logo.svg";
                          }}
                        />
                      ) : (
                        <span className="interest-dropdown-option-image-placeholder" />
                      )}
                    </span>
                    <span className="interest-dropdown-option-text">
                      {getCategoryLabel(category, language)}
                    </span>
                  </div>
                </label>
              );
            })
          ) : (
            <div className="interest-dropdown-empty">{t("noCategoriesFound")}</div>
          )}
        </div>
      )}

      {selectedCategories.length > 0 && (
        <div className="interest-dropdown-chip-row">
          {selectedCategories.map((category) => (
            <span className="interest-dropdown-chip" key={category._id}>
              {getCategoryLabel(category, language)}
            </span>
          ))}
        </div>
      )}

      {error && <small className="text-danger ps-2">{error}</small>}
    </div>
  );
}