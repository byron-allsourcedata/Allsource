import { Box } from "@mui/material";
import { GradientBarChart } from "../GradientHorizontalBarChart";
import { VerticalGradientBarChart } from "../VerticalGradientBarChart";
import { SemiCircularGradientChart } from "../SemiCircularGradientChart";
import { mapGenericPercentage, extractSemiCirclePercent } from "./mappingUtils";
import { BarData } from "../VerticalGradientBarChart";
import { FieldRankMap, FinancialInfo } from "@/types/insights";

function parseNetWorthStart(label: string): number {
  if (label === "Unknown") return Number.MAX_SAFE_INTEGER - 1;
  if (label.startsWith("Less than")) return 0;
  if (label.startsWith("Greater than")) {
    const match = label.match(/\$([\d,]+)/);
    return match
      ? parseInt(match[1].replace(/,/g, ""), 10) + 1
      : Number.MAX_SAFE_INTEGER;
  }

  const rangeMatch = label.match(/\$([\d,]+)\s*-\s*\$([\d,]+)/);
  if (rangeMatch) {
    return parseInt(rangeMatch[1].replace(/,/g, ""), 10);
  }

  const singleMatch = label.match(/\$([\d,]+)/);
  return singleMatch
    ? parseInt(singleMatch[1].replace(/,/g, ""), 10)
    : Number.MAX_SAFE_INTEGER;
}

function sortNetWorthRanges(data: BarData[]): BarData[] {
  return [...data].sort(
    (a, b) => parseNetWorthStart(a.label) - parseNetWorthStart(b.label)
  );
}

function parseIncomeRangeStart(label: string): number {
  if (label === "u" || label.toLowerCase() === "unknown") {
    return Number.MAX_SAFE_INTEGER;
  }

  const lower = label.toLowerCase();
  if (lower.includes("under")) {
    return 0;
  }

  if (lower.includes("plus")) {
    const match = label.match(/\$([\d,]+)/);
    return match
      ? parseInt(match[1].replace(/,/g, ""), 10) + 1_000_000
      : Number.MAX_SAFE_INTEGER - 1;
  }

  const rangeMatch = label.match(/\$([\d,]+)\s*-\s*\$([\d,]+)/);
  if (rangeMatch) {
    return parseInt(rangeMatch[1].replace(/,/g, ""), 10);
  }

  return Number.MAX_SAFE_INTEGER;
}

function parseCreditScoreStart(label: string): number {
  const lower = label.toLowerCase().trim();

  if (lower === "unknown" || lower === "u") {
    return Number.MAX_SAFE_INTEGER;
  }

  if (lower.startsWith("under")) {
    const match = label.match(/under\s*(\d+)/i);
    return match ? 0 : Number.MAX_SAFE_INTEGER;
  }

  if (lower.endsWith("+") || lower.includes("plus")) {
    const match = label.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER - 1;
  }

  const rangeMatch = label.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    return parseInt(rangeMatch[1], 10);
  }

  const match = label.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

function sortIncomeRanges(data: BarData[]): BarData[] {
  return [...data].sort(
    (a, b) => parseIncomeRangeStart(a.label) - parseIncomeRangeStart(b.label)
  );
}

function sortCreditScoreRanges(data: BarData[]): BarData[] {
  return [...data].sort(
    (a, b) => parseCreditScoreStart(a.label) - parseCreditScoreStart(b.label)
  );
}

interface B2CPersonalProps {
  data: FinancialInfo;
  fieldRanks: FieldRankMap;
}

