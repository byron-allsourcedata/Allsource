import React from "react";
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, TableContainer, Box } from "@mui/material";
import ProgressBar from './ProgressLoader';
import dayjs from "dayjs";

interface TableData {
  name: string;
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
    ?.split(',')
    .map(item =>
      item
        .split('_')
        .map(subItem => subItem.charAt(0).toUpperCase() + subItem.slice(1))
        .join(' ')
    )
    .join(', ');
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
              <TableCell>{setSourceType(row.source)}</TableCell>
              <TableCell>{setSourceType(row.type)}</TableCell>
              <TableCell>{dayjs(row.created_date).format('MMM D, YYYY')}</TableCell>
              <TableCell>{row.created_by}</TableCell>
              <TableCell>{row.number_of_customers}</TableCell>
              <TableCell sx={{ position: 'relative' }}>
                {row.matched_records >= row.number_of_customers
                  ? row.matched_records.toLocaleString('en-US')
                  : <ProgressBar progress={{ total: row.number_of_customers, processed: row.matched_records }} />
                }
              </TableCell>
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
              <Box> Created Date:  {row.created_date}</Box>
              <Box> Created By:  {row.created_by}</Box>
              <Box> Number of Customers:  {row.number_of_customers}</Box>
              <Box> Matched Records:  {row.matched_records}</Box>
            </Box>
          </Box>
        ))}
      </Box>
    </TableContainer>
  );
};

export default SourceTableContainer;
