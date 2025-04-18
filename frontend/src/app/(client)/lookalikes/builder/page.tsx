"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  InputAdornment,
  Paper,
  Popover,
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
import DeleteIcon from "@mui/icons-material/Delete";
import AudienceSizeSelector from "@/app/(client)/lookalikes/components/SizeSelector";
import SourceTableContainer from "@/app/(client)/lookalikes/components/SourceTableContainer";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import LookalikeContainer from "../components/LookalikeContainer";
import { smartAudiences } from "../../smart-audiences/smartAudiences";
import { lookalikesStyles } from "../components/lookalikeStyles";
import FeatureImportanceTable, {
  FeatureObject,
} from "../components/FeatureImportanceTable";
import DragAndDropTable, { Field } from "../components/DragAndDropTable";
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';

interface TableData {
  name: string;
  target_schema: string;
  source: string;
  type: string;
  source_target_schema: string;
  created_date: string;
  created_by: string;
  number_of_customers: number;
  matched_records: number;
}

interface LookalikeData {
  id: string;
  lookalike_name: string;
  source: string;
  type: string;
  size_progress: number;
  size: number;
  source_target_schema: string;
  lookalike_size: string;
  created_date: string;
  created_by: string;
}

interface CalculationResults {
  [key: string]: number;
  PersonExactAge: number;
  PersonGender: number;
  EstimatedHouseholdIncomeCode: number;
  EstimatedCurrentHomeValueCode: number;
  HomeownerStatus: number;
  HasChildren: number;
  NumberOfChildren: number;
  CreditRating: number;
  NetWorthCode: number;
  HasCreditCard: number;
  LengthOfResidenceYears: number;
  MaritalStatus: number;
  OccupationGroupCode: number;
  IsBookReader: number;
  IsOnlinePurchaser: number;
  IsTraveler: number;
  ZipCode5: number;
  ZipCode4: number;
  ZipCode3: number;
  state_name: number;
  state_city: number;
}

interface FinancialResults extends FeatureObject {
  [key: string]: number;
  CreditScore: number;
  IncomeRange: number;
  NetWorth: number;
  CreditRating: number;
  CreditCards: number;
  BankCard: number;
  CreditCardPremium: number;
  CreditCardNewIssue: number;
  CreditLines: number;
  CreditRangeOfNewCredit: number;
  Donor: number;
  Investor: number;
  MailOrderDonor: number;
}
interface LifestylesResults extends FeatureObject {
  [key: string]: number;
  Pets: number;
  CookingEnthusiast: number;
  Travel: number;
  MailOrderBuyer: number;
  OnlinePurchaser: number;
  BookReader: number;
  HealthAndBeauty: number;
  Fitness: number;
  OutdoorEnthusiast: number;
  TechEnthusiast: number;
  DIY: number;
  Gardening: number;
  AutomotiveBuff: number;
  GolfEnthusiasts: number;
  BeautyCosmetics: number;
  Smoker: number;
}
interface VoterResults extends FeatureObject {
  [key: string]: number;
  PartyAffiliation: number;
  VotingPropensity: number;
  CongressionalDistrict: number;
}
interface RealEstateResults extends FeatureObject {
  [key: string]: number;
  URN: number;
  SiteStreetAddress: number;
  SiteCity: number;
  SiteState: number;
  SiteZipCode: number;
  OwnerFullName: number;
  EstimatedHomeValue: number;
  HomeValueNumeric: number;
  Equity: number;
  EquityNumeric: number;
  MortgageAmount: number;
  MortgageDate: number;
  LenderName: number;
  PurchasePrice: number;
  PurchaseDate: number;
  OwnerOccupied: number;
  LandUseCode: number;
  YearBuilt: number;
  LotSizeSqFt: number;
  BuildingTotalSqFt: number;
  AssessedValue: number;
  MarketValue: number;
  TaxAmount: number;
}

interface CalculationResponse {
  count_matched_persons: number;
  audience_feature_importance: CalculationResults;
}

// Helper: clone and sort features array (descending order by value)
const sortFeatures = (
  features: [keyof CalculationResults, number][]
): [keyof CalculationResults, number][] => {
  return [...features].sort((a, b) => b[1] - a[1]);
};

