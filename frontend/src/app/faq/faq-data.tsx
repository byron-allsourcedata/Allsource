import { Box, Link, Typography } from "@mui/material";
import { ReactNode } from "react";

export const questions: { q: string; a: ReactNode }[] = [
	{
		q: "What does Allsource do?",
		a: (
			<Box>
				<Typography>
					Allsource is a customer intelligence platform that turns customer data
					into actionable marketing and sales audiences. We ingest:
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Anonymous website visitor sessions
				</Typography>
				<Typography sx={{ ml: 4 }}>• Customer purchase files</Typography>
				<Typography sx={{ ml: 4 }}>• Failed lead and churn lists</Typography>
				<Typography sx={{ marginTop: "1rem" }}>
					From there, we enrich each record with over{" "}
					<b>100 non-public data attributes</b>, generate predictive insights,
					and allow users to build <b>high-performing Smart Audiences</b> for
					activation across email, ad platforms, SMS, CRM, and more.
				</Typography>
				<Typography sx={{ marginTop: "1rem" }}>
					Website visitor resolution is just the <b>entry point—Allsource</b>{" "}
					goes far beyond contact identification.
				</Typography>
			</Box>
		),
	},
	{
		q: "What is website contact resolution, and how does Allsource use it?",
		a: (
			<Box>
				<Typography>
					Website resolution is the process of identifying anonymous site
					visitors and connecting them to known contact records (name, email,
					phone, company). Allsource provides this service using:
				</Typography>
				<Typography sx={{ ml: 4 }}>• Cookie-based resolution</Typography>
				<Typography sx={{ ml: 4 }}>• Device and behavioral signals</Typography>
				<Typography sx={{ ml: 4 }}>
					• Matching to our proprietary U.S. identity graph
				</Typography>
				<Typography sx={{ marginTop: "1rem" }}>
					But unlike single-point vendors, Allsource then:
				</Typography>
				<Typography sx={{ ml: 4 }}>• Enriches those records</Typography>
				<Typography sx={{ ml: 4 }}>
					• Performs significance and insight analysis
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Adds them to a larger Smart Audience workflow
				</Typography>
			</Box>
		),
	},
	{
		q: "What kind of data can I upload into Allsource?",
		a: (
			<Box>
				<Typography>You can upload:</Typography>
				<Typography sx={{ ml: 4 }}>• Customer orders (success data)</Typography>
				<Typography sx={{ ml: 4 }}>
					• Failed leads or unconverted trials
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Anonymous visitor resolution logs (pixel-based)
				</Typography>
				<Typography>
					Allsource matches these datasets on hashed email or MAID and enriches
					them with demographic, firmographic, and behavioral signals for deeper
					segmentation and activation.
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Buyer interest or intent datasets that have proven successful
				</Typography>
			</Box>
		),
	},
	{
		q: "What data comes with a resolved contact or Smart Audience?",
		a: (
			<Box>
				<Typography>Each contact record may include:</Typography>
				<Typography sx={{ ml: 4 }}>
					• Name, email, phone (validated), postal
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• LinkedIn profile, company, title
				</Typography>
				<Typography sx={{ ml: 4 }}>• Household demographics</Typography>
				<Typography sx={{ ml: 4 }}>
					• Email and phone validation and confidence statistics
				</Typography>
				<Typography sx={{ marginTop: "1rem" }}>
					Over <b>100+ attributes</b> are included after enrichment.
				</Typography>
			</Box>
		),
	},
	{
		q: "How does the enrichment and audience modeling work?",
		a: (
			<Box>
				<Typography>Once a dataset is matched, Allsource:</Typography>
				<Typography sx={{ ml: 4 }}>
					• Performs statistical analysis of every attribute
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Highlights significant fields correlated with conversion or failure
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Offers visual insights (charts, tables, rank-ordered fields)
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Lets you build custom lookalike audiences or suppression files based
					on combinations of traits
				</Typography>
				<Typography sx={{ marginTop: "1rem" }}>
					You can export those Smart Audiences directly into downstream
					platforms.
				</Typography>
			</Box>
		),
	},
	{
		q: "What percentage of my website traffic will be resolved?",
		a: (
			<Box>
				<Typography>
					U.S. match rates generally range from <b>8%</b> to <b>30%</b>,
					depending on:
				</Typography>
				<Typography sx={{ ml: 4 }}>• Pixel configuration</Typography>
				<Typography sx={{ ml: 4 }}>• Visitor type (B2B vs B2C)</Typography>
				<Typography sx={{ ml: 4 }}>
					• CRM IDs or hashed emails present
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Returning vs. first-time sessions
				</Typography>
				<Typography sx={{ marginTop: "1rem" }}>
					Once resolved, those visitors can be enriched, modeled, and activated.
				</Typography>
			</Box>
		),
	},
	{
		q: "Is Allsource legal to use?",
		a: (
			<Box>
				<Typography>
					Yes. Allsource only resolves <b>U.S.-based traffic</b>, and:
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Complies with CCPA, CPRA, CAN-SPAM, TCPA
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Provides full opt-out at https://allsourcedata.io/opt-out
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Does not resolve or activate contacts from the EU, UK, or other
					regulated countries
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Enforces global suppression with no reuse of deleted/opted-out
					identities
				</Typography>
				<Typography sx={{ marginTop: "1rem" }}>
					Your resolved and enriched data is contractually{" "}
					<b>first-party only—never resold</b>.
				</Typography>
			</Box>
		),
	},
	{
		q: "Can I email, call, or retarget these contacts?",
		a: (
			<Box>
				<Typography>
					Yes — Allsource provides validations so you can:
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Confirm email deliverability (MX and SMTP checks)
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Verify phone number type and carrier (for TCPA compliance)
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Match to LinkedIn profiles for job accuracy
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Suppress unqualified or risky records
				</Typography>
				<Typography sx={{ marginTop: "1rem" }}>
					Use cases include CRM enrichment, B2B email outreach, SMS, and digital
					ad campaigns.
				</Typography>
			</Box>
		),
	},
	{
		q: "What platforms can I export to?",
		a: (
			<Box>
				<Typography>Smart Audiences can be exported or synced to:</Typography>
				<Typography sx={{ ml: 4 }}>• Salesforce, HubSpot</Typography>
				<Typography sx={{ ml: 4 }}>
					• Meta, Bing, LinkedIn, Google Ads
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Twilio, SendGrid, or postal mail systems
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Webhooks or CSV via secure FTP/S3
				</Typography>
				<Typography>
					You control which audiences go where, with filters and validations
					applied.
				</Typography>
			</Box>
		),
	},
	{
		q: "What makes Allsource different from other website visitor resolution tools?",
		a: (
			<Box>
				<Typography>Unlike point solutions, Allsource:</Typography>
				<Typography sx={{ ml: 4 }}>
					• <b>Ingests ALL data types:</b> not just web traffic, but orders and
					failures too
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• <b>Enriches every contact</b> with non-public fields from a
					proprietary graph
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• <b>Visualizes predictive insights</b> to guide your segmentation
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• <b>Lets you build Smart Audiences</b> from any mix of sources and
					signals
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• <b>Supports suppression</b>, validation, and privacy compliance at
					every step
				</Typography>
				<Typography sx={{ marginTop: "1rem" }}>
					It’s an end-to-end conversion intelligence platform.
				</Typography>
			</Box>
		),
	},
	{
		q: "What industries use Allsource?",
		a: (
			<Box>
				<Typography sx={{ ml: 4 }}>
					• Wellness, fitness, and weight loss brands
				</Typography>
				<Typography sx={{ ml: 4 }}>• Home services</Typography>
				<Typography sx={{ ml: 4 }}>• Fintech and insurance</Typography>
				<Typography sx={{ ml: 4 }}>
					• Media buyers and advertising agencies
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• E-commerce and DTC subscription services
				</Typography>
				<Typography sx={{ ml: 4 }}>• B2B SaaS and enterprise tech</Typography>
			</Box>
		),
	},
	{
		q: "What does it cost?",
		a: (
			<Box>
				<Typography>Allsource pricing includes:</Typography>
				<Typography sx={{ ml: 4 }}>
					• <b>Pixel contact resolution</b>: $0.08 per U.S. record beyond first
					1,000/month
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• <b>SmartAudience subscriptions</b>: from $7,500/month
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• <b>Validation (email, phone, LinkedIn)</b>: billed per record,
					tracked in-platform
				</Typography>
				<Typography>See full pricing</Typography>
			</Box>
		),
	},
	{
		q: "How do opt-outs work?",
		a: (
			<Box>
				<Typography>
					Visitors can opt out by visiting{" "}
					<Link
						href="https://app.allsourcedata.io/opt-out"
						style={{
							textDecoration: "none",
						}}
					>
						https://app.allsourcedata.io/opt-out
					</Link>
					.
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• They enter their email and complete reCAPTCHA
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• Their record is globally hashed and suppressed
				</Typography>
				<Typography sx={{ ml: 4 }}>
					• No customer—now or in the future—can resolve or activate that
					contact again
				</Typography>
				<Typography sx={{ marginTop: "1rem" }}>
					This ensures Allsource remains compliant and reputation-safe.
				</Typography>
			</Box>
		),
	},
];
