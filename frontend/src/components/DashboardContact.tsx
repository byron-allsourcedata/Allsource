import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, TextField, Button, Card, CardContent, IconButton, Stack, SelectChangeEvent, Chip, MenuItem, Select } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { showToast } from "./ToastNotification";
import Image from "next/image";
import CustomizedProgressBar from "./CustomizedProgressBar";
import { ShowChart, BarChart as IconBarChart } from "@mui/icons-material";
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import StatsCard from "./StatCardContact";

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

const CustomIcon = () => (
    <Image src="/arrow_down.svg" alt="arrow down" width={16} height={16} />
);


interface AppliedDates {
    start: Date | null;
    end: Date | null;
}

interface DashboardContactProps {
    appliedDates: AppliedDates;
}

const DashboardContact: React.FC<DashboardContactProps> = ({ appliedDates }) => {
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');
    const [values, setValues] = useState({
        totalContact: 0,
        totalVisitors: 0,
        viewProducts: 0,
        totalAbandonedCart: 0,
      });

    const previousDates = useRef<AppliedDates>({ start: null, end: null });

    useEffect(() => {
        const fetchData = async () => {
            if (appliedDates.start && appliedDates.end) {
                const fromUnix = Math.floor(appliedDates.start.getTime() / 1000);
                const toUnix = Math.floor(appliedDates.end.getTime() / 1000);

                try {
                    const response = await axiosInstance.get("/dashboard/contact", {
                        params: { from_date: fromUnix, to_date: toUnix },
                    });
                    console.log(response.data);
                    const { total_contacts_collected, total_visitors, total_view_products, total_abandoned_cart } = response.data.total_counts;
                    setValues({
                        totalContact: total_contacts_collected,
                        totalVisitors: total_visitors,
                        viewProducts: total_view_products,
                        totalAbandonedCart: total_abandoned_cart,
                      });
                } catch (error) {
                    console.error("Error fetching contact data:", error);
                }
            }
        };

        if (
            appliedDates.start?.getTime() !== previousDates.current.start?.getTime() ||
            appliedDates.end?.getTime() !== previousDates.current.end?.getTime()
        ) {
            fetchData();
            previousDates.current = appliedDates;
        }
    }, [appliedDates]);

    const toggleChartType = (type: 'line' | 'bar') => {
        setChartType(type);
    };

    const data = getDaysInMonth(10, 2024);

    const colorPalette = [
        'rgba(244, 87, 69, 1)',
        'rgba(80, 82, 178, 1)',
        'rgba(224, 176, 5, 1)',
        'rgba(144, 190, 109, 1)'
    ];

    const colorMapping = {
        contacts: 'rgba(244, 87, 69, 1)',
        visitors: 'rgba(80, 82, 178, 1)',
        viewed_product: 'rgba(224, 176, 5, 1)',
        abondoned_cart: 'rgba(144, 190, 109, 1)',
    };

    type VisibleSeries = {
        contacts: boolean;
        visitors: boolean;
        viewed_product: boolean;
        abondoned_cart: boolean;
    };

    const [visibleSeries, setVisibleSeries] = useState<VisibleSeries>({
        contacts: true,
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
        { id: 'contacts', label: 'Total Contacts', color: 'rgba(244, 87, 69, 1)' },
        { id: 'visitors', label: 'Total Visitors', color: 'rgba(80, 82, 178, 1)' },
        { id: 'viewed_product', label: 'View Products', color: 'rgba(224, 176, 5, 1)' },
        { id: 'abondoned_cart', label: 'Abandoned cart', color: 'rgba(144, 190, 109, 1)' },
    ];

    const selectedGraphs = options
        .filter((option) => visibleSeries[option.id as keyof VisibleSeries])
        .map((option) => option.id);

    const handleToggleSeries = (event: SelectChangeEvent<string[]>) => {
        const selectedValues = event.target.value as string[];

        setVisibleSeries((prev) => {
            const updatedVisibleSeries: VisibleSeries = { ...prev };

            if (selectedValues.includes("All contacts type")) {
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
            id: 'contacts' as keyof typeof colorMapping,
            label: 'Total Contacts',
            curve: 'linear',
            stack: 'total',
            showMark: false,
            area: false,
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
            area: false,
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
            area: false,
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
            area: false,
            stackOrder: 'ascending',
            data: [1000, 1500, 2200, 2700, 2800, 2900, 2500, 1200, 1300, 2800, 2500,
                3000, 3400, 3700, 3200, 3900, 4100, 3500, 4300, 4500, 4000, 4700,
                5000, 5200, 4800, 5400, 5600, 5900, 6100, 6300, 7800],
        },
    ].filter((s) => visibleSeries[s.id as keyof VisibleSeries]);
    const filteredSeries = series.filter((s) => visibleSeries[s.id as keyof VisibleSeries]) as [];

    return (
        <>
            <Box sx={{ width: '100%', mt: 1, mb: 1, '@media (max-width: 900px)': { mt: 0, mb: 0, } }}>
                <StatsCard values={values}/>
            </Box>
            <Card variant="outlined" sx={{ width: '100%' }}>
                <CardContent>
                    <Stack sx={{ justifyContent: 'space-between', flexDirection: 'row', '@media (max-width: 900px)': { flexDirection: 'column', justifyContent: 'center', alignItems: 'start' } }}>
                        <Stack
                            direction="row"
                            sx={{
                                alignContent: { xs: 'center', sm: 'flex-start' },
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            {/* Иконки для переключения типа графика */}
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5 }}>
                                <IconButton
                                    onClick={() => toggleChartType('line')}
                                    sx={{
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '4px', // Квадратная форма
                                        border: `1.5px solid ${chartType === 'line' ? 'rgba(80, 82, 178, 1)' : 'rgba(115, 115, 115, 1)'}`,
                                        color: chartType === 'line' ? 'rgba(80, 82, 178, 1)' : 'rgba(115, 115, 115, 1)',
                                    }}
                                >
                                    <ShowChart sx={{ fontSize: '16px' }} />
                                </IconButton>

                                <IconButton
                                    onClick={() => toggleChartType('bar')}
                                    sx={{
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '4px', // Квадратная форма
                                        border: `1.5px solid ${chartType === 'bar' ? 'rgba(80, 82, 178, 1)' : 'rgba(115, 115, 115, 1)'}`,
                                        color: chartType === 'bar' ? 'rgba(80, 82, 178, 1)' : 'rgba(115, 115, 115, 1)',
                                    }}
                                >
                                    <IconBarChart sx={{ fontSize: '16px' }} />
                                </IconButton>
                            </Box>
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
                                    label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, }}>
                                        <Box
                                            sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                backgroundColor: colorPalette[index],
                                            }} />
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
                                    </Box>}
                                    onClick={() => handleChipClick(seriesId as keyof VisibleSeries)}
                                    sx={{
                                        cursor: 'pointer',
                                        backgroundColor: visibleSeries[seriesId as keyof VisibleSeries] ? 'rgba(237, 237, 247, 1)' : '#fff',
                                        borderRadius: '4px',
                                        maxHeight: '25px',
                                        border: 'none',
                                        '@media (max-width: 900px)': { display: 'none' }
                                    }}
                                    variant={visibleSeries[seriesId as keyof VisibleSeries] ? 'filled' : 'outlined'} />
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
                                            ? 'All contacts type'
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
                                    <MenuItem value="All contacts type">
                                        <Typography
                                            sx={{
                                                fontFamily: 'Nunito Sans',
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                color: selectedGraphs.length == 4 ? 'rgba(80, 82, 178, 1)' : 'inherit' // Изменяем цвет текста
                                            }}
                                        >
                                            All contacts type
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
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, }}>
                                                <Box
                                                    sx={{
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: '50%',
                                                        backgroundColor: option.color,
                                                    }} />
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

                    {/* Рендеринг графика в зависимости от состояния */}
                    {chartType === 'line' ? (
                        <LineChart
                            colors={series.map(s => colorMapping[s.id as keyof typeof colorMapping])}
                            xAxis={[{ scaleType: 'point', data, tickInterval: (index, i) => (i + 1) % 5 === 0 }]}
                            yAxis={[
                                {
                                    valueFormatter: (value) => {
                                        if (value >= 1000 && value < 1000000) {
                                            return `${(value / 1000).toFixed(0)}k`; // Formats 10,000 as 10k
                                        } else if (value >= 1000000) {
                                            return `${(value / 1000000).toFixed(1)}M`; // Formats 1,000,000 as 1.0M
                                        } else {
                                            return value.toString(); // Return smaller numbers without formatting
                                        }
                                        },
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
                        <BarChart
                            height={350}
                            colors={series.map(s => colorMapping[s.id as keyof typeof colorMapping])}
                            xAxis={[{ scaleType: 'band', data: data }]} // Дни по оси X
                            yAxis={[
                                {
                                    valueFormatter: (value) => {
                                        if (value >= 1000 && value < 1000000) {
                                          return `${(value / 1000).toFixed(0)}k`; // Formats 10,000 as 10k
                                        } else if (value >= 1000000) {
                                          return `${(value / 1000000).toFixed(1)}M`; // Formats 1,000,000 as 1.0M
                                        } else {
                                          return value.toString(); // Return smaller numbers without formatting
                                        }
                                      },
                                }
                            ]}
                            series={series.map((s) => ({ data: s.data, label: s.label }))} // Здесь важна правильная структура данных для отображения рядом
                            grid={{ horizontal: true }}
                            margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
                            borderRadius={3}
                            slotProps={{
                                legend: { hidden: true },
                            }} />

                    )}
                </CardContent>
            </Card></>
    )
}


export default DashboardContact;