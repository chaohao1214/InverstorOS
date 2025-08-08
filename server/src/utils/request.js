import axios from "axios";

const defaultHeaders = {
  "Content-Type": "application/json",
};

export async function axiosPost(url, data = {}, customHeaders = {}) {
  try {
    const headers = { ...defaultHeaders, ...customHeaders };
    const res = await axios.post(url, data, { headers });
    return res.data;
  } catch (err) {
    console.error("[axiosPost error]", err.response?.data || err.message);
    throw err;
  }
}

export async function axiosGet(url, customHeaders = {}) {
  try {
    const headers = { ...defaultHeaders, ...customHeaders };
    const res = await axios.get(url, { headers });
    return res.data;
  } catch (err) {
    console.error("[axiosGet error]", err.response?.data || err.message);
    throw err;
  }
}
