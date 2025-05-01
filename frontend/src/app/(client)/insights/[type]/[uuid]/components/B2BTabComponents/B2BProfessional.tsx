import { Box } from "@mui/material";
import { GradientBarChart } from "../GradientHorizontalBarChart";
import { USHeatMapCard } from "../USMap";

import { mapState, mapGenericPercentage } from "./mappingUtils";
import { FieldRankMap, ProfessionalInfo } from "@/types/insights";



interface B2BProffesionalProps {
  data: ProfessionalInfo;
  fieldRanks: FieldRankMap;
}

const B2BProfessional: React.FC<B2BProffesionalProps> = ({ data, fieldRanks }) => {
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
            rank={fieldRanks["job_location"]}
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
              rank={fieldRanks["current_company_name"]}
            />
          </Box>

          <Box sx={{ display: "flex", width: "70%" }}>
            <GradientBarChart
              title="Job Level"
              data={mapGenericPercentage(data.job_level)}
              rank={fieldRanks["job_level"]}
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
              rank={fieldRanks["current_job_title"]}
            />
          </Box>
          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Current Duration"
              data={mapGenericPercentage(data.job_duration)}
              gradientColor="249, 155, 171"
              rank={fieldRanks["job_duration"]}
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
              rank={fieldRanks["primary_industry"]}
            />
          </Box>

          <Box sx={{ display: "flex", width: "70%" }}>
            <GradientBarChart
              title="Company Size"
              data={mapGenericPercentage(data.company_size)}
              gradientColor="155, 223, 196"
              rank={fieldRanks["company_size"]}
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
              rank={fieldRanks["annual_sales"]}
            />
          </Box>
          <Box sx={{ display: "flex", width: "70%" }}>
            <GradientBarChart
              title="Department"
              data={mapGenericPercentage(data.department)}
              gradientColor="159, 151, 247"
              rank={fieldRanks["department"]}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default B2BProfessional;