const CreateLookalikePage: React.FC = () => {
  const router = useRouter();
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [sliderValue, setSliderValue] = useState<number[]>([0, 0]);
  // currentStep: 0 = choose source; 1 = select audience size; 2 = show name input & generate button.
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
  // States for calculated features: those displayed and those hidden.
  const [displayedFeatures, setDisplayedFeatures] = useState<
    [keyof CalculationResults, number][]
  >([]);
  const [hiddenFeatures, setHiddenFeatures] = useState<
    [keyof CalculationResults, number][]
  >([]);
  // State for the "Load More" popover anchor.
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // const [_, setFields] = useState<Field[]>([]);
  // formatCalcKey: removes underscores, adds spaces before uppercase letters,
  // collapses extra spaces, trims, and capitalizes the first letter.
  const formatCalcKey = (key: string) =>
    key
      .replace(/_/g, " ") // replace underscores with spaces
      .replace(/(?!^)([A-Z])/g, " $1") // insert space before uppercase letters (except first character)
      .replace(/\s+/g, " ") // collapse multiple spaces
      .trim() // trim spaces
      .replace(/^./, (char) => char.toUpperCase()); // capitalize first letter

  const [financialData, setFinancialData] = useState<FinancialResults>({
    IncomeRange: 0,
    NetWorth: 0,
    CreditRating: 0,
    CreditCards: 0,
    BankCard: 0,
    CreditCardPremium: 0,
    CreditCardNewIssue: 0,
    CreditLines: 0,
    CreditRangeOfNewCredit: 0,
    Donor: 0,
    Investor: 0,
    MailOrderDonor: 0,
    CreditScore: 0,
    DebtToIncomeRatio: 0,
    Income: 0,
  });

  const [lifestylesData, setLifestylesData] = useState<LifestylesResults>({
    Pets: 0,
    CookingEnthusiast: 0,
    Travel: 0,
    MailOrderBuyer: 0,
    OnlinePurchaser: 0,
    BookReader: 0,
    HealthAndBeauty: 0,
    Fitness: 0,
    OutdoorEnthusiast: 0,
    TechEnthusiast: 0,
    DIY: 0,
    Gardening: 0,
    AutomotiveBuff: 0,
    GolfEnthusiasts: 0,
    BeautyCosmetics: 0,
    Smoker: 0,
  });

  const [voterData, setVoterData] = useState<VoterResults>({
    PartyAffiliation: 0,
    VotingPropensity: 0,
    CongressionalDistrict: 0,
  });

  const [realEstateData, setRealEstateData] = useState<RealEstateResults>({
    URN: 0,
    SiteStreetAddress: 0,
    SiteCity: 0,
    SiteState: 0,
    SiteZipCode: 0,
    OwnerFullName: 0,
    EstimatedHomeValue: 0,
    HomeValueNumeric: 0,
    Equity: 0,
    EquityNumeric: 0,
    MortgageAmount: 0,
    MortgageDate: 0,
    LenderName: 0,
    PurchasePrice: 0,
    PurchaseDate: 0,
    OwnerOccupied: 0,
    LandUseCode: 0,
    YearBuilt: 0,
    LotSizeSqFt: 0,
    BuildingTotalSqFt: 0,
    AssessedValue: 0,
    MarketValue: 0,
    TaxAmount: 0,
  });

  const [personalKeys, setPersonalKeys] = useState<(keyof CalculationResults)[]>([]);
  const [financialKeys, setFinancialKeys] = useState<(keyof FinancialResults)[]>([]);
  const [lifestylesKeys, setLifestylesKeys] = useState<(keyof LifestylesResults)[]>([]);
  const [voterKeys, setVoterKeys] = useState<(keyof VoterResults)[]>([]);
  const [realEstateKeys, setRealEstateKeys] = useState<(keyof RealEstateResults)[]>([]);
  const computedFields = useMemo<Field[]>(() => {
    const toFields = <T extends FeatureObject>(keys: (keyof T)[], src: T) =>
      keys.map(k => ({
        id: String(k),
        name: String(k),
        value: `${(src[k] * 100).toFixed(1)}%`,
      }));

    const personalSrc = calculatedResults?.audience_feature_importance ?? {} as CalculationResults;

    return [
      ...toFields(personalKeys, personalSrc),
      ...toFields(financialKeys, financialData),
      ...toFields(lifestylesKeys, lifestylesData),
      ...toFields(voterKeys, voterData),
      ...toFields(realEstateKeys, realEstateData),
    ];
  }, [
    personalKeys,
    financialKeys,
    lifestylesKeys,
    voterKeys,
    realEstateKeys,
    calculatedResults,
    financialData,
    lifestylesData,
    voterData,
    realEstateData,
  ]);


  const [dndFields, setDndFields] = useState<Field[]>([]);

  useEffect(() => {
    setDndFields(computedFields);
  }, [computedFields]);

  // Returns sorted (descending) features from the given CalculationResults
  const getAllCalculatedEntries = (
    results: CalculationResults
  ): [keyof CalculationResults, number][] => {
    const order: (keyof CalculationResults)[] = [
      "PersonExactAge",
      "PersonGender",
      "EstimatedHouseholdIncomeCode",
      "EstimatedCurrentHomeValueCode",
      "HomeownerStatus",
      "HasChildren",
      "NumberOfChildren",
      "CreditRating",
      "NetWorthCode",
      "HasCreditCard",
      "LengthOfResidenceYears",
      "MaritalStatus",
      "OccupationGroupCode",
      "IsBookReader",
      "IsOnlinePurchaser",
      "IsTraveler",
      "ZipCode5",
      "ZipCode4",
      "ZipCode3",
      "state_name",
      "state_city",
    ];
    return order
      .map((key): [keyof CalculationResults, number] => [key, results[key]])
      .sort((a, b) => b[1] - a[1]); // sort descending by value
  };

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
    setSliderValue([min_value, max_value]);
    setCalculatedResults(null);
    setDisplayedFeatures([]);
    setHiddenFeatures([]);
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

  const handleCancel = () => {
    router.push("/sources");
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
      const response = await axiosInstance.get(
        `/audience-lookalikes/calculate-lookalikes?uuid_of_source=${selectedSourceId}&lookalike_size=${selectedSize}`
      );
      if (response.data) {
        setCalculatedResults(response.data);
        const allEntries = getAllCalculatedEntries(
          response.data.audience_feature_importance
        );
        const nonZeroEntries = allEntries.filter(([, value]) => value > 0);
        const zeroEntries = allEntries.filter(([, value]) => value === 0);
        setDisplayedFeatures(nonZeroEntries);
        setHiddenFeatures(zeroEntries);
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
      const requestData = {
        uuid_of_source: selectedSourceId,
        lookalike_size: toSnakeCase(selectedLabel),
        lookalike_name: sourceName,
        audience_feature_importance: Object.fromEntries(displayedFeatures),
      };
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

  // Delete a feature from the displayed list and add it to the hidden list.
  const handleDeleteFeature = (keyToDelete: keyof CalculationResults) => {
    setDisplayedFeatures((prev) =>
      sortFeatures(prev.filter(([key]) => key !== keyToDelete))
    );
    const deletedFeature = displayedFeatures.find(
      ([key]) => key === keyToDelete
    );
    if (deletedFeature) {
      setHiddenFeatures((prev) => sortFeatures([...prev, deletedFeature]));
    }
  };

  // Popover handlers for the "Load More" menu.
  const handleLoadMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  // When a feature is selected in the popover, move it to the displayed features
  const handleAddFeature = (feature: [keyof CalculationResults, number]) => {
    setDisplayedFeatures((prev) => sortFeatures([...prev, feature]));
    setHiddenFeatures((prev) =>
      sortFeatures(prev.filter((f) => f[0] !== feature[0]))
    );
    setAnchorEl(null);
  };

  const openPopover = Boolean(anchorEl);

  useEffect(() => {
    handleSourceData();
  }, []);

  if (loading) {
    return <CustomizedProgressBar />;
  }

  // Transform source type (similar to previous implementation)
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
                {currentStep === 0 && (
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
                          sx={{ pb: "2px" }}
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
                      Source
                    </Typography>
                    {selectSourceData.length > 0 && (
                      <SourceTableContainer tableData={selectSourceData} />
                    )}
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
                )}

                {/* Calculation results block rendered with flex layout */}
                {currentStep == 2 && calculatedResults && (
                  <Box
                    sx={{
                      border: "1px solid #E4E4E4",
                      borderRadius: "6px",
                      bgcolor: "white",
                      p: 2,
                      mt: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, ml: 1 }}>
                      {/* Шаг 1 всегда чёрный */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: 'Nunito Sans',
                          fontWeight: 500,
                          fontSize: '16px',
                          lineHeight: '22.5px',
                        }}
                      >
                        Step 1
                      </Typography>

                      {/* Стрелка побольше */}
                      <ArrowRightAltIcon
                        sx={{
                          fontSize: '28px',
                          color: "text.disabled",
                          mx: 1,
                          verticalAlign: 'middle',
                        }}
                      />
                      {/* Шаг 2 серый, если не выбран*/}
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: 'Nunito Sans',
                          fontWeight: 500,
                          fontSize: '16px',
                          lineHeight: '22.5px',
                          color: "text.disabled",
                        }}
                      >
                        Step 2
                      </Typography>
                    </Box>

                    <Grid container sx={{ mb: 2 }}>
                      <Grid item xs={7}>

                        <Typography
                          variant="h6"
                          sx={{
                            fontFamily: "Nunito Sans",
                            fontWeight: 500,
                            fontSize: "16px",
                            lineHeight: "22.5px",
                            mb: 1,
                            ml: 1,
                          }}
                        >
                          Select and order predictable fields
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: "14px",
                            color: "text.secondary",
                            mb: 1,
                            ml: 1,
                          }}
                        >
                          You can configure the predictable fields that will be used for audience building yourself.
                        </Typography>

                      </Grid>
                      <Grid item xs={5}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontFamily: "Nunito Sans",
                            fontWeight: 500,
                            fontSize: "16px",
                            lineHeight: "22.5px",
                            mb: 1,
                            ml: 1,
                          }}
                        >
                          How do Lookalikes work?
                        </Typography>
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      {/* Левая колонка — пять таблиц с чекбоксами */}
                      <Grid item xs={12} md={6} direction="column" spacing={2}>
                        <Grid item>
                          <FeatureImportanceTable
                            title="Personal Profile"
                            features={calculatedResults?.audience_feature_importance ?? {} as any}
                            onChangeDisplayed={setPersonalKeys}
                          />
                        </Grid>
                        <Grid item>
                          <FeatureImportanceTable
                            title="Financial"
                            features={financialData}
                            onChangeDisplayed={setFinancialKeys}
                          />
                        </Grid>
                        <Grid item>
                          <FeatureImportanceTable
                            title="Lifestyles"
                            features={lifestylesData}
                            onChangeDisplayed={setLifestylesKeys}
                          />
                        </Grid>
                        <Grid item>
                          <FeatureImportanceTable
                            title="Voter"
                            features={voterData}
                            onChangeDisplayed={setVoterKeys}
                          />
                        </Grid>
                        <Grid item >
                          <FeatureImportanceTable
                            title="Real Estate"
                            features={realEstateData}
                            onChangeDisplayed={setRealEstateKeys}
                          />
                        </Grid>
                      </Grid>
                      <Grid item xs={12} md={1}></Grid>
                      <Grid item xs={12} md={5} sx={{ borderLeft: "1px solid #E4E4E4" }}>
                        <Box sx={{ p: 0, bgcolor: "transparent" }}>
                          <Typography
                            variant="body2"
                            paragraph
                            sx={{
                              fontSize: "16px",
                              color: "text.secondary",
                              mb: 2,
                            }}
                          >
                            When building an audience, it&apos;s important to work with the right
                            data. You have the flexibility to configure which predictable
                            fields you want to use based on your specific goals. These fields
                            might include things like age, location, interests, purchase
                            behavior, or other relevant data points that help define your
                            audience more precisely.
                          </Typography>

                          <Typography
                            variant="body2"
                            paragraph
                            sx={{
                              fontSize: "16px",
                              color: "text.secondary",
                              mb: 2,
                            }}
                          >
                            To get started, simply click on &quot;Add More&quot; to open the full list
                            of available fields. From there, you can select the ones that are
                            most relevant to your campaign. The fields are usually organized
                            into categories (such as demographics, behavior, engagement,
                            etc.), so be sure to make selections within each category to
                            create a well-rounded profile of your audience.
                          </Typography>

                          <Typography
                            component="a"
                            href="#"
                            sx={{
                              fontSize: "16px",
                              color: 'rgba(80, 82, 178, 1)',
                              textDecoration: "underline",
                              cursor: "pointer",
                              display: "inline-block",
                            }}
                          >
                            Learn more
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Calculation results block rendered with flex layout */}
                {currentStep == 3 && (
                  <Box
                    sx={{
                      border: "1px solid #E4E4E4",
                      borderRadius: "6px",
                      bgcolor: "white",
                      p: 2,
                      mt: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, ml: 1 }}>
                      {/* Шаг 1 всегда чёрный */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: 'Nunito Sans',
                          fontWeight: 500,
                          fontSize: '16px',
                          lineHeight: '22.5px',
                          color: "text.disabled",
                        }}
                      >
                        Step 1
                      </Typography>

                      {/* Стрелка побольше */}
                      <ArrowRightAltIcon
                        sx={{
                          fontSize: '28px',
                          color: "text.disabled",
                          mx: 1,
                          verticalAlign: 'middle',
                        }}
                      />

                      {/* Шаг 2 серый, если не выбран*/}
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: 'Nunito Sans',
                          fontWeight: 500,
                          fontSize: '16px',
                          lineHeight: '22.5px',
                        }}
                      >
                        Step 2
                      </Typography>
                    </Box>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      {/* Заголовок + описание */}
                      <Grid item xs={7}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontFamily: 'Nunito Sans',
                            fontWeight: 500,
                            fontSize: '16px',
                            lineHeight: '22.5px',
                            mb: 1,
                            ml: 1,
                          }}
                        >
                          Select and order predictable fields
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '14px',
                            color: 'text.secondary',
                            mb: 1,
                            ml: 1,
                          }}
                        >
                          You can configure the predictable fields that will be used for audience building yourself.
                        </Typography>
                      </Grid>
                      {/* Правый заголовок */}
                      <Grid item xs={5}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontFamily: 'Nunito Sans',
                            fontWeight: 500,
                            fontSize: '16px',
                            lineHeight: '22.5px',
                            mb: 1,
                            ml: 1,
                          }}
                        >
                          How to order your fields?
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container spacing={2}>
                      {/* Левая колонка: все пять таблиц */}
                      <Grid item xs={12} md={6} direction="column" spacing={1}>
                        {/* Real Estate */}
                        <Grid item xs={12} md={6}>
                          <DragAndDropTable
                            fields={dndFields}
                            onOrderChange={(newOrder) => setDndFields(newOrder)}
                          />
                        </Grid>
                      </Grid>
                      <Grid item xs={12} md={1}></Grid>
                      {/* Правая колонка: инструктивный текст */}
                      <Grid
                        item
                        xs={12}
                        md={5}
                        sx={{ borderLeft: "1px solid #E4E4E4" }}
                      >
                        <Box sx={{ p: 0, bgcolor: "transparent" }}>
                          <Typography
                            variant="body2"
                            paragraph
                            sx={{
                              fontSize: "16px",
                              color: "text.secondary",
                              mb: 2,
                            }}
                          >
                            Once you&apos;ve selected the fields you want to work with, you&apos;ll move on to the next
                            step, where you can sort, prioritize, or filter these fields further. This step
                            allows you to fine-tune your audience structure, ensuring that you&apos;re targeting
                            the right group of people based on the criteria that matter most to you.
                          </Typography>

                          <Typography
                            variant="body2"
                            paragraph
                            sx={{
                              fontSize: "16px",
                              color: "text.secondary",
                              mb: 2,
                            }}
                          >
                            By customizing these fields and organizing them
                            effectively, you ca n build more accurate and
                            impactful audience segments for your marketing
                            efforts or research.
                          </Typography>

                          <Typography
                            component="a"
                            href="#"
                            sx={{
                              fontSize: "16px",
                              color: 'rgba(80, 82, 178, 1)',
                              textDecoration: "underline",
                              cursor: "pointer",
                              display: "inline-block",
                            }}
                          >
                            Learn more
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Create Name block (now visible since currentStep is set to 2 after calculation) */}
                {currentStep >= 4 && (
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
                    onClick={handleNextStep}
                  >
                    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "0.5rem 1rem", gap: 1 }}>
                      <Typography fontSize={"0.8rem"}>Continue</Typography>
                    </Box>
                  </Button>
                </Box>
              )}
              {currentStep == 3 && (
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
                    onClick={handleNextStep}
                  >
                    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "0.5rem 1rem", gap: 1 }}>
                      <Typography fontSize={"0.8rem"}>Continue</Typography>
                    </Box>
                  </Button>
                </Box>
              )}
              {currentStep >= 4 && (
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
                    onClick={handleCancel}
                  >
                    <Typography padding={"0.5rem 2rem"} fontSize={"0.8rem"}>
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

export default CreateLookalikePage;
