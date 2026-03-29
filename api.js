import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const api  = axios.create({ baseURL: BASE, timeout: 30000 });

export const predictDisease = (imageFile) => {
  const form = new FormData();
  form.append("image", imageFile);
  return api.post("/predict-disease", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const predictYield = (payload) => api.post("/predict-yield", payload);

export const fetchWeather = (lat, lon) =>
  api.get("/weather", { params: { lat, lon } });

export const fetchRecommendations = (payload) =>
  api.post("/recommendations", payload);

export default api;
