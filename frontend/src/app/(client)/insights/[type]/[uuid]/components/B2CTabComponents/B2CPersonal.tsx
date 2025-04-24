import { TabPanel } from "@/components/TabPanel";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { useState } from "react";
import { IconFillIndicator } from "../CustomChart";
import { GradientBarChart } from "../GradientHorizontalBarChart";
import { VerticalGradientBarChart } from "../VerticalGradientBarChart";
import { SemiCircularGradientChart } from "../SemiCircularGradientChart";
import { PieChartWithLegend } from "../CircularChart";
import { MultiIconFillIndicator } from "../MultiIconChart";
import { USHeatMapCard } from "../USMap";

const B2CPersonal = () => {
  const data = {
    NE: 45,
    KS: 25,
    OK: 17,
    TX: 10,
    CA: 3,
  };

  return (
    <Box>
      <Box
        sx={{
          padding: "1.5rem 5rem 1.5rem",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "70%" }}>
            <MultiIconFillIndicator
              title="Gender"
              items={[
                {
                  imageSrc: "/male.svg",
                  label: "Male",
                  percentage: 80,
                  fillColor: "rgba(98, 178, 253, 1)",
                  bgColor: "rgba(193, 228, 255, 1)",
                },
                {
                  imageSrc: "/female.svg",
                  label: "Female",
                  percentage: 45,
                  fillColor: "rgba(249, 155, 171, 1)",
                  bgColor: "rgba(255, 222, 227, 1)",
                },
                {
                  imageSrc: "/male-female.svg",
                  label: "Unknown",
                  percentage: 65,
                  fillColor: "rgb(15, 209, 134)",
                  bgColor: "rgba(155, 223, 196, 1)",
                },
              ]}
            />
          </Box>

          <Box sx={{ display: "flex", width: "100%" }}>
            {/* Map chart here */}
            <USHeatMapCard
              title="Location"
              regions={[
                {
                  label: "Nebraska",
                  percentage: 45,
                  fillColor: "#1E5FE0",
                  state: "NE",
                },
                {
                  label: "Kansas",
                  percentage: 25,
                  fillColor: "#438AF8",
                  state: "KS",
                },
                {
                  label: "Oklahoma",
                  percentage: 17,
                  fillColor: "#73A6F9",
                  state: "OK",
                },
                {
                  label: "Texas",
                  percentage: 10,
                  fillColor: "#A4C3FB",
                  state: "TX",
                },
                {
                  label: "Other",
                  percentage: 3,
                  fillColor: "#D4E0FC",
                  state: "",
                },
              ]}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "100%" }}>
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
          </Box>
          <Box sx={{ display: "flex", width: "100%" }}>
            <PieChartWithLegend
              title="Home Status"
              data={[
                {
                  label: "Home Owners",
                  value: 57.5,
                  color: "rgba(98, 178, 253, 1)",
                },
                {
                  label: "Rent home",
                  value: 32.5,
                  color: "rgba(249, 155, 171, 1)",
                },
                {
                  label: "Unknown",
                  value: 10,
                  color: "rgba(155, 223, 196, 1)",
                },
              ]}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "60%" }}>
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
          </Box>
          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Ethnicity"
              data={[
                { label: "White", percent: 50 },
                { label: "Hispanic", percent: 17 },
                { label: "Black", percent: 13 },
                { label: "Asian", percent: 7 },
                { label: "Other", percent: 3 },
              ]}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Languages"
              data={[
                { label: "English", percent: 40 },
                { label: "French", percent: 25 },
                { label: "Spanish", percent: 15 },
                { label: "German", percent: 10 },
                { label: "Chineese", percent: 7 },
                { label: "Other", percent: 3 },
              ]}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              gap: 2,
            }}
          >
            <SemiCircularGradientChart
              title="Maritial Status"
              percent={65}
              labelLeft="Married"
              labelRight="Unmarried"
              colorStops={[
                { offset: "11.88%", color: "#62B2FD" },
                { offset: "86.9%", color: "#C1E4FF" },
              ]}
            />

            <SemiCircularGradientChart
              title="Have Children"
              percent={65}
              labelLeft="Have"
              labelRight="Dont have"
              colorStops={[
                { offset: "21.13%", color: "#9BDFC4" },
                { offset: "78.02%", color: " #D7F2E7" },
              ]}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "100%" }}>
            <VerticalGradientBarChart
              title="Children Ages"
              data={[
                { label: "0-3", percent: 15 },
                { label: "3-5", percent: 10 },
                { label: "5-10", percent: 25 },
                { label: "10-15", percent: 40 },
                { label: "15-18", percent: 7 },
                { label: "18+", percent: 3 },
              ]}
            />
          </Box>
          <Box sx={{ display: "flex", width: "100%" }}>
            <IconFillIndicator
              imageSrc="/pets.svg"
              title="Pets"
              percentage={52}
              labels={["Yes", "No"]}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default B2CPersonal;
