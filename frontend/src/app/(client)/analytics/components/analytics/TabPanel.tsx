import { Box } from "@mui/material";

interface TabPanelProps {
	children?: React.ReactNode;
	value: number;
	index: number;
}

export const TabPanel: React.FC<TabPanelProps> = ({
	children,
	value,
	index,
	...other
}) => {
	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`tabpanel-${index}`}
			aria-labelledby={`tab-${index}`}
			{...other}
		>
			{value === index && (
				<Box
					sx={{
						margin: 0,
						pt: 2,
						height: "100%",
					}}
				>
					{children}
				</Box>
			)}
		</div>
	);
};
