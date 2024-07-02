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
        case 401:
          //401 error handler (Unauthorized)
          localStorage.clear()
          useRouter.push('/login')
          break;
        case 500:
          //500 error handler (Internal Server Error)
          useRouter.push("/login");
          break;
        // TODO: add statuses of other handlers
        default:
          console.error("An error occurred:", error.response.data);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInterceptorInstance;
