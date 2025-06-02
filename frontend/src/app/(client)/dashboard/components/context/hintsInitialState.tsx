import { StateHint } from '@/utils/hintsUtils';
import { cmsHintCards, domainSelectorHintCards, pixelInstallationHintCards, VerifyPixelIntegrationKey, ManualInstallKey } from './hintsCardsContent';

const initialCMSHints: Record<keyof typeof cmsHintCards, StateHint> = {
    "chooseCMS": { show: true, showBody: true, id: 0 },
    "enterShopDomain": { show: true, showBody: false, id: 1 },
    "enterShopifyAccessToken": { show: true, showBody: false, id: 2 },
    "installScript": { show: true, showBody: false, id: 3 },
    "installPlugin": { show: true, showBody: false, id: 4 },
    "enterSiteID": { show: true, showBody: false, id: 5 },
    "verifyConnection": { show: true, showBody: false, id: 6 },
    "enterStoreHash": { show: true, showBody: false, id: 7 },
    "scriptInstallation": { show: true, showBody: false, id: 8 },
};


const initialDomainSelectorHints: Record<keyof typeof domainSelectorHintCards, StateHint> = {
    "addDomain": { show: true, showBody: true, id: 0 },
    "enterDomain": { show: true, showBody: false, id: 1 },
    "selectDomain": { show: true, showBody: false, id: 2 },
};


const initialPixelInstallationHints: Record<keyof typeof pixelInstallationHintCards, StateHint> = {
    "chooseInstallationMethod": { show: true, showBody: true, id: 0 },
};

const initialVerifyPixelIntegrationHints: Record<VerifyPixelIntegrationKey, StateHint> = {
    verifyPixelIntegration: { show: true, showBody: true, id: 0 },
};

const initialManualInstallHints: Record<ManualInstallKey, StateHint> = {
    SendButton: { show: true, showBody: true, id: 0 },
};

export { initialCMSHints, initialDomainSelectorHints, initialPixelInstallationHints, initialVerifyPixelIntegrationHints, initialManualInstallHints };
