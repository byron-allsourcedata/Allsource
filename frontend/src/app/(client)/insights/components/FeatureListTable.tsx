import React, { useMemo } from "react";
import {
  Box,
  Grid,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export type FeatureObject = Record<string, number>;

interface Props<T extends FeatureObject> {
  features: T;
  title: string;
  columnHeaders?: [string, string];
}

const formatKey = (k: string) =>
  k
    .replace(/_/g, " ")
    .replace(/(?!^)([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

function FeatureListTable<T extends FeatureObject>({
  features,
  title,
  columnHeaders = ["Field", "Importance"],
}: Props<T>) {
  const theme = useTheme();

  const allPairs = useMemo(
    () =>
      Object.entries(features)
        .map(([k, v]) => [k as keyof T, v] as [keyof T, number])
        .sort((a, b) => b[1] - a[1]),
    [features]
  );

  return (
    <Accordion disableGutters elevation={0} sx={{ mb: 2 }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          flexDirection: "row-reverse",
          px: 2,
          py: 1,
        }}
      >
        <Grid container alignItems="center" sx={{ width: "100%" }}>
          <Grid item xs>
            <Typography variant="body2">{title}</Typography>
          </Grid>
          <Grid item>
          </Grid>
        </Grid>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        <Box sx={{ pt: 2, px: 2, pb: 2 }}>
          <Grid
            container
            alignItems="center"
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              pb: 1,
              mb: 1,
            }}
          >
            <Grid item xs={8}>
              <Typography variant="body2" fontWeight={600}>
                {columnHeaders[0]}
              </Typography>
            </Grid>
            <Grid item xs={4} textAlign="left">
              <Typography variant="body2" fontWeight={600}>
                {columnHeaders[1]}
              </Typography>
            </Grid>
          </Grid>

          {allPairs.map(([k, v]) => (
            <Grid
              container
              key={String(k)}
              alignItems="center"
              sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
                py: 1,
              }}
            >
              <Grid item xs={8}>
                <Typography variant="body2">{formatKey(String(k))}</Typography>
              </Grid>
              <Grid item xs={4} textAlign="left">
                <Typography variant="body2">
                  {(v * 100).toFixed(1)}%
                </Typography>
              </Grid>
            </Grid>
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

export default FeatureListTable;
