import {  
    Typography,
    Button,
    Box,
    CardContent,
    CardActions,
    Card 
} from "@mui/material";
import { useRouter } from "next/navigation";

const BlurAudience = ({
}) => {
    const router = useRouter();

    const navigateToSourcePage = () => {
        router.push("./sources");
    };

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
              backgroundImage: "url('/audience_blur.svg')",
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
              width: '100%',
              maxWidth: 400,
              zIndex: 2,
              p: 2,
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
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography className="first-sub-title" align="center">
                    Import your first Source to discover new options
                </Typography>
                <Box
                  sx={{
                    height: 140,
                    backgroundImage: 'url(/audience.svg)',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    borderRadius: 2,
                  }}
                />
                <Typography className="description" align="center">
                    Create a Source using your Pixel data or upload a CSV file containing your existing customer data. 
                </Typography>
              </CardContent>
              <CardActions sx={{ pt: 0, pl: 2, pr: 2, pb: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={navigateToSourcePage}
                  sx={{
                    backgroundColor: '#3898FC',
                    '&:hover': {
                      backgroundColor: '#1E88E5',
                    },
                    '&:active': {
                      backgroundColor: '#74B7FD',
                    },
                    boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  <Typography
                    className="description"
                    style={{ color: '#fff' }}
                  >
                    Import Source
                  </Typography>
                </Button>
              </CardActions>
            </Card>
          </Box>
        </Box>
      );
};

export default BlurAudience;
