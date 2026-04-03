import apiClient from "./apiClient";

const stayUpdatedApi = {
    signup: (data) => apiClient.post("/stayUpdated/signup", data),
};

export default stayUpdatedApi;
