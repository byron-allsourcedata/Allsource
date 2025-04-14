"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
} from "@mui/material";
import AudienceSizeSelector from "@/app/(client)/lookalikes/components/SizeSelector";
import SourceTableContainer from "@/app/(client)/lookalikes/components/SourceTableContainer";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import useAxios from "axios-hooks";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import { useRouter } from "next/navigation";
import LookalikeContainer from "../components/LookalikeContainer";

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

const CreateLookalikePage: React.FC = () => {
  const router = useRouter();
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [sliderValue, setSliderValue] = useState<number[]>([0, 0]);
  const [currentStep, setCurrentStep] = useState(0);
  const [sourceName, setSourceName] = useState("");
  const [sourceData, setSourceData] = useState<TableData[]>([]);
  const [selectSourceData, setSelectSourceData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLookalikeCreated, setIsLookalikeCreated] = useState(false);
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [lookalike, setLookalikeData] = useState<LookalikeData[]>([]);

  const handleSelectRow = (row: any) => {
    setSelectedSourceId(row.id);
    setSelectSourceData([row]);
    handleNext();
  };

  const getFilteredData = (data: any[]) => {
    return data.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  };

  const toSnakeCase = (str: string) => {
    return str
      .replace(/\s+/g, "_")
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .toLowerCase();
  };

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
    handleNext();
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
        "An error occurred while uploading the sources. Please try again later."
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

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
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

  const handleGenerateLookalike = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(
        "/audience-lookalikes/builder",
        {
          uuid_of_source: selectedSourceId,
          lookalike_size: toSnakeCase(selectedLabel),
          lookalike_name: sourceName,
        }
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSourceData();
  }, []);

  if (loading) {
    return <CustomizedProgressBar />;
  }

  const toNormalText = (sourceType: string) => {
    return sourceType
      .split(",")
      .map((item) =>
        item
          .split("_")
          .map((subItem) => subItem.charAt(0).toUpperCase() + subItem.slice(1))
          .join(" ")
      )
      .join(", ");
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
                {/* Title */}
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

                {/* Block with table Source */}

                {currentStep == 0 && (
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
                            setSearch(e.target.value), setIsTableVisible(true);
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
                                    className="black-table-data"
                                    sx={{ flex: 1, textAlign: "start" }}
                                  >
                                    Name
                                  </TableCell>
                                  <TableCell
                                    className="black-table-data"
                                    sx={{ flex: 1, textAlign: "start" }}
                                  >
                                    Type
                                  </TableCell>
                                  <TableCell
                                    className="black-table-data"
                                    sx={{ flex: 1, textAlign: "end" }}
                                  >
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
                                      className="black-table-header"
                                      sx={{ flex: 1, textAlign: "start" }}
                                    >
                                      {row.name}
                                    </TableCell>
                                    <TableCell
                                      className="black-table-header"
                                      sx={{ flex: 1, textAlign: "start" }}
                                    >
                                      {toNormalText(row.type)}
                                    </TableCell>
                                    <TableCell
                                      className="black-table-header"
                                      sx={{ flex: 1, textAlign: "right" }}
                                    >
                                      {row.matched_records.toLocaleString("en-US")}
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

                    {selectSourceData.length > 0 && (
                      <SourceTableContainer tableData={selectSourceData} />
                    )}
                  </Box>
                )}
                {currentStep >= 1 && (
                  <AudienceSizeSelector
                    onSelectSize={handleSelectSize}
                    selectedSize={selectedSize}
                  />
                )}

                {currentStep >= 2 && (
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
              {/* Title */}
              <Typography
                variant="h1"
                className="first-sub-title"
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

              {/* Block with table Lookalike */}
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
                  className="second-sub-title"
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
                  variant="contained" /* need chnage < on !== */
                  className="second-sub-title"
                  onClick={() => router.push("/smart-audiences/builder")}
                  sx={{
                    backgroundColor: "rgba(80, 82, 178, 1)",
                    textTransform: "none",
                    padding: "10px 24px",
                    color: "#fff !important",
                    ":hover": {
                      backgroundColor: "rgba(80, 82, 178, 1)",
                    },
                    ":active": {
                      backgroundColor: "rgba(80, 82, 178, 1)",
                    },
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
