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

export function FeatureImportanceTable<T extends FeatureObject>({
  features,
  title,
  onChangeDisplayed,
  columnHeaders = ["Field", "Importance"],
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
      ? "rgba(80, 82, 178, 1)"
      : theme.palette.text.disabled;

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: "#E4E4E4",
        borderRadius: 1,
        mb: 0,
        "&:not(:last-child)": { mb: 0 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          flexDirection: "row-reverse",
          "& .MuiAccordionSummary-content": { m: 0 },
          px: 1.5,
          py: 0.75,
        }}
      >
        <Grid container alignItems="center" sx={{ maxWidth: 600 }}>
          <Grid item sx={{ width: 40, flexShrink: 0 }} />
          <Grid item sx={{ flexBasis: 350, maxWidth: 350, flexShrink: 0 }}>
            <Typography variant="body1">{title}</Typography>
          </Grid>
          <Grid
            item
            sx={{
              flexBasis: 155,
              maxWidth: 155,
              flexShrink: 0,
              textAlign: "left",
            }}
          >
            <Typography variant="body1" sx={{ color: headerColor }}>
              {`${selectedKeys.length}/${allPairs.length} fields selected`}
            </Typography>
          </Grid>
          <Grid item sx={{ ml: "auto" }} />
        </Grid>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Box sx={{ pt: 2, px: 2, pb: 0 }}>
          <Grid
            container
            alignItems="center"
            columnSpacing={1}
            sx={{
              p: "4px 16px",
              borderBottom: "1px solid #E4E4E4",
              fontWeight: 500,
              maxWidth: 600,
            }}
          >
            <Grid item sx={{ width: 40, flexShrink: 0 }} />
            <Grid item sx={{ flexBasis: 350, maxWidth: 350, flexShrink: 0 }}>
              <Typography variant="body2" fontWeight={600}>
                {columnHeaders[0]}
              </Typography>
            </Grid>
            <Grid item sx={{ flexBasis: 120, maxWidth: 120, flexShrink: 0 }}>
              <Typography variant="body2" fontWeight={600}>
                {columnHeaders[1]}
              </Typography>
            </Grid>
            <Grid item sx={{ ml: "auto" }} />
          </Grid>
          {allPairs.map(([k, v]) => {
            const checked = selectedKeys.includes(k);
            const displayValue = `${(v * 100).toFixed(2)}%`;
            return (
              <Grid
                container
                key={String(k)}
                alignItems="center"
                columnSpacing={1}
                sx={{
                  p: "4px 16px",
                  borderBottom: "1px solid #E4E4E4",
                  maxWidth: 600,
                  cursor: "pointer"
                }}
                onClick={() => onOptionToggle(k)}
              >
                <Grid item sx={{ width: 40, flexShrink: 0 }}>
                  <Checkbox
                    checked={checked}
                    onChange={() => onOptionToggle(k)}
                    size="small"
                    sx={{
                      fontSize: "12px",
                      "&.Mui-checked": {
                        color: "rgba(80, 82, 178, 1)",
                      },
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                </Grid>
                <Grid item sx={{ flexBasis: 350, maxWidth: 350, flexShrink: 0 }}>
                  <Typography variant="body2">
                    {formatKey(String(k))}
                  </Typography>
                </Grid>
                <Grid item sx={{ flexBasis: 120, maxWidth: 120, flexShrink: 0 }}>
                  <Typography variant="body2">{displayValue}</Typography>
                </Grid>
                <Grid item sx={{ ml: "auto" }} />
              </Grid>
            );
          })}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
