import apiClient from "./apiClient";

const organizerApi = {
    getDashboardData: () => apiClient.get("/organizerStats/dashboard", { skipToast: true }),
    getEarnings: () => apiClient.get("/payout/earnings", { skipToast: true }),
    requestPayout: (amount, paymentReference) =>
        apiClient.post("/payout/request-payout", { amount, paymentReference }),
    getAnalyticsStats: (filter) => apiClient.get("/analytics/organizer/stats", { params: filter ? { filter } : {}, skipToast: true }),
    getRevenueAnalytics: (filter) => apiClient.get("/analytics/organizer/revenue-analytics", { params: filter ? { filter } : {}, skipToast: true }),
};

export default organizerApi;
