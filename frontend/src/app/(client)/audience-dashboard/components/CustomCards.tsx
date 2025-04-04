import React from "react";
import { Grid, Typography, Box } from "@mui/material";
import LegendToggleIcon from "@mui/icons-material/LegendToggle";
import AllInboxIcon from "@mui/icons-material/AllInbox";
import ContactsIcon from "@mui/icons-material/Contacts";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CategoryIcon from "@mui/icons-material/Category";
import Image from "next/image";

interface StatCardProps {
  value: number;
  title: string;
  icon?: React.ReactNode;
  imageUrl?: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  border?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  value,
  title,
  icon,
  imageUrl,
  bgColor = "#fff",
  textColor = "rgba(32,33,36,1)",
  borderColor = "transparent",
  border = "",
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: bgColor,
        color: textColor,
        borderRadius: "8px",
        padding: "16px",
        width: "100%",
        gap: 1.5,
        mb: 2,
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
        height: "84px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: borderColor,
          borderRadius: "20%",
          padding: "12px",
          width: "52px",
          height: "52px",
        }}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={title} width={36} height={36} />
        ) : (
          icon
        )}
      </Box>
      <Box
        sx={{ display: "flex", flexDirection: "column", alignItems: "start" }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: "700",
            fontSize: "22px",
            fontFamily: "Nunito Sans",
            lineHeight: "30.01px",
            color: textColor,
          }}
        >
          {value.toLocaleString()}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontFamily: "Nunito Sans",
            fontSize: "14px",
            fontWeight: "500",
            lineHeight: "19.6px",
            textAlign: "left",
            color: "rgba(74,74,74,1)",
          }}
        >
          {title}
        </Typography>
      </Box>
    </Box>
  );
};

const PixelContactsCard: React.FC<{ value: number }> = ({ value }) => (
  <StatCard
    value={value}
    title="Pixel Contacts"
    icon={<LegendToggleIcon sx={{ color: "#F45745", fontSize: "36px" }} />}
    textColor="rgba(32,33,36,1)"
    borderColor="#F4574533"
  />
);

const SourcesCard: React.FC<{ value: number }> = ({ value }) => (
  <StatCard
    value={value}
    title="Sources"
    icon={<AllInboxIcon sx={{ color: "#5052B2", fontSize: "36px" }} />}
    textColor="rgba(32,33,36,1)"
    borderColor="#5052B233"
  />
);

const LookalikesCard: React.FC<{ value: number }> = ({ value }) => (
  <StatCard
    value={value}
    title="Lookalikes"
    icon={<ContactsIcon sx={{ color: "#E0B005", fontSize: "36px" }} />}
    textColor="rgba(32,33,36,1)"
    borderColor="#FCE18233"
  />
);

const SmartAudienceCard: React.FC<{ value: number }> = ({ value }) => (
  <StatCard
    value={value}
    title="Smart Audience"
    icon={<AutoFixHighIcon sx={{ color: "#6EC125", fontSize: "36px" }} />}
    textColor="rgba(32,33,36,1)"
    borderColor="#CAEFA980"
  />
);

const DataSyncCard: React.FC<{ value: number }> = ({ value }) => (
  <StatCard
    value={value}
    title="Data sync"
    icon={<CategoryIcon sx={{ color: "#0569E2", fontSize: "36px" }} />}
    textColor="rgba(32,33,36,1)"
    borderColor="#DEEDFF"
  />
);

interface CustomCardsProps {
  values: {
    pixel_contacts: number;
    sources: number;
    lookalikes: number;
    smart_audience: number;
    data_sync: number;
  };
}

const CustomCards: React.FC<CustomCardsProps> = ({ values }) => {
  return (
    <Grid container spacing={{ xs: 1, sm: 1.5, md: 2, lg: 4 }}>
      <Grid item xs={12} md={2.4}>
        <PixelContactsCard value={values.pixel_contacts} />
      </Grid>
      <Grid item xs={12} md={2.4}>
        <SourcesCard value={values.sources} />
      </Grid>
      <Grid item xs={12} md={2.4}>
        <LookalikesCard value={values.lookalikes} />
      </Grid>
      <Grid item xs={12} md={2.4}>
        <SmartAudienceCard value={values.smart_audience} />
      </Grid>
      <Grid item xs={12} md={2.4}>
        <DataSyncCard value={values.data_sync} />
      </Grid>
    </Grid>
  );
};

export default CustomCards;
