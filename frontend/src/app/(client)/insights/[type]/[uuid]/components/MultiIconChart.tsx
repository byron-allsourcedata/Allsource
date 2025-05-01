import { Box, Typography, Stack } from "@mui/material";

interface IconData {
  imageSrc: string;
  label: string;
  percentage: number;
  fillColor: string;
  bgColor: string;
}

interface MultiIconFillIndicatorProps {
  title: string;
  items: IconData[];
  iconSize?: number;
  rank?: number;
}

export const MultiIconFillIndicator = ({
  title,
  items,
  iconSize = 100,
  rank
}: MultiIconFillIndicatorProps) => {
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
      <Box sx={{
        width: "100%",
        justifyContent: 'space-between',
        display: 'flex',
        flexDirection: 'row',
        mb: 2
      }}>
        <Typography className="dashboard-card-heading" >
          {title}
        </Typography>
        {rank !== undefined && (
          <Typography
            component="span"
            sx={{
              fontSize: 12,
              ml: 1,
              color: "#888",
              verticalAlign: "middle",
            }}
          >
            #{rank}
          </Typography>
        )}
      </Box>

      <Box display="flex" gap={4} alignItems="flex-end">
        {items.map(
          ({ imageSrc, label, percentage, fillColor, bgColor }, index) => {
            return (
              <Stack key={index} alignItems="center" spacing={1}>
                <Box
                  position="relative"
                  width={iconSize}
                  height={iconSize}
                  sx={{
                    WebkitMaskImage: `url(${imageSrc})`,
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskImage: `url(${imageSrc})`,
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                    backgroundColor: bgColor,
                  }}
                >
                  {percentage > 0 && (
                    <Box
                      position="absolute"
                      bottom={0}
                      left={0}
                      width="100%"
                      height={`${percentage}%`}
                      sx={{
                        backgroundColor: fillColor,
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
              </Stack>
            );
          }
        )}
      </Box>
      <Box>
        {items.map((item, index) => (
          <Stack
            key={index}
            direction="row"
            sx={{ alignItems: "center", gap: 2, pb: 2 }}
          >
            <Stack sx={{ gap: 1, flexGrow: 1 }}>
              <Stack
                direction="row"
                sx={{ justifyContent: "start", alignItems: "center", gap: 0.5 }}
              >
                <Box
                  width={10}
                  height={10}
                  borderRadius="50%"
                  sx={{ backgroundColor: item.fillColor }}
                />
                <Typography className="dashboard-card-text">
                  {item.percentage}%
                </Typography>
                <Typography className="dashboard-card-text">
                  {item.label}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        ))}
      </Box>
    </Box>
  );
};
