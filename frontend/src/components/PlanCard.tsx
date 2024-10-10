import React from 'react';
import { Box, Typography, Button, Divider } from '@mui/material';
import Image from 'next/image';
import CustomTooltip from './customToolTip';

const PlanCard: React.FC<{ plan: any; onChoose: (stripePriceId: string) => void }> = ({ plan, onChoose }) => {
    return (
        <Box sx={{ padding: 3, border: '1px solid #e4e4e4', borderRadius: '4px', boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.25)',
            height: '100vh',
            minHeight: '809px',
            transition: '.5s ease-in-out',
            position: 'relative',
            '&:hover': {
                border: '3px solid #f8464b',
                background: '#FFF7F7',
                boxShadow: '0px 1px 4px 2px rgba(248, 70, 75, 0.25)',
                transform: 'translateY(-32px)',
                '@media (max-width: 900px)': {
                    transform: 'none'
                }
            },
            '&:hover .hyperlink-red': {
                background: '#F8464B',
                border: '1px solid #F8464B',
                color: '#fff !important'
            },
            '&:hover .first-sub-title': {
                background: '#fff'
            }
         }}>
            <Box sx={{ display: 'flex', justifyContent:'space-between'}}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <Typography variant="h6" component="span" className='first-sub-title' sx={{
                        background: '#ededf7',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        lineHeight: '22px !important'
                    }}>
                        {plan.title}  
                    </Typography>
                    {plan.is_crown && (
                                        
                        <Image 
                            src={'/crown.svg'} 
                            alt='crown' 
                            width={39} 
                            height={28} 
                        />
                    )}
                </Box>
                {plan.is_active && (
                <Box sx={{ display: 'flex', borderRadius: '4px', background: '#eaf8dd', padding: '2px 12px', gap: '3px', height: 'fit-content' }}>
                    <Typography className="main-text" sx={{
                        borderRadius: '4px',
                        color: '#2b5b00',
                        fontSize: '12px',
                        fontWeight: '600',
                        lineHeight: '16px'
                    }}>Active</Typography>
                    <Image
                        src='/tick-circle-filled.svg'
                        alt='tick-circle-filled'
                        height={16}
                        width={16} // Adjust the size as needed
                    />
                </Box>
                )}
            </Box>
            
            
                            
            <Typography variant="body1" component="div" className='paragraph' sx={{ marginTop: 1, marginBottom: 2 }}>
                {plan.description}
            </Typography>
            <Divider sx={{ borderColor: '#e4e4e4', marginLeft: '-8px', marginRight: '-8px'}} />
            <Typography variant="h4" component="div" className='heading-text' sx={{ fontSize: '40px !important', fontWeight: '700 !important', textAlign: 'center', marginTop: 2, marginBottom: 2 }}>
                ${plan.price} <Typography variant="h6" component="span" className='paragraph' sx={{ marginLeft: '-8px' }}>{plan.interval === 'monthly' ? '/month' : '/year'}</Typography>
            </Typography>
            <Divider sx={{ borderColor: '#e4e4e4', marginLeft: '-8px', marginRight: '-8px'}} />
            <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: '6px'}}>
                    <Image src='/electric-bolt.svg' alt='electric-bolt' width={20} height={20} />
                    <Typography variant="h6" className='second-sub-title' sx={{lineHeight: '20px !important', letterSpacing: '0.07px'}}>{plan.leads_credits} Contacts</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: '6px'}}>
                    <Image src='/electric-bolt.svg' alt='electric-bolt' width={20} height={20} />
                    <Typography variant="h6" className='second-sub-title' sx={{lineHeight: '20px !important', letterSpacing: '0.07px'}}>{plan.prospect_credits} Prospect</Typography>
                </Box>
            </Box>
            <Divider sx={{ borderColor: '#e4e4e4', marginLeft: '-8px', marginRight: '-8px'}} />

            <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {plan.features?.map((feature: any, index: number) => (
                    <Box key={index} sx={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                        <Image 
                            src={feature.enabled ? '/check-fill-tick.svg' : '/check-fill-cross.svg'} 
                            alt={feature.enabled ? 'tick' : 'cross'} 
                            width={20} 
                            height={20} 
                        />
                        <Typography variant="body1" className='second-sub-title' sx={{ display: 'flex', gap: '8px', alignItems: 'center', lineHeight: '20px !important', letterSpacing: '0.07px'}}>
                            {feature.title}
                            {feature.hint && (
                                <CustomTooltip title={feature.hint} linkText="" linkUrl="" />
                                
                            )}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Box sx={{
                position: 'absolute',
                bottom: '24px',
                width: '100%',
                left: '0',
                paddingLeft: '16px',
                paddingRight: '16px'
            }}>
            <Typography variant="body1" className='second-sub-title' sx={{ display: 'flex', gap: '8px', alignItems: 'center', lineHeight: '20px !important', letterSpacing: '0.07px',
            paddingBottom: '24px'
            }}>
                Overage $0.49/contact
                    <CustomTooltip title="" linkText="" linkUrl="" />
            </Typography>
                <Divider sx={{ borderColor: '#e4e4e4'}} />

                <Box sx={{ textAlign: 'center'}}>
                    <Button
                        className='hyperlink-red'
                        variant="outlined"
                        fullWidth
                        onClick={() => onChoose(plan.stripe_price_id)}
                        sx={{
                            color: '#5052B2 !important',
                            borderRadius: '4px',
                            border: '1px solid #5052B2',
                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                            textTransform: 'none',
                            padding: '9px 24px',
                            marginTop: '16px',
                            maxWidth: '232px',
                            '&:hover': {
                                background: 'transparent'
                            }
                        }}
                    >
                        Buy Plan
                    </Button>
                </Box>
            </Box>

            
            
        </Box>
    );
};

export default PlanCard;
