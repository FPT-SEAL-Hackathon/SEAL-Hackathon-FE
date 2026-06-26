import axiosClient from "../auth/api/axiosClient";

const eventService = {
  getAllEvents: async () => {
    const response = await axiosClient.get("/events");
    return response.data;
  },

  getEventById: async (id) => {
    const response = await axiosClient.get(`/events/${id}`);
    return response.data;
  },

  createEvent: async (eventData) => {
    const response = await axiosClient.post("/events", eventData);
    return response.data;
  },

  updateEvent: async (id, eventData) => {
    const response = await axiosClient.put(`/events/${id}`, eventData);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await axiosClient.delete(`/events/${id}`);
    return response.data;
  }
};

export default eventService;
