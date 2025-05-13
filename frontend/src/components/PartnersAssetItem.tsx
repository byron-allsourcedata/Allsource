import { IconButton, Typography, Link } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import { Box } from "@mui/system";
import Image from "next/image";
import { useState } from "react";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

interface AssetsData {
    id: number;
    file_url: string;
    preview_url: string | null;
    type: string;
    title: string;
    file_extension: string;
    file_size: string;
    video_duration: string;
    isFavorite: boolean;
}

interface PartnersAseetsProps {
    toggleFavorite: (id: number) => void;
    handleDownloadFile: () => void;
    asset: AssetsData;
    isAdmin: boolean;
    handleDeleteAsset: () => void;
    handleEditAsset: () => void;
}

const PartnersAssetItem: React.FC<PartnersAseetsProps> = ({ 
    asset, isAdmin, 
    toggleFavorite, 
    handleDownloadFile,  
    handleDeleteAsset,
    handleEditAsset
    }) => {
    const [videoWidth, setVideoWidth] = useState(154);
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

    const handlePlayClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation(); 
        window.open(asset.file_url, '_blank', 'noopener,noreferrer');
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchor(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setMenuAnchor(null);
    };
    const open = Boolean(menuAnchor);
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
            position: asset.type === "image" || "presentation" ? "relative" : "static",
            overflow: asset.type === "image" || "presentation" ? "hidden" : "visible",
            '@media (max-width: 360px)': {width: "calc(50% - 8px)", padding: "8px"}
            }}
        >
            <Box 
                sx={{
                    position: "relative",
                    width: "154px",
                    height: "79px",
                    borderRadius: "4px",
                    background: asset.type === "document" 
                    ? `#EFF1F5 url(${asset.file_extension === "pdf" ? '/pdf.svg' : '/xslx.svg'}) no-repeat center center` 
                    : "transparent none",
                    backgroundImage: asset.type === "document" 
                    ? asset.file_extension === "Pdf" ? 'url(/pdf.svg)' : 'url(/xslx.svg)' 
                    : "none",
                    '@media (max-width: 360px)': {width: "140px"}
                }}>
                {asset.type == "document" ? "" : <Link href={asset.file_url} target="_blank" rel="noopener noreferrer" download>
                    <Image src={asset.preview_url ?? "/pdf.svg"} alt="preview image" height={79} width={videoWidth}/>
                </Link>}

                {asset.type === "video" 
                ? 
                <>            
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
                        {asset.video_duration}
                    </Box>
                </>
                : ""}
                
                {!isAdmin && <Box
                    sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    height: "16px",
                    width: "16px",
                    }}
                >
                    <IconButton onClick={() => toggleFavorite(asset.id)} sx={{ width: '12.84px', height: '10.96px' }} >
                    {asset.isFavorite 
                    ?  <FavoriteIcon sx={{ width: '12.84px', height: '10.96px', color: "rgba(248, 70, 75, 1)"  }} /> 
                    : <FavoriteBorderIcon sx={{ width: '12.84px', height: '10.96px'  }} />}
                    </IconButton>
                </Box>}
            </Box>

            <Box sx={{
                display: "flex",
                justifyContent: "space-between",
            }}>
                {asset.type == "video" ?
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
                : 
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
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
                    {asset.type === "document" ? asset.file_extension : asset.file_size }
                    </Typography>
                </Box>}
                {isAdmin ? <IconButton onClick={handleOpenMenu} sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                <MoreVertOutlinedIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(56, 152, 252, 1)' } }} />
            </IconButton> :
            <IconButton onClick={handleDownloadFile} sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(56, 152, 252, 1)' } }} />
            </IconButton>}
            <Popover
                open={open}
                anchorEl={menuAnchor}
                onClose={handleCloseMenu}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                >
                <List
                    sx={{ 
                        width: '100%', maxWidth: 360}}
                    >
                    <ListItemButton sx={{':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {
                            handleDeleteAsset()
                            handleCloseMenu()
                        }}>
                        <ListItemText primary="Delete"/>
                    </ListItemButton>
                    <ListItemButton sx={{':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {
                            handleEditAsset()
                            handleCloseMenu()
                        }}>
                        <ListItemText primary="Edit"/>
                    </ListItemButton>
                    <ListItemButton sx={{':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {
                            handleDownloadFile()
                            handleCloseMenu()
                        }}>
                        <ListItemText primary="Download" />
                    </ListItemButton>
                </List>
            </Popover>
            </Box>
        </Box>
    )
};

export default PartnersAssetItem;