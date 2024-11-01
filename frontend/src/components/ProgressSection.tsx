import {
  Typography,
  Box,
  Button,
  LinearProgress,
  List,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import Image from "next/image";
import { styled } from "@mui/material/styles";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CodeIcon from "@mui/icons-material/Code";
import AppsIcon from "@mui/icons-material/Apps";
import { useSlider } from "../context/SliderContext";
import ManualPopup from "../components/ManualPopup";
import { useState } from "react";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import { AxiosError } from "axios";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation"; 
import CustomizedProgressBar from "./CustomizedProgressBar";

const CustomButton = styled(Button)(({ theme }) => ({
  width: "100%",
  height: "68.25px",
  padding: "16px 6px",
  gap: "8px",
  borderRadius: "4px 0px 0px 0px",
  backgroundColor: "rgba(255, 255, 255, 1)",
  border: "1px solid rgba(228, 228, 228, 1)",
  boxShadow: "0px 1px 2px 0px rgba(158, 158, 158, 0.2)",
  textAlign: "left",
  marginBottom: "8px",
  textTransform: "none",
  fontFamily: "Nunito Sans",
  fontSize: "14px",
  lineHeight: "20px",
  fontWeight: "500",
  color: "rgba(74, 74, 74, 1)",
  opacity: 1,
  pointerEvents: "auto",
  "&.Mui-disabled": {
    opacity: 0.6,
    pointerEvents: "none",
  },
  [theme.breakpoints.down("sm")]: {
    alignItems: "flex-start",
    padding: "8px",
    height: "auto",
  },
  "& .MuiListItemText-root span": {
    fontFamily: "Nunito Sans",
    fontSize: "14px",
    color: '#202124',
    fontWeight: "500",
    lineHeight: "20px"
  }
}));

const CustomListItemIcon = styled(ListItemIcon)(({ theme }) => ({
  paddingLeft: "0.5em",
  minWidth: 0,
  [theme.breakpoints.down("sm")]: {
    paddingLeft: "0",
    marginBottom: "4px",
  },
}));

export const ProgressSection: React.FC = () => {
  const router = useRouter();
  const { setShowSlider } = useSlider();
  const { percent_steps: userPercentSteps } = useUser();
  const meItem =
    typeof window !== "undefined" ? sessionStorage.getItem("me") : null;
  const meData = meItem ? JSON.parse(meItem) : { percent_steps: 0 };
  const percentSteps = userPercentSteps || meData.percent_steps;
  const isIntegrateDisabled = percentSteps < 90;
  const isSetupDisabled = percentSteps < 50;
  const [isLoading, setIsLoading] = useState(false);

  const installManually = async () => {
    try {
      setIsLoading(true)
      const response = await axiosInterceptorInstance.get(
        "/install-pixel/manually"
      );
      setPixelCode(response.data.manual);
      setOpen(true);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 403) {
        if (error.response.data.status === "NEED_BOOK_CALL") {
          sessionStorage.setItem("is_slider_opened", "true");
          setShowSlider(true);
        } else {
          sessionStorage.setItem("is_slider_opened", "false");
          setShowSlider(false);
        }
      } else {
        console.error("Error fetching data:", error);
      }
    }
    finally {
      setIsLoading(false)
    }
  };

  const ActivateTrial = () => {
    setShowSlider(true);
  };

  const integrations = () => {
    router.push('/integrations')
  }

  const [openmanually, setOpen] = useState(false);
  const handleManualClose = () => setOpen(false);
  const [pixelCode, setPixelCode] = useState("");

  return (
    <Box
      sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}
    >
      <Box
        sx={{
          width: "90%",
          height: "100%",
          padding: "1.5rem",
          marginTop: "1.5rem",
          border: "1px solid #e4e4e4",
          borderRadius: "8px",
          backgroundColor: "#fff",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
          marginBottom: "2rem",
          "@media (max-width: 1199px)": {
            width: "100%",
            padding: "1.25rem",
            margin: "1.5rem 0",
          },
        }}
      >
        <Typography
          variant="h6"
          component="div"
          mb={2}
          className="first-sub-title"
          sx={{
            marginBottom: "8px",
          }}
        >
          Activation steps
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography
            variant="body2"
            color="textSecondary"
            className="paragraph"
          >
            Progress
          </Typography>
          <Box sx={{ flexGrow: 1, mx: 2 }}>
            <LinearProgress
              variant="determinate"
              value={percentSteps}
              sx={{
                height: "8px",
                borderRadius: "4px",
                backgroundColor: "rgba(219, 219, 219, 1)",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: "rgba(110, 193, 37, 1)",
                },
              }}
            />
          </Box>

          <Typography
            variant="body2"
            color="textSecondary"
            className="paragraph"
            sx={{
              "@media (max-width: 1199px)": {
                fontSize: "14px",
                fontFamily: "Nunito Sans",
                color: "#000",
                fontWeight: "400",
                lineHeight: "normal",
              },
            }}
          >
            {percentSteps ? percentSteps : 0} % complete
          </Typography>
        </Box>
        <List sx={{ mt: "8px", p: "0" }}>
          <CustomButton
          onClick={ActivateTrial}
            sx={{
              borderRadius: "4px",
              mb: "16px",
              "@media (max-width: 1199px)": {
                mb: "16px",
              },
            }}
          >
            <CustomListItemIcon>
              <HourglassEmptyIcon
                sx={{ backgroundColor: "rgba(220, 220, 239, 1)" }}
              />
            </CustomListItemIcon>
            <ListItemText className="second-sub-title" primary="Activate Trial" />
          </CustomButton>
          <CustomButton
          onClick={installManually}
            disabled={isSetupDisabled}
            sx={{
              borderRadius: "4px",
              mb: "16px",
              "@media (max-width: 1199px)": {
                mb: "16px",
              },
            }}
          >
            <CustomListItemIcon>
              <CodeIcon sx={{ backgroundColor: "rgba(220, 220, 239, 1)" }} />
            </CustomListItemIcon>
            <ListItemText className="second-sub-title" primary="Setup pixel" />
          </CustomButton>
          <ManualPopup
              open={openmanually}
              handleClose={handleManualClose}
              pixelCode={pixelCode}
            />
          <CustomButton
            disabled={isIntegrateDisabled}
            onClick={integrations}
            sx={{
              marginBottom: "0",
              borderRadius: "4px",
            }}
          >
            <CustomListItemIcon>
              <AppsIcon sx={{ backgroundColor: "rgba(220, 220, 239, 1)" }} />
            </CustomListItemIcon>
            <ListItemText primary="Integrate" />
            <Image
              src={"/logos_meta-icon.svg"}
              alt="Meta"
              width={24}
              height={24}
            />
            <Image src={"/shopify.svg"} alt="Shopify" width={20} height={20} />
            <Image src={"/crm2.svg"} alt="Woo" width={20} height={20} />
            <Image src={"/simple-icons_bigcommerce.svg"} alt="Bigcommerce" width={20} height={20} />
          </CustomButton>
        </List>
      </Box>
      {isLoading && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1,
            }}>
              <CustomizedProgressBar />
            </Box>
          )}
    </Box>
  );
};
