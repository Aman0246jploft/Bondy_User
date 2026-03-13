import apiClient from "./apiClient";

const organizerApi = {
    getDashboardData: () => apiClient.get("/organizerStats/dashboard", { skipToast: true }),
    getEarnings: () => apiClient.get("/payout/earnings", { skipToast: true }),
    requestPayout: (amount, paymentReference) =>
        apiClient.post("/payout/request-payout", { amount, paymentReference }),
};

export default organizerApi;
