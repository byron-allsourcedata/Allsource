"use client";

import React from "react";
import { Box, Typography, Stack } from "@mui/material";

type BarData = {
  label: string;
  percent: number;
};

type VerticalGradientBarChartProps = {
  title: string;
  data: BarData[];
};

const getVerticalGradient = (relativePercent: number) => {
  const opacity = 0.4 + 0.6 * relativePercent; // от 0.4 до 1
  return `linear-gradient(0deg, rgba(155, 223, 196, ${opacity}) 0%, rgba(155, 223, 196, 1) 100%)`;
};

export const VerticalGradientBarChart: React.FC<
  VerticalGradientBarChartProps
> = ({ title, data }) => {
  const maxPercent = Math.max(...data.map((d) => d.percent)) || 1;

  return (
    <Box p={2} borderRadius={2} boxShadow={2} bgcolor="#fff">
      <Typography className="dashboard-card-heading" mb={2}>
        {title}
      </Typography>

      <Stack
        direction="row"
        justifyContent="space-around"
        alignItems="flex-end"
        spacing={2}
      >
        {data.map(({ label, percent }, index) => {
          const relative = percent / maxPercent;

          return (
            <Box
              key={index}
              display="flex"
              flexDirection="column"
              alignItems="center"
              width={40}
            >
              {/* Top label (percent) */}
              <Typography
                className="dashboard-card-text"
                sx={{ marginBottom: 0.5 }}
              >
                {percent}%
              </Typography>

              {/* Bar container */}
              <Box
                height={220}
                width="100%"
                borderRadius={4}
                bgcolor="rgba(245, 250, 254, 1)"
                display="flex"
                alignItems="flex-end"
                position="relative"
                overflow="hidden"
              >
                {/* Filled part */}
                <Box
                  width="100%"
                  // Считаем от 100, чтобы проценты всегда отображались корректно
                  height={`${percent}%`}
                  sx={{
                    background: getVerticalGradient(relative),
                    transition: "height 0.3s ease, background 0.3s ease",
                  }}
                />
              </Box>

              {/* Bottom label (param name) */}
              <Typography
                className="dashboard-card-text"
                sx={{
                  marginTop: 0.5,
                  textAlign: "center",
                  fontSize: 12,
                  textWrap: "nowrap",
                }}
              >
                {label}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};
