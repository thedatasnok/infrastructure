import {
  CoreV1Api,
  KubeConfig,
  RbacAuthorizationV1Api,
} from '@kubernetes/client-node';

const kubeconfig = new KubeConfig();

// loads the kubernetes config from the default location
// this is typically ~/.kube/config
kubeconfig.loadFromDefault();

const server = kubeconfig.getCurrentCluster()?.server;

const coreApi = kubeconfig.makeApiClient(CoreV1Api);
const rbacApi = kubeconfig.makeApiClient(RbacAuthorizationV1Api);

export { coreApi, rbacApi, server };
