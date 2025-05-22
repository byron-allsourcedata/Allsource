"use client";
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Link,
  TableContainer,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import React, { useState, useEffect, Suspense } from "react";
import CustomTooltip from "@/components/customToolTip";
import Image from "next/image";
import CustomToolTip from '@/components/customToolTip';
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useNotification } from "@/context/NotificationContext";
import { showErrorToast } from "@/components/ToastNotification";
import CircularProgress from "@mui/material/CircularProgress";
import FirstTimeScreen from "./FirstTimeScreen";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import NotificationBanner from "@/components/first-time-screens/NotificationWarningBanner";
import { CardsSection, FirstTimeScreenCommon } from "@/components/first-time-screens";

type TableData = {
  id: string;
  data_source_type: string;
  name: string;
  type: string;
  size: number;
  created_date: string;
};

type CardData = {
  title: string;
  description: string;
  icon: string;
  onClick?: () => void;
  isClickable?: boolean;
};

const Insights = () => {
  const router = useRouter();
  const { hasNotification } = useNotification();
  const [tabIndex, setTabIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [sourceData, setSourceData] = useState<TableData[]>([]);
  const [lookalikeData, setLookalikeData] = useState<TableData[]>([]);
  const [allData, setAllData] = useState<TableData[]>([]);
  const [filteredData, setFilteredData] = useState<TableData[]>([]);
  const [showNotification, setShowNotification] = useState(true);

  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex);
  };

  const cardData: CardData[] = [
    {
      title: "Sources Insights",
      description:
        "Analyze your audience sources to identify high-performing segments and optimize targeting strategies.",
      icon: "/source.svg",
      onClick: () => {
        router.push("/sources/builder?type=pixel");
      },
      isClickable: true,
    },
    {
      title: "Lookalikes Insights",
      description:
        "View the aggregated profile of your generated lookalike audience, showing different insights characteristics.",
      icon: "/lookalike.svg",
      onClick: () => {
        router.push("/sources/builder?type=customer-conversions");
      },
      isClickable: true,
    },
  ];

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

  const handleSelectRow = (row: any) => {
    router.push(`/insights/${row.data_source_type}/${row.id}`);
  };

  const handleSourceData = async () => {
    try {
      const response = await axiosInstance.get(
        "/audience-insights/get-data-sources"
      );

      const sources = Array.isArray(response.data.source)
        ? response.data.source
        : [response.data.source];
      const lookalikes = Array.isArray(response.data.lookalike)
        ? response.data.lookalike
        : [response.data.lookalike];

      const combined = [...sources, ...lookalikes];

      combined.sort(
        (a, b) =>
          new Date(b.created_date).getTime() -
          new Date(a.created_date).getTime()
      );

      setAllData(combined);
      setSourceData(sources);
      setLookalikeData(lookalikes);
    } catch {
      showErrorToast(
        "An error occurred while loading data sources. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/audience-insights/search-data-sources?query=${encodeURIComponent(
          query
        )}`
      );

      const sources = Array.isArray(response.data.source)
        ? response.data.source
        : [response.data.source];
      const lookalikes = Array.isArray(response.data.lookalike)
        ? response.data.lookalike
        : [response.data.lookalike];

      const combined = [...sources, ...lookalikes];
      combined.sort(
        (a, b) =>
          new Date(b.created_date).getTime() -
          new Date(a.created_date).getTime()
      );

      setFilteredData(combined);
    } catch {
      showErrorToast("Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const dataToShow = search.trim() ? filteredData : allData;

  useEffect(() => {
    handleSourceData();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (search.trim() !== "") {
        handleSearch(search);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  if (isLoading) {
    return <CustomizedProgressBar />;
  }

  return (
    <Box sx={{ width: "100%", pr: 3, flexGrow: 1, pt: 2 }}>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {sourceData.length > 0 || lookalikeData.length > 0 ? (
          <Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "15px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 1,
                  "@media (max-width: 900px)": {
                    paddingLeft: 1,
                  },
                }}
              >
                <Typography className="first-sub-title">Insights</Typography>
                <CustomToolTip title={'Insights.'} linkText='Learn more' linkUrl='https://allsourceio.zohodesk.com/portal/en/kb/articles/insights' />
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                pt: 2,
                mb: 1,
                width: "55%",
                "@media (max-width: 1100px)": {
                  width: "70%",
                },
                "@media (max-width: 900px)": {
                  width: "100%",
                  padding: 1,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "start",
                  gap: 1,
                }}
              >
                <Typography className="first-sub-title">
                  Select your Audience
                </Typography>
                <Typography className="paragraph">
                  Select a source or lookalike audience to uncover key
                  statistics, trends, and actionable data—helping you refine
                  your targeting and maximize results.
                </Typography>
              </Box>
              <Box>
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
                    <Box
                      sx={{
                        width: "100%",
                        border: "1px solid rgba(224, 224, 224, 1)",
                        borderRadius: 1,
                        padding: "5.5px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        backgroundColor: "#fff",
                        "&:hover": {
                          borderColor: "rgba(56, 152, 252, 1)",
                        },
                      }}
                      onClick={() => setIsTableVisible(!isTableVisible)}
                    >
                      <Typography
                        className="paragraph"
                        sx={{ fontSize: "14px !important" }}
                      >
                        Select source or lookalike
                      </Typography>

                      <IconButton size="small">
                        {isTableVisible ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                    </Box>

                    {isTableVisible && (
                      <Box sx={{ width: "100%" }}>
                        <Box
                          sx={{
                            padding: 2,
                            border: "1px solid rgba(228, 228, 228, 1)",
                          }}
                        >
                          <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search"
                            value={search}
                            onChange={(e) => {
                              setSearch(e.target.value);
                            }}
                            InputLabelProps={{
                              sx: {
                                fontFamily: "Nunito Sans",
                                fontSize: "15px",
                                lineHeight: "16px",
                                color: "rgba(17, 17, 19, 0.60)",

                                padding: 0,
                                margin: 0,
                                left: "3px",
                                "&.Mui-focused": {
                                  color: "#0000FF",
                                },
                              },
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchIcon />
                                </InputAdornment>
                              ),
                              endAdornment: loading && (
                                <InputAdornment position="end">
                                  <CircularProgress size={20} />
                                </InputAdornment>
                              ),
                              style: {
                                color: "rgba(17, 17, 19, 1)",
                                fontFamily: "Nunito Sans",
                                fontWeight: 400,
                                fontSize: "14px",
                              },
                            }}
                            sx={{
                              pb: "2px",
                              "& input::placeholder": {
                                fontSize: "14px",
                                color: "rgba(32, 33, 36, 1)",
                              },
                            }}
                          />
                        </Box>
                        <TableContainer
                          component={Paper}
                          sx={{ maxHeight: "35vh", overflow: "scroll" }}
                        >
                          <Table>
                            <TableBody>
                              {dataToShow.map((row, index) => {
                                const isRowDisabled = row.size === 0;
                                return (
                                  <TableRow
                                    key={index}
                                    hover={!isRowDisabled}
                                    sx={{
                                      cursor: isRowDisabled ? "not-allowed" : "pointer",
                                      opacity: isRowDisabled ? 0.5 : 1,
                                      pointerEvents: isRowDisabled ? "none" : "auto",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      width: "100%",
                                      padding: 0,
                                      margin: 0,
                                      flexWrap: "wrap",
                                    }}
                                    onClick={() => !isRowDisabled && handleSelectRow(row)}
                                  >
                                    {/* NAME & TYPE */}
                                    <TableCell
                                      sx={{
                                        flex: 1,
                                        minWidth: 280,
                                        padding: "12px 16px",
                                        borderBottom: "1px solid #e0e0e0",
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "flex-start",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <Typography className="paragraph">
                                          {row.data_source_type === "lookalikes"
                                            ? "Lookalike"
                                            : "Source"}
                                        </Typography>

                                        <Typography
                                          className="black-table-header"
                                          sx={{
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            width: "100%",
                                          }}
                                        >
                                          {row.name}
                                        </Typography>
                                      </Box>
                                    </TableCell>

                                    {/* TYPE */}
                                    <TableCell
                                      sx={{
                                        flex: 1,
                                        minWidth: 240,
                                        padding: "12px 16px",
                                        borderBottom: "1px solid #e0e0e0",
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "flex-start",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <Typography className="paragraph">
                                          Type
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          className="black-table-header"
                                          sx={{
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            width: "100%",
                                          }}
                                        >
                                          {toNormalText(row.type)}
                                        </Typography>
                                      </Box>
                                    </TableCell>

                                    {/* SIZE */}
                                    <TableCell
                                      sx={{
                                        flex: 1,
                                        minWidth: 120,
                                        padding: "12px 16px",
                                        borderBottom: "1px solid #e0e0e0",
                                        textAlign: "right",
                                        "@media (max-width: 600px)": {
                                          textAlign: "left",
                                        },
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "flex-start",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <Typography className="paragraph">
                                          Size
                                        </Typography>
                                        <Typography className="black-table-header">
                                          {row.size.toLocaleString("en-US")}
                                        </Typography>
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box>
            <FirstTimeScreenCommon
                  Header={{
                    TextTitle: 'Insights',
                    TextSubtitle: "Uncover key statistics, trends, and actionable data—it will help you refine your targeting and maximize results",
                    link: 'https://allsourceio.zohodesk.com/portal/en/kb/articles/data-sync',
                  }}
                  InfoNotification={{
                    Text: 'This page reveals powerful audience intelligence from your pixel data - discover top demographics, interests, behaviors, and purchase patterns to refine your targeting.',
                  }}
                  WarningNotification={{
                    condition: sourceData.length === 0 && lookalikeData.length === 0,
                    ctaUrl: '/sources',
                    ctaLabel: 'Import Source',
                    message: 'You need to have at least one source or lookalike to unlock this option '
                  }}
                  Content={<CardsSection items={[
                    {
                      title: 'Sources Insights',
                      subtitle: 'It will automatically collect visitor information from your website.',
                      imageSrc: '/source.svg',
                      onClick: () => router.push('/dashboard'),
                      showRecommended: true,
                    },
                    {
                      title: 'Lookalikes Insights',
                      subtitle: 'Otherwise, you can upload a CSV file containing your existing customer data.',
                      imageSrc: '/lookalike.svg',
                      onClick: () => router.push('/sources'),
                      showRecommended: false,
                    },
                  ]} />}
                  HelpCard={{
                    headline: 'Stuck with Your Dashboard?',
                    description: 'Book a free 30-minute call and get personalized help with platform navigation, analytics, or any dashboard issues.',
                    helpPoints: [
                      { title: 'Dashboard Walkthrough', description: 'Learn key features and shortcuts' },
                      { title: 'Data Analysis Help', description: 'Understand your metrics and reports' },
                      { title: 'Troubleshooting', description: 'Fix technical issues with an expert' },
                    ],
                  }}
                  customStyleSX={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "70%",
                    margin: "0 auto",
                    mt: 2
                  }}
                />
                {/* {popupOpen && (
                        <WelcomePopup open={popupOpen} onClose={() => setPopupOpen(false)} />
                      )} */}
            <FirstTimeScreen />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Insights;
