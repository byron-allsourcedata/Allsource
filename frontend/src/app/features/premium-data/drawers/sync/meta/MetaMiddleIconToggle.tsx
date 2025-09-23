import { Grid } from "@mui/material";
import type { FC } from "react";

import { CloseCircle } from "./icons/CloseCircle";
import { ChevronRightPurple } from "./icons/ChevronRightPurple";

type Props = {
	selected: boolean;
	showChevron: boolean;
};

export const MetaMiddleIconToggle: FC<Props> = ({ selected, showChevron }) => {
	// {
	// 	/* Middle Icon Toggle (Right Arrow or Close Icon) */
	// } selected = row.selectValue !== undefined

	return (
		<Grid item xs="auto" sm={1} container justifyContent="center">
			{showChevron ? (
				<ChevronRightPurple />
			) : selected ? (
				<ChevronRightPurple />
			) : (
				<CloseCircle />
			)}
		</Grid>
	);
};

function selectIcon(a: boolean, b: boolean) {
	if (a && !b) {
		return <CloseCircle />;
	}

	return <ChevronRightPurple />;
}
