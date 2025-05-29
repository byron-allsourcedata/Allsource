import React from 'react';
import { Box, Typography } from '@mui/material';
import CustomTablePagination from "@/components/CustomTablePagination";

interface PaginationComponentProps {
  countRows: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rowsPerPageOptions?: number[];

}

const PaginationComponent: React.FC<PaginationComponentProps> = ({
    countRows,
    page,
    rowsPerPage,
    onPageChange: handleChangePage,
    onRowsPerPageChange: handleChangeRowsPerPage,
    rowsPerPageOptions
  }) => {
    return (
        countRows && countRows > 10 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "24px 0 0",
                "@media (max-width: 600px)": {
                  padding: "12px 0 0",
                },
              }}
            >
              <CustomTablePagination
                count={countRows ?? 0}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={rowsPerPageOptions}
              />
            </Box>
          ) : (
            <Box
              display="flex"
              justifyContent="flex-end"
              alignItems="center"
              sx={{
                padding: "16px",
                backgroundColor: "#fff",
                borderRadius: "4px",
                "@media (max-width: 600px)": {
                  padding: "12px",
                },
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Nunito Sans",
                  fontWeight: "400",
                  fontSize: "12px",
                  lineHeight: "16px",
                  marginRight: "16px",
                }}
              >
                {`1 - ${countRows} of ${countRows}`}
              </Typography>
            </Box>
          )
    )
};

export default PaginationComponent;