import { Box } from "@mui/material";
import { GradientBarChart } from "../GradientHorizontalBarChart";
import { USHeatMapCard } from "../USMap";

import { mapState, mapGenericPercentage } from "./mappingUtils";

type PercentageMap = Record<string, any>;

interface ProfessionalInfo {
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
}

interface B2BProffesionalProps {
  data: ProfessionalInfo;
}

const B2BProfessional: React.FC<B2BProffesionalProps> = ({ data }) => {
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
          <USHeatMapCard
            title="Job Location"
            regions={mapState(data.job_location)}
          />
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Current Company Name"
              data={mapGenericPercentage(data.current_company_name)}
              gradientColor="155, 223, 196"
            />
          </Box>

          <Box sx={{ display: "flex", width: "70%" }}>
            <GradientBarChart
              title="Job Level"
              data={mapGenericPercentage(data.job_level)}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "70%" }}>
            <GradientBarChart
              title="Current Job Title"
              data={mapGenericPercentage(data.current_job_title)}
            />
          </Box>
          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Current Duration"
              data={mapGenericPercentage(data.job_duration)}
              gradientColor="249, 155, 171"
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Primary Industry"
              data={mapGenericPercentage(data.primary_industry)}
              gradientColor="159, 151, 247"
            />
          </Box>

          <Box sx={{ display: "flex", width: "70%" }}>
            <GradientBarChart
              title="Company Size"
              data={mapGenericPercentage(data.company_size)}
              gradientColor="155, 223, 196"
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Annual Sales"
              data={mapGenericPercentage(data.annual_sales)}
              gradientColor="155, 223, 196"
            />
          </Box>
          <Box sx={{ display: "flex", width: "70%" }}>
            <GradientBarChart
              title="Department"
              data={mapGenericPercentage(data.department)}
              gradientColor="159, 151, 247"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default B2BProfessional;
