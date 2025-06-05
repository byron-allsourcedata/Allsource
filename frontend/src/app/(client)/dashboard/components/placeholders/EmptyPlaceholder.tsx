import { PlaceholderImage } from "./PlaceholderImage";
import { Subtitle, Title } from "./styles";
import { Column } from "@/app/(client)/components/Column";

type Props = {};

export const EmptyAnalyticsPlaceholder: React.FC<Props> = () => {
  return (
    <Column gap={2} alignItems="center" justifyContent="center">
      <Column gap={3} maxWidth={"31.25rem"} justifyContent="center">
        <Title>Waiting for your first visitors</Title>
        <Subtitle>
          Your pixel is active but hasn&apos;t recorded data yet. It may take a
          few hours for visitor activity to appear after installation. Check
          back soon!
        </Subtitle>
      </Column>

      <PlaceholderImage />
    </Column>
  );
};
