import axiosClient from "../auth/api/axiosClient";

const eventService = {
  getAllEvents: async () => {
    const response = await axiosClient.get("/api/v1/events");
    return response.data;
  },

  getEventById: async (id) => {
    const response = await axiosClient.get(`/api/v1/event/${id}`);
    return response.data;
  },

  createEvent: async (eventData) => {
    const response = await axiosClient.post("/api/v1/event", eventData);
    return response.data;
  },

  updateEvent: async (id, eventData) => {
    const response = await axiosClient.put(`/api/v1/event/${id}`, eventData);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await axiosClient.delete(`/api/v1/event/${id}`);
    return response.data;
  }
};

export default eventService;
