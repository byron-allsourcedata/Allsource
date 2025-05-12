import React from "react";
import FirstTimeCards from "../../components/FirstTimeCards";
import { Box, Typography, Button, Link as MuiLink, } from "@mui/material";
import { ExternalLink } from "@/components/ExternalLink";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import NotificationBanner from "@/components/NotificationBanner";
import WelcomePopup from "@/components/CreatePixelSourcePopup";
import { getInteractiveSx } from "@/components/utils";

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
  hasPixel: boolean
}

const FirstTimeScreen = ({ cardData, hasSource, hasPixel }: ClickableCardsProps) => {
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(!hasSource);
  const [popupOpen, setPopupOpen] = useState(false);
    
    const handleOpenPopup = () => {
      setPopupOpen(true);
    };
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
        <NotificationBanner
          ctaUrl="/sources"
          ctaLabel="Create Source"
          message="You need to import at least one source to generate smart audience"
        />
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
        <MuiLink
          href="https://example.com"
          underline="hover"
          sx={{ display: "flex", alignItems: "center", gap: 0.5, fontWeight: 300, color: "#3898FC" }}
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
        Combine your existing sources and lookalikes to create a dynamic, high-performing smart audience
      </Typography>

      <Box
        onClick={handleOpenPopup}
        sx={{
          width: "100%",
          mt: 3,
          padding: 3,
          pt: 0,
          borderRadius: "6px",
          border: "1px solid rgba(237, 237, 237, 1)",
          ...getInteractiveSx(!hasSource),
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
              ":disabled": {
                backgroundColor: "rgba(56, 152, 252, 0.5)",
              },
            }}
          >
            Begin
          </Button>
        </Box>
        
      </Box>
      {popupOpen && !hasSource && (
        <WelcomePopup open={popupOpen} onClose={() => setPopupOpen(false)} variant={hasPixel? "alternate": "welcome"}/>
      )}
    </Box>
  );
};

export default FirstTimeScreen;
