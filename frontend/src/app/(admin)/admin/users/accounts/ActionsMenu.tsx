import { showErrorToast, showToast } from "@/components/ToastNotification";
import {
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	type PopoverProps,
} from "@mui/material";
import { ArrowRightIcon } from "@mui/x-date-pickers";
import { useState } from "react";
import { ConfirmPlanChangeDialog } from "./ConfirmPlanChangeDialog";
import MakePartnerPopup from "../components/MakePartnerPopup";

import axiosInstance from "@/axios/axiosInterceptorInstance";

type Props = {
	anchorEl: PopoverProps["anchorEl"];
	handleClose: () => void;
	userId: number;
	currentPlanAlias: string;
	user: {
		name: string;
		email: string;
		joinDate: string;
	};
	onPlanChanged: () => void;
	isPartnerTab: boolean;
	isMaster: boolean;
	actionsLoading?: boolean;
	enableWhitelabel?: () => void;
	disableWhitelabel?: () => void;
	whitelabelEnabled?: boolean;
};

export const ActionsMenu: React.FC<Props> = ({
	anchorEl,
	handleClose,
	userId,
	currentPlanAlias,
	user,
	onPlanChanged,
	isPartnerTab,
	isMaster,
	actionsLoading,
	whitelabelEnabled,
	enableWhitelabel,
	disableWhitelabel,
}) => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
	const [submenuAnchorEl, setSubmenuAnchorEl] = useState<null | HTMLElement>(
		null,
	);
	const [partnerPopupOpen, setPartnerPopupOpen] = useState(false);
	const [partnerPopupIsMaster, setPartnerPopupIsMaster] =
		useState<boolean>(false);

	const handleOpenSubmenu = (event: React.MouseEvent<HTMLElement>) => {
		setSubmenuAnchorEl(event.currentTarget);
	};

	const handleCloseSubmenu = () => {
		setSubmenuAnchorEl(null);
	};

	const handleOpenPartnerPopup = (isMaster: boolean) => {
		handleCloseSubmenu();
		handleClose();
		setPartnerPopupIsMaster(isMaster);
		setPartnerPopupOpen(true);
	};

	const handleClosePartnerPopup = () => {
		setPartnerPopupOpen(false);
	};

	const changeUserPlan = async (planAlias: string) => {
		try {
			const response = await axiosInstance.post("/admin/change_plan", {
				user_id: userId,
				plan_alias: planAlias,
			});

			if (response.data?.success) {
				showToast(response.data.message || "Successfully updated plan");
			} else {
				showErrorToast(response.data.message || "Failed to update plan");
			}

			return response.data;
		} catch (error) {
			showErrorToast("Error while updating plan");
			console.error("Error", error);
		}
	};

	const onPlanClick = (plan: string) => {
		const planMap: Record<string, string> = {
			Basic: "basic",
			Pro: "pro",
			"Smart Audience": "smart_audience_monthly",
		};

		const planAlias = planMap[plan];
		if (planAlias !== currentPlanAlias) {
			setSelectedPlan(plan);
			setDialogOpen(true);
		}
	};

	const handleConfirmPlanChange = async () => {
		if (!selectedPlan) return;

		const planMap: Record<string, string> = {
			Basic: "basic",
			Pro: "pro",
			"Smart Audience": "smart_audience_monthly",
		};
		const alias = planMap[selectedPlan];

		await changeUserPlan(alias);
		onPlanChanged();
		setDialogOpen(false);
		setSelectedPlan(null);
		handleClose();
	};

	const toggleWhitelabel = () => {
		if (whitelabelEnabled) {
			disableWhitelabel?.();
		} else {
			enableWhitelabel?.();
		}
	};

	return (
		<>
			<Menu
				open={Boolean(anchorEl)}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "left",
				}}
				transformOrigin={{
					vertical: "top",
					horizontal: "right",
				}}
				MenuListProps={{ dense: true }}
			>
				<MenuItem
					disabled={actionsLoading || (!isMaster && isPartnerTab)}
					onClick={() => handleOpenPartnerPopup(false)}
				>
					Make a Partner
				</MenuItem>

				<MenuItem
					disabled={actionsLoading || (isMaster && isPartnerTab)}
					onClick={() => handleOpenPartnerPopup(true)}
				>
					Make a Master Partner
				</MenuItem>

				<MenuItem
					disabled={actionsLoading || !isPartnerTab}
					onClick={toggleWhitelabel}
				>
					{whitelabelEnabled ? "Disable " : "Enable "}
					whitelabel
				</MenuItem>

				<MenuItem onMouseEnter={handleOpenSubmenu}>
					<ListItemText>Change Plan</ListItemText>
					<ListItemIcon>
						<ArrowRightIcon
							fontSize="small"
							sx={{ color: "rgba(32, 33, 36, 1)" }}
						/>
					</ListItemIcon>
				</MenuItem>
			</Menu>

			<Menu
				anchorEl={submenuAnchorEl}
				open={Boolean(submenuAnchorEl)}
				onClose={handleCloseSubmenu}
				anchorOrigin={{ vertical: "top", horizontal: "left" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
				MenuListProps={{
					dense: true,
					onMouseEnter: () => {},
					onMouseLeave: handleCloseSubmenu,
				}}
			>
				<MenuItem
					disabled={actionsLoading || currentPlanAlias === "Basic"}
					onClick={() => onPlanClick("Basic")}
				>
					Move to Basic plan
				</MenuItem>
				<MenuItem
					disabled={actionsLoading || currentPlanAlias === "Smart Audience"}
					onClick={() => onPlanClick("Smart Audience")}
				>
					Move to Smart Audience plan
				</MenuItem>
				<MenuItem
					disabled={actionsLoading || currentPlanAlias === "Pro"}
					onClick={() => onPlanClick("Pro")}
				>
					Move to Pro plan
				</MenuItem>
			</Menu>
			<ConfirmPlanChangeDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onConfirm={handleConfirmPlanChange}
				newPlan={selectedPlan ?? ""}
				user={{
					name: user.name,
					email: user.email,
					joinDate: user.joinDate,
					currentPlan: currentPlanAlias,
				}}
			/>
			<MakePartnerPopup
				open={partnerPopupOpen}
				onClose={handleClosePartnerPopup}
				isMaster={partnerPopupIsMaster}
				userID={userId}
				updateOrAddPartner={() => {
					onPlanChanged();
				}}
			/>
		</>
	);
};
