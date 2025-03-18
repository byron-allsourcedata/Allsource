import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, Button, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useEffect, useState } from "react";
import CustomizedProgressBar from "../../../../components/CustomizedProgressBar";
import { suppressionsStyles } from "@/css/suppressions";
import Image from "next/image";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import MonthDetails from './PartnersRewardsMonth';
import { width } from "@mui/system";
import dayjs from "dayjs";

interface RewardData {
  month: string;
  total_rewards: number;
  rewards_approved: number;
  rewards_paid: number;
  count_invites: number;
  payout_date: Date;
}

interface RewardProps {
  isMaster: boolean;
  partnerId: number;
  loading: boolean;
  setLoading: (state: boolean) => void;
  setRewardsOpen: (state: boolean) => void;
}

const PartnersRewards: React.FC<RewardProps> = ({ isMaster, partnerId, loading, setLoading, setRewardsOpen }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [rewards, setRewards] = useState<RewardData[]>([]);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<string>(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const yearsOptions: (string | number)[] = Array.from(
    { length: 12 },
    (_, i) => new Date().getFullYear() - i
  );

  const handleYearChange = (event: SelectChangeEvent) => {
    const selectedYear = event.target.value;
    setYear(selectedYear);
    fetchRewards(selectedYear);
  };

  const fetchRewards = async (selectedYear: string) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/partners/rewards-history", {
        params: {
          year: selectedYear,
          partner_id: partnerId,
          is_master: isMaster
        }
      });
      setRewards(response.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards(year);
  }, [year]);

  const handleViewDetails = (monthData: string) => {
    setRewardsOpen(true)
    setSelectedMonth(monthData);
    setOpen(true);
  };

  const handleBack = () => {
    setSelectedMonth(null);
    setOpen(false);
    setRewardsOpen(false)
  };

  const handlePartnerClick = (partner_id: number, partner_name: string, selected_year: string) => {
    setOpen(true)
  };

  return (
    <Box sx={{
      backgroundColor: '#fff',
      width: '100%',
      padding: 0,
      marginTop: open ? "0.5rem" : "3rem",
      display: 'flex',
      flexDirection: 'column',
      minHeight: '77vh',
      '@media (max-width: 600px)': { margin: '0rem auto 0rem' }
    }}>
      {selectedMonth ? (
        <MonthDetails
          partner_id={partnerId}
          open={open}
          selectedMonth={selectedMonth}
          selectedYear={year}
          onBack={handleBack}
          onPartnerClick={handlePartnerClick}
          isMaster={isMaster}
        />
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'end', mb: 2 }}>
            <Select
              value={year}
              onChange={handleYearChange}
              sx={{
                backgroundColor: "#fff",
                borderRadius: "4px",
                height: "48px",
                fontFamily: "Nunito Sans",
                fontSize: "14px",
                minWidth: '112px',
                fontWeight: 400,
                zIndex: 0,
                color: "rgba(17, 17, 19, 1)",
                '@media (max-width: 360px)': { width: '100%' }
              }}
              MenuProps={{
                PaperProps: { style: { maxHeight: 200, zIndex: 100 } },
              }}
              IconComponent={(props) =>
                year === "" ? (
                  <KeyboardArrowUpIcon
                    {...props}
                    sx={{ color: "rgba(32, 33, 36, 1)" }}
                  />
                ) : (

                  <KeyboardArrowDownIcon
                    {...props}
                    sx={{ color: "rgba(32, 33, 36, 1)" }}
                  />
                )
              }
            >
              {yearsOptions.map((option, index) => (
                <MenuItem
                  key={index}
                  value={option.toString()}
                  sx={{
                    fontFamily: "Nunito Sans",
                    fontWeight: 500,
                    fontSize: "14px",
                    lineHeight: "19.6px",
                    "&:hover": { backgroundColor: "rgba(80, 82, 178, 0.1)" },
                  }}
                >
                  {option}
                </MenuItem>
              ))}
            </Select>
          </Box>
          {rewards.length === 0 && !loading ? (
            <Box sx={suppressionsStyles.centerContainerStyles}>
              <Typography variant="h5" sx={{
                mb: 3,
                fontFamily: 'Nunito Sans',
                fontSize: "20px",
                color: "#4a4a4a",
                fontWeight: "600",
                lineHeight: "28px"
              }}>
                Data not matched yet!
              </Typography>
              <Image src='/no-data.svg' alt='No Data' height={250} width={300} />
              <Typography variant="body1" color="textSecondary"
                sx={{
                  mt: 3,
                  fontFamily: 'Nunito Sans',
                  fontSize: "14px",
                  color: "#808080",
                  fontWeight: "600",
                  lineHeight: "20px"
                }}>
                No Invitee joined from the referreal link.
              </Typography>
            </Box>
          ) : (
            rewards.map((data, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  backgroundColor: "#fff",
                  mb: 3,
                  '@media (max-width: 600px)': { flexDirection: 'column', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start', gap: 2 }
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', '@media (max-width: 600px)': { width: '100%' } }}>
                  <Typography className="table-heading" sx={{ fontSize: '20px !important', width: "80px", textAlign: "left", }}>{data.month}</Typography>
                  <Button
                    onClick={() => handleViewDetails(data.month)}
                    sx={{
                      display: 'none',
                      backgroundColor: '#FFF',
                      fontFamily: "Nunito Sans",
                      fontSize: '14px',
                      fontWeight: '600',
                      lineHeight: '20px',
                      letterSpacing: 'normal',
                      color: "rgba(80, 82, 178, 1)",
                      textTransform: 'none',
                      padding: 0,
                      margin: 0,
                      gap: 1,
                      '@media (max-width: 600px)': { display: 'flex' }
                    }}
                  >
                    View more <Image src={'/right-icon.svg'} width={7} height={12} alt="right-icon" />
                  </Button>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    gap: 5,
                    "@media (max-width: 600px)": {
                      flexDirection: "column",
                      justifyContent: "space-between",
                      width: "100%",
                      gap: 2,
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: 6,
                      "@media (max-width: 900px)": { gap: 3 },
                      "@media (max-width: 600px)": {
                        justifyContent: "space-between",
                        width: "100%",
                        display: "flex",
                        pr: 0.75,
                      },
                    }}
                  >
                    <Box>
                      <Typography variant="body2" className="table-heading">
                        Total Payouts
                      </Typography>
                      <Typography variant="subtitle1" className="table-data">
                        {data.total_rewards}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        className="table-heading"
                        sx={{ textAlign: "left" }}
                      >
                        Payouts paid
                      </Typography>
                      <Typography variant="subtitle1" className="table-data">
                        {data.rewards_paid}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 6,
                      "@media (max-width: 900px)": { gap: 3 },
                      "@media (max-width: 600px)": {
                        justifyContent: "space-between",
                        width: "100%",
                        display: "flex",
                        pr: 1.5,
                      },
                    }}
                  >
                    <Box>
                      <Typography variant="body2" className="table-heading">
                        No. of invites
                      </Typography>
                      <Typography variant="subtitle1" className="table-data">
                        {data.count_invites}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        className="table-heading"
                        sx={{ textAlign: "left" }}
                      >
                        Payout date
                      </Typography>
                      <Typography variant="subtitle1" className="table-data">
                        {data.payout_date ? dayjs(data.payout_date).format('MMM D, YYYY') : '--'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  onClick={() => handleViewDetails(data.month)}
                  sx={{
                    backgroundColor: '#FFF',
                    fontFamily: "Nunito Sans",
                    fontSize: '14px',
                    fontWeight: '600',
                    lineHeight: '20px',
                    letterSpacing: 'normal',
                    color: "rgba(80, 82, 178, 1)",
                    border: '1px solid rgba(80, 82, 178, 1)',
                    textTransform: 'none',
                    padding: '10px 24px',
                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                    '&:hover': {
                      backgroundColor: '#5052B2',
                      color: '#fff'
                    },
                    borderRadius: '4px',
                    '@media (max-width: 600px)': { display: 'none' }
                  }}
                >
                  View
                </Button>
              </Box>
            ))
          )}
        </>
      )}
    </Box>
  );
};

export default PartnersRewards;