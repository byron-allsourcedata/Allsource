"use client";
import axios from "axios";
import { showErrorToast } from "@/components/ToastNotification";

const axiosInterceptorInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

axiosInterceptorInstance.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem("token");
    let currentDomain = sessionStorage.getItem("current_domain");

    if (config.headers) {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        if (!currentDomain) {
          try {
            const response = await axios.get(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}domains/`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );

            if (response.status === 200 && response.data.length > 0) {
              currentDomain = response.data[0].domain;
              sessionStorage.setItem("current_domain", currentDomain);
            }
          } catch (error) {
            console.error("Error fetching domain:", error);
          }
        }
        if (currentDomain) {
          config.headers.CurrentDomain = currentDomain;
        }
      } else{
        config.headers.Authorization = `Bearer`;
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
        case 307:
        case 400:
          break;
        case 401:
          // 401 error handler (Unauthorized)
          localStorage.clear();
          navigateTo("/signin");
          break;
        case 403:
          switch (error.response.data.status) {
            case "DOMAIN_NOT_FOUND":
              navigateTo("/account-setup");
              break;
            case "NEED_BOOK_CALL":
              sessionStorage.setItem("is_slider_opened", "true");
              break;
            case "NEED_CONFIRM_EMAIL":
              navigateTo("/email-verificate");
              break;
            case "PIXEL_INSTALLATION_NEEDED":
              break;
            case "FILL_COMPANY_DETAILS":
              navigateTo("/account-setup");
              break;
            case "TEAM_TOKEN_EXPIRED":
              localStorage.clear();
              sessionStorage.clear();
              navigateTo("/signin");
              break;
            case "NEED_CHOOSE_PLAN":
              navigateTo("/settings?section=subscription");
              break;
            case "PAYMENT_NEEDED":
              navigateTo(`${error.response.data.stripe_payment_url}`);
              break;
            case "FORBIDDEN":
              navigateTo(`/dashboard`);
              break;
          }
          break;
        case 404:
          navigateTo('/not_found')
          break;
        case 500:
          // Handle 500 Internal Server Error
          showErrorToast("Internal Server Error. Please try again later.");
          break;
        // Handle other statuses if needed
        default:
          showErrorToast(
            `An error occurred: ${
              error.response.data.status || "Unknown error"
            }`
          );
      }
    } else if (error.request) {
    } else {
    }

    return Promise.reject(error);
  }
);

export default axiosInterceptorInstance;
