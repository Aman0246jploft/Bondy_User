import apiClient from "./apiClient";

const blockUserApi = {
  blockUser: (data, config) => apiClient.post("/block/create", data, config),
  unblockUser: (data, config) => apiClient.post("/block/delete", data, config),
  getBlockedUsers: (params) => apiClient.get("/block/list", { params }),
};

export default blockUserApi;