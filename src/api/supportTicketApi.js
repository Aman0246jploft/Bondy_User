import apiClient from "./apiClient";

const supportTicketApi = {
    createTicket: (data) =>
        apiClient.post("/supportTicket/create", data),
    getMyTickets: (params) =>
        apiClient.get("/supportTicket/my-tickets", { params }),
    getTicketDetails: (id) => apiClient.get(`/supportTicket/${id}`),
};

export default supportTicketApi;
