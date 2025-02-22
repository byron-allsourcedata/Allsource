import React, {useState} from 'react';
import {
    Box,
    Typography,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Slider
} from '@mui/material';

const audienceSize = [
    { id: "almost", label: "Almost identical", text: 'Lookalike size 0-3%', min_value: 0, max_value: 3 },
    { id: "extremely", label: "Extremely Similar", text: 'Lookalike size 3-7%', min_value: 3, max_value: 7 },
    { id: "very", label: "Very similar", text: 'Lookalike size 7-10%', min_value: 7, max_value: 10 },
    { id: "quite", label: "Quite similar", text: 'Lookalike size 10-15%', min_value: 10, max_value: 15 },
    { id: "broad", label: "Broad", text: 'Lookalike size 15-20%', min_value: 15, max_value: 20 },
];

const CreateLookalikePage: React.FC = () => {
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [sliderValue, setSliderValue] = useState<number[]>([0, 20]);
    const [currentStep, setCurrentStep] = useState(1);
    const [inputText, setInputText] = useState('');

    const handleSelectSize = (id: string, min_value: number, max_value: number) => {
        setSelectedSize(id);
        setSliderValue([min_value, max_value]);

        // Проверяем, выбран ли пункт "Very similar" и если да, то вызываем handleNext
        if (id === "very") {
            handleNext();
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(event.target.value);
    };

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        const value = newValue as number;
        setSliderValue(newValue as number[]);
        setSelectedSize('')
    };

    const handleCancel = () => {
        // setSelectedSource('')
        // setSelectedType(audienceType.map(source => source.id))
        setSelectedSize('')
        setSliderValue([0,20])
        setCurrentStep(1)
    }

    const handleNext = () => {
        setCurrentStep((prev) => prev + 1);
    };

    return (
        <Box sx={{  width: '100vw'}}>
        <Box sx={{ width: '90%', padding: 3, backgroundColor: 'white', color: '#202124' }}>
            {/* Заголовок */}
            <Typography
                variant="h1"
                sx={{
                    fontFamily: 'Nunito Sans',
                    fontWeight: 700,
                    fontSize: '19px',
                    lineHeight: '25.92px',
                    letterSpacing: '0%',
                    marginBottom: 2,
                    textAlign: 'left',
                }}
            >
                Create Lookalike
            </Typography>

            {/* Блок с таблицей Source */}
            {currentStep >= 1 && (
            <Box
                sx={{
                    textAlign: "left",
                    padding: "16px 20px 20px 20px",
                    borderRadius: "6px",
                    border: "1px solid #E4E4E4",
                    backgroundColor: "white",

                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontFamily: "Nunito Sans",
                        fontWeight: 500,
                        fontSize: "16px",
                        lineHeight: "22.5px",
                        marginBottom: 2,
                    }}
                >
                    Source
                </Typography>

                <TableContainer
                    component={Paper}
                    sx={{
                        width: "auto",
                        boxShadow: "none",
                        borderRadius: "4px",
                        border: "1px solid #EBEBEB",

                        padding: "16px",
                    }}
                >
                    <Table sx={{ borderCollapse: "separate", borderSpacing: "0 8px" }}>
                        <TableHead
                            sx={{
                                "& .MuiTableCell-root": {
                                    fontFamily: "Nunito Sans",
                                    fontWeight: 600,
                                    fontSize: "12px",
                                    lineHeight: "16.8px",
                                    letterSpacing: "0%",
                                    border: "none",
                                    padding: "0",
                                    color: "#202124",
                                },
                            }}
                        >
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Source</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Created date</TableCell>
                                <TableCell>Created By</TableCell>
                                <TableCell>Number of Customers</TableCell>
                                <TableCell>Matched Records</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody
                            sx={{
                                "& .MuiTableCell-root": {
                                    fontFamily: "Roboto",
                                    fontWeight: 400,
                                    fontSize: "12px",
                                    lineHeight: "16.8px",
                                    letterSpacing: "0%",
                                    border: "none",
                                    padding: "0",
                                    color: "#5F6368",
                                },
                            }}
                        >
                            <TableRow>
                                <TableCell>My Orders</TableCell>
                                <TableCell>CSV File</TableCell>
                                <TableCell>Customer Conversions</TableCell>
                                <TableCell>Oct 01, 2024</TableCell>
                                <TableCell>Mikhail Sofin</TableCell>
                                <TableCell>10,000</TableCell>
                                <TableCell>7,523</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
            )}
            <Box sx={{ width: "100%", display: "flex", justifyContent: "end", gap: 2}}>
                {currentStep === 1 && (
                    <Box sx={{ width: "100%", display: "flex", justifyContent: "end", gap: 2,  mt: 2  }}>
                        <Button
                            variant="outlined"
                            sx={{
                                marginRight: '16px',
                                textTransform: 'none',
                                color: '#5052B2',
                                height: "40px",
                                borderColor: '#5052B2',
                                backgroundColor: '#FFFFFF',
                                fontFamily: 'Nunito Sans',
                                fontWeight: 500,
                                fontSize: "14px",
                                lineHeight: "19.6px",
                                letterSpacing: "0%",
                            }}>
                            Add another Source
                        </Button>

                        <Button
                            sx={{
                                border: '1px #5052B2 solid',
                                color: '#FFFFFF',
                                backgroundColor: '#5052B2',
                                textTransform: 'none',
                                height: "40px",
                                fontFamily: 'Nunito Sans',
                                fontWeight: 600,
                                fontSize: "14px",
                                lineHeight: "19.6px",
                                letterSpacing: "0%",
                                '&:hover': {
                                    border: '1px #5052B2 solid',
                                    backgroundColor: '#5052B2',
                                }
                            }}
                            variant="outlined"
                            onClick={handleNext}
                        >
                            <Typography padding={'0.5rem 2rem'} fontSize={'0.8rem'}>Create lookalike</Typography>
                        </Button>
                    </Box>

                )}
            </Box>

            {currentStep >= 2 && (
            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'start'}}>
                <Box sx={{ border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '6px', width: '100%', display: 'flex', flexDirection: 'column', padding: '18px', gap: '8px', mt: 2 }}>
                    <Typography className="second-sub-title"> Choose lookalike size </Typography>
                    <Typography className="paragraph">
                        Fine-tune your targeting! Choose the size of your lookalike audience to match your marketing goals.
                    </Typography>

                    <Box sx={{ display: "flex", flexDirection: "row", gap: 2, pt: 2 }}>
                        {audienceSize.map((source) => (
                            <Box key={source.id} sx={{ position: "relative" }}>
                                {source.id === "extremely" && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: "-19px",
                                            left: "34%",
                                            transform: "translateX(-50%)",
                                            backgroundColor: "#009970",
                                            color: "#FFFFFF",
                                            fontSize: "10px",
                                            fontWeight: "bold",
                                            padding: "4px 8px",
                                            borderRadius: "6px 6px 0 0",
                                            whiteSpace: "nowrap",
                                            minWidth: "80px",
                                            textAlign: "center",
                                        }}
                                    >
                                        Recommended
                                    </Box>
                                )}
                                <Button
                                    key={source.id}
                                    onClick={() => handleSelectSize(source.id, source.min_value, source.max_value)}
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        border: selectedSize === source.id ? "1px solid #1976d2" : "1px solid rgba(208, 213, 221, 1)",
                                        gap: "10px",
                                        padding: "0.6rem 0.5rem",
                                        borderRadius: "4px",
                                        textTransform: "none",
                                    }}
                                >
                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                        <Typography className="paragraph" sx={{ color: 'rgba(32, 33, 36, 1) !important' }}>{source.label}</Typography>
                                        <Typography className="paragraph" sx={{ fontSize: '12px !important' }}>{source.text}</Typography>
                                    </Box>

                                </Button>
                            </Box>

                        ))}
                    </Box>

                    <Box sx={{ width: '100%', mt: 0 }}>
                        <Slider
                            value={sliderValue}
                            onChange={handleSliderChange}
                            min={0}
                            max={20}
                            step={1}
                            valueLabelDisplay="auto"
                            sx={{
                                color: 'rgba(80, 82, 178, 1)',
                            }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                                0%
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                                10%
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                                20%
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
                )}
            {currentStep >= 3 && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: "6px",
                        border: "1px solid #E4E4E4",
                        backgroundColor: "white",
                        padding: "24px 20px",
                        mt: 2
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{
                            fontWeight: 'bold',
                            fontSize: '19px',
                            fontFamily: 'Nunito Sans',
                            letterSpacing: '0%',
                            paddingRight: '20px',
                            color: '#000000',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Create Name
                    </Typography>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="name"
                        value={inputText}
                        onChange={handleInputChange}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                paddingLeft: '8px',
                                width: '40%',
                                height: '40px',
                            },
                            '& .MuiInputBase-input': {
                                fontFamily: 'Nunito Sans',
                                fontWeight: 400,
                                fontSize: '14px',
                                lineHeight: '20px',
                            },
                        }}
                    />
                </Box>
                )}
        </Box>
            {currentStep >= 2 && (
                <Box sx={{ display: 'flex', justifyContent: 'end', gap: 2, borderTop: '1px solid rgba(228, 228, 228, 1)', mt: 2, pr: 2, pt: '0.5rem' }}>
                    <Button
                        sx={{
                            border: '1px #5052B2 solid',
                            color: '#5052B2',
                            backgroundColor: '#FFFFFF',
                            textTransform: 'none',
                            mt: 1,
                            '&:hover': {
                                border: '1px #5052B2 solid',
                                backgroundColor: '#FFFFFF'
                            }
                        }}
                        variant="outlined"
                        onClick={handleCancel}
                    >
                        <Typography padding={'0.5rem 2rem'} fontSize={'0.8rem'}>Cancel</Typography>
                    </Button>
                    <Button
                        sx={{
                            border: '1px #5052B2 solid',
                            color: '#FFFFFF',
                            backgroundColor: '#5052B2',
                            textTransform: 'none',
                            gap: 0,
                            mt: 1,
                            opacity: inputText.trim() === '' ? 0.7 : 1, // Прозрачность для неактивной кнопки
                            '&:hover': {
                                border: '1px #5052B2 solid',
                                backgroundColor: '#5052B2'
                            }
                        }}
                        variant="outlined"
                        disabled={inputText.trim() === ''}
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0.5rem 1rem', gap: 1 }}>
                            <Typography fontSize={'0.8rem'}>Generate lookalike</Typography>
                        </Box>
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default CreateLookalikePage;
