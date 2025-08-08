import Header from "@/app/(client)/components/Header";
import { HeaderView } from "@/app/(client)/components/HeaderView";
import Sidebar from "@/app/(client)/components/Sidebar";
import { SidebarView } from "@/app/(client)/components/SidebarView";
import { Column } from "@/components/Column";
import { Paper } from "@mui/material";
import type { FC } from "react";

type Props = {};

export const WhitelabelExample: FC<Props> = ({}) => {
	return (
		<Column
			height="100%"
			sx={{
				border: "1px solid #E4E4E4",
				borderRadius: "4px",
				display: "flex",
				background: "green",
				overflow: "hidden",
			}}
		>
			<HeaderView
				NewRequestNotification={false}
				NotificationData={null}
				onDismissNotification={() => {}}
				showActions={false}
			/>

			<Column
				height="20vh"
				// flex={100}
				sx={{
					background: "purple",
					justifyContent: "space-between",
					flexDirection: "column",
				}}
			>
				<Column
					sx={{
						display: "flex",
						flex: 1,
						minHeight: 0,
						flexDirection: "column",
						background: "purple",
					}}
				>
					<Column
						sx={{
							flex: 1,
							overflow: "auto",
							padding: 1,
							background: "white",
						}}
					>
						<Column
							sx={{ background: "green", height: "250px", flexShrink: 0 }}
						>
							Color box
						</Column>
						<Column sx={{ background: "yellow", height: "250px" }}>
							Color box
						</Column>
						<Column sx={{ background: "cyan", height: "250px" }}>
							Color box
						</Column>
						{/* Add more boxes to overflow */}
					</Column>

					<Column
						sx={{
							background: "blue",
							height: "50px",
							flexShrink: 0,
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						Value (Button)
					</Column>
				</Column>
			</Column>

			{/* <SidebarView
				showPartner={false}
				setShowSlider={() => {}}
				isGetStartedPage={true}
				loading={false}
				setLoading={() => {}}
				hasNotification={false}
				hasSubheader={false}
				showAdmin={false}
				navigate={() => {}}
			/> */}
		</Column>
	);
};
