import React from "react";
import { Box, Button, Grid, Typography } from "@mui/material";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import { Field } from "@/types";
import  DragAndDropTable  from "./DragAndDropTable";
import { Stepper, Step, StepLabel, StepButton } from '@mui/material';
import { ResetProvider, useResetContext } from "@/context/ResetContext";

interface OrderFieldsStepProps {
    fields: Field[];
    handlePrevStep: () => void;
    onOrderChange: (newOrder: Field[]) => void;
}

const OrderFieldsStep: React.FC<OrderFieldsStepProps> = ({
    fields,
    handlePrevStep,
    onOrderChange,
}) => {
    React.useEffect(() => {
    }, []);
    const [activeStep, setActiveStep] = React.useState(1);
    const { atDefault, userInteracted, resetAll } = useResetContext();
    const handleStep = (step: number) => () => {
        setActiveStep(step);
        if (step === 0) {
            handlePrevStep();
        }
      };

    return (
        <Box
            sx={{
                border: "1px solid #E4E4E4",
                borderRadius: "6px",
                bgcolor: "white",
                p: 2,
                mt: 2,
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2, ml: 1, width: "600px", justifyContent: "space-between" }}>
            <Stepper 
                activeStep={activeStep}
                nonLinear
                sx={{
                ml: 0,
                }}
                >
                {['Select fields', 'Order fields'].map((label, index) => (
                <Step key={label} sx={{pl: 0}}>
                    <StepButton onClick={handleStep(index)} sx={{
                        "&:after": {
                        content:'""',
                        backgroundColor: "rgba(212, 212, 212, 1)",
                        width: "80px",
                        marginLeft: "8px",
                        height: "1px",
                        display: index === 0 ? "block" : "none",
                        },
                    
                    '& .MuiStepLabel-label': {
                        color: index === activeStep ? 'rgba(51, 51, 51, 1)' : 'rgba(212, 212, 212, 1)',
                        fontWeight: 500,
                        fontFamily: "Nunito Sans",
                        fontSize: '14px',
                        },
                        '& .MuiStepIcon-root': {
                        color: index === 1 ? 'rgba(56, 152, 252, 1)' : 'rgba(212, 212, 212, 1)',
                        },
                    }}>
                    {label}
                    </StepButton>
                </Step>
                ))}
            </Stepper>
            <Button
                    onClick={resetAll}
                    disabled={atDefault}
                    sx={{
                      border: "1px #5052B2 solid",
                      color: "#5052B2",
                      backgroundColor: "#FFFFFF",
                      textTransform: "none",
                      "&:hover": {
                        border: "1px #5052B2 solid",
                        backgroundColor: "#FFFFFF",
                      },
                    }}
                    variant="outlined"
                  >
                    <Typography  fontSize="0.8rem">
                      Set recommended
                    </Typography>
                  </Button>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={7}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontFamily: "Nunito Sans",
                            fontWeight: 500,
                            fontSize: "16px",
                            lineHeight: "22.5px",
                            mb: 1,
                            ml: 1,
                        }}
                    >
                        Select and order predictable fields
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontSize: "14px",
                            color: "text.secondary",
                            mb: 1,
                            ml: 1,
                        }}
                    >
                        You can configure the predictable fields that will be used for audience
                        building yourself.
                    </Typography>
                </Grid>
                <Grid item xs={5}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontFamily: "Nunito Sans",
                            fontWeight: 500,
                            fontSize: "16px",
                            lineHeight: "22.5px",
                            mb: 1,
                            ml: 1,
                        }}
                    >
                        How to order your fields?
                    </Typography>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <DragAndDropTable fields={fields} onOrderChange={onOrderChange} />
                </Grid>
                <Grid item xs={12} md={1} />
                <Grid item xs={12} md={5} sx={{ borderLeft: "1px solid #E4E4E4" }}>
                    <Box sx={{ p: 0, bgcolor: "transparent" }}>
                        <Typography
                            variant="body2"
                            sx={{
                                fontSize: "14px",
                                color: "text.secondary",
                                mb: 2,
                            }}
                        >
                            Once you&apos;ve selected the fields you want to work with, you&apos;ll
                            move on to the next step, where you can sort, prioritize, or filter these
                            fields further. This step allows you to fine-tune your audience structure,
                            ensuring that you&apos;re targeting the right group of people based on the
                            criteria that matter most to you.
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                fontSize: "14px",
                                color: "text.secondary",
                                mb: 2,
                            }}
                        >
                            By customizing these fields and organizing them effectively, you can
                            build more accurate and impactful audience segments for your marketing
                            efforts or research.
                        </Typography>

                        <Typography
                            component="a"
                            href="#"
                            sx={{
                                fontSize: "14px",
                                color: "rgba(56, 152, 252, 1)",
                                textDecoration: "underline",
                                cursor: "pointer",
                                display: "inline-block",
                            }}
                        >
                            Learn more
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Box>
)};

export default React.memo(OrderFieldsStep);
