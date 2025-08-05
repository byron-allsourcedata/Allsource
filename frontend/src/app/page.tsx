"use client";
import { useUser } from "@/context/UserContext";
import { jwtDecode } from "jwt-decode";

type Claim = {
	id: number;
	role?: string;
};

function RedirectPage() {
	if (typeof window !== "undefined") {
		const token = localStorage.getItem("token");

		try {
			if (token) {
				const obj = jwtDecode<Claim>(token);

				console.dir(obj);

				if (obj.role && obj.role === "admin") {
					window.location.href = "/admin";
					return;
				}
			}
		} catch {}

		if (token) {
			window.location.href = "/dashboard";
		} else {
			window.location.href = "/signin";
		}
	}
}

export default RedirectPage;
