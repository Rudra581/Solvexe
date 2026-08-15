import { db } from "../db";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import { JWTPayload, SignJWT, importJWK } from "jose";
import { Session } from "next-auth";
import { CredentialSchema } from "./auth-schema";
import Credentials from "next-auth/providers/credentials";
import { error } from "node:console";
interface token extends JWT {
  uid: string;
  jwtToken: string;
}

export interface session extends Session {
  user: {
    id: string;
    jwtToken: string;
    email: string;
    name: string;
  };
}
interface User {
  id: string;
  name: string;
  email: string;
  token: string;
}

const generateJWT = async (payload: JWTPayload) => {
  const secret = process.env.JWT_SECRET ;
  if(!secret){
    throw new Error("JWT_SECRET environment variable is required!");
  }
  const jwk = await importJWK({ k: secret, alg: "HS256", kty: "oct" });

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(jwk);

  return jwt;
};

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "email", type: "text", placeholder: "" },
        password: { label: "password", type: "password", placeholder: "" },
      },
      async authorize(credentials: any) {
        const result = CredentialSchema.safeParse(credentials);
        if (!result.success) {
            throw new Error("Invalid input type");
        }
        const {username ,password } = result.data;

        const hashedPassword = await bcrypt.hash(password, 10);

        const userDb = await db.user.findFirst({
          where: {
            email: username,
          },
          select: {
            password: true,
            id: true,
            name: true,
          },
        });

        if (userDb) {
          if (await bcrypt.compare(password, userDb.password)) {
            const jwt = await generateJWT({
              id: userDb.id,
            });

            return {
              id: userDb.id,
              name: userDb.name,
              email: username,
              token: jwt,
            };
          } else {
            return null;
          }
        }
        try {
          // sign up
          const user = await db.user.create({
            data: {
              email: username,
              name: username,
              password: hashedPassword,
            },
          });

          const jwt = await generateJWT({
            id: user.id,
          });

          return {
            id: user.id,
            name: username,
            email: username,
            token: jwt,
          };
        } catch (e) {
          return null;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    session: async ({ session, token }) => {
      const newSession: session = session as session;
      if (newSession.user && token.uid) {
        newSession.user.id = token.uid as string;
        newSession.user.jwtToken = token.jwtToken as string;
      }
      return newSession!;
    },
    jwt: async ({ token, user, account }): Promise<JWT> => {
      const newToken = token;

      if (account && account.provider !== "credentials" && user) {
        let dbUser = await db.user.findUnique({
          where: { email: user.email! },
        });

        if (!dbUser) {
          dbUser = await db.user.create({
            data: {
              email: user.email!,
              name: user.name,
              password: "",
            },
          });
        }

        newToken.uid = dbUser.id;
        newToken.jwtToken = await generateJWT({ id: dbUser.id });
      } else if (user) {
        newToken.uid = user.id;
        newToken.jwtToken = (user as User).token;
      }
      return newToken;
    },
  },
} satisfies NextAuthOptions;
