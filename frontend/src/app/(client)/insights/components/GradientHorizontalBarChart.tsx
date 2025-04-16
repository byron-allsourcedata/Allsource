import React from "react";
import { Box, Typography, Stack } from "@mui/material";

type BarData = {
  label: string;
  percent: number;
};

type GradientBarChartProps = {
  title: string;
  data: BarData[];
};

const getGradient = (fillPercent: number, relativePercent: number) => {
  // относительная насыщенность (от 0.4 до 1)
  const opacity = 0.4 + 0.6 * relativePercent;
  return `linear-gradient(90deg, rgba(98, 178, 253, ${opacity}) ${fillPercent}%, rgba(220,220,220,0.3) ${fillPercent}%)`;
};

export const GradientBarChart: React.FC<GradientBarChartProps> = ({
  title,
  data,
}) => {
  const maxPercent = Math.max(...data.map((d) => d.percent)) || 1;

  return (
    <Box p={2} borderRadius={2} boxShadow={2} bgcolor="#fff">
      <Typography className="dashboard-card-heading" mb={2}>
        {title}
      </Typography>

      <Stack spacing={2}>
        {data.map(({ label, percent }, index) => {
          const relative = percent / maxPercent;

          return (
            <Box key={index}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography
                  className="dashboard-card-text"
                  sx={{
                    color: "rgba(66, 66, 66, 1) !important",
                    fontWeight: "400 !important",
                  }}
                >
                  {label}
                </Typography>
                <Typography
                  className="dashboard-card-text"
                  sx={{
                    color: "rgba(66, 66, 66, 1) !important",
                    fontWeight: "400 !important",
                  }}
                >
                  {percent}%
                </Typography>
              </Box>
              <Box
                height={24}
                borderRadius={2}
                sx={{
                  background: getGradient(percent, relative),
                  transition: "background 0.3s ease",
                }}
              />
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};
