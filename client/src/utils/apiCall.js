import axios from "axios";

// 1) Create axios instance with default config
const http = axios.create({
  baseURL: "",
  timeout: 200000,
  headers: { "Content-Type": "application/json" },
});

// 2) Request interceptor: add common headers or token here
http.interceptors.request.use((config) => {
  // const t = localStorage.getItem("token");
  // if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
  (error) => Promise.reject(error);
});

// 3) Response interceptor: normalize error handling
http.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg =
      error?.response?.data?.error || error.message || "Network Error";
    return Promise.reject(new Error(msg));
  }
);

// 4) Helper methods
export async function apiGet(url, headers = {}) {
  const res = await http.get(url, { headers });
  return res.data;
}

export async function apiPost(url, headers = {}) {
  const res = await http.post(url, data, { headers });
  return res.data;
}

export default http;
