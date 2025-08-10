"use client";
import type React from "react";
import {
	type Dispatch,
	type FC,
	type SetStateAction,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	Box,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	LinearProgress,
	Typography,
	Collapse,
	Button,
	Icon,
	SvgIcon,
	Tooltip,
	Stack,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import LeadsIcon from "@mui/icons-material/People";
import CategoryIcon from "@mui/icons-material/Category";
import IntegrationsIcon from "@mui/icons-material/IntegrationInstructions";
import BusinessIcon from "@mui/icons-material/Business";
import FeaturedPlayListIcon from "@mui/icons-material/FeaturedPlayList";
import SettingsIcon from "@mui/icons-material/Settings";
import SettingsInputCompositeIcon from "@mui/icons-material/SettingsInputComposite";
import AllInboxIcon from "@mui/icons-material/AllInbox";
import Image from "next/image";
import { AxiosError } from "axios";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { useUser } from "@/context/UserContext";
import ContactsIcon from "@mui/icons-material/Contacts";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import LegendToggleIcon from "@mui/icons-material/LegendToggle";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InsightsIcon from "@mui/icons-material/Insights";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import FastForward from "@mui/icons-material/FastForward";
import ReduceCapacityIcon from "@mui/icons-material/ReduceCapacity";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import { useSidebar } from "@/context/SidebarContext";
import CustomTooltip from "@/components/customToolTip";
import { Row } from "./Row";
import { Column } from "./Column";

const sidebarStyles = {
	container: {
		width: "100%",
		flexShrink: 0,
		fontFamily: "var(--font-nunito)",
		fontSize: ".875rem",
		fontWeight: "400",
		backgroundColor: "rgba(255, 255, 255, 1)",
		borderRight: ".0625rem solid rgba(228, 228, 228, 1)",
		maxWidth: "9.125rem",
		display: "flex",
		overflow: "hidden",
		flexDirection: "column",
		justifyContent: "start",
		position: "relative",
	},
	menu: {
		alignItems: "center",
		paddingTop: "0 !important",
		pb: 0,
		"& .MuiListItem-root": {
			paddingBottom: "16px",
			paddingTop: "16px",
			"&:hover": {
				backgroundColor: "#e0e0e0",
			},
		},
		"& .MuiListItemText-root": {
			marginTop: "0rem !important",
			marginBottom: "0rem !important",
		},
		"& span.MuiTypography-root": {
			fontFamily: "var(--font-nunito)",
			fontSize: "14px",
			fontWeight: 400,
			lineHeight: "normal",
		},
	},
	listItemIcon: {
		minWidth: "1.5rem",
		marginRight: ".25rem",
	},
	footer: {
		padding: "16px",
		"& .MuiListItem-root": {},
	},
	settings: {
		alignItems: "center",
		paddingTop: "0 !important",
		"& .MuiListItem-root": {
			paddingBottom: "16px",
			paddingTop: "16px",
			"&:hover": {
				backgroundColor: "#e0e0e0",
			},
		},
		"& .MuiListItemText-root": {
			marginTop: "0rem !important",
			marginBottom: "0rem !important",
		},
		"& span.MuiTypography-root": {
			fontFamily: "var(--font-nunito)",
			fontSize: "14px",
			fontWeight: 400,
			lineHeight: "normal",
		},
	},
	setupSection: {
		padding: "16px",
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		marginLeft: "16px",
		marginRight: "16px",
		border: ".0625rem solid #e4e4e4",
		borderRadius: ".5rem",
		backgroundColor: "#fff",
		marginBottom: "16px",
		boxShadow: "0rem .125rem .25rem rgba(0, 0, 0, 0.1)",
	},
	ListItem: {
		cursor: "pointer",
		minHeight: "4.5em",
		color: "rgba(59, 59, 59, 1)",
		ml: ".1875rem",
	},
	activeItem: {
		cursor: "pointer",
		borderLeft: ".1875rem solid rgba(56, 152, 252, 1)",
		color: "rgba(56, 152, 252, 1)",
		minHeight: "4.5em",
		"& .MuiSvgIcon-root": {
			color: "rgba(56, 152, 252, 1)",
		},
	},
};

const containerStyles = (hasNotification: boolean, hasSubheader: boolean) => ({
	container: {
		width: "100%",
		flexShrink: 0,
		flexGrow: 1,
		fontFamily: "var(--font-nunito)",
		fontSize: ".875rem",
		fontWeight: "400",
		backgroundColor: "rgba(255, 255, 255, 1)",
		borderRight: ".0625rem solid rgba(228, 228, 228, 1)",
		// height: computeHeight(hasNotification, hasSubheader),
		maxWidth: "10.9375rem",
		display: "flex",
		overflowY: "auto",
		overflowX: "hidden",
		flexDirection: "column",
		justifyContent: "start",
		position: "relative",
	},
});

const computeHeight = (
	hasNotification: boolean,
	hasSubheader: boolean,
): string => {
	if (hasNotification && hasSubheader) return "calc(100vh - 10.85rem)";
	if (hasSubheader) return "calc(100vh - 8rem)";
	if (hasNotification) return "calc(100vh - 7.125rem)";
	return "calc(100vh - 4.25rem)";
};

interface ProgressSectionProps {
	percent_steps: number;
}

const SetupSection: React.FC<ProgressSectionProps> = ({ percent_steps }) => {
	if (percent_steps > 50) {
		return null;
	}

	return (
		<Box sx={sidebarStyles.setupSection}>
			<Box display="flex" alignItems="center" mb={2}>
				<Image src={"/Vector9.svg"} alt="Setup" width={20} height={20} />
				<Typography
					variant="h6"
					component="div"
					ml={1}
					sx={{
						fontFamily: "var(--font-nunito)",
						fontWeight: "400",
						lineHeight: "normal",
						color: "rgba(0, 0, 0, 1)",
						fontSize: "14px",
					}}
				>
					Setup
				</Typography>
			</Box>
			<LinearProgress
				variant="determinate"
				value={percent_steps ? percent_steps : 0}
				sx={{
					height: ".5rem",
					borderRadius: ".25rem",
					backgroundColor: "rgba(219, 219, 219, 1)",
					"& .MuiLinearProgress-bar": {
						backgroundColor: "rgba(110, 193, 37, 1)",
					},
				}}
			/>
			<Typography
				variant="body2"
				color="textSecondary"
				mt={1}
				sx={{
					fontFamily: "var(--font-roboto)",
					lineHeight: "normal",
					color: "rgba(120, 120, 120, 1)",
					fontSize: "10px",
				}}
			>
				{percent_steps ? percent_steps : 0}% complete
			</Typography>
		</Box>
	);
};

type SidebarProps = {
	setShowSlider: Dispatch<SetStateAction<boolean>>;
	setLoading: Dispatch<SetStateAction<boolean>>;
	hasNotification: boolean;
	isGetStartedPage: boolean;
	loading: boolean;
	hasSubheader: boolean;
	showAdmin: boolean;
	showPartner: boolean;
	navigate: (route: string) => void;
	height?: string;
};

export const SidebarView: React.FC<SidebarProps> = ({
	hasNotification,
	isGetStartedPage,
	loading,
	hasSubheader,
	navigate,
	showAdmin,
	showPartner,
	height,
}) => {
	const { backButton } = useUser();
	const { installedResources } = useSidebar();
	const isPixelInstalled = installedResources.pixel;
	const isSourceInstalled = installedResources.source;
	const pathname = usePathname();
	const isPartnerAvailable = showPartner;
	const isAdminAvailable = showAdmin;
	const handleNavigation = navigate;

	const isActive = (path: string) => pathname.startsWith(path);
	const isEquals = (path: string) => {
		return pathname === path;
	};

	const [open, setOpen] = useState(false);
	const isPixelActive =
		isActive("/leads") ||
		isActive("/company") ||
		isActive("/suppressions") ||
		isActive("/analytics") ||
		isActive("/management") ||
		isActive("/pixel-sync");
	const handleClick = () => {
		setOpen(!open);
	};

	return (
		<Box
			sx={{
				...containerStyles(hasNotification, hasSubheader).container,
				display: "flex",
				height: height ?? null,
				// maxHeight: "100%",
				flexDirection: "column",
				overflow: "scroll",
				flexGrow: 1,
				justifyContent: "space-between",
			}}
		>
			<List
				sx={{
					...sidebarStyles.menu,
					flexGrow: 1,
					overflowY: "auto",
					overflowX: "hidden",
				}}
			>
				{isAdminAvailable && (
					<ListItem
						button
						onClick={() => handleNavigation("/admin")}
						sx={
							isActive("/admin")
								? sidebarStyles.activeItem
								: sidebarStyles.ListItem
						}
					>
						<ListItemIcon sx={sidebarStyles.listItemIcon}>
							<SupervisorAccountIcon />
						</ListItemIcon>
						<ListItemText primary="Admin" />
					</ListItem>
				)}
				{isGetStartedPage && !loading && (
					<ListItem
						button
						onClick={() => handleNavigation("/get-started")}
						sx={
							isActive("/get-started")
								? sidebarStyles.activeItem
								: sidebarStyles.ListItem
						}
					>
						<ListItemIcon sx={sidebarStyles.listItemIcon}>
							<FastForward />
						</ListItemIcon>
						<ListItemText primary="Get Started" />
					</ListItem>
				)}
				{/* Dashboard */}
				<ListItem
					button
					onClick={() => handleNavigation("/dashboard")}
					sx={
						isActive("/dashboard")
							? sidebarStyles.activeItem
							: sidebarStyles.ListItem
					}
				>
					<ListItemIcon sx={sidebarStyles.listItemIcon}>
						<SpaceDashboardIcon />
					</ListItemIcon>
					<ListItemText primary="Dashboard" />
				</ListItem>
				{/* PIXEL */}
				<List sx={{ width: 250, p: 0 }}>
					<ListItem
						button
						onClick={handleClick}
						sx={
							isPixelActive ? sidebarStyles.activeItem : sidebarStyles.ListItem
						}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
							}}
						>
							<ListItemIcon sx={sidebarStyles.listItemIcon}>
								<LegendToggleIcon />
							</ListItemIcon>
							<ListItemText primary="Pixel" sx={{ marginRight: 2 }} />
							{open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
						</Box>
					</ListItem>
					{open && (
						<Box sx={{ position: "relative" }}>
							<Collapse in={open} timeout="auto" unmountOnExit>
								<List
									component="div"
									disablePadding
									sx={{ opacity: isPixelInstalled ? 1 : 0.5 }}
								>
									{/* Insights */}
									<ListItem
										button
										onClick={() => handleNavigation("/analytics")}
										sx={
											isActive("/analytics")
												? { ...sidebarStyles.activeItem, pl: 4 }
												: { ...sidebarStyles.ListItem, pl: 4 }
										}
									>
										<ListItemIcon sx={sidebarStyles.listItemIcon}>
											<InsertChartOutlinedIcon />
										</ListItemIcon>
										<ListItemText primary="Analytics" />
									</ListItem>
									{/* Contacts */}
									<ListItem
										button
										onClick={() => handleNavigation("/leads")}
										sx={
											isActive("/leads")
												? { ...sidebarStyles.activeItem, pl: 4 }
												: { ...sidebarStyles.ListItem, pl: 4 }
										}
									>
										<ListItemIcon sx={sidebarStyles.listItemIcon}>
											<LeadsIcon />
										</ListItemIcon>
										<ListItemText primary="Contacts" />
									</ListItem>
									{/* Company */}
									<ListItem
										button
										onClick={() => handleNavigation("/company")}
										sx={
											isActive("/company")
												? { ...sidebarStyles.activeItem, pl: 4 }
												: { ...sidebarStyles.ListItem, pl: 4 }
										}
									>
										<ListItemIcon sx={sidebarStyles.listItemIcon}>
											<BusinessIcon />
										</ListItemIcon>
										<ListItemText primary="Company" />
									</ListItem>
									{/* Management */}
									<ListItem
										button
										onClick={() => handleNavigation("/management")}
										sx={
											isActive("/management")
												? { ...sidebarStyles.activeItem, pl: 4 }
												: { ...sidebarStyles.ListItem, pl: 4 }
										}
									>
										<ListItemIcon sx={sidebarStyles.listItemIcon}>
											<SettingsInputCompositeIcon />
										</ListItemIcon>
										<ListItemText primary="Management" />
									</ListItem>
									{/* Suppressions */}
									<ListItem
										button
										onClick={() => handleNavigation("/suppressions")}
										sx={
											isActive("/suppressions")
												? { ...sidebarStyles.activeItem, pl: 4 }
												: { ...sidebarStyles.ListItem, pl: 4 }
										}
									>
										<ListItemIcon sx={sidebarStyles.listItemIcon}>
											<FeaturedPlayListIcon />
										</ListItemIcon>
										<ListItemText primary="Suppressions" />
									</ListItem>
									{/* Data sync */}
									<ListItem
										button
										onClick={() => handleNavigation("/pixel-sync")}
										sx={
											isEquals("/pixel-sync")
												? { ...sidebarStyles.activeItem, pl: 4 }
												: { ...sidebarStyles.ListItem, pl: 4 }
										}
									>
										<ListItemIcon sx={sidebarStyles.listItemIcon}>
											<AccountTreeIcon />
										</ListItemIcon>
										<ListItemText primary="Pixel Sync" />
									</ListItem>
								</List>
							</Collapse>

							{!isPixelInstalled && (
								<Box
									sx={{
										position: "absolute",
										inset: 0,
										zIndex: 10,
										maxWidth: "10.875rem",
										backdropFilter: "blur(1px)",
										backgroundColor: "rgba(0, 0, 0, 0.05)",
										pointerEvents: "auto",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										flexDirection: "column",
									}}
								>
									<Button
										variant="contained"
										sx={{
											textTransform: "none",
											backgroundColor: "rgba(56, 152, 252, 1)",
											color: "rgba(255, 255, 255, 1)",
											fontSize: ".875rem",
											fontFamily: "var(--font-nunito)",
											fontWeight: "600",
										}}
										onClick={() => handleNavigation("/get-started?pixel=true")}
									>
										Install Pixel
									</Button>
								</Box>
							)}
						</Box>
					)}
				</List>
				{/* Source */}
				<ListItem
					button
					onClick={() => handleNavigation("/sources")}
					sx={
						isActive(`/sources`)
							? sidebarStyles.activeItem
							: sidebarStyles.ListItem
					}
				>
					<ListItemIcon sx={sidebarStyles.listItemIcon}>
						<AllInboxIcon />
					</ListItemIcon>
					<ListItemText primary="Sources" />
				</ListItem>
				<Box sx={{ position: "relative" }}>
					<List
						disablePadding
						sx={{ opacity: isSourceInstalled || loading ? 1 : 0.5 }}
					>
						<SidebarMenuItem
							path="/lookalikes"
							label="Lookalikes"
							icon={<ContactsIcon />}
							isActive={isActive("/lookalikes")}
							handleNavigation={handleNavigation}
						/>
						<SidebarMenuItem
							path="/insights"
							label="Insights"
							icon={<InsightsIcon />}
							isActive={isActive("/insights")}
							handleNavigation={handleNavigation}
						/>
						<SidebarMenuItem
							path="/smart-audiences"
							label="Smart Audiences"
							icon={<AutoFixHighIcon sx={{ rotate: "275deg", mb: 1 }} />}
							isActive={isActive("/smart-audiences")}
							handleNavigation={handleNavigation}
						/>

						{/* Data Sync */}
						<ListItem
							button
							onClick={() => handleNavigation("/data-sync")}
							sx={
								isEquals("/data-sync")
									? sidebarStyles.activeItem
									: sidebarStyles.ListItem
							}
						>
							<ListItemIcon sx={sidebarStyles.listItemIcon}>
								<CategoryIcon />
							</ListItemIcon>
							<ListItemText primary="Data Sync" />
						</ListItem>

						<PremiumSources />
					</List>

					{!isSourceInstalled && !loading && (
						<Box
							sx={{
								position: "absolute",
								inset: 0,
								zIndex: 10,
								maxWidth: "10.875rem",
								backdropFilter: "blur(1px)",
								backgroundColor: "rgba(0, 0, 0, 0.05)",
								pointerEvents: "auto",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexDirection: "column",
							}}
						>
							<Button
								variant="contained"
								sx={{
									textTransform: "none",
									backgroundColor: "rgba(56, 152, 252, 1)",
									color: "rgba(255, 255, 255, 1)",
									fontSize: ".875rem",
									fontFamily: "var(--font-nunito)",
									fontWeight: "600",
								}}
								onClick={() => handleNavigation("/get-started?source=true")}
							>
								Import Source
							</Button>
						</Box>
					)}
				</Box>
				{/* Integrations */}
				<ListItem
					button
					onClick={() => handleNavigation("/integrations")}
					sx={
						isActive("/integrations")
							? sidebarStyles.activeItem
							: sidebarStyles.ListItem
					}
				>
					<ListItemIcon sx={sidebarStyles.listItemIcon}>
						<IntegrationsIcon />
					</ListItemIcon>
					<ListItemText primary="Integrations" />
				</ListItem>
				{isPartnerAvailable && (
					<SidebarMenuItem
						label="Partners"
						icon={<ReduceCapacityIcon />}
						path="/partners"
						isActive={isActive("/partners")}
						handleNavigation={handleNavigation}
					/>
				)}
			</List>
			<Column
				sx={{
					background: "blue",
				}}
				flex={1000}
			/>
			<Box
				sx={{
					// position: "sticky",
					// bottom: 0,
					backgroundColor: "white",
					// zIndex: 10,
				}}
			>
				{/* <SetupSection percent_steps={activatePercent ? activatePercent : 0} /> */}
				<Box sx={sidebarStyles.settings}>
					<ListItem
						button
						onClick={() => handleNavigation("/settings?section=accountDetails")}
						sx={
							isActive("/settings")
								? sidebarStyles.activeItem
								: sidebarStyles.ListItem
						}
					>
						<ListItemIcon sx={sidebarStyles.listItemIcon}>
							<SettingsIcon />
						</ListItemIcon>
						<ListItemText primary="Settings" />
					</ListItem>
				</Box>
			</Box>
		</Box>
	);
};

