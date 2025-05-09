import { Box, Typography, Stack } from "@mui/material";
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';

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
      bgcolor="#fff"
      sx={{
        width: "100%",
        borderRadius: "6px",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
        position: 'relative'
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
          <ArrowDropUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
          #{rank} Predictable field
        </Box>
      )}
      <Box
        bgcolor="#fff"
        p={2}
        sx={{
          width: "100%",
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%'
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
    </Box>
  );
};
