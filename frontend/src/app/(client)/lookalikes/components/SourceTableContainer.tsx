import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TableContainer,
  Box,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";

interface TableData {
  name: string;
  target_schema: string;
  source: string;
  type: string;
  created_date: string;
  created_by: string;
  number_of_customers: number;
  matched_records: number;
}

interface TableContainerProps {
  tableData: TableData[];
}

const setSourceType = (sourceType: string) => {
  return sourceType
    ?.split(",")
    .map((item) =>
      item
        .split("_")
        .map((subItem) => subItem.charAt(0).toUpperCase() + subItem.slice(1))
        .join(" ")
    )
    .join(", ");
};

const SourceTableContainer: React.FC<TableContainerProps> = ({ tableData }) => {
  return (
    <TableContainer
      component={Paper}
      sx={{
        width: "100%",
        boxShadow: "none",
        borderRadius: "4px",
        border: "1px solid #EBEBEB",
        padding: "16px",
        overflowX: "auto",
      }}
    >
      {/* Десктопная версия */}
      <Table
        sx={{
          borderCollapse: "separate",
          width: "100%",
          display: { xs: "none", sm: "table" },
        }}
      >
        <TableHead
          sx={{
            "& .MuiTableCell-root": {
              fontFamily: "Nunito Sans",
              fontWeight: 600,
              fontSize: "12px",
              lineHeight: "16.8px",
              border: "none",
              padding: "8px",
              color: "#202124",
            },
          }}
        >
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Target Type</TableCell>
            <TableCell>Source</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Created Date</TableCell>
            <TableCell>Created By</TableCell>
            <TableCell>Number of Customers</TableCell>
            <TableCell>Matched Records</TableCell>
          </TableRow>
        </TableHead>
        <TableBody
          sx={{
            "& .MuiTableCell-root": {
              fontFamily: "Roboto",
              fontWeight: 400,
              fontSize: "12px",
              lineHeight: "16.8px",
              color: "#5F6368",
              border: "none",
              padding: "8px",
            },
          }}
        >
          {tableData.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.target_schema.toUpperCase()}</TableCell>
              <TableCell>{setSourceType(row.source)}</TableCell>
              <TableCell>{setSourceType(row.type)}</TableCell>
              <TableCell>
                {dayjs(row.created_date).format("MMM D, YYYY")}
              </TableCell>
              <TableCell>{row.created_by}</TableCell>
              <TableCell>
                {row.number_of_customers.toLocaleString("en-US")}
              </TableCell>
              <TableCell>
                {row.matched_records.toLocaleString("en-US")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Мобильная версия */}
      <Box
        sx={{
          display: { xs: "block", sm: "none" },
          mt: 2,
        }}
      >
        {tableData.map((row, index) => (
          <Paper
            key={index}
            sx={{
              padding: "16px",
              marginBottom: "16px",
              border: "1px solid #EBEBEB",
              borderRadius: "4px",
              boxShadow: "none",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                mb: 1,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Nunito Sans",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: "#202124",
                }}
              >
                Name:
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Roboto",
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "#5F6368",
                }}
              >
                {row.name}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                mb: 1,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Nunito Sans",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: "#202124",
                }}
              >
                Target Type:
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Roboto",
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "#5F6368",
                }}
              >
                {row.target_schema.toUpperCase()}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                mb: 1,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Nunito Sans",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: "#202124",
                }}
              >
                Source:
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Roboto",
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "#5F6368",
                }}
              >
                {setSourceType(row.source)}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                mb: 1,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Nunito Sans",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: "#202124",
                }}
              >
                Type:
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Roboto",
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "#5F6368",
                }}
              >
                {setSourceType(row.type)}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                mb: 1,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Nunito Sans",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: "#202124",
                }}
              >
                Created Date:
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Roboto",
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "#5F6368",
                }}
              >
                {dayjs(row.created_date).format("MMM D, YYYY")}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                mb: 1,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Nunito Sans",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: "#202124",
                }}
              >
                Created By:
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Roboto",
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "#5F6368",
                }}
              >
                {row.created_by}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                mb: 1,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Nunito Sans",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: "#202124",
                }}
              >
                Number of Customers:
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Roboto",
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "#5F6368",
                }}
              >
                {row.number_of_customers.toLocaleString("en-US")}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
              <Typography
                sx={{
                  fontFamily: "Nunito Sans",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: "#202124",
                }}
              >
                Matched Records:
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Roboto",
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "#5F6368",
                }}
              >
                {row.matched_records.toLocaleString("en-US")}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </TableContainer>
  );
};

export default SourceTableContainer;
