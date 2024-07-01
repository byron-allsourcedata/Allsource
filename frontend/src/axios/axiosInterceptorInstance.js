import axios from "axios";
import { useRouter} from 'next/navigation';

const axiosInterceptorInstance = axios.create({
  baseURL: "http://localhost:8000/", // BASE URL API
});

// Request interceptor
axiosInterceptorInstance.interceptors.request.use(
  (config) => {
    const accessToken = JSON.parse(localStorage.getItem("token"));

    if (accessToken) {
      if (config.headers)
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInterceptorInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 400:
          // Обработка 400 ошибки (Bad Request) и редирект на /login
          console.error("Bad request - redirecting to login.");
          useRouter.push("/login");
          break;
        case 401:
          //401 error handler (Unauthorized)
          console.error("Unauthorized access - perhaps redirect to login.");
          break;
        case 500:
          //500 error handler (Internal Server Error)
          useRouter.push("/login");
          break;
        // TODO: add statuses of other handlers
        default:
          console.error("An error occurred:", error.response.data);
      }
    } else if (error.code === 'ERR_NETWORK') {
        console.error("Network error - redirecting to login.");
        useRouter.push("/login");
      } else {
        console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInterceptorInstance;
