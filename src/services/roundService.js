import axiosClient from "../auth/api/axiosClient";

const roundService = {
  getAllRounds: async (eventId) => {
    const response = await axiosClient.get(`/events/${eventId}/rounds`);
    return response.data;
  },

  getRoundById: async (id) => {
    const response = await axiosClient.get(`/rounds/${id}`);
    return response.data;
  },

  createRound: async (eventId, roundData) => {
    const response = await axiosClient.post(`/events/${eventId}/rounds`, roundData);
    return response.data;
  },

  updateRound: async (id, roundData) => {
    const response = await axiosClient.put(`/rounds/${id}`, roundData);
    return response.data;
  },

  deleteRound: async (id) => {
    const response = await axiosClient.delete(`/rounds/${id}`);
    return response.data;
  }
};

export default roundService;
