import axiosClient from "../auth/api/axiosClient";

const roundService = {
  getAllRounds: async (eventId) => {
    const response = await axiosClient.get(`/api/v1/rounds/${eventId}`);
    return response.data;
  },

  getRoundById: async (id) => {
    const response = await axiosClient.get(`/api/v1/round/${id}`);
    return response.data;
  },

  createRound: async (categoryId, roundData) => {
    const response = await axiosClient.post(`/api/v1/round/${categoryId}`, roundData);
    return response.data;
  },

  updateRound: async (id, roundData) => {
    const response = await axiosClient.put(`/api/v1/round/${id}`, roundData);
    return response.data;
  },

  deleteRound: async (id) => {
    const response = await axiosClient.delete(`/api/v1/round/${id}`);
    return response.data;
  }
};

export default roundService;
