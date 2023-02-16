import octokit, {
  ConfigMap,
  createOrUpdateSecrets,
  createOrUpdateVariables,
} from '../integrations/github';
import {
  coreApi,
  createOrUpdateNamespace,
  createOrUpdateNamespacedRole,
  createOrUpdateNamespacedRoleBinding,
  createOrUpdateNamespacedSecret,
  createOrUpdateNamespacedServiceAccount,
  server,
} from '../integrations/kubernetes';

const createEnvironment = async (
  repository: string,
  environment: string,
  namespacePrefix: string,
  clusterIssuer: string,
  hostname: string,
  delimiter: string = '-'
) => {
  const [repositoryOwner, repositoryName] = repository.split('/');
  const namespace = [namespacePrefix, environment].join(delimiter);

  type Repository = Awaited<ReturnType<typeof octokit.repos.get>>['data'];

  let githubRepository: Repository;

  try {
    const ghRepo = await octokit.repos.get({
      owner: repositoryOwner,
      repo: repositoryName,
    });

    githubRepository = ghRepo.data;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  await createOrUpdateNamespace({
    metadata: {
      name: namespace,
      labels: {
        environment: environment,
      },
    },
  });

  const SERVICE_ACCOUNT_NAME = 'workflows-sa';

  await createOrUpdateNamespacedServiceAccount(namespace, {
    metadata: {
      name: SERVICE_ACCOUNT_NAME,
    },
  });

  const ROLE_NAME = 'full-access';

  await createOrUpdateNamespacedRole(namespace, {
    metadata: {
      name: ROLE_NAME,
    },
    rules: [
      {
        apiGroups: ['', 'extensions', 'apps', 'networking.k8s.io'],
        resources: ['*'],
        verbs: ['*'],
      },
    ],
  });

  await createOrUpdateNamespacedRoleBinding(namespace, {
    metadata: {
      name: 'workflows-sa-full-access',
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'Role',
      name: ROLE_NAME,
    },
    subjects: [
      {
        kind: 'ServiceAccount',
        name: SERVICE_ACCOUNT_NAME,
        namespace: namespace,
      },
    ],
  });

  const SECRET_NAME = 'workflows-sa-token';

  await createOrUpdateNamespacedSecret(namespace, {
    type: 'kubernetes.io/service-account-token',
    metadata: {
      name: SECRET_NAME,
      annotations: {
        'kubernetes.io/service-account.name': SERVICE_ACCOUNT_NAME,
      },
    },
  });

  const { body: k8sSecret } = await coreApi.readNamespacedSecret(
    SECRET_NAME,
    namespace
  );

  await octokit.repos.createOrUpdateEnvironment({
    owner: githubRepository.owner.login,
    repo: githubRepository.name,
    environment_name: environment,
  });

  const variables: ConfigMap = {
    K8S_NAMESPACE: namespace,
    K8S_API_URL: server ?? '',
    K8S_CLUSTER_ISSUER: clusterIssuer,
    HOSTNAME: hostname,
  };

  await createOrUpdateVariables(githubRepository.id, environment, variables);

  const secrets: ConfigMap = {
    K8S_SECRET: JSON.stringify(k8sSecret),
  };

  await createOrUpdateSecrets(githubRepository.id, environment, secrets);
};

export default createEnvironment;
