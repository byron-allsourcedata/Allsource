import { Advantage } from "./PlanCard/Advantages";

export type Plan = {
    title: string;
    price: {
        value: string;
        y: string;
    };
    isActive: boolean;
    isPopular: boolean;
    permanentLimits: Advantage[];
    monthlyLimits: Advantage[];
    giftedFunds: Advantage[];
};

export const plans: Plan[] = [
    {
        title: "Free Trial",
        isActive: false,
        price: {
            value: "0",
            y: "month",
        },
        isPopular: true,
        permanentLimits: [
            {
                good: true,
                name: "Domains monitored:",
                value: "1",
            },
        ],
        monthlyLimits: [
            {
                good: true,
                name: "Contact Downloads:",
                value: "Up to 1,000",
            },
            {
                good: false,
                name: "Smart Audience:",
                value: "0",
            },
        ],
        giftedFunds: [
            {
                good: true,
                name: "Validation funds:",
                value: "$250",
            },
            {
                good: true,
                name: "Premium Source funds:",
                value: "$250",
            },
        ],
    },
    {
        title: "Basic",
        isActive: false,
        price: {
            value: "$0,08",
            y: "record",
        },
        isPopular: false,
        permanentLimits: [
            {
                good: true,
                name: "Domains monitored:",
                value: "1",
            },
        ],
        monthlyLimits: [
            {
                good: true,
                name: "Contact Downloads:",
                value: "1,000 - 65,000",
            },
            {
                good: true,
                name: "Smart Audience:",
                value: "0",
            },
        ],
        giftedFunds: [
            {
                good: true,
                name: "Validation funds:",
                value: "$500",
            },
            {
                good: true,
                name: "Premium Source funds:",
                value: "$500",
            },
        ],
    },
    {
        title: "Smart Audience",
        isActive: false,
        price: {
            value: "$5,000",
            y: "month",
        },
        isPopular: true,
        permanentLimits: [
            {
                good: true,
                name: "Domains monitored:",
                value: "3",
            },
        ],
        monthlyLimits: [
            {
                good: true,
                name: "Contact Downloads:",
                value: "Unlimited",
            },
            {
                good: true,
                name: "Smart Audience:",
                value: "200,000",
            },
        ],
        giftedFunds: [
            {
                good: true,
                name: "Validation funds:",
                value: "2$500",
            },
            {
                good: true,
                name: "Premium Source funds:",
                value: "$2500",
            },
        ],
    },
    {
        title: "Pro",
        price: {
            value: "$10,000",
            y: "month",
        },
        isActive: false,
        isPopular: false,
        permanentLimits: [
            {
                good: true,
                name: "Domains monitored:",
                value: "5",
            },
        ],
        monthlyLimits: [
            {
                good: true,
                name: "Contact Downloads:",
                value: "Unlimited",
            },
            {
                good: true,
                name: "Smart Audience:",
                value: "Unlimited",
            },
        ],
        giftedFunds: [
            {
                good: true,
                name: "Validation funds:",
                value: "$5,000",
            },
            {
                good: true,
                name: "Premium Source funds:",
                value: "$5,000",
            },
        ],
    },
];
