import { Box } from "@mui/material";
import { GradientBarChart } from "../GradientHorizontalBarChart";
import { USHeatMapCard } from "../USMap";

import { mapState, mapGenericPercentage } from "./mappingUtils";

type PercentageMap = Record<string, any>;
type BooleanDistribution = Record<"true" | "false", number>;

type EmploymentInfo = {
  job_location: PercentageMap;
  number_of_jobs: PercentageMap;
  company_name: PercentageMap;
  job_tenure: PercentageMap;
  job_title: PercentageMap;
};

type B2BEmploymentProps = {
  data: EmploymentInfo;
};

const B2BEmployment: React.FC<B2BEmploymentProps> = ({ data }) => {
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
          <Box sx={{ display: "flex", width: "70%" }}>
            <GradientBarChart
              title="№ of jobs(last 5 years)"
              data={mapGenericPercentage(data.number_of_jobs)}
            />
          </Box>

          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Company Name"
              data={mapGenericPercentage(data.company_name)}
              gradientColor="155, 223, 196"
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "70%" }}>
            <GradientBarChart
              title="Job Tenure"
              data={mapGenericPercentage(data.job_tenure)}
              gradientColor="249, 155, 171"
            />
          </Box>

          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Job Title"
              data={mapGenericPercentage(data.job_title)}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default B2BEmployment;
