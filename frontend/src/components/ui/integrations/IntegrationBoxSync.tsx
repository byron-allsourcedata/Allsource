import { Add, MoreVert } from "@mui/icons-material";
import {
	Box,
	Button,
	Popover,
	Tooltip,
	Typography,
	type SxProps,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type IntegrationStatus = "integrated" | "failed" | "not_integrated";

type Props = {
	image?: string;
	status: IntegrationStatus;
	onSelect?: (integration: string) => void;
	onAdd?: (integration: string) => void;
	handleClick?: () => void;
	handleDelete?: () => void;
	service_name: string;
	error_message?: string;
};

export const IntegrationBoxSync = ({
	image,
	status,
	onSelect,
	onAdd,
	handleClick,
	service_name,
}: Props) => {
	const [isHovered, setIsHovered] = useState(false);
	const [openToolTip, setOpenTooltip] = useState(false);
	const tooltipRef = useRef<HTMLDivElement | null>(null);

	const altImageIntegration = ["Cordial"];

	const is_integrated = status === "integrated" || status === "failed";
	const is_failed = status === "failed";
	const is_available = status === "not_integrated";

	const openToolTipClick = () => {
		const isMobile = window.matchMedia("(max-width:900px)").matches;
		if (isMobile && !is_integrated) {
			setOpenTooltip(true);
		}
	};

	const handleClickOutside = (event: MouseEvent) => {
		if (
			tooltipRef.current &&
			!tooltipRef.current.contains(event.target as Node)
		) {
			setOpenTooltip(false);
		}
	};

	useEffect(() => {
		document.addEventListener("click", handleClickOutside);
		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	}, []);

	const formatServiceName = (name: string): string => {
		if (name === "big_commerce") {
			return "BigCommerce";
		}
		if (name === "google_ads") {
			return "GoogleAds";
		}
		if (name === "sales_force") {
			return "SalesForce";
		}
		if (name === "bing_ads") {
			return "BingAds";
		}
		return name
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

	const toTitleCase = (str: string) => {
		return str
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

	const integrated: SxProps = {
		":hover": {
			backgroundColor: "rgba(80, 82, 178, 0.1)",
			border: "1px solid rgba(56, 152, 252)",
			cursor: "pointer",
		},
	};

	const styles = {
		integrated,
		failed: {},
		not_integrated: {},
	};

	const activeStyle = styles[status] ?? {};

	return (
		<Box
			sx={{
				overflow: "auto",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				cursor: "pointer",
			}}
			onClick={() => {
				if (status === "integrated") {
					onSelect?.(service_name);
				} else if (status === "not_integrated") {
					onAdd?.(service_name);
				}
			}}
		>
			<Tooltip
				open={openToolTip || isHovered}
				ref={tooltipRef}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onClick={openToolTipClick}
				componentsProps={{
					tooltip: {
						sx: {
							backgroundColor: "#f5f5f5",
							color: "#000",
							boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.12)",
							border: " 0.2px rgba(0, 0, 0, 0.04)",
							borderRadius: "4px",
							maxHeight: "100%",
							whiteSpace: "normal",
							minWidth: "200px",
							zIndex: 99,
							padding: "11px 10px",
							fontSize: "12px !important",
							fontFamily: "var(--font-nunito)",
						},
					},
				}}
				title={
					is_failed
						? `A ${toTitleCase(
								service_name,
							)} account is already integrated. To connect a different account, please remove the existing ${toTitleCase(
								service_name,
							)} integration first.`
						: ""
				}
			>
				<Box
					sx={{
						backgroundColor: !is_integrated
							? "rgba(0, 0, 0, 0.04)"
							: "transparent",
						border: "1px solid #E4E4E4",
						position: "relative",
						display: "flex",
						borderRadius: "4px",
						cursor: is_integrated ? "default" : "pointer",
						width: "8rem",
						height: "8rem",
						filter: !is_integrated ? "grayscale(1)" : "none",
						justifyContent: "center",
						alignItems: "center",
						transition: "0.2s",
						"&:hover": {
							boxShadow: is_integrated ? "none" : "0 0 4px #00000040",
							filter: !is_integrated ? "none" : "none",
							backgroundColor: !is_integrated
								? "transparent"
								: "rgba(80, 82, 178, 0.1)",
						},
						"&:hover .edit-icon": {
							opacity: 1,
						},
						"@media (max-width: 900px)": {
							width: "156px",
						},
						...activeStyle,
					}}
				>
					{!is_available && (
						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
							}}
						>
							<Box
								onClick={handleClick}
								sx={{
									position: "absolute",
									top: "0%",
									left: "0%",
									margin: "8px 0 0 8px",
									transition: "opacity 0.2s",
									cursor: "pointer",
									display: "flex",
									background: !is_failed ? "#EAF8DD" : "#FCDBDC",
									height: "20px",
									padding: "2px 8px 1px 8px",
									borderRadius: "4px",
								}}
							>
								{!is_failed ? (
									<Typography
										fontSize={"12px"}
										fontFamily="var(--font-nunito)"
										color={"#2B5B00"}
										fontWeight={600}
									>
										Integrated
									</Typography>
								) : (
									<Typography
										fontSize={"12px"}
										fontFamily="var(--font-nunito)"
										color={"#4E0110"}
										fontWeight={600}
									>
										Failed
									</Typography>
								)}
							</Box>
						</Box>
					)}
					{!is_integrated && isHovered && (
						<Box
							sx={{
								position: "absolute",
								top: "50%",
								left: "50%",
								transform: "translate(-50%, -50%)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: "100%",
								height: "100%",
							}}
						>
							<Add sx={{ color: "rgba(56, 152, 252, 1)", fontSize: 45 }} />
						</Box>
					)}
					{image && (
						<Image
							src={image}
							width={
								altImageIntegration.some((int) => int === service_name)
									? 100
									: 32
							}
							height={32}
							alt={service_name}
							style={{
								transition: "0.2s",
								filter: !is_integrated && isHovered ? "blur(10px)" : "none",
							}}
						/>
					)}
				</Box>
			</Tooltip>
			<Typography
				mt={0.5}
				fontSize={"14px"}
				fontWeight={500}
				textAlign={"center"}
				fontFamily="var(--font-nunito)"
			>
				{formatServiceName(service_name)}
			</Typography>
		</Box>
	);
};
