"use client"
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box} from "@mui/material";
import { useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import PartnersAsset from '@/components/PartnersAsset';

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
    asset: AssetsData[] | [];
}

const Assets: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [assets, setAssets] = useState<PartnersAssetsData[]>([{type: "Videos", asset: []}, {type: "Pitch decks", asset: []}, {type: "Images", asset: []}, {type: "Documents", asset: []}, ]);
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleProfileMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    const fetchRewards = async () => {
        setLoading(true);
        try {

            const response = await axiosInstance.get("/partners-assets");
            const assetsByType = response.data.reduce((acc: Record<string, AssetsData[]>, item: AssetsData) => {
                if (!acc[item.type]) {
                    acc[item.type] = [];
                }
                acc[item.type].push({ ...item });
                return acc;
            }, {});


            setAssets([
                {type: "Videos", asset: assetsByType["video"] || []},
                {type: "Pitch decks", asset: assetsByType["presentation"] || []},
                {type: "Images", asset: assetsByType["image"] || []},
                {type: "Documents", asset: assetsByType["document"] || []},
            ]);


        } catch (error) {
            console.error("Error fetching rewards:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAsset = async (id: number) => {
        try {
            await axiosInstance.delete(`partners-assets/${id}`);
            removeAssetById(id);

        } catch (error) {
            console.error("Error fetching rewards:", error);
        }
    }

    useEffect(() => {
        fetchRewards()
    }, []);

    const removeAssetById = (id: number) => {
        setAssets((prevAssets) =>
            prevAssets.map((group) => ({
                ...group,
                asset: group.asset.filter((item) => item.id !== id),
            }))
        );
    };

    const updateOrAddAsset = (type: string, newAsset: AssetsData) => {
        setAssets((prevAssets) => 
            prevAssets.map((group) => {
                if (group.asset[0]?.type === type) {
                    const existingAssetIndex = group.asset.findIndex((item) => item.id === newAsset.id);
                    if (existingAssetIndex !== -1) {
                        const updatedAssets = [...group.asset];
                        updatedAssets[existingAssetIndex] = newAsset;
                        return { ...group, asset: updatedAssets };
                    } else {
                        return { ...group, asset: [...group.asset, newAsset] };
                    }
                }
                return group;
            })
        );
    };

    return (
        <>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }} >
                {assets.map((data, index) => (
                    <PartnersAsset deleteAsset={handleDeleteAsset} updateOrAddAsset={updateOrAddAsset} key={index} data={data} isAdmin={true} />
                ))}
            </Box> 
        </>
)};

export default Assets;