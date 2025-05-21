"use client";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { Typography, LinearProgress, FormControl, Select, MenuItem, SelectChangeEvent, Skeleton } from "@mui/material";
import { Box } from "@mui/system";
import { useState, useRef, useEffect } from "react";
import { smartAudiences } from "../smartAudiences";
import SmartAudiencesContacts from "./components/SmartAudienceContacts";
import SmartAudiencesTarget from "./components/SmartAudienceTarget";
import CustomTooltip from "@/components/customToolTip";
import { useFetchAudienceData } from "@/hooks/useFetchAudienceData";
import { useHints } from "@/context/HintsContext";
import HintCard from "../../components/HintCard";

interface HintCardInterface {
    description: string;
    title: string;
    linkToLoadMore: string;
}

interface StateHint {
    id: number;
    show: boolean;
}


const SmartAudiencesBuilder: React.FC = () => {
    const { showHints, smartsBuilderHints, toggleSmartsBuilderHintState } = useHints();
    const [useCaseType, setUseCaseType] = useState<string>("");
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    // const [isOpenSelect, setIsOpenSelect] = useState<StateHint[]>([
    //     { show: true, id: 0 },
    //     { show: false, id: 1 },
    //     { show: false, id: 2 },
    //     { show: false, id: 3 },
    //     { show: false, id: 4 },
    //     { show: false, id: 5 },
    // ]);

    const block1Ref = useRef<HTMLDivElement | null>(null);
    const block2Ref = useRef<HTMLDivElement | null>(null);
    const block3Ref = useRef<HTMLDivElement | null>(null);
    const block4Ref = useRef<HTMLDivElement | null>(null);
    const block5Ref = useRef<HTMLDivElement | null>(null);
    const block6Ref = useRef<HTMLDivElement | null>(null);
    const block7Ref = useRef<HTMLDivElement | null>(null);
    const block8Ref = useRef<HTMLDivElement | null>(null);
    const block9Ref = useRef<HTMLDivElement | null>(null);
    const block10Ref = useRef<HTMLDivElement | null>(null);

    const handleChangeSourceType = (event: SelectChangeEvent<string>) => {
        const useCase = event.target.value
        setUseCaseType(useCase);
        if (["Google", "Bing", "Meta"].includes(useCase)) {
            setTimeout(() => {
                scrollToBlock(block2Ref)
            }, 0)
            toggleDotHintClick(1)
        }
        else {
            setTimeout(() => {
                scrollToBlock(block5Ref)
            }, 0)
            toggleDotHintClick(2)
        }
        closeDotHintClick(0)
    };

    // useEffect(() => {
    //     if (showHints && !isOpenSelect) {
    //       setIsOpenSelect([
    //         { show: true, id: 0 },
    //         { show: false, id: 1 },
    //         { show: false, id: 2 },
    //         { show: false, id: 3 },
    //         { show: false, id: 4 },
    //         { show: false, id: 5 },
    //       ]);
    //     }
    //   }, [showHints]);

    const toggleDotHintClick = (id: number) => {
        toggleSmartsBuilderHintState(id)
    };

    const closeDotHintClick = (id: number) => {
        toggleSmartsBuilderHintState(id, false)
    };

    const openDotHintClick = (id: number) => {
        toggleSmartsBuilderHintState(id, true)
    };

    const scrollToBlock = (blockRef: React.RefObject<HTMLDivElement>) => {
        if (blockRef.current) {
            blockRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    const { sourceData, lookalikeData, loading } = useFetchAudienceData();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, alignItems: 'center' }}>
                <CustomizedProgressBar />
                <Box sx={{ alignItems: 'end', display: 'flex', width: '73%', justifyContent: 'start' }}><Skeleton variant="text" width={'12vw'} sx={{ fontSize: '1.75rem', alignItems: 'end' }} /></Box>

                <Skeleton variant="rectangular" width={'63vw'} height={'20vh'} sx={{ borderRadius: '6px' }} />
            </Box>
        )
    }

    const hintCards: HintCardInterface[] = [
        {
         description:
         "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
         title: "Use case",
         linkToLoadMore:
         "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
        },
        {
         description:
         "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
         title: "Select your Contacts1",
         linkToLoadMore:
           "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
        },
        {
         description:
         "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
         title: "Target Type",
         linkToLoadMore:
           "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
        },
        {
         description:
         "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
         title: "Select your Contacts2",
         linkToLoadMore:
           "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
        },
        {
         description:
         "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
         title: "Validation",
         linkToLoadMore:
           "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
        },
        {
         description:
         "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
         title: "Generate Active Segments",
         linkToLoadMore:
           "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
        }
    ]


    return (
        <>
            {loading && <CustomizedProgressBar />}
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: "calc(100vh - 4.25rem)",overflow: 'auto', pr: 2, alignItems: 'center' }}>
                <Box sx={{ display: "flex", flexDirection: 'column', width: '74%' }}>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', }}>
                        <Box sx={{ display: 'flex', marginTop: 2, flexWrap: 'wrap', minWidth: '100%', gap: '15px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography className='first-sub-title'>Smart Audience Builder</Typography>
                                <CustomTooltip title={"Smart Audience Builder."} linkText="Learn more" linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/smart-audience-builder" />
                            </Box>
                        </Box>
                        <Box ref={block1Ref} sx={{ display: "flex", minWidth: '100%', flexDirection: "column", gap: 2, flexGrow: 1, position: "relative", flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px", mt: 2 }}>
                            {uploadProgress !== null && (
                                <Box sx={{ width: "100%", position: "absolute", top: 0, left: 0, zIndex: 1200 }}>
                                    <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: "6px", backgroundColor: '#c6dafc', '& .MuiLinearProgress-bar': { borderRadius: 5, backgroundColor: '#4285f4' } }} />
                                </Box>
                            )}
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography sx={{ fontFamily: "Nunito Sans", fontSize: "16px", fontWeight: 500 }}>Select your Use Case</Typography>
                                    <CustomTooltip title={"Smart Audience Builder."} linkText="Learn more" linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/smart-audience-builder" />
                                </Box>
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
                                {showHints && smartsBuilderHints[0].show &&  (
                                    <HintCard
                                        card={hintCards[0]}
                                        positionLeft={340}
                                        toggleClick={() => toggleDotHintClick(0)}
                                    />
                                )}
                            </FormControl>
                        </Box>

                        {["Google", "Bing", "Meta"].includes(useCaseType) ? (
                            <SmartAudiencesContacts
                                block2Ref={block2Ref}
                                block3Ref={block3Ref}
                                block4Ref={block4Ref}
                                hintCards={hintCards}
                                toggleDotHintClick={toggleDotHintClick}
                                closeDotHintClick={closeDotHintClick}
                                scrollToBlock={scrollToBlock}
                                useCaseType={useCaseType}
                                sourceData={sourceData}
                                lookalikeData={lookalikeData}
                            />
                        ) : (
                            ["Email", "Tele Marketing", "Postal", "LinkedIn"].includes(useCaseType) && (
                                <SmartAudiencesTarget
                                    block5Ref={block5Ref}
                                    block6Ref={block6Ref}
                                    block7Ref={block7Ref}
                                    block8Ref={block8Ref}
                                    block9Ref={block9Ref}
                                    block10Ref={block10Ref}
                                    hintCards={hintCards}
                                    toggleDotHintClick={toggleDotHintClick}
                                    closeDotHintClick={closeDotHintClick}
                                    openDotHintClick={openDotHintClick}
                                    scrollToBlock={scrollToBlock}
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