import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";

interface CardData {
  domain: string;
  date: string;
  contacts_collected: number;
  visitor: number;
  view_product: number;
  abandoned_cart: number;
  converted_sale: number;
}

const MainSectionCard: React.FC<{ data: CardData }> = ({ data }) => {
  const {
    domain,
    date,
    contacts_collected,
    visitor,
    view_product,
    abandoned_cart,
    converted_sale,
  } = data;

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
        padding: "1rem 1.5rem",
        maxWidth: "100%",
      }}
    >
      <CardContent
        sx={{
          p: 0,
          "&:last-child": {
            paddingBottom: 0,
          },
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexDirection="column"
          mb={2}
        >
          <Box
            width="100%"
            display="flex"
            alignItems="end"
            justifyContent="end"
          >
            <Typography className="dashboard-card-text">{date}</Typography>
          </Box>
          <Box
            width="100%"
            display="flex"
            alignItems="start"
            justifyContent="start"
          >
            <Typography className="dashboard-card-heading">{domain}</Typography>
          </Box>
        </Box>

        {/* Левая колонка */}
        <Box mb={1}>
          <Typography className="dashboard-card-text">
            Contacts Collected
          </Typography>
          <Typography className="dashboard-card-heading">
            {contacts_collected.toLocaleString("en-US")}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          {/* Левая колонка */}
          <Box mb={1}>
            <Typography className="dashboard-card-text">Visitor</Typography>
            <Typography className="dashboard-card-heading">
              {visitor.toLocaleString("en-US")}
            </Typography>
          </Box>

          <Box mb={1}>
            <Typography className="dashboard-card-text">
              View Product
            </Typography>
            <Typography className="dashboard-card-heading">
              {view_product.toLocaleString("en-US")}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          {/* Левая колонка */}
          <Box>
            <Typography className="dashboard-card-text">
              Abandoned Cart
            </Typography>
            <Typography className="dashboard-card-heading">
              {abandoned_cart.toLocaleString("en-US")}
            </Typography>
          </Box>

          <Box>
            <Typography className="dashboard-card-text">
              Converted Sale
            </Typography>
            <Typography className="dashboard-card-heading">
              {converted_sale.toLocaleString("en-US")}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MainSectionCard;
