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

    getTicketList: (params) => apiClient.get("/booking/ticket/list", { params }),

    getTicketDetail: (transactionId) =>
        apiClient.get(`/booking/ticket/${transactionId}`),
};

export default bookingApi;
