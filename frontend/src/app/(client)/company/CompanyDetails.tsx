import React, { useEffect, useState } from 'react';
import { Drawer, Backdrop, Box, Typography, IconButton, Button, Divider, Link } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { companyStyles } from './companyStyles';
import Image from 'next/image'
import DownloadIcon from '@mui/icons-material/Download';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast } from '@/components/ToastNotification';

interface PopupDetailsProps {
    open: boolean;
    onClose: () => void;
    rowData: any;
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

const PopupDetails: React.FC<PopupDetailsProps> = ({ open, onClose, rowData }) => {
    const company = rowData || {};

    const genderText = (gender: string) => {
        switch (gender) {
            case 'M':
                return 'Male';
            case 'F':
                return 'Female';
            case 'U':
                return 'Unknown';
            default:
                return '--';
        }
    };

    const handleDownload = async () => {
        const requestBody = {
            companies_ids: company.id ? [company.id] : []
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

    const capitalizeCity = (city: string) => {
        return city
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
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
                        <Typography sx={{ fontSize: '16px', fontFamily: 'Nunito Sans', fontWeight: 700, lineHeight: '22.4px' }}>
                            Company Overview
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
                            <Image src={'/company_icon.svg'} width={30} height={30} alt='Company icon' />
                        </Box>
                        <Box sx={{ flex: 1, textAlign: 'start' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body1" gutterBottom sx={{ ...companyStyles.name, pb: 1 }}>
                                    {company.name}
                                </Typography>
                                <Button
                                    sx={{
                                        textTransform: 'none',
                                        color: 'rgba(56, 152, 252, 1)',
                                        borderRadius: '4px',
                                        padding: '1px',
                                        margin: '4px',
                                        mb: 2,
                                        minWidth: 'auto',
                                        '& :hover': {color: 'rgba(56, 152, 252, 1)'},
                                        '@media (max-width: 900px)': {
                                            border: 'none',
                                            padding: 0
                                        }
                                    }}
                                    onClick={handleDownload}
                                >
                                    <DownloadIcon fontSize='medium' sx={{color: 'rgba(128, 128, 128, 1)', '& :hover': {color: 'rgba(56, 152, 252, 1)'}}} />
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 5, '@media (max-width: 600px)': { flexDirection: 'column', gap: 1 }, }}>
                                <Typography component="div" variant="body1" gutterBottom sx={{ ...companyStyles.header_text, display: 'flex', flexDirection: 'row', gap: 1 }}>
                                    {company.domain ? (
                                        <Link
                                            href={`https://${company.domain}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            underline="none"
                                            sx={{ ...companyStyles.header_text, display: 'flex', flexDirection: 'row', gap: 1, color: 'rgba(56, 152, 252, 1)' }}
                                        >
                                            <Image src={'/web.svg'} width={18} height={18} alt='web icon' />
                                            {`https://${company.domain}` || '--'}
                                        </Link>
                                    ) : (
                                        <>
                                            <Image src={'/web.svg'} width={18} height={18} alt='mail icon' />
                                            <Typography sx={companyStyles.text}>--</Typography>
                                        </>
                                    )}
                                </Typography>
                                <Typography
                                    variant="body1"
                                    gutterBottom
                                    component="div"
                                    sx={{
                                        ...companyStyles.header_text,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        color: 'rgba(56, 152, 252, 1)',
                                    }}
                                >
                                    {company.phone ? (
                                        <Link
                                            href={`tel:${company.phone.split(',')[0]}` || '--'}
                                            underline="none"
                                            sx={{
                                                color: 'rgba(56, 152, 252, 1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}
                                        >
                                            <Image src={'/iphone-02.svg'} width={18} height={18} alt='iphone icon' />
                                            {company.phone.split(',')[0] || '--'}
                                        </Link>
                                    ) : (
                                        <>
                                            <Image src={'/iphone-02.svg'} width={18} height={18} alt='iphone icon' />
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
                            <Image src={'/company.svg'} width={18} height={18} alt='finance icon' />
                            Company Details
                        </Typography>

                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Company name:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {company.name || '--'}
                            </Typography>
                        </Box>
                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Company phone:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {company.phone || '--'}
                            </Typography>
                        </Box>

                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Company description:
                            </Typography>
                            <Typography component="div" sx={{ ...companyStyles.text }}>
                                <TruncatedText text={company.description || '--'} limit={100} />
                            </Typography>
                        </Box>

                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Address:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {company.location|| '--'}
                            </Typography>
                        </Box>

                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                City:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                            {company.city 
                                ? [capitalizeCity(company.city)].filter(Boolean).join(', ')
                                : '--'
                            }
                            </Typography>
                        </Box>

                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                State:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {company.state || '--'}
                            </Typography>
                        </Box>

                        <Box sx={{...companyStyles.rows_pam, borderBottom: 'none'}}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Zipcode:
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {company.zipcode || '--'}
                            </Typography>
                        </Box>

                        <Box sx={{...companyStyles.rows_pam, borderBottom: 'none'}}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                LinkedIn url
                            </Typography>
                            <Typography component="div" sx={{ ...companyStyles.text, color: 'rgba(56, 152, 252, 1)' }}>
                                {company.linkedin_url ? (
                                    <Link
                                        href={`https://${company.linkedin_url}`}
                                        underline="none"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ ...companyStyles.text, textDecoration: 'none', color: 'rgba(56, 152, 252, 1)', }}
                                    >
                                        {company.linkedin_url}
                                    </Link>
                                ) : (
                                    <Typography sx={companyStyles.text}> --</Typography>
                                )}
                            </Typography>
                        </Box>

                    </Box>
                    {/* Financial details */}
                    <Box sx={companyStyles.box_param}>
                        <Typography sx={companyStyles.title_company}>
                            <Image src={'/fin_details.svg'} width={18} height={18} alt='finance icon' />
                            Financial details
                        </Typography>

                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Revenue
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {company.company_revenue || '--'}
                            </Typography>
                        </Box>

                        <Box sx={companyStyles.rows_pam}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Employee count
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {company.employee_count || '--'}
                            </Typography>
                        </Box>

                        <Box sx={{...companyStyles.rows_pam, borderBottom: 'none'}}>
                            <Typography sx={{ ...companyStyles.title_text }}>
                                Industry
                            </Typography>
                            <Typography sx={{ ...companyStyles.text }}>
                                {company.industry || '--'}
                            </Typography>
                        </Box>

                    </Box>
                </Box>
            </Drawer>
        </>
    );
};

export default PopupDetails;
