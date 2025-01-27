import { Box, Typography, Button } from "@mui/material";
import { useEffect, useState } from "react";
import { suppressionsStyles } from "@/css/suppressions";
import Image from "next/image";
import MonthDetails from '@/components/PartnersRewardsMonth';
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
    flagMounthReward: boolean;
    selectedMonth: string | null;
    setSelectedMonth: (state: string | null) => void;
    setFlagMounthReward: (state: boolean) => void;
    id: number;
    loading: boolean;
    setLoading: (state: boolean) => void;
    setRewardsPageMonthFilter: (month: string) => void;
    rewards: RewardData[]
}

const RewardsHistory: React.FC<RewardProps> = ({ id, loading, isMaster, selectedMonth, setSelectedMonth, flagMounthReward, setFlagMounthReward, setLoading, setRewardsPageMonthFilter, rewards: rewardsPerMonth }) => {
    const [open, setOpen] = useState<boolean>(false);
    const [rewards, setRewards] = useState<RewardData[]>([]);
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState<string>(currentYear.toString());

    useEffect(() => {
        setRewards(rewardsPerMonth);
    }, [rewardsPerMonth]);


    const handleViewDetails = (monthData: string) => {
        setFlagMounthReward(true)
        setSelectedMonth(monthData);
        setOpen(true);
    };

    const handlePartnerClick = (partner_id: number, partner_name: string, selected_year: string) => {
        setOpen(true)
      };

    return (
        <Box sx={{
            backgroundColor: '#fff',
            width: '100%',
            padding: 0,
            marginTop: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '77vh',
            '@media (max-width: 600px)': { margin: '0rem auto 0rem' }
        }}>
            {selectedMonth ? (
                <MonthDetails
                    partner_id={id}
                    open={open}
                    selectedMonth={selectedMonth}
                    selectedYear={year}
                    onPartnerClick={handlePartnerClick}
                    isMaster={isMaster}
                    flagMounthReward={flagMounthReward}
              />
            ) : (
                <>
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
                                There was not a single payment of rewards.
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
                                    '@media (max-width: 600px)': { flexDirection: 'column', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start', gap:2 }
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
                          {dayjs(data.payout_date).format('MMM D, YYYY')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                                <Button
                                    variant="contained"
                                    onClick={
                                        () => {
                                            handleViewDetails(data.month)
                                            setRewardsPageMonthFilter(data.month)
                                        }
                                    }
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

export default RewardsHistory;