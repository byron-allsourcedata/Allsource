"use client";
import { Box, Typography, Tabs, Tab, Tooltip } from "@mui/material";
import { useState } from "react";
import { datasyncStyle } from './datasyncStyle';
import CustomTooltip from "@/components/customToolTip";



const DataSync: React.FC = () => {

    return (
        <Box sx={datasyncStyle.mainContent}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', mt: 2, ml: 2, "@media (max-width: 600px)": { flexDirection: 'column', display: 'flex', alignItems: 'flex-start' }, "@media (max-width: 440px)": { flexDirection: 'column', pt: 8, justifyContent: 'flex-start' } }}>
                <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, "@media (max-width: 600px)": { mb: 2 } }}>
                    <Typography className="first-sub-title">Data Sync</Typography>
                    <CustomTooltip title={"how data synch works and to customise your sync settings."} linkText="Learn more" linkUrl="https://vk.com"/>
                </Box>
            </Box>
        </Box>
    )
}


const DatasyncPage: React.FC = () => {
    return (
        <DataSync />
    );
};

export default DatasyncPage;
