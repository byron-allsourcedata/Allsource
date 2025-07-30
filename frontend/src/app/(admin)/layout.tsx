"use client";
import React, { ReactNode } from "react";
import { Grid, Box } from "@mui/material";
import HeaderAdmin from "./components/HeaderAdmin";
import AdminSidebar from "./components/SidebarAdmin";

interface AdminLayoutProps {
	children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
	return (
		<>
			<Box
				sx={{
					height: "100vh",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<HeaderAdmin NewRequestNotification={false} />
				<Grid
					container
					sx={{
						display: "flex",
						flexWrap: "nowrap",
						flex: "1 1 auto",
						minHeight: 0,
					}}
				>
					<Grid
						item
						xs={12}
						md="auto"
						lg="auto"
						sx={{
							padding: "0px",
							display: { xs: "none", md: "block" },
							flexBasis: "170px",
							minWidth: "170px",
							maxWidth: "170px",
							position: "sticky",
							top: 0,
							alignSelf: "flex-start",
							height: "calc(100vh - 68px)",
							overflowY: "auto",
						}}
					>
						<AdminSidebar />
					</Grid>
					<Grid
						item
						xs={12}
						md
						lg
						sx={{
							position: "relative",
							flexGrow: 1,
							padding: "0px 0px 12px 12px",
							minWidth: 0,
							overflowY: "auto",
							height: "100%",
						}}
					>
						{children}
					</Grid>
				</Grid>
			</Box>
		</>
	);
};

export default AdminLayout;
