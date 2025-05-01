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
import { BarData } from "../VerticalGradientBarChart";

import {
  mapGender,
  mapState,
  mapGenericPercentage,
  mapPieChart,
  extractSemiCirclePercent,
} from "./mappingUtils";

type PercentageMap = Record<string, any>;
type BooleanDistribution = Record<"true" | "false", number>;

interface PersonalInfo {
  gender: PercentageMap;
  state: PercentageMap;
  religion: PercentageMap;
  age: PercentageMap;
  ethnicity: PercentageMap;
  languages: PercentageMap;
  education_level: PercentageMap;
  have_children: PercentageMap;
  marital_status: PercentageMap;
  homeowner: PercentageMap;
}

interface B2CPersonalProps {
  data: PersonalInfo;
  pets_data: Record<string, BooleanDistribution>;
}

function sortAgeGroups(data: BarData[]): BarData[] {
  const extractRangeStart = (label: string): number => {
    const match = label.match(/^(\d+)-/);
    return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
  };

  return [...data].sort((a, b) => {
    return extractRangeStart(a.label) - extractRangeStart(b.label);
  });
}


const B2CPersonal: React.FC<B2CPersonalProps> = ({ data, pets_data }) => {
  const ownPets = pets_data["own_pets"];
  const trueVal = ownPets?.true ?? 0;
  const falseVal = ownPets?.false ?? 0;
  const total = trueVal + falseVal;
  const percentage = total > 0 ? Math.round((trueVal / total) * 100) : 0;


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
          <USHeatMapCard title="Location" regions={mapState(data.state)} />
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "70%" }}>
            <MultiIconFillIndicator
              title="Gender"
              items={mapGender(data.gender)}
            />
          </Box>

          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Education Level"
              data={[
                { label: "Completed High School", percent: 40 },
                { label: "Completed College", percent: 25 },
                { label: "Completed Graduate School", percent: 15 },
                { label: "Attended Vocational/Technical", percent: 13 },
                { label: "Unknown", percent: 7 },
              ]}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Ethnicity"
              data={mapGenericPercentage(data.ethnicity)}
            />
          </Box>
          <Box sx={{ display: "flex", width: "60%" }}>
            <VerticalGradientBarChart
              title="Age"
              data={sortAgeGroups(mapGenericPercentage(data.age))}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "100%" }}>
            <PieChartWithLegend
              title="Home Status"
              data={mapPieChart(data.homeowner)}
            />
          </Box>

          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Religion"
              data={mapGenericPercentage(data.religion)}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Languages"
              data={mapGenericPercentage(data.languages)}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "60%",
            }}
          >
            <PieChartWithLegend
              title="Marital Status"
              data={mapPieChart(data.marital_status)}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "100%" }}>
            <PieChartWithLegend
              title="Have Children"
              data={mapPieChart(data.have_children)}
            />
          </Box>

          <Box sx={{ display: "flex", width: "100%" }}>
            <IconFillIndicator
              imageSrc="/pets.svg"
              title="Pets"
              percentage={percentage}
              labels={["Yes", "No"]}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box
            sx={{
              display: "flex",
              width: "49.25%",
              height: "100%",
            }}
          >
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
        </Box>
      </Box>
    </Box>
  );
};

export default B2CPersonal;
