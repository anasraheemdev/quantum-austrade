
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();

        // Auth Check
        const authHeader = request.headers.get("authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "").trim();

        // Verify Admin (Simplified)
        let userId: string | null = null;
        try {
            const parts = token.split('.');
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            userId = payload.sub;
        } catch (e) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        if (!userId || !(await isAdmin(userId))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { targetUserId, creditScore, level } = body;

        if (!targetUserId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const adminClient = tryCreateAdminClient();
        if (!adminClient) {
            return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });
        }

        // Update User
        const updates: any = {};
        if (creditScore !== undefined) updates.credit_score = creditScore;
        if (level !== undefined) updates.level = level;

        const { error: updateError } = await adminClient
            .from("users")
            .update(updates)
            .eq("id", targetUserId);

        if (updateError) {
            return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error updating user stats:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
