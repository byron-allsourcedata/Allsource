import { Box, Typography} from "@mui/material";
import { useState } from "react";
import PartnersAssetsVideo from '@/components/PartnersAssetsVideo';
import PartnersAssetsImage from '@/components/PartnersAssetsImage';
import PartnersAssetsDocuments from '@/components/PartnersAssetsDocuments';

interface AssetsData {
    id: number;
    file_url: string;
    preview_url: string;
    type: string;
    title: string;
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
    // const [assets, setAssets] = useState<PartnersAssetsData>({videos: [], presentations: [], images: [], documents: []});

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
                                return <PartnersAssetsVideo key={item.id} asset={item}/>
                            case "document":
                                return <PartnersAssetsDocuments key={item.id} asset={item}/>
                            default:
                                return <PartnersAssetsImage key={item.id} asset={item}/>
                        }
                    })}
                </Box>
            </Box>
        </Box>
    );
};

export default PartnersAsset;