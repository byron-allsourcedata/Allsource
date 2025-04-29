import { TabPanel } from "@/components/TabPanel";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import B2CTabs from "./B2CTabs";
import B2BTabs from "./B2BTabs";
import { useParams } from "next/navigation";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import React from "react";
import { B2BData, B2CData } from "../page";

type StatisticsTabProps = {
  type: string;
  b2bData: B2BData;
  b2cData: B2CData;
};

const StaticticsTab: React.FC<StatisticsTabProps> = ({ type, b2bData, b2cData }) => {

  const [targetIndex, setTargetIndex] = useState(0);
  const handleTargetChange = (
    event: React.SyntheticEvent,
    newIndex: number
  ) => {
    setTargetIndex(newIndex);
  };

  useEffect(() => {
    if (type === 'b2c') {
      setTargetIndex(1)
    }
  }, [type])

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
};

export default StaticticsTab;