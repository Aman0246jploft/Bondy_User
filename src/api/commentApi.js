import apiClient from "./apiClient";

const commentApi = {
    createComment: (data) => apiClient.post("/comment/create", data),
    getComments: (params) => apiClient.get("/comment/list", { params, skipToast: true }),
    getReplies: (params) => apiClient.get("/comment/replies", { params, skipToast: true }),
    updateComment: (commentId, data) => apiClient.post(`/comment/update/${commentId}`, data),
    deleteComment: (commentId) => apiClient.post(`/comment/delete/${commentId}`),
    toggleLike: (commentId) => apiClient.post(`/comment/like/${commentId}`, {}, { skipToast: true }),
};

export default commentApi;
