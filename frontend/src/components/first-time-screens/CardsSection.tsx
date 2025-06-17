import React from "react";
import { Grid, SxProps, Theme } from "@mui/material";
import FeatureCard from "./FeatureCard";
import { FeatureCardProps } from "@/types/first_time_screens";

interface CardsSectionProps {
	items: FeatureCardProps[];
	containerSx?: SxProps<Theme>;
	itemProps?: {
		xs?: number;
		sm?: number;
		md?: number;
		lg?: number;
		sx?: SxProps<Theme>;
	};
	spacing?: number | { xs?: number; sm?: number; md?: number };
}

const CardsSection: React.FC<CardsSectionProps> = ({
	items,
	containerSx = {},
	itemProps = {},
	spacing = { xs: 2, md: 3 },
}) => {
	const {
		xs = 12,
		sm = undefined,
		md = 5.8,
		lg = undefined,
		sx: itemSx = {},
	} = itemProps;

	return (
		<Grid
			container
			alignItems="stretch"
			justifyContent="center"
			spacing={spacing}
			sx={containerSx}
		>
			{items.map((props, index) => (
				<Grid
					item
					key={index}
					xs={xs}
					sm={sm}
					md={md}
					lg={lg}
					sx={itemSx}
					padding={0}
				>
					<FeatureCard {...props} />
				</Grid>
			))}
		</Grid>
	);
};

export default CardsSection;
