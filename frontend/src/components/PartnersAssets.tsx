import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, Link, Button, MenuItem, Select, SelectChangeEvent,  IconButton} from "@mui/material";
import { useEffect, useState, MouseEvent } from "react";
import CustomizedProgressBar from "./CustomizedProgressBar";
import { suppressionsStyles } from "@/css/suppressions";
import Image from "next/image";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import MonthDetails from '@/components/ReferralRewardsMonth';
import PartnersAssetsVideo from '@/components/PartnersAssetsVideo';
import PartnersAssetsImage from '@/components/PartnersAssetsImage';
import PartnersAssetsDocuments from '@/components/PartnersAssetsDocuments';
import DownloadIcon from '@mui/icons-material/Download';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import { wrap } from "module";

interface AssetsData {
    id: number;
    file_url: string;
    preview_url: string;
    type: string;
    title: string;
}

interface PartnersAssetsData {
    videos: AssetsData[];
    presentations: AssetsData[];
    images: AssetsData[];
    documents: AssetsData[];
}

const PartnersAssets: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState<boolean>(false);
    const [assets, setAssets] = useState<PartnersAssetsData>({videos: [], presentations: [], images: [], documents: []});
    const [asset, setAsset] = useState<string>("All");
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const yearsOptions: string[] = ["All", "Videos", "Pitch decks", "Images", "Documents"];

    const handleAssetChange = (event: SelectChangeEvent) => {
        const selectedAsset = event.target.value;
        setAsset(selectedAsset);
        
    };


    const handleDownloadFile = async (id: number) => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/partners-assets/download', {
                params: {
                    suppression_list_id: id
                },
                responseType: 'blob'
            });
        } catch (error) {
        } finally {
            setLoading(false)
        }
    };

    const fetchRewards = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get("/partners-assets");
            const assetsByType = response.data.reduce((acc: Record<string, AssetsData[]>, item: AssetsData) => {
                if (!acc[item.type]) {
                    acc[item.type] = [];
                }
                acc[item.type].push(item);
                return acc;
            }, {});

            setAssets({
                videos: assetsByType["video"] || [],
                presentations: assetsByType["presentation"] || [],
                images: assetsByType["image"] || [],
                documents: assetsByType["document"] || []
            });
        } catch (error) {
            console.error("Error fetching rewards:", error);
        } finally {
            setLoading(false);
        }
    };

    const [videoWidth, setVideoWidth] = useState(154);

    useEffect(() => {
        fetchRewards()
        // setAssets({
            // videos: [
            //     {
            //         id: 1,
            //         file_url: "https://www.youtube.com/watch?v=gfU1iZnjRZM",
            //         preview_url: "https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg",
            //         type: "video",
            //         title: "Welcome video for Maximiz product overview.",
            //     },
            //     {
            //         id: 2,
            //         file_url: "https://www.youtube.com/watch?v=gfU1iZnjRZM",
            //         preview_url: "https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg",
            //         type: "video",
            //         title: "Welcome video for Maximiz product overview.",
            //     }
            // ],
            // images: [
            //     {
            //         id: 3,
            //         file_url: "https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg",
            //         preview_url: "https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg",
            //         type: "image",
            //         title: "Welcome video for Maximiz product overview.",
            //     }
            // ],
            // presentations: [
            //     {
            //         id: 5,
            //         file_url: "https://www.youtube.com/watch?v=gfU1iZnjRZM",
            //         preview_url: "https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg",
            //         type: "presentation",
            //         title: "Welcome video for Maximiz product overview.",
            //     }
            // ],
            // documents: [
            //     {
            //         id: 6,
            //         file_url: "https://www.youtube.com/watch?v=gfU1iZnjRZM",
            //         preview_url: "https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg",
            //         type: "document",
            //         title: "Guide.docx",
            //     }
            // ]
        // });
        const updateWidth = () => {
            setVideoWidth(window.innerWidth <= 360 ? 140 : 154);
        };

        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    const handleViewDetails = (monthData: string) => {
        setSelectedMonth(monthData);
        setOpen(true);
    };

    const handleBack = () => {
        setSelectedMonth(null);
        setOpen(false);
    };

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
                {selectedMonth ? (
                    <MonthDetails open={open} selectedMonth={selectedMonth} onBack={handleBack} />
                ) : (
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
                                {yearsOptions.map((option, index) => (
                                    <MenuItem
                                        key={index}
                                        value={option.toString()}
                                        sx={{
                                            fontFamily: "Nunito Sans",
                                            fontWeight: 500,
                                            fontSize: "14px",
                                            lineHeight: "19.6px",
                                            "&:hover": { backgroundColor: "rgba(80, 82, 178, 0.1)" },
                                        }}
                                    >
                                        {option}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                        
                        {assets.videos.length === 0 && !loading ? (
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
                                    Videos
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap",  gap: 3, '@media (max-width: 360px)': { gap: 2 } }}>
                                        {assets.videos.map((data, index) => (
                                            <PartnersAssetsVideo key={data.id} open={open} asset={data} onBack={handleBack}  />
                                        ))}
                                    </Box>
                                </Box>

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
                                    Pitch decks
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap",  gap: 3, '@media (max-width: 360px)': { gap: 2 } }}>
                                        {assets.presentations.map((data, index) => (
                                            <PartnersAssetsImage key={data.id} open={open} asset={data} onBack={handleBack}  />
                                        ))}
                                    </Box>
                                </Box>
                                
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
                                    Images
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap",  gap: 3, '@media (max-width: 360px)': { gap: 2 } }}>
                                        {assets.images.map((data, index) => (
                                            <PartnersAssetsImage key={data.id} open={open} asset={data} onBack={handleBack}  />
                                        ))}
                                    </Box>
                                </Box>

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
                                    Documents
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap",  gap: 3, '@media (max-width: 360px)': { gap: 2 } }}>
                                        {assets.documents.map((data, index) => (
                                            <PartnersAssetsDocuments key={data.id} open={open} asset={data} onBack={handleBack}  />
                                        ))}
                                    </Box>
                                </Box>
                                
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </>
    );
};

export default PartnersAssets;