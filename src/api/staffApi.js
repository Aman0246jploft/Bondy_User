import apiClient from "./apiClient";

const staffApi = {
    addStaff: (data) => apiClient.post("/user/organizer/staff/add", data),
    listStaff: () => apiClient.get("/user/organizer/staff/list"),
    assignStaffToEvent: (data) => apiClient.post("/event/assign-staff", data),
    assignStaffToCourse: (data) => apiClient.post("/course/assign-staff", data),
};

export default staffApi;
