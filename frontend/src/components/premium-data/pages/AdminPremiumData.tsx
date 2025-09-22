"use client";

import { Column } from "@/components/Column";
import {
	Breadcrumbs,
	Drawer,
	Skeleton,
	styled,
	ThemeProvider,
	Typography,
} from "@mui/material";
import { useEffect, useState, type FC, type SetStateAction } from "react";
import { AddButton } from "../AddButton";
import { PremiumDataList } from "@/app/features/premium-data/components/PremiumDataList";
import { AddPremiumSource } from "../../../app/features/premium-data/drawers/AddPremiumData";
import { premiumDataTheme } from "@/app/(client)/premium-data/theme";
import { useAxios } from "@/axios/axiosInterceptorInstance";
import { useCardMenu } from "../hooks/useCardMenu";
import {
	useAdminDeletePremiumData,
	useAdminGetPremiumData,
} from "@/app/features/premium-data/requests";
import { useParams, useRouter } from "next/navigation";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import { RenamePremiumSourceDrawer } from "@/app/features/premium-data/drawers/RenamePremiumSourceDrawer";

const T = Typography;

type AdminBreadcrumbsProps = {
	username?: string;
	name_loading?: boolean;
	onAccountsClick: () => void;
};

const AdminBreadcrumbs: FC<AdminBreadcrumbsProps> = ({
	username,
	onAccountsClick,
}) => {
	return (
		<Breadcrumbs separator=">">
			<T
				onClick={onAccountsClick}
				sx={{
					cursor: "pointer",
					"&:hover": {
						textDecoration: "underline",
					},
				}}
			>
				Accounts
			</T>
			{username ? <T>{username}</T> : <Skeleton width="6rem" />}
		</Breadcrumbs>
	);
};

export const AdminPremiumData: FC = () => {
	const router = useRouter();
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [activeDrawer, setActiveDrawer] = useState<
		"add" | "rename" | undefined
	>("add");

	const openDrawer = () => setDrawerOpen(true);
	const closeDrawer = () => setDrawerOpen(false);

	const urlParams = useParams();
	const userId = Number(urlParams.userId as string);

	const [{ data: userData, loading, error }, refetch] =
		useAdminGetPremiumData(userId);

	useEffect(() => {
		refetch().catch(() => {});
	}, []);

	const sources = userData?.premium_sources;

	const { delete: deleteSource } = useAdminDeletePremiumData();

	const onPremiumSourceDeletion = (sourceId: string) => {
		deleteSource(sourceId)
			.then(() => {
				refetch();
				showToast("Premium source deleted successfully");
			})
			.catch((e) => {
				showErrorToast("Error while deleting Premium Data");
			});
	};
	const onPremiumSourceAdded = () => {
		refetch();
		closeDrawer();
	};

	const navigateToAccounts = () => {
		router.push("/admin/users");
	};

	const menuProps = useCardMenu();

	const [activeSourceId, setActiveSourceId] = useState<number | null>(-1);

	const drawers = {
		add: (
			<AddPremiumSource
				userId={userId}
				onClose={closeDrawer}
				onDone={onPremiumSourceAdded}
			/>
		),
		rename: (
			<RenamePremiumSourceDrawer
				premiumSourceId={""}
				initialName={""}
				onClose={closeDrawer}
			/>
		),
	};

	return (
		<ThemeProvider theme={premiumDataTheme}>
			<Container>
				<AdminBreadcrumbs
					username={userData?.user_name}
					onAccountsClick={navigateToAccounts}
				/>
				<PageTitle>Premium Data</PageTitle>
				<AddButton onClick={openDrawer} />
				{sources && sources.length > 0 && (
					<PremiumDataList
						sources={sources}
						menuProps={menuProps}
						selectedSourceIdx={activeSourceId || -1}
						onDelete={(source) => onPremiumSourceDeletion(source.id)}
						setSelectedSourceIdx={setActiveSourceId}
					/>
				)}
				<Drawer open={drawerOpen} onClose={closeDrawer}>
					{activeDrawer && drawers[activeDrawer]}
				</Drawer>
			</Container>
		</ThemeProvider>
	);
};

const PageTitle = styled(T)`
	color: #202124;
	font-size: 19px;
	font-weight: 700;
`;

const Container = styled(Column)`
	padding: 1.5rem 1.5rem 3rem 1.5rem;
	gap: 1rem;
`;
