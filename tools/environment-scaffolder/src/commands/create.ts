import octokit, {
  ConfigMap,
  createOrUpdateSecrets,
  createOrUpdateVariables,
} from '../integrations/github';
import {
  coreApi,
  createOrUpdateClusterRole,
  createOrUpdateClusterRoleBinding,
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
    body: {
      metadata: {
        name: namespace,
        labels: {
          environment: environment,
        },
      },
    },
  });

  const SERVICE_ACCOUNT_NAME = 'workflows-sa';

  await createOrUpdateNamespacedServiceAccount({
    namespace,
    body: {
      metadata: {
        name: SERVICE_ACCOUNT_NAME,
      },
    },
  });

  const ROLE_NAME = 'full-access';

  await createOrUpdateNamespacedRole({
    namespace,
    body: {
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
    },
  });

  const ROLE_BINDING_SUBJECT = {
    kind: 'ServiceAccount',
    name: SERVICE_ACCOUNT_NAME,
    namespace: namespace,
  };

  await createOrUpdateNamespacedRoleBinding({
    namespace,
    body: {
      metadata: {
        name: 'workflows-sa-full-access',
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name: ROLE_NAME,
      },
      subjects: [ROLE_BINDING_SUBJECT],
    },
  });

  const CRD_ROLE_NAME = 'crd-access-role';

  await createOrUpdateClusterRole({
    body: {
      metadata: {
        name: CRD_ROLE_NAME,
      },
      rules: [
        {
          apiGroups: ['apiextensions.k8s.io'],
          resources: ['customresourcedefinitions'],
          verbs: [
            'get',
            'list',
            'watch',
            'create',
            'update',
            'patch',
            'delete',
          ],
        },
      ],
    },
  });

  await createOrUpdateClusterRoleBinding({
    body: {
      metadata: {
        name: 'workflows-sa-crd-access',
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
        name: CRD_ROLE_NAME,
      },
      subjects: [ROLE_BINDING_SUBJECT],
    },
  });

  const SECRET_NAME = 'workflows-sa-token';

  await createOrUpdateNamespacedSecret({
    namespace,
    body: {
      type: 'kubernetes.io/service-account-token',
      metadata: {
        name: SECRET_NAME,
        annotations: {
          'kubernetes.io/service-account.name': SERVICE_ACCOUNT_NAME,
        },
      },
    },
  });

  const k8sSecret = await coreApi.readNamespacedSecret({
    name: SECRET_NAME,
    namespace,
  });

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
