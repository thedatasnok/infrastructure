<br />

<h3 align="center">infrastructure</h3>
<p align="center">tools for and details on my infrastructure setup in K8s</p>

## Why?
Why not? Mainly to gain experience with Kubernetes.
It also helps me systemize the things I do in Kubernetes, and allows for reuse/future reference.

## Custom tooling

- [Environment scaffolder](tools/environment-scaffolder)


## Installation of nodes/cluster
At the time of writing this the cluster consists of a single node. 
Whether this changes in the future is unknown, but it should be possible to add more nodes. 

1. Install MicroK8s, and enable the following addons: dns, ingress, rbac
  
    ```sh
    sudo snap install microk8s --classic
    microk8s status --wait-ready
    microk8s enable dashboard dns ingress rbac
    ```

2. Install cert-manager for TLS certificates

    ```sh
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.8.0/cert-manager.yaml
    ```

## Let's Encrypt ClusterIssuer

Once cert-manager is installed, a ClusterIssuer can be created to issue certificates from Let's Encrypt.

The [letsencrypt-issuer.yaml](manifests/letsencrypt.yaml) file showcases how this can be done.

## External DNS

To simplify maintaining A records for public facing services, I utilize External DNS. 
This allows me to create Ingress resources, and External DNS will automatically create the A records for me in my DNS provider.

The [externaldns.yaml](manifests/externaldns.yaml) file showcases how External DNS can be set up. Further details can be found on their [GitHub page](https://github.com/kubernetes-sigs/external-dns).

## VaultWarden


