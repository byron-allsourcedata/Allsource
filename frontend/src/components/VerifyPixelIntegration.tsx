"use client";
import { Box, Typography, Button, BoxClassKey } from "@mui/material";
import React, { useState, useEffect } from "react";
import { useHints } from "@/context/HintsContext";
import HintCard from "@/app/(client)/components/HintCard";

type VerifyPixelIntegrationProps = {
  domain: string;
  showHint: boolean;
};
interface HintCardInterface {
  description: string;
  title: string;
  linkToLoadMore: string;
}

const VerifyPixelIntegration: React.FC<VerifyPixelIntegrationProps> = ({
  domain,
  showHint,
}) => {
  const { changePixelSetupHint, pixelSetupHints, resetPixelSetupHints } =
    useHints();
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
        url + (hasQuery ? "&" : "?") + "mff=true" + `&api=${apiUrl}` + `&domain_url=${process.env.NEXT_PUBLIC_API_DASHBOARD_URL}`;
      window.open(newUrl, "_blank");
    }
  };

  const hintCards: HintCardInterface[] = [
    {
      description:
        "Click to add your website domain. After entering the domain, you’ll be able to install the tracking pixel.",
      title: "Verify Pixel",
      linkToLoadMore:
        "https://allsourceio.zohodesk.com/portal/en/kb/articles/verify-pixel",
    },
  ];

  return (
    <Box
      sx={{
        padding: "1rem",
        border: "1px solid #e4e4e4",
        borderRadius: "8px",
        zIndex: 100,
        position: "relative",
        backgroundColor: "rgba(255, 255, 255, 1)",
        boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.08)",
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
        position="relative"
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
        {pixelSetupHints[3].show && showHint && (
          <HintCard
            card={hintCards[0]}
            positionLeft={710}
            positionTop={-20}
            isOpenBody={pixelSetupHints[3].showBody}
            toggleClick={() => changePixelSetupHint(3, "showBody", "toggle")}
            closeClick={() => changePixelSetupHint(3, "showBody", "close")}
          />
        )}
      </Box>
    </Box>
  );
};

export default VerifyPixelIntegration;
