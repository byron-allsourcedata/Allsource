"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { integrationsStyle } from "./integrationsStyle";
import { UpgradePlanPopup } from "@/app/(client)/components/UpgradePlanPopup";
import axiosInstance from "../../../axios/axiosInterceptorInstance";
import {
  Box,
  Button,
  Typography,
  Tab,
  TextField,
  InputAdornment,
  Popover,
  IconButton,
  TableContainer,
  Table,
  Paper,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  Drawer,
  Backdrop,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import Image from "next/image";
import CustomTooltip from "@/components/customToolTip";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import TabList from "@mui/lab/TabList";
import { useRouter, useSearchParams } from "next/navigation";
import axios, { AxiosError } from "axios";
import Slider from "../../../components/Slider";
import { SliderProvider } from "@/context/SliderContext";
import MetaConnectButton from "@/components/MetaConnectButton";
import KlaviyoIntegrationPopup from "@/components/KlaviyoIntegrationPopup";
import SalesForceIntegrationPopup from "@/components/SalesForceIntegrationPopup";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import AlivbleIntagrationsSlider from "@/components/AvalibleIntegrationsSlider";
import ShopifySettings from "@/components/ShopifySettings";
import PixelInstallation from "@/app/(client)/dashboard/components/PixelInstallation";
import VerifyPixelIntegration from "@/components/VerifyPixelIntegration";
import DataSyncList from "@/app/(client)/data-sync/components/DataSyncList";
import BCommerceConnect from "@/components/Bcommerce";
import OmnisendConnect from "@/components/OmnisendConnect";
import MailchimpConnect from "@/components/MailchimpConnect";
import RevenueTracking from "@/components/RevenueTracking";
import SendlaneConnect from "@/components/SendlaneConnect";
import S3Connect from "@/components/S3Connect";
import AttentiveIntegrationPopup from "@/components/AttentiveIntegrationPopup";
import { useNotification } from "@/context/NotificationContext";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import ZapierConnectPopup from "@/components/ZapierConnectPopup";
import SlackConnectPopup from "@/components/SlackConnectPopup";
import LinkedinConnectPopup from "@/components/LinkedinConnectPopup";
import WebhookConnectPopup from "@/components/WebhookConnectPopup";
import { useIntegrationContext } from "@/context/IntegrationContext";
import HubspotIntegrationPopup from "@/components/HubspotIntegrationPopup";
import GoogleADSConnectPopup from "@/components/GoogleADSConnectPopup";
import BingAdsIntegrationPopup from "@/components/BingAdsIntegrationPopup";
import FirstTimeScreen from "./FirstTimeScreen";
import { hasIn } from "lodash";
import { FirstTimeScreenCommonVariant1 } from "@/components/first-time-screens";
import AudienceSynergyPreview from "@/components/first-time-screens/AudienceSynergyPreview";
import { MovingIcon, SettingsIcon, SpeedIcon } from "@/icon";
import HintCard from "../components/HintCard";
import { useIntegrationHints } from "./context/IntegrationsHintsContext";

interface IntegrationBoxProps {
  image: string;
  handleClick?: () => void;
  handleDelete?: () => void;
  service_name: string;
  active?: boolean;
  is_avalible?: boolean;
  error_message?: string;
  is_failed?: boolean;
  is_integrated?: boolean;
  isEdit?: boolean;
}

interface IntegrationCredentials {
  access_token: string;
  service_name: string;
  shop_domain: string;
  ad_account_id: string;
  is_with_suppresions: boolean;
  error_message?: string;
  is_failed: boolean;
}

const integrationStyle = {
  tabHeading: {
    textTransform: "none",
    padding: "4px 10px",
    pb: "10px",
    flexGrow: 0,
    minHeight: "auto",
    minWidth: "auto",
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: "19.1px",
    textAlign: "left",
    mr: 2,
    "&.Mui-selected": {
      color: "rgba(56, 152, 252, 1)",
    },
    "@media (max-width: 600px)": {
      flexGrow: 1,
      mr: 0,
      borderRadius: "4px",
      "&.Mui-selected": {
        backgroundColor: "rgba(249, 249, 253, 1)",
        border: "1px solid rgba(220, 220, 239, 1)",
      },
    },
  },
};

const IntegrationBox = ({
  image,
  handleClick,
  handleDelete,
  service_name,
  active,
  is_avalible,
  is_failed,
  is_integrated = false,
  isEdit,
}: IntegrationBoxProps) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const openPopover = Boolean(anchorEl);
  const [isHovered, setIsHovered] = useState(false);
  const [openToolTip, setOpenTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const altImageIntegration = ["Cordial"];

  const openToolTipClick = () => {
    const isMobile = window.matchMedia("(max-width:900px)").matches;
    if (isMobile && !is_integrated) {
      setOpenTooltip(true);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      tooltipRef.current &&
      !tooltipRef.current.contains(event.target as Node)
    ) {
      setOpenTooltip(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleOpen = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClickEdit = () => {
    handleClose();
    if (handleClick) {
      handleClick();
    }
  };

  const handleClickDelete = () => {
    handleClose();
    if (handleDelete) {
      handleDelete();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const formatServiceName = (name: string): string => {
    if (name === "big_commerce") {
      return "BigCommerce";
    }
    if (name === "google_ads") {
      return "GoogleAds";
    }
    if (name === "sales_force") {
      return "SalesForce";
    }
    if (name === "bing_ads") {
      return "BingAds";
    }
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Box
      sx={{
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
      }}
    >
      <Tooltip
        open={openToolTip || isHovered}
        ref={tooltipRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={openToolTipClick}
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: "#f5f5f5",
              color: "#000",
              boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.12)",
              border: " 0.2px rgba(0, 0, 0, 0.04)",
              borderRadius: "4px",
              maxHeight: "100%",
              whiteSpace: "normal",
              minWidth: "200px",
              zIndex: 99,
              padding: "11px 10px",
              fontSize: "12px !important",
              fontFamily: "Nunito Sans",
            },
          },
        }}
        title={
          is_integrated
            ? `A ${service_name.charAt(0).toUpperCase() + service_name.slice(1)
            } account is already integrated. To connect a different account, please remove the existing ${service_name.charAt(0).toUpperCase() + service_name.slice(1)
            } integration first.`
            : ""
        }
      >
        <Box
          sx={{
            backgroundColor: !is_integrated
              ? "rgba(0, 0, 0, 0.04)"
              : active
                ? "rgba(80, 82, 178, 0.1)"
                : "transparent",
            border: active
              ? "1px solid rgba(56, 152, 252, 1)"
              : "1px solid #E4E4E4",
            position: "relative",
            display: "flex",
            borderRadius: "4px",
            cursor: is_integrated ? "default" : "pointer",
            width: "8rem",
            height: "8rem",
            filter: !is_integrated ? "grayscale(1)" : "none",
            justifyContent: "center",
            alignItems: "center",
            transition: "0.2s",
            "&:hover": {
              boxShadow: is_integrated ? "none" : "0 0 4px #00000040",
              filter: !is_integrated ? "none" : "none",
              backgroundColor: !is_integrated
                ? "transparent"
                : "rgba(80, 82, 178, 0.1)",
            },
            "&:hover .edit-icon": {
              opacity: 1,
            },
            "@media (max-width: 900px)": {
              width: "156px",
            },
          }}
        >
          {!is_avalible && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Box
                onClick={handleClick}
                sx={{
                  position: "absolute",
                  top: "0%",
                  left: "0%",
                  margin: "8px 0 0 8px",
                  transition: "opacity 0.2s",
                  cursor: "pointer",
                  display: "flex",
                  background: !is_failed ? "#EAF8DD" : "#FCDBDC",
                  height: "20px",
                  padding: "2px 8px 1px 8px",
                  borderRadius: "4px",
                }}
              >
                {!is_failed ? (
                  <Typography
                    fontSize={"12px"}
                    fontFamily={"Nunito Sans"}
                    color={"#2B5B00"}
                    fontWeight={600}
                  >
                    Integrated
                  </Typography>
                ) : (
                  <Typography
                    fontSize={"12px"}
                    fontFamily={"Nunito Sans"}
                    color={"#4E0110"}
                    fontWeight={600}
                  >
                    Failed
                  </Typography>
                )}
              </Box>
              <Box
                className="edit-icon"
                onClick={handleOpen}
                sx={{
                  position: "absolute",
                  top: "0%",
                  right: "0%",
                  margin: "8px 8.4px 0 0",
                  opacity: openPopover ? 1 : 0,
                  transition: "opacity 0.2s",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  "&:hover": {
                    backgroundColor: "#EDEEF7",
                  },
                  "@media (max-width: 900px)": {
                    opacity: 1,
                  },
                }}
              >
                <MoreVertIcon sx={{ height: "20px" }} />
              </Box>
            </Box>
          )}
          {!is_integrated && isHovered && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
              }}
            >
              <AddIcon sx={{ color: "rgba(56, 152, 252, 1)", fontSize: 45 }} />
            </Box>
          )}
          <Image
            src={image}
            width={
              altImageIntegration.some((int) => int == service_name) ? 100 : 32
            }
            height={32}
            alt={service_name}
            style={{
              transition: "0.2s",
              filter: !is_integrated && isHovered ? "blur(10px)" : "none",
            }}
          />
        </Box>
      </Tooltip>
      <Typography
        mt={0.5}
        fontSize={"14px"}
        fontWeight={500}
        textAlign={"center"}
        fontFamily={"Nunito Sans"}
      >
        {formatServiceName(service_name)}
      </Typography>
      <Popover
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Box
          sx={{
            p: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            width: "100%",
            maxWidth: "160px",
          }}
        >
          <Button
            sx={{
              justifyContent: "flex-start",
              width: "100%",
              textTransform: "none",
              fontFamily: "Nunito Sans",
              fontSize: "14px",
              color: "rgba(32, 33, 36, 1)",
              fontWeight: 600,
              ":hover": {
                color: "rgba(56, 152, 252, 1)",
                backgroundColor: "rgba(80, 82, 178, 0.1)",
              },
            }}
            onClick={handleClickEdit}
          >
            Edit
          </Button>
          <Button
            sx={{
              justifyContent: "flex-start",
              width: "100%",
              textTransform: "none",
              fontFamily: "Nunito Sans",
              fontSize: "14px",
              color: "rgba(32, 33, 36, 1)",
              fontWeight: 600,
              ":hover": {
                color: "rgba(56, 152, 252, 1)",
                backgroundColor: "rgba(80, 82, 178, 0.1)",
              },
            }}
            onClick={handleClickDelete}
          >
            Delete
          </Button>
        </Box>
      </Popover>
    </Box>
  );
};

