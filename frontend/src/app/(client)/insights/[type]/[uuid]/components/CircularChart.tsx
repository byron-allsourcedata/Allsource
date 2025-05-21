import * as React from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import { useDrawingArea } from "@mui/x-charts/hooks";
import { styled } from "@mui/material/styles";
import type {} from "@mui/material/themeCssVarsAugmentation";
import { Typography, Card, CardContent, Box, Stack } from "@mui/material";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";

interface PieChartDataItem {
  label: string;
  value: number;
  color: string;
}

interface PieChartWithLegendProps {
  title: string;
  data: PieChartDataItem[];
  rank?: number;
}

interface StyledTextProps {
  variant: "primary" | "secondary";
}

const StyledText = styled("text", {
  shouldForwardProp: (prop) => prop !== "variant",
})<StyledTextProps>(({ theme }) => ({
  textAnchor: "middle",
  dominantBaseline: "central",
  fill: (theme.vars || theme).palette.text.secondary,
  variants: [
    {
      props: {
        variant: "primary",
      },
      style: {
        fontSize: theme.typography.h5.fontSize,
        fontWeight: theme.typography.h5.fontWeight,
      },
    },
    {
      props: {
        variant: "secondary",
      },
      style: {
        fontSize: theme.typography.body2.fontSize,
        fontWeight: theme.typography.body2.fontWeight,
      },
    },
  ],
}));

function PieCenterLabel({
  primaryText,
  secondaryText,
}: {
  primaryText: string;
  secondaryText: string;
}) {
  const { width, height, left, top } = useDrawingArea();
  const primaryY = top + height / 2 - 10;
  const secondaryY = primaryY + 24;

  return (
    <>
      <StyledText variant="primary" x={left + width / 2} y={primaryY}>
        {primaryText}
      </StyledText>
      <StyledText variant="secondary" x={left + width / 2} y={secondaryY}>
        {secondaryText}
      </StyledText>
    </>
  );
}

export const PieChartWithLegend: React.FC<PieChartWithLegendProps> = ({
  title,
  data,
  rank,
}) => {
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const maxItem = sortedData[0];

  const chartData = sortedData.map((item) => ({
    label: item.label,
    value: item.value,
  }));

  const colors = sortedData.map((item) => item.color);

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
        gap: "8px",
        pb: 0,
        flexGrow: 1,
      }}
    >
      <CardContent
        sx={{
          width: "100%",
          borderRadius: "6px",
          boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
          position: "relative",
          flexGrow: 1,
          ...(rank !== undefined && {
            overflow: "hidden",
            "&::before, &::after": {
              content: '""',
              position: "absolute",
              backgroundRepeat: "no-repeat",
              pointerEvents: "none",
            },
            "&::before": {
              top: 0,
              right: 0,
              height: "1px",
              width: "100%",
              backgroundImage:
                "linear-gradient(to left, rgba(30,136,229,1) 0%, rgba(30,136,229,0) 100%)",
            },
            "&::after": {
              top: 0,
              right: 0,
              width: "1px",
              height: "100%",
              backgroundImage:
                "linear-gradient(to bottom, rgba(30,136,229,1) 0%, rgba(30,136,229,0) 100%)",
            },
          }),
        }}
      >
        {rank !== undefined && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: "rgba(30, 136, 229, 1)",
              color: "white",
              borderTopRightRadius: "4px",
              borderBottomLeftRadius: "4px",
              px: 1.5,
              py: 0.5,
              fontFamily: "Roboto",
              fontSize: 12,
              fontWeight: 500,
              maxWidth: "100%",
              whiteSpace: "nowrap",
            }}
          >
            <ArrowDropUpIcon sx={{ fontSize: 16, mr: 0.5 }} />#{rank}{" "}
            Predictable field
          </Box>
        )}
        <Box
          bgcolor="#fff"
          p={0}
          sx={{
            width: "100%",
          }}
        >
          <Box
            sx={{
              width: "100%",
              justifyContent: "space-between",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography className="dashboard-card-heading">{title}</Typography>
          </Box>

          {sortedData.length === 0 ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="120px"
            >
              <Typography className="second-sub-title">
                No data available
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <PieChart
                  colors={colors}
                  margin={{ left: 80, right: 80, top: 50, bottom: 80 }}
                  series={[
                    {
                      data: chartData,
                      innerRadius: 75,
                      outerRadius: 100,
                      paddingAngle: 0,
                      highlightScope: { fade: "global", highlight: "item" },
                      faded: {
                        innerRadius: 30,
                        additionalRadius: -30,
                        color: "gray",
                      },
                      valueFormatter: (value, context) => {
                        const item = chartData[context.dataIndex];
                        return `${item.value}%`;
                      },
                    },
                  ]}
                  height={260}
                  width={260}
                  slotProps={{
                    legend: { hidden: true },
                  }}
                >
                  <PieCenterLabel
                    primaryText={`${maxItem?.value}%`}
                    secondaryText={maxItem?.label}
                  />
                </PieChart>
              </Box>
              {sortedData.map((item, index) => (
                <Stack
                  key={index}
                  direction="row"
                  sx={{ alignItems: "center", gap: 2, pb: 1 }}
                >
                  <Stack sx={{ gap: 1, flexGrow: 1 }}>
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: "start",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <Box
                        width={10}
                        height={10}
                        borderRadius="50%"
                        sx={{ backgroundColor: item.color }}
                      />
                      <Typography className="dashboard-card-text">
                        {item.value}%
                      </Typography>
                      <Typography className="dashboard-card-text">
                        {item.label}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              ))}
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
