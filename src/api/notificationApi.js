import apiClient from "./apiClient";

const notificationApi = {
    getMyNotifications: (params) => {
        return apiClient.post("/notification/my-notifications", params, { skipToast: true });
    },
    markAsRead: (notificationId) => {
        return apiClient.post("/notification/mark-read", { notificationId }, { skipToast: true });
    },
    markAllAsRead: () => {
        return apiClient.post("/notification/mark-all-read", {}, { skipToast: true });
    },
    deleteNotification: (notificationId) => {
        return apiClient.post("/notification/delete", { notificationId });
    }
};

export default notificationApi;
