import { IconButton, Typography, Link } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import { Box } from "@mui/system";
import Image from "next/image";
import { useState } from "react";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';

interface MonthDetailsProps {
    toggleFavorite: any;
    handleDownloadFile: any
    asset: any;
}

const PartnersAssetsImage: React.FC<MonthDetailsProps> = ({ toggleFavorite, handleDownloadFile, asset }) => {
    const [videoWidth, setVideoWidth] = useState(154);
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
        <Box 
            sx={{
                position: "relative",
            }}>
            <Link href={asset.file_url} target="_blank" rel="noopener noreferrer" download>
                <Image src={asset.preview_url} alt="Pitch decks image" height={79} width={videoWidth}/>
            </Link>
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
                {asset.isFavorite ?  <FavoriteIcon sx={{ width: '12.84px', height: '10.96px', color: "rgba(248, 70, 75, 1)"  }} /> : <FavoriteBorderIcon sx={{ width: '12.84px', height: '10.96px'  }} />}
                </IconButton>
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
                    {asset.file_size}
                    </Typography>
                </Box>
                <IconButton onClick={() => handleDownloadFile(asset.file_url)} sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                    <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
                </IconButton>
            </Box>
        </Box>
        </Box>
    )
};

export default PartnersAssetsImage;