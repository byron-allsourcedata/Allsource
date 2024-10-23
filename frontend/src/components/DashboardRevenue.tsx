import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Checkbox, Divider, ListItemText, MenuItem, Select, SelectChangeEvent, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import CustomizedProgressBar from "./CustomizedProgressBar";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
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


const CustomIcon = () => (
    <Image src="/arrow_down.svg" alt="arrow down" width={16} height={16} />
);

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

interface AppliedDates {
    start: Date | null;
    end: Date | null;
}

const DashboardRevenue = ({ appliedDates }: { appliedDates: AppliedDates }) => {
    const [lifetimeRevenue, setLifetimeRevenue] = useState(0);
    const [ROI, setROI] = useState(0);
    const [loading, setLoading] = useState(true)
    const [values, setValues] = useState({
        totalRevenue: 0,
        totalVisitors: 0,
        viewProducts: 0,
        totalAbandonedCart: 0,
    });
    const [average_orders, setAverageOrders] = useState({
        averageVisitors: 0,
        averageViewProducts: 0,
        averageAddToCart: 0,
    });
    const [total_orders, setTotalOrders] = useState({
        averageVisitors: 0,
        averageViewProducts: 0,
        averageAddToCart: 0,
    });


    const colorPalette = [
        'rgba(244, 87, 69, 1)',
        'rgba(80, 82, 178, 1)',
        'rgba(224, 176, 5, 1)',
        'rgba(144, 190, 109, 1)'
    ];

    const colorMapping = {
        revenue: 'rgba(244, 87, 69, 1)',
        visitors: 'rgba(80, 82, 178, 1)',
        viewed_product: 'rgba(224, 176, 5, 1)',
        abandoned_cart: 'rgba(144, 190, 109, 1)'
    };

    type VisibleSeries = {
        revenue: boolean;
        visitors: boolean;
        viewed_product: boolean;
        abandoned_cart: boolean;
    };

    const [visibleSeries, setVisibleSeries] = useState<VisibleSeries>({
        revenue: true,
        visitors: true,
        viewed_product: true,
        abandoned_cart: true,
    });

    const handleChipClick = (seriesId: keyof VisibleSeries) => {
        setVisibleSeries((prev) => ({
            ...prev,
            [seriesId]: !prev[seriesId],
        }));
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            if (appliedDates.start && appliedDates.end) {
                const fromUnix = Math.floor(appliedDates.start.getTime() / 1000);
                const toUnix = Math.floor(appliedDates.end.getTime() / 1000);

                try {
                    const response = await axiosInstance.get("/dashboard/revenue", {
                        params: { from_date: fromUnix, to_date: toUnix },
                    });
                    const { total_revenue, total_visitors, total_view_products, total_abandoned_cart } = response.data.total_counts;
                    setValues({
                        totalRevenue: total_revenue,
                        totalVisitors: total_visitors,
                        viewProducts: total_view_products,
                        totalAbandonedCart: total_abandoned_cart,
                    });
                    setLifetimeRevenue(response.data.lifetime_revenue);
                    setROI(response.data.ROI)
                    const { daily_data } = response.data;

                    const days = Object.keys(daily_data).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

                    const revenueData = days.map((day) => daily_data[day].total_price || 0);
                    const visitorsData = days.map((day) => daily_data[day].visitor || 0);
                    const viewedProductData = days.map((day) => daily_data[day].viewed_product || 0);
                    const abandonedCartData = days.map((day) => daily_data[day].abandoned_cart || 0);

                    setSeries([
                        {
                            id: 'revenue',
                            label: 'Total Revenue',
                            data: revenueData,
                            curve: 'linear',
                            stack: 'total',
                            showMark: false,
                            area: false,
                            stackOrder: 'ascending',
                        },
                        {
                            id: 'visitors',
                            label: 'Total Visitors',
                            data: visitorsData,
                            curve: 'linear',
                            stack: 'total',
                            showMark: false,
                            area: false,
                            stackOrder: 'ascending',
                        },
                        {
                            id: 'viewed_product',
                            label: 'View Products',
                            data: viewedProductData,
                            curve: 'linear',
                            stack: 'total',
                            showMark: false,
                            area: false,
                            stackOrder: 'ascending',
                        },
                        {
                            id: 'abandoned_cart',
                            label: 'Abandoned to Cart',
                            data: abandonedCartData,
                            curve: 'linear',
                            stack: 'total',
                            showMark: false,
                            area: false,
                            stackOrder: 'ascending',
                        },
                    ]);
                    setDays(days);
                } catch (error) {
                    console.error("Error fetching revenue data:", error);
                } finally {
                    setLoading(false)
                }
            } else {
                setLoading(true);
                try {
                    const response = await axiosInstance.get("/dashboard/revenue");
                    const { total_revenue, total_visitors, total_view_products, total_abandoned_cart } = response.data.total_counts;
                    setValues({
                        totalRevenue: total_revenue,
                        totalVisitors: total_visitors,
                        viewProducts: total_view_products,
                        totalAbandonedCart: total_abandoned_cart,
                    });
                    const { average_order_visitors, average_order_view_products, average_order_abandoned_cart } = response.data.average_order
                    const { total_orders_visitors, total_orders_view_products, total_orders_abandoned_cart } = response.data.total_order
                    setAverageOrders({
                        averageVisitors: average_order_visitors,
                        averageAddToCart: average_order_abandoned_cart,
                        averageViewProducts: average_order_view_products
                    })
                    setTotalOrders({
                        averageVisitors: total_orders_visitors,
                        averageAddToCart: total_orders_abandoned_cart,
                        averageViewProducts: total_orders_view_products
                    })
                    setLifetimeRevenue(response.data.lifetime_revenue);
                    setROI(response.data.ROI)

                    const { daily_data } = response.data;
                    const days = Object.keys(daily_data).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());


                    const revenueData = days.map((day) => daily_data[day].total_price || 0);
                    const visitorsData = days.map((day) => daily_data[day].visitor || 0);
                    const viewedProductData = days.map((day) => daily_data[day].viewed_product || 0);
                    const abandonedCartData = days.map((day) => daily_data[day].abandoned_cart || 0);

                    setSeries([
                        {
                            id: 'revenue',
                            label: 'Total Revenue',
                            data: revenueData,
                            curve: 'linear',
                            stack: 'total',
                            showMark: false,
                            area: false,
                            stackOrder: 'ascending',
                        },
                        {
                            id: 'visitors',
                            label: 'Total Visitors',
                            data: visitorsData,
                            curve: 'linear',
                            stack: 'total',
                            showMark: false,
                            area: false,
                            stackOrder: 'ascending',
                        },
                        {
                            id: 'viewed_product',
                            label: 'View Products',
                            data: viewedProductData,
                            curve: 'linear',
                            stack: 'total',
                            showMark: false,
                            area: false,
                            stackOrder: 'ascending',
                        },
                        {
                            id: 'abandoned_cart',
                            label: 'Abandoned to Cart',
                            data: abandonedCartData,
                            curve: 'linear',
                            stack: 'total',
                            showMark: false,
                            area: false,
                            stackOrder: 'ascending',
                        },
                    ]);
                    setDays(days);
                }
                finally {
                    setLoading(false)
                }
            }
        };

        fetchData();
    }, [appliedDates]);

    const options = [
        { id: 'revenue', label: 'Total Revenue', color: 'rgba(180, 218, 193, 1)' },
        { id: 'visitors', label: 'Total Visitors', color: 'rgba(252, 229, 204, 1)' },
        { id: 'viewed_product', label: 'View Products', color: 'rgba(201, 218, 248, 1)' },
        { id: 'abandoned_cart', label: 'Abandoned cart', color: 'rgba(254, 238, 236, 1)' },
    ];

    const selectedGraphs = options
        .filter((option) => visibleSeries[option.id as keyof VisibleSeries])
        .map((option) => option.id);

    const handleToggleSeries = (event: SelectChangeEvent<string[]>) => {
        const selectedValues = event.target.value as string[];

        setVisibleSeries((prev) => {
            const updatedVisibleSeries: VisibleSeries = { ...prev };

            if (selectedValues.includes("All revenue type")) {
                if (selectedValues.length === 1) {
                    options.forEach((option) => {
                        updatedVisibleSeries[option.id as keyof VisibleSeries] = true;
                    });
                } else {
                    options.forEach((option) => {
                        updatedVisibleSeries[option.id as keyof VisibleSeries] = false;
                    });
                }
            } else {
                options.forEach((option) => {
                    updatedVisibleSeries[option.id as keyof VisibleSeries] = selectedValues.includes(option.id);
                });
            }

            return updatedVisibleSeries;
        });
    };


    const isLargeScreen = useMediaQuery('(min-width:1200px)');
    const isMediumScreen = useMediaQuery('(min-width:768px)');
    const isMobile = useMediaQuery('(max-width: 380px)');

    const chartSize = isLargeScreen ? 400 : isMediumScreen ? 300 : isMobile ? 200 : 260;


    const [series, setSeries] = useState<
        {
            id: keyof typeof colorMapping;
            label: string;
            curve: string;
            stack: string;
            showMark: boolean;
            area: boolean;
            stackOrder: string;
            data: number[];
        }[]
    >([
        {
            id: 'revenue' as keyof typeof colorMapping,
            label: 'Total Revenue',
            curve: 'linear',
            stack: 'total',
            showMark: false,
            area: false,
            stackOrder: 'ascending',
            data: [],
        },
        {
            id: 'visitors' as keyof typeof colorMapping,
            label: 'Total Visitors',
            curve: 'linear',
            stack: 'total',
            showMark: false,
            area: false,
            stackOrder: 'ascending',
            data: [0],
        },
        {
            id: 'viewed_product' as keyof typeof colorMapping,
            label: 'View Products',
            curve: 'linear',
            showMark: false,
            stack: 'total',
            area: false,
            stackOrder: 'ascending',
            data: [0],
        },
        {
            id: 'abandoned_cart' as keyof typeof colorMapping,
            label: 'Abandoned to Cart',
            curve: 'linear',
            stack: 'total',
            showMark: false,
            area: false,
            stackOrder: 'ascending',
            data: [0],
        },
    ].filter((s) => visibleSeries[s.id as keyof VisibleSeries]));


    const [data, setDays] = useState<string[]>([]);
    const formattedData = data.map(dateStr => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    });
    const filteredSeries = series.filter((s) => visibleSeries[s.id as keyof VisibleSeries]) as [];
    const filteredSeriescolor = series.filter((s) => visibleSeries[s.id as keyof VisibleSeries]);

    const viewedProductSeries = series.filter((s) => s.id === 'viewed_product') as [];
    const addToCartSeries = series.filter((s) => s.id === 'abandoned_cart') as [];
    const visitorSeries = series.filter((s) => s.id === 'visitors') as [];

    const dataChart = [
        { id: 'Total Visitors', value: 50000 },
        { id: 'View Products', value: 35000 },
        { id: 'Abandoden cart', value: 10000 },
    ];

    const distribution = [
        {
            name: 'Total Visitors',
            color: 'rgba(63, 129, 243, 1)',
        },
        {
            name: 'View Products',
            color: 'rgba(248, 150, 30, 1)',
        },
        {
            name: 'Abandoned cart',
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
                    <Typography variant="h5" component='div' sx={{ display: 'flex', flexDirection: 'row', alignItems: 'end', fontWeight: '700', fontSize: '22px', fontFamily: 'Nunito Sans', lineHeight: '30.01px', color: 'rgba(32, 33, 36, 1)', gap: 1, '@media (max-width: 600px)': { flexDirection: 'column', alignItems: 'start' } }}>
                        ${lifetimeRevenue ? lifetimeRevenue.toLocaleString('en-US') : 0} <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '14px', pb: 0.5, fontWeight: 500, lineHeight: '19.6px', textAlign: 'left' }}>(Lifetime revenue)</Typography>
                    </Typography>
                    <Typography variant="h5" component='div' sx={{ display: 'flex', flexDirection: 'row', fontWeight: '700', alignItems: 'end', fontSize: '27px', fontFamily: 'Nunito Sans', lineHeight: '36.83px', color: 'rgba(0, 0, 0, 1)', gap: 1, '@media (max-width: 600px)': { flexDirection: 'column', alignItems: 'start' } }}>
                        {ROI.toLocaleString('en-US')}x <Typography component='span' sx={{ fontFamily: 'Nunito Sans', color: 'rgba(32, 33, 36, 1)', fontSize: '14px', pb: 0.5, fontWeight: 500, lineHeight: '19.6px', textAlign: 'left' }}>ROI</Typography>
                    </Typography>
                </Box>
                <Box sx={{ position: 'absolute', bottom: -4, right: 0, paddingRight: '4px' }}>
                    <Image src={'/chart.svg'} alt={'chart'} width={32} height={22} />
                </Box>
            </Box>

            <Box sx={{ width: '100%', mt: 1, mb: 1, '@media (max-width: 900px)': { mt: 0, mb: 0, } }}>
                <StatsCard values={values} />
            </Box>

            <Box sx={{ mb: 3, boxShadow: '0px 2px 10px 0px rgba(0, 0, 0, 0.1)' }}>
                <Card variant="outlined" sx={{ width: '100%' }}>
                    <CardContent>
                        <Stack sx={{ justifyContent: 'space-between', flexDirection: 'row', '@media (max-width: 900px)': { flexDirection: 'column', justifyContent: 'center', alignItems: 'start' } }}>
                            <Stack
                                direction="row"
                                sx={{
                                    alignContent: { xs: 'center', sm: 'flex-start' },
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Typography component="div" className="second-sub-title" sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', fontWeight: '600 !important', fontFamily: 'Nunito Sans', fontSize: '16px', lineHeight: '19.1px !important', textWrap: 'nowrap', textAlign: 'left', gap: 1, '@media (max-width: 900px)': { flexDirection: 'row', width: '100%', textWrap: 'nowrap' } }}>
                                    Total Revenue <Typography component="span" sx={{ fontFamily: 'Nunito Sans', color: 'rgba(74, 74, 74, 1)', fontSize: '22px', fontWeight: 600, lineHeight: '30.01px', textAlign: 'left' }}>$22,301</Typography>
                                </Typography>
                            </Stack>
                            <Stack
                                direction="row"
                                sx={{
                                    alignContent: { xs: 'center', sm: 'flex-start' },
                                    alignItems: 'center',
                                    gap: 1,
                                    justifyContent: 'end',
                                    direction: 'column',
                                    width: '100%'
                                }}
                            >
                                {Object.keys(visibleSeries).map((seriesId, index) => (
                                    <Chip
                                        key={seriesId}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, }}>
                                                <Box
                                                    sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        backgroundColor: colorPalette[index],
                                                    }}
                                                />
                                                <Typography className="paragraph"
                                                    sx={{
                                                        fontFamily: 'Roboto',
                                                        fontSize: '12px',
                                                        textTransform: 'none',
                                                        textAlign: 'left',
                                                        color: 'rgba(95, 99, 104, 1)',
                                                    }}
                                                >
                                                    {seriesId.replace(/_/g, ' ').replace(/^(.)(.*)$/, (match, p1, p2) => p1.toUpperCase() + p2.toLowerCase())}
                                                </Typography>
                                            </Box>
                                        }
                                        onClick={() => handleChipClick(seriesId as keyof VisibleSeries)}
                                        sx={{
                                            cursor: 'pointer',
                                            backgroundColor: visibleSeries[seriesId as keyof VisibleSeries] ? 'rgba(237, 237, 247, 1)' : '#fff',
                                            borderRadius: '4px',
                                            maxHeight: '25px',
                                            border: 'none',
                                            '@media (max-width: 900px)': { display: 'none' }
                                        }}
                                        variant={visibleSeries[seriesId as keyof VisibleSeries] ? 'filled' : 'outlined'}
                                    />
                                ))}

                                <Box sx={{ '@media (min-width: 900px)': { display: 'none' }, width: '100%', mt: 1, mb: 1 }}>
                                    <Select
                                        multiple
                                        value={selectedGraphs}
                                        onChange={handleToggleSeries}
                                        displayEmpty
                                        renderValue={(selected) => {
                                            const isAllSelected = selected.length === options.length;

                                            return isAllSelected
                                                ? 'All revenue type'
                                                : selected.map((id) => options.find((option) => option.id === id)?.label).join(', ');
                                        }}
                                        IconComponent={CustomIcon}
                                        sx={{
                                            width: '100%',
                                            borderColor: 'rgba(228, 228, 228, 1)',
                                            padding: '8px',
                                            pr: 2,
                                            fontFamily: 'Nunito Sans',
                                            color: 'rgba(74, 74, 74, 1)',
                                            fontWeight: 600,
                                            fontSize: '14px'
                                        }}
                                    >
                                        <MenuItem value="All revenue type">
                                            <Typography
                                                sx={{
                                                    fontFamily: 'Nunito Sans',
                                                    fontWeight: 600,
                                                    fontSize: '14px',
                                                    color: selectedGraphs.length == 4 ? 'rgba(80, 82, 178, 1)' : 'inherit' // Изменяем цвет текста
                                                }}
                                            >
                                                All revenue type
                                            </Typography>
                                        </MenuItem>
                                        {options.map((option) => (
                                            <MenuItem key={option.id} value={option.id} sx={{
                                                backgroundColor: selectedGraphs.includes(option.id) ? 'transparent' : 'inherit',
                                                '&.Mui-selected': {
                                                    backgroundColor: 'transparent',
                                                },
                                                '&:hover': {
                                                    backgroundColor: 'transparent'
                                                }
                                            }} >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, }}>
                                                    <Box
                                                        sx={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: '50%',
                                                            backgroundColor: option.color,
                                                        }}
                                                    />
                                                    <Typography sx={{ fontFamily: 'Nunito Sans', fontWeight: 600, fontSize: '14px', color: selectedGraphs.includes(option.id) ? 'rgba(80, 82, 178, 1)' : 'inherit' }}>
                                                        {option.label}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Box>
                            </Stack>

                        </Stack>

                        {loading ? <Box
                            sx={{
                                position: 'relative',
                                background: 'rgba(255, 255, 255, 0.8)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 1000,
                                overflow: 'hidden'
                            }}
                        >
                            <Box
                                sx={{
                                    border: '8px solid #f3f3f3',
                                    borderTop: '8px solid #4285f4',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    animation: 'spin 1s linear infinite',
                                    '@keyframes spin': {
                                        '0%': { transform: 'rotate(0deg)' },
                                        '100%': { transform: 'rotate(360deg)' },
                                    },
                                }}
                            />
                        </Box> : <LineChart
                            colors={filteredSeriescolor.map(s => colorMapping[s.id as keyof typeof colorMapping])}
                            xAxis={[{
                                scaleType: 'point',
                                data: formattedData,
                            }]}
                            yAxis={[
                                {
                                valueFormatter: (value) => {
                                    if (value >= 1000 && value < 1000000) {
                                      return `$${(value / 1000).toFixed(0)}k`; // Formats 10,000 as 10k
                                    } else if (value >= 1000000) {
                                      return `$${(value / 1000000).toFixed(1)}M`; // Formats 1,000,000 as 1.0M
                                    } else {
                                      return value.toString(); // Return smaller numbers without formatting
                                    }
                                  },
                                }
                              ]}
                            series={filteredSeries}
                            height={250}
                            margin={{ left: 70, right: 20, top: 20, bottom: 20 }}
                            grid={{ horizontal: true }}
                            sx={{ border: 'none' }}
                            slotProps={{ legend: { hidden: true } }}
                        />}

                    </CardContent>
                </Card>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', gap: 3, mt: 3, '@media (max-width: 900px)': { flexDirection: 'column' } }}>
                <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', '@media (max-width: 900px)': { width: '100%' } }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', '@media (max-width: 900px)': { flexDirection: 'column' } }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            backgroundColor: '#fff',
                            gap: 1.5,
                            mb: 2,
                            position: 'relative',

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
                                <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '700', fontSize: '22px', justifyContent: 'flex-end', mt: 1, fontFamily: 'Nunito Sans', lineHeight: '30.01px', color: 'rgba(32, 33, 36, 1)', '@media (max-width: 900px)': { flexDirection: 'row', alignItems: 'center', gap: 2 } }}>
                                    ${values.viewProducts ? values.viewProducts : 0} <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '14px', pb: 0.5, fontWeight: 500, lineHeight: '19.6px', textAlign: 'left', '@media (max-width: 900px)': { pt: 0.5 } }}>View Products</Typography>
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ border: '0.2px solid rgba(189, 189, 189, 1)', backgroundColor: 'rgba(250, 250, 246, 1)', maxHeight: '52px', mt: 0.5, borderRadius: '4px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', '@media (max-width: 900px)': { justifyContent: 'space-between', mb: 2 } }}>
                            <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '600', fontSize: '12px', justifyContent: 'flex-end', fontFamily: 'Nunito Sans', lineHeight: '16.08px', color: 'rgba(74, 74, 74, 1)' }}>
                                Average Order <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '16px', fontWeight: 700, lineHeight: '21.82px', color: 'rgba(32, 33, 36, 1)', textAlign: 'left' }}>${average_orders.averageViewProducts ? average_orders.averageViewProducts : 0}</Typography>
                            </Typography>
                            <Box
                                sx={{
                                    border: '0.5px solid rgba(189, 189, 189, 1)',
                                    height: '70%',
                                    width: '0.5%',
                                    marginLeft: 3,
                                    mr: 3,
                                    '@media (max-width: 900px)': {
                                        height: '30px',
                                        width: '0.5px',
                                    }
                                }}
                            />
                            <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '600', fontSize: '12px', justifyContent: 'flex-end', fontFamily: 'Nunito Sans', lineHeight: '16.08px', color: 'rgba(74, 74, 74, 1)', '@media (max-width: 900px)': { alignItems: 'end' } }}>
                                Total Orders <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '16px', fontWeight: 700, lineHeight: '21.82px', color: 'rgba(32, 33, 36, 1)', textAlign: 'left' }}>{total_orders.averageViewProducts ? total_orders.averageViewProducts : 0}</Typography>
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ mb: 3, boxShadow: '0px 2px 10px 0px rgba(0, 0, 0, 0.1)' }}>
                        <Card variant="outlined" sx={{ width: '100%' }}>
                            <CardContent>

                                {loading ? <Box
                                    sx={{
                                        position: 'relative',
                                        background: 'rgba(255, 255, 255, 0.8)',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        zIndex: 1000,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            border: '8px solid #f3f3f3',
                                            borderTop: '8px solid #4285f4',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            animation: 'spin 1s linear infinite',
                                            '@keyframes spin': {
                                                '0%': { transform: 'rotate(0deg)' },
                                                '100%': { transform: 'rotate(360deg)' },
                                            },
                                        }}
                                    />
                                </Box> : <LineChart
                                    colors={['rgba(255, 230, 180, 1)']}
                                    xAxis={[{
                                        scaleType: 'point',
                                        data: formattedData,
                                    }]}
                                    yAxis={[
                                        {
                                            valueFormatter: (value) => {
                                                if (value >= 1000 && value < 1000000) {
                                                  return `$${(value / 1000).toFixed(0)}k`; // Formats 10,000 as 10k
                                                } else if (value >= 1000000) {
                                                  return `$${(value / 1000000).toFixed(1)}M`; // Formats 1,000,000 as 1.0M
                                                } else {
                                                  return value.toString(); // Return smaller numbers without formatting
                                                }
                                              },
                                        }
                                    ]}
                                    series={viewedProductSeries}
                                    height={250}
                                    margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
                                    grid={{ horizontal: true }}
                                    sx={{
                                        border: 'none',
                                    }}
                                    slotProps={{
                                        legend: { hidden: true },
                                    }}
                                />}

                            </CardContent>
                        </Card>
                    </Box>
                </Box>

                <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', '@media (max-width: 900px)': { width: '100%' } }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', '@media (max-width: 900px)': { flexDirection: 'column' } }}>
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
                                <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '700', fontSize: '22px', justifyContent: 'flex-end', mt: 1, fontFamily: 'Nunito Sans', lineHeight: '30.01px', color: 'rgba(32, 33, 36, 1)', '@media (max-width: 900px)': { flexDirection: 'row', alignItems: 'center', gap: 2 } }}>
                                    ${values.totalAbandonedCart ? values.totalAbandonedCart : 0} <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '14px', pb: 0.5, fontWeight: 500, lineHeight: '19.6px', textAlign: 'left' }}>Add to cart</Typography>
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ border: '0.2px solid rgba(189, 189, 189, 1)', backgroundColor: 'rgba(250, 250, 246, 1)', maxHeight: '52px', mt: 0.5, borderRadius: '4px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', '@media (max-width: 900px)': { justifyContent: 'space-between', mb: 2 } }}>
                            <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '600', fontSize: '12px', justifyContent: 'flex-end', fontFamily: 'Nunito Sans', lineHeight: '16.08px', color: 'rgba(74, 74, 74, 1)' }}>
                                Average Order <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '16px', fontWeight: 700, lineHeight: '21.82px', color: 'rgba(32, 33, 36, 1)', textAlign: 'left' }}>${average_orders.averageAddToCart ? average_orders.averageAddToCart : 0}</Typography>
                            </Typography>
                            <Box
                                sx={{
                                    border: '0.5px solid rgba(189, 189, 189, 1)',
                                    height: '70%',
                                    width: '0.5%',
                                    marginLeft: 3,
                                    mr: 3,
                                    '@media (max-width: 900px)': {
                                        height: '30px',
                                        width: '0.5px',
                                    }
                                }}
                            />
                            <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '600', fontSize: '12px', justifyContent: 'flex-end', fontFamily: 'Nunito Sans', lineHeight: '16.08px', color: 'rgba(74, 74, 74, 1)', '@media (max-width: 900px)': { alignItems: 'end' } }}>
                                Total Orders <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '16px', fontWeight: 700, lineHeight: '21.82px', color: 'rgba(32, 33, 36, 1)', textAlign: 'left' }}>{total_orders.averageAddToCart ? total_orders.averageAddToCart : 0}</Typography>
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ mb: 3, boxShadow: '0px 2px 10px 0px rgba(0, 0, 0, 0.1)' }}>
                        <Card variant="outlined" sx={{ width: '100%' }}>
                            <CardContent>
                                {loading ? <Box
                                    sx={{
                                        position: 'relative',
                                        background: 'rgba(255, 255, 255, 0.8)',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        zIndex: 1000,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            border: '8px solid #f3f3f3',
                                            borderTop: '8px solid #4285f4',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            animation: 'spin 1s linear infinite',
                                            '@keyframes spin': {
                                                '0%': { transform: 'rotate(0deg)' },
                                                '100%': { transform: 'rotate(360deg)' },
                                            },
                                        }}
                                    />
                                </Box> :
                                    <LineChart
                                        colors={['rgba(180, 218, 193, 1)']}
                                        xAxis={[{ scaleType: 'point', data: formattedData }]}
                                        yAxis={[
                                        {
                                            valueFormatter: (value) => {
                                                if (value >= 1000 && value < 1000000) {
                                                  return `$${(value / 1000).toFixed(0)}k`; // Formats 10,000 as 10k
                                                } else if (value >= 1000000) {
                                                  return `$${(value / 1000000).toFixed(1)}M`; // Formats 1,000,000 as 1.0M
                                                } else {
                                                  return value.toString(); // Return smaller numbers without formatting
                                                }
                                              },
                                        }
                                    ]}
                                        series={addToCartSeries}
                                        height={250}
                                        margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
                                        grid={{ horizontal: true }}
                                        sx={{
                                            border: 'none',
                                        }}
                                        slotProps={{
                                            legend: { hidden: true },
                                        }}
                                    />}
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', gap: 3, '@media (max-width: 900px)': { flexDirection: 'column' } }}>
                <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', '@media (max-width: 900px)': { width: '100%' } }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', '@media (max-width: 900px)': { flexDirection: 'column' } }}>
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
                                <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '700', fontSize: '22px', justifyContent: 'flex-end', mt: 1, fontFamily: 'Nunito Sans', lineHeight: '30.01px', color: 'rgba(32, 33, 36, 1)', '@media (max-width: 900px)': { flexDirection: 'row', alignItems: 'center', gap: 2 } }}>
                                    ${values.totalVisitors ? values.totalVisitors : 0} <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '14px', pb: 0.5, fontWeight: 500, lineHeight: '19.6px', textAlign: 'left' }}>Total Visitors</Typography>
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ border: '0.2px solid rgba(189, 189, 189, 1)', backgroundColor: 'rgba(250, 250, 246, 1)', maxHeight: '52px', mt: 0.5, borderRadius: '4px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', '@media (max-width: 900px)': { justifyContent: 'space-between', mb: 2 } }}>
                            <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '600', fontSize: '12px', justifyContent: 'flex-end', fontFamily: 'Nunito Sans', lineHeight: '16.08px', color: 'rgba(74, 74, 74, 1)' }}>
                                Average Order <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '16px', fontWeight: 700, lineHeight: '21.82px', color: 'rgba(32, 33, 36, 1)', textAlign: 'left' }}>${average_orders.averageVisitors ? average_orders.averageVisitors : 0}</Typography>
                            </Typography>
                            <Box
                                sx={{
                                    border: '0.5px solid rgba(189, 189, 189, 1)',
                                    height: '70%',
                                    width: '0.5%',
                                    marginLeft: 3,
                                    mr: 3,
                                    '@media (max-width: 900px)': {
                                        height: '30px',
                                        width: '0.5px',
                                    }
                                }}
                            />
                            <Typography component='div' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', fontWeight: '600', fontSize: '12px', justifyContent: 'flex-end', fontFamily: 'Nunito Sans', lineHeight: '16.08px', color: 'rgba(74, 74, 74, 1)', '@media (max-width: 900px)': { alignItems: 'end' } }}>
                                Total Orders <Typography component='span' sx={{ fontFamily: 'Nunito Sans', fontSize: '16px', fontWeight: 700, lineHeight: '21.82px', color: 'rgba(32, 33, 36, 1)', textAlign: 'left' }}>{total_orders.averageVisitors ? total_orders.averageVisitors : 0}</Typography>
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ mb: 3, boxShadow: '0px 2px 10px 0px rgba(0, 0, 0, 0.1)' }}>
                        <Card variant="outlined" sx={{ width: '100%' }}>
                            <CardContent>
                                {loading ? <Box
                                    sx={{
                                        position: 'relative',
                                        background: 'rgba(255, 255, 255, 0.8)',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        zIndex: 1000,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            border: '8px solid #f3f3f3',
                                            borderTop: '8px solid #4285f4',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            animation: 'spin 1s linear infinite',
                                            '@keyframes spin': {
                                                '0%': { transform: 'rotate(0deg)' },
                                                '100%': { transform: 'rotate(360deg)' },
                                            },
                                        }}
                                    />
                                </Box> :
                                    <LineChart
                                        colors={['rgba(181, 218, 248, 1)']}
                                        xAxis={[{ scaleType: 'point', data: formattedData, }]}
                                        yAxis={[
                                        {
                                            valueFormatter: (value) => {
                                                if (value >= 1000 && value < 1000000) {
                                                  return `$${(value / 1000).toFixed(0)}k`; // Formats 10,000 as 10k
                                                } else if (value >= 1000000) {
                                                  return `$${(value / 1000000).toFixed(1)}M`; // Formats 1,000,000 as 1.0M
                                                } else {
                                                  return value.toString(); // Return smaller numbers without formatting
                                                }
                                              },
                                        }
                                    ]}
                                        series={visitorSeries}
                                        height={250}
                                        margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
                                        grid={{ horizontal: true }}
                                        sx={{
                                            border: 'none',
                                        }}
                                        slotProps={{
                                            legend: { hidden: true },
                                        }}
                                    />}
                            </CardContent>
                        </Card>
                    </Box>
                </Box>

                <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', '@media (max-width: 900px)': { width: '100%' } }}>
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
                            sx={{ display: 'flex', flexDirection: 'row', gap: '0px', flexGrow: 1, justifyContent: 'center', width: '100%' }}
                        >
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box className='third-sub-title' sx={{ display: 'flex', alignItems: 'start', justifyContent: 'center', width: '100%',
                                    '@media (max-width: 460px)': {
                                        fontSize: '8px !important'
                                    }
                                 }}>
                                    <PieChart
                                        colors={country_color}
                                        margin={{
                                            left: 100,
                                            right: 40,
                                            top: 80,
                                            bottom: 80,
                                        }}
                                        series={[
                                            {
                                                type: 'pie',
                                                arcLabel: (item) => {
                                                    const percentage = ((item.value / totalValue) * 100).toFixed(2);
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
                                        height={isMobile ? 200 : 260}
                                        width={isMobile ? 200 : 260}
                                        
                                        slotProps={{
                                            legend: { hidden: true },
                                        }}
                                    >
                                    </PieChart>
                                </Box>
                            </CardContent>

                            <Stack sx={{ padding: 2, display: 'flex', alignItems: 'start', justifyContent: 'center' }}>
                                {distribution.map((type, index) => (
                                    <Stack
                                        key={index}
                                        direction="row"
                                        sx={{ alignItems: 'start', gap: 2, pb: 2 }}
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
                                                <Typography variant="body2" className="paragraph" sx={{ lineHeight: '11.72px !important', color: 'rgba(32, 33, 36, 1) !important', textAlign: 'left', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.5,
                                                    '@media (max-width: 460px)': {
                                                        fontSize: '10px !important'
                                                    }
                                                 }}>
                                                    <Box
                                                        sx={{
                                                            width: 12,
                                                            height: 12,
                                                            borderRadius: '50%',
                                                            backgroundColor: type.color,
                                                        }}
                                                    /> {type.name}
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
                                    <Image src={'/meta-icon.svg'} alt={'Meta'} width={19.46} height={13} />
                                </Box>
                                <Typography variant="h4" component="div" sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito Sans', fontSize: '14px', fontWeight: 500, lineHeight: '19.6px', textAlign: 'left', gap: 1 }}>
                                    Meta Contacts <Typography component="span" sx={{ fontFamily: 'Nunito Sans', color: 'rgba(74, 74, 74, 1)', fontSize: '22px', fontWeight: 600, lineHeight: '30.01px', textAlign: 'left' }}>$22,301</Typography>
                                </Typography>
                            </Stack>

                        </Stack>

                        {/* <LineChart
                            colors={['rgba(5, 104, 225, 1)']}
                            xAxis={[{ scaleType: 'point', data, tickInterval: (index, i) => (i + 1) % 5 === 0 }]} yAxis={[
                                {
                                    valueFormatter: (value) => {
                                        if (value >= 1000 && value < 1000000) {
                                          return `$${(value / 1000).toFixed(0)}k`; // Formats 10,000 as 10k
                                        } else if (value >= 1000000) {
                                          return `$${(value / 1000000).toFixed(1)}M`; // Formats 1,000,000 as 1.0M
                                        } else {
                                          return value.toString(); // Return smaller numbers without formatting
                                        }
                                      },
                                }
                            ]}
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

                        </LineChart> */}

                    </CardContent>
                </Card>
            </Box>
            {loading && (<CustomizedProgressBar />)}
        </Box>
    )
};



export default DashboardRevenue;