import apiClient from "./apiClient";

const reportUserApi = {
  reportUser: (data, config) => apiClient.post("/report/create", data, config),
};

export default reportUserApi;