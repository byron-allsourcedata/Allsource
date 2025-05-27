import React, { useState } from "react";
import { Box, Typography, Link as MuiLink, Button } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { DashboardHelpCard } from "./HelpCard";
import NotificationInfoBanner from "./NotificationInfoBanner";
import { TimeScreenProps } from "@/types/first_time_screens";
import NotificationBanner from "./NotificationWarningBanner";
import { BookACallPopup, LeftMenuProps } from "@/app/(client)/components/BookACallPopup";

const FirstTimeScreenCommon1: React.FC<TimeScreenProps> = ({
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
  ContentStyleSX,
  LeftMenu
}) => {
  const [bannerVisible, setBannerVisible] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleOpenPopup = () => {
    setIsPopupOpen(true);
  };
  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };
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
          ...ContentStyleSX,
        }}
      >
        {/* Header */}
        {Header && (
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
                      display: "inline-block",
                    }}
                  >
                    {Header.TextSubtitle}

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
                          ml: 2,
                        }}
                      >
                        Learn more&nbsp;
                        <OpenInNewIcon sx={{ fontSize: 16 }} />
                      </MuiLink>
                    )}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Button
                  onClick={handleOpenPopup}
                  variant="contained"
                  sx={{
                    backgroundColor: "rgba(56,152,252,1)",
                    textTransform: "none",
                    padding: "10px 24px",
                    color: "#fff !important",
                    "&:hover": {
                      backgroundColor: "rgba(30,136,229,1)",
                    },
                    "&:active": {
                      backgroundColor: "rgba(116,183,253,1)",
                    },
                    "&.Mui-disabled": {
                      backgroundColor: "rgba(56,152,252,1)",
                      color: "#fff !important",
                    },
                  }}
                >
                  Request a Demo
                </Button>
              </Box>
            </Box>
          </Box>
        )}


        {InfoNotification && bannerVisible && (
          <NotificationInfoBanner
            message={InfoNotification.Text}
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
        <Box sx={{ my: 3, width: "100%" }}>
          {HelpCard && (
            <DashboardHelpCard
              headline={HelpCard.headline}
              description={HelpCard.description}
              helpPoints={HelpCard.helpPoints}
            />
          )}
        </Box>
      </Box>
      <BookACallPopup open={isPopupOpen} handleClose={handleClosePopup} leftMenu={LeftMenu} />
    </Box>
  );
};

export default FirstTimeScreenCommon1;
