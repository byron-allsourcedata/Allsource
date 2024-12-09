import { IconButton, Typography } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import { Box } from "@mui/system";

interface MonthDetailsProps {
    handleDownloadFile: any;
    asset: any;
}

const PartnersAssetsDocuments: React.FC<MonthDetailsProps> = ({ handleDownloadFile, asset }) => {
    return (
    <Box
        sx={{
        width: "174px",
        border: "1px solid #E0E0E0",
        borderRadius: "4px",
        padding: "10px",
        boxSizing: "border-box",
        boxShadow: "0px 1px 4px 0px #00000040",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        '@media (max-width: 360px)': {width: "calc(50% - 8px)", padding: "8px"}
        }}
    >
        <Box sx={{
            width: "154px",
            height: "79px",
            borderRadius: "4px",
            backgroundColor: "#EFF1F5",
            backgroundImage: "url(download.svg)",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "40px 40px",
            '@media (max-width: 360px)': {width: "140px"}
        }}>
        </Box>
        <Box sx={{
            display: "flex",
            justifyContent: "space-between",
        }}>
            <Box sx={{
                display: "flex",
                flexDirection: "column",
            }}>
                <Typography
                sx={{
                    fontFamily: "Roboto",
                    color: "#202124",
                    fontSize: "10px",
                    fontWeight: "600",
                    lineHeight: "14px",
                    letterSpacing: "0.005em"
                }}
                >
                {asset.title}
                </Typography>
                <Typography
                sx={{
                    fontFamily: "Roboto",
                    color: "#5F6368",
                    fontSize: "10px",
                    fontWeight: "400",
                    lineHeight: "14px",
                    letterSpacing: "0.005em"
                }}
                >
                {asset.file_extension}
                </Typography>
            </Box>
            <IconButton onClick={() => handleDownloadFile(asset.id, asset.file_url)} sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
            </IconButton>
        </Box>
    </Box>
    )
};

export default PartnersAssetsDocuments;