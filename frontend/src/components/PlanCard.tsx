import React from 'react';
import { Box, Typography, Button, Divider } from '@mui/material';
import Image from 'next/image';
import CustomTooltip from './customToolTip';

const PlanCard: React.FC<{ plan: any; activePlanTitle: string, activePlanPeriod: string, tabValue: number, onChoose: (stripePriceId: string) => void }> = ({ plan, activePlanTitle, tabValue, onChoose, activePlanPeriod }) => {
    const getButtonLabel = () => {
        if (plan.is_active) return 'Current Plan';
    
        if (activePlanTitle === '') {
            return 'Choose Plan';
        }
    
        const levels = ['Launch', 'Pro', 'Growth'];
        const currentLevelIndex = levels.indexOf(activePlanTitle);
        const targetLevelIndex = levels.indexOf(plan.title);
    
        if (currentLevelIndex === -1 || targetLevelIndex === -1) {
            return 'Choose Plan';
        }
    
        if (tabValue === 1 && activePlanPeriod === 'year') {
            if (targetLevelIndex > currentLevelIndex) return 'Upgrade';
            if (targetLevelIndex < currentLevelIndex) return 'Downgrade';
            return 'Current';
        }
    
        if (tabValue === 1 && activePlanPeriod === 'month') {
            return 'Upgrade';
        }
    
        if (targetLevelIndex > currentLevelIndex) return 'Upgrade'; 
        if (targetLevelIndex < currentLevelIndex) return 'Downgrade'; 
        return 'Downgrade';
    };
    
    return (
        <Box sx={{
            padding: '30px 24px', border: '1px solid #e4e4e4', borderRadius: '4px', boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.25)',
            height: '100%',
            position: 'relative'
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Typography variant="h6" component="span" className='heading-text' sx={{
                        fontSize: '32px !important'
                    }}>
                        {plan.title}
                    </Typography>
                    {plan.title === 'Pro' && (

                        <Typography variant="h6" component="span" className='second-sub-title' sx={{
                            backgroundColor: '#EDEDF7',
                            borderRadius: '4px',
                            padding: '6px 8px',
                            color: '#5052B2 !important',
                            fontWeight: '600'
                        }}>
                            Popular
                        </Typography>
                    )}
                </Box>
                <Typography variant="h4" component="div" className='heading-text' sx={{ fontSize: '24px !important', fontWeight: '600 !important', textAlign: 'center' }}>
                    <Typography variant="h6" component="sup" className='third-sub-title' sx={{ letterSpacing: '0.06px' }}>$</Typography>{plan.price.toLocaleString('en-US')} <Typography variant="h6" component="span" className='paragraph' sx={{ marginLeft: '-4px' }}>/month</Typography>
                </Typography>
            </Box>
            <Divider sx={{ borderColor: '#e4e4e4', marginLeft: '-8px', marginRight: '-8px' }} />
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '30px',
                marginTop: '24px'
            }}>
                <Typography variant="body1" component="div" className='paragraph' sx={{
                    fontSize: '14px !important',
                    color: '#202124 !important',
                    letterSpacing: '0.07px !important'
                }}>
                    {plan.description}
                </Typography>

                <Box sx={{ textAlign: 'center' }}>
                    <Button
                        className='hyperlink-red'
                        variant="outlined"
                        fullWidth
                        onClick={() => onChoose(plan.stripe_price_id)}
                        disabled={plan.is_active}
                        sx={{
                            color: plan.is_active ? '#5f6368 !important' : '#5052B2 !important',
                            backgroundColor: plan.is_active ? '#e7e7e7' : 'transparent',
                            borderRadius: '4px',
                            border: plan.is_active ? '1px solid #f8464b' : '1px solid #5052B2',
                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                            textTransform: 'none',
                            padding: '9px 24px',
                            '&:hover': {
                                backgroundColor: '#5052B2',
                                color: '#fff !important'
                            }
                        }}
                    >
                        {getButtonLabel()}
                    </Button>
                </Box>
            </Box>
            <Box sx={{ my: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {plan.features?.map((feature: any, index: number) => (
                    <Box key={index} sx={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                        <Image
                            src={feature.enabled ? '/tick-green-icon.svg' : '/check-fill-cross.svg'}
                            alt={feature.enabled ? 'tick' : 'cross'}
                            width={20}
                            height={20}
                        />
                        <Typography variant="body1" className='second-sub-title' sx={{ display: 'flex', gap: '8px', alignItems: 'center', lineHeight: '20px !important', letterSpacing: '0.07px' }}>
                            {feature.title}
                            {feature.hint && (
                                <CustomTooltip title='How overage works.' linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/settings/enable-overage" />
                            )}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default PlanCard;
