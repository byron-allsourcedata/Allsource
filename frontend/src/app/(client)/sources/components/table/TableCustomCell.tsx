import React, { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { TableCell, Tooltip, Typography, Box, TextField, Button } from '@mui/material';
import { sourcesStyles } from '../../sourcesStyles';

interface MyTableCellProps {
  rowExample?: string;
  loaderForTable?: boolean;
  customCellStyles?: Record<string, any>;
  children?: ReactNode;
  renderContent?: () => ReactNode;
}

const createCommonCellStyles = () => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const TableCustomCell: React.FC<MyTableCellProps> = ({
  rowExample,
  loaderForTable,
  customCellStyles = {},
  children,
  renderContent,
}) => {
  const cellContent = renderContent
    ? renderContent()
    : children ?? rowExample ?? '';

  const contentIsString = typeof cellContent === 'string';

  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);

  const checkOverflow = useCallback(() => {
    if (textRef.current) {
      setIsOverflow(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    if (contentIsString) {
      checkOverflow();
    }
  }, [cellContent, checkOverflow, contentIsString]);

  useEffect(() => {
    if (contentIsString) {
      const handleResize = () => {
        checkOverflow();
      };
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [checkOverflow, contentIsString]);

  const basicContent = contentIsString ? (
    <Typography
      ref={textRef}
      className="table-data"
      sx={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {cellContent}
    </Typography>
  ) : (
    <Box sx={{ width: '100%' }}>{cellContent}</Box>
  );

  const finalContent =
    contentIsString && isOverflow ? (
      <Tooltip
        title={
          <Box
            sx={{
              backgroundColor: '#fff',
              m: 0,
              p: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography
              className="table-data"
              component="div"
              sx={{ fontSize: '12px !important' }}
            >
              {cellContent}
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
        {basicContent}
      </Tooltip>
    ) : (
      basicContent
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
      <Box sx={{ display: 'flex' }}>{finalContent}</Box>
    </TableCell>
  );
};

export default TableCustomCell;
