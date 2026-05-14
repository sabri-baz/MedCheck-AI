import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/config'; // Bunu kullanarak baseURL alabiliriz veya direkt axios instance'ı kullanabiliriz.

// baseURL'i config'ten okuyalım
const baseURL = apiClient.defaults.baseURL;

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
