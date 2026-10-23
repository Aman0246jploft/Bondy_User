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
        const lang = typeof window !== "undefined" ? (localStorage.getItem("app_lang") || localStorage.getItem("language") || "en") : "en";
        config.headers["Accept-Language"] = lang;
        config.headers["language"] = lang;
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

import toast from "react-hot-toast";
import { backendMessages } from "@/utils/backendMessages";

const mongolianToEnglishBackend = {};
if (backendMessages) {
    Object.entries(backendMessages).forEach(([enMsg, mnMsg]) => {
        if (mnMsg && enMsg) {
            mongolianToEnglishBackend[mnMsg] = enMsg;
        }
    });
}

export const localizeMessage = (message) => {
    if (!message || typeof message !== "string") return message;
    let lang = "en";
    try {
        if (typeof window !== "undefined") {
            lang = localStorage.getItem("app_lang") || localStorage.getItem("language") || "en";
        }
    } catch (e) {
        lang = "en";
    }

    // 1. Direct translation key match in UI translations
    if (translations[lang] && translations[lang][message]) return translations[lang][message];

    // 2. If target language is English
    if (lang === "en") {
        if (mongolianToEnglishBackend[message]) return mongolianToEnglishBackend[message];
        for (const [mnKey, enVal] of Object.entries(mongolianToEnglishBackend)) {
            if (mnKey && message.startsWith(mnKey)) {
                return message.replace(mnKey, enVal);
            }
        }
        const mnEntries = Object.entries(translations.mn || {});
        const foundMn = mnEntries.find(([, v]) => v === message);
        if (foundMn) {
            const key = foundMn[0];
            return translations.en?.[key] || message;
        }
    }

    // 3. If target language is Mongolian
    if (lang === "mn") {
        if (backendMessages[message]) return backendMessages[message];
        for (const [enKey, mnVal] of Object.entries(backendMessages)) {
            if (enKey && message.startsWith(enKey)) {
                return message.replace(enKey, mnVal);
            }
        }
        const enEntries = Object.entries(translations.en || {});
        const foundEn = enEntries.find(([, v]) => v === message);
        if (foundEn) {
            const key = foundEn[0];
            return translations.mn?.[key] || message;
        }
    }

    return message;
};

const TITLE_KEYS = new Set([
    "eventTitle",
    "courseTitle",
    "title",
    "titleMn",
    "eventName",
    "courseName",
    "ticketTitle",
    "ticketName",
    "bookingTitle",
    "entityTitle",
    "entityName",
    "name",
    "fullName",
    "businessName",
    "categoryName",
    "venue",
    "venueName",
]);

export function toTitleCase(str) {
    if (!str || typeof str !== "string") return str;
    const trimmed = str.trim();
    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("/") ||
        trimmed.startsWith("data:") ||
        trimmed.startsWith("<") ||
        trimmed.includes("@") ||
        /^[0-9a-fA-F]{24}$/.test(trimmed) ||
        /^\d{4}-\d{2}-\d{2}/.test(trimmed)
    ) {
        return str;
    }
    return str.replace(/(?:^|[\s\-\/\(\[\'\"\u2018\u201c])\S/g, (char) => char.toUpperCase());
}

export function deepCapitalizeTitles(obj, seen = new WeakSet()) {
    if (!obj || typeof obj !== "object") return obj;
    if (seen.has(obj)) return obj;
    seen.add(obj);

    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = deepCapitalizeTitles(obj[i], seen);
        }
        return obj;
    }

    for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === "string") {
            if (TITLE_KEYS.has(key)) {
                obj[key] = toTitleCase(val);
            }
        } else if (typeof val === "object" && val !== null) {
            obj[key] = deepCapitalizeTitles(val, seen);
        }
    }

    return obj;
}

