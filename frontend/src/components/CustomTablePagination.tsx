import React from 'react';
import { TablePagination, IconButton, Box, Typography } from '@mui/material';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import { ChevronLeft, ChevronRight, ExpandMore as ChevronDown } from '@mui/icons-material';

interface CustomTablePaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rowsPerPageOptions?: number[];
}

const CustomTablePagination: React.FC<CustomTablePaginationProps> = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions,
}) => {

  const handleFirstPage = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, 0);
  };

  const handleLastPage = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  const handlePrevPage = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page - 1);
  };

  const handleNextPage = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1);
  };

  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" className='third-sub-title'sx={{
        lineHeight: '16px !important',
        marginRight: '8px',
        display: 'inline-block', // Меняет поведение на строчный блочный элемент
        overflow: 'hidden', // Скрывает лишний текст
    }}>Show rows:</Typography>
      
      <TablePagination
        component="div"
        count={count}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={rowsPerPageOptions}
        labelRowsPerPage=""
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
        sx={{
          '& .MuiTablePagination-toolbar': {
            paddingLeft: 0
           }, 
          '& .MuiTablePagination-input': {
            border: '1px solid #ebebeb',
            borderRadius: '4px',
            marginRight: '16px',
            marginLeft: 0,
            fontFamily: 'Nunito Sans',
            fontSize: '12px',
            fontWeight: '400',
            color: '#7a7a7a'
          },
          '& .MuiTablePagination-displayedRows': {
            fontFamily: 'Nunito Sans',
            fontWeight: '400',
            fontSize: '12px',
            lineHeight: '16px',
            marginRight: '16px'
          }
        }}
        SelectProps={{
            IconComponent: ChevronDown, // This will replace the dropdown icon
            sx: {
                '& svg': {
                  top: '5px',
                  right: '5px',
                  width: '16px', // Set the width of the icon
                  height: '16px', // Set the height of the icon
                },
              },
          }}
        ActionsComponent={() => (
          <Box display="flex" alignItems="center">
            <IconButton
              onClick={handleFirstPage}
              disabled={page === 0}
              aria-label="first page"
              sx={{ padding: 0, marginRight: '16px', "@media (max-width: 700px)": { marginRight: '8px' } }}
            >
              <FirstPageIcon />
            </IconButton>

            <IconButton
              onClick={handlePrevPage}
              disabled={page === 0}
              aria-label="previous page"
              sx={{ padding: 0, marginRight: '16px', "@media (max-width: 700px)": { marginRight: '8px' } }}
            >
              <ChevronLeft />
            </IconButton>

            <IconButton
              onClick={handleNextPage}
              disabled={page >= Math.ceil(count / rowsPerPage) - 1}
              aria-label="next page"
              sx={{ padding: 0, marginRight: '16px', "@media (max-width: 700px)": { marginRight: '8px' } }}
            >
              <ChevronRight />
            </IconButton>

            <IconButton
              onClick={handleLastPage}
              disabled={page >= Math.ceil(count / rowsPerPage) - 1}
              aria-label="last page"
              sx={{ padding: 0 }}
            >
              <LastPageIcon />
            </IconButton>
          </Box>
        )}
      />
    </Box>
  );
};

export default CustomTablePagination;
