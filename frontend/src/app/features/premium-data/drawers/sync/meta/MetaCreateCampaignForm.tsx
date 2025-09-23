import {
	Box,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Typography,
	Divider,
	type SelectChangeEvent,
} from "@mui/material";
import { MetaButton } from "./buttons/MetaButton";
import type { FC } from "react";
import { DollarTextField } from "@/components/ui/inputs/DollarTextField";

type Props = {
	anchorEl: HTMLElement | null;
	brandName: string;
	campaignName: string;
	campaignObjective: string;
	bidAmount: number;
	dailyBudget: number;
	isChecked: boolean;
	onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSelectChange: (e: SelectChangeEvent<string>) => void;
	onSaveCampaign: () => void;
};
export const MetaCreateCampaignForm: FC<Props> = ({
	anchorEl,
	brandName,
	campaignName,
	campaignObjective,
	bidAmount,
	dailyBudget,
	isChecked,
	onInputChange,
	onSelectChange,
	onSaveCampaign,
}) => {
	return (
		<Box>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: "24px",
					p: 2,
					width: anchorEl ? `${anchorEl.clientWidth}px` : "538px",
					pt: 0,
				}}
			>
				<Box sx={{ textAlign: "right" }}>
					<TextField
						label="Campaign Name"
						variant="outlined"
						name="campaignName"
						value={campaignName}
						onKeyDown={(e) => e.stopPropagation()}
						onChange={onInputChange}
						fullWidth
						margin="normal"
						sx={{
							fontFamily: "var(--font-nunito)",
							"& .MuiInputBase-input": {
								fontSize: "14px",
								lineHeight: "16px",
							},
							"& .MuiInputLabel-root": {
								fontSize: "14px",
							},
							"& .MuiOutlinedInput-root": {
								fontSize: "14px",
							},
						}}
					/>
					<FormControl
						variant="outlined"
						fullWidth
						margin="normal"
						sx={{ fontSize: "10px" }}
					>
						<InputLabel sx={{ fontSize: "14px" }}>Campaign goal</InputLabel>
						<Select
							name="campaignObjective"
							value={campaignObjective}
							onChange={onSelectChange}
							label="Campaign goal"
							sx={{
								fontSize: "16px",
								textAlign: "left",
								justifyContent: "flex-start",
								"& .MuiSelect-select": {
									fontSize: "16px",
								},
							}}
						>
							<MenuItem value="LINK_CLICKS" sx={{ fontSize: "14px" }}>
								link clicks
							</MenuItem>
							<MenuItem value="LANDING_PAGE_VIEWS" sx={{ fontSize: "14px" }}>
								landing page views
							</MenuItem>
						</Select>
					</FormControl>
					<DollarTextField
						label="Bid Amount"
						name="bidAmount"
						value={bidAmount}
						onChange={onInputChange}
					/>
					<DollarTextField
						label="Daily Budget"
						name="dailyBudget"
						value={dailyBudget}
						onChange={onInputChange}
					/>
					<Typography variant="body2" color="textSecondary" paragraph>
						We will not run your campaign.
						{brandName}
						will create a campaign template in your ad account. We won&apos;t
						run anything without your confirmation.
					</Typography>
					<MetaButton
						variant="contained"
						onClick={onSaveCampaign}
						disabled={!isChecked}
					>
						Save
					</MetaButton>
				</Box>
			</Box>

			{/* Add a Divider to separate form from options */}
			<Divider sx={{ borderColor: "#cdcdcd" }} />
		</Box>
	);
};
