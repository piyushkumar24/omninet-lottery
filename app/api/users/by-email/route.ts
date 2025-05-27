import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/data/user";
import { withErrorHandling } from "@/lib/api-handler";

/**
 * GET /api/users/by-email
 * Get a user by email (supports Edge operations)
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Email parameter is required" },
      { status: 400 }
    );
  }

  const user = await getUserByEmail(email);

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  // Only return essential user data for security
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    emailVerified: user.emailVerified,
    isTwoFactorEnabled: user.isTwoFactorEnabled,
    isBlocked: user.isBlocked,
  });
}); 