import apiClient from "./apiClient";

const blockUserApi = {
  blockUser: (data) => apiClient.post("/block/create", data),
  unblockUser: (data) => apiClient.post("/block/delete", data),
};

export default blockUserApi;