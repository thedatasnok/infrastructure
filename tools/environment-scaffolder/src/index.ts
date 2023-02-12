import octokit, {
  ConfigMap,
  createOrUpdateSecrets,
  createOrUpdateVariables,
} from './integrations/github';
import { coreApi, rbacApi, server } from './integrations/kubernetes';

const repositoryOwner = 'thedatasnok';
const repositoryName = 'fullstack-demo';

const environmentId = 'production';
const namespacePrefix = 'demostack';
const namespace = [namespacePrefix, environmentId].join('-');

const clusterIssuer = 'letsencrypt';
const hostname = 'fsprod.datasnok.cool';

type Repository = Awaited<ReturnType<typeof octokit.repos.get>>['data'];

let repository: Repository;

try {
  const ghRepo = await octokit.repos.get({
    owner: repositoryOwner,
    repo: repositoryName,
  });

  repository = ghRepo.data;
} catch (error) {
  console.error(error);
  process.exit(1);
}

await coreApi.createNamespace({
  metadata: {
    name: namespace,
    labels: {
      environment: environmentId,
    },
  },
});

const SERVICE_ACCOUNT_NAME = 'workflows-sa';

await coreApi.createNamespacedServiceAccount(namespace, {
  metadata: {
    name: SERVICE_ACCOUNT_NAME,
  },
});

const ROLE_NAME = 'full-access';

await rbacApi.createNamespacedRole(namespace, {
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

await rbacApi.createNamespacedRoleBinding(namespace, {
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

await coreApi.createNamespacedSecret(namespace, {
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
  owner: repository.owner.login,
  repo: repository.name,
  environment_name: environmentId,
});

const variables: ConfigMap = {
  K8S_NAMESPACE: namespace,
  K8S_API_URL: server ?? '',
  K8S_CLUSTER_ISSUER: clusterIssuer,
  HOSTNAME: hostname,
};

await createOrUpdateVariables(repository.id, environmentId, variables);

const secrets: ConfigMap = {
  K8S_SECRET: JSON.stringify(k8sSecret),
};

await createOrUpdateSecrets(repository.id, environmentId, secrets);
