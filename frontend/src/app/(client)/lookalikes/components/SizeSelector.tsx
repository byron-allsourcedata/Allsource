import React from "react";
import { Box, Typography, Button, Slider } from "@mui/material";
import { useLookalikesHints } from "../context/LookalikesHintsContext";
import HintCard from "../../components/HintCard";

const audienceSize = [
    {
        id: "almost",
        label: "Almost identical",
        text: "Lookalike size: 10,000 contacts",
        min_value: 0,
        max_value: 3,
    },
    {
        id: "extremely",
        label: "Extremely similar",
        text: "Lookalike size: 50,000 contacts",
        min_value: 0,
        max_value: 7,
    },
    {
        id: "very",
        label: "Very similar",
        text: "Lookalike size: 100,000 contacts",
        min_value: 0,
        max_value: 10,
    },
    {
        id: "quite",
        label: "Quite similar",
        text: "Lookalike size: 200,000 contacts",
        min_value: 0,
        max_value: 15,
    },
    {
        id: "broad",
        label: "Broad",
        text: "Lookalike size: 500,000 contacts",
        min_value: 0,
        max_value: 20,
    },
];

const RECOMMENDED_SIZE = "extremely";

interface AudienceSizeSelectorProps {
    onSelectSize: (id: string, min: number, max: number, label: string) => void;
    selectedSize: string;
}

const AudienceSizeSelector: React.FC<AudienceSizeSelectorProps> = ({
    onSelectSize,
    selectedSize,
}) => {
    const { lookalikesBuilderHints, cardsLookalikeBuilder, changeLookalikesBuilderHint, resetSourcesBuilderHints } = useLookalikesHints();
    return (
        <Box
            sx={{
                display: "flex",
                width: "100%",
                justifyContent: "start",
            }}
        >
            <Box
                sx={{
                    border: "1px solid rgba(228, 228, 228, 1)",
                    borderRadius: "6px",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    padding: "18px",
                    gap: "8px",
                    mt: 1,
                }}
            >
                <Typography className="second-sub-title">
                    Choose lookalike size
                </Typography>
                <Typography className="paragraph">
                    Fine-tune your targeting! Choose the size of your lookalike
                    audience to match your marketing goals.
                </Typography>

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: {
                            xs: "column",
                            sm: "row",
                        },
                        gap: 2,
                        pt: 2,
                        width: "100%",
                        flexWrap: "wrap",
                        position: "relative",
                    }}
                >
                    {audienceSize.map((source) => {
                        const isRecommended = source.id === RECOMMENDED_SIZE;
                        return (
                            <Box
                                key={source.id}
                                sx={{
                                    width: { xs: "100%", sm: "auto" },
                                    position: "relative",
                                }}
                            >
                                {isRecommended && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: "-19px",
                                            left: "0",
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
                                    onClick={() =>
                                        onSelectSize(
                                            source.id,
                                            source.min_value,
                                            source.max_value,
                                            source.label
                                        )
                                    }
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flex: 1,
                                        minWidth: '12.125rem',
                                        border:
                                            selectedSize === source.id
                                                ? "1px solid rgba(117, 168, 218, 1)"
                                                : "1px solid rgba(208, 213, 221, 1)",
                                        backgroundColor: selectedSize === source.id
                                            ? 'rgba(246, 248, 250, 1)'
                                            : 'rgba(255, 255, 255, 1)',
                                        padding: "0.6rem 0.5rem",
                                        borderRadius: isRecommended
                                            ? "0 4px 4px 4px"
                                            : "4px",
                                        textTransform: "none",
                                        width: { xs: "100%", sm: "auto" },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            width: '100%',
                                            flexDirection: "column",
                                            alignItems: "flex-start",
                                            justifyContent: 'start',
                                            gap: "10px",
                                        }}
                                    >
                                        <Typography
                                            className="paragraph"
                                            sx={{ color: "rgba(32, 33, 36, 1)", }}
                                        >
                                            {source.label}
                                        </Typography>
                                        <Typography
                                            className="paragraph"
                                            sx={{ fontSize: "12px" }}
                                        >
                                            {source.text}
                                        </Typography>
                                    </Box>
                                </Button>

                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
};

export default AudienceSizeSelector;
