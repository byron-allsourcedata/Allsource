import { Box } from "@mui/material";

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  children,
  value,
  index,
  ...other
}) => {
  return (
    <div
      role="tabpanel"
      style={{ display: value === index ? "block" : "none" }}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box
          sx={{
            margin: 0,
            "@media (min-width: 1600px)": {
              paddingLeft: "4.25rem",
              paddingRight: "4.25rem",
            },
            "@media (max-width: 600px)": {
              paddingLeft: "0",
              paddingRight: "0",
            },
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
};
