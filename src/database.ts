import { SecurityGroup, Vpc } from "@aws-cdk/aws-ec2";
import * as rds from "@aws-cdk/aws-rds";
import * as core from "@aws-cdk/core";
// import { siteConfig } from "./config";
import * as secrets from '@aws-cdk/aws-secretsmanager';
const ssm = require('@aws-cdk/aws-ssm');

export const DB_NAME = "postgres";

interface ISubstrateProps {
  vpc: Vpc;
}

export class Database extends core.Construct {
  cluster: rds.ServerlessCluster;
  securityGroup: SecurityGroup;

  constructor(scope: core.Construct, id: string, { vpc }: ISubstrateProps) {
    super(scope, id);
    // MasterUsername admin cannot be used as it is a reserved word used by the engine
    const databaseUsername = 'root';
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

    this.securityGroup = new SecurityGroup(this, "DBSecurityGroup", {
      vpc,
      description: "Database ingress",
    });

    this.cluster = new rds.ServerlessCluster(this, "DBCluster", {
      vpc,
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(
        this,
        "ParameterGroup",
        "default.aurora-postgresql10"
      ),
      defaultDatabaseName: DB_NAME,
      credentials: rds.Credentials.fromSecret(databaseCredentialsSecret),
      securityGroups: [this.securityGroup],
      scaling: {
        minCapacity: rds.AuroraCapacityUnit.ACU_2, // default is 2 Aurora capacity units (ACUs)
        maxCapacity: rds.AuroraCapacityUnit.ACU_16, // default is 16 Aurora capacity units (ACUs)
        autoPause: core.Duration.minutes(10),
      },
      // https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html
      enableDataApi: true,
    });
    core.Tags.of(this.cluster).add('Service', 'System');
    core.Tags.of(this.cluster).add('Purpose', 'Operations');
  }
}