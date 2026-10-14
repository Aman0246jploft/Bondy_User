import apiClient from "./apiClient";

const promotionsApi = {
    getEventPackages: () => apiClient.get("/event-promotion/packages", { skipToast: true }),
    getCoursePackages: () => apiClient.get("/course-promotion/packages", { skipToast: true }),
    checkoutEventPromotion: (data) => apiClient.post("/event-promotion/checkout", data, { skipToast: true }),
    checkoutCoursePromotion: (data) => apiClient.post("/course-promotion/checkout", data, { skipToast: true }),
};

export default promotionsApi;
