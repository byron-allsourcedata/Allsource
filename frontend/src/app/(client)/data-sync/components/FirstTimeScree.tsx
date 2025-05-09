import React, { FC } from "react";
import {
  Box,
  Typography,
  Link as MuiLink,
  Button,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Image from "next/image";

interface DataSyncFirstTimeScreenProps {

  onBegin?: () => void;
}


const FirstTimeScree: FC<DataSyncFirstTimeScreenProps> = ({ onBegin }) => {
  return (
    <Box sx={{ width: "98%", display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
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
          Data Sync
        </Typography>
        <MuiLink
          href="#"
          underline="hover"
          sx={{ display: "flex", alignItems: "center", gap: 0.5, fontWeight: 300, color: "#3898FC" }}
        >
          Learn more <OpenInNewIcon sx={{ fontSize: 16 }} />
        </MuiLink>
      </Box>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Customise your sync settings
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
          border: '1px solid #EDEDED',
          overflow: 'hidden',
        }}
      >
        <Typography variant="subtitle2" sx={{ color: "#151619", fontWeight: 400 }}>
          Sync Audience to Any Platform
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
            src="/data-sync-first-time-screen.svg"
            alt="Data sync illustration"
            width={170}
            height={170}
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </Box>

        <Typography variant="body2" sx={{ color: "#7E7E7E" }}>
          Send your audience segments to connected platforms like Meta Ads, Google Ads, and Mailchimp with one click.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            onClick={onBegin}
            disabled
            sx={{
              minWidth: 85,
              minHeight: 40,
              bgcolor: "#3898FC",
              fontWeight: 300,
              textTransform: "none",
            }}
          >
            Begin
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default FirstTimeScree;
