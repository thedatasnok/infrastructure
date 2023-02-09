import * as dotenv from 'dotenv';
import octokit, {
  createOrUpdateSecrets,
  ConfigMap,
} from './integrations/github';
import { coreApi } from './integrations/kubernetes';

dotenv.config();

// TODO: Get namespace and environment id from user input
const namespace = '';
const environmentId = '';

const k8sNamespace = await coreApi.createNamespace({
  metadata: {
    name: namespace,
    labels: {
      environment: environmentId,
    },
  },
});

const ghRepository = await octokit.repos.get({
  owner: 'thedatasnok',
  repo: 'fullstack-demo',
});

const ghEnvironment = await octokit.repos.createOrUpdateEnvironment({
  owner: 'thedatasnok',
  repo: 'fullstack-demo',
  environment_name: environmentId,
});

// TODO: Create secrets
const secrets: ConfigMap = {};

await createOrUpdateSecrets(
  ghRepository.data.id,
  ghEnvironment.data.name,
  secrets
);
