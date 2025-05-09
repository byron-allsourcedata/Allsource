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
  CardContent,
  Grid,
  CardActions,
  Card
} from "@mui/material";
import { useRouter } from "next/navigation";
import CloseIcon from '@mui/icons-material/Close';
import LegendToggleOutlinedIcon from '@mui/icons-material/LegendToggleOutlined';
import AllInboxOutlinedIcon from '@mui/icons-material/AllInboxOutlined';

const WelcomePopup = () => {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  const handleClose = () => {
    setOpen(false)
    localStorage.removeItem('welcome_popup');
  };

  const navigateToSourcePage = () => {
    handleClose()
    router.push("./sources/builder")
  }



  return (
    <>
      <Backdrop open={open} onClick={handleClose} sx={{ zIndex: 1200, color: '#fff', backdropFilter: "blur(12px)", backgroundColor: "#0000001A" }} />
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ p: "16px 16px 8px" }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
            <IconButton sx={{ width: "30px", height: "30px" }} onClick={handleClose}>
              <CloseIcon sx={{ color: "#202124" }} />
            </IconButton>
          </Box>
          <Typography fontWeight="600" fontSize="26px" textAlign="center" fontFamily="Nunito Sans">
            Welcome Aboard
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Typography className="fourth-sub-title" sx={{ textAlign: "center" }}>
            To uncover insight statistics you should provide at least one data source
          </Typography>
          <Grid container alignItems="center" justifyContent='center' sx={{ mt: 0 }}>

            <Grid item xs={12} md={12}>
              <Card variant="outlined">
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box
                    sx={{
                      height: 140,
                      backgroundColor: "#f0f4ff",
                      backgroundImage: "url(./audience.svg)",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      borderRadius: 2,
                    }}
                  />
                </CardContent>
                <CardActions sx={{ pt: 0, pl: 2, pr: 2 }}>
                  <Button variant="outlined" fullWidth onClick={navigateToSourcePage}>
                    <IconButton
                      sx={{ width: "30px", height: "30px", color: "#3898FC" }}
                      onClick={() => { }}
                    >
                      <AllInboxOutlinedIcon />
                    </IconButton>
                    <Typography className="description" style={{ color: "#3898FC" }}>
                      Start from Source
                    </Typography>
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WelcomePopup;
