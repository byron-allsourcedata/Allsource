import React, { useState } from "react";
import { Box } from "@mui/material";
import { AudienceFieldsSelector, OrderFieldsStep } from "../";
import type { Field, CalculationResponse, RecommendedByCategory } from "@/types";

interface CalculatedStepsProps {
    calculatedResults: CalculationResponse;
    currentStep: number;
    handlePrevStep: () => void;
    handleNextStep: () => void;
    handleFieldsOrderChange: (newOrder: Field[]) => void;
}

export const CalculatedSteps: React.FC<CalculatedStepsProps> = ({
    calculatedResults,
    currentStep,
    handlePrevStep,
    handleNextStep,
}) => {
    const [recommendedByCategory] = useState<RecommendedByCategory>(() => {
        const initActiveB2C = calculatedResults.audience_feature_importance_b2c;
        const initActiveB2B = calculatedResults.audience_feature_importance_b2b;
        const takeTop = (obj: Record<string, number>) =>
            Object.entries(obj)
                .filter(([, v]) => v > 0)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 14)
                .map(([k]) => k);

        return {
            personal: takeTop(initActiveB2C.personal),
            financial: takeTop(initActiveB2C.financial),
            lifestyle: takeTop(initActiveB2C.lifestyle),
            voter: takeTop(initActiveB2C.voter),
            employment_history: takeTop(initActiveB2B.employment_history),
            professional_profile: takeTop(initActiveB2B.professional_profile),
        };
    });

    const canProceed = (recommendedByCategory.personal.length + recommendedByCategory.financial.length
        + recommendedByCategory.lifestyle.length + recommendedByCategory.voter.length
        + recommendedByCategory.professional_profile.length
        + recommendedByCategory.employment_history.length) >= 3;

    const [selectedByCategory, setSelectedByCategory] = useState<RecommendedByCategory>({
        personal: [],
        financial: [],
        lifestyle: [],
        voter: [],
        employment_history: [],
        professional_profile: [],
    });

    const handleFieldsChange = (newSelection: RecommendedByCategory) => {
        setSelectedByCategory(newSelection);
        console.log(newSelection)
    };

    return (
        <>
            <Box hidden={currentStep !== 2}>
                <AudienceFieldsSelector
                    onFieldsChange={handleFieldsChange}
                    calculatedResults={calculatedResults}
                    recommendedByCategory={recommendedByCategory}
                    handleNextStep={handleNextStep}
                    canProcessed={canProceed}
                />
            </Box>

            {/* <Box hidden={currentStep !== 3}>
          <OrderFieldsStep
            fields={dndFields}
            handlePrevStep={handlePrevStep}
            onOrderChange={handleFieldsOrderChange}
          /> */}
            {/* </Box> */}
        </>
    );
};