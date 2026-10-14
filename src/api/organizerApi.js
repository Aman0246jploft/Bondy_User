import apiClient from "./apiClient";

const organizerApi = {
    getDashboardData: () => apiClient.get("/organizerStats/dashboard", { skipToast: true }),
    getEarnings: (params) => apiClient.get("/payout/earnings", { params, skipToast: true }),
    requestPayout: (amount, paymentReference) =>
        apiClient.post("/payout/request-payout", { amount, paymentReference }),
    getAnalyticsStats: (filter) => apiClient.get("/analytics/organizer/stats", { params: filter ? { filter } : {}, skipToast: true }),
    getListingAnalytics: (params) => apiClient.get("/event/analytics/summary", { params, skipToast: true }),
    getRevenueAnalytics: (filterOrParams) => {
        const params =
            typeof filterOrParams === "object" && filterOrParams !== null
                ? filterOrParams
                : filterOrParams
                ? { filter: filterOrParams }
                : {};
        return apiClient.get("/analytics/organizer/revenue-analytics", {
            params,
            skipToast: true,
        });
    },
    getPublicOrganizers: (params) => apiClient.get("/user/organizers", { params, skipToast: true }),
};

export default organizerApi;
