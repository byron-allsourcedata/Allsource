import {
	Box,
	FormControl,
	FormControlLabel,
	FormLabel,
	Radio,
	RadioGroup,
	Typography,
} from "@mui/material";
import type { FC } from "react";

type Props = {
	showError: boolean;
	selectedRadioValue: string | undefined;
	handleRadioChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export const SyncFilter: FC<Props> = ({
	showError: tab2Error,
	selectedRadioValue,
	handleRadioChange,
}) => {
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: "16px",
			}}
		>
			<Box
				sx={{
					p: 2,
					border: "1px solid #f0f0f0",
					borderRadius: "4px",
					boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.20)",
					display: "flex",
					flexDirection: "column",
					gap: "16px",
				}}
			>
				<Typography variant="subtitle1" className="paragraph">
					Synchronize all data in real-time from this moment forward for
					seamless integration and continuous updates.
				</Typography>
				<FormControl sx={{ gap: "16px" }} error={tab2Error}>
					<FormLabel
						id="contact-type-radio-buttons-group-label"
						className="first-sub-title"
						sx={{
							"&.Mui-focused": {
								color: "#000",
								transform: "none !important",
							},
						}}
					>
						Filter by Contact type
					</FormLabel>
					<RadioGroup
						aria-labelledby="contact-type-radio-buttons-group-label"
						name="contact-type-row-radio-buttons-group"
						value={selectedRadioValue}
						onChange={handleRadioChange}
					>
						<FormControlLabel
							value="allContacts"
							control={
								<Radio
									sx={{
										color: "#e4e4e4",
										"&.Mui-checked": {
											color: "rgba(56, 152, 252, 1)",
										},
									}}
								/>
							}
							label="All Contacts"
							componentsProps={{
								typography: {
									sx: {
										fontFamily: "var(--font-nunito)",
										fontSize: "14px",
										fontWeight: "500",
										color: "#000",
										lineHeight: "normal",
										opacity: selectedRadioValue === "allContacts" ? 1 : 0.43,
										"@media (max-width:440px)": {
											fontSize: "12px",
										},
									},
								},
							}}
							sx={{
								"@media (max-width:600px)": {
									flexBasis: "calc(50% - 8px)",
								},
							}}
						/>
						<FormControlLabel
							value="visitor"
							control={
								<Radio
									sx={{
										color: "#e4e4e4",
										"&.Mui-checked": {
											color: "rgba(56, 152, 252, 1)",
										},
									}}
								/>
							}
							label="Visitors"
							componentsProps={{
								typography: {
									sx: {
										fontFamily: "var(--font-nunito)",
										fontSize: "14px",
										fontWeight: "500",
										color: "#000",
										lineHeight: "normal",
										opacity: selectedRadioValue === "visitors" ? 1 : 0.43,
										"@media (max-width:440px)": {
											fontSize: "12px",
										},
									},
								},
							}}
							sx={{
								"@media (max-width:600px)": {
									flexBasis: "calc(50% - 8px)",
								},
							}}
						/>
						<FormControlLabel
							value="viewed_product"
							control={
								<Radio
									sx={{
										color: "#e4e4e4",
										"&.Mui-checked": {
											color: "rgba(56, 152, 252, 1)",
										},
									}}
								/>
							}
							label="View Product"
							componentsProps={{
								typography: {
									sx: {
										fontFamily: "var(--font-nunito)",
										fontSize: "14px",
										fontWeight: "500",
										color: "#000",
										lineHeight: "normal",
										opacity: selectedRadioValue === "viewProduct" ? 1 : 0.43,
										"@media (max-width:440px)": {
											fontSize: "12px",
										},
									},
								},
							}}
							sx={{
								"@media (max-width:600px)": {
									flexBasis: "calc(50% - 8px)",
								},
							}}
						/>
						<FormControlLabel
							value="added_to_cart"
							control={
								<Radio
									sx={{
										color: "#e4e4e4",
										"&.Mui-checked": {
											color: "rgba(56, 152, 252, 1)",
										},
									}}
								/>
							}
							label="Abandoned cart"
							componentsProps={{
								typography: {
									sx: {
										fontFamily: "var(--font-nunito)",
										fontSize: "14px",
										fontWeight: "500",
										color: "#000",
										lineHeight: "normal",
										opacity: selectedRadioValue === "addToCart" ? 1 : 0.43,
										"@media (max-width:440px)": {
											fontSize: "12px",
										},
									},
								},
							}}
							sx={{
								"@media (max-width:600px)": {
									flexBasis: "calc(50% - 8px)",
								},
							}}
						/>
						<FormControlLabel
							value="converted_sales"
							control={
								<Radio
									sx={{
										color: "#e4e4e4",
										"&.Mui-checked": {
											color: "rgba(56, 152, 252, 1)",
										},
									}}
								/>
							}
							label="Converted Sales"
							componentsProps={{
								typography: {
									sx: {
										fontFamily: "var(--font-nunito)",
										fontSize: "14px",
										fontWeight: "500",
										color: "#000",
										lineHeight: "normal",
										opacity: selectedRadioValue === "addToCart" ? 1 : 0.43,
										"@media (max-width:440px)": {
											fontSize: "12px",
										},
									},
								},
							}}
							sx={{
								"@media (max-width:600px)": {
									flexBasis: "calc(50% - 8px)",
								},
							}}
						/>
					</RadioGroup>
				</FormControl>
			</Box>
		</Box>
	);
};
