"use client";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Typography,
  Collapse,
  Button
} from "@mui/material";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import LeadsIcon from "@mui/icons-material/People";
import CategoryIcon from "@mui/icons-material/Category";
import IntegrationsIcon from "@mui/icons-material/IntegrationInstructions";
import BusinessIcon from "@mui/icons-material/Business";
import FeaturedPlayListIcon from "@mui/icons-material/FeaturedPlayList";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import AllInboxIcon from "@mui/icons-material/AllInbox";
import Image from "next/image";
import { AxiosError } from "axios";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { useUser } from "@/context/UserContext";
import ContactsIcon from "@mui/icons-material/Contacts";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import LegendToggleIcon from "@mui/icons-material/LegendToggle";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InsightsIcon from "@mui/icons-material/Insights";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import FastForward from "@mui/icons-material/FastForward";
import { useSidebar } from "@/context/SidebarContext";


const sidebarStyles = {
  container: {
    width: "100%",
    flexShrink: 0,
    fontFamily: "Nunito Sans",
    fontSize: ".875rem",
    fontWeight: "400",
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderRight: ".0625rem solid rgba(228, 228, 228, 1)",
    height: "calc(100vh - 68px)",
    maxWidth: "9.125rem",
    display: "flex",
    overflow: "hidden",
    flexDirection: "column",
    justifyContent: "start",
    position: "relative",
  },
  menu: {
    alignItems: "center",
    paddingTop: "0 !important",
    pb: 0,
    "& .MuiListItem-root": {
      paddingBottom: "16px",
      paddingTop: "16px",
      "&:hover": {
        backgroundColor: "#e0e0e0",
      },
    },
    "& .MuiListItemText-root": {
      marginTop: "0rem !important",
      marginBottom: "0rem !important",
    },
    "& span.MuiTypography-root": {
      fontFamily: "Nunito Sans",
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: "normal",
    },
  },
  listItemIcon: {
    minWidth: "1.5rem",
    marginRight: ".25rem",
  },
  footer: {
    padding: "16px",
    "& .MuiListItem-root": {},
  },
  settings: {
    alignItems: "center",
    paddingTop: "0 !important",
    "& .MuiListItem-root": {
      paddingBottom: "16px",
      paddingTop: "16px",
      "&:hover": {
        backgroundColor: "#e0e0e0",
      },
    },
    "& .MuiListItemText-root": {
      marginTop: "0rem !important",
      marginBottom: "0rem !important",
    },
    "& span.MuiTypography-root": {
      fontFamily: "Nunito Sans",
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: "normal",
    },
  },
  setupSection: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    marginLeft: "16px",
    marginRight: "16px",
    border: ".0625rem solid #e4e4e4",
    borderRadius: ".5rem",
    backgroundColor: "#fff",
    marginBottom: "16px",
    boxShadow: "0rem .125rem .25rem rgba(0, 0, 0, 0.1)",
  },
  ListItem: {
    cursor: "pointer",
    minHeight: "4.5em",
    color: "rgba(59, 59, 59, 1)",
    ml: ".1875rem",
  },
  activeItem: {
    cursor: "pointer",
    borderLeft: ".1875rem solid rgba(56, 152, 252, 1)",
    color: "rgba(56, 152, 252, 1)",
    minHeight: "4.5em",
    "& .MuiSvgIcon-root": {
      color: "rgba(56, 152, 252, 1)",
    },
  },
};

const containerStyles = (hasNotification: boolean) => ({
  container: {
    width: "100%",
    flexShrink: 0,
    flexGrow: 1,
    fontFamily: "Nunito Sans",
    fontSize: ".875rem",
    fontWeight: "400",
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderRight: ".0625rem solid rgba(228, 228, 228, 1)",
    height: hasNotification ? "calc(100vh - 109.6px)" : "calc(100vh - 68px)",
    maxWidth: "10.9375rem",
    display: "flex",
    overflow: "hidden",
    overflowY: "auto",
    flexDirection: "column",
    justifyContent: "start",
    position: "relative",
  },
});

interface ProgressSectionProps {
  percent_steps: number;
}

