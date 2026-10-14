import apiClient from "./apiClient";

const supportTicketApi = {
    createTicket: (data) =>
        apiClient.post("/supportTicket/create", data, { skipToast: true }),
    getMyTickets: (params) =>
        apiClient.get("/supportTicket/my-tickets", { params, skipToast: true }),
    getTicketDetails: (id) =>
        apiClient.get(`/supportTicket/${id}`, { skipToast: true }),
    updateStatus: (id, status) =>
        apiClient.post(`/supportTicket/update/${id}`, { status }, { skipToast: true }),
};

export default supportTicketApi;
