export const formatTime = (time, is24Hour = true, language = "") => {
  if (!time) return "";

  const [hourStr = "00", minuteStr = "00"] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr.padStart(2, "0");

  if (is24Hour) {
    const suffix = language === "mn" ? " Цаг" : language ? " H" : "";
    return `${hour.toString().padStart(2, "0")}:${minute}${suffix}`;
  }

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;

  return `${hour}:${minute} ${ampm}`;
};