import { useRef, type FC, type ReactNode } from "react";
import {
	Box,
	IconButton,
	InputAdornment,
	Menu,
	TextField,
} from "@mui/material";
import Image from "next/image";

type GoogleAdsDropdownProps = {
	selectedName: string;
	isOpen: boolean;
	onClick: () => void;
	toggle: () => void;
	onClose: () => void;

	label?: string;
	disabled?: boolean;
	shrink?: boolean;
	menuItems?: ReactNode[];
};

export const GoogleAdsDropdown: FC<GoogleAdsDropdownProps> = ({
	selectedName,
	isOpen,
	onClick,
	toggle,
	onClose,
	menuItems,
	label = "",
}) => {
	const anchorRef = useRef<HTMLDivElement>(null);

	const selectedAccountName = selectedName;
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: "24px",
			}}
		>
			<TextField
				ref={anchorRef}
				variant="outlined"
				value={selectedAccountName}
				onClick={onClick}
				size="small"
				fullWidth
				label={selectedAccountName ? "" : label}
				InputLabelProps={{
					// shrink: true,
					// shrink: isShrunk || inputCustomerName !== "",
					sx: {
						fontFamily: "var(--font-nunito)",
						fontSize: "12px",
						lineHeight: "16px",
						color: "rgba(17, 17, 19, 0.60)",
						letterSpacing: "0.06px",
						top: "5px",
						"&.Mui-focused": {
							color: "rgba(56, 152, 252, 1)",
						},
					},
				}}
				InputProps={{
					endAdornment: (
						<InputAdornment position="end">
							<IconButton onClick={toggle} edge="end">
								{isOpen ? (
									<Image
										src="/chevron-drop-up.svg"
										alt="chevron-drop-up"
										height={24}
										width={24}
									/>
								) : (
									<Image
										src="/chevron-drop-down.svg"
										alt="chevron-drop-down"
										height={24}
										width={24}
									/>
								)}
							</IconButton>
						</InputAdornment>
					),
					// sx: metaStyles.formInput,
				}}
				sx={{
					"& input": {
						caretColor: "transparent",
						fontFamily: "var(--font-nunito)",
						fontSize: "14px",
						color: "rgba(0, 0, 0, 0.89)",
						fontWeight: "600",
						lineHeight: "normal",
					},
					"& .MuiOutlinedInput-input": {
						cursor: "default",
						top: "5px",
					},
					marginBottom: "24px",
				}}
			/>
			<GoogleAdsMenu
				open={isOpen}
				anchor={anchorRef?.current}
				onClose={onClose}
			>
				{menuItems}
			</GoogleAdsMenu>
		</Box>
	);
};

type GoogleAdsMenuProps = {
	open: boolean;
	anchor: Element | null;
	// accounts: Customer[];
	// onSelect: (account: Customer) => void;
	onClose: () => void;
	children?: ReactNode;
};

export const GoogleAdsMenu: FC<GoogleAdsMenuProps> = ({
	open,
	anchor,
	// accounts: customersInfo,
	// onSelect,
	onClose,
	children,
}) => {
	return (
		<Menu
			anchorEl={anchor}
			open={Boolean(anchor) && open}
			onClose={onClose}
			PaperProps={{
				sx: {
					width: anchor ? `${anchor.clientWidth}px` : "538px",
					borderRadius: "4px",
					border: "1px solid #e4e4e4",
				},
			}}
		>
			{children}
			{/* {customersInfo?.map((account) => (
				<MenuItem
					key={account.customer_id}
					onClick={() => onSelect(account)}
					sx={{
						"&:hover": {
							background: "rgba(80, 82, 178, 0.10)",
						},
					}}
				>
					<ListItemText
						primary={account.customer_name}
						primaryTypographyProps={{
							sx: {
								fontFamily: "var(--font-nunito)",
								fontSize: "14px",
								color: "#202124",
								fontWeight: "500",
								lineHeight: "20px",
							},
						}}
					/>
				</MenuItem>
			))} */}
		</Menu>
	);
};
