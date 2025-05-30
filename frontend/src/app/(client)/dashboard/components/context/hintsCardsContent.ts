import { HintCardInterface } from "@/utils/hintsUtils";

export type CMSKey =
  | "chooseCMS"
  | "enterShopDomain"
  | "enterShopifyAccessToken"
  | "installScript"
  | "installPlugin"
  | "enterSiteID"
  | "verifyConnection"
  | "enterStoreHash"
  | "scriptInstallation";

export type PixelInstallationKey = "chooseInstallationMethod";
export type DomainSelectorKey = "addDomain" | "enterDomain" | "selectDomain";
export type VerifyPixelIntegrationKey = "verifyPixelIntegration";
export type ManualInstallKey = "SendButton";
const cmsHintCards: Record<CMSKey, HintCardInterface> = {
  chooseCMS: {
    description:
      "Click on your platform (Shopify, WordPress, or BigCommerce) to see a step-by-step guide for installing the pixel. Follow the instructions to complete the setup.",
    title: "Choose CMS",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/cms-integrations",
  },
  enterShopDomain: {
    description:
      "Enter your Shopify store domain in the provided field. We've prefilled it based on your earlier selection, but you can choose a different one if needed. Note: if you change the domain here, make sure to also update it in the domain selection step.",
    title: "Enter Shop Domain",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-shopify#_Pre-Integration_Requirements",
  },
  enterShopifyAccessToken: {
    description:
      "Enter your Shopify API access token. This token is required for secure communication between your store and our application. You can get the token in your Shopify admin under “Settings” → “Apps and sales channels” → “Develop app” → “Admin API”.",
    title: "Enter a Shopify Access Token",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-shopify#Step_4_Insert_this_token_in_the_access_token_field",
  },
  installScript: {
    description: `Click the "Install" button, and we’ll automatically inject our script into your Shopify store. No further action is needed — the setup completes automatically.`,
    title: "Install the Script",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-shopify#Step_4_Insert_this_token_in_the_access_token_field",
  },
  installPlugin: {
    description: `Add our official Allsource Pixel plugin to your WordPress site. This allows for seamless pixel integration without manual setup.`,
    title: "Install the Plugin",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-wordpress#Method_1_Install_by_Downloading_the_Plugin",
  },
  enterSiteID: {
    description: `Enter your Site ID during the checkout process. This connects your site to Allsource for accurate event tracking.`,
    title: "Enter Your Site ID",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-wordpress#WordPress_Integration_Guide",
  },
  verifyConnection: {
    description: `Check if Allsource is receiving data from your site. If everything is set up correctly, events will start appearing automatically.`,
    title: "Verify Connection",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/verify-pixel",
  },
  enterStoreHash: {
    description: `Enter your unique BigCommerce Store Hash in the designated field. This helps our system identify your store. You can find the Store Hash in your admin panel URL — it's the part between /stores/ and /manage.`,
    title: "Enter Store Hash",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-bigcommerce#Step_1_Enter_Your_BigCommerce_Store_Hash",
  },
  scriptInstallation: {
    description: `Once you’ve submitted the required information, click “Install”. We’ll automatically add our script to your BigCommerce store. No further action is needed on your part.`,
    title: "Script Installation",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-bigcommerce#Step_2_Install_the_Script_Automatically",
  },
};

const domainSelectorHintCards: Record<DomainSelectorKey, HintCardInterface> = {
  addDomain: {
    description:
      "Click to add your website domain. After entering the domain, you’ll be able to install the tracking pixel.",
    title: "Add domain",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/create-or-select-your-domain",
  },
  enterDomain: {
    description:
      'Enter your website domain in the input field and click "Save". We’ll store it and use it to set up the tracking pixel.',
    title: "Enter domain",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-create-a-domain",
  },
  selectDomain: {
    description:
      'Select a domain from the list to link the tracking pixel to the correct website. If your domain is missing, click "Add new domain" to enter it manually. Make sure the domain is valid — the pixel will be installed on the selected one.',
    title: "Select a domain",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/create-or-select-your-domain",
  },
};

const pixelInstallationHintCards: Record<
  PixelInstallationKey,
  HintCardInterface
> = {
  chooseInstallationMethod: {
    description:
      "Choose the installation method that works best for your website. You can use Google Tag Manager, upload the code manually, or install it through a CMS like Shopify, WordPress, or BigCommerce.",
    title: "Choose the installation method",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/what-is-pixel-installation",
  },
};

const verifyPixelIntegrationHintCards: Record<
  VerifyPixelIntegrationKey,
  HintCardInterface
> = {
  verifyPixelIntegration: {
    description:
      "Click to add your website domain. After entering the domain, you’ll be able to install the tracking pixel.",
    title: "Verify Pixel",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/verify-pixel",
  },
};

const ManualInstallHintCards: Record<ManualInstallKey, HintCardInterface> = {
  SendButton: {
    description: `Enter your developer’s email address in the input field and click "Send". We’ll send installation instructions for setting up the pixel manually to the provided email.`,
    title: "Enter your developer's email address",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/send-pixel-installation-instructions",
  },
};

export {
  cmsHintCards,
  domainSelectorHintCards,
  pixelInstallationHintCards,
  verifyPixelIntegrationHintCards,
  ManualInstallHintCards,
};
