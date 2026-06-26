import axiosClient from "../auth/api/axiosClient";

const authService = {
  login: async (credentials) => {
    const response = await axiosClient.post("/auth/login", credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await axiosClient.post("/auth/register", userData);
    return response.data;
  },
  
  logout: async () => {
    // If backend requires a logout request:
    // await axiosClient.post("/auth/logout");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  getCurrentUser: async () => {
    const response = await axiosClient.get("/auth/me");
    return response.data;
  }
};

export default authService;
