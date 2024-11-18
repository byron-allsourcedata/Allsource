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
      }
    }
    return null; 
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
};
