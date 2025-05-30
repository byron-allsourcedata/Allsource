'use client'
import React, { useEffect, useState } from "react";
import { usersStyle } from "./userStyle";
import {
    Box, Button, Grid, Typography, TableHead, TableRow, TableCell,
    TableBody, TableContainer, Paper, Table,
    Switch, Pagination,
    SwitchProps,
    IconButton,
    Popover,
} from "@mui/material";
import axios from 'axios';
import { useUser } from "@/context/UserContext";
import { useTrial } from '@/context/TrialProvider';
import { styled } from '@mui/material/styles';
import axiosInstance from '../../../../axios/axiosInterceptorInstance';
import { useRouter } from "next/navigation";
import Account from "./components/Account";
import CustomCards from "./components/CustomCards";
import CustomizedProgressBar from '@/components/ProgressBar'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SwapVertIcon from '@mui/icons-material/SwapVert';

import { datasyncStyle } from "@/app/(client)/data-sync/datasyncStyle";
import { showErrorToast } from "@/components/ToastNotification";



interface UserData {
    id: number
    full_name: string
    email: string
    created_at: string
    payment_status: string
    is_trial: boolean
}

interface CustomCardsProps {
    users: number;
    pixel_contacts: number;
    sources: number;
    lookalikes: number;
    smart_audience: number;
    data_sync: number;
}

interface TabPanelProps {
    children?: React.ReactNode;
    value: number;
    index: number;
}

const Users: React.FC = () => {
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(9);
    const [data, setData] = useState<UserData[]>([]);
    const [paginatedData, setPaginatedData] = useState<UserData[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [sortedData, setSortedData] = useState<UserData[]>([]);
    const [sortField, setSortField] = useState<string>('');
    const [tabIndex, setTabIndex] = useState(0);
    const [valuesMetrics, setValueMetrics] = useState<CustomCardsProps>({
        users: 0,
        pixel_contacts: 0,
        sources: 0,
        lookalikes: 0,
        smart_audience: 0,
        data_sync: 0,
    });
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const { full_name: userFullName, email: userEmail, resetUserData, } = useUser();
    const meItem = typeof window !== "undefined" ? sessionStorage.getItem("me") : null;
    const meData = meItem ? JSON.parse(meItem) : { full_name: '', email: '' };
    const full_name = userFullName || meData.full_name;
    const email = userEmail || meData.email;
    const { resetTrialData } = useTrial();
    const handleSignOut = () => {
        localStorage.clear();
        sessionStorage.clear();
        resetUserData();
        resetTrialData();
        window.location.href = "/signin";
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };
    const handleSettingsClick = () => {
        handleProfileMenuClose();
        router.push("/settings");
    };

    useEffect(() => {
        const accessToken = localStorage.getItem('token');
        if (!accessToken) {
            router.push('/signin');
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                let url = `/admin/audience-metrics`;
                const response = await axiosInstance.get(url);
                if (response.status === 200) {
                    setValueMetrics({
                        users: response.data.audience_metrics.users_count ?? 0,
                        pixel_contacts: response.data.audience_metrics.pixel_contacts ?? 0,
                        sources: response.data.audience_metrics.sources_count ?? 0,
                        lookalikes: response.data.audience_metrics.lookalike_count ?? 0,
                        smart_audience: response.data.audience_metrics.smart_count ?? 0,
                        data_sync: response.data.audience_metrics.sync_count ?? 0,
                    });
                }
            }
            catch (error) {
                if (axios.isAxiosError(error)) {
                    if (error.response?.status === 403) {
                        showErrorToast('Error 403: Access is denied');
                        router.push('/signin');
                    } else {
                        showErrorToast(`Error: ${error.response?.status}`);
                        router.push('/signin');
                    }
                }
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentPage]);

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
    };

    const handleProfileMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
        return (
            <div
                role="tabpanel"
                hidden={value !== index}
                id={`tabpanel-${index}`}
                aria-labelledby={`tab-${index}`}
                {...other}
            >
                {value === index && <Box sx={{ margin: 0, pr: 2, pt: 2, '@media (max-width: 900px)': { pl: 3, pr: 3 }, '@media (max-width: 700px)': { pl: 1, pr: 1 } }}>{children}</Box>}
            </div>
        );
    };

    const handleSort = (field: string) => {
        const isAsc = sortField === field && sortOrder === 'asc';
        setSortOrder(isAsc ? 'desc' : 'asc');
        setSortField(field);
    };

    const handleTabChange = (event: React.SyntheticEvent | null, newIndex: number) => {
        setTabIndex(newIndex);
    };


    const totalPages = Math.ceil(totalItems / rowsPerPage);

    if (loading) {
        return <CustomizedProgressBar />;
    }

    return (
        <>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'start', justifyContent: 'space-between' }}>
                    <Typography variant="h4" component="h1" sx={usersStyle.title}>
                        Users
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box>
                        <CustomCards values={valuesMetrics} />
                    </Box>
                    <Box sx={{ width: '100%' }}>
                        {<TabPanel value={tabIndex} index={0}>
                            <Account setLoading={setLoading} is_admin={true} loading={loading} tabIndex={tabIndex} handleTabChange={handleTabChange} />
                        </TabPanel>}
                    </Box>
                    <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                        {<TabPanel value={tabIndex} index={1}>
                            <Account setLoading={setLoading} is_admin={false} loading={loading} tabIndex={tabIndex} handleTabChange={handleTabChange} />
                        </TabPanel>}
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default Users;