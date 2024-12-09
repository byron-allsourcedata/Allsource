import { Box, Typography} from "@mui/material";
import { useState } from "react";
import PartnersAssetsVideo from '@/components/PartnersAssetsVideo';
import PartnersAssetsImage from '@/components/PartnersAssetsImage';
import PartnersAssetsDocuments from '@/components/PartnersAssetsDocuments';
import axiosInstance from "@/axios/axiosInterceptorInstance";

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
  }

const PartnersAsset: React.FC<PartnersAssetProps> = ({ data }) => {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState<boolean>(false);

    const handleDownloadFile = async (id: number, fileUrl: string,) => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/partners-assets/download', {
                params: {
                    asset_id: id
                },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const filename = fileUrl.split('/').pop();
            if (filename) {
                link.setAttribute('download', filename);

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
    
                console.log('File downloaded successfully:', filename);
            }
        } catch (error) {
        } finally {
            setLoading(false)
        }
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
                        console.log(item)
                        switch (item.type) {
                            case "video":
                                return <PartnersAssetsVideo handleDownloadFile={handleDownloadFile} key={item.id} asset={item}/>
                            case "document":
                                return <PartnersAssetsDocuments handleDownloadFile={handleDownloadFile} key={item.id} asset={item}/>
                            default:
                                return <PartnersAssetsImage handleDownloadFile={handleDownloadFile} key={item.id} asset={item}/>
                        }
                    })}
                </Box>
            </Box>
        </Box>
    );
};

export default PartnersAsset;