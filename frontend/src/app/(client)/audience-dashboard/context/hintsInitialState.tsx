import { StateHint } from '@/utils/hintsUtils';
import { AudienceDashboardKey, PixelContactsKey } from './hintsCardsContent';

const initialAudienceDashboardHints: Record<AudienceDashboardKey, StateHint> = {
    "pixel": { show: true, showBody: true, id: 0 },
    "audience": { show: true, showBody: false, id: 1 },
};

const initialPixelContactsHints: Record<PixelContactsKey, StateHint> = {
    "domain":  { show: true, showBody: true, id: 0 },
    "calendar":  { show: true, showBody: false, id: 1 },
    "type":  { show: true, showBody: false, id: 2 },
};

export { initialAudienceDashboardHints, initialPixelContactsHints  };