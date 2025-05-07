import { Box, Grid, Stack, Tooltip, Typography } from "@mui/material";
import { USAMap, USAStateAbbreviation } from "@mirawision/usa-map-react";
import { FC, useMemo, useState } from "react";
import {
  allStateAbbreviations,
  stateNameMap,
  stateLabelCoords,
  EASTERN_STATES,
} from "./constants/USAdata";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";

interface RegionData {
  label: string;
  percentage: number;
  fillColor: string;
  state: USAStateAbbreviation;
}

interface USHeatMapCardProps {
  title: string;
  regions: RegionData[];
  rank?: number;
}

export const USHeatMapCard: FC<USHeatMapCardProps> = ({ title, regions, rank }) => {
  const defaultColor = "rgba(199, 228, 255, 1)";

  const customStates = useMemo(() => {
    const filled: Record<USAStateAbbreviation, string> = {};

    allStateAbbreviations.forEach((abbr) => {
      filled[abbr] = defaultColor;
    });

    regions.forEach((region) => {
      if (region.state) {
        filled[region.state as USAStateAbbreviation] = region.fillColor;
      }
    });

    const map: Record<USAStateAbbreviation, { fill: string }> = {};
    for (const state in filled) {
      map[state as USAStateAbbreviation] = {
        fill: filled[state as USAStateAbbreviation],
      };
    }

    return map;
  }, [regions]);

  const percentagesMap = Object.fromEntries(
    regions.map((r) => [r.state, `${r.percentage}%`])
  );

  const [hoveredState, setHoveredState] = useState<USAStateAbbreviation | null>(
    null
  );

  return (
    <Box
      bgcolor="#fff"
      sx={{
        width: "100%",
        borderRadius: "6px",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
        position: 'relative'
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
          }}
        >
          <ArrowDropUpIcon sx={{ fontSize: 16, mr: 0.5, p: 0, }} />
          #{rank} Predictable field
        </Box>
      )}
      <Box
        bgcolor="#fff"
        p={3}
        sx={{
          width: "100%"
        }}>

        <Box
          sx={{
            width: "100%",
            borderRadius: "8px",
            overflow: "hidden",
            alignItems: "center",
            display: "flex",
            justifyContent: "center",
            mb: 2,
          }}
        >
          <Box sx={{ width: "707px", height: "458px", position: "relative" }}>
            <USAMap
              customStates={customStates}
              mapSettings={{
                width: "100%",
                height: "100%",
              }}
            />
            <svg
              width={707}
              height={458}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
              }}
            >
              {Object.entries(stateLabelCoords).map(([state, coord]) => {
                const isEastern = EASTERN_STATES.includes(
                  state as USAStateAbbreviation
                );
                return (
                  <Tooltip
                    key={state}
                    componentsProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: "#fff",
                          color: "#000",
                          boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.12)",
                          border: " 0.2px solid rgba(255, 255, 255, 1)",
                          borderRadius: "4px",
                          maxHeight: "100%",
                          maxWidth: "500px",
                        },
                      },
                    }}
                    title={
                      <Box
                        sx={{
                          backgroundColor: "#fff",
                          margin: 0,
                          padding: 0,
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          className="table-data"
                          component="div"
                          sx={{ fontSize: "12px !important" }}
                        >
                          {state && percentagesMap[state as USAStateAbbreviation]
                            ? `${percentagesMap[state as USAStateAbbreviation]} ${stateNameMap[state as USAStateAbbreviation] ||
                            (state === "DC" ? "District of Columbia" : state)
                            }`
                            : state
                              ? stateNameMap[state as USAStateAbbreviation] ||
                              (state === "DC" ? "District of Columbia" : state)
                              : "District of Columbia"}
                        </Typography>
                      </Box>
                    }
                    arrow
                  >
                    <text
                      x={coord.x}
                      y={coord.y}
                      textAnchor="middle"
                      fontSize={isEastern ? "7" : "10"}
                      fill="#000"
                      onMouseEnter={() =>
                        setHoveredState(state as USAStateAbbreviation)
                      }
                      onMouseLeave={() => setHoveredState(null)}
                      style={{ pointerEvents: "all", cursor: "default" }}
                    >
                      {state}
                    </text>
                  </Tooltip>
                );
              })}
            </svg>
          </Box>
        </Box>

        <Box>
          <Grid container spacing={1}>
            {[...regions]
              .sort((a, b) => b.percentage - a.percentage)
              .slice(0, 5)
              .map((region, index) => (
                <Grid item xs={3.5} key={index}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <Box
                      width={12}
                      height={12}
                      borderRadius="50%"
                      sx={{ backgroundColor: region.fillColor }}
                    />
                    <Typography
                      className="dashboard-card-text"
                      sx={{ fontWeight: 500 }}
                    >
                      {region.percentage}%
                    </Typography>
                    <Typography className="dashboard-card-text">
                      {region.label}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};
