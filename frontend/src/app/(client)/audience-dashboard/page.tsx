"use client";
import React, { useState, useEffect, Suspense, useRef } from "react";
import { Box, Button, Grid, Skeleton, Tab, Tabs, Typography } from '@mui/material';
import { dashboardStyles } from '../dashboard/dashboardStyles';
import CustomTooltip from '@/components/customToolTip';
import { DateRangeIcon } from '@mui/x-date-pickers';
import CalendarPopup from '@/components/CustomCalendar';
import { useNotification } from '../../../context/NotificationContext';
import dayjs from "dayjs";
import Image from "next/image";
import CustomCards from "./components/CustomCards";
import ExampleChart from "./components/ExampleChart";

const mockData = [
  { pixel_contacts: 120, sources: 300, lookalikes: 150, smart_audience: 50, data_sync: 20 },
  { pixel_contacts: 100, sources: 280, lookalikes: 140, smart_audience: 45, data_sync: 25 },
  { pixel_contacts: 130, sources: 320, lookalikes: 160, smart_audience: 55, data_sync: 30 },
  { pixel_contacts: 140, sources: 340, lookalikes: 170, smart_audience: 60, data_sync: 35 },
  { pixel_contacts: 150, sources: 360, lookalikes: 180, smart_audience: 65, data_sync: 40 },
  { pixel_contacts: 160, sources: 380, lookalikes: 190, smart_audience: 70, data_sync: 45 },
  { pixel_contacts: 170, sources: 400, lookalikes: 200, smart_audience: 75, data_sync: 50 },
  { pixel_contacts: 180, sources: 420, lookalikes: 210, smart_audience: 80, data_sync: 55 },
  { pixel_contacts: 190, sources: 440, lookalikes: 220, smart_audience: 85, data_sync: 60 },
  { pixel_contacts: 200, sources: 460, lookalikes: 230, smart_audience: 90, data_sync: 65 },
  { pixel_contacts: 210, sources: 480, lookalikes: 240, smart_audience: 95, data_sync: 70 },
  { pixel_contacts: 220, sources: 500, lookalikes: 250, smart_audience: 100, data_sync: 75 },
];


