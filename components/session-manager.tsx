import { signIn, useSession } from "next-auth/react";
import React, { PropsWithChildren, useContext } from "react";
import { userFromSession, UserInfo } from "../lib/auth";

const Context = React.createContext<UserInfo | null>(null);

const SessionManager = ({ children }: PropsWithChildren<{}>) => {
  const session = useSession();

  if (session.status === "loading") {
    console.warn("Session was not already initialized");
  }

  const result = session.data === null ? null : userFromSession(session.data);

  return <Context.Provider value={result}>{children}</Context.Provider>;
};

export default SessionManager;

export function useUser(): UserInfo | null {
  return useContext(Context);
}

export async function signInWithGoogle(): Promise<void> {
  await signIn("google");
}
