import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/utils";

export async function POST(req) {
  if (req.method === "POST") {
    try {
      const { account, type } = await req.json();

      if (!account) {
        return NextResponse.json({ error: "Missing account parameter" }, { status: 400 });
      }

      const accountLink = await stripe.accountLinks.create({
        account: account,
        refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${type}`,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${type}`,
        type: "account_onboarding",
      });

      return NextResponse.json({
        url: accountLink.url,
        type: "onboarding",
      });
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid method" }, { status: 405 });
}
