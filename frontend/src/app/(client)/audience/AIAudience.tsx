import { Button, IconButton, Typography, Slider } from "@mui/material";
import { Box, width } from "@mui/system";
import ArrowLeftOutlined from "@mui/icons-material/KeyboardArrowLeft"
import AddIcon from '@mui/icons-material/Add';
import CustomTooltip from "@/components/customToolTip";
import DownloadIcon from '@mui/icons-material/Download';
import MoreVertOutlined from "@mui/icons-material/MoreVertOutlined";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Image from "next/image";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

import AudiencePopup from "./AudienceSyncSlider";

const dataSources = [
    { id: "bigcommerce", label: "Bigcommerce", icon: "bigcommerce-icon.svg" },
    // { id: "shopify", label: "Shopify", icon: "shopify-icon.svg" },
    // { id: "manually", label: "Manually", icon: "upload-minimalistic.svg" },
    // { id: "website", label: "Website - Pixel", icon: "website-icon.svg" },
];

const audienceType = [
    { id: "loyal", label: "Loyal category customer" },
    { id: "ltv", label: "High LTV customer" },
    { id: "frequent", label: "Frequent customer" },
    { id: "recent", label: "Recent customer" },
    { id: "aov", label: "High AOV customer" },
    // { id: "intent", label: "High Intent Visitor" },
    // { id: "returning", label: "Returning visitor" },
    // { id: "cart", label: "Abandoned Cart Visitor" }
]

const audienceSize = [
    { id: "almost", label: "Almost identical", text: 'Lookalike size 0-3%', min_value: 0, max_value: 3 },
    { id: "extremely", label: "Extremely Similar", text: 'Lookalike size 3-7%', min_value: 3, max_value: 7 },
    { id: "very", label: "Very similar", text: 'Lookalike size 7-10%', min_value: 7, max_value: 10 },
    { id: "quite", label: "Quite similar", text: 'Lookalike size 10-15%', min_value: 10, max_value: 15 },
    { id: "broad", label: "Broad", text: 'Lookalike size 15-20%', min_value: 15, max_value: 20 },
];

interface AudienceData {
    id: number;
    icon: string;
    title: string;
    type: string;
    created_at: Date;
    size: string;
}

