import React, { FC, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Link as MuiLink,
  Button,
  SxProps,
  Theme,
} from "@mui/material";
import Image from "next/image";
import { getInteractiveSx } from "../utils";
import { motion } from "framer-motion";

export interface AudienceSynergyPreviewProps {
  headerTitle: string;
  tableSrc: string;
  caption: string;
  onOpenPopup: () => void;
  onBegin: () => void;
  beginDisabled?: boolean;
  buttonLabel?: string;
  sx?: SxProps<Theme>;
}

const AudienceSynergyPreview: FC<AudienceSynergyPreviewProps> = ({
  headerTitle,
  tableSrc,
  caption,
  onBegin,
  onOpenPopup,
  beginDisabled = false,
  buttonLabel = "Begin",
  sx,
}) => {

  const [activeLogo, setActiveLogo] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLogo((prev) => (prev + 1) % logos.length);
    }, 2000); // Change logo every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const logos = [
    "/bing-ads.svg",
    "/google-ads.svg",
    "/linkedIn.svg",
    "/s3.svg",
    "/logos_meta-icon.svg",
    "/hubspot.svg",
    "/mailchimp-icon.svg",
    "/salesforce-icon.svg",
  ];

  return (
    <Box
      onClick={(e) => {
        if (beginDisabled) {
          onOpenPopup();
        }
      }}
      sx={{
        ...getInteractiveSx(beginDisabled),
      }}
    >
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
          {headerTitle}
        </Typography>

        <Box
          sx={{
            borderRadius: 1,
            p: 2,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Image
            src={tableSrc}
            alt="Allsource integrations diagram"
            width={600}
            height={160}
            style={{ maxWidth: "100%", height: "auto" }}
          />

          <motion.div
              key={activeLogo}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Box
                component="img"
                src={logos[activeLogo]}
                alt={Logo ${activeLogo + 1}}
                sx={{ width: "100px", height: "100px", mt: 4 }}
              />
          </motion.div>
        </Box>

        <Typography variant="body2" sx={{ color: "#7E7E7E" }}>
          {caption}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            onClick={onBegin}
            disabled={beginDisabled}
            sx={{
              backgroundColor: "rgba(56,152,252,1)",
              textTransform: "none",
              padding: "10px 24px",
              color: "#fff !important",
              ":hover": { backgroundColor: "rgba(48,149,250,1)" },
              ":disabled": { backgroundColor: "rgba(56,152,252,0.5)" },
            }}
          >
            {buttonLabel}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AudienceSynergyPreview;
