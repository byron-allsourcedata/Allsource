import { TabPanel } from "@/components/TabPanel";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import B2CTabs from "./B2CTabs";
import B2BTabs from "./B2BTabs";
import { useParams } from "next/navigation";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import React from "react";

type B2CData = {
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
};

type StatisticsTabProps = {
  setName: (name: string) => void;
};

const StaticticsTab: React.FC<StatisticsTabProps> = React.memo(
  ({ setName }) => {
    const params = useParams();
    const type = params.type;
    const uuid = params.uuid;
    const [loading, setLoading] = useState(false);
    const [targetIndex, setTargetIndex] = useState(0);

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

    const handleTargetChange = (
      event: React.SyntheticEvent,
      newIndex: number
    ) => {
      setTargetIndex(newIndex);
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
        setName(response.data.name);
        if (response.data.audience_type === "b2c") setTargetIndex(1);
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
            top: 50,
            zIndex: 100,
            backgroundColor: "#fff",
            justifyContent: "space-between",
            width: "97%",
            "@media (max-width: 600px)": {
              flexDirection: "column",
              display: "flex",
              alignItems: "flex-start",
              zIndex: 1,
              width: "100%",
              pr: 1.5,
            },
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              width: "100%",
              justifyContent: "center",
              alignItems: "start",
            }}
          >
            <Tabs
              value={targetIndex}
              onChange={handleTargetChange}
              sx={{
                textTransform: "none",
                minHeight: 0,
                pt: 2,
                mb: 0.25,
                alignItems: "start",
                "& .MuiTabs-indicator": {
                  backgroundColor: "rgba(80, 82, 178, 1)",
                  height: "1.4px",
                },
                "@media (max-width: 600px)": {
                  border: "1px solid rgba(228, 228, 228, 1)",
                  borderRadius: "4px",
                  pt: 0,
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
                  minWidth: "76px",
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
                label="B2B"
              />
              <Tab
                className="main-text"
                sx={{
                  textTransform: "none",
                  padding: "4px 24px",
                  minHeight: "auto",
                  flexGrow: 1,
                  textAlign: "center",
                  fontSize: "14px",
                  fontWeight: 700,
                  lineHeight: "19.1px",
                  minWidth: "76px",
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
                label="B2C"
              />
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
          <TabPanel value={targetIndex} index={0}>
            <B2BTabs data={b2bData} />
          </TabPanel>
          <TabPanel value={targetIndex} index={1}>
            <B2CTabs data={b2cData} />
          </TabPanel>
        </Box>
      </Box>
    );
  }
);

StaticticsTab.displayName = "StaticticsTab";

export default StaticticsTab;
