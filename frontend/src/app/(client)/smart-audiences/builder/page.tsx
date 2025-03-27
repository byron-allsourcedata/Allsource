"use client";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { Typography, LinearProgress, FormControl, Select, MenuItem, SelectChangeEvent, Skeleton } from "@mui/material";
import { Box } from "@mui/system";
import { useState } from "react";
import { smartAudiences } from "../smartAudiences";
import SmartAudiencesContacts from "./components/SmartAudienceContacts";
import SmartAudiencesTarget from "./components/SmartAudienceTarget";
import { useFetchAudienceData } from "@/hooks/useFetchAudienceData";


const SmartAudiencesBuilder: React.FC = () => {
    const [useCaseType, setUseCaseType] = useState<string>("");
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    const handleChangeSourceType = (event: SelectChangeEvent<string>) => {
        setUseCaseType(event.target.value);
    };

    const { sourceData, lookalikeData, loading } = useFetchAudienceData();

    if(loading){
        return(
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 2,  mt:1, alignItems: 'center'}}>
                <CustomizedProgressBar />
                <Box sx={{alignItems: 'end', display:'flex', width: '73%', justifyContent: 'start'}}><Skeleton variant="text" width={'12vw'} sx={{ fontSize: '1.75rem', alignItems:'end'}} /></Box>
            
            <Skeleton variant="rectangular" width={'63vw'} height={'20vh'} sx={{borderRadius: '6px'}}/>
            </Box>
        )
    }


    return (
        <>
            {loading && <CustomizedProgressBar />}
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', overflow: 'auto', pr: 2, alignItems: 'center' }}>
                <Box sx={{ display: "flex", flexDirection: 'column', width: '74%' }}>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', }}>
                        <Box sx={{ display: 'flex', marginTop: 2, flexWrap: 'wrap', minWidth: '100%', gap: '15px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography className='first-sub-title'>Smart Audience Builder</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: "flex", minWidth: '100%', flexDirection: "column", gap: 2, flexGrow: 1, position: "relative", flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px", mt: 2 }}>
                            {uploadProgress !== null && (
                                <Box sx={{ width: "100%", position: "absolute", top: 0, left: 0, zIndex: 1200 }}>
                                    <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: "6px", backgroundColor: '#c6dafc', '& .MuiLinearProgress-bar': { borderRadius: 5, backgroundColor: '#4285f4' } }} />
                                </Box>
                            )}
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <Typography sx={{ fontFamily: "Nunito Sans", fontSize: "16px", fontWeight: 500 }}>Select your Use Case</Typography>
                                <Typography sx={{ fontFamily: "Roboto", fontSize: "12px", color: "rgba(95, 99, 104, 1)" }}>Choose what you would like to use it for.</Typography>
                            </Box>
                            <FormControl variant="outlined">
                                <Select value={useCaseType ? useCaseType : ''} onChange={handleChangeSourceType} displayEmpty sx={{ ...smartAudiences.text, width: "316px", borderRadius: "4px", pt: 0 }}>
                                    <MenuItem value="" disabled sx={{ display: "none", mt: 0 }}>Choose Use case Type</MenuItem>
                                    <MenuItem className="second-sub-title" value={"Meta"}>Meta</MenuItem>
                                    <MenuItem className="second-sub-title" value={"Google"}>Google</MenuItem>
                                    <MenuItem className="second-sub-title" value={"Bing"}>Bing</MenuItem>
                                    <MenuItem className="second-sub-title" value={"Email"}>Email</MenuItem>
                                    <MenuItem className="second-sub-title" value={"Tele Marketing"}>Tele Marketing</MenuItem>
                                    <MenuItem className="second-sub-title" value={"Postal"}>Postal</MenuItem>
                                    <MenuItem className="second-sub-title" value={"LinkedIn"}>LinkedIn</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {["Google", "Bing", "Meta"].includes(useCaseType) ? (
                            <SmartAudiencesContacts
                                useCaseType={useCaseType}
                                sourceData={sourceData}
                                lookalikeData={lookalikeData}
                            />
                        ) : (
                            ["Email", "Tele Marketing", "Postal", "LinkedIn"].includes(useCaseType) && (
                                <SmartAudiencesTarget
                                    useCaseType={useCaseType}
                                    sourceData={sourceData}
                                    lookalikeData={lookalikeData}
                                />
                            )
                        )}


                    </Box>
                </Box>
            </Box>
        </>
    );
}

export default SmartAudiencesBuilder;