import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, TextField, Button, Card, CardContent, IconButton, Stack, SelectChangeEvent } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { showToast } from "./ToastNotification";
import CustomizedProgressBar from "./CustomizedProgressBar";
import { ShowChart, BarChart } from "@mui/icons-material";
import { LineChart } from '@mui/x-charts/LineChart';
// import { BarChart } from '@mui/x-charts/BarChart';

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


const DashboardContact: React.FC = () => {

    const [chartType, setChartType] = useState<'line' | 'bar'>('line');

    // Функция для переключения типа графика
    const toggleChartType = (type: 'line' | 'bar') => {
        setChartType(type);
    };

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
            [seriesId]: !prev[seriesId],
        }));
    };

    const options = [
        { id: 'revenue', label: 'Total Revenue', color: 'rgba(180, 218, 193, 1)' },
        { id: 'visitors', label: 'Total Visitors', color: 'rgba(252, 229, 204, 1)' },
        { id: 'viewed_product', label: 'View Products', color: 'rgba(201, 218, 248, 1)' },
        { id: 'abondoned_cart', label: 'Abandoned cart', color: 'rgba(254, 238, 236, 1)' },
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
    ].filter((s) => visibleSeries[s.id as keyof VisibleSeries]);
    const filteredSeries = series.filter((s) => visibleSeries[s.id as keyof VisibleSeries]) as [];

    return (
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
                        <Typography variant="h4" component="div" className="second-sub-title" sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', fontWeight: '600 !important', lineHeight: '19.1px !important', textWrap: 'nowrap', textAlign: 'left', gap: 1, '@media (max-width: 900px)': { flexDirection: 'row', width: '100%', textWrap: 'nowrap' } }}>
                            Total Revenue -
                            <Typography component="span" sx={{ fontFamily: 'Nunito Sans', color: 'rgba(74, 74, 74, 1)', fontSize: '22px', fontWeight: 600, lineHeight: '30.01px', textAlign: 'left' }}>$22,301</Typography>
                        </Typography>
                        {/* Иконки для переключения типа графика */}
                        <IconButton onClick={() => toggleChartType('line')} color={chartType === 'line' ? 'primary' : 'default'}>
                            <ShowChart />
                        </IconButton>
                        <IconButton onClick={() => toggleChartType('bar')} color={chartType === 'bar' ? 'primary' : 'default'}>
                            <BarChart />
                        </IconButton>
                    </Stack>

                    {/* Ваши Chip и Select компоненты здесь */}

                </Stack>

                {/* Рендеринг графика в зависимости от состояния */}
                {chartType === 'line' ? (
                    <LineChart
                        colors={series.map(s => colorMapping[s.id as keyof typeof colorMapping])}
                        xAxis={[{ scaleType: 'point', data, tickInterval: (index, i) => (i + 1) % 5 === 0 }]}
                        yAxis={[
                            {
                                valueFormatter: (value) => `${value}$`, // Форматируем значения с добавлением $
                            }
                        ]}
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
                ) : (
                    // <BarChartComponent
                    //     height={250}
                    //     margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
                    // />
                    <Typography> 
                        End
                    </Typography>
                )}
            </CardContent>
        </Card>
    )
}


export default DashboardContact;