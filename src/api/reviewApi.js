import apiClient from "./apiClient";

const reviewApi = {
    getReviews: (params) => apiClient.get("/review/organizer-list", { params, skipToast: true }),
    getUserReviews: (params) => apiClient.get("/review/user-list", { params, skipToast: true }),
    addReview: (data) => apiClient.post("/review/add", data),
    updateReview: (reviewId, data) => apiClient.post(`/review/update/${reviewId}`, data),
};


export default reviewApi;
