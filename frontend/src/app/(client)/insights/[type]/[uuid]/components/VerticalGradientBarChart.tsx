"use client";

import React from "react";
import { Box, Typography, Stack } from "@mui/material";

export type BarData = {
  label: string;
  percent: number;
};

type VerticalGradientBarChartProps = {
  title: string;
  data: BarData[];
  fieldKey?: string;
  rank?: number;
};

const getVerticalGradient = (relativePercent: number) => {
  const opacity = 0.4 + 0.6 * relativePercent;
  return `linear-gradient(0deg, rgba(155, 223, 196, ${opacity}) 0%, rgba(155, 223, 196, 1) 100%)`;
};

export const VerticalGradientBarChart: React.FC<
  VerticalGradientBarChartProps
> = ({ title, data, rank }) => {

  const maxPercent = Math.max(...data.map((d) => d.percent)) || 1;

  return (
    <Box
      p={2.5}
      pb={0}
      bgcolor="#fff"
      sx={{
        width: "100%",
        borderRadius: "6px",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
      }}
    >
      <Box sx={{
        width: "100%",
        justifyContent: 'space-between',
        display: 'flex',
        flexDirection: 'row',
        mb: 2
      }}>
        <Typography className="dashboard-card-heading">
          {title}
        </Typography>
        {rank !== undefined && (
          <Typography
            component="span"
            sx={{
              fontSize: 12,
              ml: 1,
              color: "#888",
              verticalAlign: "middle",
            }}
          >
            #{rank}
          </Typography>
        )}
      </Box>

      <Stack
        direction="row"
        justifyContent="space-around"
        alignItems="start"
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
                  textWrap: "wrap",
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
