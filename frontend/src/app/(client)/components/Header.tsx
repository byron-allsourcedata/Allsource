"use client";
import {
	Box,
	Typography,
	Button,
	Menu,
	MenuItem,
	IconButton,
	Switch,
} from "@mui/material";
import Image from "next/image";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../../context/UserContext";
import { useHints } from "../../../context/HintsContext";
import FreeTrialLabel from "./FreeTrialLabel";
import DomainButton from "./DomainsButton";
import NavigationMenu from "@/app/(client)/components/NavigationMenu";
import { SliderProvider } from "../../../context/SliderContext";
import { useTrial } from "../../../context/TrialProvider";
import NotificationPopup from "../../../components/NotificationPopup";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import { useSSE } from "../../../context/SSEContext";
import QuestionMarkOutlinedIcon from "@mui/icons-material/QuestionMarkOutlined";
import PersonIcon from "@mui/icons-material/Person";
import CustomNotification from "@/components/CustomNotification";
import { usePathname } from "next/navigation";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useReturnToAdmin } from "@/hooks/useReturnToAdmin";
import { getCurrentImpersonationLevel } from "@/utils/impersonation";
import { useAxios } from "@/axios/axiosInterceptorInstance";
import type { WhitelabelSettingsSchema } from "@/app/features/whitelabel/schemas";
import { resetLocalStorage } from "@/components/utils";
import { Logo } from "@/components/ui/Logo";

const headerStyles = {
	headers: {
		display: "flex",
		padding: "1.125rem 1.5rem",
		pl: ".75rem",
		justifyContent: "space-between",
		alignItems: "center",
		minHeight: "4.25rem",
		maxHeight: "4.25rem",
		color: "rgba(244, 87, 69, 1)",
		borderBottom: `1px solid rgba(228, 228, 228, 1)`,
		position: "sticky",
		overflowY: "hidden",
		top: 0,
		left: 0,
		right: 0,
		background: "#fff",
		zIndex: 10,
	},
	logoContainer: {
		display: "flex",
		alignItems: "center",
	},
};

interface HeaderProps {
	NewRequestNotification: boolean;
	NotificationData: { text: string; id: number } | null;
	onDismissNotification: () => void;
}

function useWhitelabelIcons() {
	const result = useAxios<WhitelabelSettingsSchema>({
		url: "/whitelabel/icons",
		method: "GET",
	}, { manual: true });

	const [data, refetch] = result;
	useEffect(() => {
		refetch().catch(() => { });
	}, []);
	return result;
}

