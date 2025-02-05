import React, { useEffect, useState } from 'react';
import { Drawer, Backdrop, Box, Typography, IconButton, Button, Divider, Link } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { accountStyles } from '../css/accountDetails';
import Image from 'next/image'
import DownloadIcon from '@mui/icons-material/Download';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast } from './ToastNotification';

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
            <Typography sx={{ ...accountStyles.text, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', WebkitLineClamp: isExpanded ? 'none' : 3 }}>
                {isExpanded ? text : text.substring(0, limit) + (shouldTruncate ? '...' : '')}
            </Typography>
        </Box>
    );
};

const PopupDetails: React.FC<PopupDetailsProps> = ({ open, onClose, rowData }) => {
    const lead = rowData || {};

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
            leads_ids: lead.id ? [lead.id] : []
        };
        try {
            const response = await axiosInstance.post('/leads/download_leads', requestBody, {
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
                            Person Overview
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
                            <Image src={'/profile-circle.svg'} width={48} height={48} alt='Profile icon' />
                        </Box>
                        <Box sx={{ flex: 1, textAlign: 'start' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body1" gutterBottom sx={{ ...accountStyles.name, pb: 1 }}>
                                    {lead.first_name} {lead.last_name}
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
                                        '& :hover': { color: 'rgba(80, 82, 178, 1)' },
                                        '@media (max-width: 900px)': {
                                            border: 'none',
                                            padding: 0
                                        }
                                    }}
                                    onClick={handleDownload}
                                >
                                    <DownloadIcon fontSize='medium' sx={{ color: 'rgba(128, 128, 128, 1)', '& :hover': { color: 'rgba(80, 82, 178, 1)' } }} />
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 5, '@media (max-width: 600px)': { flexDirection: 'column', gap: 1 }, }}>
                                <Typography variant="body1" gutterBottom sx={{ ...accountStyles.header_text, display: 'flex', flexDirection: 'row', gap: 1 }}>
                                    {lead.personal_emails || lead.business_email ? (
                                        <Link
                                            href={`mailto:${lead.personal_emails ? lead.personal_emails.split(',')[0] : lead.business_email.split(',')[0]}`}
                                            underline="none"
                                            sx={{ ...accountStyles.header_text, display: 'flex', flexDirection: 'row', gap: 1 }}
                                        >
                                            <Image src={'/sms.svg'} width={18} height={18} alt='iphone icon' />
                                            {lead.personal_emails ? lead.personal_emails.split(',')[0] : lead.business_email ? lead.business_email.split(',')[0] : '--'}
                                        </Link>
                                    ) : (
                                        <>
                                            <Image src={'/sms.svg'} width={18} height={18} alt='mail icon' />
                                            <Typography sx={accountStyles.text}> --</Typography>
                                        </>
                                    )}
                                </Typography>
                                <Typography
                                    variant="body1"
                                    gutterBottom
                                    sx={{
                                        ...accountStyles.header_text,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        color: 'rgba(80, 82, 178, 1)',
                                    }}
                                >
                                    {lead.mobile_phone || lead.personal_phone ? (
                                        <Link
                                            href={`tel:${lead.mobile_phone ? lead.mobile_phone.split(',')[0] : lead.personal_phone.split(',')[0]}`}
                                            underline="none"
                                            sx={{
                                                color: 'rgba(80, 82, 178, 1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}
                                        >
                                            <Image src={'/iphone-02.svg'} width={18} height={18} alt='iphone icon' />
                                            {lead.mobile_phone ? lead.mobile_phone.split(',')[0] : lead.personal_phone ? lead.personal_phone.split(',')[0] : '--'}
                                        </Link>
                                    ) : (
                                        <>
                                            <Image src={'/iphone-02.svg'} width={18} height={18} alt='iphone icon' />
                                            <Typography sx={accountStyles.text}> --</Typography>
                                        </>
                                    )}
                                </Typography>

                            </Box>
                        </Box>
                    </Box>
                    {/* Web Details */}
                    <Box sx={accountStyles.box_param}>
                        <Typography sx={{ ...accountStyles.title }}>
                            <Image src={'/website-icon.svg'} width={18} height={18} alt='iphone icon' />
                            Website Pages Visited
                        </Typography>

                        {lead.page_visits?.map((page_visit: any, index: number) => {
                            const trimmedPage = page_visit.page.startsWith("http") ? page_visit.page : `https://${page_visit.page}`;

                            return (
                                <Box
                                    key={index}
                                    sx={{
                                        ...accountStyles.rows_pam,
                                        display: "flex",
                                        borderBottom: index === lead.page_visits.length - 1 ? "none" : "1px solid rgba(240, 240, 240, 1)",
                                    }}
                                >
                                    <Box sx={{ display: "flex", width: "30%" }}>
                                        <Typography sx={{ ...accountStyles.title_text }}>Page {index + 1}:</Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", width: "50%" }}>
                                        {trimmedPage ? (
                                            <Link
                                                href={trimmedPage}
                                                underline="none"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{
                                                    ...accountStyles.text,
                                                    textDecoration: "none",
                                                    color: "rgba(80, 82, 178, 1)",
                                                }}
                                            >
                                                {trimmedPage}
                                            </Link>
                                        ) : (
                                            <Typography sx={accountStyles.text}> --</Typography>
                                        )}
                                    </Box>
                                    <Box sx={{ display: "flex", width: "20%", justifyContent: "flex-end" }}>
                                        <Typography>
                                            {page_visit.spent_time_sec
                                                ? page_visit.spent_time_sec > 60
                                                    ? `${Math.floor(page_visit.spent_time_sec / 60)} min ${page_visit.spent_time_sec % 60} sec`
                                                    : `${page_visit.spent_time_sec} sec`
                                                : "--"}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                    {/* Basic Details */}
                    <Box sx={accountStyles.box_param}>
                        <Typography sx={{ ...accountStyles.title }}>
                            <Image src={'/user-square.svg'} width={18} height={18} alt='iphone icon' />
                            Personal Details
                        </Typography>
                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={accountStyles.title_text}>
                                Mobile number:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text, width: '50%' }}>
                                {lead.mobile_phone || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={accountStyles.title_text}>
                                Personal number:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text, width: '50%' }}>
                                {lead.personal_phone || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={accountStyles.title_text}>
                                Direct number:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text, width: '50%' }}>
                                {lead.direct_number || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Address:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.personal_address || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                City:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {rowData?.city || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                State:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {rowData?.state || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Zip:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.personal_zip
                                    ? `${lead.personal_zip || ''}`.trim()
                                    : '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Personal Email:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.personal_emails || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Personal email last seen:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.personal_emails_last_seen || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Other personal emails:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.personal_emails || lead.additional_personal_emails
                                    ? `${lead.personal_emails || ''} ${lead.additional_personal_emails || ''}`.trim()
                                    : '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Business email:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.business_email || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Business email last seen:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.business_email_last_seen || '--'}
                            </Typography>
                        </Box>

                        <Box sx={{ ...accountStyles.rows_pam, borderBottom: 'none' }}>
                            <Typography sx={{ ...accountStyles.title_text, }}>
                                Personal LinkedIn url:
                            </Typography>
                            {lead.linkedin_url ? (
                                <Link
                                    href={lead.linkedin_url.startsWith('http') ? lead.linkedin_url : `https://${lead.linkedin_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ ...accountStyles.text, textDecoration: 'none', color: 'rgba(80, 82, 178, 1)', }}
                                >
                                    {lead.linkedin_url}
                                </Link>
                            ) : (
                                <Typography sx={{ ...accountStyles.text }}>
                                    --
                                </Typography>
                            )}
                        </Box>

                    </Box>
                    {/* Demographics */}
                    <Box sx={accountStyles.box_param}>
                        <Typography sx={accountStyles.title}>
                            <Image src={'/demographic.svg'} width={18} height={18} alt='demographic icon' />
                            Demographics
                        </Typography>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Gender:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {genderText(lead.gender || '')}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Age Range:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.age_min && lead.age_max ? `${lead.age_min} - ${lead.age_max} yrs ` : '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Marital status:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.marital_status || '--'}
                            </Typography>
                        </Box>

                        <Box sx={{ ...accountStyles.rows_pam, borderBottom: 'none' }}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Children:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.children || '--'}
                            </Typography>
                        </Box>
                    </Box>


                    {/* Company Details */}
                    <Box sx={accountStyles.box_param}>
                        <Typography sx={accountStyles.title}>
                            <Image src={'/company.svg'} width={18} height={18} alt='company icon' />
                            Company Details
                        </Typography>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Job title:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.job_title || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Seniority level:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.seniority_level || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Department:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.department || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company name:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_name || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company domain:
                            </Typography>
                            {lead.company_domain ? (
                                <Link
                                    href={`https://${lead.company_domain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ ...accountStyles.text, textDecoration: 'none', color: 'rgba(80, 82, 178, 1)', }}
                                >
                                    {lead.company_domain}
                                </Link>
                            ) : (
                                <Typography sx={{ ...accountStyles.text }}>
                                    --
                                </Typography>
                            )}
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company phone:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_phone || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company description:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                <TruncatedText text={lead.company_description || '--'} limit={100} />
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Business email:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.business_email || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Business email last seen:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.business_email_last_seen || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company last updated:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_last_updated || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Address:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_address || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company City:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_city || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company State:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_state || '--'}
                            </Typography>
                        </Box>

                        <Box sx={{ ...accountStyles.rows_pam, borderBottom: 'none' }}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company Zipcode:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_zip || '--'}
                            </Typography>
                        </Box>

                    </Box>
                    {/* Financial details */}
                    <Box sx={accountStyles.box_param}>
                        <Typography sx={accountStyles.title}>
                            <Image src={'/fin_details.svg'} width={18} height={18} alt='finance icon' />
                            Financial details
                        </Typography>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Income range
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.income_range || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Net worth
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.net_worth || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company Revenue
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_revenue || '--'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company employee count
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_employee_count || '--'}
                            </Typography>
                        </Box>

                        <Box sx={{ ...accountStyles.rows_pam, borderBottom: 'none' }}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Primary industry
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.state || '--'}
                            </Typography>
                        </Box>

                    </Box>
                    {/* Social Connections */}
                    <Box sx={accountStyles.box_param}>
                        <Typography sx={accountStyles.title}>
                            <Image src={'/social.svg'} width={18} height={18} alt='web icon' />
                            Social Connections
                        </Typography>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Followers
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.followers || '--'}
                            </Typography>
                        </Box>

                        <Box sx={{ ...accountStyles.rows_pam, borderBottom: 'none' }}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company LinkedIn url
                            </Typography>
                            <Typography sx={{ ...accountStyles.text, color: 'rgba(80, 82, 178, 1)' }}>
                                {lead.company_linkedin_url ? (
                                    <Link
                                        href={`https://${lead.company_linkedin_url}`}
                                        underline="none"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ ...accountStyles.text, textDecoration: 'none', color: 'rgba(80, 82, 178, 1)', }}
                                    >
                                        {lead.company_linkedin_url}
                                    </Link>
                                ) : (
                                    <Typography sx={accountStyles.text}> --</Typography>
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
