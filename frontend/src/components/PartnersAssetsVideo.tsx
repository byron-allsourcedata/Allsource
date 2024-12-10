import { IconButton, Typography, Link } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import { Box } from "@mui/system";
import Image from "next/image";
import { useState } from "react";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

interface MonthDetailsProps {
    toggleFavorite: any;
    handleDownloadFile: any
    asset: any;
}

const PartnersAssetsVideo: React.FC<MonthDetailsProps> = ({toggleFavorite, handleDownloadFile, asset }) => {
    const handlePlayClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation(); 
        window.open(asset.file_url, '_blank', 'noopener,noreferrer');
    };
    const [videoWidth, setVideoWidth] = useState(154);

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
        <Box
            sx={{position: "relative", width: "154px", height: "79px", '@media (max-width: 360px)': {width: "140px"}}}
            >
                <Link href={asset.file_url} target="_blank" rel="noopener noreferrer" >
                    <Image src={asset.preview_url} alt="Pitch decks image" height={79} width={videoWidth}/>
                </Link>
            <Box 
                sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                }}>
                <IconButton onClick={handlePlayClick} sx={{ ':hover': { backgroundColor: 'transparent', }}} >
                    <SmartDisplayIcon sx={{ width: '22.91px', height: '16.18px', color: 'rgba(255, 255, 255, 1)', ':hover': { color: 'rgba(255, 255, 255, 0.8)' } }} />
                </IconButton>
           </Box>
            <Box
                sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                height: "13.48px",
                width: "28.31px",
                fontFamily: "Roboto",
                fontSize: "7.74px",
                fontWeight: "600",
                lineHeight: "7.9px",
                color: "#fff",
                backgroundColor: "#232730",
                padding: "2.74px 5.15px",
                }}
            >
                12:00
            </Box>
            <Box
                sx={{
                position: "absolute",
                top: 0,
                right: 0,
                height: "16px",
                width: "16px",
                }}
            >
                <IconButton onClick={() => toggleFavorite(asset.id)} sx={{ width: '12.84px', height: '10.96px' }} >
                    <FavoriteBorderIcon sx={{ width: '12.84px', height: '10.96px'  }} />
                </IconButton>
            </Box>
        </Box>
        <Box sx={{
            display: "flex",
            justifyContent: "space-between",
        }}>
        <Typography
        sx={{
            fontFamily: "Roboto",
            color: "#808080",
            fontSize: "10px",
            fontWeight: "400",
            lineHeight: "11.72px",
            letterSpacing: "0.005em"
        }}
        >
        {asset.title}
        </Typography>
        <IconButton onClick={() => handleDownloadFile(asset.id, asset.file_url)} sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
            <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
        </IconButton>
        </Box>
    </Box>
    );
};

export default PartnersAssetsVideo;