import apiClient from "./apiClient";

const staffApi = {
    addStaff: (data) => apiClient.post("/user/organizer/staff/add", data),
    editStaff: (staffId, data) => apiClient.post(`/user/organizer/staff/edit/${staffId}`, data),
    removeStaff: (staffId) => apiClient.post(`/user/organizer/staff/remove/${staffId}`),
    listStaff: () => apiClient.get("/user/organizer/staff/list"),
    assignStaffToEvent: (data) => apiClient.post("/event/assign-staff", data),
    assignStaffToCourse: (data) => apiClient.post("/course/assign-staff", data),
    loginStaff: (data) => apiClient.post("/user/staff/login", data),
    forgotPasswordInit: (data) => apiClient.post("/user/staff/forgot-password/init", data),
    forgotPasswordVerify: (data) => apiClient.post("/user/staff/forgot-password/verify", data),
    forgotPasswordResend: (data) => apiClient.post("/user/staff/forgot-password/resend", data),
    resetPassword: (data) => apiClient.post("/user/staff/reset-password", data),
    changePassword: (data) => apiClient.post("/user/change-password", data),
    getAssigned: () => apiClient.get("/user/staff/assigned"),
    getScanHistory: () => apiClient.get("/user/staff/scan-history"),
    getEventAttendees: (eventId, params) => apiClient.get(`/attendee/event/${eventId}`, { params, skipToast: true }),
    getEventBookingAttendees: (eventId, params) => apiClient.get(`/booking/event/${eventId}/attendees`, { params, skipToast: true }),
    getCourseBookingAttendees: (courseId, params) => apiClient.get(`/booking/course/${courseId}/attendees`, { params, skipToast: true }),
    checkInAttendee: (data) => apiClient.post("/attendee/check-in", data),
    scanQR: (data) => apiClient.post("/attendee/scan-qr", data),
    getTicketDetails: (ticketNumber) => apiClient.get(`/attendee/ticket/${ticketNumber}`),
    verifyTicket: (data) => apiClient.post("/attendee/verify", data),
};

export default staffApi;
