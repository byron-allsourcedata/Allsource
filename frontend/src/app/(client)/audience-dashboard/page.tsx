"use client";
import React, { useState, useEffect } from "react";
import { Box, Grid, Link, Typography } from "@mui/material";
import { dashboardStyles } from "../dashboard/dashboardStyles";
import CustomTooltip from "@/components/customToolTip";
import { useNotification } from "../../../context/NotificationContext";
import CustomCards from "./components/CustomCards";
import AudienceChart from "./components/AudienceChart";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import InfoCard from "./components/SelectedCards";
import PixelCard from "./components/PixelCard";
import BlurPixel from "./components/BlurPixel";
import BlurAudience from "./components/BlurAudience";
import MainSectionCard from "./components/MainSectionCards";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import SmartAudienceCard from "./components/SmartAudienceCard";
import WelcomePopup from "@/app/(client)/dashboard/components/WelcomePopup";
import { showErrorToast } from "@/components/ToastNotification";
import { TableData } from "@/types/lookalike";
import { useRouter } from "next/navigation";
import {
  CardsSection,
  FirstTimeScreenCommonVariant1,
} from "@/components/first-time-screens";
import { MovingIcon, SettingsIcon, SpeedIcon } from "@/icon";

interface EventDate {
  relative: string;
  full: string;
}

interface EventCardData {
  id: string;
  chain_ids: string[];
  status: string;
  date: EventDate;
  event_info: Record<string, string | number>;
  tabType: string;
}

interface FullEventCardData {
  id: string;
  status: string;
  date: string;
  left_info: Record<string, string | number>;
  right_info?: Record<string, string | number>;
  tabType: string;
}

interface PixelContact {
  domain: string;
  total_leads: number;
  visitors: number;
  view_products: number;
  abandoned_cart: number;
  converted_sale: number;
}

interface CardData {
  status: string;
  date: string;
  left: Record<string, string | number>;
  right?: Record<string, string | number>;
  tabType?: string;
}

type FirstTimeScreenCardData = {
  title: string;
  description: string;
  icon: string;
  onClick?: () => void;
  isClickable?: boolean;
};

const cardData: FirstTimeScreenCardData[] = [
  {
    title: "Install Pixel",
    description:
      "It will automatically collect visitor information from your website.",
    icon: "/source.svg",
    isClickable: true,
  },
  {
    title: "Import Source from CSV file",
    description:
      "Otherwise you can upload a CSV file containing your existing customer data.",
    icon: "/lookalike.svg",
    isClickable: true,
  },
];

