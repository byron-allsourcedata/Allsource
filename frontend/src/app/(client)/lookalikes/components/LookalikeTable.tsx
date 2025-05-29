import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Typography,
  Tooltip,
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  Popover,
  TextField,
  InputAdornment,
  LinearProgress,
  Collapse,
  Link,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";
import { lookalikesStyles } from "./lookalikeStyles";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ProgressBar from "./ProgressLoader";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import { audienceStyles } from "../../audience/audienceStyles";
import TableCustomCell from "../../sources/components/table/TableCustomCell";
import { useSSE } from "@/context/SSEContext";
import { padding } from "@mui/system";
import { useScrollShadow } from "@/hooks/useScrollShadow";
import { QrCodeScannerOutlined } from "@mui/icons-material";
import { useLookalikesHints } from "../context/LookalikesHintsContext";
import HintCard from "../../components/HintCard";

interface TableRowData {
  id: string;
  name: string;
  source: string;
  source_type: string;
  lookalike_size: string;
  created_date: Date;
  created_by: string;
  size: number;
  processed_size: number;
  train_model_size: number;
  processed_train_model_size: number;
  significant_fields: Record<string, any>;
  similarity_score: Record<string, any>;
  target_schema: string;
}

interface LookalikeTableProps {
  tableData: TableRowData[];
  order?: "asc" | "desc";
  orderBy?: keyof TableRowData;
  onSort: (column: keyof TableRowData) => void;
  refreshData: () => void;
  loader_for_table: boolean;
}

const audienceSize = [
  {
    label: "almost_identical",
    text: "10K",
  },
  {
    label: "extremely_similar",
    text: "50K",
  },
  {
    label: "very_similar",
    text: "100K",
  },
  {
    label: "quite_similar",
    text: "200K",
  },
  {
    label: "broad",
    text: "500K",
  },
];

const createCommonCellStyles = () => ({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: "150px",
  maxWidth: "150px",
  width: "150px",
});

const columns = (isDebug: boolean) => [
  { key: "name", label: "Name", sortable: true },
  { key: "source", label: "Source" },
  { key: "source_type", label: "Source Type" },
  { key: "target_schema", label: "Target Type" },
  { key: "lookalike_size", label: "Lookalike Size" },
  { key: "created_date", label: "Created Date", sortable: true },
  { key: "created_by", label: "Created By" },
  { key: "size", label: "Size", sortable: true },
  { key: "actions", label: "" },
];

