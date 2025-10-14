"use client";
import React, { useState } from "react";
import {
	Box,
	Container,
	Typography,
	Button,
	Grid,
	Paper,
	ToggleButton,
	ToggleButtonGroup,
	Divider,
} from "@mui/material";
import { PlanButton } from "./PlanButton";

export interface Plan {
	title: string;
	alias: string;
	is_recommended: boolean;
	is_active: boolean;
	price: { value: string; y?: string };
	permanent_limits?: { name: string; value?: string }[];
	monthly_limits?: { name: string; value?: string }[];
	referrals?: { name: string; value?: string }[];
	gifted_funds?: { name: string; value?: string }[];
	gifts?: { name: string; value?: string }[];
}

interface PricingTableProps {
	normalPlans: Plan[];
	partnerPlans: Plan[];
	billing: "monthly" | "yearly";
	handleOpenPopup: (alias: string) => void;
}

const adaptPlans = (plans: Plan[]) => {
	return plans.map((p) => {
		const limits = [
			...(p.permanent_limits || []),
			...(p.monthly_limits || []),
			...(p.referrals || []),
			...(p.gifted_funds || []),
			...(p.gifts || []),
		];

		const features = limits.map((l) =>
			l.value ? `${l.name}: ${l.value}` : l.name,
		);

		return {
			key: p.alias,
			title: p.title,
			price: p.price?.value || "-",
			highlight: p.is_recommended,
			features,
		};
	});
};

