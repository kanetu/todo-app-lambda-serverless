import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

const getSecret = async (secretName: string) => {
  const isOffline = process.env.IS_OFFLINE;
  const client = new SecretsManagerClient({
    region: "us-east-1",
    ...(isOffline ? { endpoint: 'http://localhost:4566' } : {})
  });

  let response;

  try {
    response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    );
  } catch (error) {
    console.error(error)
  }
  return response;
};

export { getSecret };