const LookalikeTable: React.FC<LookalikeTableProps> = ({
  tableData,
  order,
  orderBy,
  onSort,
  refreshData,
  loader_for_table,
}) => {
  const { lookalikesTableHints: lookalikesTableHints, cardsLookalikeTable, changeLookalikesTableHint, resetLookalikesTableHints } = useLookalikesHints();
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState<string>("");
  const [editPopoverAnchorEl, setEditPopoverAnchorEl] =
    useState<null | HTMLElement>(null);
  const [isEditPopoverOpen, setIsEditPopoverOpen] = useState(false);
  const [confirmAnchorEl, setConfirmAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const searchParams = useSearchParams();
  const isDebug = searchParams.get("is_debug") === "true";
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { smartLookaLikeProgress } = useSSE();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setOpenRowId((prevId) => (prevId === id ? null : id));
  };

  const handleRename = (
    event: React.MouseEvent<HTMLElement>,
    rowId: string,
    rowName: string
  ) => {
    setEditingRowId(rowId);
    setEditedName(rowName);
    setEditPopoverAnchorEl(event.currentTarget);
    setIsEditPopoverOpen(true);
  };

  const handleCloseEditPopover = () => {
    setIsEditPopoverOpen(false);
    setEditPopoverAnchorEl(null);
  };

  const clearPollingInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log("interval cleared");
    }
  };

  useEffect(() => {
    console.log("pooling");

    if (!intervalRef.current) {
      console.log("pooling started");
      intervalRef.current = setInterval(() => {
        const hasPending = tableData.some(
          (item) => item.size !== item.processed_size
        );

        if (hasPending) {
          console.log("Fetching due to pending records");
          refreshData();
        } else {
          console.log("No pending records, stopping interval");
          clearPollingInterval();
        }
      }, 10000);
    }

    return () => {
      clearPollingInterval();
    };
  }, [tableData]);

  const handleConfirmRename = async () => {
    if (!editingRowId || !editedName.trim()) return;
    try {
      const response = await axiosInstance.put(
        `/audience-lookalikes/update-lookalike`,
        {
          uuid_of_lookalike: editingRowId,
          name_of_lookalike: editedName,
        }
      );
      if (response.data.status === "SUCCESS") {
        showToast("Lookalike has been successfully updated");
        refreshData();
      } else {
        showErrorToast("An error occurred while trying to rename lookalike");
      }
      setEditingRowId(null);
      setIsEditPopoverOpen(false);
    } catch (error) { }
  };

  const handleDelete = async (rowId: string) => {
    try {
      const response = await axiosInstance.delete(
        `/audience-lookalikes/delete-lookalike`,
        { params: { uuid_of_lookalike: rowId } }
      );
      if (response.data.status === "SUCCESS") {
        showToast("Lookalike has been successfully removed");
        refreshData();
      } else {
        showErrorToast("An error occurred while trying to remove lookalike");
      }
    } catch (error: any) {
      if (error.status === 400) {
        showErrorToast(
          "Cannot remove lookalike because it is used for smart audience"
        );
      }
    }
  };

  const handleCopy = (text: string) => {
    if (text !== "---") {
      navigator.clipboard.writeText(text);
    }
    alert("Copied to clipboard");
  };

  const fullFormattedFields = (
    fields: Record<string, number> | null
  ): string => {
    if (!fields || typeof fields !== "object") return "---";
    if (Object.keys(fields).length === 0) {
      return 'There are no fields with values ​​greater than zero';
    }
    return Object.entries(fields)
      .map(([key, value]) => `${key}: ${value}%`)
      .join(", ");
  };

  const handleOpenConfirm = (
    event: React.MouseEvent<HTMLElement>,
    rowId: string,
    rowName: string
  ) => {
    setConfirmAnchorEl(event.currentTarget);
    setEditingRowId(rowId);
    setEditedName(rowName);
    setIsConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    setIsConfirmOpen(false);
  };

  const toNormalText = (sourceType: string) => {
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

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { isScrolledX, isScrolledY } = useScrollShadow(tableContainerRef, tableData.length);

  return (
    <TableContainer
      ref={tableContainerRef}
      sx={{
        border: "1px solid rgba(235, 235, 235, 1)",
        borderRadius: "4px",
        maxHeight: "67vh",
        overflow: "auto",
        "@media (max-height: 800px)": {
          maxHeight: "70vh",
        },
        "@media (max-width: 400px)": {
          maxHeight: "67vh",
        },
      }}
    >
      <Table stickyHeader>
        <TableHead sx={{ position: "relative" }}>
          <TableRow sx={{ height: "60px" }}>
            {columns(isDebug).map(({ key, label, sortable = false }) => (
              <TableCell
                key={key}
                onClick={
                  sortable ? () => onSort(key as keyof TableRowData) : undefined
                }
                sx={{
                  ...lookalikesStyles.table_column,
                  cursor: sortable ? "pointer" : "default",
                  ...(key === "name" && {
                    position: "sticky",
                    maxWidth: "170px",
                    width: "170px",
                    left: 0,
                    zIndex: 98,
                    top: 0,
                    boxShadow: isScrolledX ? "3px 0px 3px #00000033" : "none",
                  }),
                  ...(key === "lookalike_size" && {
                    minWidth: "60px",
                    maxWidth: "60px",
                    width: "60px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    left: 0,
                    zIndex: 98,
                    top: 0,
                  }),

                  ...(key === "actions" && {
                    maxWidth: "30px",
                    "::after": { content: "none" },
                  }),
                  borderBottom: "none",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", position: "relative" }}>
                  {key === "actions" && (
                    <HintCard
                      card={cardsLookalikeTable.actions}
                      positionTop={55}
                      positionLeft={-425}
                      rightSide={true}
                      isOpenBody={lookalikesTableHints.actions.showBody}
                      toggleClick={() =>
                        changeLookalikesTableHint("actions", "showBody", "toggle")
                      }
                      closeClick={() =>
                        changeLookalikesTableHint("actions", "showBody", "close")
                      }
                    />
                  )}
                  {key === "name" && (
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
        }}
        onClick={e => e.stopPropagation()}
      >
        <HintCard
          card={cardsLookalikeTable.insights}
          positionTop={65}
          positionLeft={90}
          rightSide={false}
          isOpenBody={lookalikesTableHints.insights.showBody}
          toggleClick={() =>
            changeLookalikesTableHint("insights", "showBody", "toggle")
          }
          closeClick={() =>
            changeLookalikesTableHint("insights", "showBody", "close")
          }
        />
      </Box>
    )}
                  <Typography
                    variant="body2"
                    sx={{ ...lookalikesStyles.table_column, borderRight: "0" }}
                  >
                    {label}
                  </Typography>
                  {sortable && (
                    <IconButton size="small">
                      {orderBy === key ? (
                        order === "asc" ? (
                          <ArrowUpwardRoundedIcon fontSize="inherit" />
                        ) : (
                          <ArrowDownwardRoundedIcon fontSize="inherit" />
                        )
                      ) : (
                        <SwapVertIcon fontSize="inherit" />
                      )}
                    </IconButton>
                  )}
                </Box>
              </TableCell>
            ))}
          </TableRow>
          <TableRow
            sx={{
              position: "sticky",
              top: "60px",
              zIndex: 99,
              borderTop: "none",
            }}
          >
            <TableCell
              colSpan={columns(isDebug).length}
              sx={{
                p: 0,
                pb: "1.5px",
                borderTop: "none",
                backgroundColor: "rgba(235, 235, 235, 1)",
                borderColor: "rgba(235, 235, 235, 1)",
              }}
            >
              {loader_for_table && (
                <LinearProgress
                  variant="indeterminate"
                  sx={{
                    width: "100%",
                    height: "1.5px",
                    position: "absolute",
                  }}
                />
              )}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody sx={{ position: "relative" }}>
          {tableData.map((row) => {
            return (
              <>
                <TableRow
                  key={row.id}
                  sx={{
                    backgroundColor:
                      selectedRows.has(row.id) && !loader_for_table
                        ? "rgba(247, 247, 247, 1)"
                        : "#fff",
                    "&:hover": {
                      backgroundColor: "rgba(247, 247, 247, 1)",
                      "& .sticky-cell": {
                        backgroundColor: "rgba(247, 247, 247, 1)",
                      },
                    },
                    "&:hover .action-icon": {
                      opacity: 1,
                      pointerEvents: "auto",
                    },
                  }}
                >
                  <TableCustomCell
                    renderContent={() => (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          gap: 2,
                          alignItems: "center",
                          justifyContent: "space-between",
                          minWidth: "50px",
                          maxWidth: "300px",
                          width: "100%",
                        }}
                      >
                        <Typography
                          className="table-data"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flexGrow: 1,
                          }}
                        >
                          {isDebug && (
                            <IconButton
                              size="small"
                              onClick={() => toggleRow(row.id)}
                              sx={{
                                color: "#202124",
                                marginRight: "16px",
                              }}
                            >
                              {openRowId === row.id ? (
                                <KeyboardArrowUpIcon />
                              ) : (
                                <KeyboardArrowDownIcon />
                              )}
                            </IconButton>
                          )}
                          <Link
                            href={`/insights/lookalikes/${row.id}`}
                            underline="none"
                            sx={{
                              display: 'inline-block',
                              width: '100%',
                            }}
                          >
                            {row.name}
                          </Link>

                        </Typography>
                        <IconButton
                          className="edit-icon action-icon"
                          sx={{
                            pl: 0,
                            pr: 0,
                            pt: 0.25,
                            pb: 0.25,
                            margin: 0,
                            opacity: 0,
                            pointerEvents: "none",
                            transition: "opacity 0.2s ease-in-out",
                            "@media (max-width: 900px)": {
                              opacity: 1,
                            },
                          }}
                          onClick={(event) =>
                            handleRename(event, row.id, row.name)
                          }
                        >
                          <EditIcon
                            sx={{ maxHeight: "16px", fontSize: "16px" }}
                          />
                        </IconButton>
                      </Box>
                    )}
                    rowExample={row.name}
                    customCellStyles={{
                      ...lookalikesStyles.table_array,
                      position: "sticky",
                      left: 0,
                      zIndex: 8,
                      backgroundColor: "#fff",
                      "&:hover .edit-icon": {
                        opacity: 1,
                        pointerEvents: "auto",
                      },
                      minWidth: "150px",
                      maxWidth: "150px",
                      width: "150px",
                      boxShadow: isScrolledX ? "3px 0px 3px #00000033" : "none",
                    }}
                  />

                  <Popover
                    open={isEditPopoverOpen}
                    anchorEl={editPopoverAnchorEl}
                    onClose={handleCloseEditPopover}
                    anchorOrigin={{
                      vertical: "center",
                      horizontal: "center",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "left",
                    }}
                    slotProps={{
                      paper: {
                        sx: {
                          width: "15.875rem",
                          boxShadow: 0,
                          borderRadius: "4px",
                          border: "0.5px solid rgba(175, 175, 175, 1)",
                        },
                      },
                    }}
                  >
                    <Box sx={{ p: 2 }}>
                      <TextField
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        variant="outlined"
                        label="Lookalike Name"
                        size="small"
                        fullWidth
                        sx={{
                          "& label.Mui-focused": {
                            color: "rgba(56, 152, 252, 1)",
                          },
                          "& .MuiOutlinedInput-root:hover fieldset": {
                            color: "rgba(56, 152, 252, 1)",
                          },
                          "& .MuiOutlinedInput-root": {
                            "&:hover fieldset": {
                              borderColor: "rgba(56, 152, 252, 1)",
                              border: "1px solid rgba(56, 152, 252, 1)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "rgba(56, 152, 252, 1)",
                              border: "1px solid rgba(56, 152, 252, 1)",
                            },
                          },
                        }}
                        InputProps={{
                          style: {
                            fontFamily: "Roboto",
                            fontSize: "14px",
                          },
                        }}
                        InputLabelProps={{
                          style: {
                            fontSize: "14px",
                            fontFamily: "Roboto",
                          },
                        }}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          mt: 2,
                        }}
                      >
                        <Button
                          onClick={handleCloseEditPopover}
                          sx={{
                            backgroundColor: "#fff",
                            color: "rgba(56, 152, 252, 1) !important",
                            fontSize: "14px",
                            textTransform: "none",
                            padding: "0.75em 1em",
                            maxWidth: "50px",
                            maxHeight: "30px",
                            mr: 0.5,
                            "&:hover": {
                              backgroundColor: "#fff",
                              boxShadow: "0 0px 1px 1px rgba(0, 0, 0, 0.3)",
                            },
                          }}
                        >
                          <Typography
                            className="second-sub-title"
                            sx={{ color: "rgba(56, 152, 252, 1) !important" }}
                          >
                            Cancel
                          </Typography>
                        </Button>
                        <Button
                          onClick={() => {
                            handleConfirmRename();
                            handleCloseEditPopover();
                          }}
                          sx={{
                            backgroundColor: "#fff",
                            color: "rgba(56, 152, 252, 1) !important",
                            fontSize: "14px",
                            textTransform: "none",
                            padding: "0.75em 1em",
                            maxWidth: "50px",
                            maxHeight: "30px",
                            "&:hover": {
                              backgroundColor: "#fff",
                              boxShadow: "0 0px 1px 1px rgba(0, 0, 0, 0.3)",
                            },
                          }}
                        >
                          <Typography
                            className="second-sub-title"
                            sx={{ color: "rgba(56, 152, 252, 1) !important" }}
                          >
                            Save
                          </Typography>
                        </Button>
                      </Box>
                    </Box>
                  </Popover>

                  <TableCustomCell
                    customCellStyles={{
                      ...lookalikesStyles.table_array,
                      position: "relative",
                      ...createCommonCellStyles(),
                    }}
                    rowExample={row.source}
                  />

                  <TableCell
                    sx={{
                      ...lookalikesStyles.table_array,
                      position: "relative",
                      cursor: "default",
                    }}
                  >
                    <Box sx={{ display: "flex" }}>
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
                              {toNormalText(row.source_type)}
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
                          {truncateText(toNormalText(row.source_type), 30)}
                        </Typography>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      ...lookalikesStyles.table_array,
                      position: "relative",
                    }}
                  >
                    {row.target_schema.toUpperCase()}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...lookalikesStyles.table_array,
                      position: "relative",
                    }}
                  >
                    {(() => {
                      const size = audienceSize.find(
                        (size) => size.label === row.lookalike_size
                      );
                      return size
                        ? `${toNormalText(size.label)} ${size.text}`
                        : row.lookalike_size;
                    })()}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...lookalikesStyles.table_array,
                      position: "relative",
                    }}
                  >
                    {dayjs(row.created_date).format("MMM D, YYYY")}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...lookalikesStyles.table_array,
                      position: "relative",
                    }}
                  >
                    {row.created_by}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...lookalikesStyles.table_array,
                      position: "relative",
                    }}
                  >
                    {((row.processed_size + row.processed_train_model_size) === (row.size + row.train_model_size))
                      && ((row.size + row.train_model_size) !== 0) ? (
                      row.size.toLocaleString("en-US")
                    ) : (
                      <ProgressBar
                        progress={{
                          total: (row?.size + row?.train_model_size) || 0,
                          processed: (row?.processed_size + row?.processed_train_model_size) || 0,
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...lookalikesStyles.table_array,
                      maxWidth: "40px",
                      minWidth: "40px",
                      padding: "8px",
                      textAlign: "center",
                      position: "relative",
                    }}
                  >
                    <IconButton
                      className="action-icon"
                      sx={{
                        pl: 0,
                        pr: 0,
                        pt: 0.25,
                        pb: 0.25,
                        margin: 0,
                        opacity: 0,
                        pointerEvents: "none",
                        transition: "opacity 0.2s ease-in-out",
                        "@media (max-width: 900px)": {
                          opacity: 1,
                        },
                      }}
                      onClick={(event) =>
                        handleOpenConfirm(event, row.id, row.name)
                      }
                    >
                      <DeleteIcon sx={{ maxHeight: "18px" }} />
                    </IconButton>
                  </TableCell>
                  <Popover
                    open={isConfirmOpen}
                    anchorEl={confirmAnchorEl}
                    onClose={handleCloseConfirm}
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
                    <Typography
                      className="first-sub-title"
                      sx={{ paddingLeft: 2, pt: 1, pb: 0 }}
                    >
                      Confirm Deletion
                    </Typography>
                    <DialogContent sx={{ padding: 2 }}>
                      <DialogContentText className="table-data">
                        Are you sure you want to delete the lookalike named{" "}
                        <strong
                          style={{
                            fontWeight: 500,
                            color: "rgba(32, 33, 36, 1)",
                          }}
                        >
                          {editedName}
                        </strong>{" "}
                        ?
                      </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                      <Button
                        className="second-sub-title"
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
                        onClick={handleCloseConfirm}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="second-sub-title"
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
                        onClick={() => {
                          handleDelete(editingRowId || "");
                          handleCloseConfirm();
                        }}
                      >
                        Delete
                      </Button>
                    </DialogActions>
                  </Popover>
                </TableRow>

                {isDebug && openRowId == row.id && (
                  <>
                    <TableRow
                      sx={{ "& > *": { borderBottom: "1px solid #e0e0e0" } }}
                    >
                      <TableCell
                        sx={{
                          ...lookalikesStyles.table_array,
                          position: "relative",
                        }}
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                      >
                        <Collapse
                          in={openRowId === row.id}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ margin: 1 }}>
                            <Typography className="table-data">
                              Significant field
                            </Typography>
                          </Box>
                        </Collapse>
                      </TableCell>
                      <TableCell
                        sx={{
                          ...lookalikesStyles.table_array,
                          textWrap: "wrap",
                          position: "relative",
                          pr: 0,
                          pl: 0,
                        }}
                        colSpan={7}
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                      >
                        <Collapse
                          in={openRowId === row.id}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ margin: 1 }}>
                            <Typography className="table-data">
                              {fullFormattedFields(row.significant_fields)}
                            </Typography>
                          </Box>
                        </Collapse>
                      </TableCell>
                      <TableCell
                        sx={{
                          ...lookalikesStyles.table_array,
                          position: "relative",
                          maxWidth: "44px",
                          minWidth: "44px",
                          padding: "8px",
                          textAlign: "center",
                        }}
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                      >
                        <Collapse
                          in={openRowId === row.id}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ margin: 0, mr: 1 }}>
                            <IconButton
                              sx={{
                                pl: 0,
                                pr: 0.5,
                                pt: 0.25,
                                pb: 0.25,
                                margin: 0,
                              }}
                              onClick={() =>
                                handleCopy(
                                  fullFormattedFields(row.significant_fields)
                                )
                              }
                            >
                              <ContentCopyIcon sx={{ maxHeight: "18px" }} />
                            </IconButton>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        sx={{
                          ...lookalikesStyles.table_array,
                          p: 0.25,
                          pl: 1,
                          position: "relative",
                          "&::after": {
                            content: '""',
                            display: "block",
                            position: "absolute",
                            top: "10px",
                            bottom: "10px",
                            right: 0,
                            width: "1px",
                            backgroundColor: "rgba(235, 235, 235, 1)",
                          },
                        }}
                      >
                        <Collapse
                          in={openRowId === row.id}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ pl: 2, py: 1 }}>
                            <Typography className="table-data">
                              Similarity score
                            </Typography>
                          </Box>
                        </Collapse>
                      </TableCell>

                      <TableCell
                        sx={{
                          ...lookalikesStyles.table_array,
                          textWrap: "wrap",
                          position: "relative",
                          pr: 0,
                          pl: 0,
                          "&::after": {
                            content: '""',
                            display: "block",
                            position: "absolute",
                            top: "10px",
                            bottom: "10px",
                            right: 0,
                            width: "1px",
                            backgroundColor: "rgba(235, 235, 235, 1)",
                          },
                        }}
                        colSpan={7}
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                      >
                        <Collapse
                          in={openRowId === row.id}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ margin: 1 }}>
                            <Typography className="table-data">
                              {fullFormattedFields(row.similarity_score)}
                            </Typography>
                          </Box>
                        </Collapse>
                      </TableCell>
                      <TableCell
                        sx={{
                          ...lookalikesStyles.table_array,
                          position: "relative",
                          maxWidth: "44px",
                          minWidth: "44px",
                          padding: "8px",
                          textAlign: "center",
                        }}
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                      >
                        <Collapse
                          in={openRowId === row.id}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ margin: 0, mr: 1 }}>
                            <IconButton
                              sx={{
                                pl: 0,
                                pr: 0.5,
                                pt: 0.25,
                                pb: 0.25,
                                margin: 0,
                              }}
                              onClick={() =>
                                handleCopy(
                                  fullFormattedFields(row.similarity_score)
                                )
                              }
                            >
                              <ContentCopyIcon sx={{ maxHeight: "18px" }} />
                            </IconButton>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LookalikeTable;
