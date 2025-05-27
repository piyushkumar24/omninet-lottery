import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/data/user";
import { withErrorHandling } from "@/lib/api-handler";

/**
 * GET /api/users/:id
 * Get a user by ID (supports Edge operations)
 */
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const id = params.id;

  if (!id) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  const user = await getUserById(id);

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