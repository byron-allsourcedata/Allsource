import React, { useEffect, useRef, useState } from "react";
import { Button, Card, Typography, Box, Avatar, Stack } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { PopupButton, useCalendlyEventListener } from "react-calendly";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showToast } from "../ToastNotification";

interface HelpPoint {
  title: string;
  description: string;
}

interface DashboardHelpCardProps {
  headline: string;
  description: string;
  helpPoints: HelpPoint[];
}

export const DashboardHelpCard: React.FC<DashboardHelpCardProps> = ({
  headline,
  description,
  helpPoints,
}) => {
  const initialPrefill = { email: "", name: "" };
  const [prefillData, setPrefillData] = useState<{
    email: string;
    name: string;
  }>(initialPrefill);

  useEffect(() => {
    const meItem =
      typeof window !== "undefined" ? sessionStorage.getItem("me") : null;
    if (meItem) {
      const meData = JSON.parse(meItem);
      setPrefillData({ email: meData.email, name: meData.full_name });
    }
  }, []);

  const [utmParams, setUtmParams] = useState<string | null>(null);
  useCalendlyEventListener({
    onEventScheduled: async (e) => {
      const eventUri = e.data.payload.event.uri;
      const inviteeUri = e.data.payload.invitee.uri;
      const uuidMatch = eventUri.match(/scheduled_events\/([a-zA-Z0-9-]+)/);
      const uuidInvitee = inviteeUri.match(/invitees\/([a-zA-Z0-9-]+)/);
      const eventUUID = uuidMatch ? uuidMatch[1] : null;
      const inviteesUUID = uuidInvitee ? uuidInvitee[1] : null;

      if (eventUUID && inviteesUUID) {
        try {
          const response = await axiosInstance.post("/calendly", {
            uuid: eventUUID,
            invitees: inviteesUUID,
          });
          response;
        } catch (error) {}
        showToast("You have successfully signed up for a call");
      }
    },
  });

  const fetchPrefillData = async () => {
    try {
      const response = await axiosInstance.get("/calendly");
      const user = response.data.user;

      if (user) {
        const { full_name, email, utm_params } = user;
        setUtmParams(utm_params);
        setPrefillData({
          email: email || "",
          name: full_name || "",
        });
      } else {
        setPrefillData(initialPrefill);
      }
    } catch (error) {
      setPrefillData(initialPrefill);
    } finally {
    }
  };
  const calendlyPopupUrl = () => {
    const baseUrl = "https://calendly.com/validateapi-allforce/30min";
    const searchParams = new URLSearchParams();

    if (utmParams) {
      try {
        const parsedUtmParams =
          typeof utmParams === "string" ? JSON.parse(utmParams) : utmParams;

        if (typeof parsedUtmParams === "object" && parsedUtmParams !== null) {
          Object.entries(parsedUtmParams).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              searchParams.append(key, value as string);
            }
          });
        }
      } catch (error) {
        console.error("Error parsing utmParams:", error);
      }
    }

    const finalUrl = `${baseUrl}${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;
    return finalUrl;
  };
  return (
    <Card
      sx={{
        display: "flex",
        alignItems: "center",
        padding: 4,
        width: '100%',
        borderRadius: "4px",
        backgroundImage: 'url("/card_background.svg")',
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <Box sx={{ flexShrink: 0, textAlign: "center", mr: 4 }}>
        <Avatar
          alt="Katie Jones"
          src="/katie_jones.svg"
          sx={{ width: 120, height: 120, mx: "auto", backgroundColor: "rgba(118, 166, 245, 1)" }}
        />
        <Typography
          sx={{
            fontSize: "18px",
            fontWeight: 600,
            fontFamily: "Nunito Sans",
            color: "rgba(18, 18, 18, 1)",
          }}
          mt={2}
        >
          Katie Jones
        </Typography>
        <Typography color="text.secondary">Your Expert</Typography>
      </Box>

      <div
        id="calendly-popup-wrapper"
        className="book-call-button__wrapper"
        style={{ zIndex: 2000 }}
      >
        {" "}
      </div>
      <Box flexGrow={1}>
        <Typography
          sx={{
            fontSize: "24px",
            fontWeight: 400,
            fontFamily: "Nunito Sans",
            color: "rgba(11, 11, 11, 1)",
          }}
          gutterBottom
        >
          {headline}
        </Typography>
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 400,
            fontFamily: "Nunito Sans",
            color: "rgba(0, 0, 0, 0.5)",
          }}
          gutterBottom
        >
          {description}
        </Typography>

        <Stack spacing={1} mt={2}>
          {helpPoints.map((point, index) => (
            <Box key={index} display="flex" alignItems="center">
              <CheckCircleIcon
                sx={{ color: "mediumseagreen", mr: 1, mt: "4px" }}
              />
              <Box sx={{ flexDirection: "row", display: "flex", gap: 0.5 }}>
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 600,
                    fontFamily: "Nunito Sans",
                    color: "rgba(0, 0, 0, 1)",
                  }}
                >
                  {point.title}
                </Typography>

                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 400,
                    fontFamily: "Nunito Sans",
                    color: "rgba(0, 0, 0, 1)",
                  }}
                >
                  – {point.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
        <Box sx={{ mt: 3 }}>
          <PopupButton
            className="book-call-button"
            styles={{
              textWrap: "nowrap",
              fontFamily: "Nunito Sans",
              fontWeight: "600",
              fontSize: "14px",
              textAlign: "center",
              border: "none",
              lineHeight: "22.4px",
              backgroundColor: "rgba(56, 152, 252, 1)",
              textTransform: "none",
              cursor: "pointer",
              borderRadius: "4px",
              padding: "10px 42px",
              color: "rgba(255, 255, 255, 1)",
            }}
            prefill={prefillData}
            url={calendlyPopupUrl()}
            rootElement={document.getElementById("calendly-popup-wrapper")!}
            text="Talk to Us"
          />
        </Box>
      </Box>
    </Card>
  );
};
