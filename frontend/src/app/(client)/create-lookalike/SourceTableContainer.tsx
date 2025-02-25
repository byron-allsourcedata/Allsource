import React from "react";
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, TableContainer, Box } from "@mui/material";

interface TableData {
  name: string;
  source: string;
  type: string;
  createdDate: string;
  createdBy: string;
  numberOfCustomers: string;
  matchedRecords: string;
}

interface TableContainerProps {
  tableData: TableData[];
}

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
      <Table
        sx={{
          borderCollapse: "separate",
          width: "100%",
          display: "table", 
          "@media (max-width: 600px)": {
            display: "none",
          },
        }}
      >
        <TableHead
          sx={{
            "& .MuiTableCell-root": {
              fontFamily: "Nunito Sans",
              fontWeight: 600,
              fontSize: "12px",
              lineHeight: "16.8px",
              letterSpacing: "0%",
              border: "none",
              padding: "8px",
              color: "#202124",
            },
          }}
        >
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Source</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Created date</TableCell>
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
              <TableCell>{row.source}</TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell>{row.createdDate}</TableCell>
              <TableCell>{row.createdBy}</TableCell>
              <TableCell>{row.numberOfCustomers}</TableCell>
              <TableCell>{row.matchedRecords}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box
        sx={{
          display: "none",
          "@media (max-width: 600px)": {
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
            
            <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <Box>Name: {row.name}</Box>
              <Box> Source: {row.source}</Box>
              <Box> Type:  {row.type}</Box>
              <Box> Created Date:  {row.createdDate}</Box>
              <Box> Created By:  {row.createdBy}</Box>
              <Box> Number of Customers:  {row.numberOfCustomers}</Box>
              <Box> Matched Records:  {row.matchedRecords}</Box>
            </Box>
          </Box>
        ))}
      </Box>
    </TableContainer>
  );
};

export default SourceTableContainer;