const AudienceDashboard: React.FC = () => {
  const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(null);
  const isCalendarOpen = Boolean(calendarAnchorEl);
  const [values, setValues] = useState({
    totalRevenue: 0,
    totalVisitors: 0,
    viewProducts: 0,
    totalAbandonedCart: 0,
  });
  const { hasNotification } = useNotification();
  const [formattedDates, setFormattedDates] = useState<string>('');
  const [selectedDateLabel, setSelectedDateLabel] = useState<string>('');
  const [appliedDates, setAppliedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const handleCalendarClose = () => {
    setCalendarAnchorEl(null);
  };
  const handleDateChange = (dates: { start: Date | null; end: Date | null }) => {
    const { start, end } = dates;
    if (start && end) {
      const formattedStart = dayjs(start).format('MMM D');
      const formattedEnd = dayjs(end).format('MMM D, YYYY');

      setFormattedDates(`${formattedStart} - ${formattedEnd}`);
    } else if (start) {
      const formattedStart = dayjs(start).format('MMM D, YYYY');
      setFormattedDates(formattedStart);
    } else if (end) {
      const formattedEnd = dayjs(end).format('MMM D, YYYY');
      setFormattedDates(formattedEnd);
    } else {
      setFormattedDates('');
    }
  };
  const handleDateLabelChange = (label: string) => {
    setSelectedDateLabel(label);
  };
  const handleApply = (dates: { start: Date | null; end: Date | null }) => {
    if (dates.start && dates.end) {

      setAppliedDates(dates);
      setCalendarAnchorEl(null);


      handleCalendarClose();
    }
    else {
      setAppliedDates({ start: null, end: null })
    }
  };
  const handleCalendarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCalendarAnchorEl(event.currentTarget);
  };
  return (
    <Box>
      <Grid
        sx={{
          display: "flex",
          flexDirection: "column",
          '@media (max-width: 600px)': {
            paddingRight: 0
          }
        }}
      >
        <Box sx={{
          display: 'flex', flexDirection: 'row', alignItems: 'center', position: 'sticky', top: 0, pt: '12px', pb: '12px', pl: '8px', pr: '1.5rem', zIndex: 1, backgroundColor: '#fff', justifyContent: 'space-between', width: '100%', "@media (max-width: 600px)": { flexDirection: 'column', display: 'flex', alignItems: 'flex-start', zIndex: 1, width: '100%', pr: 1.5 }, "@media (max-width: 440px)": { flexDirection: 'column', pt: hasNotification ? '3rem' : '0.75rem', top: hasNotification ? '4.5rem' : '', zIndex: 1, justifyContent: 'flex-start' }, "@media (max-width: 400px)": { pt: hasNotification ? '4.25rem' : '', pb: '6px', }
        }}>
          <Typography
            variant="h4"
            component="h1"
            className="first-sub-title"
            sx={{
              ...dashboardStyles.title, '@media (max-width: 600px)': {
                display: 'none',
              },
            }}
          >
            Dashboard <CustomTooltip title={"Indicates the count of resolved identities and revenue figures for the specified time"} linkText="Learn More" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/dashboard" />
          </Typography>
          <Box sx={{
            display: 'none', width: '100%', justifyContent: 'space-between', alignItems: 'start', '@media (max-width: 600px)': {
              display: 'flex'
            }
          }}>
            <Typography
              variant="h4"
              component="h1"
              className="first-sub-title"
              sx={dashboardStyles.title}
            >
              Dashboard
            </Typography>

            <Box sx={{
              display: 'none', justifyContent: 'flex-end', alignItems: 'start', pt: 0.5, gap: 1, '@media (max-width: 600px)': {
                display: 'flex',
              }
            }}>
              {/* Calendary picker*/}
              <Typography className="second-sub-title">{selectedDateLabel}</Typography>
              <Button
                aria-controls={isCalendarOpen ? 'calendar-popup' : undefined}
                aria-haspopup="true"
                aria-expanded={isCalendarOpen ? 'true' : undefined}
                onClick={handleCalendarClick}
                sx={{
                  textTransform: 'none',
                  color: 'rgba(128, 128, 128, 1)',
                  border: '1px solid rgba(184, 184, 184, 1)',
                  borderRadius: '4px',
                  padding: '8px',
                  minWidth: 'auto',
                }}
              >
                <DateRangeIcon fontSize='small' />
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 2,
              '@media (max-width: 600px)': {
                display: 'none',
              }
            }}
          >
            {/* Calendary picker*/}
            <Typography className="second-sub-title">{selectedDateLabel ? selectedDateLabel : ''}</Typography>
            <Button
              aria-controls={isCalendarOpen ? 'calendar-popup' : undefined}
              aria-haspopup="true"
              aria-expanded={isCalendarOpen ? 'true' : undefined}
              onClick={handleCalendarClick}
              sx={{
                textTransform: 'none',
                color: formattedDates ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)',
                border: formattedDates ? '1.5px solid rgba(80, 82, 178, 1)' : '1.5px solid rgba(184, 184, 184, 1)',
                borderRadius: '4px',
                padding: '8px',
                minWidth: 'auto',
                '@media (max-width: 900px)': {
                  border: 'none',
                  padding: 0
                },
                '&:hover': {
                  border: '1.5px solid rgba(80, 82, 178, 1)',
                  '& .MuiSvgIcon-root': {
                    color: 'rgba(80, 82, 178, 1)'
                  }
                }
              }}
            >
              <DateRangeIcon
                fontSize="medium"
                sx={{ color: formattedDates ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)' }}
              />
              <Typography variant="body1" sx={{
                fontFamily: 'Roboto',
                fontSize: '14px',
                fontWeight: '400',
                color: 'rgba(32, 33, 36, 1)',
                lineHeight: '19.6px',
                textAlign: 'left',
                whiteSpace: 'nowrap',

              }}>
                {formattedDates}
              </Typography>
              {formattedDates &&
                <Box sx={{ pl: 2, display: 'flex', alignItems: 'center' }}>
                  <Image src="/arrow_down.svg" alt="arrow down" width={16} height={16} />
                </Box>
              }
            </Button>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto', flexGrow: 1,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', pr: 2 }}>
            <Box sx={{ width: '100%', mt: 1, mb: 1, '@media (max-width: 900px)': { mt: 0, mb: 0, } }}>
              <CustomCards
                values={{
                  pixelContacts: 1054,
                  sources: 100,
                  lookalikes: 80,
                  smartAudience: 25,
                  dataSync: 25,
                }}
              />
            </Box>
            <ExampleChart data={mockData}>

            </ExampleChart>
          </Box>

        </Box>

        <CalendarPopup
          anchorEl={calendarAnchorEl}
          open={isCalendarOpen}
          onClose={handleCalendarClose}
          onDateChange={handleDateChange}
          onDateLabelChange={handleDateLabelChange}
          onApply={handleApply}
        />

      </Grid>
    </Box>
  );
};

export default AudienceDashboard;