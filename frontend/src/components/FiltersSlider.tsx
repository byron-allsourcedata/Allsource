import React from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

interface FilterPopupProps {
  open: boolean;
  onClose: () => void;
}

const FilterPopup: React.FC<FilterPopupProps> = ({ open, onClose }) => {
  const [selectedButton, setSelectedButton] = React.useState<string | null>(null);

  const handleButtonClick = (label: string) => {
    setSelectedButton(label);
  };

  return (
    <>
      <Backdrop open={open} sx={{ zIndex: 1200, color: '#fff' }} />
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: '40%',
            position: 'fixed',
            zIndex: 1301,
            top: 0,
            bottom: 0,
            '@media (max-width: 600px)': {
              width: '100%',
            }
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #e4e4e4' }}>
          <Typography variant="h6" sx={{ textAlign: 'center', color: '#4A4A4A', fontFamily: 'Nunito', fontWeight: '600', fontSize: '22px', lineHeight: '25.2px' }}>
            Filter Search
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', }}>
          <TextField
            placeholder="Search people"
            variant="outlined"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Button sx={{ textTransform: 'none', textDecoration: 'none' }}>
                    <SearchIcon sx={{ color: 'rgba(101, 101, 101, 1)' }} fontSize='medium' />
                  </Button>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {['Abandon Checkout leads in last 30 days', 'Converters in last 30 days', 'Non Converters in last 30 days', 'Add to cart leads in last 30 days'].map((label) => (
              <Button
                key={label}
                onClick={() => handleButtonClick(label)}
                sx={{
                  width: 'calc(50% - 10px)',
                  height: '33px',
                  textTransform: 'none',
                  padding: '8px 0px 0px 0px',
                  gap: '10px',
                  textAlign: 'center',
                  borderRadius: '4px',
                  border: '1px solid rgba(220, 220, 239, 1)',
                  backgroundColor: selectedButton === label ? 'rgba(219, 219, 240, 1)' : '#fff',
                  color: '#000',
                  fontFamily: 'Nunito',
                  opacity: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {label}
              </Button>
            ))}
          </Box>

        </Box>
      </Drawer>
    </>
  );
};

export default FilterPopup;
