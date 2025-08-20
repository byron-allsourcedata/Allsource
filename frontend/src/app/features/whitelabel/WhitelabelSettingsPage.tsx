import { Column } from "@/components/Column";
import { T } from "@/components/ui/T";

import { useEffect, useState, type FC } from "react";
import { SettingCard } from "./components/SettingCard";
import { Paper, styled, TextField, ThemeProvider } from "@mui/material";
import { whitelabelTheme } from "./theme";
import {
	useFieldValue,
	useOptionalFieldValue,
} from "@/components/premium-sources/hooks/useFieldValue";
import { WhitelabelExample } from "./components/example/WhitelabelExample";
import { Row } from "@/components/Row";
import { useElementViewportPosition } from "./hooks/useViewportPosition";
import { LogoUploader } from "./components/upload/LogoUploader";
import { useBlobUrl } from "./hooks/useBlobUrl";
import { usePageDragging } from "@/components/premium-sources/hooks/useFileDragAndDrop";
import { CustomButton } from "@/components/ui";

import { showErrorToast, showToast } from "@/components/ToastNotification";
import useDefaultAxios from "axios-hooks";
import { useFilePicker } from "./hooks/useFilePicker";
import {
	useGetOwnWhitelabelSettings,
	usePostWhitelabelSettings,
} from "./requests";
import { useWhitelabel } from "./contexts/WhitelabelContext";
import { LoadingTextField } from "./components/LoadingTextField";

type Props = {};

function useLogoUrl(file: File | null) {
	const [logoUrl, setLogoUrl] = useState<string>();
	const fileBlobUrl = useBlobUrl(file);

	useEffect(() => {
		if (fileBlobUrl) {
			setLogoUrl(fileBlobUrl);
		}
	}, [fileBlobUrl]);

	return [logoUrl, setLogoUrl] as const;
}

function useUploadedLogoRequest(url: string) {
	const [{ data, loading, response, error }, refetch] = useDefaultAxios(
		{
			url: `${url}?xhr=true`,
		},
		{
			manual: true,
		},
	);

	return {
		data,
		loading,
		refetch,
		error,
		contentType: response?.headers["content-type"],
	};
}

function useUploadedLogo(url: string | undefined) {
	const { data, loading, error, refetch, contentType } = useUploadedLogoRequest(
		url ?? "",
	);

	useEffect(() => {
		if (url) {
			refetch({
				responseType: "blob",
				headers: {
					Authorization: undefined,
				},
			});
		}
	}, [url, refetch]);

	return [data, loading, contentType, error] as const;
}

