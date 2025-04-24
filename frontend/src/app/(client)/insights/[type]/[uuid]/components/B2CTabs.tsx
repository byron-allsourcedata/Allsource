import { TabPanel } from "@/components/TabPanel";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { useState } from "react";
import B2CPersonal from "./B2CTabComponents/B2CPersonal";
import B2CLifestyle from "./B2CTabComponents/B2CLifestyle";

const B2CTabs = () => {
  const [tabIndex, setIndex] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
    setIndex(newIndex);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          position: "sticky",
          top: 82,
          zIndex: 100,
          backgroundColor: "#fff",
          justifyContent: "space-between",
          width: "98%",
          "@media (max-width: 600px)": {
            flexDirection: "column",
            display: "flex",
            alignItems: "flex-start",
            zIndex: 1,
            width: "100%",
            pr: 1.5,
          },
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            pt: 2,
            padding: "1rem 5rem 0rem",
            width: "100%",
            justifyContent: "start",
            alignItems: "start",
          }}
        >
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            variant="standard"
            sx={{
              minHeight: 0,
              display: "flex",
              alignItems: "start",
              padding: "2px",
              "& .MuiTabs-flexContainer": {
                gap: "4px",
              },
              "& .MuiTabs-indicator": {
                display: "none",
              },
            }}
          >
            <Tab
              label="Personal"
              className="tab-filled-button"
              sx={{
                mr: 2,
                "&.Mui-selected": {
                  backgroundColor: "rgba(246, 248, 250, 1)",
                  border: "1px solid rgba(117, 168, 218, 1)",
                  color: "rgba(32, 33, 36, 1)",
                },
              }}
            />
            <Tab
              label="Financial"
              className="tab-filled-button"
              sx={{
                mr: 2,
                "&.Mui-selected": {
                  backgroundColor: "rgba(246, 248, 250, 1)",
                  border: "1px solid rgba(117, 168, 218, 1)",
                  color: "rgba(32, 33, 36, 1)",
                },
              }}
            />
            <Tab
              label="Lifestyles"
              className="tab-filled-button"
              sx={{
                mr: 2,
                "&.Mui-selected": {
                  backgroundColor: "rgba(246, 248, 250, 1)",
                  border: "1px solid rgba(117, 168, 218, 1)",
                  color: "rgba(32, 33, 36, 1)",
                },
              }}
            />
            <Tab
              label="Voter"
              className="tab-filled-button"
              sx={{
                mr: 2,
                "&.Mui-selected": {
                  backgroundColor: "rgba(246, 248, 250, 1)",
                  border: "1px solid rgba(117, 168, 218, 1)",
                  color: "rgba(32, 33, 36, 1)",
                },
              }}
            />
          </Tabs>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <TabPanel value={tabIndex} index={0}>
          <B2CPersonal />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}></TabPanel>
        <TabPanel value={tabIndex} index={2}>
          <B2CLifestyle />
        </TabPanel>
        <TabPanel value={tabIndex} index={3}></TabPanel>
      </Box>
    </Box>
  );
};

export default B2CTabs;
