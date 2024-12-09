import { IconButton, Typography, Link } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import { Box } from "@mui/system";
import Image from "next/image";
import { useState } from "react";

interface MonthDetailsProps {
    handleDownloadFile: any
    asset: any;
}

const PartnersAssetsImage: React.FC<MonthDetailsProps> = ({ handleDownloadFile, asset }) => {
    const [videoWidth, setVideoWidth] = useState(154);
    const [loading, setLoading] = useState(false);
    return (
        <Box
            sx={{
            width: "174px",
            border: "1px solid #E0E0E0",
            borderRadius: "4px",
            padding: "10px",
            boxShadow: "0px 1px 4px 0px #00000040",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            position: "relative",
            overflow: "hidden",
            '@media (max-width: 360px)': {width: "calc(50% - 8px)", padding: "8px"}
            }}
        >
            <Link href={asset.file_url} target="_blank" rel="noopener noreferrer">
                <Image src={asset.preview_url} alt="Pitch decks image" height={79} width={videoWidth}/>
            </Link>
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
                    {asset.file_size}
                    </Typography>
                </Box>
                <IconButton onClick={() => handleDownloadFile(asset.id, asset.file_url)} sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                    <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
                </IconButton>
            </Box>
        </Box>
    )
};

export default PartnersAssetsImage;