import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/utils";

export async function POST(req) {
  try {
    const account = await stripe.accounts.create({
      controller: {
        stripe_dashboard: {
          type: "express",
        },
        fees: {
          payer: "application"
        },
        losses: {
          payments: "application"
        },
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    const account_info = await stripe.accounts.retrieve(account.id)
    const currentlyDue = account_info.requirements?.currently_due || [];

    return NextResponse.json({ account: account.id, currently_due: currentlyDue });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
