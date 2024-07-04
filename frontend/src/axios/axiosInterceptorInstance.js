import axios from "axios";
import { useRouter} from 'next/navigation';

const axiosInterceptorInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // BASE URL API
});

const Router = useRouter();

// Request interceptor
axiosInterceptorInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("token");

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

const handleAuthorizationStatus = (status) => {
  switch (status) {
    case 'NEED_CHOOSE_PLAN':
      Router.push('/choose-plan');
      break;
    case 'NEED_CONFIRM_EMAIL':
      Router.push('/verificate_email');
      break;
    case 'FILL_COMPANY_DETAILS':
      Router.push('/company_details');
      break;
    default:
      break;
  }
};

// Response interceptor
axiosInterceptorInstance.interceptors.response.use(
  (response) => {
    // Check if the response contains the authorization status
    if (response.data && response.data.status) {
      handleAuthorizationStatus(response.data.status);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 401 error handler (Unauthorized)
          localStorage.clear();
          Router.push('/login');
          break;
        case 500:
          // 500 error handler (Internal Server Error)
          Router.push('/login');
          break;
        // Handle other statuses if needed
        default:
          console.error("An error occurred:", error.response.data);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInterceptorInstance;