apiClient.interceptors.response.use(
    (response) => {
        const skipToast = response.config?.skipToast;
        const rawMsg = response.data?.message || "";
        const isAccountDisabled =
            response.data?.code === "ACCOUNT_DISABLED" ||
            rawMsg === "This account has been deactivated." ||
            rawMsg === "This account has been deactivated" ||
            rawMsg === "Your account has been disabled. Please contact support." ||
            rawMsg.includes("идэвхгүй болсон") ||
            (response.data?.status === false && (
                rawMsg.toLowerCase().includes("account has been disabled") ||
                rawMsg.toLowerCase().includes("account has been deactivated") ||
                rawMsg.toLowerCase().includes("account is disabled") ||
                rawMsg.toLowerCase().includes("account is deactivated")
            ));

        const isInvalidToken =
            rawMsg === "Invalid or expired token" ||
            rawMsg.includes("Хүчингүй эсвэл хугацаа нь дууссан");

        if (response.data?.status === false && (isAccountDisabled || isInvalidToken)) {
            localStorage.removeItem("token");
            localStorage.removeItem("userProfile");
            localStorage.removeItem("registerEmail");

            if (!skipToast) {
                const displayMsg = isAccountDisabled
                    ? localizeMessage("This account has been deactivated.")
                    : localizeMessage(rawMsg || "Invalid or expired token");
                toast.error(displayMsg, { id: "auth-status-toast" });
            }

            const isAuthPage = typeof window !== "undefined" && (
                window.location.pathname.includes("/login") ||
                window.location.pathname.includes("/register") ||
                window.location.pathname.includes("/signup") ||
                window.location.pathname.includes("/forgotpassword") ||
                response.config?.url?.includes("/login") ||
                response.config?.url?.includes("/signup")
            );

            if (!isAuthPage) {
                setTimeout(() => {
                    window.location.href = "/";
                }, 1500);
            }
            return response.data;
        }

        if (!skipToast) {
            if (response.data?.status && response.data?.message) {
                if (typeof response.data.message === "string") {
                    // toast.success(response.data.message);
                }
            } else if (response.data?.status === false && response.data?.message) {
                const displayMsg = isAccountDisabled
                    ? localizeMessage("This account has been deactivated.")
                    : localizeMessage(response.data.message);
                toast.error(displayMsg, { id: "auth-status-toast" });
            }
        }
        if (response.data) {
            response.data = deepCapitalizeTitles(response.data);
        }
        return response.data;
    },
    (error) => {
        const skipToast = error.config?.skipToast;
        const message = error.response?.data?.message || error.message || "Something went wrong";
        const code = error.response?.data?.code;
        const isAccountDisabled =
            code === "ACCOUNT_DISABLED" ||
            message === "This account has been deactivated." ||
            message === "This account has been deactivated" ||
            message === "Your account has been disabled. Please contact support." ||
            message.includes("идэвхгүй болсон") ||
            message.toLowerCase().includes("account has been disabled") ||
            message.toLowerCase().includes("account has been deactivated") ||
            message.toLowerCase().includes("account is disabled") ||
            message.toLowerCase().includes("account is deactivated");

        const isForbiddenOrDisabled =
            error.response?.status === 401 ||
            error.response?.status === 403 ||
            isAccountDisabled;

        if (!skipToast) {
            const displayMsg = isAccountDisabled
                ? localizeMessage("This account has been deactivated.")
                : localizeMessage(message);
            toast.error(displayMsg, { id: "auth-status-toast" });
        }

        if (isForbiddenOrDisabled) {
            localStorage.removeItem("token");
            localStorage.removeItem("userProfile");
            localStorage.removeItem("registerEmail");

            const isAuthPage = typeof window !== "undefined" && (
                window.location.pathname.includes("/login") ||
                window.location.pathname.includes("/register") ||
                window.location.pathname.includes("/signup") ||
                window.location.pathname.includes("/forgotpassword") ||
                error.config?.url?.includes("/login") ||
                error.config?.url?.includes("/signup")
            );

            if (!isAuthPage) {
                setTimeout(() => {
                    window.location.href = "/";
                }, 1500);
            }
        }
        console.error("API Error:", message);
        return Promise.reject(error);
    }
);

export default apiClient;