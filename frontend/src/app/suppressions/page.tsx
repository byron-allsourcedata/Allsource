"use client";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import { Suspense, useState } from "react";
import { suppressionsStyle } from './suppressions';
import CollectionRules from "@/components/SuppressionsCollectingRules";
import SuppressionRules from "@/components/SuppressionsRules";
import CustomTooltip from "@/components/customToolTip";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";


interface TabPanelProps {
    children?: React.ReactNode;
    value: number;
    index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3, margin: 0, }}>{children}</Box>}
        </div>
    );
};

const Suppressions: React.FC = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
        setTabIndex(newIndex);
    };


    return (
        <Box sx={suppressionsStyle.mainContent}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', mt: 2, ml:2, "@media (max-width: 600px)": {flexDirection: 'column', display: 'flex', alignItems: 'flex-start'}, "@media (max-width: 440px)": {flexDirection: 'column', pt:8, justifyContent: 'flex-start'} }}>
                <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', width: '10%', gap: 1, "@media (max-width: 600px)": {mb:2 }}}>
                    <Typography className="first-sub-title">Suppressions</Typography>
                    <CustomTooltip title={"Suppressions help manage and filter out contacts or data points that should not receive communications or updates."} linkText="Learn more" linkUrl="https://maximiz.ai"/>
                </Box>
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', width:'90%', pr: '10%', alignItems: 'center', "@media (max-width: 600px)":{ width:'97%', pr: '0',}   }}>
                    <Tabs
                        value={tabIndex}
                        onChange={handleTabChange}
                        sx={{
                            textTransform: 'none',
                            minHeight: 0,
                            '& .MuiTabs-indicator': {
                                backgroundColor: 'rgba(80, 82, 178, 1)', 
                                height: '1.4px', 
                            },
                            "@media (max-width: 600px)": {border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '4px', width: '100%', '& .MuiTabs-indicator': {
                                height: '0',
                            },}
                        }}
                        aria-label="suppression tabs"
                    >
                        <Tab className="main-text"
                            sx={{
                                textTransform: 'none',
                                padding: '4px 10px',
                                flexGrow: 1,
                                marginRight: '3em',
                                minHeight: 'auto',
                                minWidth: 'auto',
                                fontSize: '14px',
                                fontWeight: 700,
                                lineHeight: '19.1px',
                                textAlign: 'left',
                                mr: 2,
                                '&.Mui-selected': {
                                    color: 'rgba(80, 82, 178, 1)'
                                },
                                "@media (max-width: 600px)": {mr: 0, borderRadius: '4px', '&.Mui-selected': {
                                    backgroundColor: 'rgba(249, 249, 253, 1)',
                                    border: '1px solid rgba(220, 220, 239, 1)'
                                },}
                            }}
                            label="Suppression Rules"
                        />
                        <Tab className="main-text"
                            sx={{
                                textTransform: 'none',
                                padding: '4px 10px',
                                minHeight: 'auto',
                                flexGrow: 1,
                                textAlign: 'center',
                                fontSize: '14px',
                                fontWeight: 700,
                                lineHeight: '19.1px',
                                minWidth: 'auto',
                                '&.Mui-selected': {
                                    color: 'rgba(80, 82, 178, 1)'
                                },
                                "@media (max-width: 600px)": {mr: 0, borderRadius: '4px', '&.Mui-selected': {
                                    backgroundColor: 'rgba(249, 249, 253, 1)',
                                    border: '1px solid rgba(220, 220, 239, 1)'
                                },}
                            }}
                            label="Collection Rules"
                        />
                    </Tabs>
                </Box>
            </Box>
            <Box sx={{ width: '100%' }}>
                <TabPanel value={tabIndex} index={0}>
                    <SuppressionRules />
                </TabPanel>
            </Box>
            <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                <TabPanel value={tabIndex} index={1}>
                    <CollectionRules />
                </TabPanel>
            </Box>
        </Box>
    );
};

const SuppressionsPage: React.FC = () => {
    return (
        <Suspense fallback={<CustomizedProgressBar />}>
            <Suppressions />
        </Suspense>
    );
};

export default SuppressionsPage;
