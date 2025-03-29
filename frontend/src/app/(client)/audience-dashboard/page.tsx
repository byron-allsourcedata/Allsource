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
  { total_contact_collected: 120, total_visitors: 300, view_products: 150, abandoned_cart: 50, converted_sale: 20 },
  { total_contact_collected: 100, total_visitors: 280, view_products: 140, abandoned_cart: 45, converted_sale: 25 },
  { total_contact_collected: 130, total_visitors: 320, view_products: 160, abandoned_cart: 55, converted_sale: 30 },
  { total_contact_collected: 140, total_visitors: 340, view_products: 170, abandoned_cart: 60, converted_sale: 35 },
  { total_contact_collected: 150, total_visitors: 360, view_products: 180, abandoned_cart: 65, converted_sale: 40 },
  { total_contact_collected: 160, total_visitors: 380, view_products: 190, abandoned_cart: 70, converted_sale: 45 },
  { total_contact_collected: 170, total_visitors: 400, view_products: 200, abandoned_cart: 75, converted_sale: 50 },
  { total_contact_collected: 180, total_visitors: 420, view_products: 210, abandoned_cart: 80, converted_sale: 55 },
  { total_contact_collected: 190, total_visitors: 440, view_products: 220, abandoned_cart: 85, converted_sale: 60 },
  { total_contact_collected: 200, total_visitors: 460, view_products: 230, abandoned_cart: 90, converted_sale: 65 },
  { total_contact_collected: 210, total_visitors: 480, view_products: 240, abandoned_cart: 95, converted_sale: 70 },
  { total_contact_collected: 220, total_visitors: 500, view_products: 250, abandoned_cart: 100, converted_sale: 75 },
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
          '@media (max-width: 600px)':{
            paddingRight: 0
          }
        }}
      >
        <Box sx={{
          display: 'flex', flexDirection: 'row', alignItems: 'center', position: 'sticky', top: 0, pt: '12px', pb: '12px', pl:'8px', pr:'1.5rem', zIndex: 1, backgroundColor: '#fff', justifyContent: 'space-between', width: '100%', "@media (max-width: 600px)": { flexDirection: 'column', display: 'flex', alignItems: 'flex-start', zIndex: 1, width: '100%', pr:1.5 }, "@media (max-width: 440px)": { flexDirection: 'column', pt: hasNotification ? '3rem' : '0.75rem', top: hasNotification ? '4.5rem' : '', zIndex: 1, justifyContent: 'flex-start' }, "@media (max-width: 400px)": { pt: hasNotification ? '4.25rem' : '', pb: '6px', }
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
            

            {/* {typeBusiness == 'd2c' && (
              <Box sx={{
                flexGrow: 1, display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'start', '@media (max-width: 600px)': {
                  width: '100%',
                  mt: hasNotification ? 1 : 2
                }
              }}>
                <Tabs
                  value={tabIndex}
                  onChange={handleTabChange}
                  sx={{
                    textTransform: 'none',
                    minHeight: 0,
                    alignItems: 'start',
                    '& .MuiTabs-indicator': {
                      backgroundColor: 'rgba(80, 82, 178, 1)',
                      height: '1.4px',
                    },
                    "@media (max-width: 600px)": {
                      border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '4px', width: '100%', '& .MuiTabs-indicator': {
                        height: '0',
                      },
                    }
                  }}
                  aria-label="dashboard tabs"
                >
                  <Tab className="main-text"
                    sx={{
                      textTransform: 'none',
                      padding: '4px 10px',
                      flexGrow: 1,
                      marginRight: '3em',
                      minHeight: 'auto',
                      minWidth: 'auto',
                      fontSize: '14px',
                      fontWeight: 700,
                      lineHeight: '19.1px',
                      textAlign: 'left',
                      mr: 2,
                      '&.Mui-selected': {
                        color: 'rgba(80, 82, 178, 1)'
                      },
                      "@media (max-width: 600px)": {
                        mr: 0, borderRadius: '4px', '&.Mui-selected': {
                          backgroundColor: 'rgba(249, 249, 253, 1)',
                          border: '1px solid rgba(220, 220, 239, 1)'
                        },
                      }
                    }}
                    label="Revenue"
                  />
                  <Tab className="main-text"
                    sx={{
                      textTransform: 'none',
                      padding: '4px 10px',
                      minHeight: 'auto',
                      flexGrow: 1,
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: 700,
                      lineHeight: '19.1px',
                      minWidth: 'auto',
                      '&.Mui-selected': {
                        color: 'rgba(80, 82, 178, 1)'
                      },
                      "@media (max-width: 600px)": {
                        mr: 0, borderRadius: '4px', '&.Mui-selected': {
                          backgroundColor: 'rgba(249, 249, 253, 1)',
                          border: '1px solid rgba(220, 220, 239, 1)'
                        },
                      }
                    }}
                    label="Contacts"
                  />
                </Tabs>
              </Box>
            )} */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 2,
                // width: typeBusiness == 'd2c' ? '' : '100%',
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
              
            {/* <TabPanel value={tabIndex} index={0}>
              <DashboardRevenue appliedDates={appliedDates} />
            </TabPanel>
            <TabPanel value={tabIndex} index={1}>
              {typeBusiness === 'd2c' ? (
                <DashboardContactD2C appliedDates={appliedDates} typeBusiness={typeBusiness} />
              ) : (
                <DashboardContactB2B appliedDates={appliedDates} typeBusiness={typeBusiness} />
              )}
            </TabPanel> */}
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