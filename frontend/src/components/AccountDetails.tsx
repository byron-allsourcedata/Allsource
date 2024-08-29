import React, { useState } from 'react';
import { Drawer, Backdrop, Box, Typography, IconButton, Button, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { accountStyles } from '../css/accountDetails';
import Image from 'next/image'

interface PopupDetailsProps {
    open: boolean;
    onClose: () => void;
    rowData: any;
}

const PopupDetails: React.FC<PopupDetailsProps> = ({ open, onClose, rowData }) => {
    const lead = rowData?.lead || {};
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
                <Box sx={{ width: '100%', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, mt: '0.5em', borderBottom: '1px solid #e4e4e4' }}>
                    <Box sx={{ display: 'flex', gap: 4 }}>
                        <Typography sx={{ fontSize: '16px', fontFamily: 'Nunito', fontWeight: 700, lineHeight: '22.4px' }}>
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
                        padding: '8px',
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
                            <Typography variant="body1" gutterBottom sx={{ ...accountStyles.name, pb: 1 }}>
                                {lead.first_name} {lead.last_name}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 5, '@media (max-width: 600px)': { flexDirection: 'column', gap:1}, }}>
                                <Typography variant="body1" gutterBottom sx={{ ...accountStyles.text, display: 'flex', flexDirection: 'row', gap: 1 }}>
                                    <Image src={'/sms.svg'} width={18} height={18} alt='mail icon' />
                                    {lead.business_email || 'N/A'}
                                </Typography>
                                <Typography variant="body1" gutterBottom sx={{ ...accountStyles.text, display: 'flex', flexDirection: 'row', gap: 1, color: 'rgba(80, 82, 178, 1)' }}>
                                    <Image src={'/iphone-02.svg'} width={18} height={18} alt='iphone icon' />
                                    {lead.mobile_phone || 'N/A'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    {/* Basic Details */}
                    <Box sx={accountStyles.box_param}>
                        <Typography sx={{ ...accountStyles.title }}>
                            <Image src={'/user-square.svg'} width={18} height={18} alt='iphone icon' />
                            Basic Details
                        </Typography>
                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={accountStyles.title_text}>
                                Direct number:
                            </Typography>
                            <Typography sx={accountStyles.text}>
                                {lead.mobile_phone || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Address:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.address || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                City:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {rowData?.city || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                State:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {rowData?.state || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Zip:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.zip || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Other emails:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.business_email || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Personal email last seen:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.email || 'N/A'}
                            </Typography>
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
                                {lead.gender || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Age Range:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.age_min && lead.age_max ? `${lead.age_min} - ${lead.age_max}` : 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Marital status:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.marital_status || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Children:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.children || 'N/A'}
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
                                {lead.job_title || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Seniority level:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.seniority || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Department:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.department || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company name:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_name || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company domain:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_domain || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company phone:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_phone || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company description:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_decription || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Business email last seen:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.business_email || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company last updated:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_last_update || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Address
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_address || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company City:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_city || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company State:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_state || 'N/A'}
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
                                Income range:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.income_range || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Net worth:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.net_worth || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company Revenue:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_revenue || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company employee count:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_employee_count || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Primary industry:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.state || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Institution url:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.zip || 'N/A'}
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
                                Followers:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.followers || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={accountStyles.rows_pam}>
                            <Typography sx={{ ...accountStyles.title_text }}>
                                Company url:
                            </Typography>
                            <Typography sx={{ ...accountStyles.text }}>
                                {lead.company_linkedin_url || 'N/A'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
};

export default PopupDetails;
