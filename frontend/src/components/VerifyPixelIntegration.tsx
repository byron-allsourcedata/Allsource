"use client";
import { Box, Typography, Button } from "@mui/material";
import React, { useState, useEffect } from "react";
import axiosInstance from "../axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from '@/components/ToastNotification';

const VerifyPixelIntegration: React.FC = () => {

    const [inputValue, setInputValue] = useState<string>("");
  
    useEffect(() => {
      const storedValue = sessionStorage.getItem('current_domain');
      if (storedValue !== null) {
        setInputValue(storedValue);
      }
    }, []);
  
  
    const handleButtonClick = () => {
      let url = inputValue.trim();
  
      if (url) {
        if (!/^https?:\/\//i.test(url)) {
          url = "http://" + url;
        }
   
        const hasQuery = url.includes("?");
        const newUrl = url + (hasQuery ? "&" : "?") + "vge=true" + "&api=https://api-dev.maximiz.ai";
        window.open(newUrl, "_blank");
      }
    };
  
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.target.value);
    };
  
    return (
      <Box
        sx={{
          padding: "1rem",
          border: "1px solid #e4e4e4",
          borderRadius: "8px",
          overflow: 'hidden',
          backgroundColor: "rgba(247, 247, 247, 1)",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
          marginBottom: "2rem",
          '@media (max-width: 900px)': {
            marginBottom: "1.5rem",
            padding: '1rem'
          }
        }}
      >
        <Typography
          variant="h6"
          component="div"
          mb={2}
          className="first-sub-title"
          sx={{
            fontFamily: "Nunito Sans",
            fontWeight: "700",
            lineHeight: "normal",
            textAlign: "left",
            color: '#1c1c1c',
            fontSize: '16px',
            marginBottom: '1.5rem',
            '@media (max-width: 900px)': {
              fontSize: '16px',
              lineHeight: 'normal',
              marginBottom: '24px'
            }
          }}
        >
          2. Verify pixel integration on your website
        </Typography>
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{
          '@media (max-width: 600px)': {
            alignItems: 'flex-start',
            gap: '16px',
            flexDirection: 'column'
          }
        }}>
          <input
            id="urlInput"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            disabled={true}
            placeholder="https://yourdomain.com"
            style={{
              padding: "0.5rem 3em 0.5em 1em",
              width: "50%",
              border: "1px solid #e4e4e4",
              borderRadius: "4px",
              fontFamily: "Roboto",
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: "22.4px",
              textAlign: "left"
            }}
          />
          <Button
            onClick={handleButtonClick}
            sx={{
              ml: 2,
              border: "1px solid rgba(80, 82, 178, 1)",
              textTransform: "none",
              background: "#fff",
              color: "rgba(80, 82, 178, 1)",
              fontFamily: "Nunito Sans",
              fontWeight: 600,
              fontSize: '14px',
              padding: "0.75em 1.5em",
              lineHeight: 'normal',
              '@media (max-width: 600px)': {
                padding: '0.625rem 1.5rem',
                marginLeft: 0,
                fontSize: '16px'
          }
            }}
          >
            Test
          </Button>
        </Box>
      </Box>
    );
  };

export default VerifyPixelIntegration