interface DeletePopupProps {
  service_name: string | null;
  open: boolean;
  handleDelete: () => void;
  onClose: () => void;
}

const DeleteIntegrationPopup = ({
  service_name,
  open,
  handleDelete,
  onClose,
}: DeletePopupProps) => {
  const [loading, setLoading] = useState(false);

  const handleDeleteClick = async () => {
    setLoading(true);
    await handleDelete();
    setLoading(false);
    onClose();
  };

  if (!open) return null;

  const formatServiceName = (name: string): string => {
    if (name === "big_commerce") {
      return "BigCommerce";
    }
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      {loading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.2)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1400,
            overflow: "hidden",
          }}
        >
          <Box sx={{ width: "100%", top: 0, height: "100vh" }}>
            <LinearProgress />
          </Box>
        </Box>
      )}
      <Backdrop
        open={open}
        onClick={onClose}
        sx={{ zIndex: 1300, color: "#fff", bgcolor: "rgba(0, 0, 0, 0.1)" }}
      />
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        variant="persistent"
        PaperProps={{
          sx: {
            width: "620px",
            position: "fixed",
            zIndex: 1300,
            top: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            "@media (max-width: 600px)": {
              width: "100%",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            p: "24px",
            pb: "19px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography variant="h3" fontSize={"1rem"}>
            Confirm deletion{" "}
            {service_name ? formatServiceName(service_name) : ""}
          </Typography>
          <CloseIcon sx={{ cursor: "pointer" }} onClick={onClose} />
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Image
              src="/Inbox cleanup-rafiki 1.svg"
              alt="cleanup"
              width={535}
              height={356.67}
            />
          </Box>

          <Typography
            variant="h6"
            textAlign="center"
            fontFamily="Nunito Sans"
            fontWeight={500}
            fontSize="14px"
            sx={{
              width: "100%",
              textAlign: "center",
              whiteSpace: "pre-line",
              userSelect: "text",
              p: 4,
            }}
          >
            Are you sure you want to delete the{" "}
            {service_name ? formatServiceName(service_name) : ""} integration?
            This action will remove all associated lists and disconnect{" "}
            {service_name ? formatServiceName(service_name) : ""} from your
            account.
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "20px",
            position: "absolute",
            bottom: 0,
            width: "100%",
            backgroundColor: "white",
            pt: "12px",
            borderTop: "1px solid rgba(0, 0, 0, 0.1)",
          }}
        >
          <Button
            sx={{
              border: "1px rgba(56, 152, 252, 1) solid",
              color: "rgba(56, 152, 252, 1)",
              "&:hover": {
                border: "1px rgba(56, 152, 252, 1) solid",
              },
            }}
            variant="outlined"
            onClick={onClose}
          >
            <Typography
              padding={"0rem 1rem"}
              sx={{ textTransform: "none" }}
              fontSize={"0.8rem"}
            >
              Cancel
            </Typography>
          </Button>
          <Button
            sx={{
              margin: "0 16px",
              fontFamily: "Nunito Sans",
              background: "rgba(56, 152, 252, 1)",
              "&:hover": {
                backgroundColor: "rgba(56, 152, 252, 1)",
              },
              "&.Mui-disabled": {
                backgroundColor: "rgba(80, 82, 178, 0.6)",
                color: "#fff",
              },
            }}
            variant="contained"
            onClick={handleDeleteClick}
          >
            <Typography
              padding={"0.35rem 2rem"}
              sx={{ textTransform: "none" }}
              fontSize={"0.8rem"}
            >
              Confirm
            </Typography>
          </Button>
        </Box>
      </Drawer>
    </>
  );
};

