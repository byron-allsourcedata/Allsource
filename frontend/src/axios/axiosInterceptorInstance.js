"use client";
import axios from "axios";
import { showErrorToast } from "@/components/ToastNotification";

const axiosInterceptorInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});


axiosInterceptorInstance.interceptors.request.use(
  async (config) => { 
    const accessToken = localStorage.getItem("token");
    let currentDomain = sessionStorage.getItem('current_domain');

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      if (!currentDomain) {
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}domains/`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });

          if (response.status === 200 && response.data.length > 0) {
            currentDomain = response.data[0].domain;
            sessionStorage.setItem('current_domain', currentDomain);
          }
        } catch (error) {
          console.error('Error fetching domain:', error);
        }
      }
      if (currentDomain) {
        config.headers.CurrentDomain = currentDomain;
      }
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
          navigateTo.push("/login");
          break;
        case 403:
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
              navigateTo(`${error.response.data.stripe_payment_url}`);
              break;
            case "FORBIDDEN":
              navigateTo(`/dashboard`)
              break
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
      showErrorToast('Unexpected status: Service is not available now, try again or contact with us support@maximiz.ai');
    } else {
      // Something happened in setting up the request that triggered an Error
      showErrorToast(`Error: ${error.message}`);
    }

    return Promise.reject(error);
  }
);

export default axiosInterceptorInstance;
