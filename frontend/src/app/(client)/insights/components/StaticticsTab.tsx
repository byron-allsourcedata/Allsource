import { TabPanel } from "@/components/TabPanel";
import { Box, Tabs, Tab } from "@mui/material";
import { useState } from "react";
import { IconFillIndicator } from "./CustomChart";
import { GradientBarChart } from "./GradientHorizontalBarChart";
import { VerticalGradientBarChart } from "./VerticalGradientBarChart";
import { SemiCircularGradientChart } from "./SemiCircularGradientChart";

const StaticticsTab = () => {
  const [targetIndex, setTargetIndex] = useState(0);

  const handleTargetChange = (
    event: React.SyntheticEvent,
    newIndex: number
  ) => {
    setTargetIndex(newIndex);
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        pb: 1,
        pr: "1.5rem",
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
          alignItems: "start",
          "& .MuiTabs-indicator": {
            backgroundColor: "rgba(80, 82, 178, 1)",
            height: "1.4px",
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
            minWidth: "auto",
            fontSize: "14px",
            fontWeight: 700,
            lineHeight: "19.1px",
            textAlign: "left",
            mr: 1,
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
            padding: "4px 10px",
            minHeight: "auto",
            flexGrow: 1,
            textAlign: "center",
            fontSize: "14px",
            fontWeight: 700,
            lineHeight: "19.1px",
            minWidth: "auto",
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

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          flexGrow: 1,
        }}
      >
        <TabPanel value={targetIndex} index={0}>
          <Box sx={{ padding: 4, maxWidth: "100%" }}>
            <IconFillIndicator
              imageSrc="/plains.svg"
              title="Book Reader"
              percentage={60}
              labels={["Yes", "No"]}
            />
            <GradientBarChart
              title="Religion"
              data={[
                { label: "Christians", percent: 40 },
                { label: "Muslims", percent: 25 },
                { label: "Hindu", percent: 15 },
                { label: "Buddism", percent: 10 },
                { label: "Jews", percent: 7 },
                { label: "Other", percent: 3 },
              ]}
            />

            <VerticalGradientBarChart
              title="Age"
              data={[
                { label: "18-25", percent: 15 },
                { label: "26-30", percent: 25 },
                { label: "31-35", percent: 40 },
                { label: "36-45", percent: 10 },
                { label: "46-65", percent: 7 },
                { label: "Other", percent: 3 },
              ]}
            />
            <Box sx={{ maxWidth: "400px" }}>
              <SemiCircularGradientChart
                title="Maritial Status"
                percent={65}
                labelLeft="Married"
                labelRight="Unmarried"
                colorGradient="linear-gradient(247.51deg, #62B2FD 11.88%, #C1E4FF 86.9%)"
              />
            </Box>
          </Box>
        </TabPanel>
        <TabPanel value={targetIndex} index={1}></TabPanel>
      </Box>
    </Box>
  );
};

export default StaticticsTab;
