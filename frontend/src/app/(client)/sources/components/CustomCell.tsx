import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TableCell, Tooltip, Typography, Box } from '@mui/material';
import { sourcesStyles } from '../sourcesStyles';

interface MyTableCellProps {
  rowExample: string;
  loaderForTable?: boolean;
  customCellStyles?: any;
}

const createCommonCellStyles = () => ({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const CustomCell: React.FC<MyTableCellProps> = ({ rowExample, loaderForTable, customCellStyles = {} }) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);

  const checkOverflow = useCallback(() => {
    if (textRef.current) {
      setIsOverflow(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    checkOverflow();
  }, [rowExample, checkOverflow]);

  useEffect(() => {
    const handleResize = () => {
      checkOverflow();
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [checkOverflow]);

  const cellContent = (
    <Typography
      ref={textRef}
      className="table-data"
      sx={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {rowExample}
    </Typography>
  );

  return (
    <TableCell
      className="sticky-cell"
      sx={{
        position: 'relative',
        zIndex: 1,
        backgroundColor: 'inherit',
        ...createCommonCellStyles(),
        ...sourcesStyles.table_array,
        ...customCellStyles,
      }}
    >
      <Box sx={{ display: 'flex' }}>
        {isOverflow ? (
          <Tooltip
            title={
              <Box
                sx={{
                  backgroundColor: '#fff',
                  m: 0,
                  p: 0,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Typography
                  className="table-data"
                  component="div"
                  sx={{ fontSize: '12px !important' }}
                >
                  {rowExample}
                </Typography>
              </Box>
            }
            sx={{ marginLeft: '0.5rem !important' }}
            componentsProps={{
              tooltip: {
                sx: {
                  backgroundColor: '#fff',
                  color: '#000',
                  boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.12)',
                  border: '0.2px solid rgba(255, 255, 255, 1)',
                  borderRadius: '4px',
                  maxHeight: '100%',
                  maxWidth: '500px',
                  padding: '11px 10px',
                  marginLeft: '0.5rem !important',
                },
              },
            }}
            placement="right"
          >
            <Typography className="table-data"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {cellContent}
            </Typography>
          </Tooltip>
        ) : (
          cellContent
        )}
      </Box>
    </TableCell>
  );
};

export default CustomCell;
