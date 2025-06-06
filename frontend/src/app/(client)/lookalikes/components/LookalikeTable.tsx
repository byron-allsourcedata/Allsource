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
  Paper,
  SxProps,
  Theme,
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
import SmartCell from "@/components/table/SmartCell";

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
  {
    key: "name",
    label: "Name",
    sortable: true,
    widths: { width: "170px", minWidth: "170px", maxWidth: "170px" },
  },
  {
    key: "source",
    label: "Source",
    widths: { width: "120px", minWidth: "120px", maxWidth: "120px" },
  },
  {
    key: "source_type",
    label: "Source Type",
    widths: { width: "150px", minWidth: "150px", maxWidth: "150px" },
  },
  {
    key: "target_schema",
    label: "Target Type",
    widths: { width: "130px", minWidth: "130px", maxWidth: "130px" },
  },
  {
    key: "lookalike_size",
    label: "Lookalike Size",
    widths: { width: "120px", minWidth: "120px", maxWidth: "120px" },
  },
  {
    key: "created_date",
    label: "Created Date",
    sortable: true,
    widths: { width: "125px", minWidth: "125px", maxWidth: "125px" },
  },
  {
    key: "created_by",
    label: "Created By",
    widths: { width: "140px", minWidth: "140px", maxWidth: "140px" },
  },
  {
    key: "size",
    label: "Size",
    sortable: true,
    widths: { width: "100px", minWidth: "100px", maxWidth: "100px" },
  },
  {
    key: "actions",
    label: "",
    widths: { width: "80px", minWidth: "80px", maxWidth: "80px" },
  },
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
    resetLookalikesTableHints();
  }, []);

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
    showToast("Copied to clipboard");
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
        height: "70vh",
        overflowX: "scroll",
        "@media (max-height: 800px)": {
          maxHeight: "70vh",
        },
        "@media (max-width: 400px)": {
          maxHeight: "67vh",
        },
      }}
    >
      <Table stickyHeader component={Paper}
        sx={{
          tableLayout: "fixed",

        }}>
        <TableHead sx={{ position: "relative" }}>
          <TableRow>
            {columns(isDebug).map((col) => {
              const { key, label, sortable = false, widths } = col;

              const isNameColumn = key === "name";
              const isActionsColumn = key === "actions";
              const hideDivider = (isNameColumn && isScrolledX) || isActionsColumn;
              const baseCellSX: SxProps<Theme> = {
                ...widths,
                position: "sticky",
                top: 0,
                zIndex: 97,
                borderBottom: "none",
                borderTop: "1px solid rgba(235,235,235,1)",
                cursor: sortable ? "pointer" : "default",
                borderRight: isActionsColumn ? "1px solid rgba(235,235,235,1)" : "none",
                whiteSpace: isActionsColumn || isNameColumn ? "normal" : "wrap",
                overflow: isActionsColumn || isNameColumn ? "visible" : "hidden",
              };
              if (isNameColumn) {
                baseCellSX.left = 0;
                baseCellSX.zIndex = 99;
                baseCellSX.boxShadow = isScrolledX
                  ? "3px 0px 3px rgba(0,0,0,0.2)"
                  : "none";
              }
              const className = isNameColumn ? "sticky-cell" : undefined;
              const onClickHandler = sortable
                ? () => onSort(key as keyof TableRowData)
                : undefined;

              return (
                <SmartCell
                  key={key}
                  cellOptions={{
                    sx: baseCellSX,
                    hideDivider,
                    onClick: onClickHandler,
                    className,
                  }}

                  contentOptions={{}}
                >
                  {isActionsColumn && (
                    <HintCard
                      card={cardsLookalikeTable.actions}
                      positionLeft={-400}
                      positionTop={85}
                      rightSide={true}
                      isOpenBody={lookalikesTableHints.actions.showBody}
                      toggleClick={() => {
                        changeLookalikesTableHint("insights", "showBody", "close");
                        changeLookalikesTableHint("builder", "showBody", "close");
                        changeLookalikesTableHint("actions", "showBody", "toggle");
                      }}
                      closeClick={() =>
                        changeLookalikesTableHint("actions", "showBody", "close")
                      }
                    />
                  )}

                  {isNameColumn && (
                    <Box
                      onClick={e => e.stopPropagation()}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                      }}
                    >
                      <HintCard
                        card={cardsLookalikeTable.insights}
                        positionTop={90}
                        positionLeft={90}
                        rightSide={false}
                        isOpenBody={lookalikesTableHints.insights.showBody}
                        toggleClick={() => {
                          changeLookalikesTableHint("actions", "showBody", "close");
                          changeLookalikesTableHint("builder", "showBody", "close");
                          changeLookalikesTableHint("insights", "showBody", "toggle");
                        }}
                        closeClick={() =>
                          changeLookalikesTableHint("insights", "showBody", "close")
                        }
                      />
                    </Box>
                  )}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      position: "relative",
                    }}
                  >
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

                </SmartCell>
              );
            })}
          </TableRow>
          <TableRow
            sx={{
              position: "sticky",
              top: "65px",
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
            const lookalikeText = (() => {
              const sizeObj = audienceSize.find(s => s.label === row.lookalike_size);
              return sizeObj
                ? `${toNormalText(sizeObj.label)} ${sizeObj.text}`
                : row.lookalike_size;
            })();
            const isRowDisabled =
              loader_for_table ||
              (row.processed_size + row.processed_train_model_size === 0);
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
                  <SmartCell
                    cellOptions={{
                      key: row.id,
                      className: "sticky-cell",
                      sx: {
                        position: 'sticky',
                        left: 0,
                        zIndex: 8,
                        backgroundColor: '#fff',
                        '&:hover .edit-icon': {
                          opacity: 1,
                          pointerEvents: 'auto',
                        },
                        boxShadow: isScrolledX ? '3px 0px 3px #00000033' : 'none',
                        color: isRowDisabled ? 'rgba(95,99,104,0.5)' : 'inherit',
                        cursor: isRowDisabled ? 'default' : 'pointer',
                      },
                      hideDivider: isScrolledX,
                    }}
                    tooltipOptions={{
                      content: row.name,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 2,
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography
                        className="table-data"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flexGrow: 1,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {isDebug && (
                          <IconButton
                            size="small"
                            onClick={() => toggleRow(row.id)}
                            sx={{
                              color: '#202124',
                              marginRight: '16px',
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
                            color: isRowDisabled
                              ? 'rgba(95, 99, 104, 1)'
                              : 'rgba(56, 152, 252, 1)',
                            cursor: isRowDisabled ? 'inherit' : 'pointer',
                            pointerEvents: isRowDisabled ? 'none' : 'auto',
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
                          pointerEvents: 'none',
                          transition: 'opacity 0.2s ease-in-out',
                          '@media (max-width: 900px)': {
                            opacity: 1,
                          },
                        }}
                        onClick={(event) => handleRename(event, row.id, row.name)}
                      >
                        <EditIcon sx={{ maxHeight: '16px', fontSize: '16px' }} />
                      </IconButton>
                    </Box>
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
                  </SmartCell>

                  <SmartCell
                    cellOptions={{
                      sx: {
                        position: "relative",
                      },
                    }}
                    tooltipOptions={{
                      content: row.source,
                    }}
                  >
                    {row.source}
                  </SmartCell>

                  <SmartCell
                    cellOptions={{
                      sx: {
                        position: "relative",
                        cursor: "default",
                      },
                    }}
                    tooltipOptions={{
                      content: toNormalText(row.source_type),
                    }}
                  >
                    {toNormalText(row.source_type)}
                  </SmartCell>

                  <SmartCell
                    cellOptions={{
                      sx: {
                        position: "relative",
                      },
                    }}
                    tooltipOptions={{
                      content: row.target_schema.toUpperCase(),
                    }}
                  >
                    {row.target_schema.toUpperCase()}
                  </SmartCell>

                  <SmartCell
                    cellOptions={{
                      sx: {
                        position: "relative",
                      },
                    }}
                    tooltipOptions={{ content: lookalikeText }}
                  >
                    {lookalikeText}
                  </SmartCell>
                  
                  {/* Created By Column */}
                  <SmartCell
                    cellOptions={{
                      sx: {
                        position: "relative",
                      },
                    }}
                    tooltipOptions={{
                      content: dayjs(row.created_date).format("MMM D, YYYY"),
                    }}
                  >
                    {dayjs(row.created_date).format("MMM D, YYYY")}
                  </SmartCell>

                  <SmartCell
                    cellOptions={{
                      sx: {
                        position: "relative",
                      },
                    }}
                    tooltipOptions={{
                      content: row.created_by,
                    }}
                  >
                    {row.created_by}
                  </SmartCell>

                  <SmartCell
                    cellOptions={{
                      sx: {
                        position: "relative",
                      },
                    }}
                  >
                    {((row.processed_size + row.processed_train_model_size) === (row.size + row.train_model_size) &&
                      (row.size + row.train_model_size) !== 0) ? (
                      row.size.toLocaleString("en-US")
                    ) : (
                      <ProgressBar
                        progress={{
                          total: (row.size + row.train_model_size) || 0,
                          processed: (row.processed_size + row.processed_train_model_size) || 0,
                        }}
                      />
                    )}
                  </SmartCell>
                  
                  {/* Action Column */}
                  <SmartCell
                    cellOptions={{
                      sx: {
                        textAlign: "center",
                        position: "relative",
                        borderRight: "1px solid rgba(235,235,235,1)",
                      },
                    }}
                  >
                    <IconButton
                      className="action-icon"
                      sx={{
                        p: 0,
                        margin: 0,
                        opacity: 0,
                        pointerEvents: "none",
                        transition: "opacity 0.2s ease-in-out",
                        "@media (max-width: 900px)": {
                          opacity: 1,
                        },
                      }}
                      onClick={(event) => handleOpenConfirm(event, row.id, row.name)}
                    >
                      <DeleteIcon sx={{ maxHeight: "18px" }} />
                    </IconButton>
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
                  </SmartCell>
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
