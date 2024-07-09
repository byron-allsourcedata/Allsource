import axios from "axios";

const axiosInterceptorInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // BASE URL API
});

// Request interceptor
axiosInterceptorInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("token");

    if (accessToken) {
      if (config.headers) config.headers.Authorization = `Bearer ${accessToken}`;
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
    if (response.data && response.data.status) {
      switch (response.data.status) {
        case 'NEED_CHOOSE_PLAN':
          navigateTo('/choose-plan');
          break;
        case 'NEED_CONFIRM_EMAIL':
          navigateTo('/email_verificate');
          break;
        case 'FILL_COMPANY_DETAILS':
          navigateTo('/company_details');
          break;
        default:
          break;
      }
    }
    return response;
  },
  (error) => {
    if (error.response) {
      console.log(error)
      switch (error.response.status) {
        case 401:
          // 401 error handler (Unauthorized)
          localStorage.clear();
          Router.push('/login');
          break;
      case 403: 
          switch(error.response.data.status){
            case "NEED_CONFIRM_EMAIL":
              navigateTo('/email-verificate');
              break;
            case "FILL_COMPANY_DETAILS":
              navigateTo('/account-setup');
              break;
            case "NEED_CHOOSE_PLAN":
              navigateTo('/choose-plan');
              break;
          }
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
