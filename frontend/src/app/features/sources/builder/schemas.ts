export type SourceTypeSchema = {
    title: string,
    src: string,
    description:
    string
}

export const sourceTypes: SourceTypeSchema[] = [
    {
        title: "Website - Pixel",
        src: "/website_pixel-icon.svg",
        description: "Use your resolved Pixel contacts",
    },
    {
        title: "Customer Conversions",
        src: "/customer_conversions-icon.svg",
        description: "Use information about completed deals",
    },
    {
        title: "Failed Leads",
        src: "/failed_leads-icon.svg",
        description:
            "Use CSV file with engaged but non-converting users",
    },
    {
        title: "Interest",
        src: "/interests-icon.svg",
        description:
            "Use information about users interested in specific topic",
    },
]