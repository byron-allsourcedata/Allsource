import Header from "@/app/(client)/components/Header";
import { HeaderView } from "@/app/(client)/components/HeaderView";
import Sidebar from "@/app/(client)/components/Sidebar";
import { SidebarView } from "@/app/(client)/components/SidebarView";
import { ImportSourcePageView } from "@/app/features/sources/builder/pages/ImportSourcePage";
import { Column } from "@/components/Column";
import { Row } from "@/components/Row";
import { Paper } from "@mui/material";
import { useRef, type FC } from "react";

type Props = {};

export const WhitelabelExample: FC<Props> = ({}) => {
	const headerRef = useRef<HTMLDivElement | null>(null);

	const headerHeight = headerRef.current?.clientHeight ?? 0;
	return (
		<Column
			height="100%"
			sx={{
				border: "1px solid #E4E4E4",
				borderRadius: "4px",
				display: "flex",
				pointerEvents: "none",
				overflow: "hidden",
			}}
		>
			<HeaderView
				headerRef={headerRef}
				NewRequestNotification={false}
				NotificationData={null}
				onDismissNotification={() => {}}
				showActions={false}
			/>

			<Row height={`calc(100% - ${headerHeight}px)`} gap="1rem">
				<SidebarView
					height={"100%"}
					showPartner={false}
					setShowSlider={() => {}}
					isGetStartedPage={true}
					loading={false}
					setLoading={() => {}}
					hasNotification={false}
					hasSubheader={false}
					showAdmin={false}
					navigate={() => {}}
				/>
				<Column width="min(80vw, 1200px)" overflow="clip">
					<ImportSourcePageView
						smallIconSrc={"/logo-icon.svg"}
						loading={false}
						showGetStarted={false}
						hasNotification={false}
						changeSourceBuilderHint={() => {}}
						sourceType={"Customer Conversions"}
						handleChangeSourceType={() => {}}
						blockRefs={{
							block1: { current: null },
						}}
					/>
				</Column>
			</Row>
		</Column>
	);
};
