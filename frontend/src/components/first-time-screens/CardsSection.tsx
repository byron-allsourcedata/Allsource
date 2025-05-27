import React from 'react';
import { Grid } from '@mui/material';
import FeatureCard from './FeatureCard';
import { FeatureCardProps } from '@/types/first_time_screens';

interface CardsSectionProps {
    items: FeatureCardProps[];
}

const CardsSection: React.FC<CardsSectionProps> = ({ items }) => {
    return (
        <Grid
            container
            alignItems="stretch"
            justifyContent="center"
            sx={{ gap: 3 }}
        >
            {items.map((props, index) => (
                <Grid item xs={12} md={5.8} key={index} padding={0}>
                    <FeatureCard {...props} />
                </Grid>
            ))}
        </Grid>
    );
};

export default CardsSection;
