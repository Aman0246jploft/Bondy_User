import axios from "axios";
import { translations } from "@/context/translations";

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

import toast from "react-hot-toast";

const localizeMessage = (message) => {
    if (!message || typeof message !== "string") return message;
    let lang = "en";
    try {
        if (typeof window !== "undefined") {
            lang = localStorage.getItem("app_lang") || "en";
        }
    } catch (e) {
        lang = "en";
    }

    if (translations[lang] && translations[lang][message]) return translations[lang][message];

    const enEntries = Object.entries(translations.en || {});
    const found = enEntries.find(([k, v]) => v === message);
    if (found) {
        const key = found[0];
        return translations[lang]?.[key] || translations.en?.[key] || message;
    }

    return message;
};

apiClient.interceptors.response.use(
    (response) => {
        const skipToast = response.config?.skipToast;
        if (!skipToast) {
            if (response.data?.status && response.data?.message) {
                if (typeof response.data.message === "string") {
                    // toast.success(response.data.message);
                }
            } else if (response.data?.status === false && response.data?.message) {
                if (response.data.message === "Invalid or expired token") {
                    localStorage.removeItem("token");
                    localStorage.removeItem("registerEmail");
                    window.location.href = "/";
                    return;
                }
                toast.error(localizeMessage(response.data.message));
            }
        }
        return response.data;
    },
    (error) => {
        const skipToast = error.config?.skipToast;
        const message = error.response?.data?.message || "Something went wrong";
        if (!skipToast) {
            toast.error(localizeMessage(message));
        }
        console.error("API Error:", message);
        return Promise.reject(error);
    }
);

export default apiClient;