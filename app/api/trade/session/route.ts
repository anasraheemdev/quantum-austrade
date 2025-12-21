
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

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
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("account_balance")
            .eq("id", user.id)
            .single();

        if (userError || !userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (userData.account_balance < amount) {
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
        }

        // Deduct Balance IMMEDIATELY
        const newBalance = Number(userData.account_balance) - Number(amount);
        const { error: balanceError } = await supabase
            .from("users")
            .update({ account_balance: newBalance })
            .eq("id", user.id);

        if (balanceError) {
            return NextResponse.json({ error: "Failed to deduct balance" }, { status: 500 });
        }

        // Create Trade Session
        const { data: session, error: sessionError } = await supabase
            .from("trade_sessions")
            .insert({
                user_id: user.id,
                symbol,
                amount,
                duration,
                status: 'PENDING'
            })
            .select()
            .single();

        if (sessionError) {
            // Refund if session creation fails
            await supabase
                .from("users")
                .update({ account_balance: Number(userData.account_balance) }) // Revert
                .eq("id", user.id);

            console.error("Session creation error:", sessionError);
            return NextResponse.json({ error: "Failed to create trade session" }, { status: 500 });
        }

        // Create transaction record for trade start
        const { error: transactionError } = await supabase
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
            const { data: admins } = await supabase
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
                    read: false
                }));

                await supabase
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
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

        const { data: sessions, error } = await supabase
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
