import { App, Construct, Duration, Stack, StackProps } from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import * as secrets from '@aws-cdk/aws-secretsmanager';
const ssm = require('@aws-cdk/aws-ssm');

export class MwCatalogueStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    // define resources here...
    // RDS needs to be setup in a VPC
    const vpc = new ec2.Vpc(this, 'Vpc', {
      cidr: '10.80.0.0/16',
      maxAzs: 2, // Default is all AZs in the region
    });
    const databaseUsername = 'magic';
    // Dynamically generate the username and password, then store in secrets manager
    const databaseCredentialsSecret = new secrets.Secret(this, 'DBCredentialsSecret', {
      secretName: id+'-rds-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: databaseUsername,
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'password'
      }
    });
    
    new ssm.StringParameter(this, 'DBCredentialsArn', {
      parameterName: 'rds-credentials-arn',
      stringValue: databaseCredentialsSecret.secretArn,
    });

    new rds.ServerlessCluster(this, 'DBCluster', {
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      vpc: vpc,
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(this, 'ParameterGroup', 'default.aurora-postgresql10'),
      // credentials: rds.Credentials.fromSecret(databaseCredentialsSecret),
      scaling: {
        minCapacity: rds.AuroraCapacityUnit.ACU_2, // default is 2 Aurora capacity units (ACUs)
        maxCapacity: rds.AuroraCapacityUnit.ACU_16, // default is 16 Aurora capacity units (ACUs)
        autoPause: Duration.minutes(10),
      },
    });

  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MwCatalogueStack(app, 'MW-CATALOGUE-CURATION-DEV', { env: devEnv });
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();