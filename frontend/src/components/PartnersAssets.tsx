import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, MenuItem, Select, SelectChangeEvent} from "@mui/material";
import { useEffect, useState } from "react";
import CustomizedProgressBar from "./CustomizedProgressBar";
import { suppressionsStyles } from "@/css/suppressions";
import Image from "next/image";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PartnersAsset from '@/components/PartnersAsset';

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

interface PartnersAssetsData {
    type: string;
    asset: AssetsData[] | [];
}

const initialValue = [
    {type: "Videos", asset: []}, 
    {type: "Pitch decks", asset: []}, 
    {type: "Images", asset: []}, 
    {type: "Documents", asset: []}, 
]

const PartnersAssets: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [assets, setAssets] = useState<PartnersAssetsData[]>(initialValue);
    const [asset, setAsset] = useState<string>("All");
    const typeAssets: string[] = ["All", "Videos", "Pitch decks", "Images", "Documents", "Favorites"];
    const [favorites, setFavorites] = useState<PartnersAssetsData[]>([{type: "Favorites", asset: []}])
    const filteredAssets = asset === "All"
            ? assets
            : asset === "Favorites" ? favorites : assets.filter((assetData) => assetData.type === asset);

    const handleAssetChange = (event: SelectChangeEvent) => {
        setAsset(event.target.value)
    };
    const currentUserId = 110;

    const arraysAreEqual = (arr1: PartnersAssetsData[], arr2: PartnersAssetsData[]) => JSON.stringify(arr1) === JSON.stringify(arr2);

    const toggleFavorite = (id: number) => {
        setAssets((prevAssets) =>
            prevAssets.map((group) => ({
                ...group,
                asset: group.asset.map((item) =>
                    item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
                ),
            }))
        );
        const allAssets = assets.flatMap((group) => group.asset)
        const updatedFavorites = favorites[0].asset.some((fav: AssetsData) => fav.id === id)
            ? favorites[0].asset.filter((fav: AssetsData) => fav.id !== id)
            : [...favorites[0].asset, {...allAssets.find((item) => item.id === id)!, isFavorite: true}];

        localStorage.setItem(`favorites_${currentUserId}`, JSON.stringify(updatedFavorites));
        setFavorites([{ type: "Favorites", asset: updatedFavorites }]);
    };

    const fetchRewards = async () => {
        setLoading(true);
        try {
            const userFavorites = JSON.parse(localStorage.getItem(`favorites_${currentUserId}`) || '[]');

            const response = await axiosInstance.get("/partners");
            const assetsByType = response.data.reduce((acc: Record<string, AssetsData[]>, item: AssetsData) => {
                if (!acc[item.type]) {
                    acc[item.type] = [];
                }
                const isFavorite = userFavorites.some((fav: AssetsData) => fav.id === item.id);
                acc[item.type].push({ ...item, isFavorite });
                return acc;
            }, {});


            setAssets([
                {type: "Videos", asset: assetsByType["video"] || []},
                {type: "Pitch decks", asset: assetsByType["presentation"] || []},
                {type: "Images", asset: assetsByType["image"] || []},
                {type: "Documents", asset: assetsByType["document"] || []},
            ]);

            setFavorites([{ type: "Favorites", asset: userFavorites }]);

        } catch (error) {
            console.error("Error fetching rewards:", error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchRewards()
    }, []);


    return (
        <>
            {loading &&
                <CustomizedProgressBar />
            }
            <Box sx={{
                backgroundColor: '#fff',
                width: '100%',
                padding: 0,
                margin: '3rem auto 0rem',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '77vh',
                '@media (max-width: 600px)': { margin: '0rem auto 0rem' }
            }}>
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'end', mb: 2 }}>
                        <Select
                            value={asset}
                            onChange={handleAssetChange}
                            sx={{
                                backgroundColor: "#fff",
                                borderRadius: "4px",
                                height: "48px",
                                fontFamily: "Nunito Sans",
                                fontSize: "14px",
                                minWidth: '112px',
                                fontWeight: 400,
                                zIndex: 0,
                                color: "rgba(17, 17, 19, 1)",
                                '@media (max-width: 600px)': { width: "100%" }
                            }}
                            MenuProps={{
                                PaperProps: { style: { maxHeight: 200, zIndex: 100 } },
                            }}
                            IconComponent={(props) =>
                                asset === "" ? (
                                    <KeyboardArrowUpIcon
                                        {...props}
                                        sx={{ color: "rgba(32, 33, 36, 1)" }}
                                    />
                                ) : (

                                    <KeyboardArrowDownIcon
                                        {...props}
                                        sx={{ color: "rgba(32, 33, 36, 1)" }}
                                    />
                                )
                            }
                        >
                            {typeAssets.map((type, index) => (
                                <MenuItem
                                    key={index}
                                    value={type.toString()}
                                    sx={{
                                        fontFamily: "Nunito Sans",
                                        fontWeight: 500,
                                        fontSize: "14px",
                                        lineHeight: "19.6px",
                                        "&:hover": { backgroundColor: "rgba(80, 82, 178, 0.1)" },
                                    }}
                                >
                                    {type}
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>   
                        {arraysAreEqual(initialValue, assets) && !loading ? (
                            <Box sx={suppressionsStyles.centerContainerStyles}>
                                <Typography variant="h5" sx={{
                                    mb: 3,
                                    fontFamily: 'Nunito Sans',
                                    fontSize: "20px",
                                    color: "#4a4a4a",
                                    fontWeight: "600",
                                    lineHeight: "28px"
                                }}>
                                    Data not matched yet!
                                </Typography>
                                <Image src='/no-data.svg' alt='No Data' height={250} width={300} />
                                <Typography variant="body1" color="textSecondary"
                                    sx={{
                                        mt: 3,
                                        fontFamily: 'Nunito Sans',
                                        fontSize: "14px",
                                        color: "#808080",
                                        fontWeight: "600",
                                        lineHeight: "20px"
                                    }}>
                                    No Invitee joined from the referreal link.
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }} >
                                {filteredAssets.map((data, index) => (
                                    <PartnersAsset 
                                        toggleFavorite={toggleFavorite}
                                        key={index} data={data} />
                                ))}
                            </Box>
                        )}
                    </>
            </Box>
        </>
    );
};

export default PartnersAssets;