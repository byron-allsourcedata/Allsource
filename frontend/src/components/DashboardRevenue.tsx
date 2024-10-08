import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Divider, Typography } from "@mui/material";
import { useState } from "react";
import CustomizedProgressBar from "./CustomizedProgressBar";
import StatsCard from "./StatsCard";
import Image from "next/image";
import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { useMediaQuery } from '@mui/material';

function getDaysInMonth(month: number, year: number) {
    const date = new Date(year, month, 0);
    const monthName = date.toLocaleDateString('en-US', {
        month: 'short',
    });
    const daysInMonth = date.getDate();
    const days = [];
    let i = 1;
    while (days.length < daysInMonth) {
        days.push(`${monthName} ${i}`);
        i += 1;
    }
    return days;
}


const DashboardRevenue: React.FC = () => {

    //first chart
    const data = getDaysInMonth(10, 2024);

    const colorPalette = [
        'rgba(180, 218, 193, 1)',
        'rgba(252, 229, 204, 1)',
        'rgba(201, 218, 248, 1)',
        'rgba(254, 238, 236, 1)'
    ];

    const colorMapping = {
        revenue: 'rgba(180, 218, 193, 1)',
        visitors: 'rgba(252, 229, 204, 1)',
        viewed_product: 'rgba(201, 218, 248, 1)',
        abondoned_cart: 'rgba(254, 238, 236, 1)',
    };

    type VisibleSeries = {
        revenue: boolean;
        visitors: boolean;
        viewed_product: boolean;
        abondoned_cart: boolean;
    };

    const [visibleSeries, setVisibleSeries] = useState<VisibleSeries>({
        revenue: true,
        visitors: true,
        viewed_product: true,
        abondoned_cart: true,
    });

    const handleChipClick = (seriesId: keyof VisibleSeries) => {
        setVisibleSeries((prev) => ({
            ...prev,
            [seriesId]: !prev[seriesId], // переключаем видимость
        }));
    };

    const isLargeScreen = useMediaQuery('(min-width:1200px)');
    const isMediumScreen = useMediaQuery('(min-width:768px)');

    // Настраиваем размеры диаграммы в зависимости от размера экрана
    const chartSize = isLargeScreen ? 400 : isMediumScreen ? 300 : 200;

    const series = [
        {
            id: 'revenue' as keyof typeof colorMapping,
            label: 'Total Revenue',
            curve: 'linear',
            stack: 'total',
            showMark: false,
            area: true,
            stackOrder: 'ascending',
            data: [300, 900, 600, 1200, 1500, 1800, 2400, 2100, 2700, 3000, 1800, 3300,
                3600, 3900, 4200, 4500, 3900, 4800, 5100, 5400, 4800, 5700, 6000,
                6300, 6600, 6900, 7200, 7500, 7800, 8100, 8400],
        },
        {
            id: 'visitors' as keyof typeof colorMapping,
            label: 'Total Visitors',
            curve: 'linear',
            stack: 'total',
            showMark: false,
            area: true,
            stackOrder: 'ascending',
            data: [500, 900, 700, 1400, 1100, 1700, 2300, 2000, 2600, 2900, 2300, 3200,
                3500, 3800, 4100, 4400, 2900, 4700, 5000, 5300, 5600, 5900, 6200,
                6500, 5600, 6800, 7100, 7400, 7700, 8000, 8200],
        },
        {
            id: 'viewed_product' as keyof typeof colorMapping,
            label: 'View Products',
            curve: 'linear',
            showMark: false,
            stack: 'total',
            area: true,
            stackOrder: 'ascending',
            data: [1000, 1500, 1200, 1700, 1300, 2000, 2400, 2200, 2600, 2800, 2500,
                3000, 3400, 3700, 3200, 3900, 4100, 3500, 4300, 4500, 4000, 4700,
                5000, 5200, 4800, 5400, 5600, 5900, 6100, 6300, 6700],
        },
        {
            id: 'abondoned_cart' as keyof typeof colorMapping,
            label: 'Abandoned to Cart',
            curve: 'linear',
            stack: 'total',
            showMark: false,
            area: true,
            stackOrder: 'ascending',
            data: [1000, 1500, 2200, 2700, 2800, 2900, 2500, 1200, 1300, 2800, 2500,
                3000, 3400, 3700, 3200, 3900, 4100, 3500, 4300, 4500, 4000, 4700,
                5000, 5200, 4800, 5400, 5600, 5900, 6100, 6300, 7800],
        },
    ].filter((s) => visibleSeries[s.id as keyof VisibleSeries]); // фильтруем видимые серии
    const filteredSeries = series.filter((s) => visibleSeries[s.id as keyof VisibleSeries]) as [];


    const dataChart = [
        { id: 'Total Visitors', value: 50000 },
        { id: 'View Products', value: 35000 },
        { id: 'Abandoden cart', value: 10000 },
    ];

    const countries = [
        {
            name: 'Total Visitors',
            color: 'rgba(63, 129, 243, 1)',
        },
        {
            name: 'View Products',
            color: 'rgba(248, 150, 30, 1)',
        },
        {
            name: 'Abandoden cart',
            color: 'rgba(249, 199, 79, 1)',
        },
    ];
    const country_color = [
        'rgba(63, 129, 243, 1)',
        'rgba(248, 150, 30, 1)',
        'rgba(249, 199, 79, 1)',
    ]

    const totalValue = dataChart.reduce((acc, curr) => acc + curr.value, 0);


    /// Meta
    const metadata =
    {
        id: 'meta',
        label: 'Meta',
        curve: 'linear',
        stack: 'total',
        showMark: false,
        area: false,
        stackOrder: 'ascending',
        data: [300, 900, 600, 1200, 1500, 1800, 2400, 2100, 2700, 3000, 1800, 3300,
            3600, 3900, 4200, 4500, 3900, 4800, 5100, 5400, 4800, 5700, 6000,
            6300, 6600, 6900, 7200, 7500, 7800, 8100, 8400],
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', pr: 0 }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                backgroundColor: 'rgba(229, 246, 213, 1)',
                borderRadius: '8px',
                border: '0.5px solid rgba(20, 132, 18, 1)',
                padding: '16px',
                width: '100%',
                gap: 1.5,
                mb: 2,
                boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.25)',
                height: '84px',
                position: 'relative'
            }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(40, 134, 100, 0.2)',
                    borderRadius: '20%',
                    padding: '12px',
                    width: '52px',
                    height: '52px'
                }}>
                    <Image src={'/dollar.svg'} alt={'dollar'} width={21} height={36.4} />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Typography variant="h5" component='div' sx={{ display: 'flex', flexDirection: 'row', alignItems: 'end', fontWeight: '700', fontSize: '22px', fontFamily: 'Nunito Sans', lineHeight: '30.01px', color: 'rgba(32, 33, 36, 1)', gap: 1, '@media (max-width: 600px)': { flexDirection: 'column' } }}>
                        $213,210 <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '14px', pb: 0.5, fontWeight: 500, lineHeight: '19.6px', textAlign: 'left' }}>(Lifetime revenue)</Typography>
                    </Typography>
                    <Typography variant="h5" component='div' sx={{ display: 'flex', flexDirection: 'row', fontWeight: '700', alignItems: 'end', fontSize: '27px', fontFamily: 'Nunito Sans', lineHeight: '36.83px', color: 'rgba(0, 0, 0, 1)', gap: 1, '@media (max-width: 600px)': { flexDirection: 'column' } }}>
                        11.1x <Typography component='span' sx={{ fontFamily: 'Nunito Sans', color: 'rgba(32, 33, 36, 1)', fontSize: '14px', pb: 0.5, fontWeight: 500, lineHeight: '19.6px', textAlign: 'left' }}>ROI</Typography>
                    </Typography>
                </Box>
                <Box sx={{ position: 'absolute', bottom: -4, right: 0, paddingRight: '4px' }}>
                    <Image src={'/chart.svg'} alt={'chart'} width={32} height={22} />
                </Box>
            </Box>

            <Box sx={{ width: '100%' }} >
                <StatsCard />
            </Box>

            <Box sx={{ mb: 3, boxShadow: '0px 2px 10px 0px rgba(0, 0, 0, 0.1)' }}>
                <Card variant="outlined" sx={{ width: '100%' }}>
                    <CardContent>
                        <Stack sx={{ justifyContent: 'space-between', flexDirection: 'row' }}>
                            <Stack
                                direction="row"
                                sx={{
                                    alignContent: { xs: 'center', sm: 'flex-start' },
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Typography variant="h4" component="div" sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito Sans', fontSize: '14px', fontWeight: 500, lineHeight: '19.6px', textAlign: 'left', gap: 1 }}>
                                    Total Revenue -<Typography component="span" sx={{ fontFamily: 'Nunito Sans', color: 'rgba(74, 74, 74, 1)', fontSize: '22px', fontWeight: 600, lineHeight: '30.01px', textAlign: 'left' }}>$22,301</Typography>
                                </Typography>
                            </Stack>
                            <Stack
                                direction="row"
                                sx={{
                                    alignContent: { xs: 'center', sm: 'flex-start' },
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                {Object.keys(visibleSeries).map((seriesId, index) => (
                                    <Chip
                                        key={seriesId}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {/* Кружок перед текстом */}
                                                <Box
                                                    sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        backgroundColor: colorPalette[index],
                                                    }}
                                                />
                                                {/* Текст чипа */}
                                                <Typography
                                                    sx={{
                                                        fontFamily: 'Roboto',
                                                        fontSize: '12px',
                                                        fontWeight: 400,
                                                        lineHeight: '16.8px',
                                                        textTransform: 'none',

                                                        textAlign: 'left',
                                                        color: 'rgba(95, 99, 104, 1)', // Цвет текста
                                                    }}
                                                >
                                                    {seriesId.replace(/_/g, ' ')} {/* Форматируем название */}
                                                </Typography>
                                            </Box>
                                        }
                                        onClick={() => handleChipClick(seriesId as keyof VisibleSeries)}
                                        sx={{
                                            cursor: 'pointer',
                                            backgroundColor: visibleSeries[seriesId as keyof VisibleSeries] ? 'rgba(237, 237, 247, 1)' : '#fff',
                                            borderRadius: '4px', // Закругленные углы
                                            maxHeight: '25px',
                                            border: 'none'

                                        }}
                                        variant={visibleSeries[seriesId as keyof VisibleSeries] ? 'filled' : 'outlined'}
                                    />
                                ))}
                            </Stack>

                        </Stack>

                        <LineChart
                            colors={series.map(s => colorMapping[s.id as keyof typeof colorMapping])} // Получаем цвет из colorMapping по id
                            xAxis={[{ scaleType: 'point', data, tickInterval: (index, i) => (i + 1) % 5 === 0 }]}
                            series={filteredSeries}
                            height={250}
                            margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
                            grid={{ horizontal: true }}
                            sx={{
                                border: 'none',
                            }}
                            slotProps={{
                                legend: { hidden: true },
                            }}
                        >

                        </LineChart>

                    </CardContent>
                </Card>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', gap: 3, mt: 3, '@media (max-width: 900px)': {flexDirection: 'column'}  }}>
                <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', '@media (max-width: 900px)': {width: '100%'} }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            backgroundColor: '#fff',
                            gap: 1.5,
                            mb: 2,
                            position: 'relative'
                        }}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '12px',
                                width: '52px',
                                height: '52px',
                                borderRadius: '4px',
                                border: '1px solid rgba(224, 176, 5, 1)'
                            }}>
                                <Image src={'/PersonEdit.svg'} alt={'View Products'} width={25} height={29} />
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'start', width: '100%' }}>
                                <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '700', fontSize: '22px', justifyContent: 'flex-end', mt: 1, fontFamily: 'Nunito Sans', lineHeight: '30.01px', color: 'rgba(32, 33, 36, 1)', '@media (max-width: 600px)': { flexDirection: 'column' } }}>
                                    $23,233 <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '14px', pb: 0.5, fontWeight: 500, lineHeight: '19.6px', textAlign: 'left' }}>View Products</Typography>
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ border: '0.2px solid rgba(189, 189, 189, 1)', backgroundColor: 'rgba(250, 250, 246, 1)', maxHeight: '52px', mt: 0.5, borderRadius: '4px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: '8px 16px' }}>
                            <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '600', fontSize: '12px', justifyContent: 'flex-end', fontFamily: 'Nunito Sans', lineHeight: '16.08px', color: 'rgba(74, 74, 74, 1)' }}>
                                Average Order <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '16px', fontWeight: 700, lineHeight: '21.82px', color: 'rgba(32, 33, 36, 1)', textAlign: 'left' }}>$55.50</Typography>
                            </Typography>
                            <Box sx={{ border: '0.5px solid rgba(189, 189, 189, 1)', height: '70%', marginLeft: 3, mr: 3 }}>
                            </Box>
                            <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '600', fontSize: '12px', justifyContent: 'flex-end', fontFamily: 'Nunito Sans', lineHeight: '16.08px', color: 'rgba(74, 74, 74, 1)' }}>
                                Total Order <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '16px', fontWeight: 700, lineHeight: '21.82px', color: 'rgba(32, 33, 36, 1)', textAlign: 'left' }}>555</Typography>
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ mb: 3, boxShadow: '0px 2px 10px 0px rgba(0, 0, 0, 0.1)' }}>
                        <Card variant="outlined" sx={{ width: '100%' }}>
                            <CardContent>
                                <LineChart
                                    colors={['rgba(255, 230, 180, 1)']}
                                    xAxis={[{ scaleType: 'point', data, tickInterval: (index, i) => (i + 1) % 5 === 0 }]}
                                    series={[{
                                        id: 'viewed_product',
                                        label: 'View Products',
                                        curve: 'linear',
                                        stack: 'total',
                                        showMark: false,
                                        area: true,
                                        stackOrder: 'ascending',
                                        data: [1000, 1500, 1200, 1700, 1300, 2000, 2400, 2200, 2600, 2800, 2500,
                                            3000, 3400, 3700, 3200, 3900, 4100, 3500, 4300, 4500, 4000, 4700,
                                            5000, 5200, 4800, 5400, 5600, 5900, 6100, 6300, 6700],
                                    }]}
                                    height={250}
                                    margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
                                    grid={{ horizontal: true }}
                                    sx={{
                                        border: 'none',
                                    }}
                                    slotProps={{
                                        legend: { hidden: true },
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </Box>
                </Box>

                <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', '@media (max-width: 900px)': {width: '100%'} }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            backgroundColor: '#fff',
                            gap: 1.5,
                            mb: 2,
                            position: 'relative'
                        }}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                pr: '12px',
                                pl: '10px',
                                width: '52px',
                                height: '52px',
                                borderRadius: '4px',
                                border: '1px solid rgba(110, 193, 37, 1)'
                            }}>
                                <Image src={'/cart.svg'} alt={'Abandoned cart'} width={32} height={30} />
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'start', width: '100%' }}>
                                <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '700', fontSize: '22px', justifyContent: 'flex-end', mt: 1, fontFamily: 'Nunito Sans', lineHeight: '30.01px', color: 'rgba(32, 33, 36, 1)', '@media (max-width: 600px)': { flexDirection: 'column' } }}>
                                    $12,233 <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '14px', pb: 0.5, fontWeight: 500, lineHeight: '19.6px', textAlign: 'left' }}>Abandoned cart</Typography>
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ border: '0.2px solid rgba(189, 189, 189, 1)', backgroundColor: 'rgba(250, 250, 246, 1)', maxHeight: '52px', mt: 0.5, borderRadius: '4px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: '8px 16px' }}>
                            <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '600', fontSize: '12px', justifyContent: 'flex-end', fontFamily: 'Nunito Sans', lineHeight: '16.08px', color: 'rgba(74, 74, 74, 1)' }}>
                                Average Order <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '16px', fontWeight: 700, lineHeight: '21.82px', color: 'rgba(32, 33, 36, 1)', textAlign: 'left' }}>$52.50</Typography>
                            </Typography>
                            <Box sx={{ border: '0.5px solid rgba(189, 189, 189, 1)', height: '70%', marginLeft: 3, mr: 3 }}>
                            </Box>
                            <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '600', fontSize: '12px', justifyContent: 'flex-end', fontFamily: 'Nunito Sans', lineHeight: '16.08px', color: 'rgba(74, 74, 74, 1)' }}>
                                Total Order <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '16px', fontWeight: 700, lineHeight: '21.82px', color: 'rgba(32, 33, 36, 1)', textAlign: 'left' }}>1111</Typography>
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ mb: 3, boxShadow: '0px 2px 10px 0px rgba(0, 0, 0, 0.1)' }}>
                        <Card variant="outlined" sx={{ width: '100%' }}>
                            <CardContent>
                                <LineChart
                                    colors={['rgba(180, 218, 193, 1)']}
                                    xAxis={[{ scaleType: 'point', data, tickInterval: (index, i) => (i + 1) % 5 === 0 }]}
                                    series={[{
                                        id: 'viewed_product',
                                        label: 'View Products',
                                        curve: 'linear',
                                        stack: 'total',
                                        showMark: false,
                                        area: true,
                                        stackOrder: 'ascending',
                                        data: [1000, 1500, 2200, 2700, 2800, 2900, 2500, 1200, 1300, 2800, 2500,
                                            3000, 3400, 3700, 3200, 3900, 4100, 3500, 4300, 4500, 4000, 4700,
                                            5000, 5200, 4800, 5400, 5600, 5900, 6100, 6300, 7800],
                                    }]}
                                    height={250}
                                    margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
                                    grid={{ horizontal: true }}
                                    sx={{
                                        border: 'none',
                                    }}
                                    slotProps={{
                                        legend: { hidden: true },
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', gap: 3, '@media (max-width: 900px)': {flexDirection: 'column'}  }}>
                <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', '@media (max-width: 900px)': {width: '100%'} }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            backgroundColor: '#fff',
                            gap: 1.5,
                            mb: 2,
                            position: 'relative'
                        }}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '12px',
                                width: '52px',
                                height: '52px',
                                borderRadius: '4px',
                                border: '1px solid rgba(80, 82, 178, 1)'
                            }}>
                                <Image src={'/PersonMarked.svg'} alt={'Total Visitors'} width={28} height={28} />
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'start', width: '100%' }}>
                                <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '700', fontSize: '22px', justifyContent: 'flex-end', mt: 1, fontFamily: 'Nunito Sans', lineHeight: '30.01px', color: 'rgba(32, 33, 36, 1)', '@media (max-width: 600px)': { flexDirection: 'column' } }}>
                                    $23,233 <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '14px', pb: 0.5, fontWeight: 500, lineHeight: '19.6px', textAlign: 'left' }}>Total Visitors</Typography>
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ border: '0.2px solid rgba(189, 189, 189, 1)', backgroundColor: 'rgba(250, 250, 246, 1)', maxHeight: '52px', mt: 0.5, borderRadius: '4px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: '8px 16px' }}>
                            <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '600', fontSize: '12px', justifyContent: 'flex-end', fontFamily: 'Nunito Sans', lineHeight: '16.08px', color: 'rgba(74, 74, 74, 1)' }}>
                                Average Order <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '16px', fontWeight: 700, lineHeight: '21.82px', color: 'rgba(32, 33, 36, 1)', textAlign: 'left' }}>$55.50</Typography>
                            </Typography>
                            <Box sx={{ border: '0.5px solid rgba(189, 189, 189, 1)', height: '70%', marginLeft: 3, mr: 3 }}>
                            </Box>
                            <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '600', fontSize: '12px', justifyContent: 'flex-end', fontFamily: 'Nunito Sans', lineHeight: '16.08px', color: 'rgba(74, 74, 74, 1)' }}>
                                Total Order <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '16px', fontWeight: 700, lineHeight: '21.82px', color: 'rgba(32, 33, 36, 1)', textAlign: 'left' }}>555</Typography>
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ mb: 3, boxShadow: '0px 2px 10px 0px rgba(0, 0, 0, 0.1)' }}>
                        <Card variant="outlined" sx={{ width: '100%' }}>
                            <CardContent>
                                <LineChart
                                    colors={['rgba(181, 218, 248, 1)']}
                                    xAxis={[{ scaleType: 'point', data, tickInterval: (index, i) => (i + 1) % 5 === 0 }]}
                                    series={[{
                                        id: 'viewed_product',
                                        label: 'View Products',
                                        curve: 'linear',
                                        stack: 'total',
                                        showMark: false,
                                        area: true,
                                        stackOrder: 'ascending',
                                        data: [500, 900, 700, 1400, 1100, 1700, 2300, 2000, 2600, 2900, 2300, 3200,
                                            3500, 3800, 4100, 4400, 2900, 4700, 5000, 5300, 5600, 5900, 6200,
                                            6500, 5600, 6800, 7100, 7400, 7700, 8000, 8200],
                                    }]}
                                    height={250}
                                    margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
                                    grid={{ horizontal: true }}
                                    sx={{
                                        border: 'none',
                                    }}
                                    slotProps={{
                                        legend: { hidden: true },
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </Box>
                </Box>

                <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', '@media (max-width: 900px)': {width: '100%'}}}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            backgroundColor: '#fff',
                            gap: 1.5,
                            mb: 2.65,
                            mt: 0.5,
                            position: 'relative'
                        }}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '11px',
                                width: '52px',
                                height: '52px',
                                borderRadius: '4px',
                                border: '1px solid rgba(80, 82, 178, 1)'
                            }}>
                                <Image src={'/distribution.svg'} alt={'Distribution'} width={30} height={30} />
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'start', width: '100%' }}>
                                <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '14px', pb: 0.5, fontWeight: 500, lineHeight: '19.6px', textAlign: 'left' }}>Distribution</Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{ mb: 3, boxShadow: '0px 2px 10px 0px rgba(0, 0, 0, 0.1)', width: '100%' }}>
                        <Card
                            variant="outlined"
                            sx={{ display: 'flex', flexDirection: 'row', gap: '16px', flexGrow: 1, justifyContent: 'center', width: '100%' }}
                        >
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'start', width: '100%', }}>
                                    <PieChart
                                        colors={country_color}
                                        margin={{
                                            left: 80,
                                            right: 140,
                                            top: 80,
                                            bottom: 80,
                                        }}
                                        series={[
                                            {
                                                type: 'pie',
                                                arcLabel: (item) => {
                                                    const percentage = ((item.value / totalValue) * 100).toFixed(1);
                                                    return `${percentage}%`;
                                                },
                                                arcLabelMinAngle: 35,
                                                data: dataChart,
                                                innerRadius: chartSize * 0.17, 
                                                outerRadius: chartSize * 0.3,
                                                paddingAngle: 0,
                                                highlightScope: { faded: 'global', highlighted: 'item' },
                                            },
                                        ]}
                                        height={260}
                                        width={260}
                                        slotProps={{
                                            legend: { hidden: true },
                                        }}
                                    >
                                    </PieChart>
                                </Box>
                            </CardContent>

                            <Stack sx={{ padding: 2, display: 'flex', alignItems: 'start', justifyContent: 'center', }}>
                                {countries.map((country, index) => (
                                    <Stack
                                        key={index}
                                        direction="row"
                                        sx={{ alignItems: 'center', gap: 2, pb: 2 }}
                                    >
                                        <Stack sx={{ gap: 1, flexGrow: 1 }}>
                                            <Stack
                                                direction="row"
                                                sx={{
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                }}
                                            >
                                                <Typography variant="body2" sx={{ fontFamily: 'Roboto', fontSize: '12px', fontWeight: 400, lineHeight: '11.72px', textAlign: 'left', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.5 }}>
                                                    {/* Кружок перед текстом */}
                                                    <Box
                                                        sx={{
                                                            width: 12,
                                                            height: 12,
                                                            borderRadius: '50%',
                                                            backgroundColor: country.color,
                                                        }}
                                                    /> {country.name}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </Stack>
                                ))}
                            </Stack>
                        </Card>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ mb: 3, boxShadow: '0px 2px 10px 0px rgba(0, 0, 0, 0.1)' }}>
                <Card variant="outlined" sx={{ width: '100%' }}>
                    <CardContent>
                        <Stack sx={{ justifyContent: 'space-between', flexDirection: 'row' }}>
                            <Stack
                                direction="row"
                                sx={{
                                    alignContent: { xs: 'center', sm: 'flex-start' },
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    paddingTop: '10px',
                                    paddingBottom: '10px',
                                    pr: '6px',
                                    pl: '6px',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(41, 130, 215, 0.1)'
                                }}>
                                    <Image src={'/meta-icon.svg'} alt={'View Products'} width={19.46} height={13} />
                                </Box>
                                <Typography variant="h4" component="div" sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito Sans', fontSize: '14px', fontWeight: 500, lineHeight: '19.6px', textAlign: 'left', gap: 1 }}>
                                    Meta Contacts -<Typography component="span" sx={{ fontFamily: 'Nunito Sans', color: 'rgba(74, 74, 74, 1)', fontSize: '22px', fontWeight: 600, lineHeight: '30.01px', textAlign: 'left' }}>$22,301</Typography>
                                </Typography>
                            </Stack>

                        </Stack>

                        <LineChart
                            colors={['rgba(5, 104, 225, 1)']}
                            xAxis={[{ scaleType: 'point', data, tickInterval: (index, i) => (i + 1) % 5 === 0 }]}
                            series={[{
                                id: 'meta',
                                label: 'Meta Contacts',
                                curve: 'linear',
                                stack: 'total',
                                showMark: false,
                                area: false,
                                stackOrder: 'ascending',
                                data: [500, 900, 700, 1400, 1100, 1700, 2300, 2000, 2600, 2900, 2300, 3200,
                                    3500, 3800, 4100, 4400, 2900, 4700, 5000, 5300, 5600, 5900, 6200,
                                    6500, 5600, 6800, 7100, 7400, 7700, 8000, 8200],
                            }]}
                            height={250}
                            margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
                            grid={{ horizontal: true }}
                            sx={{
                                border: 'none',
                            }}
                            slotProps={{
                                legend: { hidden: true },
                            }}
                        >

                        </LineChart>

                    </CardContent>
                </Card>
            </Box>
        </Box>
    )
}


export default DashboardRevenue;