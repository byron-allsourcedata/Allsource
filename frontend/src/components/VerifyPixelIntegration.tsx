"use client";
import { Box, Typography, Button } from "@mui/material";
import React, { useState, useEffect } from "react";

type VerifyPixelIntegrationProps = {
  domain: string;
};

const VerifyPixelIntegration: React.FC<VerifyPixelIntegrationProps> = ({
  domain,
}) => {
  const [inputValue, setInputValue] = useState<string>("");

  const apiUrl = process.env.NEXT_PUBLIC_API_DOMAIN;

  useEffect(() => {
    if (domain) {
      setInputValue(domain);
    } else {
      const storedValue = sessionStorage.getItem("current_domain");
      if (storedValue !== null) {
        setInputValue(storedValue);
      }
    }
  }, [domain]);

  const handleButtonClick = () => {
    let url = inputValue.trim();

    if (url) {
      if (!/^https?:\/\//i.test(url)) {
        url = "http://" + url;
      }

      const hasQuery = url.includes("?");
      const newUrl =
        url + (hasQuery ? "&" : "?") + "mff=true" + `&api=${apiUrl}`;
      window.open(newUrl, "_blank");
    }
  };

  return (
    <Box
      sx={{
        padding: "1rem",
        border: "1px solid #e4e4e4",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "rgba(255, 255, 255, 1)",
        boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.08)",
        marginBottom: "2rem",
        "@media (max-width: 900px)": {
          marginBottom: "1.5rem",
          padding: "1rem",
        },
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
          color: "#1c1c1c",
          fontSize: "16px",
          marginBottom: "1.5rem",
          "@media (max-width: 900px)": {
            fontSize: "16px",
            lineHeight: "normal",
            marginBottom: "24px",
          },
        }}
      >
        3. Verify pixel integration on your website
      </Typography>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="end"
        sx={{
          "@media (max-width: 600px)": {
            alignItems: "flex-start",
            gap: "16px",
            flexDirection: "column",
          },
        }}
      >
        <Button
          onClick={handleButtonClick}
          sx={{
            textTransform: "none",
            background: "rgba(56, 152, 252, 1)",
            color: "#fff",
            fontFamily: "Nunito Sans",
            fontWeight: 400,
            fontSize: "14px",
            padding: "0.75em 1.5em",
            lineHeight: "normal",
            "@media (max-width: 600px)": {
              padding: "0.625rem 1.5rem",
              marginLeft: 0,
              fontSize: "16px",
            },
            "&:hover": {
              backgroundColor: "rgba(56, 152, 252, 1)",
              boxShadow: 2,
            },
          }}
        >
          Verify
        </Button>
      </Box>
    </Box>
  );
};

export default VerifyPixelIntegration;