interface IntegrationsListProps {
  integrationsCredentials: IntegrationCredentials[];
  integrations: any[];
  changeTab?: (value: string) => void;
  handleSaveSettings: (new_integration: any) => void;
  handleDeleteSettings?: (serviceName: string) => void;
}

const UserIntegrationsList = ({
  integrationsCredentials,
  integrations,
  handleSaveSettings,
  handleDeleteSettings,
}: IntegrationsListProps) => {
  const [activeService, setActiveService] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [openDeletePopup, setOpenDeletePopup] = useState(false);
  const [search, setSearch] = useState<string>("");
  const [upgradePlanPopup, setUpgradePlanPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { hints, cards, changeIntegrationHint, resetIntegrationHints } = useIntegrationHints();

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleActive = (service: string) => {
    setActiveService(service);
  };

  const handleClose = () => {
    setOpenModal(null);
  };

  const handleAddIntegration = async (service_name: string) => {
    try {
      setIsLoading(true);
      // const response = await axiosInstance.get('/integrations/check-limit-reached')
      // if (response.status === 200 && response.data == true) {
      //   setUpgradePlanPopup(true)
      //   return
      // }
      // console.log(response)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response;
        if (status === 400 && data?.status === "DOMAIN_NOT_FOUND") {
          showErrorToast("Please set up your domain to continue");
          return;
        }
      }
    } finally {
      setIsLoading(false);
    }

    const isIntegrated = integrationsCredentials.some(
      (integration_cred) => integration_cred.service_name === service_name
    );
    if (isIntegrated) return;
    setOpenModal(service_name);
  };

  const handleDeleteOpen = () => {
    setOpenDeletePopup(true);
  };

  const handleDeleteClose = () => {
    setOpenDeletePopup(false);
  };

  const handleDelete = async () => {
    try {
      const response = await axiosInstance.delete("/integrations/", {
        params: {
          service_name: activeService,
        },
      });

      if (response.status === 200) {
        showToast(`Remove ${activeService} Successfully`);
        if (handleDeleteSettings && activeService) {
          handleDeleteSettings(activeService);
          setActiveService(null);
        }
      }
    } catch (error) {
      showErrorToast(`Remove ${activeService} failed`);
    }
  };

  const integrationsAvailable = [
    { image: "klaviyo.svg", service_name: "klaviyo" },
    { image: "meta-icon.svg", service_name: "meta" },
    { image: "omnisend_icon_black.svg", service_name: "omnisend" },
    { image: "mailchimp-icon.svg", service_name: "mailchimp" },
    { image: "sendlane-icon.svg", service_name: "sendlane" },
    { image: "zapier-icon.svg", service_name: "zapier" },
    { image: "slack-icon.svg", service_name: "slack" },
    { image: "webhook-icon.svg", service_name: "webhook" },
    { image: "hubspot.svg", service_name: "hubspot" },
    { image: "google-ads.svg", service_name: "google_ads" },
    { image: "salesforce-icon.svg", service_name: "sales_force" },
    { image: "bing-ads.svg", service_name: "bing_ads" },
    { image: "s3-icon.svg", service_name: "s3" },
    { image: "linkedin-icon.svg", service_name: "linkedin" },
  ];

  const integratedServices = integrationsCredentials.map(
    (cred) => cred.service_name
  );

  useEffect(() => {
    resetIntegrationHints();
  }, []);

  const theme = useTheme();
  const isNarrow = useMediaQuery('(max-width:900px)');

  return (
    <Box
      sx={{
        width: "100%",
        flexGrow: 1,
        overflow: "auto",
        pt: 2,
        "@media (max-width: 600px)": {
          pr: 2,
          pb: 4,
          height: "calc(100vh - 11.25rem)",
          pt: 2,
        },
      }}
    >
      {isLoading && <CustomizedProgressBar />}
      <UpgradePlanPopup
        open={upgradePlanPopup}
        limitName={"domain"}
        handleClose={() => setUpgradePlanPopup(false)}
      />
      <Box
        sx={{
          position: "relative",
          overflow: "visible",
        }}
      >
        <Box
          sx={{
            overflowX: "hidden",
            mb: 3.75,
            maxWidth: "500px",
            "@media(max-width: 900px)": { width: "100%" },
          }}
        >
          <TextField
            fullWidth
            placeholder="Search integrations"
            value={search}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Image
                    src="/ic_round-search.svg"
                    width={24}
                    height={24}
                    alt="search"
                  />
                </InputAdornment>
              ),
            }}
            variant="outlined"
          />
        </Box>

        <HintCard
          card={cards.search}
          positionLeft={530}
          positionTop={20}
          rightSide={false}
          isOpenBody={hints.search.showBody}
          toggleClick={() => {
            if (hints.integration.showBody) {
              changeIntegrationHint("integration", "showBody", "close")
            }
            changeIntegrationHint("search", "showBody", "toggle")
          }
          }
          closeClick={() =>
            changeIntegrationHint("search", "showBody", "close")
          }
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          overflowX: "hidden",
          "@media (max-width: 900px)": {
            justifyContent: "center",
          },
        }}
      >
        {integrationsAvailable
          .filter((integration) => {
            if (search) {
              return integration.service_name
                .toLowerCase()
                .includes(search.toLowerCase());
            }
            return true;
          })
          .sort((a, b) => {
            const isAIntegrated = integratedServices.includes(a.service_name);
            const isBIntegrated = integratedServices.includes(b.service_name);

            if (isAIntegrated === isBIntegrated) {
              return a.service_name.localeCompare(b.service_name);
            }
            return isAIntegrated ? -1 : 1;
          })
          .map((integration, idx) => {
            const isFirst = idx === 0;
            const isIntegrated = integratedServices.includes(integration.service_name);
            const integrationCred = integrationsCredentials.find(
              cred => cred.service_name === integration.service_name
            );

            return (
              <Box
                key={integration.service_name}
                onClick={() =>
                  isIntegrated
                    ? handleActive(integration.service_name)
                    : handleAddIntegration(integration.service_name)
                }
                sx={{
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                {isFirst && (
                  <Box
                    onClick={(e) => e.stopPropagation()}
                    sx={{}}
                  >
                    <HintCard
                      card={cards.integration}
                      positionLeft={isNarrow ? 150 : 125}
                      positionTop={125}
                      rightSide={false}
                      isOpenBody={hints.integration.showBody}
                      toggleClick={() => {
                        if (hints.search.showBody) {
                          changeIntegrationHint("search", "showBody", "close")
                        }
                        changeIntegrationHint("integration", "showBody", "toggle")
                      }}
                      closeClick={() =>
                        changeIntegrationHint("integration", "showBody", "close")
                      }
                    />
                  </Box>

                )}

                <IntegrationBox
                  image={`/${integration.image}`}
                  service_name={integration.service_name}
                  active={activeService === integration.service_name}
                  is_avalible={!isIntegrated}
                  is_integrated={isIntegrated}
                  handleClick={() => setOpenModal(integration.service_name)}
                  handleDelete={handleDeleteOpen}
                  is_failed={integrationCred?.is_failed}
                />
              </Box>
            );
          })}
      </Box>

      {openModal === "klaviyo" && (
        <KlaviyoIntegrationPopup
          open={true}
          handleClose={handleClose}
          onSave={handleSaveSettings}
          initApiKey={
            integrationsCredentials.find(
              (integration) => integration.service_name === "klaviyo"
            )?.access_token
          }
          invalid_api_key={
            integrationsCredentials.find(
              (integration) => integration.service_name === "klaviyo"
            )?.is_failed === true
          }
          boxShadow="rgba(0, 0, 0, 0.1)"
        />
      )}
      {openModal === "sales_force" && (
        <SalesForceIntegrationPopup
          open={true}
          handleClose={handleClose}
          onSave={handleSaveSettings}
          initApiKey={
            integrationsCredentials.find(
              (integration) => integration.service_name === "sales_force"
            )?.access_token
          }
          invalid_api_key={
            integrationsCredentials.find(
              (integration) => integration.service_name === "sales_force"
            )?.is_failed === true
          }
          boxShadow="rgba(0, 0, 0, 0.1)"
        />
      )}

      {openModal === "attentive" && (
        <AttentiveIntegrationPopup
          open={true}
          handleClose={handleClose}
          onSave={handleSaveSettings}
          initApiKey={
            integrationsCredentials.find(
              (integration) => integration.service_name === "attentive"
            )?.access_token
          }
          invalid_api_key={
            integrationsCredentials.find(
              (integration) => integration.service_name === "attentive"
            )?.is_failed === true
          }
          boxShadow="rgba(0, 0, 0, 0.1)"
        />
      )}

      {openModal === "meta" && (
        <MetaConnectButton
          open={true}
          onClose={handleClose}
          onSave={handleSaveSettings}
          invalid_api_key={
            integrationsCredentials.find(
              (integration) => integration.service_name === "meta"
            )?.is_failed === true
          }
          isEdit={true}
          boxShadow="rgba(0, 0, 0, 0.1)"
        />
      )}

      {openModal === "shopify" && (
        <ShopifySettings
          open={true}
          handleClose={handleClose}
          onSave={handleSaveSettings}
          initApiKey={
            integrationsCredentials.find(
              (integration) => integration.service_name === "shopify"
            )?.access_token
          }
          initShopDomain={
            integrationsCredentials.find(
              (integration) => integration.service_name === "shopify"
            )?.shop_domain
          }
        />
      )}

      {openModal === "big_commerce" && (
        <BCommerceConnect
          open={true}
          onClose={handleClose}
          initShopHash={
            integrationsCredentials.find(
              (integration) => integration.service_name === "big_commerce"
            )?.shop_domain
          }
          error_message={
            integrationsCredentials.find(
              (integration) => integration.service_name === "big_commerce"
            )?.error_message
          }
        />
      )}

      {openModal === "omnisend" && (
        <OmnisendConnect
          open={true}
          handleClose={handleClose}
          onSave={handleSaveSettings}
          initApiKey={
            integrationsCredentials.find(
              (integration) => integration.service_name === "omnisend"
            )?.access_token
          }
          invalid_api_key={
            integrationsCredentials.find(
              (integration) => integration.service_name === "omnisend"
            )?.is_failed === true
          }
          boxShadow="rgba(0, 0, 0, 0.1)"
        />
      )}

      {openModal === "mailchimp" && (
        <MailchimpConnect
          open={true}
          handleClose={handleClose}
          onSave={handleSaveSettings}
          initApiKey={
            integrationsCredentials.find(
              (integration) => integration.service_name === "mailchimp"
            )?.access_token
          }
          invalid_api_key={
            integrationsCredentials.find(
              (integration) => integration.service_name === "mailchimp"
            )?.is_failed === true
          }
          boxShadow="rgba(0, 0, 0, 0.1)"
        />
      )}

      {openModal === "sendlane" && (
        <SendlaneConnect
          open={true}
          handleClose={handleClose}
          onSave={handleSaveSettings}
          initApiKey={
            integrationsCredentials.find(
              (integration) => integration.service_name === "sendlane"
            )?.access_token
          }
          invalid_api_key={
            integrationsCredentials.find(
              (integration) => integration.service_name === "sendlane"
            )?.is_failed === true
          }
          boxShadow="rgba(0, 0, 0, 0.1)"
        />
      )}

      {openModal === "s3" && (
        <S3Connect
          open={true}
          handleClose={handleClose}
          onSave={handleSaveSettings}
          initApiKey={
            integrationsCredentials.find(
              (integration) => integration.service_name === "s3"
            )?.access_token
          }
          invalid_api_key={
            integrationsCredentials.find(
              (integration) => integration.service_name === "s3"
            )?.is_failed === true
          }
          boxShadow="rgba(0, 0, 0, 0.1)"
        />
      )}

      {openModal === "zapier" && (
        <ZapierConnectPopup
          open={true}
          handlePopupClose={handleClose}
          invalid_api_key={
            integrationsCredentials.find(
              (integration) => integration.service_name === "zapier"
            )?.is_failed === true
          }
          boxShadow="rgba(0, 0, 0, 0.1)"
        />
      )}

      {openModal === "slack" && (
        <SlackConnectPopup
          open={true}
          handlePopupClose={handleClose}
          invalid_api_key={
            integrationsCredentials.find(
              (integration) => integration.service_name === "slack"
            )?.is_failed === true
          }
          boxShadow="rgba(0, 0, 0, 0.1)"
        />
      )}

      {openModal === "google_ads" && (
        <GoogleADSConnectPopup
          open={true}
          handlePopupClose={handleClose}
          invalid_api_key={
            integrationsCredentials.find(
              (integration) => integration.service_name === "google_ads"
            )?.is_failed === true
          }
          boxShadow="rgba(0, 0, 0, 0.1)"
        />
      )}
      {openModal === "linkedin" && (
        <LinkedinConnectPopup
          open={true}
          handlePopupClose={handleClose}
          invalid_api_key={
            integrationsCredentials.find(
              (integration) => integration.service_name === "linkedin"
            )?.is_failed === true
          }
          boxShadow="rgba(0, 0, 0, 0.1)"
        />
      )}

      {openModal === "bing_ads" && (
        <BingAdsIntegrationPopup
          open={true}
          handleClose={handleClose}
          invalid_api_key={
            integrationsCredentials.find(
              (integration) => integration.service_name === "bing_ads"
            )?.is_failed === true
          }
          boxShadow="rgba(0, 0, 0, 0.1)"
        />
      )}

      {openModal === "webhook" && (
        <WebhookConnectPopup
          open={true}
          handleClose={handleClose}
          invalid_api_key={
            integrationsCredentials.find(
              (integration) => integration.service_name === "webhook"
            )?.is_failed === true
          }
          boxShadow="rgba(0, 0, 0, 0.01)"
        />
      )}

      {openModal === "hubspot" && (
        <HubspotIntegrationPopup
          open={true}
          handleClose={handleClose}
          initApiKey={
            integrationsCredentials.find(
              (integration) => integration.service_name === "hubspot"
            )?.access_token
          }
          invalid_api_key={
            integrationsCredentials.find(
              (integration) => integration.service_name === "hubspot"
            )?.is_failed === true
          }
          boxShadow="rgba(0, 0, 0, 0.01)"
        />
      )}

      <Box>
        {activeService &&
          activeService !== "shopify" &&
          activeService !== "big_commerce" && (
            <DataSyncList key={activeService} service_name={activeService} />
          )}
      </Box>

      <DeleteIntegrationPopup
        open={openDeletePopup}
        onClose={handleDeleteClose}
        service_name={activeService}
        handleDelete={handleDelete}
      />
    </Box>
  );
};

