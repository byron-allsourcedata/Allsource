import { TabPanel } from "@/components/TabPanel";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { useState } from "react";
import B2CPersonal from "./B2CTabComponents/B2CPersonal";
import B2CLifestyle from "./B2CTabComponents/B2CLifestyle";
import B2BProfessional from "./B2BTabComponents/B2BProfessional";
import B2BEmployment from "./B2BTabComponents/B2BEmployment";
import B2BEducation from "./B2BTabComponents/B2BEducation";
import { B2BData } from "../page";

type B2BTabsProps = {
  data: B2BData;
};
const B2BTabs: React.FC<B2BTabsProps> = ({ data }) => {
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
          top: 95,
          zIndex: 100,
          pt: 2,
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
            mt: 2,
            width: "100%",
            padding: "0rem 5rem 0rem",
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
              alignItems: "center",
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
              label="Professional"
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
              label="Education"
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
              label="Employment"
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
          <B2BProfessional data={data.professional_profile} />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <B2BEducation data={data.education} />
        </TabPanel>
        <TabPanel value={tabIndex} index={2}>
          <B2BEmployment data={data.employment_history} />
        </TabPanel>
        <TabPanel value={tabIndex} index={3}></TabPanel>
      </Box>
    </Box>
  );
};

export default B2BTabs;
