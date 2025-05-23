"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  List,
  ListItemText,
  ListItemButton,
  Popover,
  DialogActions,
  DialogContent,
  DialogContentText,
  Tooltip,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import dayjs from "dayjs";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import ThreeDotsLoader from "../components/ThreeDotsLoader";
import { useNotification } from "@/context/NotificationContext";
import { useSSE } from "../../../../context/SSEContext";
import { MoreVert } from "@mui/icons-material";
import { SliderProvider } from "../../../../context/SliderContext";
import ProgressBar from "../components/ProgressLoader";
import { showToast, showErrorToast } from "@/components/ToastNotification";
import HintCard from "../../components/HintCard";
import { useSourcesHints } from "../context/SourcesHintsContext";
import { createdHintCards } from "../context/hintsCardsContent";

interface Source {
  id: string;
  name: string;
  target_schema: string;
  source_origin: string;
  source_type: string;
  created_at: Date;
  domain: string;
  created_by: string;
  processed_records: number;
  total_records: number;
  matched_records: number;
  matched_records_status: string;
}

const SourcesList: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const data = searchParams.get("data");
  const createdSource = data ? JSON.parse(data) : null;
  const { hasNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [createdData, setCreatedData] = useState<Source>(createdSource);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [anchorElFullName, setAnchorElFullName] =
    React.useState<null | HTMLElement>(null);
  const [selectedName, setSelectedName] = React.useState<string | null>(null);
  const { sourceProgress } = useSSE();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { changeCreatedSourceHint, createdSourceHints, resetCreatedSourceHints } = useSourcesHints();

  const isOpenFullName = Boolean(anchorElFullName);

  const handleOpenPopoverFullName = (
    event: React.MouseEvent<HTMLElement>,
    industry: string
  ) => {
    setSelectedName(industry);
    setAnchorElFullName(event.currentTarget);
  };

  const handleClosePopoverFullName = () => {
    setAnchorElFullName(null);
    setSelectedName(null);
  };

  useEffect(() => {
    console.log("longpol");

    if (!intervalRef.current) {
      console.log("longpol started");
      intervalRef.current = setInterval(() => {
        const hasPending = createdData?.matched_records_status === "pending";

        if (hasPending) {
          console.log("Fetching due to pending records");

          fetchData();
        } else {
          console.log("No pending records, stopping interval");
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, 2000);
    }

    // useEffect(() => {
    //   resetCreatedSourceHints()
    // }, [])

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log("interval cleared");
      }
    };
  }, [createdData]);

  const fetchData = async () => {
    try {
      const response = await axiosInstance.get(
        `/audience-sources/get-processing-source?&id=${createdData.id}`
      );
      const updatedItem = response.data;

      setCreatedData(updatedItem);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const isOpen = Boolean(anchorEl);

  const setSourceOrigin = (sourceOrigin: string) => {
    return sourceOrigin === "pixel" ? "Pixel" : "CSV File";
  };

  const handleDeleteSource = async () => {
    setLoading(true);
    try {
      if (createdData && createdData.id) {
        const response = await axiosInstance.delete(
          `/audience-sources/${createdData.id}`
        );
        if (response.status === 200 && response.data) {
          showToast("Source successfully deleted!");
          router.push("/sources");
        }
      }
    } catch {
      showErrorToast("Error deleting source");
    } finally {
      setLoading(false);
      handleCloseConfirmDialog();
      handleClosePopover();
    }
  };

  const handleOpenConfirmDialog = () => {
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  const setSourceType = (sourceType: string) => {
    return sourceType
      .split(",")
      .map((item) =>
        item
          .split("_")
          .map((subItem) => subItem.charAt(0).toUpperCase() + subItem.slice(1))
          .join(" ")
      )
      .join(", ");
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const buttonClickAllSources = () => {
    if (sessionStorage.getItem("filtersBySource")) {
      sessionStorage.setItem("filtersBySource", JSON.stringify({}));
    }
    router.push("/sources");
  };

  const isCreateDisabled =
    createdData?.processed_records === 0 ||
    createdData?.processed_records !== createdData?.total_records ||
    createdData?.matched_records === 0;

  return (
    <>
      {loading && <CustomizedProgressBar />}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          height: "calc(100vh - 4.25rem)",
          pr: 2,
          "@media (max-width: 900px)": {
            height: "calc(100vh - 4.25rem)",
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: hasNotification ? "1rem" : "0.5rem",
              flexWrap: "wrap",
              pl: "0.5rem",
              gap: "15px",
              mt: 3,
              "@media (max-width: 900px)": {
                marginTop: hasNotification ? "3rem" : "1rem",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography className="first-sub-title">
                Created Source
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "15px",
                pt: "4px",
                "@media (max-width: 900px)": {
                  gap: "8px",
                },
              }}
            >
              <Box sx={{display: "block", position: "relative"}}>
                <Button
                  variant="outlined"
                  sx={{
                    height: "40px",
                    borderRadius: "4px",
                    textTransform: "none",
                    fontSize: "14px",
                    lineHeight: "19.6px",
                    fontWeight: "500",
                    color: "rgba(56, 152, 252, 1)",
                    borderColor: "rgba(56, 152, 252, 1)",
                    "&:hover": {
                      backgroundColor: "rgba(80, 82, 178, 0.1)",
                      borderColor: "rgba(56, 152, 252, 1)",
                    },
                  }}
                  onClick={() => {
                    router.push("/sources/builder");
                  }}
                >
                  Add Another Source
                </Button>

                <HintCard
                  card={createdHintCards[2]}
                  positionLeft={-420}
                  positionTop={20}
                  rightSide={true}
                  isOpenBody={createdSourceHints[2].showBody}
                  toggleClick={() => {
                    if (createdSourceHints[1].showBody) {
                      changeCreatedSourceHint(1, "showBody", "close")
                    }
                    if (createdSourceHints[0].showBody) {
                      changeCreatedSourceHint(0, "showBody", "close")
                    }
                    changeCreatedSourceHint(2, "showBody", "toggle")
                  }}
                  closeClick={() => {
                    changeCreatedSourceHint(2, "showBody", "close")
                  }}
                />

              </Box>
            </Box>
          </Box>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: hasNotification ? "1rem" : "0.5rem",
                flexWrap: "wrap",
                pl: "0.5rem",
                gap: "15px",
                "@media (max-width: 900px)": {
                  marginTop: hasNotification ? "3rem" : "1rem",
                },
              }}
            ></Box>
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                maxWidth: "100%",
                pl: 0,
                pr: 0,
                pt: "14px",
                pb: "20px",
                "@media (max-width: 900px)": {
                  pt: "2px",
                  pb: "18px",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  padding: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  "@media (max-width: 900px)": {
                    alignItems: "start",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 5,
                    width: "100%",
                    justifyContent: "space-between",
                    "@media (max-width: 900px)": {
                      flexDirection: "column",
                      gap: 2,
                    },
                  }}
                >
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Typography variant="body2" className="table-heading">
                      Name
                    </Typography>
                    <Typography variant="subtitle1" className="table-data">
                      {createdData?.name}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Typography variant="body2" className="table-heading">
                      Target Type
                    </Typography>
                    <Typography variant="subtitle1" className="table-data">
                      {createdData?.target_schema.toUpperCase()}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Typography
                      variant="body2"
                      className="table-heading"
                      sx={{ textAlign: "left" }}
                    >
                      Source
                    </Typography>
                    <Typography variant="subtitle1" className="table-data">
                      {setSourceOrigin(createdData?.source_origin)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Typography
                      variant="body2"
                      className="table-heading"
                      sx={{ textAlign: "left" }}
                    >
                      Domain
                    </Typography>
                    <Typography variant="subtitle1" className="table-data">
                      {createdData?.domain ?? "--"}
                    </Typography>
                  </Box>

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Typography variant="body2" className="table-heading">
                      Type
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      className="table-data"
                      sx={{ cursor: "pointer" }}
                      onClick={(e) =>
                        createdData?.source_type
                          ? handleOpenPopoverFullName(
                            e,
                            setSourceType(createdData?.source_type)
                          )
                          : {}
                      }
                    >
                      <Tooltip
                        title={
                          <Box
                            sx={{
                              backgroundColor: "#fff",
                              margin: 0,
                              padding: 0,
                              display: "flex",
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <Typography
                              className="table-data"
                              component="div"
                              sx={{ fontSize: "12px !important" }}
                            >
                              {setSourceType(createdData?.source_type)}
                            </Typography>
                          </Box>
                        }
                        sx={{ marginLeft: "0.5rem !important" }}
                        componentsProps={{
                          tooltip: {
                            sx: {
                              backgroundColor: "#fff",
                              color: "#000",
                              boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.12)",
                              border: "0.2px solid rgba(255, 255, 255, 1)",
                              borderRadius: "4px",
                              maxHeight: "100%",
                              maxWidth: "500px",
                              padding: "11px 10px",
                              marginLeft: "0.5rem !important",
                            },
                          },
                        }}
                        placement="right"
                      >
                        <Typography
                          className="table-data"
                          sx={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "150px",
                          }}
                        >
                          {truncateText(
                            setSourceType(createdData?.source_type),
                            20
                          )}
                        </Typography>
                      </Tooltip>
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Typography
                      variant="body2"
                      className="table-heading"
                      sx={{ textAlign: "left" }}
                    >
                      Created By
                    </Typography>
                    <Typography variant="subtitle1" className="table-data">
                      {createdData?.created_by}
                    </Typography>
                  </Box>

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Typography variant="body2" className="table-heading">
                      Created Date
                    </Typography>
                    <Typography variant="subtitle1" className="table-data">
                      {dayjs(createdData?.created_at).isValid()
                        ? dayjs(createdData?.created_at).format("MMM D, YYYY")
                        : "--"}
                    </Typography>
                  </Box>

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Typography variant="body2" className="table-heading">
                      Number of Customers
                    </Typography>
                    <Typography variant="subtitle1" className="table-data">
                      {createdData.matched_records_status === "complete" && createdData?.total_records === 0 ?
                        (
                          "0"
                        ) :
                        (sourceProgress[createdData.id]?.total &&
                          sourceProgress[createdData.id]?.total > 0) ||
                          createdData?.total_records > 0 ? (
                          sourceProgress[createdData.id]?.total > 0 ? (
                            sourceProgress[createdData.id]?.total.toLocaleString(
                              "en-US"
                            )
                          ) : (
                            createdData?.total_records?.toLocaleString("en-US")
                          )
                        ) : (
                          <ThreeDotsLoader />
                        )}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Typography
                      variant="body2"
                      className="table-heading"
                      sx={{ textAlign: "left" }}
                    >
                      Matched Records
                    </Typography>
                    <Typography variant="subtitle1" className="table-data">
                      {createdData.matched_records_status === "complete" && createdData?.total_records === 0 ?
                        (
                          "0"
                        ) : (
                          createdData?.id &&
                          sourceProgress[createdData.id]?.processed &&
                          sourceProgress[createdData.id]?.processed ==
                          sourceProgress[createdData.id]?.total) ||
                          (createdData?.processed_records ==
                            createdData?.total_records &&
                            createdData?.processed_records !== 0) ? (
                          sourceProgress[createdData.id]?.matched >
                            createdData?.matched_records ? (
                            sourceProgress[
                              createdData.id
                            ]?.matched.toLocaleString("en-US")
                          ) : (
                            createdData.matched_records.toLocaleString("en-US")
                          )
                        ) : createdData?.processed_records !== 0 ? (
                          <ProgressBar
                            progress={{
                              total: createdData?.total_records,
                              processed: createdData?.processed_records,
                              matched: createdData?.matched_records,
                            }}
                          />
                        ) : (
                          <ProgressBar
                            progress={sourceProgress[createdData.id]}
                          />
                        )}
                    </Typography>
                  </Box>
                  {/* need chnage < on !== */}
                  <Box sx={{position: "relative"}}>
                    <IconButton
                      onClick={(event) => handleOpenPopover(event)}
                      sx={{
                        "@media (max-width: 900px)": { display: "none" },
                        ":hover": { backgroundColor: "transparent" },
                      }}
                    >
                      <MoreVert
                        sx={{ color: "rgba(32, 33, 36, 1)" }}
                        height={8}
                        width={24}
                      />
                    </IconButton>

                    <HintCard
                      card={createdHintCards[0]}
                      positionLeft={-420}
                      positionTop={20}
                      rightSide={true}
                      isOpenBody={createdSourceHints[0].showBody}
                      toggleClick={() => {
                        if (createdSourceHints[1].showBody) {
                          changeCreatedSourceHint(1, "showBody", "close")
                        }
                        if (createdSourceHints[2].showBody) {
                          changeCreatedSourceHint(2, "showBody", "close")
                        }
                        changeCreatedSourceHint(0, "showBody", "toggle")
                      }}
                      closeClick={() => {
                        changeCreatedSourceHint(0, "showBody", "close")
                      }}
                    />
                  </Box>
                </Box>
                {/* need chnage < on !== */}
                <IconButton
                  onClick={(event) => handleOpenPopover(event)}
                  sx={{
                    display: "none",
                    "@media (max-width: 900px)": { display: "block" },
                    ":hover": { backgroundColor: "transparent" },
                  }}
                >
                  <MoreVert
                    sx={{ color: "rgba(32, 33, 36, 1)" }}
                    height={8}
                    width={24}
                  />
                </IconButton>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "end",
                  gap: 2,
                  mt: 2,
                  alignItems: "center",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={buttonClickAllSources}
                  sx={{
                    height: "40px",
                    borderRadius: "4px",
                    textTransform: "none",
                    fontSize: "14px",
                    lineHeight: "19.6px",
                    fontWeight: "500",
                    color: "rgba(56, 152, 252, 1)",
                    borderColor: "rgba(56, 152, 252, 1)",
                    "&:hover": {
                      backgroundColor: "rgba(80, 82, 178, 0.1)",
                      borderColor: "rgba(56, 152, 252, 1)",
                    },
                  }}
                >
                  All Sources
                </Button>
                <Box sx={{position: "relative"}}>
                  <Button
                    variant="contained" /* need chnage < on !== */
                    disabled={false}
                    onClick={() =>
                      router.push(`/lookalikes/builder?source_uuid=${createdData?.id}`)
                    }
                    className="second-sub-title"
                    sx={{
                      backgroundColor: "rgba(56, 152, 252, 1)",
                      textTransform: "none",
                      padding: "10px 24px",
                      color: "#fff !important",
                      ":hover": {
                        backgroundColor: "rgba(62, 64, 142, 1)",
                      },
                      ":active": {
                        backgroundColor: "rgba(56, 152, 252, 1)",
                      },
                      ":disabled": {
                        backgroundColor: "rgba(56, 152, 252, 1)",
                        opacity: 0.6,
                      },
                    }}
                  >
                    Create Lookalike
                  </Button>

                  {!createdSourceHints[0].showBody && <HintCard
                    card={createdHintCards[1]}
                    positionLeft={-400}
                    positionTop={20}
                    rightSide={true}
                    isOpenBody={createdSourceHints[1].showBody}
                    toggleClick={() => {
                      if (createdSourceHints[0].showBody) {
                        changeCreatedSourceHint(0, "showBody", "close")
                      }
                      if (createdSourceHints[2].showBody) {
                        changeCreatedSourceHint(2, "showBody", "close")
                      }
                      changeCreatedSourceHint(1, "showBody", "toggle")
                    }}
                    closeClick={() => {
                      changeCreatedSourceHint(1, "showBody", "close")
                    }}
                  />}
                </Box>

              </Box>
            </Box>
            <Popover
              open={isOpenFullName}
              anchorEl={anchorElFullName}
              onClose={handleClosePopoverFullName}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              PaperProps={{
                sx: {
                  width: "184px",
                  height: "108px",
                  borderRadius: "4px 0px 0px 0px",
                  border: "0.2px solid #ddd",
                  padding: "8px",
                  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                },
              }}
            >
              <Box
                sx={{
                  maxHeight: "92px",
                  overflowY: "auto",
                  backgroundColor: "rgba(255, 255, 255, 1)",
                }}
              >
                {selectedName?.split(",").map((part, index) => (
                  <Typography
                    key={index}
                    variant="body2"
                    className="second-sub-title"
                    sx={{
                      wordBreak: "break-word",
                      backgroundColor: "rgba(243, 243, 243, 1)",
                      borderRadius: "4px",
                      color: "rgba(95, 99, 104, 1) !important",
                      marginBottom:
                        index < selectedName?.split(",").length - 1 ? "4px" : 0,
                    }}
                  >
                    {part.trim()}
                  </Typography>
                ))}
              </Box>
            </Popover>
            <Popover
              open={isOpen}
              anchorEl={anchorEl}
              onClose={handleClosePopover}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
            >
              <List
                sx={{
                  width: "100%",
                  maxWidth: 360,
                }}
              >
                <ListItemButton
                  disabled={isCreateDisabled}
                  sx={{
                    padding: "4px 16px",
                    ":hover": { backgroundColor: "rgba(80, 82, 178, 0.1)" },
                  }}
                  onClick={() => {
                    handleClosePopover();
                    router.push(`/lookalikes/builder?source_uuid=${createdData?.id}`);
                  }}
                >
                  <ListItemText
                    primaryTypographyProps={{ fontSize: "14px" }}
                    primary="Create Lookalike"
                  />
                </ListItemButton>
                <ListItemButton
                  sx={{
                    padding: "4px 16px",
                    ":hover": { backgroundColor: "rgba(80, 82, 178, 0.1)" },
                  }}
                  onClick={() => {
                    handleOpenConfirmDialog();
                  }}
                >
                  <ListItemText
                    primaryTypographyProps={{ fontSize: "14px" }}
                    primary="Remove"
                  />
                </ListItemButton>
                <Popover
                  open={openConfirmDialog}
                  onClose={handleCloseConfirmDialog}
                  anchorEl={anchorEl}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "center" }}
                  slotProps={{
                    paper: {
                      sx: {
                        padding: "0.125rem",
                        width: "15.875rem",
                        boxShadow: 0,
                        borderRadius: "8px",
                        border: "0.5px solid rgba(175, 175, 175, 1)",
                      },
                    },
                  }}
                >
                  <Typography
                    className="first-sub-title"
                    sx={{ paddingLeft: 2, pt: 1, pb: 0 }}
                  >
                    Confirm Deletion
                  </Typography>
                  <DialogContent sx={{ padding: 2 }}>
                    <DialogContentText className="table-data">
                      Are you sure you want to delete this source?
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button
                      className="second-sub-title"
                      onClick={handleCloseConfirmDialog}
                      sx={{
                        backgroundColor: "#fff",
                        color: "rgba(56, 152, 252, 1) !important",
                        fontSize: "14px",
                        textTransform: "none",
                        padding: "0.75em 1em",
                        border: "1px solid rgba(56, 152, 252, 1)",
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
                      onClick={handleDeleteSource}
                      sx={{
                        backgroundColor: "rgba(56, 152, 252, 1)",
                        color: "#fff !important",
                        fontSize: "14px",
                        textTransform: "none",
                        padding: "0.75em 1em",
                        border: "1px solid rgba(56, 152, 252, 1)",
                        maxWidth: "60px",
                        maxHeight: "30px",
                        "&:hover": {
                          backgroundColor: "rgba(56, 152, 252, 1)",
                          boxShadow: "0 2px 2px rgba(0, 0, 0, 0.3)",
                        },
                      }}
                    >
                      Delete
                    </Button>
                  </DialogActions>
                </Popover>
              </List>
            </Popover>
          </Box>
        </Box>
      </Box>
    </>
  );
};

const SourcesListPage: React.FC = () => {
  return (
    <Suspense fallback={<CustomizedProgressBar />}>
      <SliderProvider>
        <SourcesList />
      </SliderProvider>
    </Suspense>
  );
};

export default SourcesListPage;
