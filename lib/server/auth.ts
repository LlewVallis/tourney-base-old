import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { userFromSession, UserInfo } from "../auth";
import { authOptions } from "../../pages/api/auth/[...nextauth]";

export async function getUserInfo(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<UserInfo | null> {
  const session = await getServerSession(req, res, authOptions);
  if (session === null) return null;
  return userFromSession(session);
}
