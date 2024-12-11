"use client"
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, Link, Button, MenuItem, Menu, SelectChangeEvent,  IconButton} from "@mui/material";
import { useEffect, useState, MouseEvent, useRef } from "react";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { suppressionsStyles } from "@/css/suppressions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import MonthDetails from '@/components/ReferralRewardsMonth';
import DownloadIcon from '@mui/icons-material/Download';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import { wrap } from "module";
import PartnersAsset from '@/components/PartnersAsset';
import {assetsStyle} from "./assetsStyle"

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

    const handleSettingsClick = () => {
        handleProfileMenuClose();
        router.push("/settings");
    };

    const handleSignOut = () => {
        localStorage.clear();
        sessionStorage.clear();
        // resetUserData();
        // resetTrialData();
        window.location.href = "/signin";
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

    useEffect(() => {
        fetchRewards()
    }, []);

    return (
        <>
            <Box sx={assetsStyle.headers}>
                <Box sx={assetsStyle.logoContainer}>
                    <Link href="/" underline="none" sx={{ zIndex: 10 }}>
                        <Image src='/logo.svg' alt='logo' height={80} width={60} />
                    </Link>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        aria-controls={open ? "profile-menu" : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? "true" : undefined}
                        onClick={handleProfileMenuClick}
                        sx={{
                            minWidth: '32px',
                            padding: '8px',
                            color: 'rgba(128, 128, 128, 1)',
                            border: '1px solid rgba(184, 184, 184, 1)',
                            borderRadius: '3.27px'
                        }}
                    >
                        <Image src={'/Person.svg'} alt="Person" width={18} height={18} />
                    </Button>
                    <Menu
                        id="profile-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleProfileMenuClose}
                        MenuListProps={{
                            "aria-labelledby": "profile-menu-button",
                        }}
                        sx={{
                            mt: 0.5,
                            ml: -1
                        }}
                    >
                        <Box sx={{ paddingTop: 1, paddingLeft: 2, paddingRight: 2, paddingBottom: 1 }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontFamily: 'Nunito Sans',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    lineHeight: '19.6px',
                                    color: 'rgba(0, 0, 0, 0.89)',
                                    mb: 0.25
                                }}
                            >
                                {/* {full_name} */}
                            </Typography>
                            <Typography
                                variant="body2"
                                color="textSecondary"
                                sx={{
                                    fontFamily: 'Nunito Sans',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    lineHeight: '19.6px',
                                    color: 'rgba(0, 0, 0, 0.89)',
                                }}
                            >
                                {/* {email} */}
                            </Typography>
                        </Box>
                        <MenuItem
                            sx={{
                                fontFamily: 'Nunito Sans',
                                fontSize: '14px',
                                fontWeight: 500,
                                lineHeight: '19.6px',
                            }}
                            onClick={handleSettingsClick}
                        >
                            Settings
                        </MenuItem>
                        <MenuItem
                            sx={{
                                fontFamily: 'Nunito Sans',
                                fontSize: '14px',
                                fontWeight: 500,
                                lineHeight: '19.6px',
                            }}
                            onClick={handleSignOut}
                        >
                            Sign Out
                        </MenuItem>
                    </Menu>
                </Box>
            </Box> 
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }} >
                {assets.map((data, index) => (
                    <PartnersAsset toggleFavorite={() => {}} key={index} data={data} />
                ))}
            </Box> 
        </>
)};

export default Assets;