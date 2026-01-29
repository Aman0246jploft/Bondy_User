"use client";
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CircleHelp } from 'lucide-react';

const faqData = [
  {
    question: "When Exclusive Private Market for Event ticket salo Opportunities ?",
    answer: "it is a long established fact that a reader containt for a page when Ipsum that it has a more-or-less-this is simple less normal it is a long established fact that a reader containt of a page when ipsum it has it has a more-or-less-this is simple less normal"
  },
  { question: "If Easy to found subscription And Tickets purchase?", answer: "Our system is fully automated for easy ticket management." },
  { question: "Why Raiso Your more Event & ticket?", answer: "To maximize reach and provide better event visibility." },
  { question: "I haven't received my e-ticket. What should I do?", answer: "Please check your spam or download from the dashboard." },
  { question: "How More Supply and more Event for future ?", answer: "We are onboarding more partners every month." },
  { question: "How Comprehensive Comliance for Event Ticket Purchase?", answer: "We follow all legal standards for secure transactions." }
];

export default function FAQ() {
  // Simple State: Pehla index open rakha hai (0)
  const [activeIndex, setActiveIndex] = useState(0);

  const handleToggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq-body">
      <div className="faq-wrapper">
        <div className="main_title text-center">
          <h2>Frequently Asked <span>Questions</span></h2>
          <p>Explore the most common questions and detailed answers about our events of concerts, and security to help guide your journey in the EVENJO.</p>
        </div>

        <div className="faq-list">
          {faqData.map((item, index) => (
            <div 
              key={index} 
              className={`faq-item ${activeIndex === index ? 'active' : ''}`}
            >
              <button className="faq-trigger" onClick={() => handleToggle(index)}>
                <div className="faq-q-text">
                  <CircleHelp size={20} className="faq-icon-left" />
                  <span>{item.question}</span>
                </div>
                {activeIndex === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              <div className="faq-content">
                <div className="faq-answer-text">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}