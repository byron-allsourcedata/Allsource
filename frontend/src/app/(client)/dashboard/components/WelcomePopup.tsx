import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CardContent, 
  Grid,
  Chip,
  CardActions,
  Card
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axiosInstance from "../../../../axios/axiosInterceptorInstance";
import { PopupButton, useCalendlyEventListener } from "react-calendly";
import { showToast } from '@/components/ToastNotification';
import { dashboardStyles } from "../dashboardStyles";
import CloseIcon from '@mui/icons-material/Close';
import {loginStyles } from "../../signin/loginStyles"
import LegendToggleOutlinedIcon from '@mui/icons-material/LegendToggleOutlined';
import AllInboxOutlinedIcon from '@mui/icons-material/AllInboxOutlined';

interface PopupProps {
  }

const WelcomePopup: React.FC<PopupProps> = () => {
  const [open, setOpen] = useState(true);
  const initialPrefill = { email: '', name: ''}
  const [prefillData, setPrefillData] = useState<{ email: string, name: string}>(initialPrefill);
  const [isPrefillLoaded, setIsPrefillLoaded] = useState(false);

  const handleClose = () => {
    sessionStorage.removeItem('welcome_popup');
  };



  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{p: "16px 16px 8px"}}>
        <Box sx={{display: "flex", justifyContent: "flex-end", width: "100%"}}>
            <IconButton sx={{width: "30px", height: "30px"}} onClick={handleClose}>
              <CloseIcon />
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
        <Grid item xs={12} md={5}>
          <Card variant="outlined">
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography className="first-sub-title">Instal Pixel</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Typography
                    className="table-data"
                    sx={{
                      color: "rgba(43, 91, 0, 1) !important",
                      fontSize: "14px !important",
                      backgroundColor: "rgba(234, 248, 221, 1) !important",
                      padding: "4px 12px",
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
                  height: 100,
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
          xs={2}
          md={0.5}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            height: '300px'
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "100%",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                height: "50%",
                borderRight: "1px solid #DCE1E8",
                marginBottom: "8px",
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
                height: "50%",
                borderRight: "1px solid #DCE1E8",
                marginTop: "8px",
              }}
            />
          </Box>
        </Grid>

        {/* Right Section */}
        <Grid item xs={12} md={5}>
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
                  height: 100,
                  backgroundColor: "#f0f4ff",
                  backgroundImage: "url(./audience.svg)",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  borderRadius: 2,
                }}
              />
            </CardContent>
            <CardActions sx={{ pt: 0, pl: 2, pr: 2 }}>
              <Button variant="outlined" fullWidth>
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
  );
};

export default WelcomePopup;
