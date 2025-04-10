import React, { useEffect, useState, useRef } from "react";
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

interface TableData {
  id: string;
  lookalike_name: string;
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

const audienceSize = [
  {
    label: "Almost identical",
    text: "Lookalike size 0-3%",
    min_value: 0,
    max_value: 3,
  },
  {
    label: "Extremely similar",
    text: "Lookalike size 0-7%",
    min_value: 0,
    max_value: 7,
  },
  {
    label: "Very similar",
    text: "Lookalike size 0-10%",
    min_value: 0,
    max_value: 10,
  },
  {
    label: "Quite similar",
    text: "Lookalike size 0-15%",
    min_value: 0,
    max_value: 15,
  },
  {
    label: "Broad",
    text: "Lookalike size 0-20%",
    min_value: 0,
    max_value: 20,
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
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [total, setTotal] = useState<Record<string, number>>({});
  const intervalRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [createdData, setCreatedData] = useState<any[]>(tableData);
  const [selectedId, setSelectedId] = useState<string>('');
  
  // useEffect(() => {
  //   createdData.forEach((item) => {
  //     const progress = smartLookaLikeProgress[item.id];
  //     if (progress) {
  //       setProgress((prev) => ({ ...prev, [item.id]: progress.processed }));
  //       setTotal((prev) => ({ ...prev, [item.id]: progress.total }));
  //     }
  //   });
  // }, [smartLookaLikeProgress, createdData]);
  
  useEffect(() => {
    createdData.forEach((item) => {
      if (!intervalRef.current[item.id]) {
        console.log(`Polling started for item ${item.id}`);
        intervalRef.current[item.id] = setInterval(() => {
          const currentProgress = item.size_progress;
          const currentTotal = item.size;
  
          if (currentProgress < currentTotal || currentProgress === 0) {
            console.log(`Fetching data for item ${item.id}`);
            fetchData(item.id);
          } else {
            console.log(`Polling stopped for item ${item.id}`);
            clearInterval(intervalRef.current[item.id]);
            delete intervalRef.current[item.id];
          }
        }, 2000);
      }
    });
  
    return () => {
      Object.keys(intervalRef.current).forEach((id) => {
        clearInterval(intervalRef.current[id]);
        delete intervalRef.current[id];
      });
      console.log('All intervals cleared');
    };
  }, [createdData]);
  
  const fetchData = async (id: string) => {
    try {
      const response = await axiosInstance.get(
        `/audience-lookalikes/get-processing-lookalikes?id=${id}`
      );
      const updatedItem = response.data;
  
      setCreatedData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, ...updatedItem } : item
        )
      );
  
      // Update progress and total for the specific item
      setProgress((prev) => ({
        ...prev,
        [id]: updatedItem.size_progress,
      }));
      setTotal((prev) => ({
        ...prev,
        [id]: updatedItem.size,
      }));
    } catch (error) {
      console.error(`Failed to fetch data for item ${id}:`, error);
    }
  };
  
  const handleRowSelect = (id: string) => {
    setSelectedId(id);
    console.log(`Selected ID set to ${id}`);
  };

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
              <TableCell>{setSourceType(row.source)}</TableCell>
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
                    ? `${setSourceType(size.label)} ${size.min_value}-${
                        size.max_value
                      }%`
                    : row.lookalike_size;
                })()}
              </TableCell>
              <TableCell>
                {dayjs(row.created_date).format("MMM D, YYYY")}
              </TableCell>
              <TableCell>{row.created_by}</TableCell>
              <TableCell sx={{ position: "relative" }}>
              {progress[row.id] >= total[row.id] && progress[row.id] !== undefined ? (
                progress[row.id]?.toLocaleString("en-US")
              ) : (
                <ProgressBar
                  progress={{
                    total: total[row.id] || 0,
                    processed: progress[row.id] || 0,
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
              <Box> Source: {row.source}</Box>
              <Box> Source Type: {row.type}</Box>
              <Box> Target Type: {row.source_target_schema.toUpperCase()}</Box>
              <Box> Lookalike Size: {row.lookalike_size}</Box>
              <Box> Created Date: {row.created_date}</Box>
              <Box> Created By: {row.created_by}</Box>
              <Box>
                {" "}
                Size:{" "}
                {progress[row.id] >= total[row.id] && progress[row.id] !== undefined ? (
                  progress[row.id]?.toLocaleString("en-US")
                ) : (
                  <ProgressBar
                    progress={{
                      total: total[row.id] || 0,
                      processed: progress[row.id] || 0,
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
