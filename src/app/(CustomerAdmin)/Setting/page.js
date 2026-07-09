"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import userSettingApi from "@/api/userSettingApi";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";
import { Bell, Calendar, User, MessageSquare } from "lucide-react";

function page() {
  const { t, changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const languages = [
    { code: "en", dbLabel: "English", label: "English", flag: "/img/usflag.svg" },
    { code: "mn", dbLabel: "Mongolian", label: "Mongolian", flag: "/img/Flag_of_Mongolia.svg.png" },
  ];

  const [settings, setSettings] = useState({
    pushNotification: true,
    bookingNotification: true,
    reminderNotification: true,
    organizerUpdateNotification: true,
    messageNotification: true,
    appTheme: "dark",
    language: "English"
  });

  const [currentLang, setCurrentLang] = useState(languages[0]);

  useEffect(() => {
    fetchSettings();
    document.title = "Setting - Bondy";
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await userSettingApi.getUserSetting();
      if (res?.status && res?.data) {
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
    setSettings(prev => {
      const updated = { ...prev, [field]: newValue };

      // Handle backend-like cascading logic in frontend state for instant UI update
      if (field === "pushNotification") {
        updated.bookingNotification = newValue;
        updated.reminderNotification = newValue;
        updated.organizerUpdateNotification = newValue;
        updated.messageNotification = newValue;
      } else {
        const anyActiveSub = updated.bookingNotification ||
          updated.reminderNotification ||
          updated.organizerUpdateNotification ||
          updated.messageNotification;
        if (anyActiveSub && !prev.pushNotification) {
          updated.pushNotification = true;
        } else if (!anyActiveSub && prev.pushNotification) {
          updated.pushNotification = false;
        }
      }
      return updated;
    });

    try {
      await userSettingApi.updateUserSetting({ [field]: newValue });
      toast.success(t("settingsUpdated") || "Settings updated");
    } catch (error) {
      console.error("Failed to update setting:", error);
      toast.error(t("failedToUpdateSettings") || "Failed to update settings");
      // Revert on failure by fetching settings again
      fetchSettings();
    }
  };

  const handleLanguageChange = async (lang) => {
    setCurrentLang(lang);
    setOpen(false);

    try {
      await userSettingApi.updateUserSetting({ language: lang.dbLabel });
      if (changeLanguage) changeLanguage(lang.code);
      toast.success(t("languageUpdated") || "Language updated");
    } catch (error) {
      console.error("Failed to update language:", error);
      toast.error(t("failedToUpdateLanguage") || "Failed to update language");
    }
  };

  if (loading) {
    return <div className="text-center py-5">{t("loading")}...</div>;
  }

  return (
    <div>
      <div className="cards setting-card">
        <div className="card-title">
          <h3>{t("setting") || "Setting"}</h3>
        </div>

        {/* General Section */}
        <h4 className="settings-section-title">{t("general")}</h4>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-lft">
              <div className="settings-icon-wrapper">
                <Bell size={24} />
              </div>
              <div className="settings-text-container">
                <h5>{t("pushNotifications")}</h5>
                <p>{t("pushNotificationsDesc")}</p>
              </div>
            </div>
            <div className="settings-row-rgt">
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
        </div>

        {/* Notification Preferences Section */}
        <h4 className="settings-section-title">{t("notificationPreferences")}</h4>
        <div className="settings-card">
          {/* Bookings */}
          <div className="settings-row">
            <div className="settings-row-lft">
              <div className="settings-icon-wrapper">
                <Calendar size={24} />
              </div>
              <div className="settings-text-container">
                <h5>{t("bookings")}</h5>
                <p>{t("bookingsDesc")}</p>
              </div>
            </div>
            <div className="settings-row-rgt">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="bookingNotification"
                  checked={settings.bookingNotification}
                  onChange={() => handleToggle("bookingNotification")}
                />
              </div>
            </div>
          </div>

          {/* Reminders */}
          <div className="settings-row">
            <div className="settings-row-lft">
              <div className="settings-icon-wrapper">
                <Bell size={24} />
              </div>
              <div className="settings-text-container">
                <h5>{t("reminders")}</h5>
                <p>{t("remindersDesc")}</p>
              </div>
            </div>
            <div className="settings-row-rgt">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="reminderNotification"
                  checked={settings.reminderNotification}
                  onChange={() => handleToggle("reminderNotification")}
                />
              </div>
            </div>
          </div>

          {/* Organizer Updates */}
          <div className="settings-row">
            <div className="settings-row-lft">
              <div className="settings-icon-wrapper">
                <User size={24} />
              </div>
              <div className="settings-text-container">
                <h5>{t("organizerUpdates")}</h5>
                <p>{t("organizerUpdatesDesc")}</p>
              </div>
            </div>
            <div className="settings-row-rgt">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="organizerUpdateNotification"
                  checked={settings.organizerUpdateNotification}
                  onChange={() => handleToggle("organizerUpdateNotification")}
                />
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="settings-row">
            <div className="settings-row-lft">
              <div className="settings-icon-wrapper">
                <MessageSquare size={24} />
              </div>
              <div className="settings-text-container">
                <h5>{t("messages")}</h5>
                <p>{t("messagesDesc")}</p>
              </div>
            </div>
            <div className="settings-row-rgt">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="messageNotification"
                  checked={settings.messageNotification}
                  onChange={() => handleToggle("messageNotification")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div className="language-wrapper mt-4">
          <p className="title">{t("preferredLanguage") || "Select your preferred language"}</p>

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
