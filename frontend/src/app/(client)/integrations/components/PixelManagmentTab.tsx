import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import { Box, Tab, Typography } from "@mui/material";
import { useState } from "react";
import { integrationsStyle } from "../integrationsStyle";
import TabPanel from "@mui/lab/TabPanel";
import CustomTooltip from "@/components/customToolTip";
import DataSyncList from "@/app/(client)/data-sync/components/DataSyncList";
import RevenueTracking from "@/components/RevenueTracking";

//second tab on old version page
export const PixelManagment = () => {
	const [value, setValue] = useState("1");
	const [filters, setFilters] = useState<any>();

	const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
		setValue(newValue);
	};
	return (
		<Box sx={{ flexGrow: 1, overflow: "auto", width: "100%", pr: "12px" }}>
			<TabContext value={value}>
				<TabList
					centered
					aria-label="Integrations Tabs"
					TabIndicatorProps={{
						sx: { backgroundColor: "rgba(56, 152, 252, 1)" },
					}}
					sx={{
						textTransform: "none",
						minHeight: 0,
						"& .MuiTabs-indicator": {
							backgroundColor: "rgba(56, 152, 252, 1)",
							height: "1.4px",
						},
						"@media (max-width: 600px)": {
							border: "1px solid rgba(228, 228, 228, 1)",
							borderRadius: "4px",
							width: "100%",
							"& .MuiTabs-indicator": {
								height: "0",
							},
						},
					}}
					onChange={handleTabChange}
				>
					<Tab
						label="Pixel Configuration"
						value="1"
						sx={{ ...integrationsStyle.tabHeading }}
					/>
					<Tab
						label="Data syncs"
						value="2"
						sx={{ ...integrationsStyle.tabHeading }}
					/>
				</TabList>
				<TabPanel value="2">
					<Box
						sx={{
							mt: "1rem",
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							margin: 0,
							"@media (max-width: 600px)": { mb: 2 },
						}}
					>
						{/* Title and Tooltip */}
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Typography
								className="first-sub-title"
								sx={{
									fontFamily: "var(--font-nunito)",
									fontSize: "16px",
									lineHeight: "normal",
									fontWeight: 600,
									color: "#202124",
								}}
							>
								Connections Details
							</Typography>
							<CustomTooltip
								title={
									"How data sync works and to customise your sync settings"
								}
								linkText="Learn more"
								linkUrl="https://allsourcedata.io"
							/>
						</Box>
					</Box>
					<Box>
						<DataSyncList filters={filters} />
					</Box>
				</TabPanel>
				<TabPanel value="1">
					{/* <PixelInstallation />
          <VerifyPixelIntegration /> */}
					<RevenueTracking />
				</TabPanel>
			</TabContext>
		</Box>
	);
};
