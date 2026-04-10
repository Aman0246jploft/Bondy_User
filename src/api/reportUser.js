import apiClient from "./apiClient";

const reportUserApi = {
  reportUser: (data) => apiClient.post("/report/create", data),
};

export default reportUserApi;