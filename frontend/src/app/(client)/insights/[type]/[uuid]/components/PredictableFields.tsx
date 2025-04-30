import { TabPanel } from "@/components/TabPanel";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { useState } from "react";
import FeatureListTable, { FeatureObject } from "./FeatureListTable";
import Link from "next/link";
import Categories from "./PredictableFieldsComponents/Categories";
import All from "./PredictableFieldsComponents/All";
import { SignificantFields } from '../page'

type PredictableFieldsTabProps = {
  data: SignificantFields;
};

const PredictableFields: React.FC<PredictableFieldsTabProps> = ({ data }) => {
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
          top: 50,
          zIndex: 100,
          backgroundColor: "#fff",
          justifyContent: "start",
          width: "100%",
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
            padding: "1rem",
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
              label="All"
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
              label="Categories"
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
          <All data={data} />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <Box sx={{ width: "100%", display: "flex" }}>
            <Categories data={data} />
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default PredictableFields;
