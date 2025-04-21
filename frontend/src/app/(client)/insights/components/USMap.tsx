import { Box, Grid, Stack, Tooltip, Typography } from "@mui/material";
import { USAMap, USAStateAbbreviation } from "@mirawision/usa-map-react";
import { FC, useMemo, useState } from "react";

interface RegionData {
  label: string;
  percentage: number;
  fillColor: string;
  state: USAStateAbbreviation;
}

interface USHeatMapCardProps {
  title: string;
  regions: RegionData[];
}

export const allStateAbbreviations = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

const stateNameMap: Record<USAStateAbbreviation, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

const stateLabelCoords: Record<USAStateAbbreviation, { x: number; y: number }> =
  {
    AL: { x: 275, y: 180 },
    AK: { x: 50, y: 220 },
    AZ: { x: 84, y: 160 },
    AR: { x: 230, y: 165 },
    CA: { x: 30, y: 130 },
    CO: { x: 134, y: 125 },
    CT: { x: 363, y: 83 },
    DE: { x: 354, y: 113 },
    DC: { x: 340, y: 114.5 },
    FL: { x: 325, y: 225 },
    GA: { x: 310, y: 185 },
    HI: { x: 126, y: 246 },
    ID: { x: 80, y: 70 },
    IL: { x: 250, y: 115 },
    IN: { x: 273, y: 115 },
    IA: { x: 220, y: 100 },
    KS: { x: 185, y: 132 },
    KY: { x: 285, y: 137 },
    LA: { x: 230, y: 200 },
    ME: { x: 377, y: 45 },
    MD: { x: 345, y: 110 },
    MA: { x: 368, y: 74 },
    MI: { x: 280, y: 87 },
    MN: { x: 213, y: 60 },
    MS: { x: 253, y: 183 },
    MO: { x: 230, y: 135 },
    MT: { x: 120, y: 50 },
    NE: { x: 180, y: 105 },
    NV: { x: 55, y: 110 },
    NH: { x: 366.5, y: 64 },
    NJ: { x: 355, y: 102 },
    NM: { x: 124, y: 165 },
    NY: { x: 345, y: 75 },
    NC: { x: 330, y: 150 },
    ND: { x: 175, y: 50 },
    OH: { x: 295, y: 110 },
    OK: { x: 194, y: 161 },
    OR: { x: 40, y: 60 },
    PA: { x: 330, y: 100 },
    RI: { x: 373, y: 82 },
    SC: { x: 320, y: 170 },
    SD: { x: 175, y: 77 },
    TN: { x: 275, y: 155 },
    TX: { x: 180, y: 200 },
    UT: { x: 90, y: 120 },
    VT: { x: 358, y: 60 },
    VA: { x: 335, y: 130 },
    WA: { x: 50, y: 30 },
    WV: { x: 312, y: 126 },
    WI: { x: 243, y: 75 },
    WY: { x: 125, y: 85 },
  };

const EASTERN_STATES: USAStateAbbreviation[] = [
  "NH",
  "VT",
  "MA",
  "RI",
  "CT",
  "NJ",
  "DE",
  "MD",
  "DC",
];

export const USHeatMapCard: FC<USHeatMapCardProps> = ({ title, regions }) => {
  const defaultColor = "rgba(199, 228, 255, 1)";

  const customStates = useMemo(() => {
    const filled: Record<USAStateAbbreviation, string> = {};

    // сначала все штаты по дефолту
    allStateAbbreviations.forEach((abbr) => {
      filled[abbr] = defaultColor;
    });

    // перезаписываем нужные
    regions.forEach((region) => {
      if (region.state) {
        filled[region.state as USAStateAbbreviation] = region.fillColor;
      }
    });

    // приводим к виду customStates
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
      p={2}
      borderRadius={2}
      boxShadow={1}
      sx={{
        backgroundColor: "#fff",
        borderRadius: "6px",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Typography className="dashboard-card-heading" mb={2}>
        {title}
      </Typography>

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
        <Box sx={{ width: "406px", height: "263px", position: "relative" }}>
          <USAMap
            customStates={customStates}
            mapSettings={{
              width: "100%",
              height: "100%",
            }}
          />
          <svg
            width={406}
            height={263}
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
                          ? `${percentagesMap[state as USAStateAbbreviation]} ${
                              stateNameMap[state as USAStateAbbreviation] ||
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
          {regions.map((region, index) => (
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
  );
};
