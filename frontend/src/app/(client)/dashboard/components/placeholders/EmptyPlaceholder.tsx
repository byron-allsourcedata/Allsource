import { PlaceholderImage } from "./PlaceholderImage";
import { Subtitle, Title } from "./styles";
import { Column } from "@/app/(client)/components/Column";

type Props = {
    customers?: boolean;
};

export const EmptyAnalyticsPlaceholder: React.FC<Props> = ({ customers }) => {
    let title = "Waiting for your first visitors";
    let description = `
    Your pixel is active but hasn't recorded data yet. It may take a
    few hours for visitor activity to appear after installation. Check
    back soon!
  `;

    if (customers) {
        title = "Waiting for your first customers";
        description = `
      Your pixel is active but hasn't recorded data yet. It may take a
      few hours for customer activity to appear after installation. Check
      back soon!
    `;
    }

    return (
        <Column gap={2} alignItems="center" justifyContent="center">
            <Column gap={3} maxWidth={"31.25rem"} justifyContent="center">
                <Title>{title}</Title>
                <Subtitle>{description}</Subtitle>
            </Column>

            <PlaceholderImage />
        </Column>
    );
};
