import {
	Box,
	Typography,
	Button,
	Menu,
	MenuItem,
	TextField,
	IconButton,
	InputAdornment,
	Dialog,
	DialogContent,
	DialogActions,
	DialogContentText,
	Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import React, { useEffect, useState, useMemo } from "react";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import CloseIcon from "@mui/icons-material/Close";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import { UpgradePlanPopup } from "./UpgradePlanPopup";
import { AxiosError } from "axios";
import { SliderProvider } from "@/context/SliderContext";
import Slider from "../../../components/Slider";
import Image from "next/image";
import CustomizedProgressBar from "../../../components/FirstLevelLoader";
import { fetchUserData } from "@/services/meService";
import WysiwygIcon from "@mui/icons-material/Wysiwyg";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import { display } from "@mui/system";
import { useRouter } from "next/navigation";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";

export interface Domain {
	id: number;
	user_id: number;
	domain: string;
	data_provider_id: number;
	is_pixel_installed: boolean;
	contacts_resolving: boolean;
	enable: boolean;
}

interface AddDomainProps {
	open: boolean;
	handleClose: () => void;
	handleSave: (domain: Domain) => void;
}

interface HoverImageProps {
	srcDefault: string;
	srcHover: string;
	alt: string;
	onClick: () => void;
	disabled?: boolean;
}

const HoverableImage = ({
	srcDefault,
	srcHover,
	alt,
	onClick,
	disabled = false,
}: HoverImageProps) => {
	const [isHovered, setIsHovered] = useState(false);

	const icon = disabled ? (
		<DeleteForeverOutlinedIcon
			sx={{ fontSize: 20, color: "rgba(0,0,0,0.3)" }}
		/>
	) : (
		<Image
			height={20}
			width={20}
			alt={alt}
			src={isHovered ? srcHover : srcDefault}
			style={{
				transition: "opacity 0.3s ease",
				cursor: "pointer",
			}}
		/>
	);

	const button = (
		<Button
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={(e) => {
				e.stopPropagation();
				if (!disabled) {
					onClick();
				}
			}}
			className="delete-icon"
			sx={{
				padding: 0,
				minWidth: "auto",
				border: "none",
				background: "transparent",
				cursor: disabled ? "not-allowed" : "pointer",
			}}
		>
			{icon}
		</Button>
	);

	return disabled ? (
		<Tooltip
			title={
				<Box
					sx={{
						backgroundColor: "#fff",
						margin: 0,
						padding: 0,
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
					}}
				>
					<Typography
						className="table-data"
						component="div"
						sx={{ fontSize: "12px !important" }}
					>
						This domain cannot be deleted because it has associated leads.
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
						minWidth: "200px",
						padding: "11px 10px",
					},
				},
			}}
			placement="right"
		>
			<span>{button}</span>
		</Tooltip>
	) : (
		button
	);
};

