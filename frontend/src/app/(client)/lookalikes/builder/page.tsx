"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";

import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  InputAdornment,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AudienceSizeSelector from "@/app/(client)/lookalikes/components/SizeSelector";
import SourceTableContainer from "@/app/(client)/lookalikes/components/SourceTableContainer";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import LookalikeContainer from "../components/LookalikeContainer";
import { smartAudiences } from "../../smart-audiences/smartAudiences";
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import ProgressBar from "@/components/ProgressBar";
import { TableData, LookalikeData, CalculationResponse, FinancialResults, LifestylesResults, VoterResults, RealEstateResults, Field, FeatureObject, PersonalResults, ProfessionalProfileResults, EmploymentHistoryResults } from "@/types"
import { FeatureImportanceTable, DragAndDropTable, AudienceFieldsSelector, OrderFieldsStep } from "../components"
import { ResetProvider } from "@/context/ResetContext";
export const dynamic = 'force-dynamic';

const CreateLookalikePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedUuid = searchParams.get("source_uuid");
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  const [sourceName, setSourceName] = useState("");
  const [sourceData, setSourceData] = useState<TableData[]>([]);
  const [selectSourceData, setSelectSourceData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLookalikeCreated, setIsLookalikeCreated] = useState(false);
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [lookalike, setLookalikeData] = useState<LookalikeData[]>([]);
  const [calculatedResults, setCalculatedResults] =
    useState<CalculationResponse | null>(null);
    
  const [personalData,  setPersonalData]  = useState<PersonalResults>({} as PersonalResults);
  const [financialData,  setFinancialData]  = useState<FinancialResults>({} as FinancialResults);
  const [lifestylesData,setLifestylesData] = useState<LifestylesResults>({} as LifestylesResults);
  const [voterData,     setVoterData]      = useState<VoterResults>({} as VoterResults);
  const [professionalProfileData,     setProfessionalProfileData]      = useState<ProfessionalProfileResults>({} as ProfessionalProfileResults);
  const [employmentHistoryData,     setEmploymentHistoryData]      = useState<EmploymentHistoryResults>({} as EmploymentHistoryResults);

  const [personalKeys, setPersonalKeys] = useState<(keyof PersonalResults)[]>([]);
  const [financialKeys, setFinancialKeys] = useState<(keyof FinancialResults)[]>([]);
  const [lifestylesKeys, setLifestylesKeys] = useState<(keyof LifestylesResults)[]>([]);
  const [voterKeys, setVoterKeys] = useState<(keyof VoterResults)[]>([]);
  const [professionalProfileKeys,     setProfessionalProfileKeys]      = useState<(keyof ProfessionalProfileResults)[]>([]);
  const [employmentHistoryKeys,     setEmploymentHistoryKeys]      = useState<(keyof EmploymentHistoryResults)[]>([]);

  const [dndFields, setDndFields] = useState<Field[]>([]);
  const initialFields = useMemo<Field[]>(() => {
    const toFields = <T extends FeatureObject>(
      keys: (keyof T)[],
      src: T
    ): Field[] =>
      keys.map(k => ({
        id: String(k),
        name: String(k),
        value: `${src[k]}`,
      }));
  
    return [
      ...toFields(personalKeys, personalData),
      ...toFields(financialKeys, financialData),
      ...toFields(lifestylesKeys, lifestylesData),
      ...toFields(voterKeys, voterData),
      ...toFields(professionalProfileKeys, professionalProfileData),
      ...toFields(employmentHistoryKeys, employmentHistoryData),
    ];
  }, [
    personalKeys, financialKeys,
    lifestylesKeys, voterKeys, professionalProfileKeys, employmentHistoryKeys,
    calculatedResults, financialData,
    lifestylesData, voterData, professionalProfileData, employmentHistoryData
  ]);

  useEffect(() => {
    setDndFields(initialFields);
  }, [initialFields]);

  const handleSelectRow = (row: any) => {
    setSelectedSourceId(row.id);
    setSelectSourceData([row]);
    setCurrentStep(1);
  };

  const getFilteredData = (data: any[]) =>
    data.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );

  const toSnakeCase = (str: string) =>
    str
      .replace(/\s+/g, "_")
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .toLowerCase();

  const filteredData = getFilteredData(sourceData);

  const handleSelectSize = (
    id: string,
    min_value: number,
    max_value: number,
    label: string
  ) => {
    setSelectedSize(id);
    setSelectedLabel(label);
    setCalculatedResults(null);
    setCurrentStep(1);
  };

  const handleSourceData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/audience-lookalikes/get-sources`
      );
      if (response.data) {
        setSourceData(
          Array.isArray(response.data) ? response.data : [response.data]
        );
      }
    } catch {
      showErrorToast(
        "An error occurred while loading sources. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSourceName(event.target.value);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCalculate = async () => {
    if (selectSourceData[0]?.matched_records === 0) {
      showErrorToast("Cannot calculate lookalike because matched records is 0");
      return;
    }
    try {
      setLoading(true);
      const response = await axiosInstance.get<CalculationResponse>(
        `/audience-lookalikes/calculate-lookalikes?uuid_of_source=${selectedSourceId}&lookalike_size=${selectedSize}`
      );
      if (response.data) {
        setCalculatedResults(response.data);
        const b2c = response.data.audience_feature_importance_b2c;
        const b2b = response.data.audience_feature_importance_b2b;
        setPersonalData(b2c.personal  as any);
        setFinancialData(b2c.financial  as any);
        setLifestylesData(b2c.lifestyle as any);
        setVoterData(b2c.voter          as any);
        setProfessionalProfileData(b2b.professional_profile          as any);
        setEmploymentHistoryData(b2b.employment_history          as any);
        setPersonalKeys   (Object.keys(b2c.personal ) as (keyof PersonalResults)[]);
        setFinancialKeys  (Object.keys(b2c.financial) as (keyof FinancialResults)[]);
        setLifestylesKeys (Object.keys(b2c.lifestyle) as (keyof LifestylesResults)[]);
        setVoterKeys      (Object.keys(b2c.voter    ) as (keyof VoterResults)[]);
        setProfessionalProfileKeys (Object.keys(b2b.professional_profile ) as (keyof ProfessionalProfileResults)[]);
        setEmploymentHistoryKeys (Object.keys(b2b.employment_history ) as (keyof EmploymentHistoryResults)[]);
        setCurrentStep(2);
      }
    } catch {
      showErrorToast(
        "An error occurred while calculating lookalikes. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const createLookalikeData = async (data: any) => {
    const lookalikeData = selectSourceData.map((row) => ({
      id: data.lookalike.id,
      size_progress: data.lookalike.size_progress,
      size: data.lookalike.size,
      lookalike_name: sourceName,
      source: row.source,
      type: row.type,
      source_target_schema: row.target_schema,
      lookalike_size: selectedLabel,
      created_date: new Date().toISOString(),
      created_by: row.created_by,
    }));
    setLookalikeData(lookalikeData);
  };
  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  const handleGenerateLookalike = async () => {
    try {
      setLoading(true);
      const featureImportanceMap = Object.fromEntries(
        dndFields.map(({ id, value }) => [id, parseFloat(value)])
      );
      const requestData = {
        uuid_of_source: selectedSourceId,
        lookalike_size: toSnakeCase(selectedLabel),
        lookalike_name: sourceName,
        audience_feature_importance: featureImportanceMap,
      };
      if (!Object.prototype.hasOwnProperty.call(featureImportanceMap, 'zip_code5')) {
        featureImportanceMap['zip_code5'] = 0;
      }
      const response = await axiosInstance.post(
        "/audience-lookalikes/builder",
        requestData
      );
      if (response.data.status === "SUCCESS") {
        showToast("Lookalike was created successfully!");
        createLookalikeData(response.data);
        setIsLookalikeCreated(true);
      }
    } catch {
      showErrorToast(
        "An error occurred while creating a new lookalike. Please try again later."
      );
      setLookalikeData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSourceData();
  }, []);

  useEffect(() => {
    if (preselectedUuid && sourceData.length) {
      const match = sourceData.find((r) => r.id === preselectedUuid);
      if (match) {
        handleSelectRow(match);
      }
    }
  }, [preselectedUuid, sourceData]);

  const toNormalText = (sourceType: string) =>
    sourceType
      .split(",")
      .map((item) =>
        item
          .split("_")
          .map((subItem) => subItem.charAt(0).toUpperCase() + subItem.slice(1))
          .join(" ")
      )
      .join(", ");

  const handleEdit = () => {
    const params = new URLSearchParams(searchParams as ReadonlyURLSearchParams);
    params.delete("source_uuid");
    router.replace(`${window.location.pathname}?${params.toString()}`);
    setCurrentStep(0);
  };

  const canProceed = (personalKeys.length + financialKeys.length 
                 + lifestylesKeys.length + voterKeys.length + professionalProfileKeys.length 
                 + employmentHistoryKeys.length) >= 3;
  
  const handleFieldsOrderChange = (newOrder: Field[]) => {
    setDndFields(newOrder);
  };
  
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 4.25rem)",
        width: "100%",
        overflow: "auto",
      }}
    >
      {loading && (
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1200 }}>
          <CustomizedProgressBar />
        </Box>
      )}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          pt: 1,
          overflow: "auto",
        }}
      >
        {!isLookalikeCreated ? (
          <>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                width: "100%",
                overflow: "auto",
                flex: 1,
                pr: 2,
              }}
            >
              <Box sx={{ width: "100%", pt: 1, pl: 1, color: "#202124" }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: "Nunito Sans",
                    fontWeight: 600,
                    fontSize: "16px",
                    lineHeight: "25.92px",
                    letterSpacing: "0%",
                    marginBottom: 2,
                    textAlign: "left",
                  }}
                >
                  Create Lookalike
                </Typography>

                {/* "Choose your source" block */}
                {!preselectedUuid && currentStep === 0 && (
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
                      Choose your source
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        width: "100%",
                        flexDirection: "column",
                        pt: 2,
                        gap: 2,
                      }}
                    >
                      <Box sx={{ width: "100%" }}>
                        <TextField
                          fullWidth
                          variant="outlined"
                          placeholder="Source Search"
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            setIsTableVisible(true);
                          }}
                          onClick={() => setIsTableVisible(!isTableVisible)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <IconButton
                                onClick={() =>
                                  setIsTableVisible(!isTableVisible)
                                }
                              >
                                {isTableVisible ? (
                                  <ExpandLessIcon />
                                ) : (
                                  <ExpandMoreIcon />
                                )}
                              </IconButton>
                            ),
                          }}
                          sx={{
                            pb: "2px",
                            cursor: "pointer",
                            "& .MuiInputBase-input": {
                              cursor: "pointer",
                            },
                          }}
                        />
                        {isTableVisible && (
                          <TableContainer
                            component={Paper}
                            sx={{ maxHeight: "32vh" }}
                          >
                            <Table>
                              <TableHead>
                                <TableRow
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    width: "100%",
                                  }}
                                >
                                  <TableCell
                                    sx={{ flex: 1, textAlign: "start" }}
                                  >
                                    Name
                                  </TableCell>
                                  <TableCell
                                    sx={{ flex: 1, textAlign: "start" }}
                                  >
                                    Type
                                  </TableCell>
                                  <TableCell sx={{ flex: 1, textAlign: "end" }}>
                                    Size
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {filteredData.map((row, index) => (
                                  <TableRow
                                    key={index}
                                    hover
                                    sx={{
                                      cursor: "pointer",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      width: "100%",
                                    }}
                                    onClick={() => handleSelectRow(row)}
                                  >
                                    <TableCell
                                      sx={{ flex: 1, textAlign: "start" }}
                                    >
                                      {row.name}
                                    </TableCell>
                                    <TableCell
                                      sx={{ flex: 1, textAlign: "start" }}
                                    >
                                      {toNormalText(row.type)}
                                    </TableCell>
                                    <TableCell
                                      sx={{ flex: 1, textAlign: "right" }}
                                    >
                                      {row.matched_records.toLocaleString(
                                        "en-US"
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Display selected source block */}
                {currentStep >= 1 && (
                  <Box
                    sx={{
                      position: 'relative',
                      textAlign: 'left',
                      padding: '16px 20px 20px 20px',
                      borderRadius: '6px',
                      border: '1px solid #E4E4E4',
                      backgroundColor: 'white',
                      marginTop: 2,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: 'Nunito Sans',
                        fontWeight: 500,
                        fontSize: '16px',
                        lineHeight: '22.5px',
                        marginBottom: 2,
                      }}
                    >
                      Source
                    </Typography>

                    {selectSourceData.length > 0 && (
                      <SourceTableContainer tableData={selectSourceData} />
                    )}

                    <Button
                      onClick={handleEdit}
                      variant="outlined"
                      sx={{
                        ...smartAudiences.buttonform,
                        borderColor: 'rgba(80, 82, 178, 1)',
                        width: '92px',
                        mt: 2,
                        alignSelf: 'flex-end',
                        ':hover': {
                          backgroundColor: '#fff',
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          ...smartAudiences.textButton,
                          color: 'rgba(80, 82, 178, 1)',
                        }}
                      >
                        Edit
                      </Typography>
                    </Button>
                  </Box>
                )}

                {/* Audience size selector */}
                {currentStep >= 1 && (
                  <Box
                    sx={{
                      textAlign: "left",
                      padding: "16px 20px 20px 20px",
                      borderRadius: "6px",
                      border: "1px solid #E4E4E4",
                      backgroundColor: "white",
                      marginTop: 2,
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
                      Select Audience Size
                    </Typography>
                    <AudienceSizeSelector
                      onSelectSize={handleSelectSize}
                      selectedSize={selectedSize}
                    />
                  </Box>
                )}

                {/* Calculate button aligned to the right (content remains visible when clicked) */}
                {selectedSize && !calculatedResults && (
                  <Box
                    sx={{
                      marginTop: 2,
                      padding: "16px 20px",
                      backgroundColor: "white",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={handleCalculate}
                      sx={{
                        ...smartAudiences.buttonform,
                        backgroundColor: "rgba(80, 82, 178, 1)",
                        width: "120px",
                        ":hover": {
                          backgroundColor: "rgba(80, 82, 178, 1)",
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          ...smartAudiences.textButton,
                          color: "rgba(255,255,255,1)",
                        }}
                      >
                        Calculate
                      </Typography>
                    </Button>
                  </Box>
                ) 
                }
                
                {calculatedResults && (
                  <Box hidden={currentStep !== 2}>
                    <AudienceFieldsSelector
                      personalData={personalData}
                      financialData={financialData}
                      lifestylesData={lifestylesData}
                      voterData={voterData}
                      professionalProfileData={professionalProfileData}
                      employmentHistoryData={employmentHistoryData}
                      // realEstateData={realEstateData}
                      onPersonalChange={setPersonalKeys}
                      onFinancialChange={setFinancialKeys}
                      onLifestylesChange={setLifestylesKeys}
                      onVoterChange={setVoterKeys}
                      onProfessionalProfileChange={setProfessionalProfileKeys}
                      onEmploymentHistoryChange={setEmploymentHistoryKeys}
                      // onRealEstateChange={setRealEstateKeys}
                      handleNextStep={handleNextStep}
                      canProcessed={canProceed}
                    />
                  </Box>
                )}

                {/* Calculation results block rendered with flex layout */}
                <Box hidden={currentStep !== 3}>
                  <OrderFieldsStep
                    fields={dndFields}
                    handlePrevStep={handlePrevStep}
                    onOrderChange={handleFieldsOrderChange}
                  />
                </Box>

                {/* Create Name block (now visible since currentStep is set to 2 after calculation) */}
                {currentStep >= 3 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "6px",
                      border: "1px solid #E4E4E4",
                      backgroundColor: "white",
                      padding: "24px 20px",
                      mt: 1,
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "18px",
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
                          "@media (max-width: 1080px)": { width: "250px" },
                          "@media (max-width: 600px)": { width: "100%" },
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
              {currentStep == 2 && (
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "end",
                    alignItems: "end",
                    gap: 2,
                    borderTop: "1px solid rgba(228, 228, 228, 1)",
                    pr: 2,
                    pt: "0.5rem",
                    pb: 1,
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
                    onClick={handlePrevStep}
                  >
                    <Typography padding={"0.5rem 2rem"} fontSize={"0.8rem"}>
                      Go Back
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
                    disabled={!canProceed}
                    onClick={handleNextStep}
                  >
                    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "0.5rem 1rem", gap: 1 }}>
                      <Typography fontSize={"0.8rem"}>Continue</Typography>
                    </Box>
                  </Button>
                </Box>
              )}
              {currentStep >= 3 && (
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "end",
                    alignItems: "end",
                    gap: 2,
                    borderTop: "1px solid rgba(228, 228, 228, 1)",
                    pr: 2,
                    pt: "0.5rem",
                    pb: 1,
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
                    onClick={handlePrevStep}
                  >
                    <Typography padding={"0.5rem 2rem"} fontSize={"0.8rem"}>
                      Go Back
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
                        alt="Stars icon"
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
          </>
        ) : (
          <Box>
            <Box
              sx={{ width: "100%", padding: 3, pt: 1, pl: 1, color: "#202124" }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontFamily: "Nunito Sans",
                  fontWeight: 600,
                  fontSize: "17px !important",
                  lineHeight: "25.92px",
                  letterSpacing: "0%",
                  marginBottom: 2,
                  textAlign: "left",
                }}
              >
                Lookalikes
              </Typography>
              {lookalike.length > 0 ? (
                <LookalikeContainer tableData={lookalike} />
              ) : (
                <Typography>No Lookalike data available</Typography>
              )}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "end",
                  gap: 2,
                  mt: 1,
                  alignItems: "center",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => router.push("/lookalikes")}
                  sx={{
                    height: "40px",
                    borderRadius: "4px",
                    textTransform: "none",
                    fontSize: "14px",
                    lineHeight: "19.6px",
                    fontWeight: "500",
                    color: "#5052B2 !important",
                    borderColor: "#5052B2",
                    "&:hover": {
                      backgroundColor: "#fff",
                      borderColor: "#5052B2",
                    },
                  }}
                >
                  All Lookalikes
                </Button>
                <Button
                  variant="contained"
                  onClick={() => router.push("/smart-audiences/builder")}
                  sx={{
                    backgroundColor: "rgba(80, 82, 178, 1)",
                    textTransform: "none",
                    padding: "10px 24px",
                    color: "#fff !important",
                    ":hover": { backgroundColor: "rgba(80, 82, 178, 1)" },
                    ":active": { backgroundColor: "rgba(80, 82, 178, 1)" },
                    ":disabled": {
                      backgroundColor: "rgba(80, 82, 178, 1)",
                      opacity: 0.6,
                    },
                  }}
                >
                  Generate Smart Audience
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const CreateLookalike: React.FC = () => {
  return (
    <Suspense fallback={<ProgressBar />}>
      <ResetProvider>
        <CreateLookalikePage />
      </ResetProvider>
    </Suspense>
  );
};

export default CreateLookalike;
