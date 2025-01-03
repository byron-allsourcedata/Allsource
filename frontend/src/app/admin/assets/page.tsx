"use client"
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Grid, Typography, Menu, MenuItem, Link, Button, LinearProgress} from "@mui/material";
import { useEffect, useState} from "react";
import PartnersAsset from '@/components/PartnersAsset';
import dynamic from "next/dynamic";
import { assetsStyle } from "./assetsStyle";
import { useTrial } from '@/context/TrialProvider';
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { resellerStyle } from "@/app/admin/reseller/resellerStyle";
import { showErrorToast, showToast } from '@/components/ToastNotification';
import { styled } from '@mui/material/styles';
import { width } from "@mui/system";

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

const SidebarAdmin = dynamic(() => import('../../../components/SidebarAdmin'), {
    suspense: true,
});

const Assets: React.FC = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [loading, setLoading] = useState(false);
    const open = Boolean(anchorEl);
    const router = useRouter();
    const { full_name: userFullName, email: userEmail, resetUserData, } = useUser();
    const meItem = typeof window !== "undefined" ? sessionStorage.getItem("me") : null;
    const meData = meItem ? JSON.parse(meItem) : { full_name: '', email: '' };
    const full_name = userFullName || meData.full_name;
    const email = userEmail || meData.email;
    const { resetTrialData } = useTrial();
    const [assets, setAssets] = useState<PartnersAssetsData[]>([{type: "Videos", asset: []}, {type: "Pitch decks", asset: []}, {type: "Images", asset: []}, {type: "Documents", asset: []}, ]);

    const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
        height: 4,
        borderRadius: 0,
        backgroundColor: '#c6dafc',
        '& .MuiLinearProgress-bar': {
          borderRadius: 5,
          backgroundColor: '#4285f4',
        },
    }));

    const handleSettingsClick = () => {
        handleProfileMenuClose();
        router.push("/settings");
    };

    const handleSignOut = () => {
        localStorage.clear();
        sessionStorage.clear();
        resetUserData();
        resetTrialData();
        window.location.href = "/signin";
    };

    const fetchRewards = async () => {
        setLoading(true);
        try {

            const response = await axiosInstance.get("/admin-assets");
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
        setLoading(true)
        try {
            const response = await axiosInstance.delete(`admin-assets/${id}`);
            const status = response.data.status;
            if (status === "SUCCESS") {
                removeAssetById(id);
                showToast("Asset successfully deleted!")
            } else {
                showErrorToast("The provided ID is not valid.")
            }
        } catch {
            showErrorToast("Failed to delete asset. Please try again later.");
        } finally {
            setLoading(false)
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

    const assetTypeMap: Record<string, string> = {
        video: "Videos",
        image: "Images",
        presentation: "Pitch decks",
        document: "Documents",
    }

    const updateOrAddAsset = (type: string, newAsset: AssetsData) => {
        setAssets((prevAssets) => 
            prevAssets.map((group) => {
                if (group.type === assetTypeMap[type]) {
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

    const handleProfileMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
        <Box
            sx={{
                display: 'grid',
                gridTemplateAreas: `
                    "header header"
                    "sidebar content"
                `,
                gridTemplateRows: 'auto 1fr',
                gridTemplateColumns: '200px 1fr',
                height: '100vh',
            }}
>
    <Box
        sx={{
            gridArea: 'header',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            zIndex: 200,
            backgroundColor: '#fff',
            borderBottom: '1px solid rgba(228, 228, 228, 1)',
        }}
    >
        <Box sx={assetsStyle.headers}>
            <Box sx={resellerStyle.logoContainer}>
                <Link href="/" underline="none" sx={{ zIndex: 10 }}>
                    <Image src='/logo.svg' alt='logo' height={80} width={60} />
                </Link>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', paddingRight: "2.5em" }}>
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
                            {full_name}
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
                            {email}
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
    </Box>

    <Box
        sx={{
            gridArea: 'sidebar',
            position: 'fixed',
            top: '5.2rem',
            left: 0,
            width: '200px',
            height: 'calc(100vh - 5.2rem)',
            borderRight: '1px solid rgba(228, 228, 228, 1)',
            backgroundColor: '#fff',
        }}
    >
        <SidebarAdmin />
    </Box>

    <Box
        sx={{
            gridArea: 'content',
            padding: '24px',
        }}
    >
        {loading && (
            <Box
                sx={{
                    position: 'fixed',
                    top: '5.2rem',
                    left: '200px',
                    width: 'calc(100% - 200px)',
                    zIndex: 1201,
                }}
            >
                <BorderLinearProgress variant="indeterminate" />
            </Box>
        )}

        <Grid container spacing={3}>
            <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '85px' }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h4" component="h1" sx={assetsStyle.title}>
                        Assets
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {assets.map((data, index) => (
                        <PartnersAsset deleteAsset={handleDeleteAsset} updateOrAddAsset={updateOrAddAsset} key={index} data={data} isAdmin={true} />
                    ))}
                </Box>
            </Grid>
        </Grid>
    </Box>
</Box>


        </>
)};

export default Assets;