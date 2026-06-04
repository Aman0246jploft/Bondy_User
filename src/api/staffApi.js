import apiClient from "./apiClient";

const staffApi = {
    addStaff: (data) => apiClient.post("/user/organizer/staff/add", data),
    listStaff: () => apiClient.get("/user/organizer/staff/list"),
    assignStaffToEvent: (data) => apiClient.post("/event/assign-staff", data),
    assignStaffToCourse: (data) => apiClient.post("/course/assign-staff", data),
    loginStaff: (data) => apiClient.post("/user/staff/login", data),
    getAssigned: () => apiClient.get("/user/staff/assigned"),
    getScanHistory: () => apiClient.get("/user/staff/scan-history"),
    getEventAttendees: (eventId, params) => apiClient.get(`/attendee/event/${eventId}`, { params, skipToast: true }),
    checkInAttendee: (data) => apiClient.post("/attendee/check-in", data),
    scanQR: (data) => apiClient.post("/attendee/scan-qr", data),
    getTicketDetails: (ticketNumber) => apiClient.get(`/attendee/ticket/${ticketNumber}`),
};

export default staffApi;
