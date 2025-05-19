import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { FeatureObject, Props } from "@/types";

const formatKey = (k: string) =>
  k
    .replace(/_/g, " ")
    .replace(/(?!^)([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

export interface RecommendedBadgeProps {
  text?: string;
}

export function RecommendedBadge({ text = "Recommended" }: RecommendedBadgeProps) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: "rgba(234, 248, 221, 1)",
        color: "rgba(43, 91, 0, 1)",
        borderRadius: 1,
        px: 1,
        py: 0.5,
      }}
    >
      <Typography
        variant="caption"
        fontWeight={400}
        sx={{ fontSize: "12px" }}
      >
        {text}
      </Typography>
    </Box>
  );
}

export function UnRecommendedBadge({ text = "No recommended fields" }: RecommendedBadgeProps) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: "rgba(231, 231, 231, 1)",
        color: "rgba(95, 99, 104, 1)",
        borderRadius: 1,
        px: 1,
        py: 0.5,
      }}
    >
      <Typography
        variant="caption"
        fontWeight={400}
        sx={{ fontSize: "12px" }}
      >
        {text}
      </Typography>
    </Box>
  );
}

export function FeatureImportanceTable<T extends FeatureObject>({
  features,
  initialFeatures,
  onChangeDisplayed,
  title,
  columnHeaders = ["Attribute name", "Predictable value"],
  headerIcon,
  customStyles,
}: Props<T>) {
  const theme = useTheme();
  const allPairs = useMemo<[keyof T, number][]>(
    () =>
      Object.entries(features)
        .map(([k, v]) => [k as keyof T, v] as [keyof T, number])
        .sort((a, b) => b[1] - a[1]),
    [features]
  );
  const [selectedKeys, setSelectedKeys] = useState<(keyof T)[]>(initialFeatures);
  const [expanded, setExpanded] = useState(false);
  const handleAccordionChange = (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };
  const onOptionToggle = (key: keyof T) => {
    setSelectedKeys(prev => {
      const newSelected = prev.includes(key)
        ? prev.filter(x => x !== key)
        : [...prev, key];
      return newSelected;
    });
  };

  useEffect(() => {
    if (onChangeDisplayed) {
      onChangeDisplayed(selectedKeys);
    }
  }, [selectedKeys]);
  return (
    <Accordion
      disableGutters
      onChange={handleAccordionChange}
      elevation={0}
      sx={{
        border: "1px solid rgba(208, 213, 221, 1)",
        borderRadius: 1,
        "&:not(:last-child)": { mb: 0 },
      }}
    >
      <AccordionSummary
        sx={{
          flexDirection: "row-reverse",
          "& .MuiAccordionSummary-content": { m: 0 },
          px: 1.5,
          py: 0.75,
        }}
      >
        <Grid container alignItems="center">
          <Grid item xs={8} sm={5}>
            <Box display="flex" alignItems="left" >
            {headerIcon && (
              <Box sx={{mr: 1}}>
                {headerIcon}
              </Box>
          )}
          <Typography variant="body1">{title}</Typography>
            </Box>
          </Grid>
          <Grid item xs={2} sm={4}>
            {initialFeatures.length === 0 ? (
              <UnRecommendedBadge />
            ):
            (
              <RecommendedBadge text={`${initialFeatures.length} fields recommended`} />
            )}
          </Grid>
          <Grid
            item xs={4} sm={3}
          >
            <Box sx={{
              textAlign: "right",
              p: 0,
              m: 0
            }}>
            <Typography
                component="a"
                href="#"
                sx={{
                  fontSize: "14px",
                  color: "rgba(56, 152, 252, 1)",
                  textDecoration: "underline",
                  cursor: "pointer",
                  display: "inline-block",
                }}
              >
                {expanded ? "Hide" : "View"}
              </Typography>
            </Box>
            
          </Grid>
        </Grid>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 4, pt: 1 }}>
        <Box sx={{}}>
          <Grid
            container
            alignItems="center"
            columnSpacing={1}
            sx={{
              p: "4px 0",
              pl: 0,
              borderBottom: "1px solid #E4E4E4",
              fontWeight: 500,
            }}
          >
            <Grid item xs={8} sm={6}>
              <Typography variant="body2" fontWeight={500} textAlign="left">
                {columnHeaders[0]}
              </Typography>
            </Grid>
            <Grid item xs={2} sm={2}>
              <Typography variant="body2" fontWeight={500} textAlign="center">
                {/* Badge */}
              </Typography>
            </Grid>
            <Grid item xs={4} sm={4}>
              <Typography variant="body2" fontWeight={500} textAlign="right">
                {columnHeaders[1]}
              </Typography>
            </Grid>
          </Grid>
          {allPairs.map(([k, v]) => {
            const checked = selectedKeys.includes(k);
            const displayValue = `${(v * 100).toFixed(2)}%`;
            const isRecommended = initialFeatures.includes(String(k));
            return (
              <Grid
                container
                key={String(k)}
                alignItems="center"
                columnSpacing={1}
                sx={{
                  p: "4px 0",
                  borderBottom: "1px solid #E4E4E4",
                  cursor: "pointer"
                }}
                onClick={() => onOptionToggle(k)}
              >
                <Grid item xs={8} sm={1}>
                  <Checkbox
                    checked={checked}
                    onChange={() => onOptionToggle(k)}
                    size="small"
                    sx={{
                      pl: 0,
                      fontSize: "12px",
                      "&.Mui-checked": {
                        color: "rgba(56, 152, 252, 1)",
                      },
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                </Grid>
                <Grid item xs={8} sm={4}>
                  <Typography variant="body2">
                    {formatKey(String(k))}
                  </Typography>
                </Grid>
                <Grid item xs={8} sm={4}>
                {isRecommended && (
                  <Grid item xs={4} sm={4} textAlign="center">
                    <RecommendedBadge text="Recommended" />
                  </Grid>
                )}
                </Grid>
                <Grid item xs={8} sm={3} sx={{textAlign: "right"}}>
                  <Typography variant="body2">{displayValue}</Typography>
                </Grid>
              </Grid>
            );
          })}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