const SetupSection: React.FC<ProgressSectionProps> = ({ percent_steps }) => {
  if (percent_steps > 50) {
    return null;
  }

  return (
    <Box sx={sidebarStyles.setupSection}>
      <Box display="flex" alignItems="center" mb={2}>
        <Image src={"/Vector9.svg"} alt="Setup" width={20} height={20} />
        <Typography
          variant="h6"
          component="div"
          ml={1}
          sx={{
            fontFamily: "Nunito Sans",
            fontWeight: "400",
            lineHeight: "normal",
            color: "rgba(0, 0, 0, 1)",
            fontSize: "14px",
          }}
        >
          Setup
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent_steps ? percent_steps : 0}
        sx={{
          height: ".5rem",
          borderRadius: ".25rem",
          backgroundColor: "rgba(219, 219, 219, 1)",
          "& .MuiLinearProgress-bar": {
            backgroundColor: "rgba(110, 193, 37, 1)",
          },
        }}
      />
      <Typography
        variant="body2"
        color="textSecondary"
        mt={1}
        sx={{
          fontFamily: "Roboto",
          lineHeight: "normal",
          color: "rgba(120, 120, 120, 1)",
          fontSize: "10px",
        }}
      >
        {percent_steps ? percent_steps : 0}% complete
      </Typography>
    </Box>
  );
};

