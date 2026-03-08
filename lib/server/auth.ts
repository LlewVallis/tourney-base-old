import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { userFromSession, UserInfo } from "../auth";
import { authOptions } from "../../pages/api/auth/[...nextauth]";

type AuthReq = NextApiRequest | GetServerSidePropsContext["req"];
type AuthRes = NextApiResponse | GetServerSidePropsContext["res"];

export async function getUserInfo(
  req: AuthReq,
  res: AuthRes
): Promise<UserInfo | null> {
  const session = await getServerSession(req as any, res as any, authOptions);
  if (session === null) return null;
  return userFromSession(session);
}