export default function PricingTable({
	normalPlans,
	partnerPlans,
	billing: initialBilling = "monthly",
	handleOpenPopup,
}: PricingTableProps) {
	const [billing, setBilling] = useState<"monthly" | "yearly">(initialBilling);
	const [selectedPlan, setSelectedPlan] = useState(0);
	const adaptedPlans = adaptPlans(normalPlans);

	const handleBillingChange = (
		_ev: React.MouseEvent<HTMLElement>,
		val: "monthly" | "yearly" | null,
	) => {
		if (val) setBilling(val);
	};

	// данные тарифов — подгоняй цифры если нужно

	// const plans: Plan[] = [
	//     // {
	//     //   key: "basic",
	//     //   title: "Basic",
	//     //   monthly: "$1",
	//     //   yearly: "",
	//     //   note: "Once",
	//     //   cta: "Speak to Us",
	//     //   href: "https://meetings-na2.hubspot.com/mark-lombardi/mark-byron-call-link-",
	//     //   features: [
	//     //     "15+",
	//     //     "Included",
	//     //     "Unlimited",
	//     //     "Included",
	//     //     "$0.08 Each (Up To 65k)",
	//     //     "✖",
	//     //     "✖",
	//     //     "$500",
	//     //     "$500",
	//     //   ],
	//     // },
	//     {
	//         key: "standard",
	//         title: "Standard",
	//         monthly: "$499",
	//         yearly: "$300",
	//         note: "Per Month",
	//         cta: "Get Started Now",
	//         href: "https://app.allsourcedata.io/signup",
	//         // второй / центральный
	//         features: [
	//             "15+",
	//             "Included",
	//             "Unlimited",
	//             "Included",
	//             "Unlimited",
	//             "Included",
	//             "✖",
	//             "$1000",
	//             "$1000",
	//         ],
	//     },
	//     {
	//         key: "smart",
	//         title: "Smart Audience",
	//         monthly: "$999",
	//         yearly: "$700",
	//         note: "Per Month",
	//         cta: "Speak to Us",
	//         href: "https://meetings-na2.hubspot.com/mark-lombardi/mark-byron-call-link-",
	//         highlight: true,
	//         features: [
	//             "15+",
	//             "Included",
	//             "Unlimited",
	//             "Included",
	//             "Unlimited",
	//             "Included",
	//             "200,000",
	//             "$1,500",
	//             "$1,500",
	//         ],
	//     },
	//     {
	//         key: "pro",
	//         title: "Pro",
	//         monthly: "$4,999",
	//         yearly: "$2,999",
	//         note: "Per Month",
	//         cta: "Speak to Us",
	//         href: "https://meetings-na2.hubspot.com/mark-lombardi/mark-byron-call-link-",
	//         features: [
	//             "15+",
	//             "Included",
	//             "Unlimited",
	//             "Included",
	//             "Unlimited",
	//             "Included",
	//             "Unlimited",
	//             "$2,500",
	//             "$2,500",
	//         ],
	//     }
	// ];

	// левые строки таблицы
	const rows = [
		"Integrations:",
		"Customer Insights:",
		"Domains Monitored:",
		"Pixel Contacts Validation:",
		"Contact Downloads / Month:",
		"Guided Consent Setup Pro Serv:",
		"Smart Audience / Month:",
		"Smart Audience Validation Funds:",
		"Premium Data Funds:",
	];

	const plans: Plan[] = normalPlans; // обычные тарифы
	const partnerPlansList: Plan[] = partnerPlans; // партнерские

	const renderDesktopVersion = () => (
		<>
			<Box
				sx={{
					borderRadius: 3,
					p: { xs: 2, md: 0 },
					pt: { md: 2 },
					background:
						"url('background_table.png') 0px 0px / 100% 105.966% no-repeat",
					color: "#fff",
					overflow: "visible", // важно — чтобы выделенный блок мог выступать
				}}
			>
				<Grid container spacing={0} alignItems="stretch">
					{/* Левый столбец: Unlock (вверху) + Левый список строк (внизу) */}
					<Grid item xs={12} md={4}>
						<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
							{/* Unlock All Features */}
							<Paper
								elevation={0}
								sx={{
									borderRadius: 2,
									background: "transparent",
									boxShadow: "none",
									color: "#111827",
								}}
							>
								<Box
									sx={{
										background:
											"linear-gradient(0deg, #C6BAF6 -43.77%, #F2EFFD 78.94%)",
										color: "#111",
										borderRadius: 2,
										textAlign: "center",
										p: 2.5,
										boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
									}}
								>
									<Typography
										sx={{ fontSize: 20, fontWeight: 700, mb: 1 }}
										component="h3"
									>
										Unlock All Features
									</Typography>
									<Typography sx={{ fontSize: 13, color: "#6b7280", mb: 2 }}>
										Select your plan and start now
									</Typography>

									<Box
										sx={{
											display: "grid",
											gridTemplateColumns: "1fr 1fr",
											gap: 1,
										}}
									>
										{[
											"Top features",
											"Premium support",
											"Secure data",
											"Proven results",
										].map((t) => (
											<Box
												key={t}
												sx={{ display: "flex", gap: 1, alignItems: "center" }}
											>
												<Check />
												<Typography sx={{ fontSize: 13, textWrap: "nowrap" }}>
													{t}
												</Typography>
											</Box>
										))}
									</Box>
								</Box>
							</Paper>

							{/* Левый столбец имен строк — тот же визуал как в таблице */}
							<Box
								sx={{
									borderRadius: 0,
									borderTopLeftRadius: "12px",
									borderBottomLeftRadius: "12px",
									p: 2.5,
									background:
										"linear-gradient(0deg, #C6BAF6 -28.64%, #F2EFFD 117.44%)",
									height: "100%",
								}}
							>
								{rows.map((r, idx) => (
									<Box key={r}>
										<Typography
											sx={{
												color: "#111827",
												fontSize: idx === 0 ? 16 : 14,
												py: 2,
												borderBottom:
													idx < rows.length - 1 ? "1px solid #fff" : "none",
											}}
										>
											{r}
										</Typography>
									</Box>
								))}
							</Box>
						</Box>
					</Grid>

					{/* Правая область: каждая колонка — мини-план сверху + колонка таблицы снизу */}
					<Grid item xs={12} md={8}>
						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: "repeat(3, 1fr)",
								alignItems: "start",
								overflow: "visible",
								position: "relative",
							}}
						>
							{adaptedPlans.map((p, idx) => {
								const isCenter = !!p.highlight;
								// для визуала цены (yearly/monthly)
								const displayPrice =
									billing === "yearly" && p.yearly ? p.yearly : p.monthly;
								const oldPrice =
									billing === "yearly" && p.yearly ? p.monthly : null;

								return (
									<Box
										key={p.key}
										sx={{
											position: "relative",
											display: "flex",
											flexDirection: "column",
											alignItems: "stretch",
											// center column выдвигаем чуть вверх и делаем выступ вниз
											transform: isCenter ? "translateY(-18px)" : "none",
											zIndex: isCenter ? 5 : 1,
											// чтобы выделенный блок визуально выступал за нижнюю границу общего контейнера
											mb: isCenter ? "-22px" : 0,
											border: isCenter ? "2px solid #ff7b10" : "none",
											borderRadius: 0,
											borderTopLeftRadius: isCenter ? "12px" : 0,
											borderTopRightRadius: isCenter ? "12px" : 0,
											borderBottomLeftRadius: isCenter ? "12px" : 0,
											borderBottomRightRadius: isCenter ? "12px" : 0,
										}}
									>
										{/* Мини-план */}
										<Paper
											elevation={0}
											sx={{
												p: 2.5,
												borderRadius: 0,
												borderTopLeftRadius: isCenter ? "12px" : 0,
												borderTopRightRadius: isCenter ? "12px" : 0,
												bgcolor: isCenter ? "#fff" : "transparent",
												color: isCenter ? "#111827" : "#111827",
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
												gap: 1,
												mb: isCenter ? 0 : 3,
												pb: isCenter ? "76px" : 2.5,
												minHeight: 118,
											}}
										>
											<Typography sx={{ fontSize: 14, fontWeight: 600 }}>
												{p.title}
											</Typography>

											<Box>
												<Box
													sx={{
														display: "flex",
														alignItems: "baseline",
														gap: 0.5,
													}}
												>
													{oldPrice && (
														<Typography
															sx={{
																fontFamily: "var(--font-inter)",
																fontWeight: 600,
																fontSize: 14,
																lineHeight: "22px",
																letterSpacing: "0%",
																textAlign: "center",
																verticalAlign: "middle",
																textDecoration: "line-through",
																color: "#6b7280",
															}}
														>
															{oldPrice}
														</Typography>
													)}
													<Typography sx={{ fontWeight: 700, fontSize: 20 }}>
														{displayPrice}
													</Typography>
												</Box>

												<Typography sx={{ fontSize: 12, color: "#6b7280" }}>
													{p.features}
												</Typography>
											</Box>
											<PlanButton props={p} />
										</Paper>

										{/* Колонка основной таблицы для этого плана (внизу, под мини-планом) */}
										{/* Если колонка центр — оборачиваем в рамку, чтобы выглядело единым блоком */}
										<Box
											sx={{
												background:
													"linear-gradient(0deg, #C6BAF6 -28.64%, #F2EFFD 117.44%)",
												py: isCenter ? 0 : 2.125,
												pl: idx === 0 ? 2 : 0,
												pr: idx === plans.length - 1 ? 2 : 0,
												borderRadius: 3,
												borderTopLeftRadius: 0,
												borderBottomLeftRadius: isCenter ? "12px" : 0,
												borderBottomRightRadius: isCenter ? "12px" : 3,
											}}
										>
											<Box
												sx={{
													// если center — рисуем рамку/фон вокруг всей колонки (включая мини-план визуально)
													borderTopLeftRadius: idx === 0 ? "12px" : 0,
													borderTopRightRadius:
														plans.length - 1 === idx ? "12px" : 0,
													borderBottomLeftRadius:
														idx === 0 || isCenter ? "12px" : 0,
													borderBottomRightRadius:
														plans.length - 1 === idx || isCenter ? "12px" : 0,
													// рамка и фон только для визуала; у center она более выраженная
													boxShadow: isCenter
														? "0 30px 60px rgba(255,123,16,0.08)"
														: "none",
													// border: isCenter ? "2px solid #ff7b10" : "none",
													overflow: "hidden",
													background: "#fff",
													pb: isCenter ? "40px" : 0,
												}}
											>
												<Box sx={{ width: "100%", px: 2 }}>
													{p.features.map((val, i) => (
														<Box
															key={i}
															sx={{
																py: 2,
																borderBottom:
																	i < p.features.length - 1
																		? "1px solid #E7E7E9"
																		: "none",
																textAlign: "center",
															}}
														>
															<Typography
																sx={{
																	textWrap: "nowrap",
																	color:
																		typeof val === "string" && val.includes("$")
																			? "#111827"
																			: val === "✖"
																				? "#ef4444"
																				: "#111827",
																	fontWeight:
																		typeof val === "string" && val.includes("$")
																			? 900
																			: 600,
																	fontSize: val === "✖" ? 14.15 : 14.5,
																}}
															>
																{val === "✖" ? renderX() : val}
															</Typography>
														</Box>
													))}
												</Box>
											</Box>
										</Box>
									</Box>
								);
							})}
						</Box>
					</Grid>
				</Grid>
			</Box>
			{/* Плюсик между таблицей и партнеркой */}
			<Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
				<Box sx={{ display: "flex", justifyContent: "center", mt: -2 }}>
					<Plus />
				</Box>

				{/* Partner Program — блок внизу */}
				<Box sx={{ mt: 0 }}>
					<Grid
						container
						spacing={0}
						sx={{
							borderRadius: 3,
							background:
								"linear-gradient(0deg, #C6BAF6 -43.77%, #F2EFFD 78.94%)",
						}}
					>
						{/* Left partner card (md=4) — height: 100% */}
						<Grid item xs={12} md={3}>
							<Paper
								sx={{
									p: 3,
									borderRadius: 3,
									textAlign: "center",
									height: "100%",
									display: "flex",
									flexDirection: "column",
									justifyContent: "space-between",
									bgcolor: "transparent",
									border: "none",
									boxShadow: "none",
								}}
							>
								<Box>
									<Typography sx={{ fontSize: 14, color: "#6b7280" }}>
										Partner Program
									</Typography>
									<Typography
										sx={{
											fontSize: 28,
											fontWeight: 700,
											color: "#111827",
											mt: 1,
										}}
									>
										$500
									</Typography>
									<Typography sx={{ fontSize: 12, color: "#6b7280", mb: 2 }}>
										Per Month
									</Typography>
								</Box>
								<CustomButton
									props={{
										href: "https://meetings-na2.hubspot.com/mark-lombardi/mark-byron-call-link-",
										cta: "Speak to Us",
									}}
								/>
							</Paper>
						</Grid>

						{/* Right big card (md=8) — also height: 100% so both match */}
						<Grid item xs={12} md={9}>
							<Paper
								sx={{
									p: 3,
									borderRadius: 3,
									display: "flex",
									gap: 2,
									border: "none",
									boxShadow: "none",
									alignItems: "center",
									flexWrap: "nowrap",
									height: "100%",
									bgcolor: "transparent",
								}}
							>
								{/* Dashed gradient box */}
								<Box
									sx={{
										height: "100%",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										textAlign: "center",
										borderRadius: 2,
										position: "relative",
										background: "rgba(255, 255, 255, 0.8)",
										px: 3,
										py: 1.5,
										fontSize: 14,
										fontWeight: 500,
										color: "#111827",
										overflow: "hidden",
									}}
								>
									SMART AUDIENCE PLAN LIMITS
									{/* SVG градиентная dashed рамка */}
									<svg
										viewBox="0 0 100 100"
										preserveAspectRatio="none"
										style={{
											position: "absolute",
											top: 0,
											left: 0,
											width: "100%",
											height: "100%",
											pointerEvents: "none",
											borderRadius: "8px",
										}}
									>
										<defs>
											<linearGradient
												id="grad"
												x1="0%"
												y1="0%"
												x2="100%"
												y2="0%"
											>
												<stop offset="0%" stopColor="#FF7B10" />
												<stop offset="47.23%" stopColor="#F5A0C5" />
												<stop offset="100%" stopColor="#7E63EB" />
											</linearGradient>
										</defs>
										<rect
											x="1"
											y="1"
											width="98%"
											height="98%"
											rx="8"
											ry="8"
											fill="none"
											stroke="url(#grad)"
											strokeWidth="2"
											strokeDasharray="6,6"
										/>
									</svg>
								</Box>

								<Box>
									<Typography
										sx={{
											fontSize: 24,
											fontWeight: 600,
											background:
												"linear-gradient(90deg, #FF7B10 0%, #F5A0C5 47.23%, #7E63EB 100%)",
											WebkitBackgroundClip: "text", // для Chrome/Safari
											WebkitTextFillColor: "transparent", // чтобы текст был прозрачным и показывал градиент
											backgroundClip: "text", // для других браузеров (частично)
											color: "transparent", // на всякий случай
										}}
									>
										&
									</Typography>
								</Box>

								{/* Секция с фичами: 2 колонки по 3 элемента */}
								{/* Общий блок с фичами */}
								<Box
									sx={{
										display: "grid",
										gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
										gap: 2,
										width: "100%",
										height: "100%",
										alignItems: "start",
										bgcolor: "rgba(255, 255, 255, 0.8)", // общий фон всего блока
										borderRadius: 2,
										p: 3, // отступы внутри блока
									}}
								>
									{[
										"White label access",
										"Automated Payments via Stripe",
										"50% Pixel Revenue Share",
										"Invitation Links",
										"Onboarding and Support",
										"30% Other Revenue",
									].map((t) => (
										<Box
											key={t}
											sx={{
												display: "flex",
												alignItems: "center",
												fontSize: 14,
												fontWeight: 600,
												color: "rgba(32, 33, 36, 0.6)",
												gap: 1, // расстояние между галочкой и текстом
											}}
										>
											{/* Галочка */}
											<Box
												component="span"
												sx={{
													width: 24,
													height: 24,
													borderRadius: "50%",
													backgroundColor: "rgba(74, 158, 79, 1)",
													mask: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path fill='white' d='M6 10.2l-3-3 1.4-1.4 1.6 1.6 4.6-4.6 1.4 1.4z'/></svg>\") no-repeat center / contain",
													WebkitMask:
														"url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path fill='white' d='M6 10.2l-3-3 1.4-1.4 1.6 1.6 4.6-4.6 1.4 1.4z'/></svg>\") no-repeat center / contain",
												}}
											/>
											{t}
										</Box>
									))}
								</Box>
							</Paper>
						</Grid>
					</Grid>
				</Box>
			</Box>
		</>
	);

	const renderMobileVersion = () => {
		return (
			<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
				{/* Переключатель планов для мобильной версии */}
				<Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
					<ToggleButtonGroup
						value={selectedPlan}
						exclusive
						onChange={(e, newValue) => {
							if (newValue !== null) setSelectedPlan(newValue);
						}}
						sx={{
							// делаем невидимый фон у группировки — сами кнопки оформляем
							bgcolor: "white",
							borderRadius: "999px",
							"& .MuiToggleButton-root": {
								border: "none",
								textTransform: "none",
								borderRadius: "999px",
								px: "16px",
								py: "8px",
								fontSize: 16,
								lineHeight: 1,
								fontWeight: 400,
								color: "#111827",
							},
							// стили для состояния selected (точно как ты прислал)
							"& .MuiToggleButton-root.Mui-selected": {
								color: "#fff !important",
								background:
									"linear-gradient(#0E0E0E, #0E0E0E) padding-box, linear-gradient(90deg, rgb(255, 123, 16) 0%, rgb(245, 160, 197) 47.22%, rgb(126, 99, 235) 100%) border-box",
								border: "2px solid transparent", // нужно чтобы border-box градиент был виден
								boxShadow: "none",
							},
							// hover для выбранной (как в спецификации)
						}}
					>
						{plans.map((plan, index) => (
							<ToggleButton
								key={plan.key}
								value={index}
								sx={{
									textTransform: "none",
									px: 2,
									py: 1.5,
									borderRadius: "8px",
									flex: 1,
									fontSize: 12,
									fontWeight: 600,
									textWrap: "nowrap",
								}}
							>
								{plan.title}
							</ToggleButton>
						))}
					</ToggleButtonGroup>
				</Box>

				{/* Основная таблица для выбранного плана */}
				<Paper
					elevation={0}
					sx={{
						borderRadius: 3,
						background:
							"linear-gradient(320.23deg, #C6BAF6 -28.64%, #F2EFFD 117.44%)",
						boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
						overflow: "hidden",
					}}
				>
					<Paper
						elevation={0}
						sx={{
							p: 3,
							borderRadius: 3,
							bgcolor: "transparent",
							textAlign: "center",
						}}
					>
						<Typography sx={{ fontSize: 18, fontWeight: 700, mb: 1 }}>
							{plans[selectedPlan].title}
						</Typography>

						<Box
							sx={{
								display: "flex",
								alignItems: "baseline",
								justifyContent: "center",
								gap: 1,
								mb: 1,
							}}
						>
							<Typography sx={{ fontWeight: 700, fontSize: 24 }}>
								{billing === "yearly" && plans[selectedPlan].yearly
									? plans[selectedPlan].yearly
									: plans[selectedPlan].monthly}
							</Typography>
						</Box>

						<Typography sx={{ fontSize: 13, color: "#6b7280", mb: 2 }}>
							{plans[selectedPlan].note}
						</Typography>
						<CustomButton
							props={{
								href: "https://meetings-na2.hubspot.com/mark-lombardi/mark-byron-call-link-",
								cta: plans[selectedPlan].cta,
							}}
						/>
					</Paper>

					<Box
						sx={{
							bgcolor:
								"linear-gradient(320.23deg, #C6BAF6 -28.64%, #F2EFFD 117.44%)",
						}}
					></Box>

					<Box sx={{ p: 0, px: 2.5, pb: 2.5 }}>
						{rows.map((row, rowIndex) => (
							<Box
								key={row}
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									bgcolor: "white",
									borderTopLeftRadius: rowIndex === 0 ? "12px" : 0,
									borderTopRightRadius: rowIndex === 0 ? "12px" : 0,
									borderBottomLeftRadius:
										rowIndex === rows.length - 1 ? "12px" : 0,
									borderBottomRightRadius:
										rowIndex === rows.length - 1 ? "12px" : 0,
									p: 2,
									borderBottom:
										rowIndex < rows.length - 2
											? "1px solid rgba(0,0,0,0.04)"
											: "none",
								}}
							>
								<Typography sx={{ fontSize: 14, color: "#111827", flex: 1 }}>
									{row}
								</Typography>
								<Typography
									sx={{
										fontSize: 14,
										color:
											typeof plans[selectedPlan].features[rowIndex] ===
												"string" &&
											plans[selectedPlan].features[rowIndex].includes("$")
												? "#111827"
												: plans[selectedPlan].features[rowIndex] === "✖"
													? "#ef4444"
													: "#000000",
										fontWeight: 400,
										minWidth: 60,
										textAlign: "right",
									}}
								>
									{plans[selectedPlan].features[rowIndex]}
								</Typography>
							</Box>
						))}
					</Box>
				</Paper>

				{/* Partner Program для мобильной версии */}
				<Box sx={{ mt: 0 }}>
					<Grid
						container
						spacing={3}
						sx={{
							background:
								"linear-gradient(0deg, #C6BAF6 -43.77%, #F2EFFD 78.94%)",
							alignItems: "stretch",
						}}
					>
						{/* Left partner card (xs stacked full-width, md=3) */}
						<Grid item xs={12} md={3}>
							<Paper
								sx={{
									p: { xs: 2, md: 3 },
									borderRadius: 3,
									textAlign: { xs: "left", md: "center" },
									height: "100%",
									display: "flex",
									flexDirection: "column",
									justifyContent: "space-between",
									bgcolor: "transparent",
									border: "none",
									boxShadow: "none",
									alignItems: "center",
								}}
							>
								<Box>
									<Typography
										sx={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}
									>
										Partner Program
									</Typography>
									<Typography
										sx={{
											fontSize: { xs: 22, md: 28 },
											fontWeight: 700,
											color: "#111827",
											textAlign: "center",
											mt: 1,
										}}
									>
										$500
									</Typography>
									<Typography
										sx={{
											fontSize: 12,
											color: "#6b7280",
											textAlign: "center",
											mb: 2,
										}}
									>
										Per Month
									</Typography>
								</Box>

								{/* Используем CustomButton (как в вашем проекте). Если его нет — замените на MUI Button */}
								<PlanButton
									props={{
										href: "https://meetings-na2.hubspot.com/mark-lombardi/mark-byron-call-link-",
										cta: "Speak to Us",
										fullWidth: true,
									}}
								/>
							</Paper>
						</Grid>

						{/* Right big card (xs stacked under left, md=9) */}
						<Grid item xs={12} md={9}>
							<Paper
								sx={{
									p: { xs: 2, md: 3 },
									borderRadius: 3,
									display: "flex",
									gap: 2,
									border: "none",
									boxShadow: "none",
									alignItems: "center",
									flexDirection: { xs: "column", md: "row" }, // stack on mobile
									height: "100%",
									bgcolor: "transparent",
								}}
							>
								{/* Dashed gradient box (с адаптивной высотой/шириной) */}
								<Box
									sx={{
										width: { xs: "100%", md: 160 },
										minHeight: { xs: 56, md: 72 },
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										textAlign: "center",
										borderRadius: 2,
										position: "relative",
										background: "rgba(255,255,255,0.85)",
										px: { xs: 2, md: 3 },
										py: { xs: 1, md: 1.5 },
										fontSize: 12,
										fontWeight: 500,
										color: "#111827",
										overflow: "hidden",
										flexShrink: 0,
									}}
								>
									SMART AUDIENCE PLAN LIMITS
									<svg
										viewBox="0 0 200 56"
										preserveAspectRatio="none"
										style={{
											position: "absolute",
											top: 0,
											left: 0,
											width: "100%",
											height: "100%",
											pointerEvents: "none",
											borderRadius: "8px",
										}}
									>
										<defs>
											<linearGradient
												id="grad-partner"
												x1="0%"
												y1="0%"
												x2="100%"
												y2="0%"
											>
												<stop offset="0%" stopColor="#FF7B10" />
												<stop offset="47.23%" stopColor="#F5A0C5" />
												<stop offset="100%" stopColor="#7E63EB" />
											</linearGradient>
										</defs>
										<rect
											x="2"
											y="2"
											width="196"
											height="52"
											rx="10"
											ry="10"
											fill="none"
											stroke="url(#grad-partner)"
											strokeWidth="4"
											strokeDasharray="10 6" // длина штриха и пробела — подгоните при желании
											strokeDashoffset="0"
											strokeLinecap="butt" // предотвращает «вылазение» закругл. концов
											strokeLinejoin="round"
											vectorEffect="non-scaling-stroke" // толщина линии останется постоянной при масштабировании
											shapeRendering="geometricPrecision"
										/>
									</svg>
								</Box>

								{/* Ampersand */}
								<Box
									sx={{
										display: { xs: "none", md: "block" }, // & виден на десктопе в оригинале
										px: 1,
									}}
								>
									<Typography
										sx={{
											fontSize: 24,
											fontWeight: 600,
											background:
												"linear-gradient(90deg, #FF7B10 0%, #F5A0C5 47.23%, #7E63EB 100%)",
											WebkitBackgroundClip: "text",
											WebkitTextFillColor: "transparent",
											backgroundClip: "text",
											color: "transparent",
										}}
									>
										&
									</Typography>
								</Box>

								{/* Секция с фичами: 2 колонки на md, 1 колонка на xs */}
								<Box
									sx={{
										display: "grid",
										gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
										gap: 2,
										width: "100%",
										alignItems: "start",
										bgcolor: "rgba(255,255,255,0.85)",
										borderRadius: 2,
										p: { xs: 2, md: 3 },
									}}
								>
									{[
										"White label access",
										"Automated Payments via Stripe",
										"50% Pixel Revenue Share",
										"Invitation Links",
										"Onboarding and Support",
										"30% Other Revenue",
									].map((t) => (
										<Box
											key={t}
											sx={{
												display: "flex",
												alignItems: "center",
												fontSize: 14,
												color: "rgba(32,33,36,0.75)",
												gap: 1,
												bgcolor: "#fff",
												borderRadius: 1.5,
												px: 2,
												py: 1,
												boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.02)",
											}}
										>
											<Box
												component="span"
												sx={{
													width: 20,
													height: 20,
													borderRadius: "50%",
													backgroundColor: "rgba(74,158,79,1)",
													mask: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path fill='white' d='M6 10.2l-3-3 1.4-1.4 1.6 1.6 4.6-4.6 1.4 1.4z'/></svg>\") no-repeat center / contain",
													WebkitMask:
														"url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path fill='white' d='M6 10.2l-3-3 1.4-1.4 1.6 1.6 4.6-4.6 1.4 1.4z'/></svg>\") no-repeat center / contain",
													flexShrink: 0,
												}}
											/>
											<Typography sx={{ fontSize: 14 }}>{t}</Typography>
										</Box>
									))}
								</Box>
							</Paper>
						</Grid>
					</Grid>
				</Box>
			</Box>
		);
	};

	return (
		<Box
			component="section"
			sx={{
				width: "100%",
				pb: 4,
				bgcolor: "linear-gradient(320.23deg, #C6BAF6 -28.64%, #F2EFFD 117.44%)",
				display: "flex",
				justifyContent: "center",
			}}
		>
			<Container maxWidth="xl" sx={{ position: "relative" }}>
				{/* Верхняя декоративная картинка (glow + icons) */}
				<Box
					component="img"
					src="/Integrations_mobile.svg"
					alt="decor"
					sx={{
						width: "100%",
						maxWidth: "80rem",
						mx: "auto",
						mt: 6,
						mb: 3,
						zIndex: 3,
						position: "relative",
						pointerEvents: "none",
						display: { xs: "block", md: "none" },
					}}
				/>
				<Box
					component="img"
					src="/Integrations.svg"
					alt="decor"
					sx={{
						width: "100%",
						maxWidth: "80rem",
						mx: "auto",
						mt: 6,
						mb: 3,
						zIndex: 3,
						position: "relative",
						pointerEvents: "none",
						display: { xs: "none", md: "block" },
					}}
				/>

				{/* Верхняя полоска с toggle (billing) */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "center",
						mb: { xs: 3, md: 4 },
					}}
				>
					<ToggleButtonGroup
						value={billing}
						exclusive
						onChange={handleBillingChange}
						sx={{
							bgcolor: "white",
							borderRadius: "999px",
							"& .MuiToggleButton-root": {
								// РЕШЕНИЕ: зарезервировать бордер всегда (даже если прозрачный)
								border: "2px solid transparent",
								boxSizing: "border-box",
								textTransform: "none",
								borderRadius: "999px",
								px: "16px",
								py: "8px",
								fontSize: 16,
								lineHeight: 1,
								fontWeight: 400,
								color: "#111827",
								// минимальная ширина, чтобы кнопки не меняли ширину при смене стилей
								minWidth: { xs: 72, md: 92 },
								// не анимируем layout-атрибуты — только цвет/фон/тень
								transition:
									"background 160ms ease, color 160ms ease, box-shadow 160ms ease",
							},
							"& .MuiToggleButton-root.Mui-selected": {
								color: "#fff !important",
								background:
									"linear-gradient(#0E0E0E, #0E0E0E) padding-box, linear-gradient(90deg, rgb(255, 123, 16) 0%, rgb(245, 160, 197) 47.22%, rgb(126, 99, 235) 100%) border-box",
								// оставляем border таким же (transparent) чтобы не было изменения размера
								border: "2px solid transparent",
								boxShadow: "none",
							},
							// опционально отключаем ripple/focus outline, чтобы фокус не вызывал неожиданный сдвиг
							"& .MuiToggleButton-root:focus": {
								outline: "none",
							},
						}}
					>
						<ToggleButton value="monthly" aria-label="monthly">
							Monthly
						</ToggleButton>

						<ToggleButton value="yearly" aria-label="yearly">
							Yearly
							<Box
								sx={{
									ml: { xs: 0, md: 1 },
									px: "8px",
									py: "4px",
									borderRadius: "999px",
									background:
										"linear-gradient(90deg, rgba(242,236,255,1) 0%, rgba(235,232,255,1) 100%)",
									boxShadow: "inset 0 -6px 18px rgba(126,99,235,0.06)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Typography
									sx={{
										fontSize: 14,
										color: "#0f1724",
										fontWeight: 400,
										px: { xs: 0.5, md: 1 },
									}}
								>
									Save 33%
								</Typography>
							</Box>
						</ToggleButton>
					</ToggleButtonGroup>
				</Box>

				{/* Рендеринг соответствующей версии */}
				<Box
					sx={{
						display: { xs: "none", md: "block" },
						maxWidth: "80rem",
						justifyContent: "center",
						margin: "0 auto",
					}}
				>
					{renderDesktopVersion()}
				</Box>
				<Box sx={{ display: { xs: "block", md: "none" } }}>
					{renderMobileVersion()}
				</Box>
			</Container>
		</Box>
	);
}

