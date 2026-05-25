import axios from 'axios';
import Constants from 'expo-constants';

let LOCAL_IP = '10.0.2.2'; // Fallback Android Emulator IP
let baseURL = process.env.EXPO_PUBLIC_API_URL;

// Eğer geliştirme ortamındaysak (Dev) ve Expo'dan IP okuyabiliyorsak:
// Kesin olarak doğru olan bu IP'yi kullan (eski/hatalı .env ayarını ez)
if (__DEV__ && Constants.expoConfig?.hostUri) {
  LOCAL_IP = Constants.expoConfig.hostUri.split(':')[0];
  baseURL = `http://${LOCAL_IP}:5000/api`;
} else if (!baseURL) {
  baseURL = `http://${LOCAL_IP}:5000/api`;
}

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
