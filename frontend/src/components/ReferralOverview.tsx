import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, TextField, Button, FormControl, InputLabel, MenuItem, Select, IconButton, InputAdornment, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import CustomizedProgressBar from "./CustomizedProgressBar";
import CustomTooltip from "./customToolTip";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import Image from "next/image";
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

interface FAQItem {
    question: string;
    answer: string;
}

const faqItems: FAQItem[] = [
    { question: 'What is Material-UI?', answer: 'Material-UI is a popular React UI framework.' },
    { question: 'How to install Material-UI?', answer: 'You can install it using npm or yarn.' },
    { question: 'What is React?', answer: 'React is a JavaScript library for building user interfaces.' },
    { question: 'What is TypeScript?', answer: 'TypeScript is a typed superset of JavaScript.' },
];


const ReferralOverview: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState<number | false>(false);

    const handleOpenSection = (panel: number) => (
        event: React.SyntheticEvent,
        isExpanded: boolean
    ) => {
        setExpanded(isExpanded ? panel : false);
    };

    const fetchRules = useCallback(async () => {
        setLoading(true);
        try {
            // const response = await axiosInstance
        } catch (err) {
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    const [referralLink, setReferralLink] = useState('1233213213tttttt');

    const handleCopyClick = () => {
        navigator.clipboard.writeText(referralLink).then(() => {
            alert('Referral link copied!');
        }).catch(err => {
        });
    };


    return (
        <>
            {loading &&
                <CustomizedProgressBar />
            }
            <Box sx={{
                backgroundColor: '#fff',
                width: '100%',
                padding: 0,
                margin: '3rem auto 0rem',
                '@media (max-width: 600px)': {margin: '0rem auto 0rem'} 
            }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', gap: 1, '@media (max-width: 600px)': { flexDirection: 'column' } }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', border: '1px solid rgba(235, 235, 235, 1)', justifyContent: 'center', alignItems: 'center', borderRadius: '4px', pt: 2, pb: 2, gap: 2.5, }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', gap: 1 }}>
                                <Image src={'/stripe-image.svg'} width={97} height={97} alt="stripe-icon" />
                                <Typography className="second-sub-title">
                                    Start by connecting your stripe account
                                </Typography>
                            </Box>

                            <Button variant="outlined" sx={{
                                display: 'flex', width: '100%', textWrap: 'nowrap',
                                backgroundColor: '#fff', color: 'rgba(80, 82, 178, 1)', fontFamily: "Nunito Sans", textTransform: 'none', lineHeight: '22.4px',
                                fontWeight: '600', padding: '0.75em 5em', marginRight: '16px', border: '1px solid rgba(80, 82, 178, 1)', maxWidth: '109px', '&:hover': {
                                    backgroundColor: '#fff', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)', '&.Mui-disabled': {
                                        backgroundColor: 'rgba(80, 82, 178, 0.6)',
                                        color: 'rgba(80, 82, 178, 1)',
                                        cursor: 'not-allowed',
                                    }
                                }
                            }}>
                                Connect to stripe
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', border: '1px solid rgba(235, 235, 235, 1)', justifyContent: 'start', borderRadius: '4px', padding: '1rem 1.5rem', gap: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'start', alignItems: 'center', width: '100%' }}>
                                <Typography className="second-sub-title">
                                    Referral Details
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'center', width: '100%', gap: 3 }}>
                                <FormControl
                                    sx={{
                                        width: '100%',
                                    }}
                                >
                                    <InputLabel
                                        sx={{
                                            fontFamily: 'Roboto',
                                            fontSize: '14px',
                                            color: 'rgba(74, 74, 74, 1)',  // Цвет текста
                                        }}
                                    >
                                        Discount Code
                                    </InputLabel>
                                    <Select
                                        // value={days}
                                        // onChange={handleDaysChange}
                                        label="Select"
                                        sx={{
                                            backgroundColor: '#fff',
                                            borderRadius: '4px',
                                            height: '48px',
                                            fontFamily: 'Nunito Sans',
                                            fontSize: '1.75rem',
                                            fontWeight: 400,
                                            zIndex: 0,
                                            color: 'rgba(17, 17, 19, 1)',
                                            "& .MuiOutlinedInput-root": {
                                                "& fieldset": {
                                                    borderColor: 'rgba(208, 213, 221, 1)', // обычная рамка
                                                },
                                            }
                                        }}
                                        MenuProps={{
                                            PaperProps: { style: { maxHeight: 200, zIndex: 100 } }
                                        }}
                                    // IconComponent={(props) => (
                                    //     days === '' ?
                                    //         <KeyboardArrowDownIcon {...props} sx={{ color: 'rgba(74, 74, 74, 1)' }} /> :
                                    //         <KeyboardArrowUpIcon {...props} sx={{ color: 'rgba(74, 74, 74, 1)' }} />
                                    // )}
                                    >
                                        {/* {daysOptions.map((option, index) => (
                                            <MenuItem
                                                key={index}
                                                value={typeof option === 'number' ? option.toString() : option}
                                                sx={{
                                                    fontFamily: 'Nunito Sans',
                                                    fontWeight: 500,
                                                    fontSize: '14px',
                                                    lineHeight: '19.6px',
                                                    '&:hover': { backgroundColor: 'rgba(80, 82, 178, 0.1)' },
                                                }}
                                            >
                                                {typeof option === 'number' ? `${option} days` : 'Eternal'}
                                            </MenuItem>
                                        ))} */}
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Referral Link"
                                    variant="outlined"
                                    type="text"
                                    rows={2}
                                    disabled={!referralLink}
                                    value={referralLink}
                                    InputProps={{
                                        style: { color: 'rgba(17, 17, 19, 1)', fontFamily: 'Nunito Sans', fontWeight: 400, fontSize: '14px' },
                                        endAdornment: (
                                            (referralLink && (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={handleCopyClick} edge="end" >
                                                        <ContentCopyIcon fontSize="small" />
                                                    </IconButton>
                                                </InputAdornment>
                                            ))

                                        )
                                    }}
                                    InputLabelProps={{ style: { color: 'rgba(17, 17, 19, 0.6)', fontFamily: 'Nunito Sans', fontWeight: 400, fontSize: '14px', padding: 0 } }}
                                    sx={{
                                        marginBottom: '32px',
                                        backgroundColor: '#fff',
                                        borderRadius: '4px',
                                        width: '100%',
                                        "& .MuiOutlinedInput-root": {
                                            "& fieldset": {
                                                borderColor: 'rgba(208, 213, 221, 1)',
                                            },
                                            "&:hover fieldset": {
                                                borderColor: 'rgba(208, 213, 221, 1)', // цвет рамки при наведении
                                            },
                                            "&.Mui-focused fieldset": {
                                                borderColor: 'rgba(208, 213, 221, 1)',
                                            },
                                        },
                                        "@media (max-width: 900px)": { width: '100%', height: '48px' },
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', backgroundColor: 'rgba(255, 247, 247, 1)', borderRadius: '4px', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', gap: 2, alignItems: 'center', '@media (max-width: 600px)': { flexDirection: 'column', gap: 3 }}}>
                            <Box sx={{display: 'flex', flexDirection: 'row', width: '100%', gap:2, alignItems: 'center'}}>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(248, 70, 75, 0.2)',
                                    borderRadius: '4px',
                                    width: '49px',
                                    height: '52px',
                                    padding: '3px 12px'
                                }}>
                                    <Image src={'/partner-icon.svg'} alt={'hands-icon'} width={42} height={28} />
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1 }}>
                                    <Typography className="second-sub-title">
                                        Become a official partner
                                    </Typography>
                                    <Typography className="paragraph">
                                        Unlock exclusive rewards and benefits by partnering with us—schedule a call with our sales executive today to get started!
                                    </Typography>
                                </Box>
                            </Box>

                            <Button variant="outlined" sx={{
                                textWrap: 'nowrap',
                                backgroundColor: '#fff', color: 'rgba(80, 82, 178, 1)', fontFamily: "Nunito Sans", textTransform: 'none', lineHeight: '22.4px',
                                fontWeight: '600', padding: '0.75em 3em', marginRight: '16px', border: '1px solid rgba(80, 82, 178, 1)', maxWidth: '109px', '&:hover': {
                                    backgroundColor: '#fff', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)', '&.Mui-disabled': {
                                        backgroundColor: 'rgba(80, 82, 178, 0.6)',
                                        color: 'rgba(80, 82, 178, 1)',
                                        cursor: 'not-allowed',
                                    }
                                }
                            }}>
                                Talk to us
                            </Button>
                        </Box>

                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', gap: 1, '@media (max-width: 1200px)': { flexDirection: 'column' } }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', border: '1px solid rgba(235, 235, 235, 1)', justifyContent: 'center', alignItems: 'start', borderRadius: '4px', padding: '1rem 1.5rem', gap: 2, maxHeight: '245px', '@media (max-width: 900px)': {display: 'none'}, }}>
                            <Typography className="second-sub-title">
                                How it works
                            </Typography>
                            <Image src={'/how-works.svg'} width={659} height={140} alt="stripe-icon" />
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', border: '1px solid rgba(235, 235, 235, 1)', justifyContent: 'start', borderRadius: '4px', padding: '1rem 1.5rem', gap: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'start', alignItems: 'center', width: '100%' }}>
                                <Typography className="second-sub-title">
                                    Frequently asked questions
                                </Typography>
                            </Box>

                            <Box>
                                {faqItems.map((item, index) => (
                                    <Accordion
                                        key={index}
                                        expanded={expanded === index}
                                        onChange={handleOpenSection(index)}
                                        sx={{
                                            borderRadius: '8px',
                                            borderBottom: '1px solid rgba(228, 228, 228, 1)',
                                            boxShadow: 'none',
                                            mb: 0,
                                            "&:before": { display: "none", borderBottom: 'none', },
                                        }}
                                    >
                                        <AccordionSummary
                                            expandIcon={
                                                expanded === index ? (
                                                    <RemoveCircleOutlineIcon sx={{ color: 'black' }} fontSize="small" />
                                                ) : (
                                                    <AddIcon sx={{ color: 'black' }} fontSize="small" />
                                                )
                                            }
                                            sx={{ display: 'flex', alignItems: 'center', padding: 0, margin: 0, minHeight: 0, cursor: 'pointer', }}
                                        >
                                            <Typography className="second-sub-title" sx={{ fontWeight: '400 !important', }}>
                                                {item.question}
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ margin: 0, paddingTop: 0 }}>
                                            <Typography className="table-data">
                                                {item.answer}
                                            </Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </Box>
                        </Box>
                    </Box>

                </Box>

            </Box>
        </>

    );
};

export default ReferralOverview;