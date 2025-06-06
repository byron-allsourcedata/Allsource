import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axiosInstance from "../../../../axios/axiosInterceptorInstance";
import { PopupButton, useCalendlyEventListener } from "react-calendly";
import { showToast } from "@/components/ToastNotification";
import { useBookingUrl, usePrefillData } from "@/services/booking";

interface PopupProps {
  endSetup: () => void;
}

const DemoPopup: React.FC<PopupProps> = ({ endSetup }) => {
  const [open, setOpen] = useState(true);
  const [utmParams, setUtmParams] = useState<string | null>(null);

  const handleClose = () => {
    setOpen(false);
    endSetup();
  };

  const { prefillData, setPrefillData } = usePrefillData(
    axiosInstance,
    setUtmParams
  );

  useEffect(() => {
    const meItem =
      typeof window !== "undefined" ? sessionStorage.getItem("me") : null;
    if (meItem) {
      const meData = JSON.parse(meItem);
      setPrefillData({
        email: meData.email,
        firstname: meData.full_name,
        lastname: "",
      });
    }
  }, []);

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
        } catch (error) { }
        handleClose();
        showToast("You have successfully signed up for a call");
      }
    },
  });

  const meetingUrl = useBookingUrl(axiosInstance);

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography
            sx={{
              fontFamily: "Nunito Sans",
              fontSize: "22px",
              fontWeight: 600,
              lineHeight: "30.01px",
              color: "rgba(32, 33, 36, 1)",
            }}
          >
            Book your 30-minute demo with experts.
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom>
            WHAT TO EXPECT:
          </Typography>
          <List>
            {[
              "Get a personalised demo of Allsource.",
              "Experience the AI powered Influencer search tool.",
              "Let Our Expert Walk You Through Every Functionality of Our Platform.",
              "Get the answers you have been waiting for..!",
            ].map((text, index) => (
              <ListItem key={index}>
                <ListItemIcon sx={{ minWidth: "40px" }}>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={text}
                  sx={{
                    fontFamily: "Nunito Sans",
                    fontSize: "16px",
                    lineHeight: "21.82px",
                  }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ flexDirection: "column", gap: 1 }}>
          <PopupButton
            className="book-call-button"
            styles={{
              width: "100%",
              textWrap: "nowrap",
              color: "#fff",
              padding: "1em",
              fontFamily: "Nunito Sans",
              fontWeight: "600",
              fontSize: "14px",
              textAlign: "center",
              borderRadius: "4px",
              border: "none",
              lineHeight: "22.4px",
              backgroundColor: "rgba(56, 152, 252, 1)",
              textTransform: "none",
              cursor: "pointer",
            }}
            prefill={prefillData}
            url={meetingUrl}
            rootElement={document.getElementById("calendly-popup-wrapper")!}
            text="Book a Demo"
          />
          <Button
            variant="text"
            onClick={handleClose}
            sx={{
              textTransform: "none",
              color: "rgba(244, 87, 69, 1)",
              fontFamily: "Nunito Sans",
              fontSize: "14px",
              fontWeight: 600,
              lineHeight: "19.6px",
            }}
          >
            Skip
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DemoPopup;
