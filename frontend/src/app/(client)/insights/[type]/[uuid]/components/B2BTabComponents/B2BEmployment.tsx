import { Box } from "@mui/material";
import { GradientBarChart } from "../GradientHorizontalBarChart";
import { USHeatMapCard } from "../USMap";

import { mapState, mapGenericPercentage } from "./mappingUtils";
import { EmploymentInfo, FieldRankMap } from "@/types/insights";
import MapChart from "../MapChart";


type B2BEmploymentProps = {
  data: EmploymentInfo;
  fieldRanks: FieldRankMap;
};

const B2BEmployment: React.FC<B2BEmploymentProps> = ({ data, fieldRanks }) => {
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
          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="№ of jobs(last 5 years)"
              data={mapGenericPercentage(data.number_of_jobs)}
              rank={fieldRanks["number_of_jobs"]}
            />
          </Box>

          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Company Name"
              data={mapGenericPercentage(data.company_name)}
              gradientColor="155, 223, 196"
              rank={fieldRanks["company_name"]}
            />
          </Box>

          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Job Tenure"
              data={mapGenericPercentage(data.job_tenure)}
              gradientColor="249, 155, 171"
              rank={fieldRanks["job_tenure"]}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >


          <Box sx={{ display: "flex", width: "34%" }}>
            <GradientBarChart
              title="Job Title"
              data={mapGenericPercentage(data.job_title)}
              rank={fieldRanks["job_title"]}
            />
          </Box>

          <Box
            sx={{ display: "flex", flexDirection: "row", width: "66.15%", gap: 2 }}
          >
            <MapChart
              title="Job Location"
              regions={mapState(data.job_location)}
              rank={fieldRanks["job_location"]}
            />
          </Box>
        </Box>

      </Box>
    </Box>
  );
};

export default B2BEmployment;
