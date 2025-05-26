import React, { FC } from "react";
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
