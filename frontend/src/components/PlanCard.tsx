// components/PlanCard.tsx
import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const PlanCard: React.FC<{ plan: any; onChoose: (stripePriceId: string) => void }> = ({ plan, onChoose }) => {
    return (
        <Box sx={{ padding: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography variant="h6" component="div">
                {plan.title}
            </Typography>
            <Typography variant="h4" component="div">
                ${plan.price}/month
            </Typography>
            <Typography variant="body1" component="div">
                {plan.description}
            </Typography>
            <Button
                variant="outlined"
                fullWidth
                onClick={() => onChoose(plan.stripe_price_id)}
            >
                Choose Plan
            </Button>
        </Box>
    );
};

export default PlanCard;
