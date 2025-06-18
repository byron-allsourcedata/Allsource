import {
	Box,
	Typography,
	Button,
	Menu,
	MenuItem,
	TextField,
	IconButton,
	InputAdornment,
	colors,
	Tooltip,
	DialogContent,
	DialogContentText,
	DialogActions,
	Dialog,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import React, { useEffect, useState } from "react";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import CloseIcon from "@mui/icons-material/Close";
import { showToast } from "../../../components/ToastNotification";
import { UpgradePlanPopup } from "./UpgradePlanPopup";
import { AxiosError } from "axios";
import { SliderProvider } from "@/context/SliderContext";
import Slider from "../../../components/Slider";
import Image from "next/image";
import CustomizedProgressBar from "../../../components/FirstLevelLoader";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import { Domain } from "./DomainsButton";

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
					"& .MuiInputBase-root": {
						maxHeight: "48px",
					},
					"&.Mui-focused": {
						color: "#0000FF",
					},
					"& .MuiOutlinedInput-root": {
						paddingTop: "13px",
						paddingBottom: "13px",
					},
					"& .MuiInputLabel-root": {
						top: "-5px",
					},
					"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
						borderColor: "#0000FF",
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
	const [domains, setDomains] = useState<Domain[]>([]);
	const [currentDomain, setCurrentDomain] = useState("");
	const [showDomainPopup, setDomainPopup] = useState(false);
	const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
	const dropdownOpen = Boolean(dropdownEl);
	const [deleteDomainPopup, setDeleteDomainPopup] = useState(false);
	const [deleteDomain, setDeleteDomain] = useState<Domain | null>(null);
	const [loading, setLoading] = useState(false);
	const [upgradePlanPopup, setUpgradePlanPopup] = useState(false);

	const handleDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setDropdownEl(event.currentTarget);
	};

	const handleDropdownClose = () => {
		setDropdownEl(null);
	};

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

	const handleSetDomain = (domain: string) => {
		sessionStorage.setItem("current_domain", domain);
		setCurrentDomain(domain.replace("https://", ""));
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

	const handleDeleteDomain = (domain: Domain) => {
		if (sessionStorage.getItem("current_domain") === domain.domain) {
			sessionStorage.removeItem("current_domain");
		}
		const savedMe = sessionStorage.getItem("me");
		const savedDomains = savedMe ? JSON.parse(savedMe).domains : [];
		const updatedDomains = savedDomains.filter(
			(d: Domain) => d.id !== domain.id,
		);
		const updatedMe = savedMe ? JSON.parse(savedMe) : {};
		updatedMe.domains = updatedDomains;
		sessionStorage.setItem("me", JSON.stringify(updatedMe));
		setDomains((prevDomains) => prevDomains.filter((d) => d.id !== domain.id));
		window.location.reload();
		setDeleteDomainPopup(false);
	};

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
					color: "rgba(128, 128, 128, 1)",
					border: "1px solid rgba(184, 184, 184, 1)",
					borderRadius: "4px",
					padding: "0px",
					width: "100%",
					paddingTop: "0.25rem",
					paddingBottom: "0.25rem",
					pr: 1,
					justifyContent: "space-between",
				}}
			>
				<Typography
					className="second-sub-title"
					sx={{
						marginRight: "0.5em",
						pl: 2,
						letterSpacing: "-0.02em",
						textAlign: "left",
						color: "rgba(98, 98, 98, 1) !important",
					}}
				>
					{currentDomain}
				</Typography>
				<ExpandMoreIcon sx={{ width: "24px", height: "24px" }} />
			</Button>
			<Menu
				id="account-dropdown"
				variant="menu"
				anchorEl={dropdownEl}
				open={dropdownOpen}
				onClose={handleDropdownClose}
				sx={{ "& .MuiMenu-list": { padding: "2px" } }}
			>
				<MenuItem onClick={() => setDomainPopup(true)}>
					<Typography
						className="second-sub-title"
						sx={{ color: "rgba(56, 152, 252, 1) !important" }}
					>
						{" "}
						+ Add Domain
					</Typography>
				</MenuItem>
				<AddDomainPopup
					open={showDomainPopup}
					handleClose={() => setDomainPopup(false)}
					handleSave={handleSave}
				/>
				<Box
					sx={{
						display: "flex",
						justifyContent: "flex-end",
						width: "100%",
						marginTop: "0.5rem",
					}}
				>
					<span
						style={{
							border: "1px solid #CDCDCD",
							marginBottom: "0.5rem",
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
					>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								cursor: domain.enable ? "pointer" : "not-allowed",
								width: "20rem",
								color: domain.enable ? "inherit" : "gray",
							}}
						>
							<Typography className="second-sub-title">
								{domain.domain.replace("https://", "")}
							</Typography>
							{domains.length > 1 && (
								<HoverableImage
									srcDefault="/trash-03.svg"
									srcHover="/trash-03-active.svg"
									alt="Remove"
									onClick={() => handleShowDelete(domain)}
									disabled={
										!(domains.length > 1 && domain.contacts_resolving !== true)
									}
								/>
							)}
						</Box>
					</MenuItem>
				))}
			</Menu>
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
		</>
	);
};

const DomainButtonSelect = () => {
	return (
		<SliderProvider>
			<DomainButton />
		</SliderProvider>
	);
};

export default DomainButtonSelect;
