import {
	Grid,
	TextField,
	MenuItem,
	IconButton,
	Box,
	Typography,
} from "@mui/material";
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
		value: string | boolean,
	) => void;
	handleDeleteField: (index: number) => void;
	extendedCustomFieldsList?: CustomFieldOption[];
	isDuplicate?: (type: string, index: number) => boolean;
	isSnakeCase?: (value: string) => boolean;
}

export const CustomFieldRow = ({
	index,
	field,
	customFieldsList,
	customFields,
	handleChangeField,
	handleDeleteField,
	extendedCustomFieldsList = customFieldsList,
	isDuplicate = () => false,
	isSnakeCase = (value) => /^[a-z][a-z0-9_]*(_[a-z0-9]+)*$/.test(value),
}: CustomFieldRowProps) => {
	const handleTypeChange = (value: string) => {
		if (value === "__constant__") {
			handleChangeField(index, "type", "");
			handleChangeField(index, "is_constant", true);
		} else {
			handleChangeField(index, "type", value);
			handleChangeField(index, "is_constant", false);
		}
	};

	return (
		<Grid
			container
			spacing={2}
			alignItems="center"
			sx={{ flexWrap: { xs: "nowrap", sm: "wrap" } }}
		>
			<Grid item xs={5} mb={2}>
				{field.is_constant ? (
					<TextField
						fullWidth
						label="Constant Field Name"
						value={field.type}
						onChange={(e) => handleChangeField(index, "type", e.target.value)}
						placeholder="Enter field name"
						error={!!field.type && !isSnakeCase(field.type)}
						helperText={
							!!field.type && !isSnakeCase(field.type)
								? "Field name must be in snake_case"
								: ""
						}
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
					/>
				) : (
					<TextField
						select
						fullWidth
						label="Custom Field"
						value={field.type}
						onChange={(e) => handleTypeChange(e.target.value)}
						error={isDuplicate(field.type, index)}
						helperText={
							isDuplicate(field.type, index)
								? "This field name already exists"
								: ""
						}
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
						{extendedCustomFieldsList.map((item) => (
							<MenuItem
								key={item.value}
								value={item.value}
								disabled={
									item.value !== "__constant__" &&
									customFields.some(
										(f) => f.type === item.value && !f.is_constant,
									)
								}
							>
								{item.type}
							</MenuItem>
						))}
					</TextField>
				)}
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
					paddingTop: "0 !important",
				}}
			>
				<IconButton onClick={() => handleDeleteField(index)}>
					<Image src="/trash-icon-filled.svg" alt="" height={18} width={18} />
				</IconButton>
			</Grid>

			{/* Сообщение об ошибке для snake_case */}
			{field.is_constant && field.type && !isSnakeCase(field.type) && (
				<Grid item xs={12}>
					<Box sx={{ pl: 2.25, mt: "-6px", mb: 1 }}>
						<Typography
							sx={{
								color: "#d32f2f",
								fontSize: "12px",
								marginTop: "4px",
								marginLeft: "2px",
								fontFamily: "var(--font-roboto)",
							}}
						>
							Field name must be in snake_case: lowercase letters and
							underscores only
						</Typography>
					</Box>
				</Grid>
			)}
		</Grid>
	);
};