const AudienceDashboard: React.FC = () => {
  const [welcomePopup, setWelcomePopup] = useState<string | null>(null);
  const [values, setValues] = useState({
    pixel_contacts: 0,
    sources: 0,
    lookalikes: 0,
    smart_audience: 0,
    data_sync: 0,
  });
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const router = useRouter();
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [pixelCardActive, setPixelCardActive] = useState(false);
  const [hasValid, setHasValid] = useState<boolean>(false);
  const { hasNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [activeChainIds, setActiveChainIds] = useState<string[]>([]);
  const [sourceData, setSourceData] = useState<TableData[]>([]);
  const [chainedCards, setChainedCards] = useState<{
    sources: CardData[];
    lookalikes: CardData[];
    smart_audience: CardData[];
    data_sync: CardData[];
  }>({
    sources: [],
    lookalikes: [],
    smart_audience: [],
    data_sync: [],
  });

  const [eventCards, setEventCards] = useState<Record<string, EventCardData[]>>(
    {
      lookalikes: [],
      sources: [],
      smart_audience: [],
      data_sync: [],
    }
  );

  const [pixelContacts, setPixelContacts] = useState<PixelContact[]>([]);
  const fetchData = async () => {
    try {
      const [countsRes, eventsRes] = await Promise.all([
        axiosInterceptorInstance.get("/audience-dashboard"),
        axiosInterceptorInstance.get("/audience-dashboard/events"),
      ]);

      const counts = countsRes.data?.total_counts ?? {};
      const pixelContactsRaw = countsRes.data?.pixel_contacts ?? [];
      setPixelContacts(pixelContactsRaw);
      setValues({
        pixel_contacts: counts.pixel_contacts ?? 0,
        sources: counts.sources_count ?? 0,
        lookalikes: counts.lookalike_count ?? 0,
        smart_audience: counts.smart_count ?? 0,
        data_sync: counts.sync_count ?? 0,
      });

      const events = eventsRes.data.short_info;
      const events_cards = eventsRes.data.full_info;
      const categories = [
        "lookalikes",
        "sources",
        "smart_audiences",
        "data_sync",
      ] as const;

      const formatDate = (dateStr: string) => {
        const isoDateStr = dateStr.slice(0, 23);
        const date = new Date(isoDateStr + "Z");
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);

        let relative = "";
        if (diffMs < 0) {
          relative = "in the future";
        } else if (diffSec < 60) {
          relative = "just now";
        } else if (diffMin < 60) {
          relative = `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
        } else if (diffHour < 24) {
          relative = `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
        } else if (diffDay < 7) {
          relative = `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
        } else if (diffWeek < 5) {
          relative = `${diffWeek} week${diffWeek === 1 ? "" : "s"} ago`;
        } else if (diffMonth < 12) {
          relative = `${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`;
        } else {
          relative = `${diffYear} year${diffYear === 1 ? "" : "s"} ago`;
        }

        const full = date.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        return { relative, full };
      };

      const normalize = (str: string) => str.toLowerCase().replace(/s$/, "");

      const buildStatus = (
        type: string,
        tabType: string,
        status?: string
      ): string => {
        const normalizedType = normalize(type);
        const normalizedTab = normalize(tabType);

        if (normalizedType === "data_sync") {
          if (status === "data_syncing") return "Syncing";
          if (status === "synced") return "Synced";
          return "Synced";
        }

        if (normalizedType === normalizedTab) {
          return "Created";
        }

        return `Created ${type.charAt(0).toUpperCase() + type.slice(1)}`;
      };

      const formatKey = (key: string): string =>
        key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

      const toNormalText = (sourceType: string) => {
        return sourceType
          .split(",")
          .map((item) =>
            item
              .split("_")
              .map(
                (subItem) => subItem.charAt(0).toUpperCase() + subItem.slice(1)
              )
              .join(" ")
          )
          .join(", ");
      };

      const formatLookalikeSize = (value: string): string => {
        const map: Record<string, string> = {
          almost_identical: "Almost Identical 0–3%",
          extremely_similar: "Extremely Similar 0–7%",
          very_similar: "Very Similar 0–10%",
          quite_similar: "Quite Similar 0–15%",
          broad: "Broad 0–20%",
        };

        return map[value] ?? value;
      };

      const eventInfoBuilder = (
        event: Record<string, any>
      ): Record<string, string | number> => {
        const isLookalike = event.type === "lookalikes";
        const excludeKeys = [
          "created_at",
          "type",
          "id",
          "chain_ids",
          "status",
          "target_type",
          "no_of_customers",
          "domain",
          ...(isLookalike ? ["source_type"] : []),
        ];

        return Object.entries(event)
          .filter(([key]) => !excludeKeys.includes(key))
          .filter(
            ([, value]) => value !== null && value !== undefined && value !== ""
          )
          .reduce((acc, [key, value]) => {
            let formattedKey = formatKey(key);

            if (/^(source|lookalike|data_sync|audience)_name$/.test(key)) {
              formattedKey = "Name";
            }

            if (key === "lookalike_size" && typeof value === "string") {
              acc["Lookalike Size"] = formatLookalikeSize(value);
            } else if (key === "source_type" && typeof value === "string") {
              acc["Type"] = toNormalText(value);
            } else if (
              (key === "include" || key === "exclude") &&
              Array.isArray(value)
            ) {
              const list = value
                .map((item) =>
                  item.name
                    ? `${item.name}${item.type ? ` (${item.type})` : ""}`
                    : null
                )
                .filter(Boolean)
                .join(", ");

              acc[formattedKey] = list;
            } else {
              acc[formattedKey] = value;
            }

            return acc;
          }, {} as Record<string, string | number>);
      };

      const groupedCards: Record<string, EventCardData[]> = {
        lookalikes: [],
        sources: [],
        smart_audience: [],
        data_sync: [],
      };

      categories.forEach((category) => {
        const items = events[category] ?? [];
        items.forEach((event: any) => {
          const tabType =
            category === "smart_audiences" ? "smart_audience" : category;
          const type = event.type ?? tabType;

          groupedCards[tabType].push({
            id: event.id,
            chain_ids: event.chain_ids ?? [],
            status: formatKey(buildStatus(type, tabType, event.status)),
            date: formatDate(event.created_at),
            event_info: eventInfoBuilder(event),
            tabType:
              tabType[0].toUpperCase() + tabType.slice(1).replace("_", " "),
          });
        });
      });
      setEventCards(groupedCards);

      const formatFullDate = (dateStr: string) =>
        new Date(dateStr).toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          month: "long",
          day: "numeric",
          year: "numeric",
        });

      const fullEventInfoBuilder = (
        event: Record<string, any>,
        tabType: string
      ): {
        left: Record<string, string | number>;
        right?: Record<string, string | number>;
      } => {
        const excludeKeys = ["created_at", "type", "id", "chain_ids", "status"];

        const leftInfo: Record<string, string | number> = {};
        const rightInfo: Record<string, string | number> = {};

        const isMainType = (event.type || tabType) === tabType;

        if (tabType === "lookalikes") {
          if (event.lookalike_name) leftInfo["Name"] = event.lookalike_name;
          if (event.source_name) leftInfo["Source"] = event.source_name;
          if (event.size) leftInfo["Size"] = event.size;

          if (event.target_type) rightInfo["Target Type"] = event.target_type;
          if (event.size) rightInfo["Records"] = event.size;
          if (event.source_type)
            rightInfo["Source Type"] = toNormalText(event.source_type);
        } else if (tabType === "smart_audience") {
          if (isMainType) {
            Object.entries(event).forEach(([key, value]) => {
              if (!excludeKeys.includes(key)) {
                let formattedKey = formatKey(key);
                if (/^(source|lookalike|data_sync|audience)_name$/.test(key)) {
                  formattedKey = "Name";
                }
                if (
                  (key === "include" || key === "exclude") &&
                  Array.isArray(value)
                ) {
                  const list = value
                    .map((item) =>
                      item.name
                        ? `${item.name}${item.type ? ` (${item.type})` : ""}`
                        : null
                    )
                    .filter(Boolean)
                    .join(", ");
                  formattedKey = key === "include" ? "Included" : "Excluded";
                  leftInfo[formattedKey] = list;
                } else if (
                  value !== null &&
                  value !== undefined &&
                  value !== ""
                ) {
                  leftInfo[formattedKey] = value;
                }
              }
            });
          } else {
            if (event.audience_name)
              leftInfo["Audience Name"] = event.audience_name;
            if (event.destination) leftInfo["Destination"] = event.destination;
            if (event.synced_contacts)
              leftInfo["Synced contacts"] = event.synced_contacts;
          }
        } else if (tabType === "sources") {
          if (isMainType) {
            Object.entries(event).forEach(([key, value]) => {
              if (!excludeKeys.includes(key)) {
                let formattedKey = formatKey(key);
                if (/^(source|lookalike|data_sync|audience)_name$/.test(key)) {
                  formattedKey = "Name";
                }
                if (/^(source|lookalike|data_sync|audience)_type$/.test(key)) {
                  formattedKey = "Type";
                }
                if (value !== null && value !== undefined && value !== "") {
                  leftInfo[formattedKey] = value ?? "-";
                }
              }
            });
          } else {
            if (event.source_name) leftInfo["Name"] = event.source_name;
            if (event.target_type) leftInfo["Target Type"] = event.target_type;
            if (event.source_type)
              leftInfo["Type"] = toNormalText(event.source_type);
            if (event.domain !== undefined) {
              rightInfo["Domain"] = event.domain || "-";
            }

            if (
              event.no_of_customers !== undefined &&
              event.no_of_customers !== null
            ) {
              rightInfo["No of Customers"] = event.no_of_customers;
            }

            if (
              event.matched_records !== undefined &&
              event.matched_records !== null
            ) {
              rightInfo["Matched Records"] = event.matched_records;
            }

            if (event.lookalike_name)
              rightInfo["Lookalike Name"] = event.lookalike_name;
            if (event.lookalike_size)
              rightInfo["Lookalike Size"] = formatLookalikeSize(
                event.lookalike_size
              );
            if (event.size) rightInfo["Size"] = event.size;
          }
        } else {
          Object.entries(event).forEach(([key, value]) => {
            if (!excludeKeys.includes(key)) {
              let formattedKey = formatKey(key);
              if (
                /^(source|lookalike|data_sync|smart_audience)_name$/.test(key)
              ) {
                formattedKey = "Name";
              }
              if (key === "lookalike_size") {
                leftInfo[formattedKey] = formatLookalikeSize(value);
              } else if (
                value !== null &&
                value !== undefined &&
                value !== ""
              ) {
                leftInfo[formattedKey] = value;
              }
            }
          });
        }

        return {
          left: leftInfo,
          ...(Object.keys(rightInfo).length > 0 ? { right: rightInfo } : {}),
        };
      };

      const groupedSelectedCards: Record<string, FullEventCardData[]> = {
        lookalikes: [],
        sources: [],
        smart_audience: [],
        data_sync: [],
      };

      // В цикле где создаются карточки, передаем tabType в builder
      categories.forEach((category) => {
        const items = events_cards[category] ?? [];
        items.forEach((event: any) => {
          const tabType =
            category === "smart_audiences" ? "smart_audience" : category;
          const type = event.type ?? tabType;

          const { left, right } = fullEventInfoBuilder(event, tabType);

          groupedSelectedCards[tabType].push({
            id: event.id,
            status: formatKey(buildStatus(type, tabType)),
            date: formatFullDate(event.created_at),
            left_info: left,
            right_info: right,
            tabType:
              tabType[0].toUpperCase() + tabType.slice(1).replace("_", " "),
          });
        });
      });

      const buildChainedPairs = (cards: FullEventCardData[]): CardData[] => {
        return cards.map((card) => ({
          status: card.status,
          date: card.date,
          left: card.left_info,
          right: card.right_info,
          tabType: card.tabType,
        }));
      };

      const sources = buildChainedPairs(groupedSelectedCards.sources);
      const lookalikes = buildChainedPairs(groupedSelectedCards.lookalikes);
      const smartAudience = buildChainedPairs(
        groupedSelectedCards.smart_audience
      );
      const dataSync = buildChainedPairs(groupedSelectedCards.data_sync);

      setChainedCards({
        sources,
        lookalikes,
        smart_audience: smartAudience,
        data_sync: dataSync,
      });
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSourceData = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInterceptorInstance.get<{
        sources: CardData;
        has_valid: boolean;
      }>(`/audience-dashboard/get-sources`);

      const sourcesArray = Array.isArray(data.sources) ? data.sources : [];
      setSourceData(sourcesArray);
      setHasValid(Boolean(data.has_valid));
    } catch {
      showErrorToast(
        "An error occurred while loading sources. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSourceData();
    fetchData();
  }, []);

  const handleCardClick = (card: string) => {
    if (selectedCard === card) {
      setSelectedCard(null);
      setPixelCardActive(false);
    } else {
      setSelectedCard(card);
      setPixelCardActive(false);
    }
  };

  const handlePixelCardClick = (card: string, domain: string) => {
    if (selectedCard === card && selectedDomain === domain) {
      setSelectedCard(null);
      setSelectedDomain(null);
      setPixelCardActive(false);
    } else {
      setSelectedCard("Pixel Contacts");
      setSelectedDomain(domain);
      setPixelCardActive(true);
    }
  };

  const tabMap: Record<string, keyof typeof chainedCards> = {
    Sources: "sources",
    Lookalikes: "lookalikes",
    "Smart Audience": "smart_audience",
    "Data sync": "data_sync",
  };

  const currentTabData: CardData[] =
    selectedCard && tabMap[selectedCard]
      ? chainedCards[tabMap[selectedCard]]
      : [];


  useEffect(() => {
    const storedPopup = localStorage.getItem("welcome_popup");
    setWelcomePopup(storedPopup);
  }, []);
  return (
    <Box>
      <Grid
        sx={{
          display: "flex",
          flexDirection: "column",
          "@media (max-width: 600px)": {
            paddingRight: 0,
          },
        }}
      >
        {loading && <CustomizedProgressBar />}
        {!loading && (
          <>
            {hasValid ? (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "start",
                    position: "sticky",
                    top: 0,
                    pt: "12px",
                    pr: "1rem",
                    zIndex: 100,
                    backgroundColor: "#fff",
                    justifyContent: "space-between",
                    width: "100%",
                    "@media (max-width: 600px)": {
                      flexDirection: "column",
                      display: "flex",
                      alignItems: "flex-start",
                      zIndex: 1,
                      width: "100%",
                      pr: 1.5,
                    },
                    "@media (max-width: 440px)": {
                      flexDirection: "column",
                      pt: hasNotification ? "3rem" : "0.75rem",
                      top: hasNotification ? "4.5rem" : "",
                      zIndex: 1,
                      justifyContent: "flex-start",
                    },
                    "@media (max-width: 400px)": {
                      pt: hasNotification ? "4.25rem" : "",
                      pb: "6px",
                    },
                  }}
                >
                  <Typography
                    variant="h4"
                    component="h1"
                    className="first-sub-title"
                    sx={{
                      ...dashboardStyles.title,
                      pl: "4px",
                      "@media (max-width: 600px)": {
                        display: "none",
                      },
                    }}
                  >
                    Dashboard{" "}
                    <CustomTooltip
                      title={
                        "Indicates the count of resolved identities and revenue figures for the specified time"
                      }
                      linkText="Learn More"
                      linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/dashboard-audience"
                    />
                  </Typography>
                  <Box
                    sx={{
                      display: "none",
                      width: "100%",
                      justifyContent: "space-between",
                      alignItems: "start",
                      "@media (max-width: 600px)": {
                        display: "flex",
                      },
                    }}
                  >
                    <Typography
                      variant="h4"
                      component="h1"
                      className="first-sub-title"
                      sx={dashboardStyles.title}
                    >
                      Dashboard
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: "100%",
                      mt: 1,
                      overflowX: "auto",
                      whiteSpace: "nowrap",
                      pl: 0.5,
                      pr: 0.5,
                      pt: 1,
                      "@media (max-width: 900px)": { mt: 0, mb: 0 },
                    }}
                  >
                    <CustomCards
                      disabledCards={{
                        pixel: pixelContacts.length === 0,
                        audience: eventCards.sources.length === 0
                      }}
                      values={values}
                      onCardClick={handleCardClick}
                      selectedCard={selectedCard}
                      pixelCardActive={pixelCardActive}
                    />
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    overflow: "auto",
                    flexGrow: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      pr: 2,
                    }}
                  >
                    {selectedCard ? (
                      <Box sx={{ overflow: "hidden" }}>
                        <Box mb={1}>
                          <Grid container spacing={2}>
                            {currentTabData.map((card: any, index) => (
                              <Grid
                                item
                                xs={12}
                                sm={6}
                                md={6}
                                lg={6}
                                key={index}
                                sx={{ height: "100%" }}
                              >
                                <Box sx={{ height: "100%" }}>
                                  <InfoCard data={card} />
                                </Box>
                              </Grid>
                            ))}
                          </Grid>

                          {selectedCard === "Pixel Contacts" && (
                            <Box>
                              <AudienceChart selectedDomain={selectedDomain} />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ width: "100%", mb: 2, pl: 0.5 }}>
                        <Grid
                          container
                          spacing={2}
                          wrap="nowrap"
                          sx={{ flexWrap: "nowrap" }}
                        >
                          <Grid
                            item
                            xs={12}
                            sx={{
                              "@media (max-width: 600px)": { minWidth: 320 },
                            }}
                            md={2.4}
                          >
                            {pixelContacts.length === 0 ?
                              <BlurPixel />
                              : pixelContacts.map((contact, index) => (
                                <Box key={index} mt={1}>
                                  <PixelCard
                                    key={index}
                                    data={{
                                      domain: contact.domain,
                                      date: "Last 24h",
                                      contacts_collected: contact.total_leads,
                                      visitor: contact.visitors,
                                      view_product: contact.view_products,
                                      abandoned_cart: contact.abandoned_cart,
                                      converted_sale: contact.converted_sale,
                                    }}
                                    onClick={() =>
                                      handlePixelCardClick(
                                        "Pixel Contacts",
                                        contact.domain
                                      )
                                    }
                                  />
                                </Box>
                              ))
                            }
                          </Grid>

                          {eventCards.sources.length === 0
                            ? <Grid
                              item
                              xs={12}
                              md={9.6}
                            >
                              <BlurAudience />
                            </Grid>
                            :
                            (
                              <>
                                <Grid
                                  item
                                  sx={{
                                    "@media (max-width: 600px)": { minWidth: 320 },
                                  }}
                                  xs={12}
                                  md={2.4}
                                >
                                  {eventCards.sources.map((card, index) => (
                                    <Box key={index} mt={1}>
                                      <MainSectionCard
                                        key={card.id}
                                        data={card}
                                        highlighted={activeChainIds.includes(card.id)}
                                        onClick={() => {
                                          if (activeChainIds.includes(card.id)) {
                                            setActiveChainIds([]);
                                          } else {
                                            setActiveChainIds(card.chain_ids);
                                          }
                                        }} />
                                    </Box>
                                  ))}
                                </Grid>

                                <Grid
                                  item
                                  xs={12}
                                  sx={{
                                    "@media (max-width: 600px)": { minWidth: 320 },
                                  }}
                                  md={2.4}
                                >
                                  {eventCards.lookalikes.map((card, index) => (
                                    <Box key={index} mt={1}>
                                      <MainSectionCard
                                        key={card.id}
                                        data={card}
                                        highlighted={activeChainIds.includes(card.id)}
                                        onClick={() => {
                                          if (activeChainIds.includes(card.id)) {
                                            setActiveChainIds([]);
                                          } else {
                                            setActiveChainIds(card.chain_ids);
                                          }
                                        }} />
                                    </Box>
                                  ))}
                                </Grid>

                                <Grid
                                  item
                                  xs={12}
                                  sx={{
                                    "@media (max-width: 600px)": { minWidth: 320 },
                                  }}
                                  md={2.4}
                                >
                                  {eventCards.smart_audience.map((card, index) => (
                                    <Box key={index} mt={1}>
                                      <SmartAudienceCard
                                        key={card.id}
                                        data={card}
                                        highlighted={activeChainIds.includes(card.id)}
                                        onClick={() => {
                                          if (activeChainIds.includes(card.id)) {
                                            setActiveChainIds([]);
                                          } else {
                                            setActiveChainIds(card.chain_ids);
                                          }
                                        }} />
                                    </Box>
                                  ))}
                                </Grid>

                                <Grid
                                  item
                                  xs={12}
                                  sx={{
                                    "@media (max-width: 600px)": {
                                      minWidth: 320,
                                      mr: 10,
                                      pr: 1.5,
                                    },
                                  }}
                                  md={2.4}
                                >
                                  {eventCards.data_sync.map((card, index) => (
                                    <Box key={index} mt={1}>
                                      <MainSectionCard
                                        key={card.id}
                                        data={card}
                                        highlighted={activeChainIds.includes(card.id)}
                                        onClick={() => {
                                          if (activeChainIds.includes(card.id)) {
                                            setActiveChainIds([]);
                                          } else {
                                            setActiveChainIds(card.chain_ids);
                                          }
                                        }} />
                                    </Box>
                                  ))}
                                </Grid>
                              </>
                            )}
                        </Grid>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            ) : (
              <>
                <FirstTimeScreenCommonVariant1
                  Header={{
                    TextTitle: 'Dashboard',
                    TextSubtitle: "To begin building your audience, you'll need to provide a data source",
                    link: 'https://allsourceio.zohodesk.com/portal/en/kb/articles/what-is-data-source',
                  }}
                  InfoNotification={{
                    Text: 'Your dashboard displays key performance data across 5 core areas: pixel-captured users, created sources, lookalikes, smart audiences, and data sync status. Monitor all critical metrics in one place to optimize targeting.',
                  }}
                  Content={<CardsSection items={[
                    {
                      title: 'Install Pixel',
                      subtitle: 'It will automatically collect visitor information from your website.',
                      imageSrc: '/pixel.svg',
                      onClick: () => router.push('/get-started?pixel=true'),
                      showRecommended: true,
                      img_height: 120
                    },
                    {
                      title: 'Import Source from CSV file',
                      subtitle: 'Alternatively, you can upload a CSV file containing your existing customer data.',
                      imageSrc: '/audience.svg',
                      onClick: () => router.push('/sources'),
                      showRecommended: false,
                      img_height: 120
                    },
                  ]} />}
                  HelpCard={{
                    headline: 'Stuck with Your Dashboard?',
                    description: 'Book a free 30-minute call and get personalized help with platform navigation, analytics, or any dashboard issues.',
                    helpPoints: [
                      { title: 'Dashboard Walkthrough', description: 'Learn key features and shortcuts' },
                      { title: 'Data Analysis Help', description: 'Understand your metrics and reports' },
                      { title: 'Troubleshooting', description: 'Fix technical issues with an expert' },
                    ],
                  }}
                  LeftMenu={{
                    header: "Unlock Your Dashboard’s Full Potential",
                    subtitle: "Free 30-Min Expert Walkthrough",
                    items: [
                      {
                        Icon: SettingsIcon,
                        title: "Dashboard Walkthrough",
                        subtitle: `We'll guide you through key features to save you hours of exploration.`,
                      },
                      {
                        Icon: SpeedIcon,
                        title: "Data Analysis Help",
                        subtitle: "Go beyond numbers – learn how to extract insights tailored to your goals.",
                      },
                      {
                        Icon: MovingIcon,
                        title: "Troubleshooting",
                        subtitle: "Fix glitches fast and ensure your data flows accurately.",
                      },
                    ],
                  }}
                  ContentStyleSX={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    maxWidth: "840px",
                    margin: "0 auto",
                    mt: 2
                  }}
                />
              </>
            )}
          </>
        )}
      </Grid>
    </Box>
  );
};

export default AudienceDashboard;
