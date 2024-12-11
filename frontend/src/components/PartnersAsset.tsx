import { Box, Typography} from "@mui/material";
import PartnersAssetsVideo from '@/components/PartnersAssetsVideo';
import PartnersAssetsImage from '@/components/PartnersAssetsImage';
import PartnersAssetsDocuments from '@/components/PartnersAssetsDocuments';

interface AssetsData {
    id: number;
    file_url: string;
    preview_url: string;
    type: string;
    title: string;
    file_extension: string;
    file_size: string;
}

interface PartnersAssetsData {
    type: string;
    asset: AssetsData[];
}

interface PartnersAssetProps {
    data: any;
    toggleFavorite: any
  }

const PartnersAsset: React.FC<PartnersAssetProps> = ({data, toggleFavorite }) => {
    const handleDownloadFile = (fileUrl: string) => {;
        window.location.href = fileUrl;
        window.history.back;
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
                                return <PartnersAssetsVideo toggleFavorite={toggleFavorite} handleDownloadFile={handleDownloadFile} key={item.id} asset={item}/>
                            case "document":
                                return <PartnersAssetsDocuments  toggleFavorite={toggleFavorite} handleDownloadFile={handleDownloadFile} key={item.id} asset={item}/>
                            default:
                                return <PartnersAssetsImage toggleFavorite={toggleFavorite} handleDownloadFile={handleDownloadFile} key={item.id} asset={item}/>
                        }
                    })}
                    <Box sx={{
                        border: "1px dashed rgba(80, 82, 178, 1)",
                        width: "62px",
                        height: "62px",
                        borderRadius: "4px",
                    }}/>
                </Box>
            </Box>
        </Box>
    );
};

export default PartnersAsset;