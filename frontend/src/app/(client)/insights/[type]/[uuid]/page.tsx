"use client";
import { Box, Typography, Tabs, Tab, IconButton } from "@mui/material";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";
import { insightsStyle } from "./insightsStyles";
import { useNotification } from "@/context/NotificationContext";
import { dashboardStyles } from "../../../dashboard/dashboardStyles";
import { TabPanel } from "@/components/TabPanel";
import StaticticsTab from "./components/StaticticsTab";
import CustomTooltip from "@/components/customToolTip";
import PredictableFields from "./components/PredictableFields";
import { AudienceInsightsStatisticsResponse, B2BData, B2CData, FieldRankMap, SignificantFields } from "@/types/insights";
import { useInsightsHints } from "../../context/IntegrationsHintsContext";
import HintCard from "@/app/(client)/components/HintCard";

const getFieldRankMap = (significantFields: Record<string, number>): FieldRankMap => {
  const entries = Object.entries(significantFields)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])

  return entries.reduce<FieldRankMap>((acc, [key], index) => {
    if (index < 5) acc[key] = index + 1;
    return acc;
  }, {});
};


const Insights = () => {
  const router = useRouter();
  const params = useParams();
  const type = params.type;
  const uuid = params.uuid;
  const [loading, setLoading] = useState(false);
  const { hasNotification } = useNotification();
  const [tabIndex, setTabIndex] = useState(0);
  const [name, setName] = useState<string>("");
  const [audience_type, setType] = useState("");
  const [predictableFields, setPredictableFields] = useState<SignificantFields>({});
  const [fieldRanks, setFieldRanks] = useState<FieldRankMap>({});
  const { insightsHints, cardsInsights, changeInsightsHint, resetInsightsHints } = useInsightsHints();

  const [b2cData, setB2CData] = useState<B2CData>({
    personal_info: {
      gender: {},
      state: {},
      religion: {},
      age: {},
      ethnicity: {},
      languages: {},
      education_level: {},
      have_children: {},
      marital_status: {},
      homeowner: {}
    },
    financial: {
      income_range: {},
      credit_score_range: {},
      credit_cards: {},
      net_worth_range: {},
      number_of_credit_lines: {},
      bank_card: {},
      mail_order_donor: {},
      credit_card_premium: {},
      credit_card_new_issue: {},
      donor: {},
      investor: {},
      credit_range_of_new_credit: {}
    },
    lifestyle: {},
    voter: {
      congressional_district: {},
      political_party: {},
      voting_propensity: {}
    },
  });

  const [b2bData, setB2BData] = useState<B2BData>({
    professional_profile: {
      job_location: {},
      current_company_name: {},
      job_level: {},
      current_job_title: {},
      job_duration: {},
      primary_industry: {},
      company_size: {},
      annual_sales: {},
      department: {},
      homeowner: {},
    },
    education: {
      institution_name: {},
      post_graduation_time: {},
      degree: {},
    },
    employment_history: {
      job_location: {},
      number_of_jobs: {},
      company_name: {},
      job_tenure: {},
      job_title: {},
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response =
        await axiosInstance.get<AudienceInsightsStatisticsResponse>(
          `/audience-insights/${type}/${uuid}`
        );

      const significantFields = response.data.significant_fields;
      const fieldRankMap = getFieldRankMap(significantFields);

      setB2BData(response.data.b2b);
      setB2CData(response.data.b2c);
      setPredictableFields(response.data.significant_fields)
      setFieldRanks(fieldRankMap);
      setName(response.data.name);
      setType(response.data.audience_type)
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <CustomizedProgressBar />;
  }

  return (
    <Box sx={{ overflow: "visible" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          position: "sticky",
          top: 0,
          pt: "10px",
          pr: type === "sources" ? "5rem" : "1.5rem",
          pl: 0,
          zIndex: 1,
          backgroundColor: "#fff",
          justifyContent: "space-between",
          width: "100%",
          "@media (max-width: 600px)": {
            flexDirection: "column",
            display: "flex",
            alignItems: "flex-start",
            zIndex: 1,
            width: "100%",
            pr: 1.5,
          },
          "@media (max-width: 440px)": {
            flexDirection: "column",
            pt: hasNotification ? "3rem" : "0.75rem",
            top: hasNotification ? "4.5rem" : "",
            zIndex: 1,
            justifyContent: "flex-start",
          },
          "@media (max-width: 400px)": {
            pt: hasNotification ? "4.25rem" : "",
            pb: "6px",
          },
        }}
      >
        <IconButton
          onClick={() => {
            router.push("/insights");
          }}
          sx={{
            ":hover": {
              backgroundColor: "transparent",
            },
            "@media (max-width: 600px)": {
              display: "none",
            },
          }}
        >
          <ArrowBackIcon sx={{ color: "#1E88E5" }} />
        </IconButton>
        <Typography
          variant="h4"
          component="h1"
          className="first-sub-title"
          sx={{
            ...insightsStyle.title,
            position: "fixed",
            ml: 6,
            mt: 1,
            "@media (max-width: 600px)": {
              display: "none",
            },
          }}
        >
          {type === "sources" ? "Source" : "Lookalike"} - {name}
          <CustomTooltip title="Insights" linkText="Learn more" linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/insights" />
        </Typography>
        <Box
          sx={{
            display: "none",
            width: "100%",
            justifyContent: "start",
            alignItems: "center",
            "@media (max-width: 600px)": {
              display: "flex",
            },
          }}
        >
          <IconButton
            onClick={() => {
              router.push("/insights");
            }}
            sx={{
              "@media (max-width: 600px)": {},
            }}
          >
            <ArrowBackIcon sx={{ color: "rgba(56, 152, 252, 1)" }} />
          </IconButton>
          <Typography
            variant="h4"
            component="h1"
            className="first-sub-title"
            sx={{ ...dashboardStyles.title, mb: 0 }}
          >
            {type === "sources" ? "Source" : "Lookalike"} - {name}
          </Typography>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            width: "100%",
            justifyContent: "center",
            alignItems: "start",
            position: "relative",
            overflow: "visible",
            "@media (max-width: 600px)": {
              width: "100%",
              mt: hasNotification ? 1 : 2,
            }
          }}
        >

          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            sx={{
              textTransform: "none",
              minHeight: 0,
              cursor: type === "sources" ? 'none' : 'pointer',
              alignItems: "start",
              "& .MuiTabs-indicator": {
                backgroundColor: "rgba(30, 136, 229, 1)",
                // height: type === "sources" ? "0px" : "1.4px",
              },
              "@media (max-width: 600px)": {
                border: "1px solid rgba(228, 228, 228, 1)",
                borderRadius: "4px",
                width: "100%",
                "& .MuiTabs-indicator": {
                  height: "0",
                },
              },
            }}
            aria-label="insights tabs"
          >
            <Tab
              className="main-text"
              sx={{
                textTransform: "none",
                padding: "4px 24px",
                flexGrow: 1,
                minHeight: "auto",
                minWidth: "120px",
                fontSize: "14px",
                fontWeight: 700,
                lineHeight: "19.1px",
                textAlign: "left",
                "&.Mui-selected": {
                  color: "rgba(30, 136, 229, 1)",
                },
                "@media (max-width: 600px)": {
                  mr: 0,
                  borderRadius: "4px",
                  "&.Mui-selected": {
                    backgroundColor: "rgba(249, 249, 253, 1)",
                    border: "1px solid rgba(220, 220, 239, 1)",
                  },
                },
              }}
              label="Statistics"
            />
            <Tab
              className="main-text"
              sx={{
                textTransform: "none",
                padding: "4px 10px",
                minHeight: "auto",
                flexGrow: 1,
                textAlign: "center",
                fontSize: "14px",
                fontWeight: 700,
                lineHeight: "19.1px",
                minWidth: "120px",
                "&.Mui-selected": {
                  color: "rgba(30, 136, 229, 1)",
                },
                "@media (max-width: 600px)": {
                  mr: 0,
                  borderRadius: "4px",
                  "&.Mui-selected": {
                    backgroundColor: "rgba(249, 249, 253, 1)",
                    border: "1px solid rgba(220, 220, 239, 1)",
                  },
                },
              }}
              label="Predictable fields"
            />
          </Tabs>
        </Box>

      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          position: "relative"
        }}
      >
        <TabPanel value={tabIndex} index={0}>

          <StaticticsTab type={audience_type} b2bData={b2bData} b2cData={b2cData} fieldRanks={fieldRanks} />

        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <PredictableFields data={predictableFields} />
        </TabPanel>

      </Box>
    </Box>
  );
};

export default Insights;
