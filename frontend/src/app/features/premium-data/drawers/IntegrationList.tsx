import { Column } from "@/components/Column";
import { Row } from "@/components/Row";
import { IntegrationBoxSync } from "@/components/ui/integrations/IntegrationBoxSync";
import { styled, Typography } from "@mui/material";
import { useEffect, type FC } from "react";
import { DrawerHeader } from "@/components/drawers/DrawerHeader";
import { usePremiumSyncIntegrations } from "../requests";

const T = Typography;

const Container = styled(Column)`
    width: 620px;
`;

const H6 = styled(T)`
	color: #202124;
	font-family: Roboto;
	font-size: 20px;
	font-style: normal;
	font-weight: 500;
	line-height: 32px; /* 160% */
	letter-spacing: 0.15px;
`;

type ControllerProps = {
	onSelectIntegration: (integration: string, integration_id: number) => void;
	onAddIntegration: (integration: string) => void;
};

export const IntegrationListController: FC<ControllerProps> = ({
	onSelectIntegration,
	onAddIntegration,
}) => {
	return (
		<IntegrationList
			onIntegrationSelected={onSelectIntegration}
			onAddIntegration={onAddIntegration}
		/>
	);
};

type Props = {
	onIntegrationSelected: (integration: string, integration_id: number) => void;
	onAddIntegration: (integration: string) => void;
};

export const IntegrationList: FC<Props> = ({
	onIntegrationSelected,
	onAddIntegration,
}) => {
	const [{ data: integrations }, refetchIntegrations] =
		usePremiumSyncIntegrations();

	useEffect(() => {
		refetchIntegrations().catch(() => {});
	}, []);

	return (
		<Container>
			<DrawerHeader title="Create a Sync" onClose={() => {}} />
			<Column padding="1rem 2.25rem 1rem 1.5rem" gap="1.5rem">
				<H6>Choose from integrated platform</H6>
				<Row gap="1rem" flexWrap="wrap">
					{integrations?.map((i, index) => {
						return (
							<IntegrationBoxSync
								key={i.service_name + index}
								service_name={i.service_name}
								image={i.image}
								status={i.status}
								onSelect={(name) =>
									onIntegrationSelected(name, i.integration_id)
								}
								onAdd={onAddIntegration}
							/>
						);
					})}
				</Row>
			</Column>
		</Container>
	);
};
