import React from "react";
import FirstTimeCards from "../../components/FirstTimeCards";
import { Box, Typography, Link as MuiLink, Grid } from "@mui/material";
import { ExternalLink } from "@/components/ExternalLink";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { DashboardHelpCard } from "@/components/first-time-screens/HelpCard";

type CardData = {
  title: string;
  description: string;
  icon: string;
  onClick?: () => void;
  isClickable?: boolean;
};

interface ClickableCardsProps {
  cardData: CardData[];
}

const FirstTimeScreen = ({ cardData }: ClickableCardsProps) => {
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
          Import Your First Source
        </Typography>
        <MuiLink
          href="https://allsourceio.zohodesk.com/portal/en/kb/articles/sources"
          underline="hover"
          target="_blank"
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
        To begin building your audience, you&apos;ll first need to provide a
        data source. Create a source based on one of this types:
      </Typography>

      <Box
        sx={{
          width: "100%",
        }}
      >
        <FirstTimeCards cardData={cardData} />
      </Box>

      <Grid sx={{ mt: 3, width: "100%" }}>
        <DashboardHelpCard
          headline="Need Help with Your Source?"
          description="Book a free 30-minute call to optimize your source settings, troubleshoot issues, or boost performance."
          helpPoints={[
            {
              title: "Source Setup Review",
              description: "Ensure correct configuration",
            },
            {
              title: "Performance Audit",
              description: "Diagnose and improve results",
            },
            {
              title: "Advanced Strategies",
              description: "Unlock hidden potential",
            },
          ]}
        />
      </Grid>
    </Box>
  );
};

export default FirstTimeScreen;
