import React, { useState } from "react";
import FirstTimeCards from "../components/FirstTimeCards";
import { Box, Typography, Link as MuiLink, Grid } from "@mui/material";
import WelcomePopup from "@/components/CreatePixelSourcePopup";
import { ExternalLink } from "@/components/ExternalLink";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { DashboardHelpCard } from "@/components/HelpCard";

type CardData = {
  title: string;
  description: string;
  icon: string;
  onClick?: () => void;
  isClickable?: boolean;
};

const FirstTimeScreen = () => {
  const [popupOpen, setPopupOpen] = useState(false);

  const handleOpenPopup = () => {
    setPopupOpen(true);
  };

  const cardData: CardData[] = [
    {
      title: "Sources Insights",
      description:
        "Analyze your audience sources to identify high-performing segments and optimize targeting strategies.",
      icon: "/source.svg",
      isClickable: true,
      onClick: handleOpenPopup,
    },
    {
      title: "Lookalikes Insights",
      description:
        "View the aggregated profile of your generated lookalike audience, showing different insights characteristics.",
      icon: "/lookalike.svg",
      isClickable: true,
      onClick: handleOpenPopup,
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "start",
        borderRadius: 2,
        pr: 1,
        boxSizing: "border-box",
        width: "100%",
        flex: 1,
        "& img": {
          width: "auto",
          height: "auto",
          maxWidth: "100%",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Typography
          variant="h5"
          className="first-sub-title"
          sx={{
            fontFamily: "Nunito Sans",
            fontSize: "24px !important",
            color: "#4a4a4a",
            fontWeight: "500 !important",
            lineHeight: "22px",
          }}
        >
          Insights
        </Typography>
        <MuiLink
          href="https://example.com"
          underline="hover"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            fontWeight: 300,
            color: "#3898FC",
          }}
        >
          Learn more <OpenInNewIcon sx={{ fontSize: 14 }} />
        </MuiLink>
      </Box>
      <Typography
        variant="body1"
        sx={{
          mt: 1,
          fontFamily: "Nunito Sans",
          fontSize: "14px",
          color: "rgba(50, 54, 62, 1)",
          fontWeight: "400",
          lineHeight: "22px",
        }}
      >
        Uncover key statistics, trends, and actionable data—it will help you
        refine your targeting and maximize results
      </Typography>

      <Box
        sx={{
          width: "100%",
        }}
      >
        <FirstTimeCards cardData={cardData} />
      </Box>
      <Grid sx={{ mt: 0, mb: 3, width: "100%" }}>
        <DashboardHelpCard
          headline="Feeling Overwhelmed by Analytics?"
          description="Get a free 30-minute session to analyze your audience data and improve targeting."
          helpPoints={[
            {
              title: "Audience Profile Review",
              description: "Understand demographics & interests",
            },
            {
              title: "Behavior Analysis",
              description: " Interpret engagement patterns",
            },
            {
              title: "Targeting Recommendations",
              description: "Optimize based on your data",
            },
          ]}
        />
      </Grid>
      {popupOpen && (
        <WelcomePopup open={popupOpen} onClose={() => setPopupOpen(false)} />
      )}
    </Box>
  );
};

export default FirstTimeScreen;