const AIAudience: React.FC<{ onBack: () => void }> = ({ onBack }) => {

    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string[]>(audienceType.map(source => source.id));
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [sliderValue, setSliderValue] = useState<number[]>([0, 20]);
    const [currentStep, setCurrentStep] = useState(1);
    const [activeAudience, setActiveAudience] = useState<boolean>(false);
    const [audience, setAudience] = useState<AudienceData[]>([]);
    const [selectedAudience, setSelectedAudience] = useState<number[]>([]);


    const handleSelectSource = (id: string) => {
        setSelectedSource(id);
    };

    const handleSelectType = (id: string) => {
        if (selectedType.includes(id)) {
            if (selectedType.length > 1) {
                setSelectedType(selectedType.filter(sourceId => sourceId !== id));
            }
        } else {
            setSelectedType([...selectedType, id]);
        }
    };

    const handleSelectSize = (id: string, min_value: number, max_value: number) => {
        setSelectedSize(id);
        setSliderValue([min_value, max_value]);
    };

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        const value = newValue as number;
        setSliderValue(newValue as number[]);
        setSelectedSize('')
    };

    const handleNext = () => {
        setCurrentStep((prev) => prev + 1);
    };

    const handleCancel = () => {
        setSelectedSource('')
        setSelectedType(audienceType.map(source => source.id))
        setSelectedSize('')
        setSliderValue([0,20])
        setCurrentStep(1)
    }

    const handleGenerate = () => {
        setActiveAudience(true)
    }

    const handleBackGenerate = () => {
        setActiveAudience(false)
    }

    const handleDownload = () => {

    }

    const handleSaveAudience = () => {

    }

    const handleSyncAudience = () => {

    }

    const handleSelect = (index: number) => {
        setSelectedAudience((prev) =>
            prev.includes(index) ? prev.filter((id) => id !== index) : [...prev, index]
        );
    };

    const isAnySelected = selectedAudience.length > 0;

    const handleViewActions = (event: React.MouseEvent) => {
        event.stopPropagation();
    }

    useEffect(() => {
        // fetchRules();
        setAudience([
            {
                id: 1,
                icon: "bigcommerce-icon.svg",
                title: "Bigcommerce",
                type: "High LTV Customer",
                size: '30',
                created_at: new Date("2024-12-01"),
            },
            {
                id: 2,
                icon: "shopify-icon.svg",
                title: "Shopify",
                type: "High LTV Customer",
                size: '30',
                created_at: new Date("2024-12-01"),
            },
            {
                id: 3,
                icon: "website-icon.svg",
                title: "Pixel",
                type: "High LTV Customer",
                size: '30',
                created_at: new Date("2024-12-01"),
            },
        ]);
    }, []);


    return (
        <Box sx={{ width: '100%' }}>

            {activeAudience ?
                <Box sx={{ width: '90%', display: 'flex', flexDirection: 'column', pr: 3, pl: 3 }}>
                    <Box sx={{ mb: 5, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'end', }}>
                        <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', width:'100%'}}>
                            <Typography
                                onClick={handleBackGenerate}
                                sx={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'Nunito Sans', color: "rgba(128, 128, 128, 1)", cursor: "pointer" }}>
                                Generate AI audience
                            </Typography>

                            <NavigateNextIcon width={16} />
                            <Typography sx={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'Nunito Sans', color: "rgba(128, 128, 128, 1)" }}>
                                Audience
                            </Typography>

                        </Box>
                        <Box sx={{
                            display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'end', gap: '15px', pt: '4px', width: '100%',
                            '@media (max-width: 900px)': {
                                gap: '8px'
                            }
                        }}>
                            <Button
                                onClick={handleSaveAudience}
                                aria-haspopup="true"
                                disabled={!isAnySelected} 
                                sx={{
                                    textTransform: 'none',
                                    color: !isAnySelected ? 'rgba(128, 128, 128, 1)' : 'rgba(80, 82, 178, 1)',
                                    border: '1px solid rgba(80, 82, 178, 1)',
                                    borderRadius: '4px',
                                    padding: '9px 16px',
                                    opacity: !isAnySelected ? '0.6' : '1',
                                    minWidth: 'auto',
                                    '@media (max-width: 900px)': {
                                        display: 'none'
                                    }
                                }}
                            >
                                <Typography className='second-sub-title' sx={{
                                    marginRight: '0.5em',
                                    padding: 0.2,
                                    textAlign: 'left',
                                    color: '#5052B2 !important'
                                }}>
                                    Save
                                </Typography>
                            </Button>
                            <Button
                                onClick={handleSyncAudience}
                                aria-haspopup="true"
                                disabled={!isAnySelected} 
                                sx={{
                                    textTransform: 'none',
                                    color: !isAnySelected ? 'rgba(128, 128, 128, 1)' : 'rgba(80, 82, 178, 1)',
                                    border: !isAnySelected ? '1px solid rgba(128, 128, 128, 1)' : '1px solid rgba(80, 82, 178, 1)',
                                    borderRadius: '4px',
                                    padding: '9px 16px',
                                    opacity: !isAnySelected ? '0.6' : '1',
                                    minWidth: 'auto',
                                    '@media (max-width: 900px)': {
                                        display: 'none'
                                    }
                                }}
                            >
                                <Typography className='second-sub-title' sx={{
                                    marginRight: '0.5em',
                                    padding: 0.2,
                                    textAlign: 'left',
                                    color: '#5052B2 !important'
                                }}>
                                    Audience Sync
                                </Typography>
                            </Button>
                            <Button
                                aria-haspopup="true"
                                disabled={!isAnySelected} 
                                sx={{
                                    textTransform: 'none',
                                    color: 'rgba(128, 128, 128, 1)',
                                    opacity: !isAnySelected ? '0.6' : '1',
                                    border: '1px solid rgba(128, 128, 128, 1)',
                                    borderRadius: '4px',
                                    padding: '8px',
                                    minWidth: 'auto',
                                    '@media (max-width: 900px)': {
                                        border: 'none',
                                        padding: 0
                                    },
                                    '&:hover': {
                                        backgroundColor: 'transparent',
                                        border: '1px solid rgba(80, 82, 178, 1)',
                                        color: 'rgba(80, 82, 178, 1)',
                                        '& .MuiSvgIcon-root': {
                                            color: 'rgba(80, 82, 178, 1)'
                                        }
                                    }
                                }}
                                onClick={handleDownload}
                            >
                                <DownloadIcon fontSize='medium' />
                            </Button>
                        </Box>
                    </Box>
                    {audience.map((data, index) => (
                        <Box
                            key={index}
                            onClick={() => handleSelect(index)}
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: 2,
                                border: "1px solid #e0e0e0",
                                borderRadius: 2,
                                cursor: 'pointer',
                                backgroundColor: selectedAudience.includes(index) 
                                ? "rgba(246, 248, 250, 1)" 
                                : "#fff",
                                mb: 3,
                                "@media (max-width: 600px)": {
                                    flexDirection: "column",
                                    justifyContent: "space-around",
                                    width: "100%",
                                    alignItems: "flex-start",
                                    gap: 2,
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "row",
                                    gap: 2,
                                    justifyContent: "space-around",
                                    padding: '23px 20px 22px 30px',
                                    "@media (max-width: 600px)": { width: "100%" },
                                }}
                            >
                                <Image src={data.icon} alt={data.title} width={20} height={20} />
                                <Typography
                                    className="table-heading"
                                    sx={{
                                        fontSize: "16px !important",
                                        width: "80px",
                                        textAlign: "left",
                                    }}
                                >
                                    {data.title}
                                </Typography>
                                {/* <Button
                                    onClick={() => handleViewDetails(data.month)}
                                    sx={{
                                        display: "none",
                                        backgroundColor: "#FFF",
                                        fontFamily: "Nunito Sans",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        lineHeight: "20px",
                                        letterSpacing: "normal",
                                        color: "rgba(80, 82, 178, 1)",
                                        textTransform: "none",
                                        padding: 0,
                                        margin: 0,
                                        gap: 1,
                                        "@media (max-width: 600px)": { display: "flex" },
                                    }}
                                >
                                    View more{" "}
                                    <Image
                                        src={"/right-icon.svg"}
                                        width={7}
                                        height={12}
                                        alt="right-icon"
                                    />
                                </Button> */}
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 5,
                                    width: '50%',
                                    "@media (max-width: 600px)": {
                                        flexDirection: "column",
                                        justifyContent: "space-around",
                                        width: "100%",
                                        gap: 2,
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 6,
                                        width: '100%',
                                        justifyContent: "space-between",
                                        "@media (max-width: 900px)": { gap: 3 },
                                        "@media (max-width: 600px)": {
                                            justifyContent: "space-around",
                                            width: "100%",
                                            display: "flex",
                                            pr: 0.75,
                                        },
                                    }}
                                >
                                    <Box>
                                        <Typography variant="body2" className="table-heading">
                                            Audience Type
                                        </Typography>
                                        <Typography variant="subtitle1" className="table-data">
                                            {data.type}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography
                                            variant="body2"
                                            className="table-heading"
                                            sx={{ textAlign: "left" }}
                                        >
                                            Created date
                                        </Typography>
                                        <Typography variant="subtitle1" className="table-data">
                                            {dayjs(data.created_at).format('MMM D, YYYY')}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography
                                            variant="body2"
                                            className="table-heading"
                                            sx={{ textAlign: "left" }}
                                        >
                                            Audience size
                                        </Typography>
                                        <Typography variant="subtitle1" className="table-data">
                                            {data.size}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            <IconButton
                                onClick={(event) => handleViewActions(event,)}
                                
                                sx={{
                                    backgroundColor: "#FFF",
                                    fontFamily: "Nunito Sans",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    lineHeight: "20px",
                                    letterSpacing: "normal",
                                    color: "rgba(80, 82, 178, 1)",
                                }}
                            >
                                <MoreVertOutlined />
                            </IconButton>
                        </Box>
                    ))}

                </Box>
                :
                <Box sx={{ width: '90%' }}>
                    <Box sx={{ pr: 2, display: 'flex', alignItems: 'start', height: '100%', gap: 2.25, ml: 2 }}>
                        <Button onClick={onBack} className="button" sx={{ textTransform: 'none', pt: 0, pb: 0, pl: 0 }}>
                            <ArrowLeftOutlined /> Back
                        </Button>
                        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'start', }}>
                            <Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'start', width: '100%', gap: '0.5rem' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'start', gap: 1, width: '100%' }}>
                                        <Typography className="second-sub-title" sx={{ fontSize: '19px !important' }}> Generate AI Audience </Typography>
                                        <Box sx={{ "@media (max-width: 600px)": { display: 'none' } }}> <CustomTooltip title={"Our Referral program rewards you for bringing new users to our platform. Share your unique referral link with friends and colleagues, and earn incentives for each successful sign-up."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/referral" /> </Box>
                                    </Box>
                                    <Box>
                                        <Typography className="table-data"> Leverage Maximiz AI audience to identify key traits and deliver high-intent audience lookalikes from your data. </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', width: '100%', height: '100%', flexDirection: 'column', paddingLeft: 10, pr: 10, ml: 2 }}>
                        {/* Section 1 */}
                        {currentStep >= 1 && (
                            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'start' }}>
                                <Box sx={{ border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '6px', width: '100%', display: 'flex', flexDirection: 'column', padding: '18px', gap: '8px', mt: 2 }}>
                                    <Typography className="second-sub-title"> Choose your data source </Typography>
                                    <Typography className="paragraph">
                                        Choose your data source, and let Maximia AI Audience Algorithm identify high-intent leads and create lookalike audiences to <br /> slash your acquisition costs.
                                    </Typography>

                                    <Box sx={{ display: "flex", flexDirection: "row", gap: 2, pt: '4px' }}>
                                        {dataSources.map((source) => (
                                            <Button
                                                key={source.id}
                                                onClick={() => handleSelectSource(source.id)}
                                                sx={{
                                                    display: "flex",
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    border: selectedSource === source.id ? "1px solid #1976d2" : "1px solid rgba(208, 213, 221, 1)",
                                                    gap: "10px",
                                                    padding: "0.4rem 0.4rem",
                                                    borderRadius: "4px",
                                                    textTransform: "none",
                                                }}
                                            >
                                                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
                                                    <Image src={source.icon} alt={source.label} width={20} height={20} />
                                                    <Typography className="paragraph" sx={{ color: selectedSource === source.id ? 'rgba(32, 33, 36, 1) !important' : 'transparent' }}>{source.label}</Typography>
                                                </Box>

                                                <Box sx={{ visibility: selectedSource === source.id ? '' : 'hidden', display: 'flex', alignItems: 'center' }}>
                                                    <Image src="lightgreen-tick-circle.svg" alt="Ok" width={20} height={20} />
                                                </Box>


                                            </Button>
                                        ))}
                                        {/* <IconButton sx={{ display: 'flex', flexDirection: 'row', border: '1px solid rgba(208, 213, 221, 1)', gap: '10px', borderRadius: '4px', color: 'rgba(112, 112, 113, 1)', }}>
                                    <AddIcon />
                                </IconButton> */}
                                    </Box>
                                </Box>
                            </Box>
                        )}
                        <Box sx={{ width: "100%", display: "flex", justifyContent: "end", gap: 2 }}>
                            {currentStep === 1 && (
                                <Button
                                    sx={{
                                        border: '1px #5052B2 solid',
                                        color: '#FFFFFF',
                                        backgroundColor: '#5052B2',
                                        textTransform: 'none',
                                        mt: 2,
                                        '&:hover': {
                                            border: '1px #5052B2 solid',
                                            backgroundColor: '#5052B2'
                                        },
                                        '&.Mui-disabled': {
                                            opacity: 0.5,
                                            backgroundColor: '#A0A0A0',
                                            borderColor: '#A0A0A0',
                                            color: '#FFFFFF'
                                        }
                                    }}
                                    disabled={!selectedSource}
                                    variant="outlined"
                                    onClick={handleNext}
                                >
                                    <Typography padding={'0.5rem 2rem'} fontSize={'0.8rem'}>Next</Typography>
                                </Button>
                            )}
                        </Box>

                        {/* Section 2 */}
                        {currentStep >= 2 && (
                            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'start' }}>
                                <Box sx={{ border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '6px', width: '100%', display: 'flex', flexDirection: 'column', padding: '18px', gap: '8px', mt: 2 }}>
                                    <Typography className="second-sub-title"> Choose Audience Type </Typography>
                                    <Typography className="paragraph">
                                        Choose the audience type that best fits your objectives.
                                    </Typography>

                                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5, mt: 0 }}>
                                        {audienceType.map((source) => (
                                            <Box key={source.id} sx={{ position: "relative", width: "100%" }}>
                                                {source.id === "ltv" && (
                                                    <Box
                                                        sx={{
                                                            position: "absolute",
                                                            top: "-19px",
                                                            left: "12%",
                                                            transform: "translateX(-50%)",
                                                            backgroundColor: "#009970",
                                                            color: "#FFFFFF",
                                                            fontSize: "10px",
                                                            fontWeight: "bold",
                                                            padding: "4px 8px",
                                                            borderRadius: "6px 6px 0 0",
                                                            whiteSpace: "nowrap",
                                                            minWidth: "80px",
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        Recommended
                                                    </Box>
                                                )}

                                                <Button
                                                    onClick={() => handleSelectType(source.id)}
                                                    sx={{
                                                        display: "flex",
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        border: selectedType.includes(source.id) ? "1px solid rgba(117, 168, 218, 1)" : "1px solid rgba(208, 213, 221, 1)",
                                                        padding: "0.6rem 0.5rem",
                                                        borderRadius: "4px",
                                                        textTransform: "none",
                                                        backgroundColor: selectedType.includes(source.id) ? "rgba(246, 248, 250, 1)" : "transparent",
                                                        width: "100%",
                                                    }}
                                                >
                                                    <Typography className="paragraph" sx={{ color: "rgba(32, 33, 36, 1) !important" }}>
                                                        {source.label}
                                                    </Typography>
                                                </Button>
                                            </Box>
                                        ))}
                                    </Box>

                                </Box>
                            </Box>
                        )}
                        <Box sx={{ width: "100%", display: "flex", justifyContent: "end", gap: 2, }}>
                            {currentStep === 2 && (
                                <Button
                                    sx={{
                                        border: '1px #5052B2 solid',
                                        color: '#FFFFFF',
                                        backgroundColor: '#5052B2',
                                        textTransform: 'none',
                                        mt: 2,
                                        '&:hover': {
                                            border: '1px #5052B2 solid',
                                            backgroundColor: '#5052B2'
                                        }
                                    }}
                                    variant="outlined"
                                    onClick={handleNext}
                                >
                                    <Typography padding={'0.5rem 2rem'} fontSize={'0.8rem'}>Next</Typography>
                                </Button>
                            )}
                        </Box>
                        {/* Section 3 */}
                        {currentStep >= 3 && (
                            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'start' }}>
                                <Box sx={{ border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '6px', width: '100%', display: 'flex', flexDirection: 'column', padding: '18px', gap: '8px', mt: 2 }}>
                                    <Typography className="second-sub-title"> Choose lookalike size </Typography>
                                    <Typography className="paragraph">
                                        Fine-tune your targeting! Choose the size of your lookalike audience to match your marketing goals.
                                    </Typography>

                                    <Box sx={{ display: "flex", flexDirection: "row", gap: 2, pt: 2 }}>
                                        {audienceSize.map((source) => (
                                            <Box key={source.id} sx={{ position: "relative" }}>
                                                {source.id === "extremely" && (
                                                    <Box
                                                        sx={{
                                                            position: "absolute",
                                                            top: "-19px",
                                                            left: "34%",
                                                            transform: "translateX(-50%)",
                                                            backgroundColor: "#009970",
                                                            color: "#FFFFFF",
                                                            fontSize: "10px",
                                                            fontWeight: "bold",
                                                            padding: "4px 8px",
                                                            borderRadius: "6px 6px 0 0",
                                                            whiteSpace: "nowrap",
                                                            minWidth: "80px",
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        Recommended
                                                    </Box>
                                                )}
                                                <Button
                                                    key={source.id}
                                                    onClick={() => handleSelectSize(source.id, source.min_value, source.max_value)}
                                                    sx={{
                                                        display: "flex",
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        border: selectedSize === source.id ? "1px solid #1976d2" : "1px solid rgba(208, 213, 221, 1)",
                                                        gap: "10px",
                                                        padding: "0.6rem 0.5rem",
                                                        borderRadius: "4px",
                                                        textTransform: "none",
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                                        <Typography className="paragraph" sx={{ color: 'rgba(32, 33, 36, 1) !important' }}>{source.label}</Typography>
                                                        <Typography className="paragraph" sx={{ fontSize: '12px !important' }}>{source.text}</Typography>
                                                    </Box>

                                                </Button>
                                            </Box>

                                        ))}
                                    </Box>

                                    <Box sx={{ width: '100%', mt: 0 }}>
                                        <Slider
                                            value={sliderValue}
                                            onChange={handleSliderChange}
                                            min={0}
                                            max={20}
                                            step={1}
                                            valueLabelDisplay="auto"
                                            sx={{
                                                color: 'rgba(80, 82, 178, 1)',
                                            }}
                                        />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0 }}>
                                            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                                                0%
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                                                10%
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                                                20%
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                    {currentStep === 3 && (
                       <Box sx={{
                        position: 'fixed',      // Закрепляем компонент
                        bottom: 0,             // Внизу экрана
                        left: 0,               // Слева
                        right: 0,              // Справа
                        borderTop: '1px solid rgba(228, 228, 228, 1)', 
                        mt: 2, 
                        pr: 2, 
                        pt: '0.5rem',
                        backgroundColor: 'white',  // Можно задать фон, чтобы не было видно контента за компонентом
                        zIndex: 9999,              // Чтобы компонент был сверху, если перекрывает другие элементы
                    }}>
                        <Button
                            sx={{
                                border: '1px #5052B2 solid',
                                color: '#5052B2',
                                backgroundColor: '#FFFFFF',
                                textTransform: 'none',
                                mt: 1,
                                '&:hover': {
                                    border: '1px #5052B2 solid',
                                    backgroundColor: '#FFFFFF'
                                }
                            }}
                            variant="outlined"
                            onClick={handleCancel}
                        >
                            <Typography padding={'0.5rem 2rem'} fontSize={'0.8rem'}>Cancel</Typography>
                        </Button>
                        <Button
                            sx={{
                                border: '1px #5052B2 solid',
                                color: '#FFFFFF',
                                backgroundColor: '#5052B2',
                                textTransform: 'none',
                                gap: 0,
                                mt: 1,
                                '&:hover': {
                                    border: '1px #5052B2 solid',
                                    backgroundColor: '#5052B2'
                                }
                            }}
                            variant="outlined"
                            onClick={handleGenerate}
                        >
                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0.5rem 1rem', gap: 1 }}>
                                <Image src={'stars-icon.svg'} alt="Stars" width={15} height={15} />
                                <Typography fontSize={'0.8rem'}> Generate Audience</Typography>
                            </Box>
                        </Button>
                    </Box>
                    )}
                </Box>
            }


        </Box>
    );
};

export default AIAudience;