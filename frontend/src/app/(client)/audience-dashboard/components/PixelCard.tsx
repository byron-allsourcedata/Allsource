import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

interface CardData {
  domain: string;
  date: string;
  contacts_collected: number;
  visitor: number;
  view_product: number;
  abandoned_cart: number;
  converted_sale: number;
}

type PixelCardProps = {
  data: CardData;
  onClick?: () => void;
};

const COLORS: Record<string, string> = {
  Visitor: "rgba(98, 178, 253, 1)",
  "Abandoned Cart": "rgba(249, 155, 171, 1)",
  "View Product": "rgba(155, 223, 196, 1)",
  "Converted Sale": "rgba(255, 180, 79, 1)",
  Default: "rgba(220,220,220,1)",
};



const MainSectionCard: React.FC<PixelCardProps> = ({ data, onClick }) => {
  const {
    domain,
    date,
    contacts_collected,
    visitor,
    view_product,
    abandoned_cart,
    converted_sale,
  } = data;

  const metrics = [
    { label: "Visitor", value: visitor },
    { label: "View Product", value: view_product },
    { label: "Abandoned Cart", value: abandoned_cart },
    { label: "Converted Sale", value: converted_sale },
  ];

  const chartData = [
    { name: "Visitor", value: visitor },
    { name: "Abandoned Cart", value: abandoned_cart },
    { name: "View Product", value: view_product },
    { name: "Converted Sale", value: converted_sale },
  ];

  const totalValue = chartData.reduce((sum, d) => sum + d.value, 0);
  const showGray = totalValue === 0;

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? "pointer" : "default",
        borderRadius: 2,
        boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.25)",
        padding: "1rem 0.75rem",
        maxWidth: "100%",
        "&:hover": {
          border: `1px solid rgba(5, 105, 226, 1)`,
          transition: "none",
        },
      }}
    >
      <CardContent sx={{ p: 0, "&:last-child": { paddingBottom: 0 } }}>
        {/* Header line: domain + date */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
          mb={2}
        >
          <Typography className="dashboard-card-heading" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', cursor: 'pointer', textOverflow: 'ellipsis', maxWidth: '120px' }}>{domain}</Typography>
          <Typography className="dashboard-card-text">{date}</Typography>
        </Box>

        {/* PieChart */}
        <Box
          height={160}
          display="flex"
          position={'relative'}
          justifyContent="center"
          alignItems="center"
        >
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={showGray ? [{ name: "Default", value: 1 }] : chartData}
                dataKey="value"
                innerRadius={52}
                outerRadius={80}
                stroke="none"
              >
                {(showGray
                  ? [{ name: "Default", color: COLORS.Default }]
                  : chartData.map((entry) => ({
                    ...entry,
                    color: COLORS[entry.name],
                  }))
                ).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <Box
            position="absolute"
            textAlign="center"
          >
            {showGray ? (
              <>
                <Typography
                  className="main-text"
                  sx={{ fontSize: '14px', color: 'rgba(74, 74, 74, 0.8)' }}
                >
                  Contacts
                </Typography>
                <Typography
                  className="main-text"
                  sx={{ fontSize: '14px', color: 'rgba(74, 74, 74, 0.8)' }}
                >
                  collected
                </Typography>
                <Typography className="main-text" sx={{ fontSize: '16px', color: 'rgba(0, 0, 0, 1)' }}>0</Typography>
              </>
            ) : (
              <>
                <Typography
                  className="main-text"
                  sx={{ fontSize: '14px', color: 'rgba(74, 74, 74, 0.8)' }}
                >
                  Contacts
                </Typography>
                <Typography
                  className="main-text"
                  sx={{ fontSize: '14px', color: 'rgba(74, 74, 74, 0.8)' }}
                >
                  collected
                </Typography>
                <Typography className="main-text" sx={{ fontSize: '16px', color: 'rgba(0, 0, 0, 1)' }}>{contacts_collected.toLocaleString("en-US")}</Typography>
              </>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1,
            pt: 2,
          }}
        >
          {[
            { label: "Visitor", value: visitor },
            { label: "View Product", value: view_product },
            { label: "Abandoned Cart", value: abandoned_cart },
            { label: "Converted Sale", value: converted_sale },
          ].map(({ label, value }) => (
            <Box key={label} mb={1} display="flex" flexDirection="column" gap={0.5}>
              <Box display="flex" alignItems="start" gap={1}>
                <Box
                  sx={{
                    mt: 0.25,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: COLORS[label],
                  }}
                />
                <Box sx={{ display: 'flex', alignItems: 'start', flexDirection: 'column' }}>
                  <Typography className="dashboard-pixel-card-text">{label}</Typography>
                  <Typography className="dashboard-card-heading">
                    {value.toLocaleString("en-US")}
                  </Typography>
                </Box>
              </Box>

            </Box>
          ))}
        </Box>

      </CardContent>
    </Card>
  );
};

export default MainSectionCard;
