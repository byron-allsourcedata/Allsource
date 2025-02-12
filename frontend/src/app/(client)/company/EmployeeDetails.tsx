import React, { useEffect, useState } from 'react';
import { Drawer, Backdrop, Box, Typography, IconButton, Button, Divider, Link } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { companyStyles } from './companyStyles';
import Image from 'next/image'
import DownloadIcon from '@mui/icons-material/Download';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast } from '@/components/ToastNotification';
import CorporateFareRoundedIcon from '@mui/icons-material/CorporateFareRounded';
import dayjs from "dayjs";

interface PopupDetailsProps {
    open: boolean;
    onClose: () => void;
    employeeId: number;
    companyId: number;
}

const TruncatedText: React.FC<{ text: string; limit: number }> = ({ text, limit }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const shouldTruncate = text.length > limit;

    const handleToggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <Box onClick={handleToggleExpand} sx={{ cursor: shouldTruncate ? 'pointer' : 'default' }}>
            <Typography sx={{ ...companyStyles.text, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', WebkitLineClamp: isExpanded ? 'none' : 3 }}>
                {isExpanded ? text : text.substring(0, limit) + (shouldTruncate ? '...' : '')}
            </Typography>
        </Box>
    );
};

const PopupDetails: React.FC<PopupDetailsProps> = ({ open, onClose, companyId, employeeId }) => {
    const [popupData, setPopupData] = useState<any>()

    const handleDownload = async () => {
        const requestBody = {
            companies_ids: popupData?.id ? [popupData?.id] : []
        };
        try {
            const response = await axiosInstance.post('/company/download-company', requestBody, {
                responseType: 'blob'
            });

            if (response.status === 200) {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'data.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                showErrorToast(`Error downloading file:${response.statusText}`);
            }
        } catch (error) {
            showErrorToast(`Error during the download process: ${error}`);
        }
    };

    // Обработчик для закрытия при нажатии на Esc
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    };

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await axiosInstance.get(`/company/employees/${employeeId}?company_id=${companyId}`);
                if (response.status === 200) {
                    setPopupData(response.data);
                    console.log({response})
                } else {
                    showErrorToast("Error receiving employee data");
                }
            } catch {
            }
        };
    
        fetchEmployees();
    }, [companyId]);

    useEffect(() => {
        if (open) {
            window.addEventListener('keydown', handleKeyDown);
        } else {
            window.removeEventListener('keydown', handleKeyDown);
        }

        // Очистка при размонтировании или закрытии
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    const capitalizeTableCell = (city: string) => {
        if (city) {
            return city
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }
        else {
            return city
        }
    }

    return (
        <>
            <Backdrop open={open} onClick={onClose} sx={{ zIndex: 1200, color: '#fff' }} />
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                variant="persistent"
                PaperProps={{
                    sx: {
                        width: '48%',
                        position: 'fixed',
                        zIndex: 1301,
                        top: 0,
                        bottom: 0,
                        '@media (max-width: 600px)': {
                            width: '100%',
                        }
                    },
                }}
            >
                <Box sx={{ width: '100%', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: 1.35, borderBottom: '1px solid #e4e4e4', position: "sticky", top: 0, zIndex: 1400, backgroundColor: "#fff" }}>
                    <Box sx={{ display: 'flex', gap: 4 }}>
                        <Typography sx={{ fontSize: '16px', fontFamily: 'Nunito Sans', fontWeight: 600, lineHeight: '21.82px', color: 'rgba(32, 33, 36, 1)' }}>
                            Employee Overview
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose}>
                        <CloseIcon sx={{ color: 'rgba(0, 0, 0, 1)' }} />
                    </IconButton>
                </Box>

                <Box sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'start',
                    padding: '16px',
                    boxSizing: 'border-box',
                    '@media (max-width: 600px)': {
                        padding: '8px 0px',
                        width: '100%',
                    },
                }}>
                    <Box sx={{
                        p: 2,
                        gap: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'start',
                        width: '100%',
                        maxWidth: '93%',
                        border: '1px solid rgba(240, 240, 240, 1)',
                        borderRadius: '4px',
                        flexDirection: 'row',
                        '@media (max-width: 600px)': {
                            width: '100%',
                        },
                    }}>
                        <Box
                            sx={{
                                width: 65,
                                height: 65,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                display: 'flex',
                                transform: 'scale(1.0)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f0f0f0',
                            }}
                        >
                            <Image src={'/employee_icon.svg'} width={48} height={48} alt='Employee icon' />
                        </Box>
                        <Box sx={{ flex: 1, textAlign: 'start' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body1" gutterBottom sx={{ ...companyStyles.name, pb: 1 }}>
                                    {[capitalizeTableCell(popupData?.first_name), capitalizeTableCell(popupData?.last_name)].filter(Boolean).join(' ')}
                                </Typography>
                                <Button
                                    sx={{
                                        textTransform: 'none',
                                        color: 'rgba(80, 82, 178, 1)',
                                        borderRadius: '4px',
                                        padding: '1px',
                                        margin: '4px',
                                        mb: 2,
                                        minWidth: 'auto',
                                        '& :hover': {color: 'rgba(80, 82, 178, 1)'},
                                        '@media (max-width: 900px)': {
                                            border: 'none',
                                            padding: 0
                                        }
                                    }}
                                    onClick={handleDownload}
                                >
                                    <DownloadIcon fontSize='medium' sx={{color: 'rgba(128, 128, 128, 1)', '& :hover': {color: 'rgba(80, 82, 178, 1)'}}} />
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 5, '@media (max-width: 600px)': { flexDirection: 'column', gap: 1 }, }}>
                                <Typography variant="body1" gutterBottom sx={{ ...companyStyles.header_text, display: 'flex', flexDirection: 'row', gap: 1 }}>
                                    {popupData?.personal_email ? (
                                        <Box
                                            sx={{ ...companyStyles.header_text, display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(95, 99, 104, 1)' }}
                                        >
                                            <EmailOutlinedIcon sx={{color: "rgba(95, 99, 104, 1)"}} width={18} height={18}/>
                                            {popupData?.personal_email || '--'}
                                        </Box>
                                    ) : (
                                        <>
                                            <EmailOutlinedIcon sx={{color: "rgba(95, 99, 104, 1)"}} width={18} height={18}/>
                                            <Typography sx={companyStyles.text}>--</Typography>
                                        </>
                                    )}
                                </Typography>
                                <Typography
                                    variant="body1"
                                    gutterBottom
                                    sx={{
                                        ...companyStyles.header_text,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        color: 'rgba(80, 82, 178, 1)',
                                    }}
                                >
                                    {popupData?.mobile_phone ? (
                                        <Link
                                            href={`tel:${popupData?.mobile_phone.split(',')[0]}` || '--'}
                                            underline="none"
                                            sx={{
                                                color: 'rgba(80, 82, 178, 1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}
                                        >
                                            <SmartphoneOutlinedIcon width={18} height={18}/>
                                            {popupData?.mobile_phone.split(',')[0] || '--'}
                                        </Link>
                                    ) : (
                                        <>
                                            <SmartphoneOutlinedIcon width={18} height={18}/>
                                            <Typography sx={companyStyles.text}>--</Typography>
                                        </>
                                    )}
                                </Typography>

                            </Box>
                        </Box>
                    </Box>
                    {/* Company Details */}
                    <Box sx={companyStyles.box_param}>
                        <Typography sx={companyStyles.title_company}>
                            <CorporateFareRoundedIcon width={18} height={18}/>
                            Company Details
                        </Typography>

                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Company name:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {popupData?.company_name || '--'}
                            </Typography>
                        </Box>
                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Company domain:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {popupData?.company_domain || '--'}
                            </Typography>
                        </Box>
                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Company phone:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {popupData?.company_phone || '--'}
                            </Typography>
                        </Box>

                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Company description:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                <TruncatedText text={popupData?.company_description || '--'} limit={100} />
                            </Typography>
                        </Box>

                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Address:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {popupData?.company_address|| '--'}
                            </Typography>
                        </Box>

                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Company City:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                            {popupData?.company_city 
                                ? [capitalizeTableCell(popupData?.company_city)].filter(Boolean).join(', ')
                                : '--'
                            }
                            </Typography>
                        </Box>

                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Company State:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {popupData?.company_state || '--'}
                            </Typography>
                        </Box>

                        <Box sx={{...companyStyles.rows_pam }}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Company Zipcode:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {popupData?.company_zip || '--'}
                            </Typography>
                        </Box>

                        <Box sx={{...companyStyles.rows_pam, borderBottom: 'none'}}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Company LinkedIn url:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text, color: 'rgba(80, 82, 178, 1)' }}>
                                {popupData?.company_linkedin_url ? (
                                    <Link
                                        href={`https://${popupData?.company_linkedin_url}`}
                                        underline="none"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ ...companyStyles.text, textDecoration: 'none', color: 'rgba(80, 82, 178, 1)', }}
                                    >
                                        {popupData?.company_linkedin_url}
                                    </Link>
                                ) : (
                                    <Typography sx={companyStyles.text}> --</Typography>
                                )}
                            </Typography>
                        </Box>

                    </Box>
                    {/* Personal details */}
                    <Box sx={companyStyles.box_param}>
                        <Typography sx={companyStyles.title_company}>
                            <AccountCircleOutlinedIcon width={18} height={18} />
                            Personal details:
                        </Typography>

                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Mobile number:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {popupData?.mobile_phone || '--'}
                            </Typography>
                        </Box>

                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Job Title:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {popupData?.job_title || '--'}
                            </Typography>
                        </Box>

                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Seniority Level:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {popupData?.seniority || '--'}
                            </Typography>
                        </Box>

                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Department:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {popupData?.department || '--'}
                            </Typography>
                        </Box>

                        <Box sx={{...companyStyles.rows_pam}}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Other personal emails:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {popupData?.other_personal_emails || '--'}
                            </Typography>
                        </Box>

                        <Box sx={{...companyStyles.rows_pam}}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Personal email last seen:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {dayjs(popupData?.personal_emails_last_seen).isValid() ? dayjs(popupData?.personal_emails_last_seen).format('M/D/YYYY h:mm:ss A') : '--'}
                            </Typography>
                        </Box>

                        <Box sx={{...companyStyles.rows_pam}}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Business email:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {dayjs(popupData?.business_email).isValid() ? dayjs(popupData?.business_email).format('M/D/YYYY h:mm:ss A') : '--'}
                            </Typography>
                        </Box>

                        <Box sx={{...companyStyles.rows_pam}}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Business email last seen:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {dayjs(popupData?.business_emails_last_seen).isValid() ? dayjs(popupData?.business_emails_last_seen).format('M/D/YYYY h:mm:ss A') : '--'}
                            </Typography>
                        </Box>

                        <Box sx={{...companyStyles.rows_pam}}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Address:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {popupData?.personal_address || '--'}
                            </Typography>
                        </Box>

                        <Box sx={{...companyStyles.rows_pam}}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                City:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {popupData?.city 
                                    ? [capitalizeTableCell(popupData?.city)].filter(Boolean).join(', ')
                                    : '--'
                                }
                            </Typography>
                        </Box>

                        <Box sx={{...companyStyles.rows_pam}}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                State:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {popupData?.state || '--'}
                            </Typography>
                        </Box>
                        <Box sx={{...companyStyles.rows_pam}}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Zip:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {popupData?.personal_zip || '--'}
                            </Typography>
                        </Box>
                        <Box sx={{...companyStyles.rows_pam}}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Company last updated:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {dayjs(popupData?.company_last_updated).isValid() ? dayjs(popupData?.company_last_updated).format('M/D/YYYY h:mm:ss A') : '--'}
                            </Typography>
                        </Box>

                        <Box sx={{...companyStyles.rows_pam, borderBottom: 'none'}}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Personal LinkedIn url
                            </Typography>
                            <Typography sx={{ ...companyStyles.text, color: 'rgba(80, 82, 178, 1)' }}>
                                {popupData?.linkedin_url ? (
                                    <Link
                                        href={`https://${popupData?.linkedin_url}`}
                                        underline="none"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ ...companyStyles.text, textDecoration: 'none', color: 'rgba(80, 82, 178, 1)', }}
                                    >
                                        {popupData?.linkedin_url}
                                    </Link>
                                ) : (
                                    <Typography sx={companyStyles.text}> --</Typography>
                                )}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
};

export default PopupDetails;
