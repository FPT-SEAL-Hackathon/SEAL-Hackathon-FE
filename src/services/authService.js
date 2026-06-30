import axiosClient from "../auth/api/axiosClient";
import { REFRESH_KEY, TOKEN_KEY } from "@/lib/api/apiClient";

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
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      await axiosClient.post("/auth/logout", { refreshToken });
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem("seal_user");
  },

  getCurrentUser: async () => {
    const rawUser = localStorage.getItem("seal_user");
    return rawUser ? JSON.parse(rawUser) : null;
  }
};

export default authService;
