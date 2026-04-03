import apiClient from "./apiClient";

const reviewApi = {
    getReviews: (params) => apiClient.get("/review/organizer-list", { params, skipToast: true }),
};

export default reviewApi;
