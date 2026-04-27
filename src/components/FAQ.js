"use client";
import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, CircleHelp } from "lucide-react";
import authApi from "@/api/authApi";
import { useLanguage } from "@/context/LanguageContext";

export default function FAQ() {
  const { t } = useLanguage();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await authApi.getFaqs();
        if (response?.status) {
          setFaqs(response?.data?.faqs);
        }
      } catch (error) {
        console.error("Failed to fetch FAQs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);


  const handleToggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  if (loading) {
    return (
      <div className="faq-body">
        <div className="faq-wrapper text-center">
          <p>{t("loadingFaqs")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="faq-body">
      <div className="faq-wrapper">
        <div className="main_title text-center">
          <h2>
            {t("frequentlyAsked")} <span>{t("questions")}</span>
          </h2>
          <p>
            {t("faqDescription")}
          </p>
        </div>

        <div className="faq-list">
          {faqs.length > 0 ? (
            faqs.map((item, index) => (
              <div
                key={item._id || index}
                className={`faq-item ${activeIndex === index ? "active" : ""}`}
              >
                <button
                  className="faq-trigger"
                  onClick={() => handleToggle(index)}
                >
                  <div className="faq-q-text">
                    <CircleHelp size={20} className="faq-icon-left" />
                    <span>{item.question}</span>
                  </div>
                  {activeIndex === index ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>

                <div className="faq-content">
                  <div className="faq-answer-text">{item.answer}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center">{t("noFaqsFound")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
