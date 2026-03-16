"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import userSettingApi from "@/api/userSettingApi";

import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

function page() {
  const { changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const languages = [
    { code: "en", dbLabel: "English", label: "English", flag: "/img/usflag.svg" },
    { code: "mn", dbLabel: "Mongolian", label: "Mongolian", flag: "/img/Flag_of_Mongolia.svg.png" },

  ];

  const [settings, setSettings] = useState({
    emailNotification: true,
    inAppNotification: true,
    pushNotification: true,
    smsNotification: true,
    whatsappNotification: true,
    appTheme: "dark",
    language: "English"
  });

  const [currentLang, setCurrentLang] = useState(languages[0]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await userSettingApi.getUserSetting();
      if (res.status && res.data) {
        setSettings(res.data);

        // Find matching language from choices
        const matchedLang = languages.find(l => l.dbLabel === res.data.language);
        if (matchedLang) {
          setCurrentLang(matchedLang);
          if (changeLanguage) changeLanguage(matchedLang.code);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (field) => {
    const newValue = !settings[field];

    // Optimistic update
    setSettings(prev => ({ ...prev, [field]: newValue }));

    try {
      await userSettingApi.updateUserSetting({ [field]: newValue });
      toast.success("Settings updated");
    } catch (error) {
      console.error("Failed to update setting:", error);
      toast.error("Failed to update settings");
      // Revert on failure
      setSettings(prev => ({ ...prev, [field]: !newValue }));
    }
  };


  const handleLanguageChange = async (lang) => {
    setCurrentLang(lang);
    setOpen(false);

    try {
      await userSettingApi.updateUserSetting({ language: lang.dbLabel });
      if (changeLanguage) changeLanguage(lang.code);
      toast.success("Language updated");
    } catch (error) {
      console.error("Failed to update language:", error);
      toast.error("Failed to update language");
    }
  };

  if (loading) {
    return <div className="text-center py-5">Loading settings...</div>;
  }

  return (
    <div>
      <div className="cards setting-card">
        <div className="card-title">
          <h3>Setting</h3>
        </div>

        {/* In-App Notifications */}
        <div className="setting-info">
          <div className="setting-info-lft">
            <h5>In-App Notifications</h5>
            <p>Receive notifications within the app while you are using it.</p>
          </div>
          <div className="setting-info-rgt">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="inAppNotification"
                checked={settings.inAppNotification}
                onChange={() => handleToggle("inAppNotification")}
              />
            </div>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="setting-info">
          <div className="setting-info-lft">
            <h5>Push Notifications</h5>
            <p>Receive push-notifications on your device for important events and offers.</p>
          </div>
          <div className="setting-info-rgt">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="pushNotification"
                checked={settings.pushNotification}
                onChange={() => handleToggle("pushNotification")}
              />
            </div>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="setting-info">
          <div className="setting-info-lft">
            <h5>Email Notifications</h5>
            <p>Stay updated with event news and updates directly to your email.</p>
          </div>
          <div className="setting-info-rgt">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="emailNotification"
                checked={settings.emailNotification}
                onChange={() => handleToggle("emailNotification")}
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Notifications */}
        <div className="setting-info">
          <div className="setting-info-lft">
            <h5>WhatsApp Notifications</h5>
            <p>Receive instant updates and alerts directly on WhatsApp.</p>
          </div>
          <div className="setting-info-rgt">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="whatsappNotification"
                checked={settings.whatsappNotification}
                onChange={() => handleToggle("whatsappNotification")}
              />
            </div>
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="setting-info">
          <div className="setting-info-lft">
            <h5>SMS Notifications</h5>
            <p>Get text messages for ticket availability and critical alerts.</p>
          </div>
          <div className="setting-info-rgt">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="smsNotification"
                checked={settings.smsNotification}
                onChange={() => handleToggle("smsNotification")}
              />
            </div>
          </div>
        </div>


        {/* Language Selection */}
        <div className="language-wrapper">
          <p className="title">Select your preferred language</p>

          <div className="language-select" onClick={() => setOpen(!open)}>
            <div className="d-flex align-items-center gap-2">
              <Image src={currentLang.flag} alt="" width={22} height={22} />
              <span>{currentLang.label}</span>
            </div>

            <span className={`arrow ${open ? "rotate" : ""}`}>
              <img src="/img/arrow-down.svg" />
            </span>
          </div>

          {open && (
            <div className="language-dropdown">
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  className="language-item"
                  onClick={() => handleLanguageChange(lang)}
                >
                  <img src={lang.flag} alt="" />
                  <span>{lang.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default page;
