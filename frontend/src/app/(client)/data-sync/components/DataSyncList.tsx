import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Popover,
  Tooltip,
  DialogActions,
  DialogContent,
  DialogContentText,
} from "@mui/material";
import React, { useState, useEffect, memo } from "react";
import Image from "next/image";
import axios, { AxiosError } from "axios";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ConnectKlaviyo from "./ConnectKlaviyo";
import ConnectSalesForce from "./ConnectSalesForce";
import ConnectMeta from "./ConnectMeta";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { leadsStyles } from "@/app/(client)/leads/leadsStyles";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import { datasyncStyle } from "@/app/(client)/data-sync/datasyncStyle";
import MailchimpDatasync from "./MailchimpDatasync";
import OmnisendDataSync from "./OmnisendDataSync";
import SendlaneDatasync from "./SendlaneDatasync";
import S3Datasync from "./S3Datasync";
import WebhookDatasync from "./WebhookDatasync";
import SlackDatasync from "./SlackDataSync";
import GoogleADSDatasync from "./GoogleADSDataSync";
import CustomTablePagination from "@/components/CustomTablePagination";
import AttentiveIntegrationPopup from "@/components/AttentiveIntegrationPopup";
import BCommerceConnect from "@/components/Bcommerce";
import KlaviyoIntegrationPopup from "@/components/KlaviyoIntegrationPopup";
import SalesForceIntegrationPopup from "@/components/SalesForceIntegrationPopup";
import MailchimpConnect from "@/components/MailchimpConnect";
import OmnisendConnect from "@/components/OmnisendConnect";
import SendlaneConnect from "@/components/SendlaneConnect";
import S3Connect from "@/components/S3Connect";
import ShopifySettings from "@/components/ShopifySettings";
import ZapierConnectPopup from "@/components/ZapierConnectPopup";
import SlackConnectPopup from "@/components/SlackConnectPopup";
import GoogleADSConnectPopup from "@/components/GoogleADSConnectPopup";
import WebhookConnectPopup from "@/components/WebhookConnectPopup";
import { useIntegrationContext } from "@/context/IntegrationContext";
import HubspotDataSync from "./HubspotDataSync";

interface DataSyncProps {
  service_name?: string | null;
  filters?: any;
}

interface IntegrationsCredentials {
  id?: number;
  access_token?: string;
  shop_domain?: string;
  data_center?: string;
  service_name: string;
  is_with_suppression?: boolean;
  is_failed?: boolean;
}

