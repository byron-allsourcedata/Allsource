import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, Link, Button, MenuItem, Select, SelectChangeEvent,  IconButton} from "@mui/material";
import { useEffect, useState, MouseEvent, useRef } from "react";
import CustomizedProgressBar from "./CustomizedProgressBar";
import { suppressionsStyles } from "@/css/suppressions";
import Image from "next/image";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import MonthDetails from '@/components/ReferralRewardsMonth';
import DownloadIcon from '@mui/icons-material/Download';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import { wrap } from "module";

interface RewardData {
    month: string;
    totalRewards: string;
    rewardsPaid: string;
    invitesCount: number;
    payoutDate: string;
}

const PartnersAssets: React.FC = () => {
    // const parentRef = useRef<HTMLDivElement | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState<boolean>(false);
    const [rewards, setRewards] = useState<RewardData[]>([]);
    const [asset, setAsset] = useState<string>("All");
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const yearsOptions: string[] = ["All", "Videos", "Pitch decks", "Images", "Documents"];

    const handleAssetChange = (event: SelectChangeEvent) => {
        const selectedAsset = event.target.value;
        setAsset(selectedAsset);
        fetchRewards(selectedAsset);
    };

    const handlePlayClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation(); 
        window.open('https://www.youtube.com/watch?v=gfU1iZnjRZM', '_blank', 'noopener,noreferrer');
    };

    const handleDownloadFile = async (id: number) => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/suppressions/download-suppression-list', {
                params: {
                    suppression_list_id: id
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `suppression_list_${id}.csv`);
            document.body.appendChild(link);
            link.click();

            window.URL.revokeObjectURL(url);
        } catch (error) {
        } finally {
            setLoading(false)
        }
    };

    const fetchRewards = async (selectedAsset: string) => {
        setLoading(true);
        try {
            const response = await axiosInstance.post("/partners/assets", {
                asset: selectedAsset,
            });
            setRewards(response.data);
        } catch (error) {
            console.error("Error fetching rewards:", error);
        } finally {
            setLoading(false);
        }
    };

    const [videoWidth, setVideoWidth] = useState(154);

    useEffect(() => {
        setRewards([
            {
                month: "February",
                totalRewards: "$1500",
                rewardsPaid: "$1200",
                invitesCount: 25,
                payoutDate: "Sep 01, 2024",
            },
            {
                month: "July",
                totalRewards: "$2000",
                rewardsPaid: "$1800",
                invitesCount: 30,
                payoutDate: "Aug 01, 2024",
            },
            {
                month: "June",
                totalRewards: "$1000",
                rewardsPaid: "$800",
                invitesCount: 20,
                payoutDate: "May 01, 2024",
            },
            {
                month: "May",
                totalRewards: "$2500",
                rewardsPaid: "$2300",
                invitesCount: 40,
                payoutDate: "Apr 01, 2024",
            },
        ]);
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
                        
                        {rewards.length === 0 && !loading ? (
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
                                            <Box
                                                sx={{position: "relative", width: "154px", height: "79px", '@media (max-width: 360px)': {width: "140px"}}}
                                                >
                                                    <Link href="https://www.youtube.com/watch?v=gfU1iZnjRZM" target="_blank" rel="noopener noreferrer" >
                                                        <Image src="https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg" alt="Pitch decks image" height={79} width={videoWidth}/>
                                                    </Link>
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
                                                    12:00
                                                </Box>
                                            </Box>
                                            <Box sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
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
                                            Welcome video for Maximiz product overview.
                                            </Typography>
                                            <IconButton sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                                                <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
                                            </IconButton>
                                            </Box>
                                        </Box>
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
                                            <Box
                                                sx={{position: "relative", width: "154px", height: "79px", '@media (max-width: 360px)': {width: "140px"}}}
                                                >
                                                <Link href="https://www.youtube.com/watch?v=gfU1iZnjRZM" target="_blank" rel="noopener noreferrer">
                                                    <Image src="https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg" alt="Pitch decks image" height={79} width={videoWidth}/>
                                                </Link>
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
                                                    height: "13.48px !important",
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
                                                    12:00
                                                </Box>
                                            </Box>
                                            <Box sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
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
                                            Welcome video for Maximiz product overview.
                                            </Typography>
                                            <IconButton sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                                                <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
                                            </IconButton>
                                            </Box>
                                        </Box>
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
                                            <Link href="https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg" target="_blank" rel="noopener noreferrer">
                                                <Image src="https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg" alt="Pitch decks image" height={79} width={videoWidth}/>
                                            </Link>
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
                                                    Maximiz pitch deck.ppt
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
                                                    10MB
                                                    </Typography>
                                                </Box>
                                                <IconButton sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                                                    <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
                                                </IconButton>
                                            </Box>
                                        </Box>
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
                                            <Link href="https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg" target="_blank" rel="noopener noreferrer">
                                                <Image src="https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg" alt="Pitch decks image" height={79} width={videoWidth}/>
                                            </Link>
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
                                                    Maximiz pitch deck.ppt
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
                                                    10MB
                                                    </Typography>
                                                </Box>
                                                <IconButton sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                                                    <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
                                                </IconButton>
                                            </Box>
                                        </Box>
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
                                            <Link href="https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg" target="_blank" rel="noopener noreferrer">
                                                <Image src="https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg" alt="Pitch decks image" height={79} width={videoWidth}/>
                                            </Link>
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
                                                    Maximiz pitch deck.ppt
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
                                                    10MB
                                                    </Typography>
                                                </Box>
                                                <IconButton sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                                                    <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
                                                </IconButton>
                                            </Box>
                                        </Box>
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
                                            <Link href="https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg" target="_blank" rel="noopener noreferrer">
                                                <Image src="https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg" alt="Pitch decks image" height={79} width={videoWidth}/>
                                            </Link>
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
                                                    Maximiz pitch deck.ppt
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
                                                    10MB
                                                    </Typography>
                                                </Box>
                                                <IconButton sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                                                    <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
                                                </IconButton>
                                            </Box>
                                        </Box>
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
                                            <Link href="https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg" target="_blank" rel="noopener noreferrer">
                                                <Image src="https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg" alt="Pitch decks image" height={79} width={videoWidth}/>
                                            </Link>
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
                                                    Maximiz pitch deck.ppt
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
                                                    10MB
                                                    </Typography>
                                                </Box>
                                                <IconButton sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                                                    <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
                                                 </IconButton>
                                            </Box>
                                        </Box>
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
                                            <Link href="https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg" target="_blank" rel="noopener noreferrer">
                                                <Image src="https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg" alt="Pitch decks image" height={79} width={videoWidth}/>
                                            </Link>
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
                                                    Maximiz pitch deck.ppt
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
                                                    10MB
                                                    </Typography>
                                                </Box>
                                                <IconButton sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                                                    <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
                                                </IconButton>
                                            </Box>
                                        </Box>
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
                                            <Link href="https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg" target="_blank" rel="noopener noreferrer">
                                                <Image src="https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg" alt="Pitch decks image" height={79} width={videoWidth}/>
                                            </Link>
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
                                                    Maximiz pitch deck.ppt
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
                                                    10MB
                                                    </Typography>
                                                </Box>
                                                <IconButton sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                                                    <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
                                                </IconButton>
                                            </Box>
                                        </Box>
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
                                                backgroundImage: "url(download.svg)",
                                                backgroundPosition: "center",
                                                backgroundRepeat: "no-repeat",
                                                backgroundSize: "40px 40px",
                                                '@media (max-width: 360px)': {width: "140px"}
                                            }}>
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
                                                    Guide.docx
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
                                                    Docx
                                                    </Typography>
                                                </Box>
                                                <IconButton sx={{ ':hover': { backgroundColor: 'transparent', }, padding: 0 }}>
                                                    <DownloadIcon sx={{ width: '20px', height: '20px', color: 'rgba(188, 188, 188, 1)', ':hover': { color: 'rgba(80, 82, 178, 1)' } }} />
                                                </IconButton>
                                            </Box>
                                        </Box>
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