export const WhitelabelSettingsPage: FC<Props> = ({}) => {
	const [ref, yFromTop, pxToBottom] =
		useElementViewportPosition<HTMLDivElement>({
			paddingBottom: 20,
		});
	const [brandNameField, setBrandName] = useOptionalFieldValue();
	const [meetingUrlField, setMeetingUrl] = useOptionalFieldValue();

	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [logoUrl, setLogoUrl] = useLogoUrl(logoFile);

	const [smallLogoFile, setSmallLogoFile] = useState<File | null>(null);
	const [smallLogoUrl, setSmallLogoUrl] = useLogoUrl(smallLogoFile);

	const { refetch: refetchWhitelabel } = useWhitelabel();

	const isWindowDragging = usePageDragging();

	const { openFileDialog, FileInput: hiddenLogoFileInput } = useFilePicker({
		accept: "image/svg+xml,image/png",
		onFileUpload: (files) => {
			const file = files[0];
			setLogoFile(file);
		},
		multiple: false,
	});

	const {
		openFileDialog: openSmallFileDialog,
		FileInput: hiddenSmallLogoFileInput,
	} = useFilePicker({
		accept: "image/svg+xml,image/png",
		onFileUpload: (files) => {
			const file = files[0];
			setSmallLogoFile(file);
		},
		multiple: false,
	});
	const [{ loading: settingsUpdateLoading }, updateSettings] =
		usePostWhitelabelSettings();

	const [
		{ data: initialSettings, loading: settingsLoading },
		fetchWhitelabelSettings,
	] = useGetOwnWhitelabelSettings(true);

	const [
		uploadedLogo,
		uploadedLogoLoading,
		uploadedLogoContentType,
		logoError,
	] = useUploadedLogo(initialSettings?.brand_logo_url);

	const [
		uploadedSmallLogo,
		uploadedSmallLogoLoading,
		uploadedSmallLogoContentType,
		iconError,
	] = useUploadedLogo(initialSettings?.brand_icon_url);

	useEffect(() => {
		fetchWhitelabelSettings().catch(() => {});
	}, []);

	useEffect(() => {
		if (uploadedLogo) {
			setLogoFile(
				new File([uploadedLogo], "logo", {
					type: String(uploadedLogoContentType),
				}),
			);
		}
	}, [uploadedLogo]);

	useEffect(() => {
		if (uploadedSmallLogo) {
			setSmallLogoFile(
				new File([uploadedSmallLogo], "logo-icon", {
					type: String(uploadedSmallLogoContentType),
				}),
			);
		}
	}, [uploadedSmallLogo]);

	useEffect(() => {
		if (initialSettings) {
			setBrandName(initialSettings.brand_name || "Allsource");
			setLogoUrl(initialSettings.brand_logo_url || "/logo.svg");
			setSmallLogoUrl(initialSettings.brand_icon_url || "/logo-icon.svg");
			setMeetingUrl(initialSettings.meeting_url ?? "");
		}
	}, [initialSettings]);

	const onSave = () => {
		if (!settingsUpdateLoading) {
			const formData = new FormData();

			if (brandNameField.value) {
				formData.append("brand_name", brandNameField.value);
			}

			if (logoFile) {
				formData.append("logo", logoFile || "");
			}

			if (smallLogoFile) {
				formData.append("small_logo", smallLogoFile || "");
			}

			if (meetingUrlField.value) {
				formData.append("meeting_url", meetingUrlField.value);
			}

			updateSettings({ data: formData })
				.then(() => {
					refetchWhitelabel();
					showToast("Whitelabel settings updated");
				})
				.catch((error) => {
					console.error(error);
					showErrorToast("Error while updating whitelabel settings");
				});
		}
	};

	return (
		<ThemeProvider theme={whitelabelTheme}>
			<Row
				ref={ref}
				gap="1.5rem"
				sx={{
					height: pxToBottom,

					padding: 2,
					overflowX: "clip",
				}}
			>
				{hiddenLogoFileInput}
				{hiddenSmallLogoFileInput}
				<Paper
					sx={{ minWidth: "440px", overflowY: "auto", overflowX: "hidden" }}
				>
					<Column
						height="inherit"
						sx={{ minWidth: "400px" }}
						maxWidth="400px"
						gap="1rem"
					>
						<T variant="h2">Whitelabel </T>

						<SettingCard
							title="Enter Your Brand Name"
							description="This name will appear across the platform as your brand identity"
						>
							<LoadingTextField {...brandNameField} />
						</SettingCard>

						<SettingCard
							title="Upload Your Full Logo"
							description="Add your agency's logo to replace the Allsource one"
						>
							<LogoUploader
								loading={settingsLoading || uploadedLogoLoading}
								errorLoadingFile={!!logoError}
								logoUrl={logoUrl}
								selectedFile={logoFile}
								isDragging={isWindowDragging}
								onOpenFilePicker={openFileDialog}
								onFileSelect={setLogoFile}
								onRemoveFile={() => {
									setLogoUrl("/logo.svg");
									setLogoFile(null);
								}}
								image={{
									width: 130,
									height: 30,
								}}
							/>
						</SettingCard>
						<SettingCard
							title="Upload Your Square Logo"
							description="Add your smaller version of logo"
						>
							<LogoUploader
								loading={settingsLoading || uploadedSmallLogoLoading}
								errorLoadingFile={!!iconError}
								logoUrl={smallLogoUrl}
								selectedFile={smallLogoFile}
								isDragging={isWindowDragging}
								onOpenFilePicker={openSmallFileDialog}
								onFileSelect={setSmallLogoFile}
								onRemoveFile={() => {
									setSmallLogoUrl("/logo-icon.svg");
									setSmallLogoFile(null);
								}}
							/>
						</SettingCard>
						<SettingCard
							title="Change your meeting url"
							description="Change url that will be used when scheduling a demo call"
						>
							<LoadingTextField {...meetingUrlField} />
						</SettingCard>
						<Row width="inherit" justifyContent="flex-end">
							<CustomButton
								disabled={settingsUpdateLoading || !brandNameField.value}
								onClick={onSave}
							>
								Save
							</CustomButton>
						</Row>
					</Column>
				</Paper>
				<Column flex={1} height="calc(100% - 2rem)">
					<Paper
						sx={{
							gap: "1rem",
							display: "flex",
							height: "100%",
							flexDirection: "column",
						}}
					>
						<ComponentTitle>Preview</ComponentTitle>
						<WhitelabelExample
							brandName={
								brandNameField.value ? brandNameField.value : undefined
							}
							logoSrc={logoUrl ?? "/logo.svg"}
							smallLogoSrc={smallLogoUrl ?? "/logo-icon.svg"}
						/>
					</Paper>
				</Column>
			</Row>
		</ThemeProvider>
	);
};

const ComponentTitle = styled(T)`
color: #202124;
font-family: "Nunito Sans";
font-size: 16px;
font-style: normal;
font-weight: 500;
line-height: normal;
`;
