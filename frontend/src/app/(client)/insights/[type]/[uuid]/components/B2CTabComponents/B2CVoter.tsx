import {
  mapGenericPercentage,
  extractSemiCirclePercent,
  mapPieChart,
} from "./mappingUtils";
import { Box } from "@mui/material";
import { GradientBarChart } from "../GradientHorizontalBarChart";
import { SemiCircularGradientChart } from "../SemiCircularGradientChart";
import { FieldRankMap, PercentageMap, VoterInfo } from "@/types/insights";
import { PieChartWithLegend } from "../CircularChart";

interface B2CVoterProps {
  data: VoterInfo;
  fieldRanks: FieldRankMap;
}

const B2CVoter: React.FC<B2CVoterProps> = ({ data, fieldRanks }) => {
  const congressionalData = mapGenericPercentage(data.congressional_district)
    .filter((entry) => entry.percent > 0 && entry.label !== "-")
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 6);

  const politicalPartyData = mapGenericPercentage(data.political_party)
    .filter((entry) => entry.percent > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 6);

  const votingPropensityYes = extractSemiCirclePercent(
    data.voting_propensity,
    "0.10000000149011612"
  );

  const votingPieDataRaw: PercentageMap = {
    "Will vote": votingPropensityYes.toFixed(2),
    "Won’t vote": (100 - votingPropensityYes).toFixed(2),
  };

  const votingPieChartData = mapPieChart(votingPieDataRaw);

  return (
    <Box>
      <Box
        sx={{
          padding: "1.5rem",
          pr: "3rem",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "32%" }}>
            <GradientBarChart
              title="Congressional District"
              data={congressionalData}
              rank={fieldRanks["congressional_district"]}
              gradientColor="249, 155, 171"
            />
          </Box>

          <Box sx={{ display: "flex", width: "32%" }}>
            <GradientBarChart
              title="Political Party"
              data={politicalPartyData}
              rank={fieldRanks["political_party"]}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              width: "32%",
            }}
          >
            <PieChartWithLegend
              title="Voting Propensity"
              data={votingPieChartData}
              rank={fieldRanks["voting_propensity"]}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default B2CVoter;
