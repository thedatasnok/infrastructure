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
        })
        .option('environment', {
          alias: 'env',
          type: 'string',
        })
        .option('namespacePrefix', {
          alias: 'nsPrefix',
          type: 'string',
        })
        .option('clusterIssuer', {
          type: 'string',
        })
        .option('hostname', {
          type: 'string',
        })
        .option('delimiter', {
          type: 'string',
        });
    },
    async ({ repository, environment, namespacePrefix, clusterIssuer, hostname, delimiter = '-' }) => {
      if (!repository || !repository.includes('/')) throw new Error();
      if (!environment) throw new Error();
      if (!namespacePrefix) throw new Error();
      if (!clusterIssuer) throw new Error();
      if (!hostname) throw new Error();

      await createEnvironment(repository, environment, namespacePrefix, clusterIssuer, hostname, delimiter);
    }
  )
  .parse();
