import { Box } from "@mui/material";
import { GradientBarChart } from "../GradientHorizontalBarChart";

import { mapGenericPercentage } from "./mappingUtils";
import { VerticalGradientBarChart } from "../VerticalGradientBarChart";

type PercentageMap = Record<string, any>;

type EducationInfo = {
  institution_name: PercentageMap;
  post_graduation_time: PercentageMap;
  degree: PercentageMap;
};

interface B2BEducationProps {
  data: EducationInfo;
}

const B2BEducation: React.FC<B2BEducationProps> = ({ data }) => {
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
              title="Institution Name"
              data={mapGenericPercentage(data?.institution_name)}
            />
          </Box>

          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Post-graduation time"
              data={mapGenericPercentage(data?.post_graduation_time)}
              gradientColor="249, 155, 171"
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "40%" }}>
            <VerticalGradientBarChart
              title="Degree"
              data={mapGenericPercentage(data?.degree)}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default B2BEducation;