const Plus = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="40"
			height="40"
			viewBox="0 0 40 40"
			fill="none"
		>
			<g clipPath="url(#clip0_792_4855)">
				<path
					d="M30.0002 21.6673H21.6668V30.0007C21.6668 30.9173 20.9168 31.6673 20.0002 31.6673C19.0835 31.6673 18.3335 30.9173 18.3335 30.0007V21.6673H10.0002C9.0835 21.6673 8.3335 20.9173 8.3335 20.0007C8.3335 19.084 9.0835 18.334 10.0002 18.334H18.3335V10.0007C18.3335 9.08398 19.0835 8.33398 20.0002 8.33398C20.9168 8.33398 21.6668 9.08398 21.6668 10.0007V18.334H30.0002C30.9168 18.334 31.6668 19.084 31.6668 20.0007C31.6668 20.9173 30.9168 21.6673 30.0002 21.6673Z"
					fill="url(#paint0_linear_792_4855)"
				/>
			</g>
			<defs>
				<linearGradient
					id="paint0_linear_792_4855"
					x1="8.3335"
					y1="20.0007"
					x2="31.6668"
					y2="20.0007"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#FF7B10" />
					<stop offset="0.4723" stopColor="#F5A0C5" />
					<stop offset="1" stopColor="#7E63EB" />
				</linearGradient>
				<clipPath id="clip0_792_4855">
					<rect width="40" height="40" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
};

