"use client"
import { Box, Grid, LinearProgress } from "@mui/material";
import { useState } from "react";
import { useTrial } from '@/context/TrialProvider';
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { styled } from '@mui/material/styles';
import PartnersAdmin from '@/components/PartnersAdmin'
import PartnersAccounts from '@/components/PartnersAccounts'


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
            {value === index && <Box sx={{ margin: 0, pr:2, pt:2, '@media (max-width: 900px)': { pl: 3, pr: 3 }, '@media (max-width: 700px)': { pl: 1, pr: 1 } }}>{children}</Box>}
        </div>
    );
};

const Assets: React.FC = () => {
    const [masterData, setMasterData] = useState<any>(null)
    const [loading, setLoading] = useState(false);
    const [tabIndex, setTabIndex] = useState(0);
    const handleTabChange = (event: React.SyntheticEvent | null, newIndex: number) => {
        setTabIndex(newIndex);
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
                    height: '92vh',
                }}
            >


                <Box
                    sx={{
                        gridArea: 'content',

                    }}
                >
                    <Grid container>
                        <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                                    {masterData?.id && <TabPanel value={tabIndex} index={0}>
                                        <PartnersAccounts fromAdmin={true} masterData={masterData} setMasterData={setMasterData} loading={loading} setLoading={setLoading} tabIndex={tabIndex} handleTabChange={handleTabChange} />
                                    </TabPanel>}
                                </Box>
                                <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                                    <TabPanel value={tabIndex} index={masterData?.id ? 1 : 0}>
                                        <PartnersAdmin masterData={masterData} setMasterData={setMasterData} isMaster={true} loading={loading} setLoading={setLoading} tabIndex={tabIndex} handleTabChange={handleTabChange} />
                                    </TabPanel>
                                </Box>
                                <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                                    <TabPanel value={tabIndex} index={masterData?.id ? 2 : 1}>
                                        <PartnersAdmin masterData={masterData} isMaster={false} loading={loading} setLoading={setLoading} tabIndex={tabIndex} handleTabChange={handleTabChange} />
                                    </TabPanel>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </>
    )
};

export default Assets;