import React, { useState } from 'react';
import { Box, Typography} from "@mui/material";
import PartnersAssetsVideo from '@/components/PartnersAssetsVideo';
import PartnersAssetsImage from '@/components/PartnersAssetsImage';
import PartnersAssetsDocuments from '@/components/PartnersAssetsDocuments';
import FormDownloadPopup from '@/components/FormDownloadPopup'

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

interface PartnersAssetsData {
    type: string;
    asset: AssetsData[];
}

interface PartnersAssetProps {
    updateOrAddAsset?: (type: string, newAsset: AssetsData) => void;
    data: PartnersAssetsData;
    deleteAsset?: any
    toggleFavorite?: (id: number) => void
    isAdmin?: boolean
  }

const PartnersAsset: React.FC<PartnersAssetProps> = ({data, deleteAsset, updateOrAddAsset = () => {}, toggleFavorite = () => {}, isAdmin = false}) => {
    const [formPopupOpen, setFormPopupOpen] = useState(false);
    const [typeAsset, setTypeAsset] = useState("video")
    const [fileData, setFileData] = useState<any>(null);
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const handleDownloadFile = (fileUrl: string) => {;
        window.location.href = fileUrl;
        window.history.back;
    };

    const handleFormOpenPopup = (type: string | null = null) => {
        setFormPopupOpen(true)
        if(type) {
            handleTypeAsset(type)
        }
    }

    const handleTypeAsset = (type: string) => {
        switch (type) {
            case "Videos":
                setTypeAsset("video")
                break
            case "Images":
                setTypeAsset("image")
                break
            case "Pitch decks":
                setTypeAsset("presentation")
                break
            case "Documents":
                setTypeAsset("document")
                break
        }
    }

    const handleFormClosePopup = () => {
        setFormPopupOpen(false)
    }


    const handleAdminMenu = (e: any) => {
        setAdminMenuOpen((prevState) => !prevState)
        setAnchorEl(e.currentTarget);
    }

    const handleDeleteAsset = async (id: number) => {
        setAdminMenuOpen(false)
        deleteAsset(id)
    }

    const handleEditAsset = (item: AssetsData) => {
        setAdminMenuOpen(false)
        setTypeAsset(item.type)
        setFileData({ id: item.id, title: item.title});
        handleFormOpenPopup();
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }} >
            <Box sx={{ borderBottom: "1px solid #EBEBEB", paddingBottom: 4}}>
                <Typography
                variant="body1"
                sx={{
                    mb: 2,
                    fontFamily: "Nunito Sans",
                    fontSize: "16px",
                    color: "#202124",
                    fontWeight: "600",
                    lineHeight: "22px",
                }}
                >
                {data.type}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap",  gap: 3, '@media (max-width: 360px)': { gap: 2 } }}>
                    {data.asset.map((item: AssetsData) => {
                        switch (item.type) {
                            case "video":
                                return <PartnersAssetsVideo
                                key={item.id} 
                                asset={item} 
                                isAdmin={isAdmin}  
                                toggleFavorite={toggleFavorite} 
                                handleDownloadFile={handleDownloadFile} 
                                handleDeleteAsset={handleDeleteAsset}
                                handleAdminMenu={handleAdminMenu}
                                handleEditAsset={() => handleEditAsset(item)}
                                adminMenuOpen={adminMenuOpen}
                                anchorEl={anchorEl}
                                />
                            case "document":
                                return <PartnersAssetsDocuments 
                                key={item.id} 
                                asset={item} 
                                isAdmin={isAdmin}  
                                toggleFavorite={toggleFavorite} 
                                handleDownloadFile={handleDownloadFile} 
                                handleDeleteAsset={handleDeleteAsset}
                                handleAdminMenu={handleAdminMenu}
                                handleEditAsset={() => handleEditAsset(item)}
                                adminMenuOpen={adminMenuOpen}
                                anchorEl={anchorEl}
                                />
                            default:
                                return <PartnersAssetsImage
                                key={item.id} 
                                asset={item} 
                                isAdmin={isAdmin}  
                                toggleFavorite={toggleFavorite} 
                                handleDownloadFile={handleDownloadFile} 
                                handleDeleteAsset={handleDeleteAsset}
                                handleAdminMenu={handleAdminMenu}
                                handleEditAsset={() => handleEditAsset(item)}
                                adminMenuOpen={adminMenuOpen}
                                anchorEl={anchorEl}
                                />
                        }
                    })}
                    <FormDownloadPopup 
                        fileData={fileData} 
                        open={formPopupOpen} 
                        onClose={handleFormClosePopup} 
                        updateOrAddAsset={updateOrAddAsset}
                        type={typeAsset} />
                    {isAdmin && <Box onClick={() => handleFormOpenPopup(data.type)} sx={{ 
                        border: "1px dashed rgba(80, 82, 178, 1)", 
                        width: "62px", 
                        height: "62px", 
                        borderRadius: "4px", 
                        alignSelf: "flex-end", 
                        backgroundImage: 'url(/add-square.svg)', 
                        backgroundPosition: "center", 
                        backgroundRepeat: "no-repeat", 
                        backgroundSize: "40px 40px", 
                        cursor: "pointer", 
                        "&:hover": { backgroundColor: "#EFF1F5" }, 
                    }}/>}
                </Box>
            </Box>
        </Box>
    );
};

export default PartnersAsset;