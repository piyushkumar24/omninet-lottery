import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export const currentUser = async () => {
  const session = await auth();

  return session?.user;
};

export const currentRole = async () => {
  const session = await auth();

  return session?.user?.role;
};

export const getCurrentUser = async () => {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }
  
  return session.user;
};

export const isAuthenticated = async () => {
  const session = await auth();
  
  return !!session?.user;
};

export const isAdmin = async () => {
  const session = await auth();
  
  return session?.user?.role === UserRole.ADMIN;
};
