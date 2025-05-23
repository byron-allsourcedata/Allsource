import { SxProps, Theme } from "@mui/material";

export type CardData = {
  title: string;
  description: string;
  icon: string;
  onClick?: () => void;
  isClickable?: boolean;
};

export interface HeaderProps {
  TextTitle: string;
  TextSubtitle?: string;
  link?: string;
}

export interface InfoNotificationProps {
  Text: string;
  closeFunc?: () => void;
}

export interface HelpPoint {
  title: string;
  description: string;
}

export interface DashboardHelpCardProps {
  headline: string;
  description: string;
  helpPoints: HelpPoint[];
}

export interface TimeScreenProps {
  Header: HeaderProps;
  InfoNotification?: InfoNotificationProps;
  Content?: React.ReactNode | React.ComponentType;
  HelpCard: DashboardHelpCardProps;
  customStyleSX?: SxProps<Theme>;
  WarningNotification?: NotificationWarningProps;
}

export interface FeatureCardProps {
  title: string;
  subtitle: string;
  imageSrc: string;
  onClick: () => void;
  showRecommended?: boolean;
  img_height?: number;
}

export interface NotificationWarningProps {
  condition: boolean;
  ctaUrl: string;
  ctaLabel: string;
  message: string;
}

export interface PreviewConfig {
  headerTitle: string
  headerSubtitle?: string
  headerLink?: string
  tableSrc: string
  caption: string
  onBegin: () => void
  beginDisabled?: boolean
  buttonLabel?: string
  sx?: SxProps<Theme>
}