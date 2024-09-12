import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

const getSecret = async (secretName: string) => {
  console.log("=====>", SecretsManagerClient)
  const client = new SecretsManagerClient({
    region: "us-east-1",
  });
  
  let response;

  try {
    response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    );
  } catch (error) {
    throw error;
  }

  return response;
};

export { getSecret };