const Check = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
		>
			<g clipPath="url(#clip0_792_4701)">
				<path
					d="M8.99965 16.1703L5.52965 12.7003C5.13965 12.3103 4.50965 12.3103 4.11965 12.7003C3.72965 13.0903 3.72965 13.7203 4.11965 14.1103L8.29965 18.2903C8.68965 18.6803 9.31965 18.6803 9.70965 18.2903L20.2896 7.71031C20.6796 7.32031 20.6796 6.69031 20.2896 6.30031C19.8997 5.91031 19.2696 5.91031 18.8796 6.30031L8.99965 16.1703Z"
					fill="#4A9E4F"
				/>
			</g>
			<defs>
				<clipPath id="clip0_792_4701">
					<rect width="24" height="24" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
};

const renderX = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="22"
			height="18"
			viewBox="0 0 18 18"
			fill="none"
		>
			<g clipPath="url(#clip0_792_4847)">
				<path
					d="M16.7747 5.23432C16.4172 4.87682 15.8397 4.87682 15.4822 5.23432L10.9997 9.70766L6.51717 5.22516C6.15967 4.86766 5.58217 4.86766 5.22467 5.22516C4.86717 5.58266 4.86717 6.16016 5.22467 6.51766L9.70717 11.0002L5.22467 15.4827C4.86717 15.8402 4.86717 16.4177 5.22467 16.7752C5.58217 17.1327 6.15967 17.1327 6.51717 16.7752L10.9997 12.2927L15.4822 16.7752C15.8397 17.1327 16.4172 17.1327 16.7747 16.7752C17.1322 16.4177 17.1322 15.8402 16.7747 15.4827L12.2922 11.0002L16.7747 6.51766C17.123 6.16932 17.123 5.58266 16.7747 5.23432Z"
					fill="#E65A59"
				/>
			</g>
			<defs>
				<clipPath id="clip0_792_4847">
					<rect width="22" height="22" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
};
