"use client";
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
} from "@mui/material";
import { useState, useEffect } from "react";
import { datasyncStyle } from "./datasyncStyle";
import CustomTooltip from "@/components/customToolTip";
import FilterListIcon from "@mui/icons-material/FilterList";
import Image from "next/image";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { leadsStyles } from "../leads/leadsStyles";

const DataSync: React.FC = () => {
  const [order, setOrder] = useState<"asc" | "desc" | undefined>(undefined);
  const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  const handleSortRequest = (property: string) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleResetFilters = async () => {
    try {
      setIsLoading(true)
      const response = await axiosInstance.get('/integrations/sync');

      setData(response.data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
    finally {
      setIsLoading(false)
    }
  };

  useEffect(() => {
    handleResetFilters();
  }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircleIcon sx={{ color: "green", fontSize: "16px" }} />;
      case "error":
        return (
          <Tooltip
            title={"Please choose repair sync in action section."}
            placement='bottom-end'
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
      default:
        return null;
    }
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
      default:
        return null;
    }
  };

  // Action
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

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

  const handleToggleSync = () => {
    console.log(`Toggling sync for id: ${selectedId}`);
    handleClose();
  };

  const handleEdit = () => {
    console.log(`Editing item with id: ${selectedId}`);
    handleClose();
  };

  const handleDelete = () => {
    console.log(`Deleting item with id: ${selectedId}`);
    handleClose();
  };

  const handleRepairSync = () => {
    console.log(`Repairing sync for id: ${selectedId}`);
    handleClose();
  };

  if (isLoading) {
    return <CustomizedProgressBar />;
  }

  const formatFunnelText = (text: boolean) => {
    if (text === false) {
      return 'Enable';
    }
    if (text === true) {
      return 'Disable';
    }
  };

  return (
    <Box sx={datasyncStyle.mainContent}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          mt: 2,
          ml: 1,
          pr: 1.5,
          "@media (max-width: 600px)": {
            flexDirection: "column",
            display: "flex",
            alignItems: "flex-start",
          },
          "@media (max-width: 440px)": {
            flexDirection: "column",
            pt: 8,
            justifyContent: "flex-start",
          },
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 1,
            "@media (max-width: 600px)": { mb: 2 },
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
            Data Sync
          </Typography>
          <CustomTooltip
            title={"how data synch works and to customise your sync settings."}
            linkText="Learn more"
            linkUrl="https://maximiz.ai"
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "15px",
            "@media (max-width: 900px)": {
              gap: "8px",
            },
          }}
        >
          <Button
            // onClick={handleAudiencePopupOpen}
            aria-haspopup="true"
            disabled={true}
            sx={{
              textTransform: "none",
              //color: status === 'PIXEL_INSTALLATION_NEEDED' ? 'rgba(128, 128, 128, 1)' : 'rgba(80, 82, 178, 1)',
              border: "1px solid rgba(80, 82, 178, 0.4)",
              borderRadius: "4px",
              padding: "9px 16px",
              opacity: "0.4",
              minWidth: "auto",
              "@media (max-width: 900px)": {
                display: "none",
              },
            }}
          >
            <Typography
              sx={{
                fontFamily: "Nunito Sans",
                fontWeight: "normal",
                marginRight: "0.5em",
                padding: 0.2,
                fontSize: "14px !important",
                textAlign: "left",
                opacity: 0.4,
                color: "#5052B2 !important",
              }}
            >
              Prospect
            </Typography>
          </Button>
          <Button
            //onClick={handleFilterPopupOpen}
            //aria-controls={dropdownOpen ? 'account-dropdown' : undefined}
            aria-haspopup="true"
            //aria-expanded={dropdownOpen ? 'true' : undefined}
            sx={{
              textTransform: "none",
              //selectedFilters.length > 0 ? 'rgba(80, 82, 178, 1)' :
              color: "rgba(128, 128, 128, 1)",
              //selectedFilters.length > 0 ? '1px solid rgba(80, 82, 178, 1)' :
              border: "1px solid rgba(184, 184, 184, 1)",
              borderRadius: "4px",
              padding: "8px",
              //opacity: status === "PIXEL_INSTALLATION_NEEDED" ? "0.5" : "1",
              minWidth: "auto",
              position: "relative",
              "@media (max-width: 900px)": {
                border: "none",
                padding: 0,
              },
            }}
          >
            <FilterListIcon
              fontSize="medium"
              sx={{
                //selectedFilters.length > 0 ? 'rgba(80, 82, 178, 1)' :
                color: "rgba(128, 128, 128, 1)",
              }}
            />
          </Button>
          <Button
            //onClick={handleFilterPopupOpen}
            //aria-controls={dropdownOpen ? 'account-dropdown' : undefined}
            aria-haspopup="true"
            //aria-expanded={dropdownOpen ? 'true' : undefined}
            sx={{
              textTransform: "none",
              //color: selectedFilters.length > 0 ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)',
              border: "1px solid rgba(80, 82, 178, 1)",
              borderRadius: "4px",
              padding: "10px",
              //opacity: status === "PIXEL_INSTALLATION_NEEDED" ? "0.5" : "1",
              minWidth: "auto",
              position: "relative",
              "@media (max-width: 900px)": {
                border: "none",
                padding: 0,
              },
            }}
          >
            <Image src="/plane.svg" alt="plane" height={20} width={20} />
          </Button>
        </Box>
      </Box>
      <Box sx={{ width: "100%", pl: 0.5, pt: 3, pr: 1 }}>
        <TableContainer
          component={Paper}
          sx={{
            border: "1px solid rgba(235, 235, 235, 1)",
            overflowY: "auto",
          }}
        >
          <Table>
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
                  { key: "account_id", label: "Account ID" },
                  { key: "data_sync", label: "Data Sync" },
                  { key: "last_sync", label: "Last Sync" },
                  { key: "sync_status", label: "Sync Status" },
                  { key: "suppression", label: "Suppression" },
                ].map(({ key, label, sortable = false }) => (
                  <TableCell
                    key={key}
                    sx={{
                      ...datasyncStyle.table_column,
                      position: "relative",
                      ...(key === "list_name" && {
                        position: "sticky",
                        left: 0,
                        zIndex: 99,
                      }),
                      ...(key === "suppression" && {
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
              {data.map((row, index) => (
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
                      backgroundColor: "rgba(255, 255, 255, 1)",
                    }}
                  >
                    {row.name}
                  </TableCell>
                  <TableCell sx={datasyncStyle.table_array}>
                    {row.type}
                  </TableCell>
                  <TableCell sx={datasyncStyle.table_array}>
                    {row.contacts}
                  </TableCell>
                  <TableCell sx={datasyncStyle.table_array}>
                    {row.createdBy}
                  </TableCell>
                  <TableCell sx={datasyncStyle.table_array}>
                    {row.createdDate}
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
                      {platformIcon(row.platform)}
                    </Box>
                  </TableCell>
                  <TableCell sx={datasyncStyle.table_array}>
                    {row.accountId}
                  </TableCell>
                  <TableCell sx={datasyncStyle.table_array}>
                    <Box
                      sx={{
                        display: "flex",
                        padding: "2px 8px",
                        borderRadius: "2px",
                        justifyContent: "center",
                        textTransform: "capitalize",
                      }}
                    >
                      <Typography
                        className="paragraph"
                        sx={{
                          fontFamily: "Roboto",
                          fontSize: "12px",
                          color:
                            row.dataSync === true
                              ? "rgba(43, 91, 0, 1) !important"
                              : "rgba(74, 74, 74, 1)!important",
                          backgroundColor:
                            row.dataSync === true
                              ? "rgba(234, 248, 221, 1) !important"
                              : "rgba(219, 219, 219, 1) !important",
                          padding: "3px 14.5px",
                          maxHeigh: "1.25rem",
                        }}
                      >
                         {formatFunnelText(row.dataSync)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={datasyncStyle.table_array}>
                    {row.lastSync}
                  </TableCell>
                  <TableCell
                    sx={{ ...datasyncStyle.table_column, position: "relative" }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        padding: "2px 8px",
                        borderRadius: "2px",
                        justifyContent: "center",
                      }}
                    >
                      {statusIcon(row.syncStatus)}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ ...datasyncStyle.table_array }}>
                    <Box
                      sx={{
                        display: "flex",
                        padding: "2px 8px",
                        borderRadius: "2px",
                        alignItems: "center",
                        justifyContent: "space-between",
                        textTransform: "capitalize",
                      }}
                    >
                      {row.suppression}
                      <IconButton
                        sx={{ padding: 0, margin: 0, borderRadius: 4 }}
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
              ))}
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
              onClick={handleDelete}
            >
              Delete
            </Button>
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
          </Box>
        </Popover>
      </Box>
    </Box>
  );
};

const DatasyncPage: React.FC = () => {
  return <DataSync />;
};

export default DatasyncPage;
