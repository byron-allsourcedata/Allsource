import { Box, Typography, Stack } from "@mui/material";

interface MapRegionData {
  label: string;
  percentage: number;
  fillColor: string;
}

interface MapIndicatorProps {
  title: string;
  mapImage: string; // путь к карте
  regions: MapRegionData[];
}

export const MapIndicator = ({
  title,
  mapImage,
  regions,
}: MapIndicatorProps) => {
  return (
    <Box
      p={2}
      borderRadius={2}
      boxShadow={1}
      sx={{
        backgroundColor: "#fff",
        borderRadius: "6px",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Typography className="dashboard-card-heading" mb={2}>
        {title}
      </Typography>

      <Box
        sx={{
          width: "100%",
          borderRadius: "8px",
          overflow: "hidden",
          alignItems: "center",
          display: "flex",
          justifyContent: "center",

          mb: 2,
        }}
      >
        <img
          src={mapImage}
          alt="US Map"
          style={{ width: "406px", height: "263px" }}
        />
      </Box>

      <Box>
        {regions.map((region, index) => (
          <Stack
            key={index}
            direction="row"
            sx={{ alignItems: "center", gap: 2, pb: 1 }}
          >
            <Box
              width={12}
              height={12}
              borderRadius="50%"
              sx={{ backgroundColor: region.fillColor }}
            />
            <Typography
              className="dashboard-card-text"
              sx={{ fontWeight: 500 }}
            >
              {region.percentage}%
            </Typography>
            <Typography className="dashboard-card-text">
              {region.label}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Box>
  );
};
