"use client";

import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';

export type BarData = {
  label: string;
  percent: number;
};

type VerticalGradientBarChartProps = {
  title: string;
  data: BarData[];
  fieldKey?: string;
  rank?: number;
  gradientColor?: string;
};

const getGradient = (relativePercent: number, gradientColor: string) => {
  const opacity = 0.4 + 0.6 * relativePercent;

  if (gradientColor.startsWith("rgba(")) {
    const rgbValues = gradientColor.match(/\d+/g)?.slice(0, 3).join(", ");
    return `rgba(${rgbValues}, ${opacity})`;
  }

  return `rgba(${gradientColor}, ${opacity})`;
};

export const VerticalGradientBarChart: React.FC<
  VerticalGradientBarChartProps
> = ({ title, data, rank, gradientColor = "155, 223, 196" }) => {

  const maxPercent = Math.max(...data.map((d) => d.percent)) || 1;

  return (
    <Box
      bgcolor="#fff"
      sx={{
        width: "100%",
        borderRadius: "6px",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
        position: 'relative',
        height: '100%',
        flexGrow: 1
      }}
    >
      {rank !== undefined && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'rgba(30, 136, 229, 1)',
            color: 'white',
            borderTopRightRadius: '4px',
            borderBottomLeftRadius: '4px',
            px: 1.5,
            py: 0.5,
            fontFamily: 'Roboto',
            fontSize: 12,
            fontWeight: 500,
            maxWidth: '100%',
            whiteSpace: 'nowrap',
            ...(rank !== undefined && {
              overflow: 'hidden',
              '&::before, &::after': {
                content: '""',
                position: 'absolute',
                backgroundRepeat: 'no-repeat',
                pointerEvents: 'none',
              },
              '&::before': {
                top: 0,
                right: 0,
                height: '1px',
                width: '100%',
                backgroundImage:
                  'linear-gradient(to left, rgba(30,136,229,1) 0%, rgba(30,136,229,0) 100%)',
              },
              '&::after': {
                top: 0,
                right: 0,
                width: '1px',
                height: '100%',
                backgroundImage:
                  'linear-gradient(to bottom, rgba(30,136,229,1) 0%, rgba(30,136,229,0) 100%)',
              },
            }),
          }}
        >
          <ArrowDropUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
          #{rank} Predictable field
        </Box>
      )}
      <Box
        bgcolor="#fff"
        p={2}
        sx={{
          width: "100%",
          display: 'flex',
          height: '100%',
          flexDirection: 'column',
          gap: 2
        }}>

        <Box
          sx={{
            width: '100%',
            justifyContent: 'space-between',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography className="dashboard-card-heading" >
            {title}
          </Typography>
        </Box>

        <Stack
          direction="row"
          justifyContent="space-around"
          alignItems="start"

          spacing={0}
        >
          {data.map(({ label, percent }, index) => {
            const relative = percent / maxPercent;

            return (
              <Box
                key={index}
                display="flex"
                flexDirection="column"
                alignItems="center"
                width={41}
              >
                {/* Bar container */}
                <Box
                  height={240}
                  width="100%"
                  borderRadius={5}
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
                      backgroundColor: getGradient(relative, gradientColor),
                      transition: "height 0.3s ease, background 0.3s ease",
                    }}
                  />
                </Box>

                {/* Bottom label (param name) */}
                <Typography
                  className="dashboard-gist-card-text"
                  sx={{
                    marginTop: 0.5,
                    textAlign: "center",
                    fontSize: 12,
                    textWrap: "wrap",
                  }}
                >
                  {label}
                </Typography>
                {/* Top label (percent) */}
                <Typography
                  className="dashboard-gist-card-text"
                  sx={{ marginBottom: 0.5 }}
                >
                  {percent}%
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
};
