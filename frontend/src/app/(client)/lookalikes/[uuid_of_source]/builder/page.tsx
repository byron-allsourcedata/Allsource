'use client'
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Box, Typography, Button, TextField } from "@mui/material";
import AudienceSizeSelector from "@/app/(client)/lookalikes/components/SizeSelector";
import SourceTableContainer from "@/app/(client)/lookalikes/components/SourceTableContainer";
import useAxios from "axios-hooks";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import axiosInstance from "@/axios/axiosInterceptorInstance";


const audienceSize = [
    {
        id: "almost",
        label: "Almost identical",
        text: "Lookalike size 0-3%",
        min_value: 0,
        max_value: 3,
    },
    {
        id: "extremely",
        label: "Extremely Similar",
        text: "Lookalike size 0-7%",
        min_value: 0,
        max_value: 7,
    },
    {
        id: "very",
        label: "Very similar",
        text: "Lookalike size 0-10%",
        min_value: 0,
        max_value: 10,
    },
    {
        id: "quite",
        label: "Quite similar",
        text: "Lookalike size 0-15%",
        min_value: 0,
        max_value: 15,
    },
    {
        id: "broad",
        label: "Broad",
        text: "Lookalike size 0-20%",
        min_value: 0,
        max_value: 20,
    },
];

interface TableData {
    name: string;
    source: string;
    type: string;
    createdDate: string;
    createdBy: string;
    numberOfCustomers: string;
    matchedRecords: string;
  }
const tableData = [
    {
        name: "My Orders",
        source: "CSV File",
        type: "Customer Conversions",
        createdDate: "Oct 01, 2024",
        createdBy: "Mikhail Sofin",
        numberOfCustomers: "10,000",
        matchedRecords: "7,523",
    },
];

