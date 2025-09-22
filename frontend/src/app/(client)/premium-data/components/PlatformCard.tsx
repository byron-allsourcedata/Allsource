import { Box } from "@mui/material";
import type { FC } from "react";

export type IntegrationStatus = "integrated" | "failed" | "not_integrated";

type Props = {
	status: IntegrationStatus;
	name: string;
	icon: string;
};

export const PlatformCard: FC<Props> = () => {
	return <Box>Go High Level</Box>;
};
