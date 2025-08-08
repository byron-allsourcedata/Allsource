import { Column } from "@/components/Column";
import { T } from "@/components/ui/T";

import { useState, type FC } from "react";
import { SettingCard } from "./components/SettingCard";
import { Paper, styled, TextField, ThemeProvider } from "@mui/material";
import { whitelabelTheme } from "./theme";
import { useFieldValue } from "@/components/premium-sources/hooks/useFieldValue";
import { UploadLogo } from "./components/upload/UploadLogo";
import { UploadedLogo } from "./components/upload/UploadedLogo";
import { ErrorBox, FileCard } from "./components/upload/BadUpload";
import { WhitelabelExample } from "./components/example/WhitelabelExample";
import { Row } from "@/components/Row";

type Props = {};

export const WhitelabelSettingsPage: FC<Props> = ({}) => {
	const [field] = useFieldValue("");
	return (
		<ThemeProvider theme={whitelabelTheme}>
			<Row gap="1.5rem">
				<Paper>
					<Column height="inherit" maxWidth="400px" gap="1rem">
						<T variant="h2">Whitelabel</T>
						<SettingCard
							title="Enter Your Brand Name"
							description="This name will appear across the platform as your brand identity"
						>
							<TextField {...field} size="small" />
						</SettingCard>

						<SettingCard
							title="Upload Your Full Logo"
							description="Add your agency's logo to replace the Allsource one"
						>
							<UploadLogo />
						</SettingCard>

						<UploadedLogo />

						<FileCard
							logoSrc="/logo.svg"
							filename={"AllsourceLogo.svg"}
							size={"14 mb"}
						/>
						<ErrorBox message="This file is too big" />
					</Column>
				</Paper>
				<Column flex={1}>
					<Paper
						sx={{
							maxHeight: "80vh",
							gap: "1rem",
							display: "flex",
							flexDirection: "column",
						}}
					>
						<ComponentTitle>Example</ComponentTitle>
						<WhitelabelExample />
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
