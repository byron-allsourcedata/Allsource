import React, { useState } from "react";
import { Box, Typography, Link as MuiLink, Button } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { DashboardHelpCard } from "./HelpCard";
import NotificationInfoBanner from "./NotificationInfoBanner";
import { TimeScreenProps } from "@/types/first_time_screens";
import NotificationBanner from "./NotificationWarningBanner";

const FirstTimeScreenCommon: React.FC<TimeScreenProps> = ({
  Header,
  InfoNotification,
  WarningNotification = {
    condition: false,
    ctaUrl: "/test",
    ctaLabel: "Test Header",
    message: "Test Message",
  },
  Content,
  HelpCard,
  customStyleSX,
}) => {
  const [bannerVisible, setBannerVisible] = useState(true);
  const CALENDLY_URL = 'https://calendly.com/validateapi-allforce/30min';

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      {WarningNotification?.condition && (
        <Box sx={{}}>
          <NotificationBanner
            ctaUrl={WarningNotification.ctaUrl}
            ctaLabel={WarningNotification.ctaLabel}
            message={WarningNotification.message}
          />
        </Box>
      )}
      <Box
        sx={{
          ...customStyleSX,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              align="center"
              className="first-sub-title"
              sx={{
                fontFamily: "Nunito Sans",
                fontSize: "24px !important",
                color: "#4a4a4a",
                fontWeight: "500 !important",
                lineHeight: "22px",
              }}
            >
              {Header.TextTitle}
            </Typography>
            {Header.TextSubtitle && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mt: 1,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: "Nunito Sans",
                    fontSize: "14px",
                    color: "rgba(50, 54, 62, 1)",
                    fontWeight: "400",
                    lineHeight: "22px",
                  }}
                >
                  {Header.TextSubtitle}
                </Typography>

                {Header.link && (
                  <MuiLink
                    href={Header.link}
                    target="_blank"
                    underline="hover"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      color: "#3898FC",
                      fontSize: 14,
                      fontFamily: "Nunito Sans",
                    }}
                  >
                    Learn more&nbsp;
                    <OpenInNewIcon sx={{ fontSize: 16 }} />
                  </MuiLink>
                )}
              </Box>
            )}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Button
                component="a"
        href={CALENDLY_URL}
        target="_blank"
        rel="noopener noreferrer"
        variant="contained"
                sx={{
                  backgroundColor: "rgba(56,152,252,1)",
                  textTransform: "none",
                  padding: "10px 24px",
                  color: "#fff !important",
                  ":hover": { backgroundColor: "rgba(48,149,250,1)" },
                  ":disabled": { backgroundColor: "rgba(56,152,252,0.5)" },
                }}
              >
                Request a Demo
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Info Notification */}
        {InfoNotification && bannerVisible && (
          <NotificationInfoBanner
            message="Your dashboard displays key performance data across 5 core areas: pixel-captured users, created sources, lookalikes, smart audiences, and data sync status. Monitor all critical metrics in one place to optimize targeting."
            onClose={() => setBannerVisible(false)}
          />
        )}

        {/* Main Content */}
        {Content && (
          <Box sx={{
            width: "100%",
            mt: bannerVisible ? 3 : 0

          }}>
            {typeof Content === "function"
              ? React.createElement(Content as React.ComponentType)
              : Content}
          </Box>
        )}

        {/* Help Card */}
        <Box sx={{ mt: 3, width: "100%" }}>
          {HelpCard && (
            <DashboardHelpCard
              headline={HelpCard.headline}
              description={HelpCard.description}
              helpPoints={HelpCard.helpPoints}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default FirstTimeScreenCommon;
