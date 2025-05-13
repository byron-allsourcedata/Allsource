"use client";
import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import { useRouter } from "next/navigation";

interface NotificationBannerProps {
  ctaUrl: string;
  ctaLabel?: string;
  message?: string;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  ctaUrl,
  ctaLabel = "Add",
  message = "You need to import that",
}) => {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  if (!open) return null;

  return (
    <Box
      sx={{
        mb: 3,
        px: 2,
        py: 2,
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        border: "1px solid rgba(224, 49, 48, 1)",
        borderRadius: "4px",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
      }}
    >
      {/* left part */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
        <ReportProblemOutlinedIcon sx={{ fontSize: 20, color: "rgba(230,90,89,1)" }} />
        <Typography className="second-sub-title">{message}</Typography>
      </Box>

      {/* right part */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-end" }}>
        <Button
          onClick={() => setOpen(false)}
          sx={{
            textTransform: "none",
            fontFamily: "Nunito Sans",
            fontSize: "14px",
            fontWeight: 500,
            color: "rgba(224, 49, 48, 1)",
            "&:hover": { bgcolor: "rgba(253, 247, 247, 1)" },
            "&:active": { bgcolor: "rgba(241, 192, 192, 1)" },
          }}
        >
          Dismiss
        </Button>
        <Button
          variant="contained"
          onClick={() => router.push(ctaUrl)}
          sx={{
            textTransform: "none",
            fontFamily: "Nunito Sans",
            fontSize: "14px",
            fontWeight: 500,
            bgcolor: "rgba(224,49,48,1)",
            "&:hover": { bgcolor: "rgba(198, 40, 40, 1)" },
            "&:active": { bgcolor: "rgba(224, 109, 109, 1)" },
          }}
        >
          {ctaLabel}
        </Button>
      </Box>
    </Box>
  );
};

export default NotificationBanner;
