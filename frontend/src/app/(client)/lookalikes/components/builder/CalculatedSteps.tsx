import React, { useMemo, useState, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { AudienceFieldsSelector, OrderFieldsStep } from "../";
import type { Field, CalculationResponse, RecommendedByCategory } from "@/types";
import { useHints } from "@/context/HintsContext";
import HintCard from "../../../components/HintCard"; 

interface HintCardInterface {
    description: string;
    title: string;
    linkToLoadMore: string;
}

interface CalculatedStepsProps {
    calculatedResults: CalculationResponse;
    currentStep: number;
    handlePrevStep: () => void;
    handleNextStep: () => void;
    onFieldsOrderChangeUp: (newOrder: Field[]) => void;
    hintCard2: HintCardInterface
    hintCard3: HintCardInterface
    toggleDotHintClickBlock2: () => void
    toggleDotHintClickBlock3: () => void
    isOpenSelect2: boolean
    isOpenSelect3: boolean
}

export const CalculatedSteps: React.FC<CalculatedStepsProps> = ({
    calculatedResults,
    currentStep,
    handlePrevStep,
    handleNextStep,
    onFieldsOrderChangeUp,
    hintCard2,
    hintCard3,
    toggleDotHintClickBlock2,
    toggleDotHintClickBlock3,
    isOpenSelect2,
    isOpenSelect3,
}) => {
    // Initial recommended by category

    const { showHints } = useHints();
    const initialRecommendedByCategory = useMemo<RecommendedByCategory>(() => {
        const { audience_feature_importance_b2c: b2c, audience_feature_importance_b2b: b2b } = calculatedResults;
        const takeTop = (obj: Record<string, number>) =>
            Object.entries(obj)
                .filter(([, v]) => v > 0)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 14)
                .map(([k]) => k);

        return {
            personal: takeTop(b2c.personal),
            financial: takeTop(b2c.financial),
            lifestyle: takeTop(b2c.lifestyle),
            voter: takeTop(b2c.voter),
            employment_history: takeTop(b2b.employment_history),
            professional_profile: takeTop(b2b.professional_profile),
        };
    }, [calculatedResults]);

    // State for selected checkboxes
    const [selectedByCategory, setSelectedByCategory] = useState<RecommendedByCategory>(
        initialRecommendedByCategory
    );

    // Flatten initial order fields
    const computedFields = useMemo<Field[]>(() => {
        const formatKey = (k: string) =>
            k
                .replace(/_/g, " ")
                .replace(/(?!^)([A-Z])/g, " $1")
                .trim()
                .replace(/^./, c => c.toUpperCase());
        const arr: Field[] = [];
        const push = (keys: string[], src: Record<string, number>) => {
            keys.forEach(key =>
                arr.push({ id: key, name: formatKey(key), value: String(src[key] || 0) })
            );
        };
        const { audience_feature_importance_b2c: b2c, audience_feature_importance_b2b: b2b } = calculatedResults;

        push(selectedByCategory.personal, b2c.personal);
        push(selectedByCategory.financial, b2c.financial);
        push(selectedByCategory.lifestyle, b2c.lifestyle);
        push(selectedByCategory.voter, b2c.voter);
        push(selectedByCategory.employment_history, b2b.employment_history);
        push(selectedByCategory.professional_profile, b2b.professional_profile);

        return arr.sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
    }, [calculatedResults, selectedByCategory]);

    useEffect(() => {
        setDndFields(computedFields);
    }, [computedFields]);
    // Ref to store default order
    const initialOrderRef = useRef<Field[]>(computedFields);

    // State for drag-and-drop order
    const [dndFields, setDndFields] = useState<Field[]>(computedFields);

    // Booleans to track default states
    const isDefaultSelection = useMemo(() => {
        return (Object.keys(initialRecommendedByCategory) as Array<keyof RecommendedByCategory>)
            .every(cat => {
                const init = initialRecommendedByCategory[cat];
                const sel = selectedByCategory[cat];
                if (init.length !== sel.length) return false;
                const setSel = new Set(sel);
                return init.every(k => setSel.has(k));
            });
    }, [initialRecommendedByCategory, selectedByCategory]);

    const isDefaultOrder = useMemo(() => {
        const a = initialOrderRef.current.map(f => f.id);
        const b = dndFields.map(f => f.id);
        return a.length === b.length && a.every((id, i) => id === b[i]);
    }, [dndFields]);

    // Handlers
    const handleFieldsChange = (newSelection: RecommendedByCategory) => {
        setSelectedByCategory(newSelection);
    };

    const handleFieldsOrderChange = (newOrder: Field[]) => {
        setDndFields(newOrder);
        onFieldsOrderChangeUp(newOrder);
    };


    const handleResetAllState = () => {
        setDndFields(initialOrderRef.current);
        calculatedResults
        setSelectedByCategory(initialRecommendedByCategory);
    };

    const canProceed = Object.values(selectedByCategory).flat().length >= 3;

    return (
        <Box>
            <Box hidden={currentStep !== 2}>
                <AudienceFieldsSelector
                    calculatedResults={calculatedResults}
                    recommendedByCategory={initialRecommendedByCategory}
                    currentSelection={selectedByCategory}
                    onFieldsChange={handleFieldsChange}
                    handleNextStep={handleNextStep}
                    canProcessed={canProceed}
                    onResetSelection={handleResetAllState}
                    disableResetSelection={isDefaultSelection && isDefaultOrder}
                    hintCard={hintCard2}
                    toggleDotHintClickBlock={toggleDotHintClickBlock2}
                    isOpenSelect={isOpenSelect2}
                />
            </Box>

            <Box hidden={currentStep !== 3} sx={{position: "relative"}}>
                <OrderFieldsStep
                    fields={dndFields}
                    handlePrevStep={handlePrevStep}
                    onOrderChange={handleFieldsOrderChange}
                    onResetOrder={handleResetAllState}
                    disableResetOrder={isDefaultSelection && isDefaultOrder}
                />
            </Box>

            {/* {showHints && (
                <HintCard
                    card={hintCard3}
                    positionLeft={135}
                    positionTop={535}
                    isOpenSelect={isOpenSelect3}
                    toggleClick={toggleDotHintClickBlock3}
                />
            )} */}

        </Box>
    );
};