const PixelManagment = () => {
  const [value, setValue] = useState("1");
  const [filters, setFilters] = useState<any>();

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };
  return (
    <Box sx={{ flexGrow: 1, overflow: "auto", width: "100%", pr: "12px" }}>
      <TabContext value={value}>
        <TabList
          centered
          aria-label="Integrations Tabs"
          TabIndicatorProps={{
            sx: { backgroundColor: "rgba(56, 152, 252, 1)" },
          }}
          sx={{
            textTransform: "none",
            minHeight: 0,
            "& .MuiTabs-indicator": {
              backgroundColor: "rgba(56, 152, 252, 1)",
              height: "1.4px",
            },
            "@media (max-width: 600px)": {
              border: "1px solid rgba(228, 228, 228, 1)",
              borderRadius: "4px",
              width: "100%",
              "& .MuiTabs-indicator": {
                height: "0",
              },
            },
          }}
          onChange={handleTabChange}
        >
          <Tab
            label="Pixel Configuration"
            value="1"
            sx={{ ...integrationStyle.tabHeading }}
          />
          <Tab
            label="Data syncs"
            value="2"
            sx={{ ...integrationStyle.tabHeading }}
          />
        </TabList>
        <TabPanel value="2">
          <Box
            sx={{
              mt: "1rem",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              margin: 0,
              "@media (max-width: 600px)": { mb: 2 },
            }}
          >
            {/* Title and Tooltip */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                className="first-sub-title"
                sx={{
                  fontFamily: "Nunito Sans",
                  fontSize: "16px",
                  lineHeight: "normal",
                  fontWeight: 600,
                  color: "#202124",
                }}
              >
                Connections Details
              </Typography>
              <CustomTooltip
                title={
                  "How data synch works and to customise your sync settings"
                }
                linkText="Learn more"
                linkUrl="https://maximiz.ai"
              />
            </Box>
          </Box>
          <Box>
            <DataSyncList filters={filters} />
          </Box>
        </TabPanel>
        <TabPanel value="1">
          {/* <PixelInstallation />
          <VerifyPixelIntegration /> */}
          <RevenueTracking />
        </TabPanel>
      </TabContext>
    </Box>
  );
};