const PremiumSources = () => {
	return (
		<ListItem
			sx={{
				...sidebarStyles.ListItem,
				backgroundColor: "transparent",
				"&:hover": {
					backgroundColor: "transparent !important",
				},
			}}
		>
			<Tooltip
				title={
					<Box
						sx={{
							backgroundColor: "#fff",
							margin: 0,
							ml: 0,
							padding: 0,
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
						}}
					>
						<Typography
							className="table-data"
							component="div"
							sx={{ fontSize: "14px !important" }}
						>
							Coming soon...
						</Typography>
					</Box>
				}
				componentsProps={{
					tooltip: {
						sx: {
							backgroundColor: "#fff",
							color: "#000",
							boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.12)",
							border: " 0.2px solid rgba(255, 255, 255, 1)",
							borderRadius: "4px",
							maxHeight: "100%",
							maxWidth: "500px",
							padding: "11px 10px",
						},
					},
				}}
				placement="bottom"
				PopperProps={{
					modifiers: [
						{
							name: "offset",
							options: {
								offset: [75, -15],
							},
						},
					],
				}}
			>
				<Row gap="0px" alignItems="center">
					<ListItemIcon
						sx={{ ...sidebarStyles.listItemIcon, justifyContent: "center" }}
					>
						<Image src="/crown-flat.svg" alt="" width={18} height={18} />
					</ListItemIcon>
					<ListItemText primary="Premium Sources" sx={{ color: "#A8A8A8" }} />
				</Row>
			</Tooltip>
		</ListItem>
	);
};

type SidebarMenuItemProps = {
	label: string;
	icon: React.ReactNode;
	path: string;
	isActive: boolean;
	handleNavigation: (path: string) => void;
};

const SidebarMenuItem: FC<SidebarMenuItemProps> = ({
	label,
	icon,
	path,
	isActive,
	handleNavigation,
}) => {
	return (
		<ListItem
			button
			onClick={() => handleNavigation(path)}
			sx={isActive ? sidebarStyles.activeItem : sidebarStyles.ListItem}
		>
			<ListItemIcon sx={sidebarStyles.listItemIcon}>{icon}</ListItemIcon>
			<ListItemText primary={label} />
		</ListItem>
	);
};
