import apiClient from "./apiClient";

const contactApi = {
    createContact: (data) => apiClient.post("/contact/createContact", data),
};

export default contactApi;
