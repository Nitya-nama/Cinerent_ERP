import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // logout ONLY if token invalid
    if (status === 401 && error.response?.data?.error === "Invalid token") {
      localStorage.clear();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);
