import {
  CoreV1Api,
  KubeConfig,
  RbacAuthorizationV1Api,
  V1Namespace,
  V1Role,
  V1RoleBinding,
  V1Secret,
  V1ServiceAccount,
} from '@kubernetes/client-node';

const kubeconfig = new KubeConfig();

// loads the kubernetes config from the default location
// this is typically ~/.kube/config
kubeconfig.loadFromDefault();

const server = kubeconfig.getCurrentCluster()?.server;

const coreApi = kubeconfig.makeApiClient(CoreV1Api);
const rbacApi = kubeconfig.makeApiClient(RbacAuthorizationV1Api);

export const createOrUpdateNamespace = async (
  ...params: Parameters<typeof coreApi.createNamespace>
) => {
  const [namespace] = params;

  if (namespace.metadata === undefined || namespace.metadata.name === undefined)
    throw new Error();

  let upserted: V1Namespace;

  try {
    await coreApi.readNamespace(namespace.metadata.name);
    const updatedNamespace = await coreApi.replaceNamespace(
      namespace.metadata.name,
      namespace
    );

    upserted = updatedNamespace.body;
  } catch (error) {
    const newNamespace = await coreApi.createNamespace(namespace);

    upserted = newNamespace.body;
  }

  return upserted;
};

export const createOrUpdateNamespacedServiceAccount = async (
  ...params: Parameters<typeof coreApi.createNamespacedServiceAccount>
) => {
  const [namespace, serviceAccount] = params;

  if (
    serviceAccount.metadata === undefined ||
    serviceAccount.metadata.name === undefined
  )
    throw new Error();

  let upserted: V1ServiceAccount;

  try {
    await coreApi.readNamespacedServiceAccount(
      serviceAccount.metadata.name,
      namespace
    );
    const updatedServiceAccount = await coreApi.replaceNamespacedServiceAccount(
      serviceAccount.metadata.name,
      namespace,
      serviceAccount
    );

    upserted = updatedServiceAccount.body;
  } catch (error) {
    const newServiceAccount = await coreApi.createNamespacedServiceAccount(
      namespace,
      serviceAccount
    );

    upserted = newServiceAccount.body;
  }

  return upserted;
};

export const createOrUpdateNamespacedRole = async (
  ...params: Parameters<typeof rbacApi.createNamespacedRole>
) => {
  const [namespace, role] = params;

  if (role.metadata === undefined || role.metadata.name === undefined)
    throw new Error();

  let upserted: V1Role;

  try {
    await rbacApi.readNamespacedRole(role.metadata.name, namespace);
    const updatedRole = await rbacApi.replaceNamespacedRole(
      role.metadata.name,
      namespace,
      role
    );

    upserted = updatedRole.body;
  } catch (error) {
    const newRole = await rbacApi.createNamespacedRole(namespace, role);

    upserted = newRole.body;
  }

  return upserted;
};

export const createOrUpdateNamespacedRoleBinding = async (
  ...params: Parameters<typeof rbacApi.createNamespacedRoleBinding>
) => {
  const [namespace, roleBinding] = params;

  if (
    roleBinding.metadata === undefined ||
    roleBinding.metadata.name === undefined
  )
    throw new Error();

  let upserted: V1RoleBinding;

  try {
    await rbacApi.readNamespacedRoleBinding(
      roleBinding.metadata.name,
      namespace
    );
    const updatedRoleBinding = await rbacApi.replaceNamespacedRoleBinding(
      roleBinding.metadata.name,
      namespace,
      roleBinding
    );

    upserted = updatedRoleBinding.body;
  } catch (error) {
    const newRoleBinding = await rbacApi.createNamespacedRoleBinding(
      namespace,
      roleBinding
    );

    upserted = newRoleBinding.body;
  }

  return upserted;
};

export const createOrUpdateNamespacedSecret = async (
  ...params: Parameters<typeof coreApi.createNamespacedSecret>
) => {
  const [namespace, secret] = params;

  if (secret.metadata === undefined || secret.metadata.name === undefined)
    throw new Error();

  let upserted: V1Secret;

  try {
    await coreApi.readNamespacedSecret(secret.metadata.name, namespace);
    const updatedSecret = await coreApi.replaceNamespacedSecret(
      secret.metadata.name,
      namespace,
      secret
    );

    upserted = updatedSecret.body;
  } catch (error) {
    const newSecret = await coreApi.createNamespacedSecret(namespace, secret);

    upserted = newSecret.body;
  }

  return upserted;
};

export { coreApi, rbacApi, server };
