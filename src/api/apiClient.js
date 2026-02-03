import axios from "axios";

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

apiClient.interceptors.response.use(
    (response) => {
        const skipToast = response.config?.skipToast;
        if (!skipToast) {
            if (response.data?.status && response.data?.message) {
                toast.success(response.data.message);
            } else if (response.data?.status === false && response.data?.message) {
                if (response.data.message === "Invalid or expired token") {
                    localStorage.removeItem("token");
                    localStorage.removeItem("registerEmail");
                    window.location.href = "/";
                    return;
                }
                toast.error(response.data.message);
            }
        }
        return response.data;
    },
    (error) => {
        const skipToast = error.config?.skipToast;
        const message = error.response?.data?.message || "Something went wrong";
        if (!skipToast) {
            toast.error(message);
        }
        console.error("API Error:", message);
        return Promise.reject(error);
    }
);

export default apiClient;
