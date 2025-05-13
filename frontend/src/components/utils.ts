import { SxProps, Theme } from "@mui/material";

export function getInteractiveSx(interactive: boolean): SxProps<Theme> {
  if (!interactive) return {};

  return {
    cursor: "pointer",
    transition: "background-color .2s, border-color .2s",
    "&:hover": {
      backgroundColor: "rgba(232, 239, 255, 0.4)",
      border: "1px solid rgba(1, 113, 248, 0.5)",
      "& .fiveth-sub-title": {
        color: "rgba(21, 22, 25, 1)",
      },
    },
  };
}