const AddDomainPopup = ({ open, handleClose, handleSave }: AddDomainProps) => {
	const [domain, setDomain] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const [errors, setErrors] = useState({ domain: "" });
	const [upgradePlanPopup, setUpgradePlanPopup] = useState(false);
	const [showSlider, setShowSlider] = useState(false);
	const handleFocus = () => setIsFocused(true);
	const handleBlur = () => setIsFocused(false);
	const validateField = (value: string, type: "domain"): string => {
		const sanitizedValue = value.replace(/^www\./, "");
		const websiteRe =
			/^(https?:\/\/)?([\da-z.-]+)\.([a-z]{2,20})([/\w .-]*)*\/?$/i;
		return websiteRe.test(sanitizedValue) ? "" : "Invalid website URL";
	};
	const handleSubmit = async () => {
		const newErrors = { domain: validateField(domain, "domain") };
		setErrors(newErrors);
		if (newErrors.domain) return;

		try {
			const response = await axiosInstance.post("domains/", { domain });
			if (response.status === 201) {
				handleClose();
				handleSave(response.data);
			}
		} catch (error) {
			if (error instanceof AxiosError) {
				if (error.response?.status === 403) {
					if (error.response.data.status === "NEED_UPGRADE_PLAN") {
						setUpgradePlanPopup(true);
					} else if (error.response.data.status === "NEED_BOOK_CALL") {
						sessionStorage.setItem("is_slider_opened", "true");
						setShowSlider(true);
					} else {
						sessionStorage.setItem("is_slider_opened", "false");
						setShowSlider(false);
					}
				}
			}
		}
	};

	const handleWebsiteLink = (event: { target: { value: string } }) => {
		let input = event.target.value.trim();

		const hasWWW = input.startsWith("www.");

		const sanitizedInput = hasWWW ? input.replace(/^www\./, "") : input;

		const domainPattern = /^[\w-]+\.[a-z]{2,}$/i;
		const isValidDomain = domainPattern.test(sanitizedInput);

		let finalInput = input;

		if (isValidDomain) {
			finalInput = hasWWW
				? `https://www.${sanitizedInput}`
				: `https://${sanitizedInput}`;
		}

		setDomain(finalInput);

		const websiteError = validateField(input, "domain");
		setErrors((prevErrors) => ({
			domain: websiteError,
		}));
	};

	if (!open) return null;

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				padding: "1rem",
				width: "100%",
			}}
		>
			<TextField
				onKeyDown={(e) => e.stopPropagation()}
				fullWidth
				label="Enter domain link"
				variant="outlined"
				sx={{
					marginBottom: "1.5em",
					maxHeight: "56px",
					"& .MuiOutlinedInput-root": {
						maxHeight: "48px",
						"& fieldset": {
							borderColor: "rgba(107, 107, 107, 1)",
						},
						"&:hover fieldset": {
							borderColor: "rgba(107, 107, 107, 1)",
						},
						"&.Mui-focused fieldset": {
							borderColor: "rgba(107, 107, 107, 1)",
						},
						paddingTop: "13px",
						paddingBottom: "13px",
					},
					"& .MuiInputLabel-root": {
						top: "-5px",
					},
					"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
						borderColor: "rgba(107, 107, 107, 1)",
					},
				}}
				placeholder={isFocused ? "example.com" : ""}
				value={
					isFocused
						? domain.replace(/^https?:\/\//, "")
						: `https://${domain.replace(/^https?:\/\//, "")}`
				}
				onChange={handleWebsiteLink}
				onFocus={handleFocus}
				onBlur={handleBlur}
				error={!!errors.domain}
				helperText={errors.domain}
				InputProps={{
					startAdornment: isFocused && (
						<InputAdornment
							position="start"
							disablePointerEvents
							sx={{ marginRight: 0 }}
						>
							https://
						</InputAdornment>
					),
					endAdornment: (
						<IconButton
							aria-label="close"
							edge="end"
							sx={{ color: "text.secondary" }}
							onClick={handleClose}
						>
							<CloseIcon />
						</IconButton>
					),
				}}
			/>
			<Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
				<Button
					className="hyperlink-red"
					onClick={handleSubmit}
					sx={{
						borderRadius: "4px",
						border: "1px solid rgba(56, 152, 252, 1)",
						boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
						color: "rgba(56, 152, 252, 1) !important",
						textTransform: "none",
						padding: "6px 24px",
					}}
				>
					Save
				</Button>
			</Box>
			<UpgradePlanPopup
				open={upgradePlanPopup}
				limitName={"domain"}
				handleClose={() => setUpgradePlanPopup(false)}
			/>
			{showSlider && <Slider />}
		</Box>
	);
};