const B2CFinancial: React.FC<B2CPersonalProps> = ({ data, fieldRanks }) => {
  const incomeRangeData = sortIncomeRanges(
    mapGenericPercentage(data.income_range)
  );
  const creditScoreRangeData = sortCreditScoreRanges(
    mapGenericPercentage(data.credit_score_range)
  );
  const creditCardsData = mapGenericPercentage(data.credit_cards);
  const netWorthRangeData = sortNetWorthRanges(
    mapGenericPercentage(data.net_worth_range)
  );
  const numberOfCreditLinesData = mapGenericPercentage(
    data.number_of_credit_lines
  );

  const semiCircleData = {
    bankCardPercent: extractSemiCirclePercent(data.bank_card, "2"),
    mailOrderDonorPercent: extractSemiCirclePercent(data.mail_order_donor, "2"),
    creditCardPremiumPercent: extractSemiCirclePercent(
      data.credit_card_premium,
      "2"
    ),
    creditCardNewIssuePercent: extractSemiCirclePercent(
      data.credit_card_new_issue,
      "2"
    ),
    donorPercent: extractSemiCirclePercent(data.donor, "2"),
    investorPercent: extractSemiCirclePercent(data.investor, "2"),
  };
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
          <Box sx={{ display: "flex", width: "22%" }}>
            <GradientBarChart
              title="Income range"
              data={incomeRangeData}
              sortByPercent={false}
              rank={fieldRanks["income_range"]}
            />
          </Box>
          <Box sx={{ display: "flex", width: "40%" }}>
            <GradientBarChart
              title="Credit score range"
              data={creditScoreRangeData}
              rank={fieldRanks["credit_score_range"]}
            />
          </Box>

          <Box sx={{ display: "flex", width: "34%" }}>
            <GradientBarChart
              title="Credit Cards"
              data={creditCardsData}
              rank={fieldRanks["credit_cards"]}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box sx={{ display: "flex", width: "22%" }}>
            <GradientBarChart
              title="Net worth range"
              data={netWorthRangeData}
              sortByPercent={false}
              rank={fieldRanks["net_worth_range"]}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              width: "40%",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <SemiCircularGradientChart
              title="Bank Card"
              percent={semiCircleData.bankCardPercent}
              labelLeft="Have"
              labelRight="Don't have"
              colorStops={[
                { offset: "11.88%", color: "#62B2FD" },
                { offset: "86.9%", color: "#C1E4FF" },
              ]}
              rank={fieldRanks["bank_card"]}
            />
            <SemiCircularGradientChart
              title="Credit Card Premium"
              percent={semiCircleData.creditCardPremiumPercent}
              labelLeft="Yes"
              labelRight="No"
              colorStops={[
                { offset: "21.13%", color: "#9BDFC4" },
                { offset: "78.02%", color: "#D7F2E7" },
              ]}
              rank={fieldRanks["credit_card_premium"]}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              width: "34%",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <SemiCircularGradientChart
              title="Mail Order Donor"
              percent={semiCircleData.mailOrderDonorPercent}
              labelLeft="Yes"
              labelRight="No"
              colorStops={[
                { offset: "21.13%", color: "#9BDFC4" },
                { offset: "78.02%", color: "#D7F2E7" },
              ]}
              rank={fieldRanks["mail_order_donor"]}
            />
            <SemiCircularGradientChart
              title="Credit Card New Issue"
              percent={semiCircleData.creditCardNewIssuePercent}
              labelLeft="Yes"
              labelRight="No"
              colorStops={[
                { offset: "11.88%", color: "#62B2FD" },
                { offset: "86.9%", color: "#C1E4FF" },
              ]}
              rank={fieldRanks["credit_card_new_issue"]}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2 }}
        >
          <Box
            sx={{
              display: "flex",
              width: "22%",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <SemiCircularGradientChart
              title="Donor"
              percent={semiCircleData.donorPercent}
              labelLeft="Yes"
              labelRight="No"
              colorStops={[
                { offset: "11.88%", color: "#62B2FD" },
                { offset: "86.9%", color: "#C1E4FF" },
              ]}
              rank={fieldRanks["credit_card_new_issue"]}
            />
            <SemiCircularGradientChart
              title="Investor"
              percent={semiCircleData.investorPercent}
              labelLeft="Yes"
              labelRight="No"
              colorStops={[
                { offset: "21.13%", color: "#9BDFC4" },
                { offset: "78.02%", color: "#D7F2E7" },
              ]}
              rank={fieldRanks["investor"]}
            />
          </Box>
          <Box sx={{ display: "flex", width: "40%" }}>
            <VerticalGradientBarChart
              title="Number of credit lines"
              data={numberOfCreditLinesData}
              rank={fieldRanks["number_of_credit_lines"]}
            />
          </Box>
          <Box sx={{ display: "flex", width: "34%" }}>
            <GradientBarChart
              title="Credit Range Of New Credit"
              data={mapGenericPercentage(data.credit_range_of_new_credit)}
              rank={fieldRanks["credit_range_of_new_credit"]}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default B2CFinancial;
