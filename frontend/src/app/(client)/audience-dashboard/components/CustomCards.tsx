import React from "react";
import { Grid, Typography, Box } from "@mui/material";
import LegendToggleIcon from "@mui/icons-material/LegendToggle";
import AllInboxIcon from "@mui/icons-material/AllInbox";
import ContactsIcon from "@mui/icons-material/Contacts";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CategoryIcon from "@mui/icons-material/Category";
import Image from "next/image";
import HintCard from "../../components/HintCard";
import { useAudienceDashboardHints } from "../context/AudienceDashboardHintsContext";
import {  audienceDashboardCards } from "../context/hintsCardsContent";

interface StatCardProps {
  value: number;
  title: string;
  icon?: React.ReactNode;
  imageUrl?: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  border?: string;
  onClick?: () => void;
  isActive?: boolean;
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
  onClick,
  isActive = false,
}) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: isActive ? "rgba(246, 248, 250, 1)" : bgColor,
        color: textColor,
        borderRadius: "8px",
        padding: "16px",
        width: "100%",
        gap: 1.5,
        mb: 2,
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
        height: "84px",
        border: isActive ? "1px solid rgba(117, 168, 218, 1)" : "none",
        cursor: onClick ? "pointer" : "default",
        "&:hover": {
          border: onClick ? "1px solid rgba(117, 168, 218, 0.5)" : undefined,
        },
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

interface CardProps {
  value: number;
  onClick?: () => void;
  isActive?: boolean;
}

const PixelContactsCard: React.FC<CardProps> = ({
  value,
  onClick,
  isActive,
}) => (
  <StatCard
    value={value}
    title="Pixel Contacts"
    icon={<LegendToggleIcon sx={{ color: "#F45745", fontSize: "36px" }} />}
    textColor="rgba(32,33,36,1)"
    borderColor="#F4574533"
    onClick={onClick}
    isActive={isActive}
  />
);

const SourcesCard: React.FC<CardProps> = ({ value, onClick, isActive }) => (
  <StatCard
    value={value}
    title="Sources"
    icon={<AllInboxIcon sx={{ color: "rgba(56, 152, 252, 1)", fontSize: "36px" }} />}
    textColor="rgba(32,33,36,1)"
    borderColor="rgba(56, 152, 252, 1)33"
    onClick={onClick}
    isActive={isActive}
  />
);

const LookalikesCard: React.FC<CardProps> = ({ value, onClick, isActive }) => (
  <StatCard
    value={value}
    title="Lookalikes"
    icon={<ContactsIcon sx={{ color: "#E0B005", fontSize: "36px" }} />}
    textColor="rgba(32,33,36,1)"
    borderColor="#FCE18233"
    onClick={onClick}
    isActive={isActive}
  />
);

const SmartAudienceCard: React.FC<CardProps> = ({
  value,
  onClick,
  isActive,
}) => (
  <StatCard
    value={value}
    title="Smart Audience"
    icon={<AutoFixHighIcon sx={{ color: "#6EC125", fontSize: "36px" }} />}
    textColor="rgba(32,33,36,1)"
    borderColor="#CAEFA980"
    onClick={onClick}
    isActive={isActive}
  />
);

const DataSyncCard: React.FC<CardProps> = ({ value, onClick, isActive }) => (
  <StatCard
    value={value}
    title="Data sync"
    icon={<CategoryIcon sx={{ color: "#0569E2", fontSize: "36px" }} />}
    textColor="rgba(32,33,36,1)"
    borderColor="#DEEDFF"
    onClick={onClick}
    isActive={isActive}
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
  onCardClick: (card: string) => void;
  selectedCard: string | null;
  pixelCardActive?: boolean;
  disabledCards: {pixel: boolean, audience: boolean}
}

const CustomCards: React.FC<CustomCardsProps> = ({
  values,
  onCardClick,
  selectedCard,
  pixelCardActive,
  disabledCards
}) => {
  const { changeAudienceDashboardHint, audienceDashboardHints, resetAudienceDashboardHints } = useAudienceDashboardHints();
  return (
    <Grid container wrap="nowrap" sx={{ flexWrap: 'nowrap'}} spacing={{ xs: 2, sm: 2, md: 2, lg: 2 }}>
      <Grid item sx={{ 
        "@media (max-width: 600px)": { minWidth: 320 }, 
        pointerEvents: disabledCards.pixel ? "none" : "auto", 
        opacity: disabledCards.pixel ? 0.5 : 1 }} 
        xs={12} md={2.4}>
        <PixelContactsCard
          value={values.pixel_contacts}
          onClick={() => onCardClick("Pixel Contacts")}
          isActive={selectedCard === "Pixel Contacts" || pixelCardActive}
        />
          <HintCard
              card={audienceDashboardCards["pixel"]}
              positionLeft={0}
              positionTop={95}
              isOpenBody={audienceDashboardHints["pixel"].showBody}
              toggleClick={() => {
                if (audienceDashboardHints["audience"].showBody) {
                  changeAudienceDashboardHint("audience", "showBody", "close")
                }
                changeAudienceDashboardHint("pixel", "showBody", "toggle")
              }}
              closeClick={() => {
                changeAudienceDashboardHint("pixel", "showBody", "close")
              }}
            />
      </Grid>
      <Grid item sx={{
        "@media (max-width: 600px)": { minWidth: 320 }, 
        pointerEvents: disabledCards.audience ? "none" : "auto", 
        opacity: disabledCards.audience ? 0.5 : 1 }} 
        xs={12} md={2.4}>
        <SourcesCard
          value={values.sources}
          onClick={() => onCardClick("Sources")}
          isActive={selectedCard === "Sources"}
        />
        <HintCard
          card={audienceDashboardCards["audience"]}
          positionTop={95}
          sx={{
            left: "calc(100% / 5)",
        }}
          isOpenBody={audienceDashboardHints["audience"].showBody}
          toggleClick={() => {
            if (audienceDashboardHints["pixel"].showBody) {
              changeAudienceDashboardHint("pixel", "showBody", "close")
            }
            changeAudienceDashboardHint("audience", "showBody", "toggle")
          }}
          closeClick={() => {
            changeAudienceDashboardHint("audience", "showBody", "close")
          }}
        />
      </Grid>
      <Grid item sx={{ 
        "@media (max-width: 600px)": { minWidth: 320 }, 
        pointerEvents: disabledCards.audience ? "none" : "auto", 
        opacity: disabledCards.audience ? 0.5 : 1 }} 
        xs={12} md={2.4}>
        <LookalikesCard
          value={values.lookalikes}
          onClick={() => onCardClick("Lookalikes")}
          isActive={selectedCard === "Lookalikes"}
        />
      </Grid>
      <Grid item sx={{ 
        "@media (max-width: 600px)": { minWidth: 320 }, 
        pointerEvents: disabledCards.audience ? "none" : "auto", 
        opacity: disabledCards.audience ? 0.5 : 1 }} 
        xs={12} md={2.4}>
        <SmartAudienceCard
          value={values.smart_audience}
          onClick={() => onCardClick("Smart Audience")}
          isActive={selectedCard === "Smart Audience"}
        />
      </Grid>
      <Grid item sx={{ 
          "@media (max-width: 600px)": { minWidth: 320 }, 
          pointerEvents: disabledCards.audience ? "none" : "auto", 
          opacity: disabledCards.audience ? 0.5 : 1 }} 
          xs={12} md={2.4}>
        <DataSyncCard
          value={values.data_sync}
          onClick={() => onCardClick("Data sync")}
          isActive={selectedCard === "Data sync"}
        />
      </Grid>
    </Grid>
  );
};

export default CustomCards;
