import { SxProps, Theme } from "@mui/material";

export function getInteractiveSx(interactive: boolean): SxProps<Theme> {
  if (!interactive) return {};

  return {
    cursor: "pointer",
    border: "1px solid transparent",
    borderRadius: 1,
    boxSizing: "border-box",
    transition: "background-color .2s, border-color .2s, box-shadow .2s",
    ":hover": {
      backgroundColor: "rgba(246, 249, 255, 1)",
      borderColor: "rgba(1, 113, 248, 0.4)",
      boxShadow: "0px 2px 10px 0px rgba(0, 0, 0, 0.1)",
      "& .fiveth-sub-title": {
        color: "rgba(21, 22, 25, 1)",
      },
    },
  };
}

