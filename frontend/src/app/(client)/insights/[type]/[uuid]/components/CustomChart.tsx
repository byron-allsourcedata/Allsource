import { Box, Typography, Stack } from "@mui/material";

interface IconFillIndicatorProps {
  imageSrc: string;
  title: string;
  percentage: number;
  labels: [string, string];
  totalIcons?: number;
  iconSize?: number;
}

export const IconFillIndicator = ({
  imageSrc,
  title,
  percentage,
  labels,
  totalIcons = 4,
  iconSize = 96,
}: IconFillIndicatorProps) => {
  const fullIcons = Math.floor((percentage / 100) * totalIcons);
  const partialIconPercentage =
    ((percentage / 100) * totalIcons - fullIcons) * 100;

  return (
    <Box
      p={2}
      sx={{
        backgroundColor: "#fff",
        width: "100%",
        borderRadius: "6px",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Typography className="dashboard-card-heading" mb={2}>
        {title}
      </Typography>

      <Box
        display="flex"
        gap={3}
        padding={2}
        mb={1}
        alignItems="center"
        sx={{ width: "100%" }}
      >
        {[...Array(totalIcons)].map((_, index) => {
          const isFullyColored = index < fullIcons;
          const isPartiallyColored =
            index === fullIcons && partialIconPercentage > 0;

          return (
            <Box
              key={index}
              position="relative"
              width={iconSize}
              height={iconSize}
              sx={{
                mb: 1,
                WebkitMaskImage: `url(${imageSrc})`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: `url(${imageSrc})`,
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
                backgroundColor: "rgba(193, 228, 255, 1)",
              }}
            >
              {(isFullyColored || isPartiallyColored) && (
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  height="100%"
                  width={
                    isFullyColored
                      ? "100%"
                      : `${partialIconPercentage.toFixed(2)}%`
                  }
                  sx={{
                    backgroundColor: "rgba(98, 178, 253, 1)",
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      <Stack direction="row" spacing={3} alignItems="center">
        <ColorLegend
          color="rgba(98, 178, 253, 1)"
          label={`${labels[0]} ${percentage}%`}
        />
        <ColorLegend
          color="rgba(193, 228, 255, 1)"
          label={`${labels[1]} ${100 - percentage}%`}
        />
      </Stack>
    </Box>
  );
};

interface ColorLegendProps {
  color: string;
  label: string;
}

const ColorLegend = ({ color, label }: ColorLegendProps) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Box
      width={10}
      height={10}
      borderRadius="50%"
      sx={{ backgroundColor: color }}
    />
    <Typography variant="body2">{label}</Typography>
  </Stack>
);
