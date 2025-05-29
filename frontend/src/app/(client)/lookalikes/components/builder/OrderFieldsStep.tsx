import React from "react";
import { Box, Button, Grid, Typography } from "@mui/material";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import { Field } from "@/types";
import DragAndDropTable from "./DragAndDropTable";
import { Stepper, Step, StepLabel, StepButton } from '@mui/material';
import { ResetProvider, useResetContext } from "@/context/ResetContext";
import { OpenInNewIcon } from "@/icon";
import HintCard from "@/app/(client)/components/HintCard";
import { useLookalikesHints } from "../../context/LookalikesHintsContext";

interface OrderFieldsStepProps {
    fields: Field[];
    handlePrevStep: () => void;
    onOrderChange: (newOrder: Field[]) => void;
    onResetOrder: () => void;
    disableResetOrder: boolean;
}

const OrderFieldsStep: React.FC<OrderFieldsStepProps> = ({
    fields,
    handlePrevStep,
    onOrderChange,
    onResetOrder,
    disableResetOrder,
}) => {
    const [activeStep, setActiveStep] = React.useState(1);
    const { lookalikesBuilderHints, cardsLookalikeBuilder, changeLookalikesBuilderHint, resetSourcesBuilderHints } = useLookalikesHints();
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
            }}
        >
            <Grid container sx={{ mb: 2 }}>
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
            </Grid>

            <Grid container sx={{ mb: 2, }}>
                <Grid container xs={12} md={4}>
                    <Grid item sx={{ borderBottom: "1px solid rgba(233, 233, 233, 1)", }}>
                        {/* «Recommended fields» */}
                        <Button
                            onClick={handleStep(0)}
                            disableRipple
                            sx={{
                                minWidth: 0,
                                textTransform: "none",
                                fontFamily: "Nunito Sans",
                                fontWeight: 700,
                                fontSize: "14px",
                                color: "rgba(112, 112, 113, 1)",
                                mr: 0.5,
                                // borderBottom: "1px solid rgba(212, 212, 212, 1)",
                                backgroundColor: "rgba(246, 248, 250, 1)",
                                "&:hover": { backgroundColor: "rgba(226, 229, 232, 0.74)" },
                            }}
                        >
                            Recommended fields
                        </Button>
                    </Grid>
                    <Grid item sx={{ borderRight: "1px solid rgba(233, 233, 233, 1)", borderLeft: "1px solid rgba(233, 233, 233, 1)", borderTopRightRadius: 3, borderTopLeftRadius: 3 }}>
                        {/* «Order fields» */}
                        <Box
                            sx={{
                                position: "relative",
                                display: "inline-flex",
                                alignItems: "center",
                            }}
                        >
                            <HintCard
                                card={cardsLookalikeBuilder.order}
                                positionTop={15}
                                positionLeft={130}
                                rightSide={false}
                                isOpenBody={lookalikesBuilderHints.order.showBody}
                                toggleClick={() =>
                                    changeLookalikesBuilderHint("order", "showBody", "toggle")
                                }
                                closeClick={() =>
                                    changeLookalikesBuilderHint("order", "showBody", "close")
                                }
                            />
                            <Button
                                onClick={handleStep(1)}
                                disableRipple
                                sx={{
                                    minWidth: 0,
                                    textTransform: "none",
                                    fontFamily: "Nunito Sans",
                                    fontWeight: 500,
                                    fontSize: "14px",
                                    color: "rgba(56, 152, 252, 1)",
                                    borderTop: "2px solid rgba(56, 152, 252, 1)",
                                    mb: 0.5,
                                    "&:hover": { backgroundColor: "transparent" },
                                }}
                            >
                                Order fields
                            </Button>
                        </Box>
                    </Grid>
                    <Grid item sx={{ flexGrow: 1, borderBottom: "1px solid rgba(233, 233, 233, 1)" }}>

                    </Grid>
                </Grid>
                <Grid item md={2} sx={{ textAlign: "right", borderBottom: "1px solid rgba(233, 233, 233, 1)" }}>
                    <Button
                        onClick={onResetOrder}
                        disabled={disableResetOrder}
                        sx={{
                            border: "1px rgba(56, 152, 252, 1) solid",
                            color: "rgba(56, 152, 252, 1)",
                            backgroundColor: "#FFFFFF",
                            textTransform: "none",
                            "&:hover": {
                                border: "1px rgba(56, 152, 252, 1) solid",
                                backgroundColor: "#FFFFFF",
                            },
                            "&.Mui-disabled": {
                                opacity: 1,
                                border: "1px rgba(234, 248, 221, 1) solid",
                                backgroundColor: "rgba(234, 248, 221, 1)",
                                color: "rgba(43, 91, 0, 1)",
                            },
                        }}
                        variant="outlined"
                    >
                        <Typography fontSize="0.8rem">
                            {disableResetOrder ? `Recomended` : `Set recommended`}
                        </Typography>
                    </Button>
                </Grid>
                <Grid item sx={{ flexGrow: 1, borderBottom: "1px solid rgba(233, 233, 233, 1)" }}>

                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <DragAndDropTable fields={fields} onOrderChange={onOrderChange} />
                </Grid>
                <Grid item />
                <Grid item xs={12} md={5} sx={{ borderLeft: "1px solid #E4E4E4" }}>
                    <Box sx={{ p: 0, bgcolor: "transparent" }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontWeight: 500,
                                fontSize: "16px",
                                lineHeight: "22.5px",
                                mb: 2,
                            }}
                        >
                            How to order your fields?
                        </Typography>
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
                            href="https://allsourceio.zohodesk.com/portal/en/kb/articles/lookalikes"
                            sx={{
                                fontSize: "14px",
                                color: "rgba(56, 152, 252, 1)",
                                textDecoration: "underline",
                                cursor: "pointer",
                                display: "inline-block",
                            }}
                        >
                            Learn more <OpenInNewIcon sx={{ fontSize: 14 }} />
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    )
};

export default React.memo(OrderFieldsStep);
