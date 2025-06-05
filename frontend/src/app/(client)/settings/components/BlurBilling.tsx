import {  
    Typography,
    Box,
    CardContent,
    Card 
} from "@mui/material";

const BlurBilling = ({
}) => {
    return (
        <Box
          sx={{
            position: 'relative',
            height: 800,
            overflow: 'hidden',
            borderRadius: "4px",
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "url('/setting-billing_blur.svg')",
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              filter: 'blur(10px)',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              zIndex: 1,
            }}
          />
          
          <Box
            sx={{
              position: 'absolute',
              top: '30%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '166px',
              zIndex: 2,
            }}
          >
            <Card 
              variant="outlined" 
              sx={{
                border: 'none',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.25)',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ display: 'flex', flexDirection: 'column', bgcolor: "rgba(235, 245, 255, 1)", padding: "8px 16px",  gap: 2, "&:last-child":  {paddingBottom: "16px"}}}>
                <Typography align="center" sx={{fontWeight: 600, fontSize: 20, fontFamily: "Nunito Sans", lineHeight: "140%", letterSpacing: "0%", color: "rgba(56, 152, 252, 1)"}}>
                  Coming soon...
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      );
};

export default BlurBilling;
