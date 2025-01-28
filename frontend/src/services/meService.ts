import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';


export const fetchUserData = async () => {
  try {
    const accessToken = localStorage.getItem("token");  
    const currentDomain = sessionStorage.getItem('current_domain');
    if (accessToken) {
      const response = await axiosInterceptorInstance.get('/me', { headers: { CurrentDomain: currentDomain ? currentDomain : null} });
      const responseData = response.data;

  
      if (responseData.user_info && responseData.user_plan) {
        const userInfo = responseData.user_info;
        const userPlan = responseData.user_plan;
        const userDomains = responseData.user_domains;

        const currentDomainInfo = userDomains.find((domain: { domain: string | null; }) => domain.domain === currentDomain);
        const percentSteps = currentDomainInfo ? currentDomainInfo.activate_percent : null;

        sessionStorage.setItem('me', JSON.stringify({
          email: userInfo.email,
          full_name: userInfo.full_name,
          partner: userInfo.is_partner,
          business_type: userInfo.business_type,
          source_platform: userInfo.source_platform || '',
          company_website: userInfo.company_website || '',
          trial: userPlan.is_trial,
          plan_end: userPlan.plan_end,
          activate_percent: percentSteps ? percentSteps : null,
          is_trial_pending: userPlan.is_trial_pending,
          domains: responseData.user_domains,
          price: userPlan.price,
          currency: userPlan.currency,
        }));

        if (!currentDomain){
          sessionStorage.setItem('current_domain', responseData.user_domains[0].domain)
        }
        
        return {
          email: userInfo.email,
          full_name: userInfo.full_name,
          partner: userInfo.is_partner,
          source_platform: userInfo.source_platform,
          company_website: userInfo.company_website,
          trial: userPlan.is_trial,
          days_left: userPlan.plan_end,
          activate_percent: percentSteps ? percentSteps : null,
          is_trial_pending: userPlan.is_trial_pending,
          domains: responseData.user_domains,
          price: userPlan.price,
          currency: userPlan.currency
        };
      }
    }
    return null;
  }
  catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
};
