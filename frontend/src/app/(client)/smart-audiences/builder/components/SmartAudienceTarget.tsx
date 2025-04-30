"use client";
import {
  LinearProgress,
  Typography,
  TextField,
  Chip,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  SelectChangeEvent,
  ToggleButton,
  Slider,
  Tooltip,
  Skeleton,
} from "@mui/material";
import { Box } from "@mui/system";
import { smartAudiences } from "../../smartAudiences";
import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Image from "next/image";
import ExpandableFilter from "./ValidationFilters";
import { useRouter } from "next/navigation";
import CalculationPopup from "./CalculationPopup";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";

interface Recency {
  days: number;
}

interface EmailValidation {
  recency?: Recency;
  mx?: {};
  delivery?: {};
}

interface PhoneValidation {
  last_update_date?: {};
  confirmation?: {};
}

interface PostalValidation {
  cas_office_address?: {};
  cas_home_address?: {};
}

interface LinkedInValidation {
  job_validation?: {};
}

interface ValidationData {
  personal_email: EmailValidation[];
  business_email: EmailValidation[];
  phone: PhoneValidation[];
  postal_cas: PostalValidation[];
  linked_in: LinkedInValidation[];
}

interface SelectedData {
  includeExclude: string;
  sourceLookalike: string;
  selectedSource: string;
  selectedSourceId: string;
  useCase: string;
}

interface SmartAudienceTargetProps {
  useCaseType: string;
  sourceData: DataItem[];
  lookalikeData: DataItem[];
}

interface DataItem {
  id: string;
  name: string;
  type: string;
  size: string;
}

const toSnakeCase = (str: string) => {
  const exceptions: Record<string, string> = {
    LinkedIn: "linkedin",
  };

  if (exceptions[str]) {
    return exceptions[str];
  }

  return str
    .replace(/\s+/g, "_")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase();
};

