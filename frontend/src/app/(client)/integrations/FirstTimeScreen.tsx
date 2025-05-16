import React, { FC } from "react";
import { Box, Typography, Link as MuiLink, Button, Grid } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Image from "next/image";
import { DashboardHelpCard } from "@/components/HelpCard";

interface FirstTimeScreenProps {
  onBegin?: () => void;
}

const FirstTimeScreen: FC<FirstTimeScreenProps> = ({ onBegin }) => {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        marginTop: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 5 }}>
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
          Integrations
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
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Connect your favourite tools to automate tasks and ensure all your data
        is accessible in one place
      </Typography>

      <Box
        sx={{
          position: "relative",
          px: 3,
          py: 3,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          borderRadius: 1,
          border: "1px solid #EDEDED",
          overflow: "hidden",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ color: "#151619", fontWeight: 400 }}
        >
          Connect Your Marketing Platforms
        </Typography>

        <Box
          sx={{
            bgcolor: "#E8F0FF",
            borderRadius: 1,
            p: 2,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Image
            src="/integrations-first-time-screen.svg"
            alt="Allsource integrations diagram"
            width={1000}
            height={160}
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </Box>

        <Typography variant="body2" sx={{ color: "#7E7E7E" }}>
          Sync your audience data seamlessly with ad platforms and CRM tools to
          activate campaigns across channels.
        </Typography>

        <Box
          sx={{ display: "flex", width: "100%", justifyContent: "end", pr: 2 }}
        >
          <Button
            variant="contained"
            className="second-sub-title"
            onClick={onBegin}
            sx={{
              backgroundColor: "rgba(56, 152, 252, 1)",
              textTransform: "none",
              padding: "10px 24px",
              color: "#fff !important",
              ":hover": {
                backgroundColor: "rgba(48, 149, 250, 1)",
              },
              ":disabled": {
                backgroundColor: "rgba(56, 152, 252, 0.5)",
              },
            }}
          >
            Begin
          </Button>
        </Box>
      </Box>
      <Grid sx={{ mt: 2, mb: 3, width: "100%" }}>
        <DashboardHelpCard
          headline="Struggling with Integrations?"
          description="Get expert help connecting your platforms in a free 30-minute troubleshooting session."
          helpPoints={[
            {
              title: "Connection Setup",
              description: "Step-by-step integration guidance",
            },
            {
              title: "Error Resolution",
              description: "Fix API/auth issues",
            },
            {
              title: "Data Flow Optimization",
              description: "Ensure seamless sync",
            },
          ]}
        />
      </Grid>
    </Box>
  );
};

export default FirstTimeScreen;
