import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/utils";

export async function POST(req) {
	if (req.method === "POST") {
		try {
			const { account } = await req.json();

			if (!account) {
				return NextResponse.json(
					{ error: "Missing account parameter" },
					{ status: 400 },
				);
			}

			const accountLink = await stripe.accounts.createLoginLink(account);

			return NextResponse.json({
				url: accountLink.url,
			});
		} catch (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}
	}

	return NextResponse.json({ error: "Invalid method" }, { status: 405 });
}
