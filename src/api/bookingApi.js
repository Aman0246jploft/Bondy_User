/**
 * Booking API client
 */
import apiClient from "./apiClient";

const bookingApi = {
    // Initiate a booking (creates a pending transaction)
    initiateBooking: (data) => apiClient.post("/booking/initiate", data),

    // Confirm payment (mock payment gateway)
    confirmPayment: (data) => apiClient.post("/booking/confirm-payment", data),

    // Calculate pricing preview (optional, if needed for dynamic price updates before booking)
    calculateBooking: (data) => apiClient.post("/booking/calculate", data),

    getTicketList: (params) => apiClient.get("/booking/list", { params }),

    getCourseAttendees: (courseId, params) =>
        apiClient.get(`/booking/course/${courseId}/attendees`, { params, skipToast: true }),

    getTicketDetail: (transactionId) =>
        apiClient.get(`/booking/detail/${transactionId}`),

    getShareAndDownloadUrls: (transactionId) =>
        apiClient.get(`/booking/public/generate-urls/${transactionId}`),

    getPublicTicketDetail: (transactionId) =>
        apiClient.get(`/booking/public/detail/${transactionId}`),

    cancelCourse: (data) => apiClient.post("/booking/cancel-course", data),
};

export default bookingApi;
