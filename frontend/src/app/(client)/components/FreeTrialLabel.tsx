"use client";
import React, { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import DomainVerificationIcon from "@mui/icons-material/DomainVerification";
import AllInboxIcon from "@mui/icons-material/AllInbox";
import useAxios from "axios-hooks";
import { BookACallPopup } from "./BookACallPopup";
import ProgressBar from "../sources/components/BlueProgressLoader";

const FreeTrialLabel: React.FC = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [domainCount, setDomainCount] = useState<number>(0);
  const [creditsCount, setCreditsCount] = useState<number>(0);
  const [creditsLimitCount, setCreditsLimitCount] = useState<number>(0);
  const [upgradePlanPopup, setUpgradePlanPopup] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setAccessToken(token);
  }, []);

  const [{ data, loading }, refetch] = useAxios(
    {
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}me`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method: "GET",
    },
    { manual: true }
  );

  useEffect(() => {
    if (!accessToken) return;

    const fetch = async () => {
      try {
        const response = await refetch();
      } catch (err: any) {}
    };

    fetch();
  }, [accessToken]);

  useEffect(() => {
    if (data) {
      const { user_info, user_plan, user_domains } = data;
      if (user_info && user_plan) {
        setCreditsCount(user_info.leads_credits);
        setDomainCount(user_domains.length);
        setCreditsLimitCount(user_plan.lead_credits);
      }
    }
  }, [data]);

  const is_artificial_status = data?.user_plan?.is_artificial_status;

  const handleContactSales = () => {
    setUpgradePlanPopup(true);
  };

  const handleChoosePlanSlider = () => {
    setUpgradePlanPopup(true);
  };

  return (
    <>
      <BookACallPopup
        open={upgradePlanPopup}
        handleClose={() => setUpgradePlanPopup(false)}
      />
      {is_artificial_status && (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "flex-end",
            px: 2,
            justifyContent: "space-between",
            flexWrap: "wrap",
            backgroundColor: "#EBF5FF",
            borderRadius: "4px",
            border: "2px solid rgba(56, 152, 252, 0.2)",
            fontSize: "14px",
            "@media (min-width: 901px)": {
              marginRight: "2em",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "nowrap",
              gap: "12px",
              p: "6.25px 0px",
              fontSize: "12px",
              flexGrow: 1,
              justifyContent: "space-between",
              color: "#323232",
              alignItems: "flex-end",
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
                <Typography
                  sx={{
                    fontFamily: "Nunito Sans",
                    fontWeight: 600,
                    fontSize: "12px",
                    letterSpacing: "0%",
                  }}
                >
                  You are on Free Trial:
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "Nunito Sans",
                    fontWeight: 400,
                    fontSize: "12px",
                    letterSpacing: "0%",
                    color: "rgba(50, 50, 50, 0.6)",
                  }}
                >
                  To upgrade or unlock features, please
                </Typography>
                <Typography
                  onClick={handleContactSales}
                  sx={{
                    fontFamily: "Nunito Sans",
                    fontWeight: 400,
                    fontSize: "12px",
                    letterSpacing: "0%",
                    verticalAlign: "middle",
                    color: "rgba(50, 50, 50, 1)",
                    textDecoration: "underline",
                    textDecorationStyle: "solid",
                    textDecorationOffset: "0%",
                    textDecorationThickness: "0%",
                    cursor: "pointer",
                  }}
                >
                  Contact sales
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "start", gap: "8px" }}>
                <DomainVerificationIcon
                  fontSize="small"
                  sx={{
                    color: "#3898FC",
                    alignSelf: "flex-end",
                    fontSize: "17px",
                  }}
                />
                <Box
                  sx={{ display: "flex", width: "100%", alignItems: "center" }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Nunito Sans",
                      fontWeight: "400",
                      fontSize: "12px",
                      color: "rgba(50, 54, 62, 0.5)",
                    }}
                  >
                    {domainCount}/
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "Nunito Sans",
                      fontWeight: "400",
                      fontSize: "12px",
                      color: "rgba(50, 54, 62, 1)",
                    }}
                  >
                    1 Domains
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "start", gap: "8px" }}>
                <AllInboxIcon
                  fontSize="small"
                  sx={{ color: "#3898FC", fontSize: "17px" }}
                />
                <Box
                  sx={{ display: "flex", width: "100%", alignItems: "center" }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Nunito Sans",
                      fontWeight: "400",
                      fontSize: "12px",
                      color: "rgba(50, 54, 62, 0.5)",
                    }}
                  >
                    {creditsCount?.toLocaleString()}/
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "Nunito Sans",
                      fontWeight: "400",
                      fontSize: "12px",
                      color: "rgba(50, 54, 62, 1)",
                    }}
                  >
                    {creditsLimitCount?.toLocaleString()} Contacts
                  </Typography>
                </Box>
              </Box>

              <Button
                onClick={handleChoosePlanSlider}
                sx={{
                  fontFamily: "Nunito Sans",
                  fontWeight: 600,
                  fontSize: "12px",
                  lineHeight: "22px",
                  letterSpacing: "0%",
                  verticalAlign: "middle",
                  textTransform: "none",
                  px: "9px",
                  py: 0,
                  borderRadius: "4px",
                  bgcolor: "rgba(56, 152, 252, 1)",
                  color: "#FFFFFF",
                  textAlign: "right",
                  "&:hover": {
                    backgroundColor: "rgba(30, 136, 229, 1)",
                  },
                }}
              >
                Request pricing
              </Button>
            </Box>
          </Box>

          <Box sx={{ width: "100%", mb: "8px" }}>
            <ProgressBar
              progress={{
                total: creditsLimitCount,
                processed: creditsLimitCount - creditsCount,
                reversed: true,
              }}
            />
          </Box>
        </Box>
      )}
    </>
  );
};

export default FreeTrialLabel;
