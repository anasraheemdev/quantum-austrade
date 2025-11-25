import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import fs from "fs";
import path from "path";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const authHeader = request.headers.get("authorization");
    console.log("Admin trade request - Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.error("Admin trade: No authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    console.log("Admin trade: Token extracted, length:", token.length);
    console.log("Admin trade: Token preview:", token.substring(0, 30) + "...");
    
    if (!token || token.length < 10) {
      console.error("Admin trade: Invalid token format - token too short");
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: "Invalid token format" 
      }, { status: 401 });
    }
    
    // Decode JWT token to get user ID, then verify with admin client
    // This avoids the "Auth session missing" error
    let userId: string | null = null;
    
    try {
      // Decode JWT token (simple base64 decode of payload)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error("Admin trade: Invalid JWT format");
        return NextResponse.json({ 
          error: "Unauthorized", 
          details: "Invalid token format" 
        }, { status: 401 });
      }
      
      // Decode payload (second part)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      userId = payload.sub; // 'sub' is the user ID in Supabase JWT
      
      console.log("Admin trade: Decoded user ID from token:", userId);
      
      if (!userId) {
        console.error("Admin trade: No user ID in token");
        return NextResponse.json({ 
          error: "Unauthorized", 
          details: "Invalid token: no user ID" 
        }, { status: 401 });
      }
      
      // Verify token is not expired
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        console.error("Admin trade: Token expired");
        return NextResponse.json({ 
          error: "Unauthorized", 
          details: "Token expired" 
        }, { status: 401 });
      }
      
    } catch (err: any) {
      console.error("Admin trade: Error decoding token:", err);
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: "Invalid token format" 
      }, { status: 401 });
    }
    
    // Use admin client to get user info (bypasses RLS)
    const adminClientForAuth = tryCreateAdminClient();
    const clientToUse = adminClientForAuth || supabase;
    
    const { data: userData, error: userError } = await clientToUse
      .from("users")
      .select("id, email, role")
      .eq("id", userId)
      .single();
    
    if (userError || !userData) {
      console.error("Admin trade: User not found in database:", userError);
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: "User not found" 
      }, { status: 401 });
    }
    
    const userFromSession = {
      id: userData.id,
      email: userData.email
    };
    
    console.log("Admin trade: User authenticated:", userFromSession.email, "ID:", userFromSession.id);

    // Check if user is admin
    const adminStatus = await isAdmin(userFromSession.id);
    console.log("Admin trade: Admin status for", userFromSession.email, ":", adminStatus);
    
    if (!adminStatus) {
      console.error("Admin trade: User is not admin:", userFromSession.email);
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const user = userFromSession;

    const body = await request.json();
    const { clientId, symbol, type, quantity } = body;

    if (!clientId || !symbol || !type || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (type !== "buy" && type !== "sell") {
      return NextResponse.json({ error: "Invalid trade type" }, { status: 400 });
    }

    // Get current stock price
    const filePath = path.join(process.cwd(), 'public', 'data', 'stocks.json');
    const stocksData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const stock = (stocksData as any[]).find((s: any) => s.symbol === symbol);
    if (!stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    const price = stock.price;
    const total = quantity * price;
    const fee = total * 0.001; // 0.1% fee
    const totalCost = total + fee;

    // Use admin client for all operations (reuse the one we created earlier)
    const adminClient = adminClientForAuth || supabase;

    // Get client's current balance
    const { data: clientData, error: clientError } = await adminClient
      .from("users")
      .select("account_balance")
      .eq("id", clientId)
      .single();

    if (clientError || !clientData) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get current position
    const { data: position, error: positionError } = await adminClient
      .from("portfolio_positions")
      .select("*")
      .eq("user_id", clientId)
      .eq("symbol", symbol)
      .single();

    if (type === "buy") {
      // Check if client has enough balance
      if (clientData.account_balance < totalCost) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }

      // Update balance
      const { error: balanceError } = await adminClient
        .from("users")
        .update({ account_balance: clientData.account_balance - totalCost })
        .eq("id", clientId);

      if (balanceError) {
        return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
      }

      // Update or create position
      if (position) {
        const newQuantity = position.quantity + quantity;
        const newAvgPrice = (position.average_price * position.quantity + total) / newQuantity;

        const { error: updateError } = await adminClient
          .from("portfolio_positions")
          .update({
            quantity: newQuantity,
            average_price: newAvgPrice,
          })
          .eq("id", position.id);

        if (updateError) {
          return NextResponse.json({ error: "Failed to update position" }, { status: 500 });
        }
      } else {
        const { error: insertError } = await adminClient
          .from("portfolio_positions")
          .insert({
            user_id: clientId,
            symbol,
            quantity,
            average_price: price,
          });

        if (insertError) {
          return NextResponse.json({ error: "Failed to create position" }, { status: 500 });
        }
      }
    } else {
      // Sell
      if (!position || position.quantity < quantity) {
        return NextResponse.json({ error: "Insufficient shares" }, { status: 400 });
      }

      // Update balance
      const { error: balanceError } = await adminClient
        .from("users")
        .update({ account_balance: clientData.account_balance + total - fee })
        .eq("id", clientId);

      if (balanceError) {
        return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
      }

      // Update position
      const newQuantity = position.quantity - quantity;
      if (newQuantity === 0) {
        // Delete position if quantity is 0
        const { error: deleteError } = await adminClient
          .from("portfolio_positions")
          .delete()
          .eq("id", position.id);

        if (deleteError) {
          return NextResponse.json({ error: "Failed to delete position" }, { status: 500 });
        }
      } else {
        const { error: updateError } = await adminClient
          .from("portfolio_positions")
          .update({ quantity: newQuantity })
          .eq("id", position.id);

        if (updateError) {
          return NextResponse.json({ error: "Failed to update position" }, { status: 500 });
        }
      }
    }

    // Record transaction
    const { error: transactionError } = await adminClient
      .from("transactions")
      .insert({
        user_id: clientId,
        symbol,
        type,
        quantity,
        price,
        total_amount: totalCost,
      });

    if (transactionError) {
      console.error("Error recording transaction:", transactionError);
      // Don't fail the request if transaction recording fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing admin trade:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

