import type { FC } from "react";

import { StatusLabel } from "../components/status";
import { LinearProgress } from "@mui/material";
import type { Status } from "@/app/features/premium-sources/schemas";

type Props = {
	/**
	 * The progress of the sync as a number between 0 and 1
	 */
	progress: number;
	status: Status;
};

export const PremiumSyncStatus: FC<Props> = ({ progress, status }) => {
	if (status === "syncing") {
		return <LinearProgress variant="determinate" value={progress} />;
	}

	return <StatusLabel status={status} />;
};
