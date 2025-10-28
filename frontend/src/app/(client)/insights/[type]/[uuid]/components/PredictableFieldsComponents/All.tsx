import { Box, Stack, Typography } from "@mui/material";
import Link from "next/link";
import FeatureListTable from "../FeatureListTable";
import { SignificantFields } from "@/types/insights";

type PredictableFieldsTabProps = {
	data: SignificantFields;
};

const Categories: React.FC<PredictableFieldsTabProps> = ({ data }) => {
	return (
		<Box sx={{ width: "100%", display: "flex" }}>
			<Box
				sx={{
					width: "50%",
					display: "flex",
					flexDirection: "column",
					height: "100%",
					minHeight: "77vh",
					flexGrow: 1,
					borderRight: "1px solid rgba(82, 82, 82, 0.2)",
				}}
			>
				<FeatureListTable
					features={data}
					columnHeaders={["Attribute name", "Predictable value"]}
				/>
			</Box>
			<Box
				sx={{
					width: "50%",
					display: "flex",
					flexDirection: "column",
					padding: "0rem 3rem",
					gap: 3,
				}}
			>
				<Box
					sx={{
						width: "100%",
						display: "flex",
						flexDirection: "column",
						gap: 1,
					}}
				>
					<Typography
						className="paragraph-description"
						sx={{
							fontWeight: "600 !important",
							color: "rgba(95, 99, 104, 1) !important",
						}}
					>
						Predictable Fields{" "}
					</Typography>
					<Stack pt={2} textAlign={"start"} pr={4} gap={0.5}>
						<Typography className="paragraph" color={"#5F6368 !important"}>
							Understand your audience beyond basic demographics — discover what
							truly <br /> drives their behavior.
						</Typography>
						<Typography className="paragraph" color={"#5F6368 !important"}>
							<strong> Predictable Fields </strong> use advanced data models to
							estimate the most likely traits <br /> and preferences of your
							audience across key areas of life.
						</Typography>
						<Typography className="paragraph" color={"#5F6368 !important"}>
							These insights help you{" "}
							<strong>
								{" "}
								build smarter segments, improve targeting, and reduce guesswork.
							</strong>
						</Typography>
					</Stack>
				</Box>
				<Box
					sx={{
						gap: 2,
						width: "100%",
						display: "flex",
						flexDirection: "column",
					}}
				>
					<Typography
						className="paragraph-description"
						sx={{
							fontWeight: "600 !important",
							color: "rgba(95, 99, 104, 1) !important",
						}}
					>
						What You Get{" "}
					</Typography>
					<Stack textAlign={"start"} pr={4} gap={0.5}>
						<Typography className="paragraph" color={"#5F6368 !important"}>
							Our models predict values across several domains:
						</Typography>
						<Typography className="paragraph" color={"#5F6368 !important"}>
							<strong>• Personal Profile - </strong> age, gender, education,
							family size, and more.
						</Typography>
						<Typography className="paragraph" color={"#5F6368 !important"}>
							<strong>• Financial - </strong> income range, credit tendensity,
							spending style, and financial focus.
						</Typography>
						<Typography className="paragraph" color={"#5F6368 !important"}>
							<strong>• Lifestyle - </strong> interests, hobbies, brand
							affinity, and online engagement.
						</Typography>
						<Typography className="paragraph" color={"#5F6368 !important"}>
							<strong>• Voter - </strong> political orientation, voting
							likelihood, and key influencing issues.
						</Typography>
						<Typography className="paragraph" color={"#5F6368 !important"}>
							<strong>• Real Estate - </strong> Homeownership status, property
							value estimates, and relocation probability.
						</Typography>
					</Stack>
				</Box>
				<Box
					sx={{
						gap: 2,
						width: "100%",
						display: "flex",
						flexDirection: "column",
					}}
				>
					<Typography
						className="paragraph-description"
						sx={{
							fontWeight: "600 !important",
							color: "rgba(95, 99, 104, 1) !important",
						}}
					>
						Why It Matters{" "}
					</Typography>
					<Stack textAlign={"start"} pr={4} gap={0.5}>
						<Typography className="paragraph" color={"#5F6368 !important"}>
							These fields represent{" "}
							<strong>the most influential factors</strong> in audience
							modeling.
							<br />
							They allow you to:
						</Typography>
						<Typography className="paragraph" color={"#5F6368 !important"}>
							<strong>•</strong> Identify what truly defines your
							best-performing users.
						</Typography>
						<Typography className="paragraph" color={"#5F6368 !important"}>
							<strong>•</strong> Predict future behaviors with higher accuracy.
						</Typography>
						<Typography className="paragraph" color={"#5F6368 !important"}>
							<strong>•</strong> Personalize communication and offers that
							resonate.
						</Typography>
						<Typography className="paragraph" color={"#5F6368 !important"}>
							Predictable Fields turn data into direction — helping you act with
							confidence, not assumptions.
						</Typography>
					</Stack>
				</Box>

				{/* <Box>
					<Link
						style={{
							color: "rgba(56, 152, 252, 1) !important",
							fontSize: "12px",
							fontFamily: "var(--font-roboto)",
							width: "auto",
							display: "inline",
						}}
						href={""}
					>
						Learn more
					</Link>
				</Box> */}
			</Box>
		</Box>
	);
};

export default Categories;
