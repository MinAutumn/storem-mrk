"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";

const getUserByEmail = async (email: string) => {
    console.log("GUBE");
    const { databases } = await createAdminClient();
    const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal("email",[email])],
    );

    return result.total > 0 ? result.documents[0] : null;
};

const handleError = (error: unknown, message: string) => {
    console.log(message, error);
    throw error;
}

export const sendEmailOTP = async ({ email }: { email: string}) => {
    console.log("OTP");
    const { account } = await createAdminClient();

    try {
        const session = await account.createEmailToken(ID.unique(),email);

        return session.userId
    } catch (error) {
        handleError(error, "Failed to send email OTP");
    }
}

export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
  const existingUser = await getUserByEmail(email);

  const accountId = await sendEmailOTP({ email });
  if (!accountId) throw new Error("Failed to send an OTP");

  if (!existingUser) {
    console.log("Create Account");
    const { databases } = await createAdminClient();

    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      ID.unique(),
      {
        fullName,
        email,
        avatar: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fcommons.wikimedia.org%2Fwiki%2FFile%3AProfile_avatar_placeholder_large.png&psig=AOvVaw0-HPjLnSgMSUlJOsz4bY2a&ust=1754350376887000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCOCTs93m744DFQAAAAAdAAAAABAK",
        accountId,
      },
    );
  }
  
  return parseStringify({ accountId });
};