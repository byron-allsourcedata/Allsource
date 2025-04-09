"use client";
import React, { useState, useEffect } from "react";
import { Box, Grid, Typography } from "@mui/material";
import { dashboardStyles } from "../dashboard/dashboardStyles";
import CustomTooltip from "@/components/customToolTip";
import { useNotification } from "../../../context/NotificationContext";
import CustomCards from "./components/CustomCards";
import AudienceChart from "./components/AudienceChart";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import LookalikeCard from "./components/SelectedCards";
import PixelCard from "./components/PixelCard";
import MainSectionCard from "./components/MainSectionCards";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";

interface EventCardData {
  id: string;
  chain_ids: string[];
  status: string;
  date: string;
  event_info: Record<string, string | number>;
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

const AudienceDashboard: React.FC = () => {
  const [values, setValues] = useState({
    pixel_contacts: 0,
    sources: 0,
    lookalikes: 0,
    smart_audience: 0,
    data_sync: 0,
  });
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const { hasNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [activeChainIds, setActiveChainIds] = useState<string[]>([]);
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
        smart_audience: counts.smart_audience_count ?? 0,
        data_sync: counts.data_sync_count ?? 0,
      });

      const events = eventsRes.data;
      const categories = [
        "lookalikes",
        "sources",
        "smart_audiences",
        "data_sync",
      ] as const;

      const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          month: "long",
          day: "numeric",
          year: "numeric",
        });

      const normalize = (str: string) => str.toLowerCase().replace(/s$/, "");

      const buildStatus = (type: string, tabType: string) => {
        return normalize(type) === normalize(tabType)
          ? "Created"
          : `Created ${type.charAt(0).toUpperCase() + type.slice(1)}`;
      };

      const formatKey = (key: string): string =>
        key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

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
        const excludeKeys = ["created_at", "type", "id", "chain_ids"];

        return Object.entries(event)
          .filter(([key]) => !excludeKeys.includes(key))
          .filter(
            ([, value]) => value !== null && value !== undefined && value !== ""
          )
          .reduce((acc, [key, value]) => {
            const formattedKey = formatKey(key);

            if (key === "lookalike_size" && typeof value === "string") {
              acc["Lookalike Size"] = formatLookalikeSize(value);
            } else if (key === "source_type" && typeof value === "string") {
              acc[formattedKey] = formatKey(value);
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
            status: formatKey(buildStatus(type, tabType)),
            date: formatDate(event.created_at),
            event_info: eventInfoBuilder(event),
            tabType:
              tabType[0].toUpperCase() + tabType.slice(1).replace("_", " "),
          });
        });
      });
      console.log(groupedCards);
      setEventCards(groupedCards);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCardClick = (card: string) => {
    if (selectedCard === card) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

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
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            position: "sticky",
            top: 0,
            pt: "12px",
            pb: "12px",
            pl: "8px",
            pr: "1.5rem",
            zIndex: 1,
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
              linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/dashboard"
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
            <Box
              sx={{
                width: "100%",
                mt: 1,
                pl: 0.5,
                mb: 0,
                "@media (max-width: 900px)": { mt: 0, mb: 0 },
              }}
            >
              <CustomCards values={values} onCardClick={handleCardClick} />
            </Box>
            {selectedCard ? (
              <Box>
                <Grid container justifyContent="center">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      {selectedCard === "Sources" && (
                        <LookalikeCard
                          data={{
                            status: "Created",
                            date: "6:20 pm, April 2, 2025",
                            left: {
                              Name: "Sorce1",
                              Type: "Customer Conversions",
                              "Matched Records": 5967,
                            },
                            right: {
                              "Lookalike Name": "My First Lookalike",
                              "Lookalike size": "0-10% Very similar",
                              Size: 10476,
                            },
                            tabType: "sources",
                          }}
                        />
                      )}
                      {selectedCard === "Lookalikes" && (
                        <LookalikeCard
                          data={{
                            status: "Created Audience",
                            date: "6:20 pm, April 2, 2025",
                            left: {
                              Name: "Sorce1",
                              Type: "Customer Conversions",
                              "Matched Records": 5967,
                            },
                            right: {
                              "Lookalike Name": "My First Lookalike",
                              "Lookalike size": "0-10% Very similar",
                              "Active Segments": 10476,
                            },
                            tabType: "Lookalikes",
                            isMainSection: true,
                          }}
                        />
                      )}
                    </Grid>
                  ))}
                </Grid>
                {selectedCard === "Pixel Contacts" && (
                  <Box>
                    <AudienceChart />
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ width: "100%", mb: 2, pl: 0.5 }}>
                <Grid container spacing={{ xs: 2, sm: 2, md: 2, lg: 2 }}>
                  <Grid item xs={12} md={2.4}>
                    {pixelContacts.map((contact, index) => (
                      <PixelCard
                        key={index}
                        data={{
                          domain: contact.domain,
                          date: "last 24h",
                          contacts_collected: contact.total_leads,
                          visitor: contact.visitors,
                          view_product: contact.view_products,
                          abandoned_cart: contact.abandoned_cart,
                          converted_sale: contact.converted_sale,
                        }}
                      />
                    ))}
                  </Grid>
                  <Grid item xs={12} md={2.4}>
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
                          }}
                        />
                      </Box>
                    ))}
                  </Grid>

                  <Grid item xs={12} md={2.4}>
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
                          }}
                        />
                      </Box>
                    ))}
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    {eventCards.smart_audience.map((card, index) => (
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
                          }}
                        />
                      </Box>
                    ))}
                  </Grid>
                  <Grid item xs={12} md={2.4}>
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
                          }}
                        />
                      </Box>
                    ))}
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </Box>
      </Grid>
    </Box>
  );
};

export default AudienceDashboard;
