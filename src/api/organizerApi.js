import apiClient from "./apiClient";

const organizerApi = {
    getDashboardData: () => {
        return apiClient.get("/organizerStats/dashboard", { skipToast: true });
    }
};

export default organizerApi;
