import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Button,
  Box,
  Backdrop,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { margin } from "@mui/system";

type WelcomePopupProps = {
  open: boolean;
  onClose: () => void;
};

const WelcomePopup: React.FC<WelcomePopupProps> = ({ open, onClose }) => {
  const router = useRouter();

  const handleContinue = () => {
    onClose();
    window.location.reload();
  };

  return (
    <>
      <Backdrop
        open={open}
        onClick={onClose}
        sx={{
          zIndex: 1200,
          color: "#fff",
          backdropFilter: "blur(12px)",
          backgroundColor: "#0000001A",
        }}
      />
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiPaper-root": {
            borderRadius: "6px",
            padding: "24px 32px 12px",
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            borderBottom: "1px solid rgba(228, 228, 228, 1)",
            pb: 3,
          }}
        >
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: "20px",
              fontFamily: "Nunito Sans",
            }}
          >
            Website Pixel Successfully Installed! 🎉
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 0, pl: 0, pr: 0 }}>
          <Typography
            sx={{
              fontSize: "16px",
              color: "#5f6368",
              mb: 4,
              textAlign: "left",
              fontFamily: "Nunito Sans",
            }}
          >
            Great news — your tracking pixel is active! Now we&apos;ll start
            collecting data from your website visitors to build your audience.
          </Typography>

          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Image
              src="/pixel_success.svg"
              alt="Success"
              width={536}
              height={205}
              style={{ margin: 0 }}
            />
          </Box>

          <Button
            variant="contained"
            onClick={handleContinue}
            fullWidth
            sx={{
              backgroundColor: "#3898FC",
              textTransform: "none",
              fontSize: "16px",
              padding: "12px",
              fontWeight: 600,
              borderRadius: "8px",
              fontFamily: "Nunito Sans",
              "&:hover": {
                backgroundColor: "#1E88E5",
              },
              "&:active": {
                backgroundColor: "#74B7FD",
              },
            }}
          >
            Continue
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WelcomePopup;
