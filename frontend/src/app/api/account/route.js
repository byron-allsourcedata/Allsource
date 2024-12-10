import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/utils";

export async function POST(req) {
  try {
    const account = await stripe.accounts.create({
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      }
    });

    return NextResponse.json({ account: account.id });
  } catch (error) {
    console.error("An error occurred when calling the Stripe API to create an account:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
