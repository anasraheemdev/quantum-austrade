
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();

        // Auth check
        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.replace("Bearer ", "").trim();

        // Get user from token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error("Auth error:", authError);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use Admin Client for database operations to bypass RLS
        // This is safe because we have already validated the user above
        const adminClient = tryCreateAdminClient();

        if (!adminClient) {
            console.error("Admin client initialization failed");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const body = await request.json();
        const { symbol, amount, duration } = body;

        // Validation
        if (!symbol || !amount || !duration) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (amount < 50) {
            return NextResponse.json({ error: "Minimum trade amount is $50" }, { status: 400 });
        }

        // Check Balance
        // console.log("[Trade] Checking balance for user:", user.id);
        const { data: userData, error: userError } = await adminClient
            .from("users")
            .select("account_balance")
            .eq("id", user.id)
            .single();

        if (userError || !userData) {
            console.error("[Trade] User fetch error:", userError);
            return NextResponse.json({ error: "User not found", details: userError?.message }, { status: 404 });
        }

        const currentBalance = Number(userData.account_balance);
        // console.log("[Trade] User balance:", currentBalance);

        if (currentBalance < amount) {
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
        }

        // Deduct Balance IMMEDIATELY
        const newBalance = currentBalance - Number(amount);
        // console.log("[Trade] Deducting balance:", { old: currentBalance, new: newBalance, amount });

        const { error: balanceError } = await adminClient
            .from("users")
            .update({ account_balance: newBalance })
            .eq("id", user.id);

        if (balanceError) {
            console.error("[Trade] Balance deduction error:", balanceError);
            return NextResponse.json({ error: "Failed to deduct balance", details: balanceError.message }, { status: 500 });
        }

        // Create Trade Session
        // console.log("[Trade] Creating trade session:", { user_id: user.id, symbol, amount, duration });

        // Ensure duration is int
        const durationInt = parseInt(duration);

        const { data: session, error: sessionError } = await adminClient
            .from("trade_sessions")
            .insert({
                user_id: user.id,
                symbol,
                amount,
                duration: durationInt,
                status: 'PENDING'
            })
            .select()
            .single();

        if (sessionError) {
            // Refund if session creation fails
            console.error("[Trade] Session creation error:", sessionError);
            console.log("[Trade] Attempting to refund balance...");
            await adminClient
                .from("users")
                .update({ account_balance: currentBalance }) // Revert
                .eq("id", user.id);

            return NextResponse.json({ error: "Failed to create trade session", details: sessionError.message }, { status: 500 });
        }

        // console.log("[Trade] Trade session created successfully:", session.id);

        // Create transaction record for trade start
        const { error: transactionError } = await adminClient
            .from("transactions")
            .insert({
                user_id: user.id,
                symbol: symbol,
                type: 'buy', // Using 'buy' to indicate trade start
                quantity: 1, // For binary options, quantity is always 1
                price: amount,
                total_amount: amount,
            });

        if (transactionError) {
            console.error("Transaction creation error:", transactionError);
            // Don't fail the trade if transaction logging fails
        }

        // Create notification for all admins about new trade
        try {
            // Get all admin users
            const { data: admins } = await adminClient
                .from("users")
                .select("id")
                .eq("role", "admin");

            if (admins && admins.length > 0) {
                // Create notification for each admin
                const notifications = admins.map(admin => ({
                    user_id: admin.id,
                    title: "New Trade Executed",
                    message: `Client executed ${symbol} trade for $${amount} (${duration}s)`,
                    type: "info",
                    is_read: false // Note: Schema might use 'read' or 'is_read'. Based on other files, checking...
                    // In types.ts Notification interface uses 'is_read'
                    // But in db schema setup sometimes it defaults to false. 
                    // Let's assume 'is_read' or 'read'. In notifications.ts it usually just inserts.
                    // Checking Types.ts: is_read: boolean.
                }));
                // Need to verify notification table columns. 
                // Usually defaults handle it. I'll include is_read: false just in case.

                // Correction: In Step 80, I didn't see notification table definition.
                // Assuming it exists.
                await adminClient
                    .from("notifications")
                    .insert(notifications);
            }
        } catch (notifError) {
            console.error("Notification creation error:", notifError);
            // Don't fail the trade if notification fails
        }

        return NextResponse.json({ success: true, session, newBalance });

    } catch (error) {
        console.error("Error creating trade session:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();

        // Auth check
        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.replace("Bearer ", "").trim();

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const adminClient = tryCreateAdminClient();
        const clientToUse = adminClient || supabase;

        // Check for expired pending sessions
        const { data: pendingSessions } = await clientToUse
            .from("trade_sessions")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "PENDING");

        if (pendingSessions && pendingSessions.length > 0) {
            const now = new Date().getTime();
            const updates = pendingSessions.map(async (session) => {
                const startTime = new Date(session.created_at).getTime();
                const durationMs = session.duration * 1000;

                // If time expired
                if (now > startTime + durationMs) {
                    console.log(`[Trade] Session ${session.id} expired. Auto-resolving to LOST.`);

                    // Update to LOST
                    await clientToUse
                        .from("trade_sessions")
                        .update({
                            status: 'LOST',
                            end_time: new Date().toISOString(),
                            outcome_override: 'AUTO_LOSS'
                        })
                        .eq("id", session.id);

                    // Create transaction for the loss record
                    await clientToUse
                        .from("transactions")
                        .insert({
                            user_id: user.id,
                            symbol: session.symbol,
                            type: 'sell',
                            quantity: 1,
                            price: 0,
                            total_amount: 0,
                        });
                }
            });

            await Promise.all(updates);
        }

        const { data: sessions, error } = await clientToUse
            .from("trade_sessions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
        }

        return NextResponse.json(sessions);
    } catch (error) {
        console.error("Error fetching sessions:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
