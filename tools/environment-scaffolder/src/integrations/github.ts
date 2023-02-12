import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import sodium from 'libsodium-wrappers';

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
});

/**
 * A map of string keys to string values.
 * Used to represent environment variables and secrets.
 */
export type ConfigMap = {
  [key: string]: string;
};

/**
 * Creates or updates environment variables for a given environment in a given repository.
 *
 * @param repositoryId the id of the repository to create the variables in
 * @param environmentName the name of the environment to create the variables in
 * @param variables the variables to create or update
 */
export const createOrUpdateVariables = async (
  repositoryId: number,
  environmentName: string,
  variables: ConfigMap
) => {
  for (const [variableName, variableValue] of Object.entries(variables)) {
    await octokit.actions.createEnvironmentVariable({
      repository_id: repositoryId,
      environment_name: environmentName,
      name: variableName,
      value: variableValue,
    });
  }
};

/**
 * Creates or updates secrets for a given environment in a given repository.
 *
 * @param repositoryId the id of the repository to create the secrets in
 * @param environmentName the name of the environment to create the secrets in
 * @param secrets the secrets to create or update
 */
export const createOrUpdateSecrets = async (
  repositoryId: number,
  environmentName: string,
  secrets: ConfigMap
) => {
  const publicKey = await octokit.actions.getEnvironmentPublicKey({
    environment_name: environmentName,
    repository_id: repositoryId,
  });

  const { key_id, key } = publicKey.data;

  const binaryKey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);

  for (const [secretName, secretValue] of Object.entries(secrets)) {
    const binarySecret = sodium.from_string(secretValue);
    const bytesEncoded = sodium.crypto_box_seal(binarySecret, binaryKey);
    const encryptedValue = sodium.to_base64(
      bytesEncoded,
      sodium.base64_variants.ORIGINAL
    );

    await octokit.actions.createOrUpdateEnvironmentSecret({
      repository_id: repositoryId,
      environment_name: environmentName,
      secret_name: secretName,
      encrypted_value: encryptedValue,
      key_id,
    });
  }
};

export default octokit;