interface SidebarProps {
  setShowSlider: Dispatch<SetStateAction<boolean>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  hasNotification: boolean;
  isGetStartedPage: boolean;
  loading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  setShowSlider,
  setLoading,
  hasNotification,
  isGetStartedPage,
  loading
}) => {
  const { domains, partner, backButton } = useUser();
  const { installedResources } = useSidebar();
  const isPixelInstalled = installedResources.pixel;
  const isSourceInstalled = installedResources.source;
  const router = useRouter();
  const pathname = usePathname();
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);
  const [activatePercent, setActivatePercent] = useState<number>(0);
  const [isPartnerAvailable, setIsPartnerAvailable] = useState(false);
  const isAuthorized = useRef(false);
  useEffect(() => {
    const storedDomain = sessionStorage.getItem("current_domain");
    if (storedDomain) {
      setCurrentDomain(storedDomain);
    }
  }, []);

  const checkPartner = () => {
    const storedMe = localStorage.getItem("account_info");
    let partner = false;
    if (storedMe) {
      const storedData = JSON.parse(storedMe);
      partner = storedData.partner;
      setIsPartnerAvailable(partner);
    } else {
      setIsPartnerAvailable(false);
    }
  };

  useEffect(() => {
    if (currentDomain) {
      const domain = domains?.find((d) => d.domain === currentDomain);
      if (domain) {
        setActivatePercent(domain.activate_percent);
      }
    }
  }, [currentDomain]);

  useEffect(() => {
    checkPartner();
  }, [backButton]);

  const handleNavigation = async (route: string) => {
    try {
      setLoading(true);
      const isSameRoute = pathname === route;

      if (isSameRoute) {
        window.location.reload();
      }
      if (isAuthorized.current) {
        router.push(route);
        return;
      } else {
        const response = await axiosInstance.get("/check-user-authorization");
        const status = response.data.status;

        if (status === "SUCCESS") {
          isAuthorized.current = true;
          router.push(route);
        } else if (status === "NEED_BOOK_CALL") {
          sessionStorage.setItem("is_slider_opened", "true");
          setShowSlider(true);
        } else {
          router.push(route);
        }
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 403) {
          if (error.response.data.status === "NEED_BOOK_CALL") {
            sessionStorage.setItem("is_slider_opened", "true");
            setShowSlider(true);
          } else {
            setShowSlider(false);
            router.push(route);
          }
        } else {
        }
      } else {
      }
    } finally {
      setLoading(false);
    }
  };

  const isActive = (path: string) => pathname.startsWith(path);

  const [open, setOpen] = useState(false);
  const isPixelActive =
    isActive("/leads") ||
    isActive("/company") ||
    isActive("/suppressions") ||
    isActive("/dashboard");
  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <Box
      sx={{
        ...containerStyles(hasNotification).container,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >

      <List
        sx={{
          ...sidebarStyles.menu,
          flexGrow: 1,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {isGetStartedPage && !loading &&
          <ListItem
            button
            onClick={() => handleNavigation("/get-started")}
            sx={
              isActive("/get-started")
                ? sidebarStyles.activeItem
                : sidebarStyles.ListItem
            }
          >
            <ListItemIcon sx={sidebarStyles.listItemIcon}>
              <FastForward />
            </ListItemIcon>
            <ListItemText primary="Get Started" />
          </ListItem>}
        {/* Audience-dashboard */}
        <ListItem
          button
          onClick={() => handleNavigation("/audience-dashboard")}
          sx={
            isActive("/audience-dashboard")
              ? sidebarStyles.activeItem
              : sidebarStyles.ListItem
          }
        >
          <ListItemIcon sx={sidebarStyles.listItemIcon}>
            <SpaceDashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        {/* PIXEL */}
        <List sx={{ width: 250, p: 0 }}>
          <ListItem
            button
            onClick={handleClick}
            sx={
              isPixelActive ? sidebarStyles.activeItem : sidebarStyles.ListItem
            }
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <ListItemIcon sx={sidebarStyles.listItemIcon}>
                <LegendToggleIcon />
              </ListItemIcon>
              <ListItemText primary="Pixel" sx={{ marginRight: 2 }} />
              {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          </ListItem>
          {open && (
            <Box sx={{ position: "relative" }}>
              <Collapse in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ opacity: isPixelInstalled ? 1 : 0.5 }}>
                  {/* Insights */}
                  <ListItem
                    button
                    onClick={() => handleNavigation("/dashboard")}
                    sx={
                      isActive("/dashboard")
                        ? { ...sidebarStyles.activeItem, pl: 4 }
                        : { ...sidebarStyles.ListItem, pl: 4 }
                    }
                  >
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                      <InsertChartOutlinedIcon />
                    </ListItemIcon>
                    <ListItemText primary="Analytics" />
                  </ListItem>

                  {/* Contacts */}
                  <ListItem
                    button
                    onClick={() => handleNavigation("/leads")}
                    sx={
                      isActive("/leads")
                        ? { ...sidebarStyles.activeItem, pl: 4 }
                        : { ...sidebarStyles.ListItem, pl: 4 }
                    }
                  >
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                      <LeadsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Contacts" />
                  </ListItem>

                  {/* Company */}
                  <ListItem
                    button
                    onClick={() => handleNavigation("/company")}
                    sx={
                      isActive("/company")
                        ? { ...sidebarStyles.activeItem, pl: 4 }
                        : { ...sidebarStyles.ListItem, pl: 4 }
                    }
                  >
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                      <BusinessIcon />
                    </ListItemIcon>
                    <ListItemText primary="Company" />
                  </ListItem>

                  {/* Suppressions */}
                  <ListItem
                    button
                    onClick={() => handleNavigation("/suppressions")}
                    sx={
                      isActive("/suppressions")
                        ? { ...sidebarStyles.activeItem, pl: 4 }
                        : { ...sidebarStyles.ListItem, pl: 4 }
                    }
                  >
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                      <FeaturedPlayListIcon />
                    </ListItemIcon>
                    <ListItemText primary="Suppressions" />
                  </ListItem>
                </List>
              </Collapse>

              {!isPixelInstalled && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 10,
                    maxWidth: "10.875rem",
                    backdropFilter: "blur(1px)",
                    backgroundColor: "rgba(0, 0, 0, 0.05)",
                    pointerEvents: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                  }}
                >
                  <Button
                    variant="contained"
                    sx={{
                      textTransform: "none",
                      backgroundColor: "rgba(56, 152, 252, 1)",
                      color: "rgba(255, 255, 255, 1)",
                      fontSize: ".875rem",
                      fontFamily: "Nunito Sans",
                      fontWeight: "600",
                    }}
                    onClick={() => handleNavigation("/get-started?pixel=true")}
                  >
                    Install Pixel
                  </Button>
                </Box>
              )}
            </Box>
          )}


        </List>
        {/* Source */}
        <ListItem
          button
          onClick={() => handleNavigation("/sources")}
          sx={
            isActive(`/sources`)
              ? sidebarStyles.activeItem
              : sidebarStyles.ListItem
          }
        >
          <ListItemIcon sx={sidebarStyles.listItemIcon}>
            <AllInboxIcon />
          </ListItemIcon>
          <ListItemText primary="Sources" />
        </ListItem>
        <Box sx={{ position: "relative" }}>
          <List disablePadding sx={{ opacity: (isSourceInstalled || loading) ? 1 : 0.5 }}>
            {/* Lookalikes */}
            <ListItem
              button
              onClick={() => handleNavigation("/lookalikes")}
              sx={
                isActive(`/lookalikes`)
                  ? sidebarStyles.activeItem
                  : sidebarStyles.ListItem
              }
            >
              <ListItemIcon sx={sidebarStyles.listItemIcon}>
                <ContactsIcon />
              </ListItemIcon>
              <ListItemText primary="Lookalikes" />
            </ListItem>

            {/* Insights */}
            <ListItem
              button
              onClick={() => handleNavigation("/insights")}
              sx={
                isActive("/insights")
                  ? sidebarStyles.activeItem
                  : sidebarStyles.ListItem
              }
            >
              <ListItemIcon sx={sidebarStyles.listItemIcon}>
                <InsightsIcon />
              </ListItemIcon>
              <ListItemText primary="Insights" />
            </ListItem>

            {/* Smart Audiences */}
            <ListItem
              button
              onClick={() => handleNavigation("/smart-audiences")}
              sx={
                isActive(`/smart-audiences`)
                  ? sidebarStyles.activeItem
                  : sidebarStyles.ListItem
              }
            >
              <ListItemIcon sx={sidebarStyles.listItemIcon}>
                <AutoFixHighIcon sx={{ rotate: "275deg", mb: 1 }} />
              </ListItemIcon>
              <ListItemText primary="Smart Audiences" sx={{ whiteSpace: "nowrap" }} />
            </ListItem>

            {/* Data Sync */}
            <ListItem
              button
              onClick={() => handleNavigation("/data-sync")}
              sx={
                isActive("/data-sync")
                  ? sidebarStyles.activeItem
                  : sidebarStyles.ListItem
              }
            >
              <ListItemIcon sx={sidebarStyles.listItemIcon}>
                <CategoryIcon />
              </ListItemIcon>
              <ListItemText primary="Data Sync" />
            </ListItem>

            {/* Integrations */}
            <ListItem
              button
              onClick={() => handleNavigation("/integrations")}
              sx={
                isActive("/integrations")
                  ? sidebarStyles.activeItem
                  : sidebarStyles.ListItem
              }
            >
              <ListItemIcon sx={sidebarStyles.listItemIcon}>
                <IntegrationsIcon />
              </ListItemIcon>
              <ListItemText primary="Integrations" />
            </ListItem>
          </List>

          {!isSourceInstalled && !loading && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 10,
                maxWidth: "10.875rem",
                backdropFilter: "blur(1px)",
                backgroundColor: "rgba(0, 0, 0, 0.05)",
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <Button
                variant="contained"
                sx={{
                  textTransform: "none",
                  backgroundColor: "rgba(56, 152, 252, 1)",
                  color: "rgba(255, 255, 255, 1)",
                  fontSize: ".875rem",
                  fontFamily: "Nunito Sans",
                  fontWeight: "600",
                }}
                onClick={() => handleNavigation("/get-started?source=true")}
              >
                Import Source
              </Button>
            </Box>
          )}
        </Box>

        {/* <ListItem button onClick={() => handleNavigation('/analytics')} sx={isActive('/analytics') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <AnalyticsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Analytics" />
                </ListItem> */}
        {/* partners */}
        {isPartnerAvailable && (
          <ListItem
            button
            onClick={() => handleNavigation("/partners")}
            sx={
              isActive("/partners")
                ? sidebarStyles.activeItem
                : sidebarStyles.ListItem
            }
          >
            <ListItemIcon sx={sidebarStyles.listItemIcon}>
              <AccountBoxIcon />
            </ListItemIcon>
            <ListItemText primary="Partners" />
          </ListItem>
        )}
        {/* <ListItem button onClick={() => handleNavigation('/rules')} sx={isActive('/rules') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <RuleFolderIcon />
                    </ListItemIcon>
                    <ListItemText primary="Rules" />
                </ListItem> */}
      </List>
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          backgroundColor: "white",
          zIndex: 10,
        }}
      >
        {/* <SetupSection percent_steps={activatePercent ? activatePercent : 0} /> */}
        <Box sx={sidebarStyles.settings}>
          <ListItem
            button
            onClick={() => handleNavigation("/settings?section=accountDetails")}
            sx={
              isActive("/settings")
                ? sidebarStyles.activeItem
                : sidebarStyles.ListItem
            }
          >
            <ListItemIcon sx={sidebarStyles.listItemIcon}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