const SmartAudiencesTarget: React.FC<SmartAudienceTargetProps> = ({
  useCaseType,
  sourceData,
  lookalikeData,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [audienceName, setAudienceName] = useState<string>("");
  const [option, setOption] = useState<string>("");
  const [sourceType, setSourceType] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [AudienceSize, setAudienceSize] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [selectedSources, setSelectedSources] = useState<SelectedData[]>([]);
  const [showTable, setShowTable] = useState(true);
  const [showForm, setShowForm] = useState(true);
  const [isTableVisible, setIsTableVisible] = useState(true);
  const [isValidate, setIsValidate] = useState(false);
  const [isValidateSkip, setIsValidateSkip] = useState(false);
  const [persentsData, setPersentsData] = useState<number>(0);
  const [validationFilters, setValidationFilters] =
    useState<ValidationData | null>();
  const [targetAudience, setTargetAudience] = useState<string | "">("");
  const [filteredSourceData, setFilteredSourceData] = useState<DataItem[]>([]);
  const [filteredLookalikeData, setFilteredLookalikeData] = useState<
    DataItem[]
  >([]);

  // Generate Active Segments
  const [value, setValue] = useState<number | null>(0);
  // const [maxValue, setMaxValue] = useState<number | null>(100000);
  const [numberToValidate, setNumberToValidate] = useState<number | null>(null);
  const [estimatedContacts, setEstimatedContacts] = useState<number>(0);
  const [availableCredits, setAvailableCredits] = useState<number | null>(60);
  const [validationCost, setValidationCost] = useState<number | null>(null);
  const [isCalculateActiveSegments, setIsCalculateActiveSegments] =
    useState(false);
  const [isValidateActiveSegments, setIsValidateActiveSegments] =
    useState(false);
  const [openConfirmValidatePopup, setOpenConfrimValidatePopup] =
    useState(false);

  const handleCalculateActiveSegments = (value: number) => {
    setNumberToValidate(value);
    setEstimatedContacts(value * persentsData);
    setValidationCost(10);
    setIsCalculateActiveSegments(true);
  };

  const handleOpenConfirmValidatePopup = () => {
    setOpenConfrimValidatePopup(true);
  };

  const handleConfirmValidatePopup = () => {
    setOpenConfrimValidatePopup(false);
    setIsValidateActiveSegments(true);
  };

  const formatNumber = (value: string) => {
    return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleInputNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let newValue = event.target.value.replace(/,/g, "");
    if (/^\d*$/.test(newValue)) {
      let numericValue = Number(newValue);
      if (AudienceSize) {
        if (numericValue <= AudienceSize) {
          setValue(numericValue);
        }
      }
    }
  };

  const handleTargetAudienceChange = (value: string) => {
    setTargetAudience(value);
    setValue(0);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAudienceName(event.target.value);
  };

  const handleSelectSourceType = (event: SelectChangeEvent<string>) => {
    setSourceType(event.target.value);
  };

  const handleSelectOption = (event: SelectChangeEvent<string>) => {
    setOption(event.target.value);
  };

  const getFilteredData = (data: any[]) => {
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) &&
        !selectedSources.some((source) => source.selectedSourceId === item.id)
    );
  };

  const handleOnSkip = () => {
    setIsValidate(true);
    setIsValidateSkip(true);
    setValidationFilters(null);
  };

  const handleOnEditValidation = () => {
    setIsValidate(false);
    setIsCalculateActiveSegments(false);
    setIsValidateActiveSegments(false);
    setIsValidateSkip(false);
  };

  const handleFilterValidation = (data: ValidationData) => {
    setIsValidate(true);
    setIsValidateSkip(false);
    setValidationFilters(data);
  };

  const handleEditActiveSegments = () => {
    setIsCalculateActiveSegments(false);
    setIsValidateActiveSegments(false);
  };

  const hasInclude = selectedSources.some(
    (source) => source.includeExclude === "include"
  );

  const handleSelectRow = (row: any) => {
    if (selectedSources.some((source) => source.selectedSourceId === row.id)) {
      return;
    }

    setShowTable(false);

    if (option && sourceType) {
      setSelectedSources([
        ...selectedSources,
        {
          includeExclude: option,
          sourceLookalike: sourceType,
          selectedSource: row.name,
          selectedSourceId: row.id,
          useCase: useCaseType,
        },
      ]);
      setOption("");
      setSourceType("");
      setShowTable(true);
      setShowForm(false);
    }
  };

  const handleDeleteChip = (id: string) => {
    setSelectedSources(
      selectedSources.filter((source) => source.selectedSourceId !== id)
    );
  };

  const handleAddMore = () => {
    setShowForm(true);
  };

  const groupedSources = selectedSources.reduce((acc, data) => {
    if (!acc[data.includeExclude]) {
      acc[data.includeExclude] = [];
    }
    acc[data.includeExclude].push({
      source: data.selectedSource,
      type: data.sourceLookalike,
      id: data.selectedSourceId,
    });
    return acc;
  }, {} as Record<string, { source: string; type: string; id: string }[]>);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "/audience-smarts/calculate",
        selectedSources
      );
      if (response.status === 200) {
        if (response.data == 0) {
          showErrorToast("The selected source/lookalike does not contain matched persons!");
          setAudienceSize(null);
        } else {
          setAudienceSize(response.data);
        }
      }
    } catch {
      showErrorToast("An error occurred while calculate a new Smart Audience");
    } finally {
      setLoading(false);
    }
  };

  const handleEditContacts = () => {
    setAudienceSize(null);
  };

  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    setValue(newValue as number);
  };

  const handleGenerateSmartAudience = async () => {
    try {
      setLoading(true);
      const requestData = {
        use_case: toSnakeCase(useCaseType),
        target_schema: targetAudience,
        data_sources: selectedSources,
        validation_params: validationFilters,
        contacts_to_validate: isValidateSkip ? null : value,
        is_validate_skip: isValidateSkip,
        smart_audience_name: audienceName,
        active_segment_records: value,
        total_records: AudienceSize,
      };

      const filteredRequestData = Object.fromEntries(
        Object.entries(requestData).filter(
          ([_, v]) => v !== null && v !== undefined
        )
      );

      const response = await axiosInstance.post(
        "/audience-smarts/builder",
        filteredRequestData
      );
      if (response.status === 200) {
        showToast("New Smart Audience successfully created");
        const dataString = encodeURIComponent(JSON.stringify(response.data));
        router.push(
          `/smart-audiences/smart-audience-created?data=${dataString}`
        );
      }
    } catch {
      showErrorToast("An error occurred while creating a new Smart Audience");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sourceType === "Source") {
      setFilteredSourceData(getFilteredData(sourceData));
    } else if (sourceType === "Lookalike") {
      setFilteredLookalikeData(getFilteredData(lookalikeData));
    }
  }, [sourceType, sourceData, lookalikeData, selectedSources]);

  return (
    <Box sx={{ mb: 4 }}>
      {loading && <CustomizedProgressBar />}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minWidth: "100%",
          flexGrow: 1,
          position: "relative",
          flexWrap: "wrap",
          border: "1px solid rgba(228, 228, 228, 1)",
          borderRadius: "6px",
          padding: "20px",
          mt: 2,
        }}
      >
        {uploadProgress !== null && (
          <Box
            sx={{
              width: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 1200,
            }}
          >
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{
                borderRadius: "6px",
                backgroundColor: "#c6dafc",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 5,
                  backgroundColor: "#4285f4",
                },
              }}
            />
          </Box>
        )}
        <Box
          sx={{
            display: "flex",
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography
              sx={{
                fontFamily: "Nunito Sans",
                fontSize: "16px",
                fontWeight: 500,
              }}
            >
              Select your Target Type
            </Typography>
            <Typography
              sx={{
                fontFamily: "Roboto",
                fontSize: "12px",
                color: "rgba(95, 99, 104, 1)",
              }}
            >
              Choose what you would like to use it for.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
          {["B2B", "B2C", "Both"].map((option) => (
            <ToggleButton
              key={option}
              value={option}
              selected={targetAudience === option}
              className="form-input-label"
              onClick={() => handleTargetAudienceChange(option)}
              sx={{
                textTransform: "none",
                border:
                  targetAudience === option
                    ? "1px solid rgba(117, 168, 218, 1)"
                    : "1px solid #ccc",
                color: "rgba(32, 33, 36, 1)",
                backgroundColor:
                  targetAudience === option
                    ? "rgba(246, 248, 250, 1) !important"
                    : "rgba(255, 255, 255, 1) !important",
                borderRadius: "4px",
                padding: "8px 12px",
                "&:hover": {
                  backgroundColor: "rgba(117, 168, 218, 0.2)",
                },
              }}
            >
              {option}
            </ToggleButton>
          ))}
        </Box>
      </Box>

      {/* Select your Contacts */}
      {targetAudience && useCaseType !== null && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: "100%",
            flexGrow: 1,
            position: "relative",
            flexWrap: "wrap",
            border: "1px solid rgba(228, 228, 228, 1)",
            borderRadius: "6px",
            padding: "20px",
            mt: 2,
          }}
        >
          {uploadProgress !== null && (
            <Box
              sx={{
                width: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 1200,
              }}
            >
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{
                  borderRadius: "6px",
                  backgroundColor: "#c6dafc",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 5,
                    backgroundColor: "#4285f4",
                  },
                }}
              />
            </Box>
          )}
          <Box
            sx={{
              display: "flex",
              width: "100%",
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography
                sx={{
                  fontFamily: "Nunito Sans",
                  fontSize: "16px",
                  fontWeight: 500,
                }}
              >
                Select your Contacts
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Roboto",
                  fontSize: "12px",
                  color: "rgba(95, 99, 104, 1)",
                }}
              >
                Choose what data sources you want to use.
              </Typography>
            </Box>

            {AudienceSize && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Typography
                  className="table-data"
                  sx={{
                    color: "rgba(32, 33, 36, 1) !important",
                    fontSize: "14px !important",
                  }}
                >
                  Size
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  margin="none"
                  variant="outlined"
                  value={formatNumber(
                    AudienceSize ? AudienceSize.toString() : "0"
                  )}
                  disabled
                  sx={{
                    maxHeight: "40px",
                    width: "120px",
                    "& .MuiInputBase-root": {
                      height: "40px",
                    },
                    "& .MuiOutlinedInput-input": {
                      padding: "8px 16px",
                    },
                    "& .MuiOutlinedInput-input.Mui-disabled": {
                      color: "rgba(33, 33, 33, 1)",
                      WebkitTextFillColor: "rgba(33, 33, 33, 1)",
                    },
                  }}
                />
              </Box>
            )}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "end",
                justifyContent: "space-between",
              }}
            >
              <Box>
                {Object.entries(groupedSources).map(([key, values]) => (
                  <Box
                    key={key}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Roboto",
                        fontWeight: "400",
                        fontSize: "14px",
                        color: "#202124",
                      }}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {values.map(({ source, type, id }, index) => (
                        <Chip
                          key={index}
                          label={`${type} - ${source}`}
                          deleteIcon={
                            !AudienceSize ? (
                              <CloseIcon
                                sx={{
                                  color: "rgba(32, 33, 36, 1) !important",
                                  fontSize: "16px !important",
                                }}
                              />
                            ) : undefined
                          }
                          sx={{
                            border: "1px solid #90A4AE",
                            backgroundColor: "#ffffff",
                            borderRadius: "4px",
                            "& .MuiChip-label": {
                              fontSize: "12px",
                              fontFamily: "Nunito Sans",
                              fontWeight: "500",
                            },
                          }}
                          onDelete={
                            !AudienceSize
                              ? () => handleDeleteChip(id)
                              : undefined
                          }
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>

              {AudienceSize && (
                <Button
                  onClick={handleEditContacts}
                  variant="outlined"
                  sx={{
                    ...smartAudiences.buttonform,
                    borderColor: "rgba(80, 82, 178, 1)",
                    width: "120px",
                    ":hover": {
                      backgroundColor: "#fff",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      ...smartAudiences.textButton,
                      color: "rgba(80, 82, 178, 1)",
                    }}
                  >
                    Edit
                  </Typography>
                </Button>
              )}
            </Box>

            {(showForm || selectedSources.length === 0) && (
              <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
                <FormControl variant="outlined">
                  <Select
                    value={option}
                    onChange={handleSelectOption}
                    displayEmpty
                    sx={{
                      ...smartAudiences.text,
                      width: "316px",
                      borderRadius: "4px",
                      pt: 0,
                    }}
                  >
                    <MenuItem value="" disabled sx={{ display: "none", mt: 0 }}>
                      Select an option
                    </MenuItem>
                    <MenuItem className="second-sub-title" value={"include"}>
                      Include
                    </MenuItem>
                    <MenuItem
                      className="second-sub-title"
                      value={"exclude"}
                      disabled={!hasInclude}
                    >
                      Exclude
                    </MenuItem>
                  </Select>
                </FormControl>

                {option && (
                  <FormControl variant="outlined">
                    <Select
                      value={sourceType}
                      onChange={handleSelectSourceType}
                      displayEmpty
                      sx={{
                        ...smartAudiences.text,
                        width: "316px",
                        borderRadius: "4px",
                        pt: 0,
                      }}
                    >
                      <MenuItem
                        value=""
                        disabled
                        sx={{ display: "none", mt: 0 }}
                      >
                        Select audience source
                      </MenuItem>
                      <MenuItem className="second-sub-title" value={"Source"}>
                        Source
                      </MenuItem>
                      <MenuItem
                        className="second-sub-title"
                        value={"Lookalike"}
                      >
                        Lookalike
                      </MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Box>
            )}

            {option && sourceType && showTable && (
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  flexDirection: "column",
                  pt: 2,
                  gap: 2,
                }}
              >
                <Typography>Choose your {sourceType}</Typography>
                <Box sx={{ width: "100%" }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Source Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <IconButton
                          onClick={() => setIsTableVisible(!isTableVisible)}
                        >
                          {isTableVisible ? (
                            <ExpandMoreIcon />
                          ) : (
                            <ExpandLessIcon />
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
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell className="black-table-data">
                              Name
                            </TableCell>
                            <TableCell className="black-table-data">
                              Type
                            </TableCell>
                            <TableCell className="black-table-data">
                              Size
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(sourceType === "Source"
                            ? filteredSourceData
                            : filteredLookalikeData
                          ).map((row) => (
                            <TableRow
                              key={row.id}
                              hover
                              sx={{ cursor: "pointer" }}
                              onClick={() => handleSelectRow(row)}
                            >
                              <TableCell className="black-table-header">
                                {row.name}
                              </TableCell>
                              <TableCell className="black-table-header">
                                {row.type}
                              </TableCell>
                              <TableCell className="black-table-header">
                                {row.size}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Box>
            )}

            {!showForm && selectedSources.length !== 0 && !AudienceSize && (
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  alignItems: "self-start",
                }}
              >
                <Button
                  onClick={handleAddMore}
                  variant="text"
                  className="second-sub-title"
                  sx={{
                    textTransform: "none",
                    textDecoration: "underline",
                    color: "rgba(80, 82, 178, 1) !important",
                  }}
                >
                  + Add more
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      )}
      {!showForm && selectedSources.length !== 0 && !AudienceSize && (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            mt: 2,
            justifyContent: "flex-end",
            borderRadius: "6px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Button
              onClick={() => router.push("/smart-audiences")}
              variant="outlined"
              sx={{
                ...smartAudiences.buttonform,
                borderColor: "rgba(80, 82, 178, 1)",
                width: "92px",
              }}
            >
              <Typography
                sx={{
                  ...smartAudiences.textButton,
                  color: "rgba(80, 82, 178, 1)",
                }}
              >
                Cancel
              </Typography>
            </Button>
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
                  color: "rgba(255, 255, 255, 1)",
                }}
              >
                Calculate
              </Typography>
            </Button>
          </Box>
        </Box>
      )}

      {/* VALIDATION*/}
      {AudienceSize && (
        <ExpandableFilter
          targetAudience={targetAudience}
          useCaseType={useCaseType}
          onSkip={handleOnSkip}
          onValidate={handleFilterValidation}
          onEdit={handleOnEditValidation}
          setPersentsData={setPersentsData}
        />
      )}

      {/* GENERATE ACTIVE SEGMENTS */}
      {AudienceSize && isValidate && !isValidateSkip && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: "100%",
            flexGrow: 1,
            position: "relative",
            flexWrap: "wrap",
            border: "1px solid rgba(228, 228, 228, 1)",
            borderRadius: "6px",
            padding: "20px",
            mt: 2,
          }}
        >
          {uploadProgress !== null && (
            <Box
              sx={{
                width: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 1200,
              }}
            >
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{
                  borderRadius: "6px",
                  backgroundColor: "#c6dafc",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 5,
                    backgroundColor: "#4285f4",
                  },
                }}
              />
            </Box>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography
              sx={{
                fontFamily: "Nunito Sans",
                fontSize: "16px",
                fontWeight: 500,
              }}
            >
              Generate Active Segments
            </Typography>
            <Typography
              sx={{
                fontFamily: "Roboto",
                fontSize: "12px",
                color: "rgba(95, 99, 104, 1)",
              }}
            >
              Manage your audience segments for validation.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography
              sx={{
                fontFamily: "Nunito Sans",
                fontSize: "16px",
                fontWeight: 500,
              }}
            >
              Total Audience Size
            </Typography>
            <Typography
              sx={{
                fontFamily: "Roboto",
                fontSize: "12px",
                color: "rgba(95, 99, 104, 1)",
              }}
            >
              This is your total available audience for validation.
            </Typography>
          </Box>
          <Typography>
            {formatNumber(AudienceSize ? AudienceSize.toString() : "0")}
          </Typography>

          {!isCalculateActiveSegments ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography
                sx={{
                  fontFamily: "Nunito Sans",
                  fontSize: "16px",
                  fontWeight: 500,
                  pt: 1,
                }}
              >
                How many contacts do you want to validate?
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Roboto",
                  fontSize: "12px",
                  color: "rgba(95, 99, 104, 1)",
                  pb: 1,
                }}
              >
                Enter the number of users you want to validate. The cost will be
                calculated automatically.
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    value={value}
                    type="number"
                    variant="outlined"
                    onChange={handleInputNumberChange}
                    inputProps={{ max: AudienceSize }}
                    InputLabelProps={{
                      sx: { fontFamily: "Nunito Sans", pl: "2px" },
                    }}
                    sx={smartAudiences.inputStyle}
                  />

                  <Slider
                    value={value ? value : 0}
                    onChange={handleSliderChange}
                    min={0}
                    max={AudienceSize ? AudienceSize : 0}
                    sx={{
                      color:
                        value === 0
                          ? "rgba(231, 231, 231, 1)"
                          : "rgba(80, 82, 178, 1)",
                      maxWidth: "280px",
                      "& .MuiSlider-track": {
                        backgroundColor: "rgba(80, 82, 178, 1)",
                      },
                      "& .MuiSlider-thumb": {
                        backgroundColor: "rgba(80, 82, 178, 1)",
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                width: "70%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "stretch",
                  gap: 6,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography className="form-input">
                    Number of Users to Validate
                  </Typography>
                  <Typography>
                    {formatNumber(
                      numberToValidate ? numberToValidate.toString() : "0"
                    )}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1, textAlign: "left" }}>
                  <Typography className="form-input">
                    Available Credits
                  </Typography>
                  <Typography>{availableCredits} Credits</Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "stretch",
                  gap: 6,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{ display: "flex", gap: 0.5, alignItems: "center" }}
                    className="form-input"
                  >
                    Estimated contacts after validation
                    <Tooltip
                      sx={{ "@media (max-width: 600px)": { display: "none" } }}
                      title={
                        <Box
                          sx={{
                            backgroundColor: "#fff",
                            padding: 0,
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            className="table-data"
                            sx={{ fontSize: "12px !important" }}
                          >
                            This is an estimated number based on our historical
                            data. The exact number will be available only after
                            validation.
                          </Typography>
                        </Box>
                      }
                      componentsProps={{
                        tooltip: {
                          sx: {
                            backgroundColor: "#fff",
                            color: "#000",
                            boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.12)",
                            border: ".2px solid rgba(255, 255, 255, 1)",
                            borderRadius: "4px",
                            maxHeight: "100%",
                            maxWidth: "21.5rem",
                            minWidth: "200px",
                            padding: ".625rem",
                          },
                        },
                      }}
                      placement="right"
                    >
                      <Image
                        src="/info-icon.svg"
                        alt="info-icon"
                        height={13}
                        width={13}
                      />
                    </Tooltip>
                  </Typography>
                  <Typography>
                    {Math.trunc(estimatedContacts).toLocaleString('en-US')}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1, textAlign: "left" }}>
                  <Typography className="form-input">
                    Validation Cost
                  </Typography>
                  <Typography>{validationCost} Credits</Typography>
                  {typeof availableCredits === "number" &&
                  typeof validationCost === "number" ? (
                    availableCredits >= validationCost ? (
                      <Typography
                        className="form-input"
                        sx={{
                          color: "rgba(74, 158, 79, 1) !important",
                          fontSize: "12px !important",
                          mb: 1,
                        }}
                      >
                        ✓ You have enough credits to proceed.
                      </Typography>
                    ) : (
                      <Typography
                        className="form-input"
                        sx={{
                          color: "rgba(205, 40, 43, 1) !important",
                          fontSize: "12px !important",
                          mb: 1,
                        }}
                      >
                        ✗ You need {validationCost - availableCredits} more
                        credits to proceed.
                      </Typography>
                    )
                  ) : null}
                </Box>
              </Box>
            </Box>
          )}

          {isCalculateActiveSegments && (
            <Box sx={{ width: "100%", display: "flex", justifyContent: "end" }}>
              <Button
                onClick={handleEditActiveSegments}
                variant="outlined"
                sx={{
                  ...smartAudiences.buttonform,
                  borderColor: "rgba(80, 82, 178, 1)",
                  width: "120px",
                  ":hover": {
                    backgroundColor: "#fff",
                  },
                }}
              >
                <Typography
                  sx={{
                    ...smartAudiences.textButton,
                    color: "rgba(80, 82, 178, 1)",
                  }}
                >
                  Edit
                </Typography>
              </Button>
            </Box>
          )}
        </Box>
      )}

      {AudienceSize &&
        isValidate &&
        !isCalculateActiveSegments &&
        !isValidateSkip && (
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              mt: 2,
              justifyContent: "flex-end",
              borderRadius: "6px",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Button
                onClick={() => router.push("/smart-audiences")}
                variant="outlined"
                sx={{
                  ...smartAudiences.buttonform,
                  borderColor: "rgba(80, 82, 178, 1)",
                  width: "92px",
                }}
              >
                <Typography
                  sx={{
                    ...smartAudiences.textButton,
                    color: "rgba(80, 82, 178, 1)",
                  }}
                >
                  Cancel
                </Typography>
              </Button>
              <Button
                disabled={value === 0 ? true : false}
                variant="contained"
                onClick={() => handleCalculateActiveSegments(value ?? 0)}
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
                    color: "rgba(255, 255, 255, 1)",
                  }}
                >
                  Calculate
                </Typography>
              </Button>
            </Box>
          </Box>
        )}

      {AudienceSize &&
        isValidate &&
        isCalculateActiveSegments &&
        !isValidateActiveSegments && (
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              mt: 2,
              justifyContent: "flex-end",
              borderRadius: "6px",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Button
                onClick={() => router.push("/smart-audiences")}
                variant="outlined"
                sx={{
                  ...smartAudiences.buttonform,
                  borderColor: "rgba(80, 82, 178, 1)",
                  width: "92px",
                }}
              >
                <Typography
                  sx={{
                    ...smartAudiences.textButton,
                    color: "rgba(80, 82, 178, 1)",
                  }}
                >
                  Cancel
                </Typography>
              </Button>
              <Button
                variant="contained"
                onClick={handleOpenConfirmValidatePopup}
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
                    color: "rgba(255, 255, 255, 1)",
                  }}
                >
                  Validate
                </Typography>
              </Button>
            </Box>
          </Box>
        )}

      {(isValidateActiveSegments || isValidateSkip) && AudienceSize && (
        <Box>
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
              Name
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Enter Audience name"
              value={audienceName}
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
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              mt: 2,
              justifyContent: "flex-end",
              borderRadius: "6px",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Button
                onClick={() => router.push("/smart-audiences")}
                variant="outlined"
                sx={{
                  ...smartAudiences.buttonform,
                  borderColor: "rgba(80, 82, 178, 1)",
                  width: "92px",
                }}
              >
                <Typography
                  sx={{
                    ...smartAudiences.textButton,
                    color: "rgba(80, 82, 178, 1)",
                  }}
                >
                  Cancel
                </Typography>
              </Button>
              <Button
                disabled={audienceName.trim() == "" ? true : false}
                variant="contained"
                onClick={handleGenerateSmartAudience}
                sx={{
                  ...smartAudiences.buttonform,
                  backgroundColor: "rgba(80, 82, 178, 1)",
                  width: "237px",
                  ":hover": {
                    backgroundColor: "rgba(80, 82, 178, 1)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "0.5rem 0.25rem",
                    gap: 1,
                  }}
                >
                  <Image
                    src={"/stars-icon.svg"}
                    alt="Stars icon"
                    width={15}
                    height={15}
                  />
                  <Typography
                    sx={{
                      ...smartAudiences.textButton,
                      color: "rgba(255, 255, 255, 1)",
                    }}
                  >
                    Generate Smart Audience
                  </Typography>
                </Box>
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      <CalculationPopup
        open={openConfirmValidatePopup}
        onClose={() => setOpenConfrimValidatePopup(false)}
        onCancel={() => setOpenConfrimValidatePopup(false)}
        onConfirm={handleConfirmValidatePopup}
        CalculationData={{
          validationCost: validationCost ?? 0,
          availableCredits: availableCredits ?? 0,
        }}
      />
    </Box>
  );
};

export default SmartAudiencesTarget;
