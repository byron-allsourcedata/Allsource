import axiosInterceptorInstance from '../axios/axiosInterceptorInstance';

export const fetchUserData = async () => {
  try {
    const response = await axiosInterceptorInstance.get('/me');
    const responseData = response.data;


    if (responseData.user_info && responseData.user_plan) {
      const userInfo = responseData.user_info;
      const userPlan = responseData.user_plan;

      sessionStorage.setItem('me', JSON.stringify({
        email: userInfo.email,
        full_name: userInfo.full_name,
        company_website: userInfo.company_website,
        trial: userPlan.is_trial,
        plan_end: userPlan.plan_end,
        percent_steps: userInfo.activate_percent
      }));

      return {
        email: userInfo.email,
        full_name: userInfo.full_name,
        company_website: userInfo.company_website,
        trial: userPlan.is_trial,
        days_left: userPlan.plan_end
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
};
