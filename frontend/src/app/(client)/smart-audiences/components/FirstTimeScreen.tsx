import React from "react";
import FirstTimeCards from "../../components/FirstTimeCards";
import { Box, Typography, Button } from "@mui/material";
import { ExternalLink } from "@/components/ExternalLink";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import { useState } from "react";
import { useRouter } from 'next/navigation';

type CardData = {
  title: string;
  description: string;
  icon: string;
  onClick?: () => void;
  isClickable?: boolean;
};

interface ClickableCardsProps {
  cardData: CardData[];
  hasSource: boolean
}

const FirstTimeScreen = ({ cardData, hasSource }: ClickableCardsProps) => {
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(!hasSource);
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
      textAlign: "center",
      flex: 1,
      "& img": {
        width: "auto",
        height: "auto",
        maxWidth: "100%",
      },
    }}
  >
    {showNotification && (
      <Box
        sx={{
          border: "1px solid rgba(224, 49, 48, 1)",
          display: "flex",
          flexDirection: "row",
          width: "100%",
          padding: 2,
          borderRadius: "4px",
          mb: 3,
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            gap: 2,
            alignItems: "center",
          }}
        >
          <ReportProblemOutlinedIcon
            sx={{ fontSize: "20px", color: "rgba(230, 90, 89, 1)" }}
          />
          <Typography className="second-sub-title">
          You need to import at least one source to generate smart audience
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            gap: 2,
            alignItems: "center",
            justifyContent: "end",
          }}
        >
          <Button
            sx={{
              textTransform: "none",
              fontFamily: "Nunito Sans",
              fontSize: "14px",
              fontWeight: 500,
              color: "rgba(224, 49, 48, 1) !important",
            }}
            onClick={() => {
              setShowNotification(false);
            }}
          >
            Dismiss
          </Button>
          <Button
            onClick={() => {
              router.push("/sources");
            }}
            sx={{
              textTransform: "none",
              fontFamily: "Nunito Sans",
              fontSize: "14px",
              fontWeight: 500,
              color: "rgba(255, 255, 255, 1) !important",
              backgroundColor: "rgba(224, 49, 48, 1)",
              "&:hover": {
                backgroundColor: "rgba(224, 49, 48, 0.85)",
              },
            }}
          >
            Create Source
          </Button>
        </Box>
      </Box>
    )}
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
        Generate Smart Audience
      </Typography>
      <ExternalLink href="https://example.com">
        Learn more
      </ExternalLink>
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
      Combine your existing sources and lookalikes to create a dynamic, high-performing smart audience
    </Typography>

    <Box
      sx={{
        border: "1px solid rgba(237, 237, 237, 1)",
        width: "100%",
        mt: 3,
        padding: 3,
        pt: 0,
        borderRadius: "6px",
      }}
    >
      <Box
        sx={{
          textAlign: "left",
        }}
      >
        <FirstTimeCards cardData={cardData} />
      </Box>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          justifyContent: "end",
          pr: 2,
        }}
      >
        <Button
          variant="contained"
          className="second-sub-title"
          disabled={!hasSource}
          onClick={() => {
            router.push("/smart-audiences/builder");
          }}
          sx={{
            backgroundColor: "rgba(56, 152, 252, 1)",
            textTransform: "none",
            padding: "10px 24px",
            color: "#fff !important",
            ":hover": {
              backgroundColor: "rgba(48, 149, 250, 1)",
            },
          }}
        >
          Begin
        </Button>
      </Box>
    </Box>
  </Box>
  );
};

export default FirstTimeScreen;