const DomainButton: React.FC = () => {
	const router = useRouter();
	const [domains, setDomains] = useState<Domain[]>([]);
	const [currentDomain, setCurrentDomain] = useState("");
	const [showDomainPopup, setDomainPopup] = useState(false);
	const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
	const dropdownOpen = Boolean(dropdownEl);
	const [deleteDomainPopup, setDeleteDomainPopup] = useState(false);
	const [deleteDomain, setDeleteDomain] = useState<Domain | null>(null);
	const [loading, setLoading] = useState(false);
	const [upgradePlanPopup, setUpgradePlanPopup] = useState(false);
	const sourcePlatform = useMemo(() => {
		if (typeof window !== "undefined") {
			const savedMe = sessionStorage.getItem("me");
			if (savedMe) {
				try {
					const parsed = JSON.parse(savedMe);
					return parsed.source_platform || "";
				} catch (error) {}
			}
		}
		return "";
	}, [typeof window !== "undefined" ? sessionStorage.getItem("me") : null]);
	useEffect(() => {
		const intervalId = setInterval(() => {
			const savedMe = sessionStorage.getItem("me");
			const savedDomains = savedMe ? JSON.parse(savedMe || "{}").domains : [];
			const savedCurrentDomain = sessionStorage.getItem("current_domain") || "";

			if (JSON.stringify(domains) !== JSON.stringify(savedDomains)) {
				setDomains(savedDomains);
			}

			if (currentDomain !== savedCurrentDomain) {
				setCurrentDomain(savedCurrentDomain);
			}
		}, 1000);

		return () => clearInterval(intervalId);
	}, [domains, currentDomain]);

	const handleDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setDropdownEl(event.currentTarget);
	};

	const handleDropdownClose = () => {
		setDropdownEl(null);
	};

	const handleSetDomain = async (domain: string) => {
		sessionStorage.setItem("current_domain", domain);
		setCurrentDomain(domain.replace("https://", ""));
		sessionStorage.removeItem("me");
		setDropdownEl(null);
		await fetchUserData();
		window.location.reload();
	};

	const handleSave = (domain: Domain) => {
		setDomains((prevDomains) => [...prevDomains, domain]);
		setDomainPopup(false);
		handleSetDomain(domain.domain);
		showToast("Successfully added domain");
	};

	const handleShowDelete = (domain: Domain) => {
		setDeleteDomain(domain);
		setDeleteDomainPopup(true);
		handleDropdownClose();
	};

	const handleDeleteDomain = async (domain: Domain) => {
		if (domain.contacts_resolving) {
			showErrorToast(
				"Domain cannot be deleted because it has associated leads",
			);
			return;
		}
		try {
			setLoading(true);

			const currentDomain = sessionStorage.getItem("current_domain");

			await axiosInstance.delete(`/domains/${domain.id}`, {
				data: { domain: domain.domain },
			});

			showToast("Successfully removed domain");

			const savedMeRaw = sessionStorage.getItem("me");
			if (savedMeRaw) {
				const savedMe = JSON.parse(savedMeRaw);
				const updatedDomains = (savedMe.domains || []).filter(
					(d: Domain) => d.id !== domain.id,
				);

				if (currentDomain === domain.domain) {
					if (updatedDomains.length > 0) {
						sessionStorage.setItem("current_domain", updatedDomains[0].domain);
					} else {
						sessionStorage.removeItem("current_domain");
					}
				}

				savedMe.domains = updatedDomains;
				sessionStorage.setItem("me", JSON.stringify(savedMe));

				setDomains(updatedDomains);
			}

			setDeleteDomainPopup(false);

			window.location.reload();
		} catch (err) {
			console.error("Failed to delete domain", err);
			showErrorToast("Failed to delete domain. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	//if (domains.length === 0) return null;

	return (
		<>
			<UpgradePlanPopup
				open={upgradePlanPopup}
				limitName={"domain"}
				handleClose={() => setUpgradePlanPopup(false)}
			/>
			<Button
				aria-controls={dropdownOpen ? "account-dropdown" : undefined}
				aria-haspopup="true"
				aria-expanded={dropdownOpen ? "true" : undefined}
				onClick={handleDropdownClick}
				sx={{
					textTransform: "none",
					color: "#000",
					borderRadius: "4px",
					padding: "6px 4px",
					display: "flex",
					alignItems: "center",
					gap: "8px",
					minWidth: "170px",
					justifyContent: "space-between",
					"&:hover": {
						backgroundColor: "transparent",
					},
				}}
			>
				<Box display="flex" alignItems="center" gap="8px" ml={1.125}>
					<WysiwygIcon sx={{ color: "#666", minWidth: "1.5rem" }} />
					<Typography variant="body2">
						{currentDomain !== ""
							? currentDomain.replace("https://", "")
							: domains.length > 0
								? domains[0].domain.replace("https://", "")
								: "Loading..."}
					</Typography>
				</Box>
				<Box display="flex" flexDirection="column" pr={0}>
					<UnfoldMoreIcon sx={{ fontSize: "22px", color: "#666" }} />
				</Box>
			</Button>
			<Menu
				id="account-dropdown"
				variant="menu"
				anchorEl={dropdownEl}
				open={dropdownOpen}
				onClose={handleDropdownClose}
				sx={{ "& .MuiMenu-list": { pt: 0, pr: 0, pl: 0, pb: 0 } }}
			>
				<Box>
					<MenuItem
						onClick={() => setDomainPopup(true)}
						sx={{ borderBottom: "0.5px solid #CDCDCD" }}
					>
						<Typography
							className="second-sub-title"
							sx={{
								color: "rgba(56, 152, 252, 1) ",
								textAlign: "center",
								width: "100%",
							}}
						>
							{" "}
							+ Add new domain
						</Typography>
					</MenuItem>
					<AddDomainPopup
						open={showDomainPopup}
						handleClose={() => setDomainPopup(false)}
						handleSave={handleSave}
					/>
				</Box>
				<Box
					sx={{
						display: "flex",
						justifyContent: "flex-end",
						width: "100%",
					}}
				>
					<span
						style={{
							border: "0.5px solid #CDCDCD",
							width: "100%",
						}}
					></span>
				</Box>
				{domains?.map((domain) => (
					<MenuItem
						key={domain.id}
						onClick={() => {
							handleSetDomain(domain.domain);
						}}
						sx={{
							"&:hover .delete-icon": {
								opacity: 1,
							},
							"& .delete-icon": {
								opacity: 0,
								transition: "opacity 0.3s ease",
							},
						}}
					>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								cursor: domain.enable ? "pointer" : "not-allowed",
								width: "20rem",
								// color: domain.enable ? 'inherit' : 'rgba(32,  33, 36, 0.3) !important'
							}}
						>
							<Typography
								className="second-sub-title"
								sx={{
									color: domain.enable
										? "inherit"
										: "rgba(32, 33, 36, 0.3) !important",
								}}
							>
								{domain.domain.replace("https://", "")}
							</Typography>
							<Box sx={{ display: "flex", gap: 1 }}>
								{domain.is_pixel_installed == true && (
									<Box
										sx={{
											backgroundColor: "rgba(234, 248, 221, 1)",
											borderRadius: "200px",
											padding: "4px 8px",
											justifyContent: "flex-end",
											display: "flex",
										}}
									>
										<Typography
											variant="body2"
											sx={{
												color: "rgba(43, 91, 0, 1)",
												fontFamily: "var(--font-roboto)",
												fontWeight: "400",
												fontSize: "12px",
											}}
										>
											Pixel Installed
										</Typography>
									</Box>
								)}
								{domains.length > 1 && (
									<HoverableImage
										srcDefault="/trash-03.svg"
										srcHover="/trash-03-active.svg"
										alt="Remove"
										onClick={() => handleShowDelete(domain)}
										disabled={
											!(
												domains.length > 1 && domain.contacts_resolving !== true
											)
										}
									/>
								)}
							</Box>
						</Box>
					</MenuItem>
				))}
				<Box
					sx={{
						display: "flex",
						justifyContent: "flex-end",
						width: "100%",
					}}
				>
					<span
						style={{
							border: "0.5px solid #CDCDCD",
							width: "100%",
						}}
					></span>
				</Box>
				<Box>
					<MenuItem
						onClick={() => router.push("/management")}
						sx={{ borderBottom: "0.5px solid #CDCDCD" }}
					>
						<Typography
							className="second-sub-title"
							sx={{
								color: "rgba(56, 152, 252, 1) !important",
								textAlign: "center",
								width: "100%",
								textDecoration: "underline",
								"&:hover": {
									textDecoration: "none",
								},
							}}
						>
							{" "}
							Go to all domains
						</Typography>
					</MenuItem>
				</Box>
			</Menu>
			{loading && (
				<Box
					sx={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						zIndex: 1000,
						overflow: "hidden",
					}}
				>
					<CustomizedProgressBar />
				</Box>
			)}
			{deleteDomainPopup && deleteDomain && (
				<Dialog
					open={deleteDomainPopup}
					onClose={() => setDeleteDomainPopup(false)}
					PaperProps={{
						sx: {
							padding: 2,

							width: "fit-content",
							borderRadius: 2,
							border: "1px solid rgba(175, 175, 175, 1)",
						},
					}}
				>
					<Typography
						className="first-sub-title"
						sx={{ paddingLeft: 1, pt: 1, pb: 0 }}
					>
						Confirm Deletion
					</Typography>
					<DialogContent sx={{ padding: 2, pr: 1, pl: 1 }}>
						<DialogContentText className="table-data">
							Are you sure you want to delete this domain -{" "}
							<span style={{ fontWeight: "600" }}>{deleteDomain?.domain} </span>
							?
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button
							className="second-sub-title"
							onClick={() => setDeleteDomainPopup(false)}
							sx={{
								backgroundColor: "#fff",
								color: "rgba(56, 152, 252, 1) !important",
								fontSize: "14px",
								textTransform: "none",
								padding: "0.75em 1em",
								border: "1px solid rgba(56, 152, 252, 1)",
								maxWidth: "50px",
								maxHeight: "30px",
								"&:hover": {
									backgroundColor: "#fff",
									boxShadow: "0 2px 2px rgba(0, 0, 0, 0.3)",
								},
							}}
						>
							Cancel
						</Button>
						<Button
							className="second-sub-title"
							onClick={() => handleDeleteDomain(deleteDomain)}
							sx={{
								backgroundColor: "rgba(56, 152, 252, 1)",
								color: "#fff !important",
								fontSize: "14px",
								textTransform: "none",
								padding: "0.75em 1em",
								border: "1px solid rgba(56, 152, 252, 1)",
								maxWidth: "60px",
								maxHeight: "30px",
								"&:hover": {
									backgroundColor: "rgba(56, 152, 252, 1)",
									boxShadow: "0 2px 2px rgba(0, 0, 0, 0.3)",
								},
							}}
						>
							Delete
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</>
	);
};

const DomainSelect = () => {
	return (
		<SliderProvider>
			<DomainButton />
		</SliderProvider>
	);
};

export default DomainSelect;
