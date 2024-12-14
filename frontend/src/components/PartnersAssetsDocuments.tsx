import { IconButton, Typography } from "@mui/material";
import { useState } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import { Box } from "@mui/system";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import axiosInstance from "@/axios/axiosInterceptorInstance";

interface AssetsData {
    id: number;
    file_url: string;
    preview_url: string;
    type: string;
    title: string;
    file_extension: string;
    file_size: string;
    isFavorite: boolean;
}

interface PartnersAseetsProps {
    toggleFavorite: (id: number) => void;
    handleDownloadFile: (fileUrl: string) => void;
    asset: AssetsData;
    isAdmin: boolean;
    handleFormOpenPopup: () => void;
    handleDeleteAsset: any;
    handleEditAsset: any;
    handleAdminMenu: any;
    adminMenuOpen: any;
    anchorEl: any
}

const PartnersAssetsDocuments: React.FC<PartnersAseetsProps> = ({
    asset, isAdmin, 
    toggleFavorite, 
    handleDownloadFile,  
    handleFormOpenPopup,
    handleDeleteAsset,
    handleEditAsset,
    handleAdminMenu,
    adminMenuOpen,
    anchorEl}) => {
    // const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    // const [anchorEl, setAnchorEl] = useState(null);

    // const handleAdminMenu = (e: any) => {
    //     setAdminMenuOpen((prevState) => !prevState)
    //     setAnchorEl(e.currentTarget);
    // }

    // const handleDeleteAsset = async () => {
    //     try {
    //         setAdminMenuOpen(false)
    //         const response = await axiosInstance.delete(`partners-assets/${asset.id}`);
    //         console.log({response})

    //     } catch (error) {
    //         console.error("Error fetching rewards:", error);
    //     }
    // }

    // const handleEditAsset = () => {
    //     handleFormOpenPopup()
    // }

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
            backgroundImage: asset.file_extension === "pdf" ? 'url(/pdf.svg)' : 'url(/xslx.svg)',
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "40px 40px",
            position: "relative",
            '@media (max-width: 360px)': {width: "140px"}
        }}>
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
                {asset.isFavorite ?  <FavoriteIcon sx={{ width: '12.84px', height: '10.96px', color: "rgba(248, 70, 75, 1)"  }} /> : <FavoriteBorderIcon sx={{ width: '12.84px', height: '10.96px'  }} />}
                </IconButton>
            </Box>}
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
            {isAdmin ? <IconButton onClick={(event) => handleAdminMenu(event)} sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                <MoreVertOutlinedIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
            </IconButton> :
            <IconButton onClick={() => handleDownloadFile(asset.file_url)} sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
            </IconButton>}
            <Popover
                open={adminMenuOpen}
                onClose={handleAdminMenu}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                >
                <List
                    sx={{ 
                        width: '100%', maxWidth: 360}}
                    >
                    <ListItemButton sx={{':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}}>
                        <ListItemText primary="Delete" onClick={handleDeleteAsset}/>
                    </ListItemButton>
                    <ListItemButton sx={{':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}}>
                        <ListItemText primary="Edit" onClick={handleEditAsset}/>
                    </ListItemButton>
                    <ListItemButton sx={{':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => handleDownloadFile(asset.file_url)}>
                        <ListItemText primary="Download" />
                    </ListItemButton>
                </List>
            </Popover> 
        </Box>
    </Box>
    )
};

export default PartnersAssetsDocuments;