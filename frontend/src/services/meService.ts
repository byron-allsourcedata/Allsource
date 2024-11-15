import axiosInterceptorInstance from '../axios/axiosInterceptorInstance';
import axiosInstance from '../axios/axiosInterceptorInstance'
import axios from "axios";
export const fetchUserData = async () => {
  try {
    const accessToken = localStorage.getItem("token");
    let currentDomain = sessionStorage.getItem('current_domain');
    if (accessToken) {
      if (!currentDomain) {
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}domains/`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });

          if (response.status === 200 && response.data.length > 0) {
            currentDomain = response.data[0].domain;
            sessionStorage.setItem('current_domain', currentDomain || '');
          }
        } catch (error) {
          console.error('Error fetching domain:', error);
          return null;
        }
      }
      if (currentDomain) {
        const response = await axiosInterceptorInstance.get('/me', { headers: { CurrentDomain: currentDomain } });
        const responseData = response.data;

        if (responseData.user_info && responseData.user_plan) {
          const userInfo = responseData.user_info;
          const userPlan = responseData.user_plan;
          const domains = responseData.user_domains;
          sessionStorage.setItem('me', JSON.stringify({
            email: userInfo.email,
            full_name: userInfo.full_name,
            company_website: userInfo.company_website,
            trial: userPlan.is_trial,
            plan_end: userPlan.plan_end,
            percent_steps: userInfo.activate_percent,
            is_trial_pending: userPlan.is_trial_pending,
            domains: domains
          }));

          return {
            email: userInfo.email,
            full_name: userInfo.full_name,
            company_website: userInfo.company_website,
            trial: userPlan.is_trial,
            days_left: userPlan.plan_end,
            percent_steps: userInfo.percent_steps,
            is_trial_pending: userPlan.is_trial_pending
          };
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
};
