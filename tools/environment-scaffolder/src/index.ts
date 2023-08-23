import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import createEnvironment from './commands/create';

await yargs(hideBin(process.argv))
  .command(
    'create',
    'Creates a new environment',
    (yargs) => {
      return yargs
        .option('repository', {
          alias: 'repo',
          type: 'string',
          description:
            'The repository to create the environment in. Format: <owner>/<name>',
        })
        .option('environment', {
          alias: 'env',
          type: 'string',
          description: 'The name of the environment to create',
        })
        .option('namespacePrefix', {
          alias: 'nsPrefix',
          type: 'string',
          description: 'The prefix to use for the namespace',
        })
        .option('clusterIssuer', {
          type: 'string',
          description: 'The cluster issuer to use for certificates',
        })
        .option('hostname', {
          type: 'string',
          description: 'The hostname to use for the environment',
        })
        .option('delimiter', {
          type: 'string',
          description: '(optional) The delimiter to use for the namespace',
        });
    },
    async ({
      repository,
      environment,
      namespacePrefix,
      clusterIssuer,
      hostname,
      delimiter = '-',
    }) => {
      if (!repository?.includes('/')) throw new Error();
      if (!environment) throw new Error();
      if (!namespacePrefix) throw new Error();
      if (!clusterIssuer) throw new Error();
      if (!hostname) throw new Error();

      await createEnvironment(
        repository,
        environment,
        namespacePrefix,
        clusterIssuer,
        hostname,
        delimiter
      );
    }
  )
  .parse();
