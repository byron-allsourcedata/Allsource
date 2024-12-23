import { NextResponse } from "next/server";
import { stripe } from '../../../../lib/utils';

export async function POST(req) {
  if (req.method === "POST") {
    try {
      const { account } = await req.json();

      if (!account) {
        return NextResponse.json({ error: "Missing account parameter" }, { status: 400 });
      }

      let accountLink;
      let linkType = "login";

      try {
        accountLink = await stripe.accounts.createLoginLink(account);
      } catch (error) {
        if (error.statusCode === 400) {
          accountLink = await stripe.accountLinks.create({
            account: account,
            refresh_url: `https://app.maximiz.ai/referral`,
            return_url: `https://app.maximiz.ai/referral`,
            type: "account_onboarding",
          });
          linkType = "login";
        } else {
          throw error;
        }
      }

      return NextResponse.json({
        url: accountLink.url,
        type: linkType, 
      });

    } catch (error) {
      console.error("Ошибка:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid method" }, { status: 405 });
}