const DataSyncList = memo(({ service_name, filters }: DataSyncProps) => {
  const { needsSync, setNeedsSync } = useIntegrationContext();
  const [order, setOrder] = useState<"asc" | "desc" | undefined>(undefined);
  const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [Loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]);
  const [klaviyoIconPopupOpen, setKlaviyoIconPopupOpen] = useState(false);
  const [salesForceIconPopupOpen, setSalesForceIconPopupOpen] = useState(false);
  const [metaIconPopupOpen, setMetaIconPopupOpen] = useState(false);
  const [mailchimpIconPopupOpen, setMailchimpIconPopupOpen] = useState(false);
  const [omnisendIconPopupOpen, setOmnisendIconPopupOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [rowsPerPageOptions, setRowsPerPageOptions] = useState<number[]>([]);
  const [sendlaneIconPopupOpen, setOpenSendlaneIconPopup] = useState(false);
  const [s3IconPopupOpen, setOpenS3IconPopup] = useState(false);
  const [webhookIconPopupOpen, setOpenWebhookIconPopup] = useState(false);
  const [hubspotIconPopupOpen, setOpenHubspotIconPopup] = useState(false);
  const [slackIconPopupOpen, setOpenSlackIconPopup] = useState(false);
  const [googleADSIconPopupOpen, setOpenGoogleADSIconPopup] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isInvalidApiKey, setIsInvalidApiKey] = useState(false);
  const [integrationsCredentials, setIntegrationsCredentials] = useState<
    IntegrationsCredentials[]
  >([]);

  const [openMetaConnect, setOpenMetaConnect] = useState(false);
  const [openKlaviyoConnect, setOpenKlaviyoConnect] = useState(false);
  const [openSalesForceConnect, setOpenSalesForceConnect] = useState(false);
  const [openAttentiveConnect, setAttentiveConnect] = useState(false);
  const [openShopifuConnect, setOpenShopifyConnect] = useState(false);
  const [openBigcommrceConnect, setOpenBigcommerceConnect] = useState(false);
  const [openOmnisendConnect, setOpenOmnisendConnect] = useState(false);
  const [openMailchimpConnect, setOpenMailchimpConnect] = useState(false);
  const [openSendlaneConnect, setOpenSendlaneConnect] = useState(false);
  const [openS3Connect, setOpenS3Connect] = useState(false);
  const [openGoogleADSConnect, setOpenGoogleADSConnect] = useState(false);
  const [openZapierConnect, setOPenZapierComnect] = useState(false);
  const [openSlackConnect, setOpenSlackConnect] = useState(false);
  const [openWebhookConnect, setOpenWebhookConnect] = useState(false);
  const handleCloseIntegrate = () => {
    setOpenMetaConnect(false);
    setOpenKlaviyoConnect(false);
    setOpenSalesForceConnect(false)
    setOpenShopifyConnect(false);
    setAttentiveConnect(false);
    setOpenBigcommerceConnect(false);
    setOpenOmnisendConnect(false);
    setOpenSendlaneConnect(false);
    setOpenS3Connect(false);
    setOPenZapierComnect(false);
    setOpenSlackConnect(false)
  };
  const handleSortRequest = (property: string) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };


  useEffect(() => {
    handleIntegrationsSync();
    setLoading(false)
  }, []);

  useEffect(() => {
    if (needsSync) {
      handleIntegrationsSync();
      setNeedsSync(false);
    }
  }, [needsSync, setNeedsSync]);

  const handleIntegrationsSync = async () => {
    try {
      setIsLoading(true);
      let params = null;
      if (service_name) {
        params = {
          service_name: service_name,
        };
      }
      const response = await axiosInstance.get("/data-sync/sync", {
        params: params,
      });
      const { length: count } = response.data;
      setAllData(response.data);
      setTotalRows(count);
      let newRowsPerPageOptions: number[] = [];
      if (count <= 10) {
        newRowsPerPageOptions = [5, 10];
      } else if (count <= 50) {
        newRowsPerPageOptions = [10, 20];
      } else if (count <= 100) {
        newRowsPerPageOptions = [10, 20, 50];
      } else if (count <= 300) {
        newRowsPerPageOptions = [10, 20, 50, 100];
      } else if (count <= 500) {
        newRowsPerPageOptions = [10, 20, 50, 100, 300];
      } else {
        newRowsPerPageOptions = [10, 20, 50, 100, 300, 500];
      }
      if (!newRowsPerPageOptions.includes(count)) {
        newRowsPerPageOptions.push(count);
        newRowsPerPageOptions.sort((a, b) => a - b);
      }
      setRowsPerPageOptions(newRowsPerPageOptions);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 403) {
        const status = error.response.data.status
        if (status === 'NEED_BOOK_CALL') {
          sessionStorage.setItem('is_slider_opened', 'true');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (allData.length !== 0) {
      if (filters) {
        const filterData = () => {
          const typeMapping: Record<string, string> = {
            "All Contacts": "allContats",
            "View Product": "viewed_product",
            "Abandoned cart": "abandoned_cart",
            Visitor: "visitor",
          };
          return Object.values(allData).filter((item) => {
            const lastSync = new Date(item.lastSync).getTime() / 1000;
            const dateMatch =
              filters.from_date === null ||
              filters.to_date === null ||
              (lastSync >= filters.from_date && lastSync <= filters.to_date);
            const statusMatch =
              filters.selectedStatus.length !== 1 ||
              (filters.selectedStatus.length === 1 &&
                filters.selectedStatus.includes(
                  item.dataSync ? "Enable" : "Disable"
                ));
            const platformMatch =
              filters.selectedFunnels.length === 0 ||
              filters.selectedFunnels
                .map((funnel: string) => funnel.toLowerCase())
                .includes(item.platform.toLowerCase());

            const itemType = item.type ? item.type.toLowerCase() : null;

            const listTypeMatch =
              filters.selectedListType.length === 0 ||
              filters.selectedListType
                .map(
                  (funnel: any) =>
                    typeMapping[funnel]?.toLowerCase() || funnel.toLowerCase()
                )
                .includes(itemType);

            return dateMatch && statusMatch && platformMatch && listTypeMatch;
          });
        };
        setData(filterData());
      } else {
        setData(allData);
      }
    }
  }, [filters, allData]);

  const statusIcon = (status: boolean) => {
    if (status)
      return <CheckCircleIcon sx={{ color: "green", fontSize: "16px" }} />;
    else
      return (
        <Tooltip
          title={"Please choose repair sync in action section."}
          placement="bottom-end"
          componentsProps={{
            tooltip: {
              sx: {
                backgroundColor: "rgba(217, 217, 217, 1)",
                color: "rgba(128, 128, 128, 1)",
                fontFamily: "Roboto",
                fontWeight: "400",
                fontSize: "10px",
                boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.12)",
                border: "0.2px solid rgba(240, 240, 240, 1)",
                borderRadius: "4px",
                maxWidth: "100%",
                padding: "8px 10px",
              },
            },
          }}
        >
          <Image
            src={"/danger-icon.svg"}
            alt="klaviyo"
            width={16}
            height={16}
          />
        </Tooltip>
      );
  };

  const platformIcon = (platform: string) => {
    switch (platform) {
      case "klaviyo":
        return (
          <Image src={"/klaviyo.svg"} alt="klaviyo" width={18} height={18} />
        );
      case "meta":
        return (
          <Image src={"/meta-icon.svg"} alt="klaviyo" width={18} height={18} />
        );
      case "omnisend":
        return (
          <Image
            src={"/omnisend_icon_black.svg"}
            alt="omnisend"
            width={18}
            height={18}
          />
        );
      case "mailchimp":
        return (
          <Image
            src={"/mailchimp-icon.svg"}
            alt="mailchimp"
            width={18}
            height={18}
          />
        );
      case "sendlane":
        return (
          <Image
            src={"/sendlane-icon.svg"}
            alt="mailchimp"
            width={18}
            height={18}
          />
        );
      case "zapier":
        return (
          <Image src={"/zapier-icon.svg"} alt="zapier" width={18} height={18} />
        );
      case "s3":
        return (
          <Image src={"/s3.svg"} alt="s3" width={18} height={18} />
        );
      case "webhook":
        return (
          <Image src={"/webhook-icon.svg"} alt="webhook" width={18} height={18} />
        );
      case "slack":
        return (
          <Image src={"/slack-icon.svg"} alt="Slack" width={18} height={18} />
        );
      case "hubspot":
        return (
          <Image src={"/hubspot.svg"} alt="hubspot" width={18} height={18} />
        );
      case "google_ads":
        return (
          <Image src={"/google-ads.svg"} alt="googleAds" width={18} height={18} />
        );
      case "sales_force":
        return (
          <Image src={"/salesforce-icon.svg"} alt="salesForce" width={18} height={18} />
        );
      default:
        return null;
    }
  };
  const handleChangePage = (
    _: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Action
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmAnchorEl, setConfirmAnchorEl] = useState<null | HTMLElement>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleClick = (event: any, id: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedId(id);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  const handleToggleSync = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInterceptorInstance.post(
        `/data-sync/sync/switch-toggle`,
        {
          list_id: String(selectedId),
        }
      );
      if (response.status === 200) {
        switch (response.data.status) {
          case "SUCCESS":
            showToast("successfully");
            setData((prevData) =>
              prevData.map((item) =>
                item.id === selectedId
                  ? { ...item, dataSync: response.data.data_sync }
                  : item
              )
            );
            break;
          case "FAILED":
            showErrorToast("Integrations sync delete failed");
            break;
          default:
            showErrorToast("Unknown response received.");
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 403) {
          showErrorToast(
            "Access denied: You do not have permission to remove this member."
          );
        }
      }
    } finally {
      setIsLoading(false);
      setSelectedId(null);
      handleClose();
    }
  };

  const handleKlaviyoIconPopupClose = async () => {
    setKlaviyoIconPopupOpen(false);
    setSelectedId(null);
    setIsEdit(false);
    try {
      const response = await axiosInstance.get(
        `/data-sync/sync?integrations_users_sync_id=${selectedId}`
      );
      if (response) {
        setData((prevData) =>
          prevData.map((item) =>
            item.id === selectedId ? { ...item, ...response.data } : item
          )
        );
      }
    } catch (error) { }
  };

  const handleSalesForceIconPopupClose = async () => {
    setSalesForceIconPopupOpen(false);
    setSelectedId(null);
    setIsEdit(false);
    try {
      const response = await axiosInstance.get(
        `/data-sync/sync?integrations_users_sync_id=${selectedId}`
      );
      if (response) {
        setData((prevData) =>
          prevData.map((item) =>
            item.id === selectedId ? { ...item, ...response.data } : item
          )
        );
      }
    } catch (error) { }
  };

  const handleMetaIconPopupClose = async () => {
    setMetaIconPopupOpen(false);
    setSelectedId(null);
    try {
      const response = await axiosInstance.get(
        `/data-sync/sync?integrations_users_sync_id=${selectedId}`
      );
      if (response) {
        setData((prevData) =>
          prevData.map((item) =>
            item.id === selectedId ? { ...item, ...response.data } : item
          )
        );
      }
    } catch (error) { }
  };

  const handleMailchimpIconPopupClose = async () => {
    setMailchimpIconPopupOpen(false);
    setSelectedId(null);
    try {
      const response = await axiosInstance.get(
        `/data-sync/sync?integrations_users_sync_id=${selectedId}`
      );
      if (response) {
        setData((prevData) =>
          prevData.map((item) =>
            item.id === selectedId ? { ...item, ...response.data } : item
          )
        );
      }
    } catch (error) { }
  };

  const handleOmnisendIconPopupClose = async () => {
    setOmnisendIconPopupOpen(false);
    setSelectedId(null);
    try {
      const response = await axiosInstance.get(
        `/data-sync/sync?integrations_users_sync_id=${selectedId}`
      );
      if (response) {
        setData((prevData) =>
          prevData.map((item) =>
            item.id === selectedId ? { ...item, ...response.data } : item
          )
        );
      }
    } catch (error) { }
  };

  const handleEdit = async () => {
    const foundItem = data.find((item) => item.id === selectedId);
    const dataSyncPlatform = foundItem ? foundItem.platform : null;
    if (dataSyncPlatform) {
      setIsEdit(true);
      if (dataSyncPlatform === "klaviyo") {
        setKlaviyoIconPopupOpen(true);
      } else if (dataSyncPlatform === "meta") {
        setMetaIconPopupOpen(true);
      } else if (dataSyncPlatform === "mailchimp") {
        setMailchimpIconPopupOpen(true);
      } else if (dataSyncPlatform === "omnisend") {
        setOmnisendIconPopupOpen(true);
      } else if (dataSyncPlatform === "sendlane") {
        setOpenSendlaneIconPopup(true);
      } else if (dataSyncPlatform === "s3") {
        setOpenS3IconPopup(true)
      } else if (dataSyncPlatform === "slack") {
        setOpenSlackIconPopup(true);
      } else if (dataSyncPlatform === "google_ads") {
        setOpenGoogleADSIconPopup(true);
      } else if (dataSyncPlatform === "webhook") {
        setOpenWebhookIconPopup(true);
      } else if (dataSyncPlatform === "hubspot") {
        setOpenHubspotIconPopup(true);
      } else if (dataSyncPlatform === "sales_force") {
        setSalesForceIconPopupOpen(true);
      }

      setIsLoading(false);
      setAnchorEl(null);
    }
  };

  const handleSendlaneIconPopupClose = () => {
    setOpenSendlaneIconPopup(false);
  };

  const handleS3IconPopupClose = () => {
    setOpenS3IconPopup(false);
  };

  const handleWebhookIconPopupClose = () => {
    setOpenWebhookIconPopup(false);
  };

  const handleHubspotIconPopupClose = () => {
    setOpenHubspotIconPopup(false);
  };

  const handleSlackIconPopupClose = () => {
    setOpenSlackIconPopup(false);
  };

  const handleGoogleADSIconPopupClose = () => {
    setOpenGoogleADSIconPopup(false);
  };

  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setConfirmAnchorEl(event.currentTarget);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInterceptorInstance.delete(
        `/data-sync/sync`,
        {
          params: {
            list_id: selectedId,
          },
        }
      );

      if (response.status === 200) {
        switch (response.data.status) {
          case "SUCCESS":
            showToast("Integrations sync delete successfully");
            setData((prevData) =>
              prevData.filter((item) => item.id !== selectedId)
            );
            break;
          case "FAILED":
            showErrorToast("Integrations sync delete failed");
            break;
          default:
            showErrorToast("Unknown response received.");
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 403) {
          showErrorToast(
            "Access denied: You do not have permission to remove this member."
          );
        }
      }
    } finally {
      setIsLoading(false);
      setSelectedId(null);
      handleClose();
    }
  };

  const handleRepairSync = async () => {
    try {
      setIsLoading(true)
      const response = await axiosInstance.get("/integrations/credentials/");
      if (response.status === 200) {
        setIntegrationsCredentials(response.data);
      }
      const foundItem = data.find((item) => item.id === selectedId);
      const dataSyncPlatform = foundItem ? foundItem.platform : null;
      if (foundItem.type_error === "Invalid API Key" || foundItem.integration_is_failed) {
        setIsInvalidApiKey(true)
        if (dataSyncPlatform) {
          if (dataSyncPlatform === "klaviyo") {
            setOpenKlaviyoConnect(true);
          } else if (dataSyncPlatform === "meta") {
            setOpenMetaConnect(true);
          } else if (dataSyncPlatform === "mailchimp") {
            setOpenMailchimpConnect(true);
          } else if (dataSyncPlatform === "omnisend") {
            setOpenOmnisendConnect(true);
          } else if (dataSyncPlatform === "sendlane") {
            setOpenSendlaneConnect(true);
          } else if (dataSyncPlatform === "s3") {
            setOpenS3Connect(true)
          } else if (dataSyncPlatform === "google_ads") {
            setOpenGoogleADSConnect(true);
          } else if (dataSyncPlatform === "webhook") {
            setOpenWebhookConnect(true);
          } else if (dataSyncPlatform === "hubspot") {
            setOpenWebhookConnect(true);
          } else if (dataSyncPlatform === "sales_force") {
            setOpenSalesForceConnect(true);
          }
          setIsLoading(false);
          setAnchorEl(null);
        }
      } else {
        if (dataSyncPlatform) {
          setIsEdit(true);
          if (dataSyncPlatform === "klaviyo") {
            setKlaviyoIconPopupOpen(true);
          } else if (dataSyncPlatform === "meta") {
            setMetaIconPopupOpen(true);
          } else if (dataSyncPlatform === "mailchimp") {
            setMailchimpIconPopupOpen(true);
          } else if (dataSyncPlatform === "omnisend") {
            setOmnisendIconPopupOpen(true);
          } else if (dataSyncPlatform === "sendlane") {
            setOpenSendlaneIconPopup(true);
          } else if (dataSyncPlatform === "google_ads") {
            setOpenGoogleADSIconPopup(true);
          } else if (dataSyncPlatform === "webhook") {
            setOpenWebhookIconPopup(true);
          } else if (dataSyncPlatform === "hubspot") {
            setOpenWebhookConnect(true);
          } else if (dataSyncPlatform === "sales_force") {
            setSalesForceIconPopupOpen(true);
          }

          setIsLoading(false);
          setAnchorEl(null);
        }
      }
    } catch (error) { }
  };

  if (Loading) {
    return (
      <CustomizedProgressBar />
    );
  }

  const formatFunnelText = (text: boolean) => {
    if (text === true) {
      return "Enable";
    }
    if (text === false) {
      return "Disable";
    }
  };

  if (service_name && data.length < 1) {
    return null;
  }

  const listType = (listType: string) => {
    switch (listType) {
      case "allContacts":
        return "All Contacts";
      case "viewed_product":
        return "View Product";
      case "converted_sales":
        return "Converted sales";
      case "visitor":
        return "Visitors";
      case "abandoned_cart":
        return "Abandoned cart";
      default:
        return null;
    }
  };

  return (
    <>
      {isLoading && <CustomizedProgressBar />}
      {service_name && (
        <>
          <Box
            display={"flex"}
            sx={{ alignItems: "center", mt: 2, mb: "16px" }}
          >
            <Box
              sx={{
                backgroundColor: "#E4E4E4",
                padding: "3px",
                borderRadius: "50%",
              }}
            />
            <Box
              sx={{
                backgroundColor: "#E4E4E4",
                border: "1px dashed #fff",
                width: "100%",
              }}
            />
            <Box
              sx={{
                backgroundColor: "#E4E4E4",
                padding: "3px",
                borderRadius: "50%",
              }}
            />
          </Box>
          <Typography
            fontSize={"16px"}
            fontWeight={600}
            fontFamily={"Nunito Sans"}
            textTransform={'capitalize'}
          >
            {service_name} Sync Detail
          </Typography>
        </>
      )}
      <Box sx={datasyncStyle.mainContent}>
        <Box
          sx={{
            width: "100%",
            pl: 0.5,
            pt: 3,
            pr: 1,
            "@media(max-width: 440px)": {
              marginTop: "16px",
              pr: 0,
              pl: 0,
            },
          }}
        >
          <TableContainer
            component={Paper}
            sx={{
              border: "1px solid rgba(235, 235, 235, 1)",
              overflowY: "auto",
              height: '73vh'
            }}
          >
            <Table stickyHeader aria-label="datasync table" >
              <TableHead>
                <TableRow>
                  {[
                    { key: "list_name", label: "List Name" },
                    { key: "list_type", label: "List Type" },
                    { key: "number_of_contacts", label: "No. of Contacts" },
                    { key: "created_by", label: "Created By" },
                    {
                      key: "created_date",
                      label: "Created Date",
                      sortable: true,
                    },
                    { key: "platform", label: "Platform" },
                    { key: "data_sync", label: "Data Sync" },
                    { key: "last_sync", label: "Last Sync" },
                    { key: "sync_status", label: "Sync Status" },
                    { key: "action", label: "Action" },
                  ].map(({ key, label, sortable = false }) => (
                    <TableCell
                      key={key}
                      sx={{
                        ...datasyncStyle.table_column,
                        backgroundColor: "#fff",
                        ...(key === "list_name" && {
                          position: "sticky",
                          left: 0,
                          zIndex: 99,
                        }),
                        ...(key === "action" && {
                          "::after": {
                            content: "none",
                          },
                        }),
                      }}
                      onClick={
                        sortable ? () => handleSortRequest(key) : undefined
                      }
                      style={{ cursor: sortable ? "pointer" : "default" }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography
                          variant="body2"
                          sx={{ ...leadsStyles.table_column, borderRight: "0" }}
                        >
                          {label}
                        </Typography>
                        {sortable && orderBy === key && (
                          <IconButton size="small" sx={{ ml: 1 }}>
                            {order === "asc" ? (
                              <ArrowUpwardIcon fontSize="inherit" />
                            ) : (
                              <ArrowDownwardIcon fontSize="inherit" />
                            )}
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow sx={datasyncStyle.tableBodyRow}>
                    <TableCell
                      colSpan={11}
                      sx={{
                        ...datasyncStyle.tableBodyColumn,
                        textAlign: "center",
                        paddingTop: "18px",
                        paddingBottom: "18px",
                      }}
                    >
                      No data synchronization available
                    </TableCell>
                  </TableRow>
                ) : (
                  data
                    .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
                    .map((row, index) => (
                      <TableRow
                        key={row.id}
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(247, 247, 247, 1)",
                            "& .sticky-cell": {
                              backgroundColor: "rgba(247, 247, 247, 1)",
                            },
                          },
                        }}
                      >
                        <TableCell
                          className="sticky-cell"
                          sx={{
                            ...datasyncStyle.table_array,
                            position: "sticky",
                            left: "0",
                            zIndex: 9,
                            backgroundColor: "#fff",
                          }}
                        >
                          {row.name || "--"}
                        </TableCell>
                        <TableCell sx={datasyncStyle.table_array}>
                          {listType(row.type) || "--"}
                        </TableCell>
                        <TableCell sx={datasyncStyle.table_array}>
                          {row.contacts || "--"}
                        </TableCell>
                        <TableCell sx={datasyncStyle.table_array}>
                          {row.createdBy || "--"}
                        </TableCell>
                        <TableCell sx={datasyncStyle.table_array}>
                          {row.createdDate || "--"}
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              padding: "2px 8px",
                              borderRadius: "2px",
                              justifyContent: "center",
                              textTransform: "capitalize",
                            }}
                          >
                            {platformIcon(row.platform) || "--"}
                          </Box>
                        </TableCell>
                        <TableCell sx={datasyncStyle.table_array}>
                          <Box
                            sx={{
                              display: "flex",
                              borderRadius: "2px",
                              justifyContent: "start",
                              textTransform: "capitalize",
                            }}
                          >
                            <Typography
                              className="paragraph"
                              sx={{
                                fontFamily: "Roboto",
                                fontSize: "12px",
                                color: row.dataSync
                                  ? "rgba(43, 91, 0, 1) !important"
                                  : "rgba(74, 74, 74, 1)!important",
                                backgroundColor: row.dataSync
                                  ? "rgba(234, 248, 221, 1) !important"
                                  : "rgba(219, 219, 219, 1) !important",
                                padding: "3px 14.5px",
                                maxHeight: "1.25rem",
                              }}
                            >
                              {formatFunnelText(row.dataSync) || "--"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={datasyncStyle.table_array}>
                          {row.lastSync || "--"}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...datasyncStyle.table_column,
                            position: "relative",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              padding: "2px 8px",
                              borderRadius: "2px",
                              justifyContent: "center",
                            }}
                          >
                            {statusIcon(row.integration_is_failed ? false : row.syncStatus) || "--"}

                          </Box>
                        </TableCell>
                        <TableCell sx={datasyncStyle.table_array}>
                          <Box
                            sx={{
                              display: "flex",
                              padding: "2px 8px",
                              borderRadius: "2px",
                              alignItems: "center",
                              justifyContent: "space-between",
                              textTransform: "capitalize",
                              paddingLeft: 0,
                            }}
                          >
                            {row.suppression}
                            <IconButton
                              sx={{
                                padding: 0,
                                margin: 0,
                                borderRadius: 4,
                                justifyContent: "start",
                              }}
                              onClick={(e) => handleClick(e, row.id)}
                            >
                              <Image
                                src={"more.svg"}
                                alt="more"
                                width={20}
                                height={20}
                              />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Popover
            id={id}
            open={open}
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
                    color: "rgba(80, 82, 178, 1)",
                    backgroundColor: "background: rgba(80, 82, 178, 0.1)",
                  },
                }}
                onClick={handleToggleSync}
              >
                {data.find((row) => row.id === selectedId)?.dataSync === true
                  ? "Disable Sync"
                  : "Enable Sync"}
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
                    color: "rgba(80, 82, 178, 1)",
                    backgroundColor: "background: rgba(80, 82, 178, 0.1)",
                  },
                }}
                onClick={handleEdit}
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
                    color: "rgba(80, 82, 178, 1)",
                    backgroundColor: "background: rgba(80, 82, 178, 0.1)",
                  },
                }}
                onClick={handleDeleteClick}
              >
                Delete
              </Button>
              <>
                <Popover
                  open={isConfirmOpen}
                  anchorEl={confirmAnchorEl}
                  onClose={() => setIsConfirmOpen(false)}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "center",
                  }}
                  PaperProps={{
                    sx: {
                      padding: "0.125rem",
                      width: "15.875rem",
                      boxShadow: 0,
                      borderRadius: "8px",
                      border: "0.5px solid rgba(175, 175, 175, 1)",
                    },
                  }}
                >
                  <Typography className="first-sub-title" sx={{ paddingLeft: 2, pt: 1, pb: 0 }}>
                    Confirm Deletion
                  </Typography>
                  <DialogContent sx={{ padding: 2 }}>
                    <DialogContentText className="table-data">
                      Are you sure you want to delete this list data?
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button
                      className="second-sub-title"
                      onClick={() => setIsConfirmOpen(false)}
                      sx={{
                        backgroundColor: "#fff",
                        color: "rgba(80, 82, 178, 1) !important",
                        fontSize: "14px",
                        textTransform: "none",
                        padding: "0.75em 1em",
                        border: "1px solid rgba(80, 82, 178, 1)",
                        maxWidth: "50px",
                        maxHeight: "30px",
                        "&:hover": {
                          backgroundColor: "#fff",
                          boxShadow: "0 2px 2px rgba(0, 0, 0, 0.3)",
                        },
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="second-sub-title"
                      onClick={() => {
                        handleDelete();
                        setIsConfirmOpen(false);
                      }}
                      sx={{
                        backgroundColor: "rgba(80, 82, 178, 1)",
                        color: "#fff !important",
                        fontSize: "14px",
                        textTransform: "none",
                        padding: "0.75em 1em",
                        border: "1px solid rgba(80, 82, 178, 1)",
                        maxWidth: "60px",
                        maxHeight: "30px",
                        "&:hover": {
                          backgroundColor: "rgba(80, 82, 178, 1)",
                          boxShadow: "0 2px 2px rgba(0, 0, 0, 0.3)",
                        },
                      }}
                    >
                      Delete
                    </Button>
                  </DialogActions>
                </Popover>
              </>
              {data.find((row) => row.id === selectedId)?.syncStatus ===
                false && (
                  <Button
                    sx={{
                      justifyContent: "flex-start",
                      width: "100%",
                      color: "rgba(32, 33, 36, 1)",
                      textTransform: "none",
                      fontFamily: "Nunito Sans",
                      fontSize: "14px",
                      fontWeight: 600,
                      ":hover": {
                        color: "rgba(80, 82, 178, 1)",
                        backgroundColor: "background: rgba(80, 82, 178, 0.1)",
                      },
                    }}
                    onClick={handleRepairSync}
                  >
                    Repair Sync
                  </Button>
                )}
            </Box>
          </Popover>
          {totalRows > 10 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "16px",
              }}
            >
              <CustomTablePagination
                count={totalRows}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={rowsPerPageOptions}
              />
            </Box>
          )}
        </Box>
        {klaviyoIconPopupOpen && isEdit === true && (
          <>
            <ConnectKlaviyo
              open={klaviyoIconPopupOpen}
              onClose={handleKlaviyoIconPopupClose}
              data={data.find((item) => item.id === selectedId)}
              isEdit={isEdit}
            />
          </>
        )}
        {salesForceIconPopupOpen && isEdit === true && (
          <>
            <ConnectSalesForce
              open={salesForceIconPopupOpen}
              onClose={handleSalesForceIconPopupClose}
              data={data.find((item) => item.id === selectedId)}
              isEdit={isEdit}
            />
          </>
        )}
        {metaIconPopupOpen && isEdit === true && (
          <>
            <ConnectMeta
              open={metaIconPopupOpen}
              onClose={handleMetaIconPopupClose}
              data={data.find((item) => item.id === selectedId)}
              isEdit={isEdit}
            />
          </>
        )}

        {mailchimpIconPopupOpen && isEdit === true && (
          <>
            <MailchimpDatasync
              open={mailchimpIconPopupOpen}
              onClose={handleMailchimpIconPopupClose}
              data={data.find((item) => item.id === selectedId)}
              isEdit={isEdit}
            />
          </>
        )}
        {omnisendIconPopupOpen && isEdit === true && (
          <>
            <OmnisendDataSync
              open={omnisendIconPopupOpen}
              isEdit={isEdit}
              onClose={handleOmnisendIconPopupClose}
              data={data.find((item) => item.id === selectedId)}
              boxShadow="rgba(0, 0, 0, 0.01)"
            />
          </>
        )}
        {sendlaneIconPopupOpen && isEdit && (
          <>
            <SendlaneDatasync
              open={sendlaneIconPopupOpen}
              isEdit={isEdit}
              onClose={handleSendlaneIconPopupClose}
              data={data.find((item) => item.id === selectedId)}
            />
          </>
        )}
        {s3IconPopupOpen && isEdit && (
          <>
            <S3Datasync
              open={s3IconPopupOpen}
              isEdit={isEdit}
              onClose={handleS3IconPopupClose}
              data={data.find((item) => item.id === selectedId)}
            />
          </>
        )}
        {webhookIconPopupOpen && isEdit && (
          <>
            <WebhookDatasync
              open={webhookIconPopupOpen}
              isEdit={isEdit}
              onClose={handleWebhookIconPopupClose}
              data={data.find((item) => item.id === selectedId)}
            />
          </>
        )}
        {hubspotIconPopupOpen && isEdit && (
          <>
            <HubspotDataSync
              open={hubspotIconPopupOpen}
              isEdit={isEdit}
              onClose={handleHubspotIconPopupClose}
              data={data.find((item) => item.id === selectedId)}
            />
          </>
        )}
        {slackIconPopupOpen && isEdit && (
          <>
            <SlackDatasync
              open={slackIconPopupOpen}
              isEdit={isEdit}
              onClose={handleSlackIconPopupClose}
              data={data.find((item) => item.id === selectedId)}
            />
          </>
        )}
        {googleADSIconPopupOpen && isEdit && (
          <>
            <GoogleADSDatasync
              open={googleADSIconPopupOpen}
              isEdit={isEdit}
              onClose={handleGoogleADSIconPopupClose}
              data={data.find((item) => item.id === selectedId)}
            />
          </>
        )}
        {/*
        <AttentiveIntegrationPopup open={openAttentiveConnect} handleClose={() => setOpenShopifyConnect(false)} onSave={saveIntegration}/>
        <ShopifySettings open={openShopifuConnect} handleClose={() => setOpenShopifyConnect(false)} onSave={saveIntegration} />
        <BCommerceConnect 
                    open={openBigcommrceConnect} 
                    onClose={() => setOpenBigcommerceConnect(false)}
                />
         */}
        <MailchimpConnect open={openMailchimpConnect} handleClose={() => { setOpenMailchimpConnect(false), setIsInvalidApiKey(false) }}
          initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'mailchimp')?.access_token} invalid_api_key={isInvalidApiKey} boxShadow="rgba(0, 0, 0, 0.01)" />
        <KlaviyoIntegrationPopup open={openKlaviyoConnect} handleClose={() => { setOpenKlaviyoConnect(false), setIsInvalidApiKey(false) }}
          initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'klaviyo')?.access_token} invalid_api_key={isInvalidApiKey} boxShadow="rgba(0, 0, 0, 0.01)" />
        <SalesForceIntegrationPopup open={openSalesForceConnect} handleClose={() => { setOpenSalesForceConnect(false), setIsInvalidApiKey(false) }}
          initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'sales_force')?.access_token} invalid_api_key={isInvalidApiKey} boxShadow="rgba(0, 0, 0, 0.01)" />
        <OmnisendConnect open={openOmnisendConnect} handleClose={() => { setOpenOmnisendConnect(false), setIsInvalidApiKey(false) }}
          initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'omnisend')?.access_token} invalid_api_key={isInvalidApiKey} boxShadow="rgba(0, 0, 0, 0.01)" />
        <SendlaneConnect
          open={openSendlaneConnect}
          handleClose={() => { setOpenSendlaneConnect(false), setIsInvalidApiKey(false) }}
          initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'sendlane')?.access_token} invalid_api_key={isInvalidApiKey} boxShadow="rgba(0, 0, 0, 0.01)"
        />
        <S3Connect
          open={openS3Connect}
          handleClose={() => { setOpenS3Connect(false), setIsInvalidApiKey(false) }}
          initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 's3')?.access_token} invalid_api_key={isInvalidApiKey} boxShadow="rgba(0, 0, 0, 0.01)"
        />
        <SlackConnectPopup
          open={openSlackConnect}
          handlePopupClose={() => { setOpenSlackConnect(false), setIsInvalidApiKey(false) }}
          initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'slack')?.access_token} invalid_api_key={isInvalidApiKey} boxShadow="rgba(0, 0, 0, 0.01)"
        />
        <GoogleADSConnectPopup
          open={openGoogleADSConnect}
          handlePopupClose={() => { setOpenGoogleADSConnect(false), setIsInvalidApiKey(false) }}
          initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'google_ads')?.access_token} invalid_api_key={isInvalidApiKey} boxShadow="rgba(0, 0, 0, 0.01)"
        />
        <WebhookConnectPopup open={openWebhookConnect} handleClose={() => { setOpenWebhookConnect(false), setIsInvalidApiKey(false) }}
          initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'webhook')?.access_token} invalid_api_key={isInvalidApiKey} boxShadow="rgba(0, 0, 0, 0.01)" />
        <ZapierConnectPopup
          open={openZapierConnect}
          handlePopupClose={handleCloseIntegrate}
          invalid_api_key={isInvalidApiKey}
          boxShadow="rgba(0, 0, 0, 0.01)"
        />
      </Box>
    </>
  );
});

DataSyncList.displayName = 'DataSyncList';

export default DataSyncList;
