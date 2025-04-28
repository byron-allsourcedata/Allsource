import { TabPanel } from "@/components/TabPanel";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { useState } from "react";
import B2CPersonal from "./B2CTabComponents/B2CPersonal";
import B2CLifestyle from "./B2CTabComponents/B2CLifestyle";
import B2CVoter from "./B2CTabComponents/B2CVoter";
import B2CFinancial from "./B2CTabComponents/B2CFinancial";

interface B2CData {
  personal_info: Record<string, any>;
  financial: Record<string, any>;
  lifestyle: Record<string, any>;
  voter: Record<string, any>;
}

interface B2CTabsProps {
  data: B2CData;
}
const B2CTabs: React.FC<B2CTabsProps> = ({ data }) => {
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
          <B2CPersonal
            data={{
              gender: data.personal_info.gender || {},
              state: data.personal_info.state || {},
              religion: data.personal_info.religion || {},
              age: data.personal_info.age || {},
              ethnicity: data.personal_info.ethnicity || {},
              languages: data.personal_info.languages || {},
              education_level: data.personal_info.education_level || {},
              have_children: data.personal_info.have_children || {},
              marital_status: data.personal_info.marital_status || {},
              homeowner: data.personal_info.homeowner || {},
            }}
            pets_data={data.lifestyle.own_pets}
          />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <B2CFinancial data={data.financial} />
        </TabPanel>
        <TabPanel value={tabIndex} index={2}>
          <B2CLifestyle data={data.lifestyle} />
        </TabPanel>
        <TabPanel value={tabIndex} index={3}>
          <B2CVoter data={data.voter} />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default B2CTabs;
