import { Client } from "pg";
import { getSecret } from "./getSecret";

const createDbInstance = async (dbSecretName: string) => {
  const secret = await getSecret(dbSecretName);
  if (!secret || !secret.SecretString) {
    throw Error("There is no secret string");
  }

  const parsedSecret = JSON.parse(secret.SecretString);
  return new Client({
    host: parsedSecret.db_host,
    user: parsedSecret.db_user,
    password: parsedSecret.db_password,
    database: parsedSecret.db_database,
    port: parsedSecret.db_port,
  });
};
const connectDatabase = (client: Client) => client.connect();

export { createDbInstance, connectDatabase };
