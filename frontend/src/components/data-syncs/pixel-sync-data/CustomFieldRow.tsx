import { Grid, TextField, MenuItem, IconButton } from "@mui/material";
import Image from "next/image";
import { CustomField, CustomFieldOption } from "./useCustomFields";

interface CustomFieldRowProps {
	index: number;
	field: CustomField;
	customFieldsList: CustomFieldOption[];
	customFields: CustomField[];
	handleChangeField: (
		index: number,
		key: keyof CustomField,
		value: string,
	) => void;
	handleDeleteField: (index: number) => void;
}

export const CustomFieldRow = ({
	index,
	field,
	customFieldsList,
	customFields,
	handleChangeField,
	handleDeleteField,
}: CustomFieldRowProps) => {
	return (
		<Grid
			container
			spacing={2}
			alignItems="center"
			sx={{ flexWrap: { xs: "nowrap", sm: "wrap" } }}
		>
			<Grid item xs={5} mb={2}>
				<TextField
					select
					fullWidth
					label="Custom Field"
					value={field.type}
					onChange={(e) => handleChangeField(index, "type", e.target.value)}
					InputLabelProps={{
						sx: {
							fontFamily: "var(--font-nunito)",
							fontSize: "14px",
							lineHeight: "16px",
							color: "rgba(17, 17, 19, 0.60)",
							top: "-5px",
							left: "3px",
							"&.Mui-focused": {
								color: "rgba(56, 152, 252, 1)",
								top: 0,
							},
							"&.MuiInputLabel-shrink": {
								top: 0,
							},
						},
					}}
					InputProps={{
						sx: {
							"&.MuiOutlinedInput-root": {
								height: "36px",
								"& .MuiOutlinedInput-input": {
									padding: "6.5px 8px",
									fontFamily: "var(--font-roboto)",
									color: "#202124",
									fontSize: "12px",
									fontWeight: "400",
									lineHeight: "20px",
								},
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: "#A3B0C2",
								},
								"&:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: "#A3B0C2",
								},
								"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
									borderColor: "rgba(56, 152, 252, 1)",
								},
							},
							"&+.MuiFormHelperText-root": {
								marginLeft: "0",
							},
						},
					}}
				>
					{customFieldsList.map((item) => (
						<MenuItem
							key={item.value}
							value={item.value}
							disabled={customFields.some((f) => f.type === item.value)}
						>
							{item.type}
						</MenuItem>
					))}
				</TextField>
			</Grid>

			<Grid
				item
				xs={1}
				container
				justifyContent="center"
				alignItems="center"
				sx={{
					paddingTop: "0 !important",
				}}
			>
				<Image src="/chevron-right-purple.svg" alt="" height={18} width={18} />
			</Grid>

			<Grid item xs={5} mb={2}>
				<TextField
					fullWidth
					value={field.value}
					onChange={(e) => handleChangeField(index, "value", e.target.value)}
					placeholder="Enter value"
					InputLabelProps={{
						sx: {
							fontFamily: "var(--font-nunito)",
							fontSize: "12px",
							lineHeight: "16px",
							color: "rgba(17, 17, 19, 0.60)",
							top: "-5px",
							"&.Mui-focused": {
								color: "rgba(56, 152, 252, 1)",
								top: 0,
							},
							"&.MuiInputLabel-shrink": {
								top: 0,
							},
						},
					}}
					InputProps={{
						sx: {
							maxHeight: "36px",
							"& .MuiOutlinedInput-input": {
								padding: "6.5px 8px",
								fontFamily: "var(--font-roboto)",
								color: "#202124",
								fontSize: "12px",
								fontWeight: "400",
								lineHeight: "20px",
							},
							"& .MuiOutlinedInput-notchedOutline": {
								borderColor: "#A3B0C2",
							},
							"&:hover .MuiOutlinedInput-notchedOutline": {
								borderColor: "#A3B0C2",
							},
							"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
								borderColor: "rgba(56, 152, 252, 1)",
							},
						},
					}}
				/>
			</Grid>

			<Grid
				item
				xs={1}
				container
				justifyContent="center"
				sx={{
					paddingTop: "0 !important", // убираем padding от MUI
				}}
			>
				<IconButton onClick={() => handleDeleteField(index)}>
					<Image src="/trash-icon-filled.svg" alt="" height={18} width={18} />
				</IconButton>
			</Grid>
		</Grid>
	);
};
