import axios from "axios";
import { showErrorToast } from "@/components/ToastNotification";
import Router from "next/router";

const axiosInterceptorInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // BASE URL API
});

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

const navigateTo = (path) => {
  window.location.href = path;
};

// Response interceptor
axiosInterceptorInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 401 error handler (Unauthorized)
          localStorage.clear();
          Router.push("/login");
          break;
        case 403:
          console.log(error.response.data)
          console.log(error.response.data.status)
          switch (error.response.data.status) {
            case "NEED_CONFIRM_EMAIL":
              navigateTo("/email-verificate");
              break;
            case "FILL_COMPANY_DETAILS":
              navigateTo("/account-setup");
              break;
            case "NEED_CHOOSE_PLAN":
              navigateTo("/choose-plan");
              break;
            case "PAYMENT_NEEDED":
              console.log('1')
              navigateTo(`${error.response.data.stripe_payment_url}`);
              break;
          }
          break;
        case 500:
          // Handle 500 Internal Server Error
          showErrorToast("Internal Server Error. Please try again later.");
          break;
        // Handle other statuses if needed
        default:
          showErrorToast(
            `An error occurred: ${
              error.response.data.message || "Unknown error"
            }`
          );
      }
    } else if (error.request) {
      // The request was made but no response was received
      showErrorToast("Network Error. Please check your internet connection.");
    } else {
      // Something happened in setting up the request that triggered an Error
      showErrorToast(`Error: ${error.message}`);
    }

    return Promise.reject(error);
  }
);

export default axiosInterceptorInstance;
