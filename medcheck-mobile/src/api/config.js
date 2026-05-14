import axios from 'axios';

// LOCAL_IP değerini kendi bilgisayarınızın IP adresiyle değiştirin.
// Örn: '192.168.1.100' veya Android Emülatör için '10.0.2.2'
const LOCAL_IP = '10.0.2.2'; 

const baseURL = process.env.EXPO_PUBLIC_API_URL || `http://${LOCAL_IP}:5000/api`;

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
