import { LogoSmall } from "@/components/ui/Logo";
import { Grid } from "@mui/material";
import { MetaIcon } from "./icons/MetaIcon";

export const MetaMappingHeader = () => {
	return (
		<Grid
			container
			alignItems="center"
			sx={{
				flexWrap: { xs: "nowrap", sm: "wrap" },
				marginBottom: "14px",
			}}
		>
			<Grid
				item
				xs="auto"
				sm={5}
				sx={{
					textAlign: "center",
					"@media (max-width:599px)": {
						minWidth: "196px",
					},
				}}
			>
				<LogoSmall height={22} width={34} />
			</Grid>
			<Grid
				item
				xs="auto"
				sm={1}
				sx={{
					"@media (max-width:599px)": {
						minWidth: "50px",
					},
				}}
			>
				&nbsp;
			</Grid>
			<Grid
				item
				xs="auto"
				sm={5}
				sx={{
					textAlign: "center",
					"@media (max-width:599px)": {
						minWidth: "196px",
					},
				}}
			>
				<MetaIcon />
			</Grid>
			<Grid item xs="auto" sm={1}>
				&nbsp;
			</Grid>
		</Grid>
	);
};
