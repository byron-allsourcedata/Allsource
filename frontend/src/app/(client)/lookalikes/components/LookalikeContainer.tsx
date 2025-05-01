import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TableContainer,
  Box,
  Tooltip,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useSSE } from "@/context/SSEContext";
import ProgressBar from "./ProgressLoader";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { usePolling } from "@/hooks/usePolling";

interface TableData {
  id: string;
  lookalike_name: string;
  size_progress: number;
  size: number;
  source: string;
  type: string;
  source_target_schema: string;
  lookalike_size: string;
  created_date: string;
  created_by: string;
}

interface TableContainerProps {
  tableData: TableData[];
}

interface PollingData {
  id: string;
  size: number;
  size_progress: number;
}

const audienceSize = [
  {
    label: "Almost identical",
    text: "10K",
  },
  {
    label: "Extremely similar",
    text: "50K",
  },
  {
    label: "Very similar",
    text: "100K",
  },
  {
    label: "Quite similar",
    text: "200K",
  },
  {
    label: "Broad",
    text: "500K",
  },
];

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

const LookalikeContainer: React.FC<TableContainerProps> = ({ tableData }) => {
  const { smartLookaLikeProgress } = useSSE();
  
  const fetchData = async (id: string): Promise<PollingData> => {
    try {
      const response = await axiosInstance.get(
        `/audience-lookalikes/get-processing-lookalikes?id=${id}`
      );
      const updatedItem = response.data;

      console.log({updatedItem});
      setLookalikeSize(updatedItem.size);
      return {
        size_progress: updatedItem.processed_size + updatedItem.processed_train_model_size || 0,
        size: updatedItem.size + updatedItem.train_model_size || 0,
        id: id,
      };
    } catch {
      return {
        size_progress: 0,
        size: 0,
        id: id,
      };
    }
  };

  const { mergedProgress, mergedTotal } = usePolling(
    tableData[0],
    smartLookaLikeProgress[tableData[0].id] || null,
    fetchData
  );

  const setSourceOrigin = (sourceOrigin: string) => {
    return sourceOrigin === "pixel" ? "Pixel" : "CSV File";
  };
  
  const [lookalikeSize, setLookalikeSize] = useState(0);
  return (
    <TableContainer
      component={Paper}
      sx={{
        width: "100%",
        boxShadow: "none",
        borderRadius: ".25rem",
        border: ".0625rem solid #EBEBEB",
        padding: "1rem",
        overflowX: "auto",
      }}
    >
      <Table
        sx={{
          borderCollapse: "separate",
          width: "100%",
          display: "table",
          "@media (max-width: 37.5rem)": {
            display: "none",
          },
        }}
      >
        <TableHead
          sx={{
            "& .MuiTableCell-root": {
              fontFamily: "Nunito Sans",
              fontWeight: 600,
              fontSize: ".75rem",
              lineHeight: "1.05rem",
              letterSpacing: "0%",
              border: "none",
              padding: ".5rem",
              color: "#202124",
            },
          }}
        >
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Source</TableCell>
            <TableCell>Source Type</TableCell>
            <TableCell>Target Type</TableCell>
            <TableCell>Lookalike Size</TableCell>
            <TableCell>Created date</TableCell>
            <TableCell>Created By</TableCell>
            <TableCell>Size</TableCell>
          </TableRow>
        </TableHead>
        <TableBody
          sx={{
            "& .MuiTableCell-root": {
              fontFamily: "Roboto",
              fontWeight: 400,
              fontSize: ".75rem",
              lineHeight: "1.05rem",
              color: "#5F6368",
              border: "none",
              padding: ".5rem",
            },
          }}
        >
          {tableData.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.lookalike_name}</TableCell>
              <TableCell>{setSourceOrigin(row.source)}</TableCell>
              <TableCell sx={{ maxWidth: "6.25rem" }}>
                <Box>
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
                          sx={{ fontSize: ".75rem !important" }}
                        >
                          {setSourceType(row.type)}
                        </Typography>
                      </Box>
                    }
                    sx={{ marginLeft: "8px !important" }}
                    componentsProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: "#fff",
                          color: "#000",
                          boxShadow:
                            "0rem .25rem .25rem 0rem rgba(0, 0, 0, 0.12)",
                          border: ".0125rem solid rgba(255, 255, 255, 1)",
                          borderRadius: ".25rem",
                          maxHeight: "100%",
                          maxWidth: "31.25rem",
                          padding: ".6875rem .625rem",
                          marginLeft: "8px !important",
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
                        maxWidth: "9.375rem",
                      }}
                    >
                      {truncateText(setSourceType(row.type), 30)}
                    </Typography>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell>{row.source_target_schema?.toUpperCase()}</TableCell>
              <TableCell>
                {(() => {
                  const size = audienceSize.find(
                    (size) => size.label === row.lookalike_size
                  );
                  return size
                    ? `${setSourceType(size.label)} ${size.text}`
                    : row.lookalike_size;
                })()}
              </TableCell>
              <TableCell>
                {dayjs(row.created_date).format("MMM D, YYYY")}
              </TableCell>
              <TableCell>{row.created_by}</TableCell>
              <TableCell sx={{ position: "relative", maxWidth: "8.25rem", width: "7.25rem"}}>
              {mergedTotal === mergedProgress && mergedProgress !== 0 ? (
                lookalikeSize.toLocaleString("en-US")
              ) : (
                <ProgressBar
                  progress={{
                    total: mergedTotal || 0,
                    processed: mergedProgress || 0,
                  }}
                />
              )}
            </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box
        sx={{
          display: "none",
          "@media (max-width: 37.5rem)": {
            display: "block",
          },
        }}
      >
        {tableData.map((row, index) => (
          <Box
            key={index}
            sx={{
              backgroundColor: "#FFF",
            }}
          >
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: ".25rem" }}
            >
              <Box>Name: {row.lookalike_name}</Box>
              <Box> Source: {setSourceOrigin(row.source)}</Box>
              <Box> Source Type: {row.type}</Box>
              <Box> Target Type: {row.source_target_schema.toUpperCase()}</Box>
              <Box> Lookalike Size: {row.lookalike_size}</Box>
              <Box> Created Date: {row.created_date}</Box>
              <Box> Created By: {row.created_by}</Box>
              <Box>
                {" "}
                Size:{" "}
                {mergedTotal === mergedProgress && mergedProgress !== 0 ?  (
                  mergedTotal.toLocaleString("en-US")
                ) : (
                  <ProgressBar
                    progress={{
                      total: mergedTotal || 0,
                      processed: mergedProgress || 0,
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </TableContainer>
  );
};

export default LookalikeContainer;
