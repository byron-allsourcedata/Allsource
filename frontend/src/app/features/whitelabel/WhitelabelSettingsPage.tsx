import { Column } from "@/components/Column";
import { T } from "@/components/ui/T";

import { useState, type FC } from "react";
import { SettingCard } from "./components/SettingCard";
import { Paper, styled, TextField, ThemeProvider } from "@mui/material";
import { whitelabelTheme } from "./theme";
import { useFieldValue } from "@/components/premium-sources/hooks/useFieldValue";
import { WhitelabelExample } from "./components/example/WhitelabelExample";
import { Row } from "@/components/Row";
import { useElementViewportPosition } from "./hooks/useViewportPosition";
import { LogoUploader } from "./components/upload/LogoUploader";
import { useBlobUrl } from "./hooks/useBlobUrl";
import { usePageDragging } from "@/components/premium-sources/hooks/useFileDragAndDrop";
import { CustomButton } from "@/components/ui";

type Props = {};

export const WhitelabelSettingsPage: FC<Props> = ({}) => {
	const [ref, yFromTop, pxToBottom] =
		useElementViewportPosition<HTMLDivElement>({
			paddingBottom: 12,
		});
	const [brandNameField] = useFieldValue("Allsource");

	const [logoFile, setLogoFile] = useState<File | null>(null);
	const logoUrl = useBlobUrl(logoFile);

	const [smallLogoFile, setSmallLogoFile] = useState<File | null>(null);
	const smallLogoUrl = useBlobUrl(smallLogoFile);

	const isWindowDragging = usePageDragging();

	const onSave = () => {};
	// 	return <Row ref={ref} sx={{
	// 		background: "rgba(0, 0, 0, 0.1)",height: pxToBottom	}}>

	// <T>top: {yFromTop}px</T>
	// 				<T>bottom: {pxToBottom}px</T>
	// 	</Row>

	return (
		<ThemeProvider theme={whitelabelTheme}>
			<Row
				ref={ref}
				gap="1.5rem"
				sx={{
					background: "rgba(0, 0, 0, 0.1)",
					height: pxToBottom,
					padding: 2,
				}}
			>
				<Paper>
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
							<TextField {...brandNameField} size="small" />
						</SettingCard>

						<SettingCard
							title="Upload Your Full Logo"
							description="Add your agency's logo to replace the Allsource one"
						>
							<LogoUploader
								selectedFile={logoFile}
								isDragging={isWindowDragging}
								onFileSelect={setLogoFile}
								onRemoveFile={() => {
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
								selectedFile={smallLogoFile}
								isDragging={isWindowDragging}
								onFileSelect={setSmallLogoFile}
								onRemoveFile={() => {
									setSmallLogoFile(null);
								}}
							/>
						</SettingCard>
						<Row width="inherit" justifyContent="flex-end">
							<CustomButton onClick={onSave}>Save</CustomButton>
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
