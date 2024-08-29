import React from 'react';
import FacebookLogin from 'react-facebook-login';
import axiosInstance from '../axios/axiosInterceptorInstance';


const FacebookLoginForm = (props: any) => {
    const appID = process.env.FACEBOOK_APP_ID;

    // if (!appID) {
    //     throw new Error("FACEBOOK_APP_ID is not defined");
    // }

    const handleFacebookCallback = (response: any) => {
        if (response?.status === "unknown") {
            console.error('Извините!', 'Что-то пошло не так с входом через Facebook.');
            return;
        }
    const fectchData = async (facebook_access_token: string, data_access_expiration_time: number) => {
        const access_token = localStorage.getItem('token')
        response = await axiosInstance.post('/integrations/', {
            headers: {
                Authorization: `Bearer ${access_token}`
            },
            body: {
                'facebook': {
                    'access_token': facebook_access_token,
                    'data_access_expiration_time': data_access_expiration_time
                }
            }
        })
    }
    fectchData(response.accessToken, response.data_access_expiration_time)
    };

  return (
    <div>
      <FacebookLogin
        appId={appID}
        autoLoad={false}
        callback={handleFacebookCallback}
      />
    </div>
  );
};

export default FacebookLoginForm;
