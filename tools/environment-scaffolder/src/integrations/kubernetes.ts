import {
  CoreV1Api,
  KubeConfig,
  RbacAuthorizationV1Api,
  V1ClusterRole,
  V1ClusterRoleBinding,
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

  if (
    namespace.body.metadata === undefined ||
    namespace.body.metadata.name === undefined
  )
    throw new Error();

  let upserted: V1Namespace;

  try {
    await coreApi.readNamespace({
      name: namespace.body.metadata.name,
    });

    const updatedNamespace = await coreApi.replaceNamespace({
      name: namespace.body.metadata.name,
      body: namespace.body,
    });

    upserted = updatedNamespace;
  } catch (error) {
    const newNamespace = await coreApi.createNamespace(namespace);

    upserted = newNamespace;
  }

  return upserted;
};

export const createOrUpdateNamespacedServiceAccount = async (
  ...params: Parameters<typeof coreApi.createNamespacedServiceAccount>
) => {
  const [serviceAccount] = params;

  if (
    serviceAccount.body === undefined ||
    serviceAccount.body.metadata?.name === undefined
  )
    throw new Error();

  let upserted: V1ServiceAccount;

  try {
    await coreApi.readNamespacedServiceAccount({
      name: serviceAccount.body.metadata.name,
      namespace: serviceAccount.namespace,
    });

    const updatedServiceAccount = await coreApi.replaceNamespacedServiceAccount(
      {
        name: serviceAccount.body.metadata.name,
        namespace: serviceAccount.namespace,
        body: serviceAccount.body,
      }
    );

    upserted = updatedServiceAccount;
  } catch (error) {
    const newServiceAccount = await coreApi.createNamespacedServiceAccount({
      namespace: serviceAccount.namespace,
      body: serviceAccount.body,
    });

    upserted = newServiceAccount;
  }

  return upserted;
};

export const createOrUpdateNamespacedRole = async (
  ...params: Parameters<typeof rbacApi.createNamespacedRole>
) => {
  const [role] = params;

  if (role.body === undefined || role.body.metadata?.name === undefined)
    throw new Error();

  let upserted: V1Role;

  try {
    await rbacApi.readNamespacedRole({
      namespace: role.namespace,
      name: role.body.metadata.name,
    });

    const updatedRole = await rbacApi.replaceNamespacedRole({
      namespace: role.namespace,
      name: role.body.metadata.name,
      body: role.body,
    });

    upserted = updatedRole;
  } catch (error) {
    const newRole = await rbacApi.createNamespacedRole({
      namespace: role.namespace,
      body: role.body,
    });

    upserted = newRole;
  }

  return upserted;
};

export const createOrUpdateNamespacedRoleBinding = async (
  ...params: Parameters<typeof rbacApi.createNamespacedRoleBinding>
) => {
  const [roleBinding] = params;

  if (
    roleBinding.body.metadata === undefined ||
    roleBinding.body.metadata.name === undefined
  )
    throw new Error();

  let upserted: V1RoleBinding;

  try {
    await rbacApi.readNamespacedRoleBinding({
      namespace: roleBinding.namespace,
      name: roleBinding.body.metadata.name,
    });

    const updatedRoleBinding = await rbacApi.replaceNamespacedRoleBinding({
      namespace: roleBinding.namespace,
      name: roleBinding.body.metadata.name,
      body: roleBinding.body,
    });

    upserted = updatedRoleBinding;
  } catch (error) {
    const newRoleBinding = await rbacApi.createNamespacedRoleBinding({
      namespace: roleBinding.namespace,
      body: roleBinding.body,
    });

    upserted = newRoleBinding;
  }

  return upserted;
};

export const createOrUpdateNamespacedSecret = async (
  ...params: Parameters<typeof coreApi.createNamespacedSecret>
) => {
  const [secret] = params;

  if (
    secret.body.metadata === undefined ||
    secret.body.metadata.name === undefined
  )
    throw new Error();

  let upserted: V1Secret;

  try {
    await coreApi.readNamespacedSecret({
      namespace: secret.namespace,
      name: secret.body.metadata.name,
    });

    const updatedSecret = await coreApi.replaceNamespacedSecret({
      namespace: secret.namespace,
      name: secret.body.metadata.name,
      body: secret.body,
    });

    upserted = updatedSecret;
  } catch (error) {
    const newSecret = await coreApi.createNamespacedSecret({
      namespace: secret.namespace,
      body: secret.body,
    });

    upserted = newSecret;
  }

  return upserted;
};

export const createOrUpdateClusterRole = async (
  ...params: Parameters<typeof rbacApi.createClusterRole>
) => {
  const [role] = params;

  const roleName = role.body.metadata?.name;

  if (roleName === undefined) throw new Error();

  let upserted: V1ClusterRole;

  try {
    await rbacApi.readClusterRole({
      name: roleName,
    });
    upserted = await rbacApi.replaceClusterRole({
      name: roleName,
      body: role.body,
    });
  } catch (error) {
    upserted = await rbacApi.createClusterRole(role);
  }

  return upserted;
};

export const createOrUpdateClusterRoleBinding = async (
  ...params: Parameters<typeof rbacApi.createClusterRoleBinding>
) => {
  const [roleBinding] = params;

  const roleBindingName = roleBinding.body.metadata?.name;

  if (roleBindingName === undefined) throw new Error();

  let upserted: V1ClusterRoleBinding;

  try {
    await rbacApi.readClusterRoleBinding({
      name: roleBindingName,
    });
    upserted = await rbacApi.replaceClusterRoleBinding({
      name: roleBindingName,
      body: roleBinding.body,
    });
  } catch (error) {
    upserted = await rbacApi.createClusterRoleBinding(roleBinding);
  }

  return upserted;
};

export { coreApi, rbacApi, server };