const Integrations = () => {
  const { hasNotification } = useNotification();
  const { needsSync, setNeedsSync } = useIntegrationContext();
  const [value, setValue] = useState("1");
  const [integrationsCredentials, setIntegrationsCredentials] = useState<
    IntegrationCredentials[]
  >([]);
  const [hasIntegrations, setHasIntegrations] = useState<Boolean>(false);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("");
  const router = useRouter();
  const [showSlider, setShowSlider] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("1");
  const searchParams = useSearchParams();
  const statusIntegrate = searchParams.get("message");
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    setActiveTab(newValue);
  };

  useEffect(() => {
    const code = searchParams.get("code");
    const scope = searchParams.get("scope");
    if (code && scope) {
      setValue("3");
      setActiveTab("3");
    }
  }, []);

  useEffect(() => {
    const fetchIntegrationCredentials = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/integrations/credentials/");
        if (response.status === 200) {
          setIntegrationsCredentials(response.data);
          setHasIntegrations(response.data.length > 0);
        }
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 403) {
          const status = error.response.data.status;
          if (status === "NEED_BOOK_CALL") {
            sessionStorage.setItem("is_slider_opened", "true");
            setShowSlider(true);
          } else {
            setShowSlider(false);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    const fetchIntegration = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/integrations/");
        if (response.status === 200) {
          setIntegrations(response.data);
        }
      } finally {
        setLoading(false);
        setNeedsSync(false);
      }
    };
    if (value === "1") {
      fetchIntegrationCredentials();
      if (!status) {
        fetchIntegration();
      }
    }
  }, [value, needsSync]);

  const handleSaveSettings = (newIntegration: IntegrationCredentials) => {
    setIntegrationsCredentials((prevIntegrations) => {
      if (
        prevIntegrations.some(
          (integration) =>
            integration.service_name === newIntegration.service_name
        )
      ) {
        return prevIntegrations.map((integration) =>
          integration.service_name === newIntegration.service_name
            ? newIntegration
            : integration
        );
      } else {
        return [...prevIntegrations, newIntegration];
      }
    });
  };

  const handleDeleteSettings = (serviceName: string) => {
    setIntegrationsCredentials((prevIntegrations) => {
      return prevIntegrations.filter(
        (integration) => integration.service_name !== serviceName
      );
    });
  };
  const changeTab = (value: string) => {
    setValue(value);
  };
  const [showFirstTime, setShowFirstTime] = useState(true);
  useEffect(() => {
    if (!isLoading && !hasIntegrations) {
      setShowFirstTime(true);
    } else {
      setShowFirstTime(false);
    }
  }, [isLoading, hasIntegrations]);
  const handleBegin = () => {
    setShowFirstTime(false);
    setActiveTab("1");
  };
  return (
    <>
      {isLoading && <CustomizedProgressBar />}
      {!isLoading && (
        <>
          {showFirstTime && (
            <>
              <FirstTimeScreenCommonVariant1
                Header={{
                  TextTitle: "Integrations",
                  TextSubtitle:
                    "Connect your favourite tools to automate tasks and ensure all your data is accessible in one place",
                  link: "https://allsourceio.zohodesk.com/portal/en/kb/articles/what-is-integration",
                }}
                InfoNotification={{
                  Text: "This page manages all your connected platforms and data pipelines in one centralized hub. View status, configure settings, and troubleshoot connections for seamless data flow across your marketing stack.",
                }}
                Content={
                  <>
                    <AudienceSynergyPreview
                      tableSrc="/integrations-first-time-screen.svg"
                      headerTitle="Connect Your Marketing Platforms"
                      caption="Sync your audience data seamlessly with ad platforms and CRM tools to activate campaigns across channels."
                      onOpenPopup={handleBegin}
                      onBegin={handleBegin}
                      beginDisabled={false}
                      buttonLabel="Create Integration"
                    />
                  </>
                }
                HelpCard={{
                  headline: "Struggling with Integrations?",
                  description:
                    "Get expert help connecting your platforms in a free 30-minute troubleshooting session.",
                  helpPoints: [
                    {
                      title: "Connection Setup",
                      description: "Step-by-step integration guidance",
                    },
                    {
                      title: "Error Resolution",
                      description: " Fix API/auth issues",
                    },
                    {
                      title: "Data Flow Optimization",
                      description: " Ensure seamless sync",
                    },
                  ],
                }}
                LeftMenu={{
                  header: "Fix & Optimize Your Data Flows",
                  subtitle: "Free 30-Min Sync Strategy Session",
                  items: [
                    {
                      Icon: SettingsIcon,
                      title: "Connection Setup",
                      subtitle: `We’ll verify your data sources are properly linked to deliver accurate insights.`,
                    },
                    {
                      Icon: SpeedIcon,
                      title: "Error Resolution",
                      subtitle: `Diagnose and fix sync failures that skew your analytics.`,
                    },
                    {
                      Icon: MovingIcon,
                      title: "Data Flow Optimization",
                      subtitle: "Streamline how insights reach your dashboards.",
                    },
                  ],
                }}
                ContentStyleSX={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  maxWidth: "840px",
                  margin: "0 auto",
                  mt: 2,
                }}
              />
            </>
          )}
          {!showFirstTime && (
            <TabContext value={value}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  mb: 0,
                  "@media (max-width: 900px)": {
                    flexDirection: "column",
                    display: "flex",
                    alignItems: "flex-start",
                  },
                  "@media (max-width: 600px)": {
                    flexDirection: "column",
                    display: "flex",
                    ml: 0,
                    alignItems: "flex-start",
                  },
                  "@media (max-width: 440px)": {
                    flexDirection: "column",
                    justifyContent: "flex-start",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    position: "sticky",
                    top: 0,
                    pt: "12px",
                    pb: "12px",
                    pl: "8px",
                    zIndex: 1,
                    backgroundColor: "#fff",
                    justifyContent: "space-between",
                    width: "100%",
                    "@media (max-width: 900px)": { left: 0, zIndex: 1 },
                    "@media (max-width: 700px)": {
                      flexDirection: "column",
                      display: "flex",
                      alignItems: "flex-start",
                      zIndex: 1,
                      width: "100%",
                    },
                    "@media (max-width: 440px)": {
                      flexDirection: "column",
                      pt: hasNotification ? "3rem" : "0.75rem",
                      top: hasNotification ? "4.5rem" : "",
                      zIndex: 1,
                      justifyContent: "flex-start",
                    },
                    "@media (max-width: 400px)": {
                      pt: hasNotification ? "4.25rem" : "",
                      pb: "6px",
                    },
                  }}
                >
                  <Box
                    sx={{
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      width: "10%",
                      gap: 1,
                      "@media (max-width: 600px)": { mb: 2 },
                      "@media (max-width: 440px)": { mb: 1 },
                    }}
                  >
                    <Typography
                      className="first-sub-title"
                      sx={{
                        fontFamily: "Nunito Sans",
                        fontSize: "16px",
                        lineHeight: "normal",
                        fontWeight: 600,
                        color: "#202124",
                      }}
                    >
                      Integrations
                    </Typography>

                    <Box
                      sx={{ "@media (max-width: 600px)": { display: "none" } }}
                    >
                      <CustomTooltip
                        title={
                          "Connect your favourite tools to automate tasks and ensure all your data is accessible in one place."
                        }
                        linkText="Learn more"
                        linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/what-is-integration"
                      />
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      justifyContent: "center",
                      width: "100%",
                      pr: "10%",
                      alignItems: "center",
                      "@media (max-width: 900px)": { pr: 0 },
                      "@media (max-width: 600px)": { width: "97%", pr: "0" },
                    }}
                  >
                    {status === "PIXEL_INSTALLATION_NEEDED" ? (
                      ""
                    ) : (
                      <TabList
                        centered
                        aria-label="Integrations Tabs"
                        TabIndicatorProps={{
                          sx: { backgroundColor: "rgba(56, 152, 252, 1)" },
                        }}
                        sx={{
                          textTransform: "none",
                          minHeight: 0,
                          pb: 0,
                          "& .MuiTabs-indicator": {
                            backgroundColor: "rgba(56, 152, 252, 1)",
                            height: "1.4px",
                          },
                          "@media (max-width: 600px)": {
                            border: "1px solid rgba(228, 228, 228, 1)",
                            borderRadius: "4px",
                            width: "100%",
                            "& .MuiTabs-indicator": {
                              height: "0",
                            },
                          },
                        }}
                        onChange={handleTabChange}
                      >
                        {/* <Tab label="Pixel Management" value="2" className="main-text"
                      sx={{
                        textTransform: 'none',
                        padding: '4px 10px',
                        pb: '10px',
                        flexGrow: 1,
                        marginRight: '3em',
                        minHeight: 'auto',
                        minWidth: 'auto',
                        fontSize: '14px',
                        fontWeight: 700,
                        lineHeight: '19.1px',
                        textAlign: 'left',
                        mr: 2,
                        '&.Mui-selected': {
                          color: 'rgba(56, 152, 252, 1)'
                        },
                        "@media (max-width: 600px)": {
                          mr: 0, borderRadius: '4px', '&.Mui-selected': {
                            backgroundColor: 'rgba(249, 249, 253, 1)',
                            border: '1px solid rgba(220, 220, 239, 1)'
                          },
                        }
                      }} /> */}
                      </TabList>
                    )}
                  </Box>
                </Box>
              </Box>
              <Box>
                <TabPanel
                  value="1"
                  sx={{
                    flexGrow: 1,
                    height: "100%",
                    overflowY: "auto",
                    padding: 0,
                    ml: 1.5,
                  }}
                >
                  <UserIntegrationsList
                    integrationsCredentials={integrationsCredentials}
                    changeTab={changeTab}
                    integrations={integrations}
                    handleSaveSettings={handleSaveSettings}
                    handleDeleteSettings={handleDeleteSettings}
                  />
                </TabPanel>
                <TabPanel value="2" sx={{ width: "100%", padding: "12px 0px" }}>
                  <Box sx={{ overflow: "auto", padding: 0 }}>
                    <PixelManagment />
                  </Box>
                </TabPanel>
              </Box>
            </TabContext>
          )}
        </>
      )}
      {showSlider && <Slider />}
    </>
  );
};

const IntegraitonsPage = () => {
  return (
    <SliderProvider>
      <Suspense fallback={<CustomizedProgressBar />}>
        <Integrations />
      </Suspense>
    </SliderProvider>
  );
};

export default IntegraitonsPage;
