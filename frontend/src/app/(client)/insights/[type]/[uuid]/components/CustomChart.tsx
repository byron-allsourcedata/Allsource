import { Box, Typography, Stack } from "@mui/material";
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';

interface IconFillIndicatorProps {
  imageSrc: string;
  title: string;
  percentage: number;
  labels: [string, string];
  totalIcons?: number;
  iconSize?: number;
  rank?: number;
  color?: string;
  backgroundColor?: string;
}

export const IconFillIndicator = ({
  imageSrc,
  title,
  percentage,
  labels,
  totalIcons = 4,
  iconSize = 96,
  rank,
  color = "rgba(98, 178, 253, 1)",
  backgroundColor = "rgba(193, 228, 255, 1)"
}: IconFillIndicatorProps) => {

  const fullIcons = Math.floor((percentage / 100) * totalIcons);
  const partialIconPercentage =
    ((percentage / 100) * totalIcons - fullIcons) * 100;

  return (
    <Box
      bgcolor="#fff"
      sx={{
        width: "100%",
        borderRadius: "6px",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
        position: 'relative',
        flexGrow: 1,
        ...(rank !== undefined && {
          overflow: 'hidden',
          '&::before, &::after': {
            content: '""',
            position: 'absolute',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
          },
          '&::before': {
            top: 0,
            right: 0,
            height: '1px',
            width: '100%',
            backgroundImage:
              'linear-gradient(to left, rgba(30,136,229,1) 0%, rgba(30,136,229,0) 100%)',
          },
          '&::after': {
            top: 0,
            right: 0,
            width: '1px',
            height: '100%',
            backgroundImage:
              'linear-gradient(to bottom, rgba(30,136,229,1) 0%, rgba(30,136,229,0) 100%)',
          },
        }),
      }}
    >
      {rank !== undefined && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'rgba(30, 136, 229, 1)',
            color: 'white',
            borderTopRightRadius: '4px',
            borderBottomLeftRadius: '4px',
            px: 1.5,
            py: 0.5,
            fontFamily: 'Roboto',
            fontSize: 12,
            fontWeight: 500,
            maxWidth: '100%',
            whiteSpace: 'nowrap',
          }}
        >
          <ArrowDropUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
          #{rank} Predictable field
        </Box>
      )}
      <Box
        bgcolor="#fff"
        p={2}
        sx={{
          width: "100%",
          display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between'
        }}>

        <Box
          sx={{
            width: '100%',
            justifyContent: 'space-between',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography className="dashboard-card-heading" >
            {title}
          </Typography>
        </Box>


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
                  backgroundColor: backgroundColor,
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
                      backgroundColor: color,
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

        <Stack direction="row" spacing={3} alignItems="center" sx={{ pb: 1 }}>
          <ColorLegend
            color={color}
            label={`${labels[0]} ${percentage}%`}
          />
          <ColorLegend
            color={backgroundColor}
            label={`${labels[1]} ${100 - percentage}%`}
          />
        </Stack>
      </Box>
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
