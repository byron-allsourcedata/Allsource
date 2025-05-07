import React, { useState} from "react";
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
        <DialogTitle sx={{p: "16px 16px 8px"}}>
          <Box sx={{display: "flex", justifyContent: "flex-end", width: "100%"}}>
              <IconButton sx={{width: "30px", height: "30px"}} onClick={handleClose}>
                <CloseIcon sx={{color: "#202124"}}/>
              </IconButton>
          </Box>
          <Typography fontWeight="600" fontSize="26px" textAlign="center" fontFamily="Nunito Sans">
            Welcome Aboard
          </Typography>
        </DialogTitle>
        <DialogContent sx={{p: 2}}>
          <Typography className="fourth-sub-title" sx={{textAlign: "center"}}>
            To begin building your audience, you'll need to provide a data source.
          </Typography>
        <Grid container spacing={4} alignItems="center" justifyContent='center' sx={{ mt: 0}}>
        {/* Left Section */}
          <Grid item xs={12} md={5.75}>
            <Card variant="outlined">
              <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography className="first-sub-title">Install Pixel</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <Typography
                      className="table-data"
                      sx={{
                        color: "rgba(43, 91, 0, 1) !important",
                        fontSize: "14px !important",
                        backgroundColor: "rgba(234, 248, 221, 1) !important",
                        padding: "4px 12px",
                        borderRadius: "4px",
                      }}
                    >
                      Recommended
                    </Typography>
                  </Box>
                </Box>
                <Typography className="description">
                  It will automatically collect visitor information from your website.
                </Typography>
                <Box
                  sx={{
                    height: 140,
                    backgroundColor: "#f0f4ff",
                    backgroundImage: "url(./pixel.svg)",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    borderRadius: 2,
                  }}
                />
              </CardContent>
              <CardActions sx={{ pt: 0, pl: 2, pr: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={navigateToSourcePage}
                  sx={{ backgroundColor: "#3898FC", dropShadow: "#00000040" }}
                >
                  <IconButton
                    sx={{ width: "30px", height: "30px", color: "#fff" }}
                    onClick={() => {}}
                  >
                    <LegendToggleOutlinedIcon />
                  </IconButton>
                  <Typography className="description" style={{ color: "#fff" }}>
                    Start with Pixel
                  </Typography>
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* OR Divider */}
          <Grid
            item
            xs={12}
            md={0.5}
            sx={{
              display: "flex",
              flexDirection: { xs: "row", md: "column" }, 
              alignItems: "center",
              gap: 1,
              height: { xs: "auto", md: "340px" },
              width: "100%"
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "row", md: "column" },
                alignItems: "center",
                height: "100%",
                justifyContent: "center",
                width: "100%"
              }}
            >
              <Box
                sx={{
                  width: { xs: "50%", md: "auto" }, 
                  height: { xs: "1px", md: "50%" },
                  borderBottom: { xs: "1px solid #DCE1E8", md: "none" },
                  borderRight: { xs: "none", md: "1px solid #DCE1E8" },
                  marginRight: { xs: "8px", md: "0" },
                  marginBottom: { xs: "0", md: "8px" },
                }}
              />
              <Typography
                variant="body1"
                className="third-sub-title"
                sx={{ color: "#6B7280" }}
              >
                OR
              </Typography>
              <Box
                sx={{
                  width: { xs: "50%", md: "auto" }, 
                  height: { xs: "1px", md: "50%" },
                  borderBottom: { xs: "1px solid #DCE1E8", md: "none" },
                  borderRight: { xs: "none", md: "1px solid #DCE1E8" },
                  marginRight: { xs: "8px", md: "0" },
                  marginBottom: { xs: "0", md: "8px" },
                }}
              />
            </Box>
          </Grid>

          {/* Right Section */}
          <Grid item xs={12} md={5.75}>
            <Card variant="outlined">
              <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography className="first-sub-title">
                  Import Source from CSV file
                </Typography>
                <Typography className="description">
                  Otherwise, you can upload a CSV file containing your existing customer data.
                </Typography>
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
                    onClick={() => {}}
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
