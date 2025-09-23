import { Column } from "@/components/Column";
import {
	DrawerContainer,
	DrawerContent,
} from "@/components/drawers/DrawerContainer";
import { DrawerHeader } from "@/components/drawers/DrawerHeader";
import { PremiumSourceUploaded } from "@/components/premium-data/components/PremiumDataUploaded";
import { useFieldValue } from "@/components/premium-data/hooks/useFieldValue";
import { Row } from "@/components/Row";
import { CustomButton } from "@/components/ui";
import { T } from "@/components/ui/T";
import { LinearProgress, TextField, Divider } from "@mui/material";
import type { FC } from "react";
import { useAdminRenamePremiumData } from "../requests";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import type { AxiosError } from "axios";

type Props = {
	premiumSourceId: string;
	initialName: string;
	onClose: () => void;
};

/**
 * Self-contained drawer, that does not require configuration
 */
export const RenamePremiumSourceDrawer: FC<Props> = ({
	premiumSourceId,
	initialName,
	onClose,
}) => {
	const { loading: renameLoading, rename } = useAdminRenamePremiumData();
	const [nameField] = useFieldValue(initialName);

	const renameEnabled =
		nameField.value.trim().length > 0 && nameField.value !== initialName;

	return (
		<RenamePremiumSourceDrawerView
			onClose={onClose}
			source={{
				size: undefined,
				filename: undefined,
			}}
			loading={renameLoading}
			renameEnabled={renameEnabled}
			onRename={() => {
				rename(premiumSourceId, nameField.value)
					.then(() => {
						showToast("Premium Data renamed successfully", {
							autoClose: 1500,
						});
						onClose();
					})
					.catch((e: AxiosError) => {
						showErrorToast("Failed to rename premium data");
					});
			}}
			name={nameField}
		/>
	);
};

type ViewProps = {
	source: {
		size?: number;
		filename?: string;
	};

	loading: boolean;
	renameEnabled: boolean;
	name: {
		value: string;
		onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	};
	onClose: () => void;
	onRename: () => void;
};

/**
 * View-only component, that does not contain any logic, may be reused
 */
export const RenamePremiumSourceDrawerView: FC<ViewProps> = ({
	source,
	loading,
	renameEnabled,
	name,
	onRename,
	onClose,
}) => {
	const nameField = name;

	return (
		<DrawerContainer>
			<DrawerHeader title="Add Premium Data" onClose={onClose} />
			{loading && <LinearProgress variant="indeterminate" />}
			<DrawerContent>
				<Column justifyContent="space-between" height="inherit">
					<Column gap="1rem">
						<T>Rename existing Premium Data</T>

						<TextField
							title="Name"
							label="Name"
							placeholder="Premium Data Name"
							InputLabelProps={{
								shrink: true,
							}}
							{...nameField}
						/>
						{source.filename && (
							<>
								<Divider />
								<PremiumSourceUploaded
									name={source.filename}
									size={source.size}
								/>
							</>
						)}
					</Column>
					<Row justifyContent="flex-end">
						<CustomButton variant="outlined" onClick={onClose}>
							Cancel
						</CustomButton>
						<CustomButton disabled={!renameEnabled} onClick={onRename}>
							Rename
						</CustomButton>
					</Row>
				</Column>
			</DrawerContent>
		</DrawerContainer>
	);
};
