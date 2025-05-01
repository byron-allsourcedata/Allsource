import { mapGenericPercentage, extractSemiCirclePercent } from "./mappingUtils";
import { Box } from "@mui/material";
import { GradientBarChart } from "../GradientHorizontalBarChart";
import { SemiCircularGradientChart } from "../SemiCircularGradientChart";
import { FieldRankMap, VoterInfo } from "@/types/insights";

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
              title="Congressional District"
              data={congressionalData}
              rank={fieldRanks["congressional_district"]}
            />
          </Box>

          <Box sx={{ display: "flex", width: "100%" }}>
            <GradientBarChart
              title="Political Party"
              data={politicalPartyData}
              rank={fieldRanks["political_party"]}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "50%",
              height: "100%",
              gap: 2,
            }}
          >
            <SemiCircularGradientChart
              title="Voting Propensity"
              percent={votingPropensityYes}
              labelLeft="Yes"
              labelRight="No"
              colorStops={[
                { offset: "11.88%", color: "#62B2FD" },
                { offset: "86.9%", color: "#C1E4FF" },
              ]}
              rank={fieldRanks["voting_propensity"]}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default B2CVoter;