const CreateLookalikePage: React.FC = () => {
    const params = useParams();
    const [selectedSize, setSelectedSize] = useState<string>("");
    const [sliderValue, setSliderValue] = useState<number[]>([0, 0]);
    const [currentStep, setCurrentStep] = useState(1);
    const [sourceName, setSourceName] = useState("");
    const [sourceData, setSourceData] = useState<TableData>();

    const handleSelectSize = (
        id: string,
        min_value: number,
        max_value: number
    ) => {
        setSelectedSize(id);
        setSliderValue([min_value, max_value]);
        handleNext();
    };

    // const handleGenerateClick = () => {
    //     if (sourceName.trim() !== "") {
    //         setIsLookalikeGenerated(true);
    //     }
    // };

    const handleSourceData = async () => {
        const response = await axiosInstance.get(`lookalike/builder?uuid_of_source=${params.uuid_of_source}`)
        if (response.data){
            setSourceData(response.data)
        }
    }
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSourceName(event.target.value);
    };

    const handleSliderChange = (newValue: number | number[]) => {
        const value = newValue as number[];
        setSliderValue(value);
        
    };

    const handleCancel = () => {
        setSelectedSize("");
        setSliderValue([0, 20]);
        setCurrentStep(1);
    };

    const handleNext = () => {
        setCurrentStep((prev) => prev + 1);
    };

    const handleGenerateLookalike = async () => {
        const response = await axiosInstance.post('/lookalike/builder', {uuid_of_source: params.uuid_of_source, lookalike_size: selectedSize, lookalike_name: sourceName})
    }

    useEffect(()=> {
        handleSourceData();
    }, [params]);


    return (
        <Box sx={{ width: "100%", pr: 2 }}>
            

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <Box>
                    <Box sx={{ width: "100%", padding: 3, color: "#202124" }}>
                        {/* Title */}
                        <Typography
                            variant="h1"
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontWeight: 700,
                                fontSize: "19px",
                                lineHeight: "25.92px",
                                letterSpacing: "0%",
                                marginBottom: 2,
                                textAlign: "left",
                            }}
                        >
                            Create Lookalike
                        </Typography>

                        {/* Block with table Source */}
                        {currentStep >= 1 && (
                            <Box
                                sx={{
                                    textAlign: "left",
                                    padding: "16px 20px 20px 20px",
                                    borderRadius: "6px",
                                    border: "1px solid #E4E4E4",
                                    backgroundColor: "white",
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontFamily: "Nunito Sans",
                                        fontWeight: 500,
                                        fontSize: "16px",
                                        lineHeight: "22.5px",
                                        marginBottom: 2,
                                    }}
                                >
                                    Source
                                </Typography>

                                <SourceTableContainer tableData={tableData}
                                 // tableData={sourceData} 
                                 />
                            </Box>
                        )}
                        <Box
                            sx={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "end",
                                gap: 2,
                            }}
                        >
                            {currentStep === 1 && (
                                <Box
                                    sx={{
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "end",
                                        gap: 2,
                                        mt: 2,
                                    }}
                                >
                                    <Button
                                        variant="outlined"
                                        sx={{
                                            marginRight: "16px",
                                            textTransform: "none",
                                            color: "#5052B2",
                                            height: "40px",
                                            borderColor: "#5052B2",
                                            backgroundColor: "#FFFFFF",
                                            fontFamily: "Nunito Sans",
                                            fontWeight: 500,
                                            fontSize: "14px",
                                            lineHeight: "19.6px",
                                            letterSpacing: "0%",
                                        }}
                                    >
                                        Add another Source
                                    </Button>

                                    <Button
                                        sx={{
                                            border: "1px #5052B2 solid",
                                            color: "#FFFFFF",
                                            backgroundColor: "#5052B2",
                                            textTransform: "none",
                                            height: "40px",
                                            fontFamily: "Nunito Sans",
                                            fontWeight: 600,
                                            fontSize: "14px",
                                            lineHeight: "19.6px",
                                            letterSpacing: "0%",
                                            "&:hover": {
                                                border: "1px #5052B2 solid",
                                                backgroundColor: "#5052B2",
                                            },
                                        }}
                                        variant="outlined"
                                        onClick={handleNext}
                                    >
                                        <Typography
                                            padding={"0.5rem 2rem"}
                                            fontSize={"0.8rem"}
                                        >
                                            Create lookalike
                                        </Typography>
                                    </Button>
                                </Box>
                            )}
                        </Box>

                        {currentStep >= 2 && (
                            <AudienceSizeSelector
                                audienceSize={audienceSize}
                                min={0}
                                max={20}
                                onSliderChange={handleSliderChange}
                                onSelectSize={handleSelectSize}
                                selectedSize={selectedSize}
                                sliderValue={sliderValue}
                            />
                        )}

                        {currentStep >= 3 && (
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    borderRadius: "6px",
                                    border: "1px solid #E4E4E4",
                                    backgroundColor: "white",
                                    padding: "24px 20px",
                                    mt: 2,
                                }}
                            >
                                <Typography
                                className="first-sub-title"
                                    variant="body1"
                                    sx={{
                                        fontWeight: "bold",
                                        fontSize: "19px",
                                        fontFamily: "Nunito Sans",
                                        letterSpacing: "0%",
                                        paddingRight: "20px",
                                        color: "#000000",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Create Name
                                </Typography>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="name"
                                    value={sourceName}
                                    onChange={handleInputChange}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "8px",
                                            paddingLeft: "8px",
                                            width: "300px",
                                            height: "40px",
                                            "@media (max-width: 1080px)": {
                                                width: "250px",
                                            },
                                            "@media (max-width: 600px)": {
                                                width: "100%",
                                            },
                                        },
                                        "& .MuiInputBase-input": {
                                            fontFamily: "Nunito Sans",
                                            fontWeight: 400,
                                            fontSize: "14px",
                                            lineHeight: "20px",
                                        },
                                    }}
                                />
                            </Box>
                        )}
                    </Box>
                    {currentStep >= 2 && (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "end",
                                gap: 2,
                                borderTop: "1px solid rgba(228, 228, 228, 1)",
                                mt: 2,
                                pr: 2,
                                pt: "0.5rem",
                            }}
                        >
                            <Button
                                sx={{
                                    border: "1px #5052B2 solid",
                                    color: "#5052B2",
                                    backgroundColor: "#FFFFFF",
                                    textTransform: "none",
                                    mt: 1,
                                    "&:hover": {
                                        border: "1px #5052B2 solid",
                                        backgroundColor: "#FFFFFF",
                                    },
                                }}
                                variant="outlined"
                                onClick={handleCancel}
                            >
                                <Typography
                                    padding={"0.5rem 2rem"}
                                    fontSize={"0.8rem"}
                                >
                                    Cancel
                                </Typography>
                            </Button>
                            <Button
                                sx={{
                                    border: "1px #5052B2 solid",
                                    color: "#FFFFFF",
                                    backgroundColor: "#5052B2",
                                    textTransform: "none",
                                    gap: 0,
                                    mt: 1,
                                    opacity: sourceName.trim() === "" ? 0.6 : 1,
                                    "&:hover": {
                                        border: "1px #5052B2 solid",
                                        backgroundColor: "#5052B2",
                                    },
                                    "&.Mui-disabled": {
                                        color: "#FFFFFF",
                                        border: "1px #5052B2 solid",
                                        backgroundColor: "#5052B2",
                                        opacity: 0.6,
                                    },
                                }}
                                variant="outlined"
                                disabled={sourceName.trim() === ""}
                                onClick={handleGenerateLookalike}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        padding: "0.5rem 1rem",
                                        gap: 1,
                                    }}
                                >
                                    <Image
                                        src={"/stars-icon.svg"}
                                        alt="Stars"
                                        width={15}
                                        height={15}
                                    />
                                    <Typography fontSize={"0.8rem"}>
                                        Generate lookalike
                                    </Typography>
                                </Box>
                            </Button>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default CreateLookalikePage;
