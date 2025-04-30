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

export type B2CData = {
  personal_info: Record<string, any>;
  financial: Record<string, any>;
  lifestyle: Record<string, any>;
  voter: Record<string, any>;
};

type PercentageMap = Record<string, any>;

type ProfessionalInfo = {
  job_location: PercentageMap;
  current_company_name: PercentageMap;
  job_level: PercentageMap;
  current_job_title: PercentageMap;
  job_duration: PercentageMap;
  primary_industry: PercentageMap;
  company_size: PercentageMap;
  annual_sales: PercentageMap;
  department: PercentageMap;
  homeowner: PercentageMap;
};

type EducationInfo = {
  institution_name: PercentageMap;
  post_graduation_time: PercentageMap;
  degree: PercentageMap;
};

type EmploymentInfo = {
  job_location: PercentageMap;
  number_of_jobs: PercentageMap;
  company_name: PercentageMap;
  job_tenure: PercentageMap;
  job_title: PercentageMap;
};

export type SignificantFields = Record<string, number>;

export type B2BData = {
  professional_profile: ProfessionalInfo;
  education: EducationInfo;
  employment_history: EmploymentInfo;
};

type AudienceInsightsStatisticsResponse = {
  b2b: B2BData;
  b2c: B2CData;
  name: string;
  audience_type: string;
  significant_fields: SignificantFields;
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


  const [b2cData, setB2CData] = useState<B2CData>({
    personal_info: {},
    financial: {},
    lifestyle: {},
    voter: {},
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
      setB2BData(response.data.b2b);
      setB2CData(response.data.b2c);
      setPredictableFields(response.data.significant_fields)
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
    <Box>
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
          <ArrowBackIcon sx={{ color: "#5052B2" }} />
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
          <CustomTooltip title="Insights" />
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
            <ArrowBackIcon sx={{ color: "#5052B2" }} />
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
            "@media (max-width: 600px)": {
              width: "100%",
              mt: hasNotification ? 1 : 2,
            },
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
                backgroundColor: "rgba(80, 82, 178, 1)",
                height: type === "sources" ? "0px" : "1.4px",
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
                  color: "rgba(80, 82, 178, 1)",
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
            {type !== "sources" &&
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
                    color: "rgba(80, 82, 178, 1)",
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
              />}
          </Tabs>
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <TabPanel value={tabIndex} index={0}>
          <StaticticsTab type={audience_type} b2bData={b2bData} b2cData={b2cData} />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <PredictableFields data={predictableFields} />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default Insights;
