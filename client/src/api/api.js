import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
});

// ✅ Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Only logout if token is truly invalid - NOT on every 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.error;

    console.log("API ERROR:", status, message);

    // ✅ Only logout on explicit invalid/expired token
    if (
      status === 401 &&
      (message === "Invalid token" || message === "Token expired")
    ) {
      localStorage.clear();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);