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
import CustomTooltip from "@/components/customToolTip";
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
import { FeatureImportanceTable, DragAndDropTable, AudienceFieldsSelector, OrderFieldsStep, CalculatedSteps } from "../components"
import { ResetProvider } from "@/context/ResetContext";
import { useHints } from "@/context/HintsContext";
import HintCard from "../../components/HintCard"; 
export const dynamic = 'force-dynamic';

interface HintCardInterface {
  description: string;
  title: string;
  linkToLoadMore: string;
}

const CreateLookalikePage: React.FC = () => {
  const router = useRouter();
  const { showHints, lookalikesBuilderHints, toggleLookalikesBuilderHintState } = useHints();
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

  const [dndFields, setDndFields] = useState<Field[]>([]);

  const hintCards: HintCardInterface[] = [
    {
     description:
     "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
     title: "Source",
     linkToLoadMore:
     "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
    {
     description:
     "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
     title: "Lookalike Size",
     linkToLoadMore:
       "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
    {
     description:
     "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
     title: "Predictable value",
     linkToLoadMore:
       "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
    {
     description:
     "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
     title: "Order vields",
     linkToLoadMore:
       "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
]

  // useEffect(() => {
  //   setDndFields(initialFields);
  // }, [initialFields]);

  const handleSelectRow = (row: any) => {
    setSelectedSourceId(row.id);
    setSelectSourceData([row]);
    setCurrentStep(1);
    closeDotHintClick(0)
    openDotHintClick(1)
  };

  const toggleDotHintClick = (id: number) => {
    toggleLookalikesBuilderHintState(id)
  };

  const closeDotHintClick = (id: number) => {
    toggleLookalikesBuilderHintState(id, false)
  };

  const openDotHintClick = (id: number) => {
    toggleLookalikesBuilderHintState(id, true)
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
        setCurrentStep(2);
        closeDotHintClick(1)
        openDotHintClick(2)
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

  const canProceed = true;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        // alignItems: 'center',
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 3 }}>
                  <Typography
                    variant="h1"
                    sx={{
                      fontFamily: "Nunito Sans",
                      fontWeight: 600,
                      fontSize: "16px",
                      lineHeight: "25.92px",
                      letterSpacing: "0%",
                      textAlign: "left",
                    }}
                  >
                    Create Lookalike
                  </Typography>
                  <CustomTooltip title={"The Settings menu allows you to customise your user experience, manage your account preferences, and adjust notifications."} linkText="Learn more" linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/settings" />
                </Box>

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
                        {showHints && lookalikesBuilderHints[0].show && (
                          <HintCard
                              card={hintCards[0]}
                              positionTop={90}
                              positionLeft={230}
                              toggleClick={() => toggleDotHintClick(0)}
                          />
                        )}
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
                                    sx={{ flex: 1.2, textAlign: "start" }}
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
                                {filteredData.map((row, index) => {
                                  const isDisabled =
                                    row.matched_records === 0 ||
                                    row.matched_records_status === "pending";
                                  return (
                                    <TableRow
                                      key={index}
                                      hover={!isDisabled}
                                      onClick={() => !isDisabled && handleSelectRow(row)}
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        width: "100%",
                                        opacity: isDisabled ? 0.5 : 1,
                                        pointerEvents: isDisabled ? "none" : "auto",
                                        cursor: isDisabled ? "not-allowed" : "pointer",
                                      }}
                                    >
                                      <TableCell
                                        sx={{ flex: 1.2, textAlign: "start" }}
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
                                  )
                                })}
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
                        borderColor: 'rgba(56, 152, 252, 1)',
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
                          color: 'rgba(56, 152, 252, 1)',
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: "Nunito Sans",
                          fontWeight: 500,
                          fontSize: "16px",
                          lineHeight: "22.5px",
                        }}
                      >
                        Select Audience Size
                      </Typography>
                      <CustomTooltip title={"Smart Audience Builder."} linkText="Learn more" linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/smart-audience-builder" />
                    </Box>
                    <AudienceSizeSelector
                      onSelectSize={handleSelectSize}
                      selectedSize={selectedSize}
                      hintCard={hintCards[1]}
                      toggleDotHintClickBlock1={() => toggleDotHintClick(1)}
                      isOpenSelect={lookalikesBuilderHints[1].show}
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
                        backgroundColor: "rgba(56, 152, 252, 1)",
                        width: "120px",
                        ":hover": {
                          backgroundColor: "rgba(56, 152, 252, 1)",
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

                {calculatedResults && currentStep >= 2 && (
                  <Box sx={{ mt: 2 }}>
                    <CalculatedSteps
                        calculatedResults={calculatedResults}
                        currentStep={currentStep}
                        handlePrevStep={handlePrevStep}
                        handleNextStep={handleNextStep}
                        hintCard2={hintCards[2]}
                        hintCard3={hintCards[3]}
                        toggleDotHintClickBlock2={() => toggleDotHintClick(2)}
                        toggleDotHintClickBlock3={() => toggleDotHintClick(3)}
                        isOpenSelect2={lookalikesBuilderHints[2].show}
                        isOpenSelect3={lookalikesBuilderHints[3].show}
                        onFieldsOrderChangeUp={setDndFields}
                      />
                  </Box>
                )}
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
                      border: "1px rgba(56, 152, 252, 1) solid",
                      color: "rgba(56, 152, 252, 1)",
                      backgroundColor: "#FFFFFF",
                      textTransform: "none",
                      mt: 1,
                      "&:hover": {
                        border: "1px rgba(56, 152, 252, 1) solid",
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
                      border: "1px rgba(56, 152, 252, 1) solid",
                      color: "#FFFFFF",
                      backgroundColor: "rgba(56, 152, 252, 1)",
                      textTransform: "none",
                      gap: 0,
                      mt: 1,
                      "&:hover": {
                        border: "1px rgba(56, 152, 252, 1) solid",
                        backgroundColor: "rgba(56, 152, 252, 1)",
                      },
                      "&.Mui-disabled": {
                        color: "#FFFFFF",
                        border: "1px rgba(56, 152, 252, 1) solid",
                        backgroundColor: "rgba(56, 152, 252, 1)",
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
                      border: "1px rgba(56, 152, 252, 1) solid",
                      color: "rgba(56, 152, 252, 1)",
                      backgroundColor: "#FFFFFF",
                      textTransform: "none",
                      mt: 1,
                      "&:hover": {
                        border: "1px rgba(56, 152, 252, 1) solid",
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
                      border: "1px rgba(56, 152, 252, 1) solid",
                      color: "#FFFFFF",
                      backgroundColor: "rgba(56, 152, 252, 1)",
                      textTransform: "none",
                      gap: 0,
                      mt: 1,
                      opacity: sourceName.trim() === "" ? 0.6 : 1,
                      "&:hover": {
                        border: "1px rgba(56, 152, 252, 1) solid",
                        backgroundColor: "rgba(56, 152, 252, 1)",
                      },
                      "&.Mui-disabled": {
                        color: "#FFFFFF",
                        border: "1px rgba(56, 152, 252, 1) solid",
                        backgroundColor: "rgba(56, 152, 252, 1)",
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
                    color: "rgba(56, 152, 252, 1) !important",
                    borderColor: "rgba(56, 152, 252, 1)",
                    "&:hover": {
                      backgroundColor: "#fff",
                      borderColor: "rgba(56, 152, 252, 1)",
                    },
                  }}
                >
                  All Lookalikes
                </Button>
                <Button
                  variant="contained"
                  onClick={() => router.push("/smart-audiences/builder")}
                  sx={{
                    backgroundColor: "rgba(56, 152, 252, 1)",
                    textTransform: "none",
                    padding: "10px 24px",
                    color: "#fff !important",
                    ":hover": { backgroundColor: "rgba(56, 152, 252, 1)" },
                    ":active": { backgroundColor: "rgba(56, 152, 252, 1)" },
                    ":disabled": {
                      backgroundColor: "rgba(56, 152, 252, 1)",
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
