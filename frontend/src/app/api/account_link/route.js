import { NextResponse } from "next/server";
import { stripe } from '../../../../lib/utils';

export async function POST(req) {
  if (req.method === "POST") {
    try {
      const { account } = await req.json(); 

      if (!account) {
        return NextResponse.json({ error: "Missing account parameter" }, { status: 400 });
      }

      const accountLink = await stripe.accountLinks.create({
        account: account,
        refresh_url: `http://localhost:3000/referral`,
        return_url: `http://localhost:3000/referral`,
        type: "account_onboarding",
      });

      return NextResponse.json({
        url: accountLink.url,
      });
    } catch (error) {
      console.error(error)
      return NextResponse.json({ error: error.message });
    }
  }
}