const Header: React.FC<HeaderProps> = ({
	NewRequestNotification,
	NotificationData,
	onDismissNotification,
}) => {
	const pathname = usePathname();
	const [hasNotification, setHasNotification] = useState(
		NewRequestNotification,
	);
	const router = useRouter();
	const { newNotification } = useSSE();
	const {
		full_name: userFullName,
		email: userEmail,
		resetUserData,
		backButton,
		setBackButton,
	} = useUser();
	const [meData, setMeData] = useState({ full_name: "", email: "" });
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [anchorElNotificate, setAnchorElNotificate] =
		useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const full_name = meData.full_name || userFullName;
	const email = meData.email || userEmail;
	const { resetTrialData } = useTrial();
	const [notificationIconPopupOpen, setNotificationIconPopupOpen] =
		useState(false);
	const [hasNewNotifications, setHasNewNotifications] =
		useState<boolean>(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [visibleButton, setVisibleButton] = useState(false);
	const returnToAdmin = useReturnToAdmin();
	const [returnButtonText, setReturnButtonText] = useState("Return");
	const { showHints, toggleHints } = useHints();

	const [{ data: whitelabelData }] = useWhitelabelIcons();

	const getMeData = () => {
		if (typeof window === "undefined") return { full_name: "", email: "" };
		const meItem = sessionStorage.getItem("me");
		return meItem ? JSON.parse(meItem) : { full_name: "", email: "" };
	};

	const updateHeaderState = useCallback(() => {
		const stack = JSON.parse(
			localStorage.getItem("impersonationStack") || "[]",
		);
		const urlParams = new URLSearchParams(window.location.search);
		const isPaymentFailed = urlParams.get("payment_failed") === "true";

		if (stack.length > 0 && !isPaymentFailed) {
			const currentLevel = stack[stack.length - 1];
			setReturnButtonText(getReturnButtonText(currentLevel.type));
			setVisibleButton(true);
		} else {
			setVisibleButton(false);
		}
	}, []);

	const handleSignOut = () => {
		resetLocalStorage();
		sessionStorage.clear();
		resetUserData();
		resetTrialData();
		window.location.href = "/signin";
	};

	useEffect(() => {
		if (newNotification) {
			setHasNewNotifications(true);
		}
	}, [newNotification]);

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const currentLevel = getCurrentImpersonationLevel();
		const isPaymentFailed = urlParams.get("payment_failed") === "true";

		if (currentLevel) {
			setReturnButtonText(getReturnButtonText(currentLevel.type));
		}

		if ((backButton || currentLevel) && !isPaymentFailed) {
			setVisibleButton(true);
		} else {
			setVisibleButton(false);
		}
	}, [backButton, setBackButton]);

	const handleReturnToMain = async () => {
		await returnToAdmin({
			updateHeader: (hasMoreLevels, nextLevelType) => {
				if (hasMoreLevels && nextLevelType) {
					setReturnButtonText(getReturnButtonText(nextLevelType));
				} else {
					setVisibleButton(false);
				}
			},
		});
	};

	useEffect(() => {
		updateHeaderState();
	}, [pathname, updateHeaderState]);

	const getReturnButtonText = (levelType: string) => {
		switch (levelType) {
			case "partner":
				return "Return to Partner";
			case "masterPartner":
				return "Return to Master Partner";
			case "admin":
				return "Return to Admin";
			default:
				return "Return";
		}
	};

	const handleSupportButton = () => {
		window.open(
			"https://allsourceio.zohodesk.com/portal/en/kb/allsource",
			"_blank",
		);
	};

	useEffect(() => {
		setHasNotification(NewRequestNotification);
	}, [NewRequestNotification]);

	useEffect(() => {
		if (newNotification) {
			setHasNewNotifications(true);
		}
	}, [newNotification]);
	const handleProfileMenuClick = (
		event: React.MouseEvent<HTMLButtonElement>,
	) => {
		setMeData(getMeData());
		setAnchorEl(event.currentTarget);
	};
	const handleProfileMenuClose = () => {
		setAnchorEl(null);
	};
	const handleSettingsClick = () => {
		handleProfileMenuClose();
		router.push("/settings");
	};

	const handleLogoClick = () => {
		router.push("/dashboard");
	};

	const handleNotificationIconPopupOpen = (
		event: React.MouseEvent<HTMLButtonElement>,
	) => {
		setAnchorElNotificate(event.currentTarget);
		setNotificationIconPopupOpen(true);
		setHasNewNotifications(false);
	};

	const handleNotificationIconPopupClose = () => {
		setNotificationIconPopupOpen(false);
		setAnchorEl(null);
		setHasNotification(false);
	};
	return (
		<Box sx={{ display: "flex", width: "100%", flexDirection: "column" }}>
			<Box sx={{ display: "block" }}>
				<Box sx={{ display: { md: "none" } }}>
					<SliderProvider>
						<NavigationMenu
							NewRequestNotification={
								hasNewNotifications || hasNewNotifications
							}
						/>
					</SliderProvider>
				</Box>
				<Box
					sx={{ ...headerStyles.headers, display: { xs: "none", md: "flex" } }}
				>
					<Box sx={headerStyles.logoContainer}>
						<IconButton
							onClick={handleLogoClick}
							sx={{
								"&:hover": { backgroundColor: "transparent" },
								cursor: "pointer",
								padding: "2px",
							}}
						>
							<Logo />
						</IconButton>
						{visibleButton && (
							<Button
								onClick={handleReturnToMain}
								variant="contained"
								sx={{
									fontFamily: "var(--font-nunito)",
									fontSize: "14px",
									fontWeight: 600,
									textTransform: "none",
									backgroundColor: "#3898FC",
									textWrap: "nowrap",
									color: "#fff",
									borderRadius: "8px",
									boxShadow: "none",
									padding: "6px 16px",
									marginLeft: "1.5rem",
									"&:hover": {
										backgroundColor: "#2277cc",
										boxShadow: "none",
									},
								}}
							>
								{returnButtonText}
							</Button>
						)}
					</Box>

					<Box sx={{ display: "flex", alignItems: "center" }}>
						<Box
							sx={{
								marginRight: "1.5rem",
								display: "flex",
								alignItems: "center",
							}}
						>
							<Typography
								className="fiveth-sub-title"
								style={{ color: "rgba(50, 54, 62, 1)" }}
							>
								Hints
							</Typography>
							<Switch
								checked={showHints}
								onChange={toggleHints}
								sx={{
									"& .MuiSwitch-switchBase": {
										"&+.MuiSwitch-track": {
											backgroundColor: "rgba(163, 176, 194, 1)",
											opacity: 1,
										},
										"&.Mui-checked": {
											color: "#fff",
											"&+.MuiSwitch-track": {
												backgroundColor: "rgba(56, 152, 252, 1)",
												opacity: 1,
											},
										},
									},
								}}
							/>
						</Box>

						<Button
							onClick={handleNotificationIconPopupOpen}
							ref={buttonRef}
							sx={{
								minWidth: "32px",
								padding: "6px",
								color: "rgba(128, 128, 128, 1)",
								border:
									hasNewNotifications || hasNotification
										? "1px solid rgba(56, 152, 252, 1)"
										: "1px solid rgba(184, 184, 184, 1)",
								borderRadius: "3.27px",
								marginRight: "1.5rem",
								"&:hover": {
									border: "1px solid rgba(56, 152, 252, 1)",
									"& .MuiSvgIcon-root": {
										color: "rgba(56, 152, 252, 1)",
									},
								},
							}}
						>
							<NotificationsOutlinedIcon
								sx={{
									fontSize: "22px",
									color:
										hasNewNotifications || hasNotification
											? "rgba(56, 152, 252, 1)"
											: "inherit",
								}}
							/>
							{(hasNewNotifications || hasNotification) && (
								<Box
									sx={{
										position: "absolute",
										top: 5,
										right: 6.5,
										width: "8px",
										height: "8px",
										backgroundColor: "rgba(248, 70, 75, 1)",
										borderRadius: "50%",
										"@media (max-width: 900px)": {
											top: -1,
											right: 1,
										},
									}}
								/>
							)}
						</Button>

						<Button
							onClick={handleSupportButton}
							sx={{
								minWidth: "32px",
								padding: "6px",
								color: "rgba(128, 128, 128, 1)",
								border: "1px solid rgba(184, 184, 184, 1)",
								borderRadius: "3.27px",
								marginRight: "1.5rem",
								"&:hover": {
									border: "1px solid rgba(56, 152, 252, 1)",
									"& .MuiSvgIcon-root": {
										color: "rgba(56, 152, 252, 1)",
									},
								},
							}}
						>
							<QuestionMarkOutlinedIcon
								sx={{
									fontSize: "22px",
								}}
							/>
						</Button>

						<Button
							aria-controls={open ? "profile-menu" : undefined}
							aria-haspopup="true"
							aria-expanded={open ? "true" : undefined}
							onClick={handleProfileMenuClick}
							sx={{
								minWidth: "32px",
								padding: "6px",
								color: "rgba(128, 128, 128, 1)",
								border: "1px solid rgba(184, 184, 184, 1)",
								borderRadius: "3.27px",
								"&:hover": {
									border: "1px solid rgba(56, 152, 252, 1)",
									"& .MuiSvgIcon-root": {
										color: "rgba(56, 152, 252, 1)",
									},
								},
							}}
						>
							<PersonIcon sx={{ fontSize: "22px" }} />
						</Button>
						<Menu
							id="profile-menu"
							anchorEl={anchorEl}
							open={open}
							onClose={handleProfileMenuClose}
							MenuListProps={{
								"aria-labelledby": "profile-menu-button",
								sx: {
									minWidth: "160px",
								},
							}}
							sx={{
								mt: 0.5,
								ml: -1,
							}}
						>
							<Box
								sx={{
									paddingTop: 1,
									paddingLeft: 2,
									paddingRight: 2,
									paddingBottom: 1,
								}}
							>
								<Typography
									variant="h6"
									sx={{
										fontFamily: "var(--font-nunito)",
										fontSize: "14px",
										fontWeight: 600,
										lineHeight: "19.6px",
										color: "rgba(0, 0, 0, 0.89)",
										mb: 0.25,
									}}
								>
									{full_name}
								</Typography>
								<Typography
									variant="body2"
									color="textSecondary"
									sx={{
										fontFamily: "var(--font-nunito)",
										fontSize: "14px",
										fontWeight: 600,
										lineHeight: "19.6px",
										color: "rgba(0, 0, 0, 0.89)",
									}}
								>
									{email}
								</Typography>
							</Box>
							<MenuItem
								component="a"
								href={`${process.env.NEXT_PUBLIC_BASE_URL}/opt-out`}
								target="_blank"
								rel="noopener noreferrer"
								sx={{
									fontFamily: "var(--font-nunito)",
									fontSize: "14px",
									fontWeight: 500,
									lineHeight: "19.6px",
									color: "rgba(56, 152, 252, 1)",
									gap: 1,
									textDecoration: "underline",
									"&:hover": {
										textDecoration: "none",
									},
								}}
							>
								Opt-Out <OpenInNewIcon sx={{ fontSize: 16 }} />
							</MenuItem>
							<MenuItem
								component="a"
								href="https://allsourcedata.io/terms-of-service"
								target="_blank"
								rel="noopener noreferrer"
								sx={{
									fontFamily: "var(--font-nunito)",
									fontSize: "14px",
									fontWeight: 500,
									lineHeight: "19.6px",
									color: "rgba(56, 152, 252, 1)",
									gap: 1,
									textDecoration: "underline",
									"&:hover": {
										textDecoration: "none",
									},
								}}
							>
								Terms of Service <OpenInNewIcon sx={{ fontSize: 16 }} />
							</MenuItem>
							<MenuItem
								component="a"
								href="https://allsourcedata.io/privacy-policy"
								target="_blank"
								rel="noopener noreferrer"
								sx={{
									fontFamily: "var(--font-nunito)",
									fontSize: "14px",
									fontWeight: 500,
									lineHeight: "19.6px",
									color: "rgba(56, 152, 252, 1)",
									gap: 1,
									textDecoration: "underline",
									"&:hover": {
										textDecoration: "none",
									},
								}}
							>
								Privacy Policy <OpenInNewIcon sx={{ fontSize: 16 }} />
							</MenuItem>
							<MenuItem
								sx={{
									fontFamily: "var(--font-nunito)",
									fontSize: "14px",
									fontWeight: 500,
									lineHeight: "19.6px",
								}}
								onClick={handleSettingsClick}
							>
								Settings
							</MenuItem>
							<MenuItem
								sx={{
									fontFamily: "var(--font-nunito)",
									fontSize: "14px",
									fontWeight: 500,
									lineHeight: "19.6px",
								}}
								onClick={handleSignOut}
							>
								Sign Out
							</MenuItem>
						</Menu>
					</Box>
				</Box>
			</Box>
			<NotificationPopup
				open={notificationIconPopupOpen}
				onClose={handleNotificationIconPopupClose}
				anchorEl={anchorElNotificate}
			/>
			{NotificationData && (
				<CustomNotification
					id={NotificationData.id}
					message={NotificationData.text}
					showDismiss={true}
					onDismiss={onDismissNotification}
				/>
			)}
		</Box>
	);
};

export default Header;
