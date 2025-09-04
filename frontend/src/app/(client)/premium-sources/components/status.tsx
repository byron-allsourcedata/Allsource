import type { FC } from "react";

import { styled, Typography } from "@mui/material";
import type { Status } from "@/app/features/premium-sources/schemas";

type StatusProps = {
	status: Status;
};

export const StatusLabel: FC<StatusProps> = ({ status }) => {
	const config = {
		syncing: {
			background: "#CCE6FE",
			text: "#0081FB",
			label: "Syncing",
		},
		ready: {
			background: "#FEF3CD",
			text: "#B39709",
			label: "Ready",
		},
		synced: {
			background: "#EAF8DD",
			text: "#2B5B00",
			label: "Synced",
		},
		failed: {
			background: "#FCCDC8",
			text: "#C83E2E",
			label: "Failed",
		},
		disabled: {
			background: "#DBDBDB",
			text: "#4A4A4A",
			label: "Disabled",
		},
		locked: {
			background: "#DBDBDB",
			text: "#4A4A4A",
			label: "Locked",
		},
	} satisfies Record<Status, unknown>;

	if (config[status] == null) {
		throw new Error(`Invalid status: ${status}`);
	}

	const colorSx = {
		background: config[status].background,
		color: config[status].text,
	};

	const label = config[status].label;

	return (
		<StatusLabelBox sx={colorSx}>
			<StatusLabelText>{label}</StatusLabelText>
		</StatusLabelBox>
	);
};

const StatusLabelBox = styled("div")`
    display: flex;
    height: 1.25rem;
    padding: 0.375rem 0.5rem;
    justify-content: center;
    align-items: center;
    gap: 0.125rem;
`;

const StatusLabelText = styled(Typography)`
    font-family: Roboto;
    font-size: 0.75rem;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
`;
