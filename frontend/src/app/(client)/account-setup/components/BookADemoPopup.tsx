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
import { showToast } from '@/components/ToastNotification';

interface PopupProps {
    endSetup: () => void;
  }

const DemoPopup: React.FC<PopupProps> = ({ endSetup }) => {
  const [open, setOpen] = useState(true);
  const initialPrefill = { email: '', name: ''}
  const [prefillData, setPrefillData] = useState<{ email: string, name: string}>(initialPrefill);
  const [isPrefillLoaded, setIsPrefillLoaded] = useState(false);

  const handleClose = () => {
    setOpen(false);
    endSetup()
  };

  const calendlyPopupRef = useRef<HTMLDivElement | null>(null);
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (calendlyPopupRef.current) {
      fetchPrefillData();
      setRootElement(calendlyPopupRef.current);
    }
  }, []);

  useEffect(() => {
    const meItem = typeof window !== 'undefined' ? sessionStorage.getItem('me') : null;
    if (meItem) {
      const meData = JSON.parse(meItem);
      setPrefillData({email: meData.email, name: meData.full_name})
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
          const response = await axiosInstance.post('/calendly', {
            uuid: eventUUID,
            invitees: inviteesUUID
          });
          response;
        } catch (error) {
        }
        handleClose();
        showToast('You have successfully signed up for a call');
      }
    },
  });

const fetchPrefillData = async () => {
    try {
      const response = await axiosInstance.get('/calendly');
      const user = response.data.user;

      if (user) {
        const { full_name, email, utm_params } = user;
        setUtmParams(utm_params)
        setPrefillData({
          email: email || '',
          name: full_name || '',
        });
      } else {
        setPrefillData(initialPrefill);
      }
    } catch (error) {
      setPrefillData(initialPrefill);
    } finally {
      setIsPrefillLoaded(true);
    }
  };

  const calendlyPopupUrl = () => {
    const baseUrl = "https://calendly.com/maximiz-support/30min";
    const searchParams = new URLSearchParams();

    if (utmParams) {
      try {
        const parsedUtmParams = typeof utmParams === 'string' ? JSON.parse(utmParams) : utmParams;

        if (typeof parsedUtmParams === 'object' && parsedUtmParams !== null) {
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

    const finalUrl = `${baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return finalUrl;
  };

  return (
    <>
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
            <Typography sx={{
                fontFamily: "Nunito Sans",
                fontSize: "22px",
                fontWeight: 600,
                lineHeight: "30.01px",
                color: "rgba(32, 33, 36, 1)"
                }}>
            Book your 30-minute demo with experts.
            </Typography>
        </DialogTitle>
        <DialogContent dividers>
            <Typography variant="subtitle1" gutterBottom>
            WHAT TO EXPECT:
            </Typography>
            <List>
            {[
                "Get a personalised demo of Maximiz.",
                "Experience the AI powered Influencer search tool.",
                "Explore how we help you discover top influencers, nurture relationships, handle campaigns from start to finish, and more.",
                "Get the answers you have been waiting for..!",
            ].map((text, index) => (
                <ListItem key={index}>
                <ListItemIcon sx={{minWidth: "40px"}}>
                    <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText primary={text} sx={{
                    fontFamily: "Nunito Sans",
                    fontSize: "16px",
                    lineHeight: "21.82px"
                }} />
                </ListItem>
            ))}
            </List>
        </DialogContent>
        <DialogActions sx={{ flexDirection: "column", gap: 1 }}>
        <PopupButton
            className="book-call-button"
            styles={{
                width: '100%',
                textWrap: 'nowrap',
                color: '#fff',
                padding: '1em',
                fontFamily: 'Nunito Sans',
                fontWeight: '600',
                fontSize: '14px',
                textAlign: 'center',
                borderRadius: '4px',
                border: 'none',
                lineHeight: '22.4px',
                backgroundColor: '#5052B2',
                textTransform: 'none',
                cursor: 'pointer',
            }}
            prefill={prefillData}
            url={calendlyPopupUrl()}
            rootElement={document.getElementById("calendly-popup-wrapper")!}
            text="Book a Demo"
            />
            <Button
            variant="text"
            onClick={handleClose}
            sx={{ textTransform: "none", color: "rgba(244, 87, 69, 1)", fontFamily: "Nunito Sans", fontSize: "14px", fontWeight: 600, lineHeight: "19.6px"}}
            >
            Skip
            </Button>
        </DialogActions>
        </Dialog>
    </>
  );
};

export default DemoPopup;
