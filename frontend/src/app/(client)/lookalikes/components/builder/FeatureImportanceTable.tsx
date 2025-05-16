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
import { useResetContext } from "@/context/ResetContext";

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
  title,
  onChangeDisplayed,
  columnHeaders = ["Attribute name", "Predictable value"],
  headerIcon,
  customStyles,
}: Props<T>) {
  const theme = useTheme();
  const { resetTrigger, notifyInteraction } = useResetContext();
  const allPairs = useMemo<[keyof T, number][]>(
    () =>
      Object.entries(features)
        .map(([k, v]) => [k as keyof T, v] as [keyof T, number])
        .sort((a, b) => b[1] - a[1]),
    [features]
  );

  const nonZeroPairs = useMemo<[keyof T, number][]>(
    () => allPairs.filter(([, v]) => v > 0),
    [allPairs]
  );

  const maxSelectable = useMemo<number>(
    () => Math.min(allPairs.length, 14),
    [nonZeroPairs.length]
  );

  const initialSelected = useMemo<(keyof T)[]>(
    () => nonZeroPairs.slice(0, maxSelectable).map(([k]) => k),
    [nonZeroPairs, maxSelectable]
  );

  const initialSelectedRef = useRef<(keyof T)[]>(initialSelected);

  const [selectedKeys, setSelectedKeys] = useState<(keyof T)[]>(initialSelected);

  useEffect(() => {
    setSelectedKeys(initialSelectedRef.current);
  }, [resetTrigger]);

  useEffect(() => {
    setSelectedKeys(initialSelected);
  }, [initialSelected]);

  useEffect(() => {
    if (onChangeDisplayed) {
      onChangeDisplayed(selectedKeys);
    }
  }, [selectedKeys]);
  const arraysEqual = (a: any[], b: any[]) => {
    if (a.length !== b.length) return false;
    const setB = new Set(b);
    return a.every(x => setB.has(x));
  };
  

  const onOptionToggle = (key: keyof T) => {
    setSelectedKeys(prev => {
      const newSelected = prev.includes(key)
        ? prev.filter(x => x !== key)
        : [...prev, key];
      const isBackToDefault = arraysEqual(newSelected, initialSelectedRef.current);
      notifyInteraction(title, isBackToDefault);
      return newSelected;
    });
  };

  const headerColor =
    selectedKeys.length > 0
      ? "rgba(56, 152, 252, 1)"
      : theme.palette.text.disabled;

  const [expanded, setExpanded] = useState(false);
  const handleAccordionChange = (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };

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
            {initialSelectedRef.current.length === 0 ? (
              <UnRecommendedBadge />
            ):
            (
              <RecommendedBadge text={`${initialSelectedRef.current.length} fields recommended`} />
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
            const isRecommended = initialSelectedRef.current.includes(k);
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
