import React, { useRef, useState } from "react";
import { Box, Typography, Paper } from "@mui/material";
import CustomButton from "@/components/ui/CustomButton";

const PrivacyPolicy: React.FC<{
	onAccept: () => void;
}> = ({ onAccept }) => {
	const [scrolledToEnd, setScrolledToEnd] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);
	const [hovered, setHovered] = useState(false);

	const handleScroll = () => {
		const el = contentRef.current;
		if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
			setScrolledToEnd(true);
		}
	};

	return (
		<Box
			display="flex"
			flexDirection="column"
			justifyContent="center"
			width="800px"
			alignItems="center"
			margin="auto"
			border="1px solid #E4E4E4"
			boxShadow="1"
			padding={4}
			gap={3}
			borderRadius="6px"
		>
			<Box display="flex" flexDirection="column" gap={1}>
				<Typography className="heading-text" textAlign="center">
					Review Terms and Privacy Policy
				</Typography>
				<Typography className="tab-heading" textAlign="center">
					You must read through to continue
				</Typography>
			</Box>

			<Box>
				<Paper
					variant="outlined"
					sx={{
						p: 3,
						maxHeight: 400,
						maxWidth: 736,
						overflowY: "auto",
						borderRadius: "6px",
						"& p, & li, & ul": {
							fontFamily: "var(--font-nunito)",
							color: "#707071",
							fontSize: "14px",
						},
						"& li": {
							marginBottom: "0.5em",
							color: "#707071",
						},
					}}
					onScroll={handleScroll}
					ref={contentRef}
				>
					<Typography style={{ color: "#202124", fontWeight: 600 }}>
						Privacy policy
					</Typography>
					<p>Last Updated: April 4, 2025</p>

					<p>
						{
							'Allforce Corporation ("Allforce," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit our website at allforce.io (the "Website"). Please read this policy carefully. By using the Website, you agree to the practices described herein.'
						}
					</p>

					<ol>
						<li>Company Information</li>
						<p>
							Allforce Corporation is a Delaware-registered corporation with a
							principal place of business at:
						</p>
						<p>1607 Avenida Juan Ponce de Leon</p>
						<p>San Juan, PR 00909</p>
						<p>United States</p>
						<li>Information We Collect</li>
						<p>
							Our Website is designed for marketing purposes and collects only
							the personal information necessary to schedule a Zoom call with
							us. This may include:
						</p>
						<p>
							Contact Information: Your name, email address, and, if provided,
							phone number.
						</p>
						<p>
							We do not collect any additional personal data unless voluntarily
							provided by you in communications with us. We do not use cookies,
							tracking technologies, or analytics tools to collect browsing data
							at this time.
						</p>
						<li>How We Collect Your Information</li>
						<p>We collect personal information directly from you when you:</p>
						<p>Submit a request to schedule a Zoom call through our Website.</p>
						<p>
							Contact us via email or other communication methods linked through
							the Website.
						</p>
						<li>How We Use Your Information</li>
						<p>
							We use the information we collect solely for the following
							purposes: To schedule and facilitate Zoom calls with you. To
							respond to your inquiries or requests. To improve our marketing
							efforts and Website functionality.
						</p>
						<li>Disclosure of Your Information</li>
						<p>
							We do not sell, trade, or rent your personal information to third
							parties. We may share your information only in the following
							circumstances:
						</p>
						<p>
							Service Providers: We may share your contact information with Zoom
							Video Communications, Inc., or other third-party platforms
							necessary to schedule and conduct the Zoom call. These providers
							are bound by their own privacy policies, which we encourage you to
							review.
						</p>
						<p>
							Legal Requirements: We may disclose your information if required
							by law, regulation, or legal process (e.g., court order or
							subpoena), or to protect the rights, property, or safety of
							Allforce, our users, or the public.
						</p>
						<li>Data Security</li>
						<p>
							We take reasonable measures to protect your personal information
							from unauthorized access, loss, misuse, or alteration. These
							measures include secure storage and transmission practices.
							However, no method of transmission over the internet or electronic
							storage is 100% secure, and we cannot guarantee absolute security.
						</p>
						<li>Your Rights and Choices</li>
						<p>You may:</p>
						<ul>
							<li>
								Access or Update Your Information: Contact us to review or
								update the personal information you provided for scheduling a
								Zoom call.
							</li>

							<li>
								Opt-Out: If you no longer wish to be contacted, let us know, and
								we will remove your information from our records, except as
								required by law.
							</li>
						</ul>
						<p>
							To exercise these rights, please contact us at the details
							provided in Section 11.
						</p>
						<li>{"Children’s Privacy"}</li>
						<p>
							Our Website is not directed to children under the age of 13, and
							we do not knowingly collect personal information from children. If
							we learn that we have collected such information, we will delete
							it promptly.
						</p>
						<li>Third-Party Links</li>
						<p>
							Our Website may contain links to third-party websites or services
							(e.g., Zoom). We are not responsible for the privacy practices or
							content of these third parties. We encourage you to review their
							privacy policies before providing any personal information.
						</p>
						<li>Changes to This Privacy Policy</li>
						<p>
							{
								'We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. The updated policy will be posted on this page with a revised "Last Updated" date. We encourage you to review this policy periodically.'
							}
						</p>
						<li>Contact Us</li>
						<p>
							If you have questions, concerns, or requests regarding this
							Privacy Policy or our privacy practices, please contact us at:
						</p>
						<p>Allforce Corporation</p>
						<p>1607 Avenida Juan Ponce de Leon</p>
						<p>San Juan, PR 00909</p>
						<p>United States</p>
						<p>Email: admin@allforce.io</p>
					</ol>
				</Paper>
			</Box>

			<Box
				sx={{
					display: "flex",
					justifyContent: "flex-end",
					width: "100%",
				}}
			>
				<Box sx={{ position: "relative", display: "flex", gap: 2 }}>
					<Box
						onMouseEnter={() => setHovered(true)}
						onMouseLeave={() => setHovered(false)}
					>
						<CustomButton
							variant="contained"
							onClick={onAccept}
							disabled={!scrolledToEnd}
						>
							Accept and Continue
						</CustomButton>
					</Box>
					{!scrolledToEnd && hovered && (
						<Box
							sx={{
								position: "absolute",
								top: 30,
								left: 70,
								textWrap: "nowrap",
								p: 1,
								bgcolor: "#fff",
								borderRadius: 0.5,
								filter: "drop-shadow(0 1px 4px #0000001F)",
							}}
							className="paragraph"
						>
							Scroll to the end of the document to enable this button
						</Box>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default PrivacyPolicy;
