import React, { useState } from 'react';
import { Drawer, Backdrop, Box, Typography, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { accountStyles } from '../css/accountDetails';
import Image from 'next/image'

interface PopupDetailsProps {
    open: boolean;
    onClose: () => void;
    rowData: any;
}

const PopupDetails: React.FC<PopupDetailsProps> = ({ open, onClose, rowData }) => {
    const [activeTab, setActiveTab] = useState<'Personal' | 'Company'>('Personal');

    const lead = rowData?.lead || {};
    const company = rowData?.company || {};

    const handleTabChange = (tab: 'Personal' | 'Company') => {
        setActiveTab(tab);
    };

    return (
        <>
            <Backdrop open={open} sx={{ zIndex: 1200, color: '#fff' }} />
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                variant="persistent"
                PaperProps={{
                    sx: {
                        width: '40%',
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
                <Box sx={{ width: '100%', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, mt: '0.5em', borderBottom: '1px solid #e4e4e4' }}>
                    <Box sx={{ display: 'flex', gap: 4 }}>
                        <Button
                            variant="text"
                            onClick={() => handleTabChange('Personal')}
                            sx={{
                                ...accountStyles.headers_title, textTransform: 'none', backgroundColor: activeTab === 'Personal' ? '#FFFF' : 'transparent',
                                color: activeTab === 'Personal' ? 'rgba(80, 82, 178, 1)' : 'rgba(74, 74, 74, 1)',
                                borderBottom: activeTab === 'Personal' ? '2px solid rgba(80, 82, 178, 1)' : 'none',
                            }}
                        >
                            Personal
                        </Button>
                        <Button
                            variant="text"
                            onClick={() => handleTabChange('Company')}
                            sx={{
                                ...accountStyles.headers_title, textTransform: 'none', backgroundColor: activeTab === 'Company' ? '#FFFF' : 'transparent',
                                color: activeTab === 'Company' ? 'rgba(80, 82, 178, 1)' : 'rgba(74, 74, 74, 1)',
                                borderBottom: activeTab === 'Company' ? '2px solid rgba(80, 82, 178, 1)' : 'none',
                            }}
                        >
                            Company
                        </Button>

                    </Box>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
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
                        padding: '8px',
                        width: '100%',
                    },
                }}>
                    {activeTab === 'Personal' ? (
                        <Box sx={{
                            p: 3,
                            gap: 5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'start',
                            width: '100%',
                            maxWidth: '90%',
                            border: '3px solid rgba(228, 228, 228, 1)',
                            flexDirection: 'row',
                            '@media (max-width: 600px)': {
                                width: '100%',
                            },
                        }}>
                            <Box
                                sx={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    mb: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#f0f0f0',
                                    border: '2px solid #000000',
                                }}
                            >
                                <Image
                                    src={lead.photo || '/avatar.jpg'}
                                    alt="Lead"
                                    width={100}
                                    height={100}
                                />
                            </Box>
                            <Box sx={{ flex: 1, textAlign: 'start' }}>
                                <Typography variant="body1" gutterBottom sx={{ ...accountStyles.name, pb: 1 }}>
                                    {lead.first_name} {lead.last_name}
                                </Typography>
                                <Typography variant="body1" gutterBottom sx={{ ...accountStyles.text, pb: 1 }}>
                                    {lead.business_email || 'N/A'}
                                </Typography>
                                <Typography variant="body1" gutterBottom sx={accountStyles.text}>
                                    {lead.mobile_phone || 'N/A'}
                                </Typography>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{
                            p: 3,
                            gap: 5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'start',
                            width: '100%',
                            maxWidth: '90%',
                            border: '3px solid rgba(228, 228, 228, 1)',
                            flexDirection: 'row',
                            '@media (max-width: 600px)': {
                                width: '100%',
                            },
                        }}>
                            <Box
                                sx={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    mb: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#f0f0f0',
                                    border: '2px solid #000000',
                                }}
                            >
                                <Image
                                    src={company.photo || '/avatar.jpg'}
                                    alt="Lead"
                                    width={100}
                                    height={100}
                                />
                            </Box>
                            <Box sx={{ flex: 1, textAlign: 'start' }}>
                                <Typography variant="body1" gutterBottom sx={{ ...accountStyles.name, pb: 1 }}>
                                    {company.name || 'Company name'}
                                </Typography>
                                <Typography variant="body1" gutterBottom sx={{ ...accountStyles.text, pb: 1 }}>
                                    {company.business_email || 'N/A'}
                                </Typography>
                                <Typography variant="body1" gutterBottom sx={accountStyles.text}>
                                    {company.phone || 'N/A'}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* Basic Details */}
                    <Box sx={{
                        mt: 2,
                        padding: '16px',
                        gap: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        maxWidth: '92%',
                        border: '3px solid rgba(228, 228, 228, 1)',
                        '@media (max-width: 600px)': {
                            padding: '8px',
                            width: '100%',
                        },
                    }}>
                        <Typography sx={accountStyles.title}>
                            Basic Details
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? 'Direct number' : 'Job Title'}
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? lead.mobile_phone || 'N/A' : company.business_email || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? 'Address' : 'Seniority level'}
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? lead.address || 'N/A' : company.address || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? 'City' : 'Department'}
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? rowData?.city || 'N/A' : company.business_email || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? 'State' : 'Company name'}
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? rowData?.state || 'N/A' : company.business_email || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? 'Zip' : 'Company domain'}
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? lead.zip || 'N/A' : company.domain || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? 'Other emails' : 'Company phone'}
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? lead.business_email || 'N/A' : company.phone || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? 'Personal email last seen' : 'Company description'}
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? lead.email || 'N/A' : company.phone || 'N/A'}
                            </Typography>
                        </Box>

                        {activeTab === 'Company' && (
                            <>
                                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Typography sx={{ ...accountStyles.text }}>
                                        Business email last seen
                                    </Typography>
                                    <Typography sx={{ ...accountStyles.text }}>
                                        {lead.email || 'N/A'}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Typography sx={{ ...accountStyles.text }}>
                                        Company last updated
                                    </Typography>
                                    <Typography sx={{ ...accountStyles.text }}>
                                        {lead.email || 'N/A'}
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Box>
                    {/* Demographics */}
                    {activeTab === 'Personal' && (
                        <Box sx={{
                            mt: 2,
                            padding: '16px',
                            gap: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            maxWidth: '92%',
                            border: '3px solid rgba(228, 228, 228, 1)',
                            '@media (max-width: 600px)': {
                                padding: '8px',
                                width: '100%',
                            },
                        }}>
                            <Typography sx={accountStyles.title}>
                                Demographics
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ ...accountStyles.text }}>
                                    Gender
                                </Typography>
                                <Typography sx={{ ...accountStyles.text }}>
                                    {lead.gender || 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ ...accountStyles.text }}>
                                    Age Range
                                </Typography>
                                <Typography sx={{ ...accountStyles.text }}>
                                    {lead.age_min && lead.age_max ? `${lead.age_min} - ${lead.age_max}` : 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ ...accountStyles.text }}>
                                    Marital status
                                </Typography>
                                <Typography sx={{ ...accountStyles.text }}>
                                    {lead.marital_status || 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ ...accountStyles.text }}>
                                    Children
                                </Typography>
                                <Typography sx={{ ...accountStyles.text }}>
                                    {lead.children || 'N/A'}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* Company Address */}
                    {activeTab === 'Company' && (
                        <Box sx={{
                            mt: 2,
                            padding: '16px',
                            gap: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            maxWidth: '92%',
                            border: '3px solid rgba(228, 228, 228, 1)',
                            '@media (max-width: 600px)': {
                                padding: '8px',
                                width: '100%',
                            },
                        }}>
                            <Typography sx={accountStyles.title}>
                                Company Address
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ ...accountStyles.text }}>
                                    Address
                                </Typography>
                                <Typography sx={{ ...accountStyles.text }}>
                                    {company.address || 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ ...accountStyles.text }}>
                                    City
                                </Typography>
                                <Typography sx={{ ...accountStyles.text }}>
                                    {company.city || 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ ...accountStyles.text }}>
                                    State
                                </Typography>
                                <Typography sx={{ ...accountStyles.text }}>
                                    {company.state || 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ ...accountStyles.text }}>
                                    Zip
                                </Typography>
                                <Typography sx={{ ...accountStyles.text }}>
                                    {company.zip || 'N/A'}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                    {/* Visit Details */}
                    <Box sx={{
                        mt: 2,
                        padding: '16px',
                        gap: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        maxWidth: '92%',
                        border: '3px solid rgba(228, 228, 228, 1)',
                        '@media (max-width: 600px)': {
                            padding: '8px',
                            width: '100%',
                        },
                    }}>
                        <Typography sx={accountStyles.title}>
                            Visit Details
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ ...accountStyles.text }}>
                                Income range
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? lead.range || 'N/A' : company.range || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ ...accountStyles.text }}>
                                Net worth
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? lead.net_worth || 'N/A' : company.net_worth || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ ...accountStyles.text }}>
                                Home own
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? rowData?.home_own || 'N/A' : company.home_own || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ ...accountStyles.text }}>
                                Job title
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? rowData?.job || 'N/A' : company.job || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ ...accountStyles.text }}>
                                Seniority
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? lead.seniority || 'N/A' : company.seniority || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ ...accountStyles.text }}>
                                Department
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? lead.department || 'N/A' : company.department || 'N/A'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Company Address */}
                    {activeTab === 'Company' && (
                        <Box sx={{
                            mt: 2,
                            padding: '16px',
                            gap: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            maxWidth: '92%',
                            border: '3px solid rgba(228, 228, 228, 1)',
                            '@media (max-width: 600px)': {
                                padding: '8px',
                                width: '100%',
                            },
                        }}>
                            <Typography sx={accountStyles.title}>
                                Financial details
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ ...accountStyles.text }}>
                                    Company Revenue
                                </Typography>
                                <Typography sx={{ ...accountStyles.text }}>
                                    {company.address || 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ ...accountStyles.text }}>
                                    Company employee count
                                </Typography>
                                <Typography sx={{ ...accountStyles.text }}>
                                    {company.city || 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ ...accountStyles.text }}>
                                    Primary industry
                                </Typography>
                                <Typography sx={{ ...accountStyles.text }}>
                                    {company.state || 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ ...accountStyles.text }}>
                                    Institution url
                                </Typography>
                                <Typography sx={{ ...accountStyles.text }}>
                                    {company.zip || 'N/A'}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* Company Address */}
                    {activeTab === 'Personal' && (
                        <Box sx={{
                            mt: 2,
                            padding: '16px',
                            gap: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            maxWidth: '92%',
                            border: '3px solid rgba(228, 228, 228, 1)',
                            '@media (max-width: 600px)': {
                                padding: '8px',
                                width: '100%',
                            },
                        }}>
                            <Typography sx={accountStyles.title}>
                            Education history
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ ...accountStyles.text }}>
                                Degree
                                </Typography>
                                <Typography sx={{ ...accountStyles.text }}>
                                    {lead.address || 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ ...accountStyles.text }}>
                                Duration
                                </Typography>
                                <Typography sx={{ ...accountStyles.text }}>
                                    {lead.city || 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ ...accountStyles.text }}>
                                Institution name
                                </Typography>
                                <Typography sx={{ ...accountStyles.text }}>
                                    {lead.state || 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ ...accountStyles.text }}>
                                Institution url
                                </Typography>
                                <Typography sx={{ ...accountStyles.text }}>
                                    {lead.zip || 'N/A'}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* Social Connections */}
                    <Box sx={{
                        mt: 2,
                        padding: '16px',
                        gap: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        maxWidth: '92%',
                        border: '3px solid rgba(228, 228, 228, 1)',
                        '@media (max-width: 600px)': {
                            padding: '8px',
                            width: '100%',
                        },
                    }}>
                        <Typography sx={accountStyles.title}>
                        Social Connections
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ ...accountStyles.text }}>
                                Followers
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? lead.followers || 'N/A' : company.followers || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? 'Duration' : 'Company url'}
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {activeTab === 'Personal' ? lead.duration || 'N/A' : company.company_url || 'N/A'}
                            </Typography>
                        </Box>


                        {activeTab === 'Personal' && (
                            <>
                                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Typography sx={{ ...accountStyles.text }}>
                                    Institution name
                                    </Typography>
                                    <Typography sx={{ ...accountStyles.text }}>
                                        {lead.institution_name || 'N/A'}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Typography sx={{ ...accountStyles.text }}>
                                    Institution url
                                    </Typography>
                                    <Typography sx={{ ...accountStyles.text }}>
                                        {lead.institution_url || 'N/A'}
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Box>

                </Box>
            </Drawer>
        </>
    );
};

export default PopupDetails;
