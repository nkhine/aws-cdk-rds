import * as cdk from "@aws-cdk/core";
import { siteConfig } from "./config";
import { Port, Vpc } from "@aws-cdk/aws-ec2";
import { Database } from "./database";
import { Bastion } from "./bastion";
// import * as rds from '@aws-cdk/aws-rds';
// import * as secrets from '@aws-cdk/aws-secretsmanager';
// import { StringParameter } from '@aws-cdk/aws-ssm'
// // const ssm = require('@aws-cdk/aws-ssm');
// import {AttachmentTargetType, ISecretAttachmentTarget, SecretAttachmentTargetProps, SecretTargetAttachment} from "@aws-cdk/aws-secretsmanager";

export class Stack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps = {}) {
    super(scope, id, props);

    // define resources here...
    // VPC
    const vpc = new Vpc(this, 'Vpc', {
      cidr: '10.80.0.0/16',
      // maxAzs: 2, // Default is all AZs in the region
			// increase this if you want to be highly available.
			natGateways: 1,
			// subnetConfiguration: [
      //   {
      //     name: 'Isolated',
      //     subnetType: SubnetType.ISOLATED,
      //     cidrMask: 26,
      //   },
      // ],
    });
		// DB
		const db = new Database(this, "DB", {
			vpc,
		});
    // Bastion host
    let bastion;
    if (siteConfig.bastionKeypairName) {
      bastion = new Bastion(this, "Bastion", { vpc });
      db.securityGroup.addIngressRule(bastion.securityGroup, Port.tcp(5432));
    }
    // // MasterUsername admin cannot be used as it is a reserved word used by the engine
    // const databaseUsername = 'root';
    // // Dynamically generate the username and password, then store in secrets manager
    // const databaseCredentialsSecret = new secrets.Secret(this, 'DBCredentialsSecret', {
    //   secretName: id+'-rds-credentials',
    //   generateSecretString: {
    //     secretStringTemplate: JSON.stringify({
    //       username: databaseUsername,
    //     }),
    //     excludePunctuation: true,
    //     includeSpace: false,
    //     generateStringKey: 'password'
    //   }
    // });
    
    // new StringParameter(this, 'DBCredentialsArn', {
    //   parameterName: 'rds-credentials-arn',
    //   stringValue: databaseCredentialsSecret.secretArn,
    // });

    // new cdk.CfnOutput(this,'dbCredentialsSecretARN', {
    //   description: 'The RDS cluster credentials secret ARN',
    //   value: databaseCredentialsSecret.secretArn,
    //   exportName: `${this.stackName}-CREDENTIALS-ARN`
    // });

    // const cluster = new rds.ServerlessCluster(this, 'DBCluster', {
    //   engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
    //   vpc: vpc,
    //   parameterGroup: rds.ParameterGroup.fromParameterGroupName(this, 'ParameterGroup', 'default.aurora-postgresql10'),
		// 	vpcSubnets: {
		// 		// https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-ec2.SubnetType.html
    //     subnetType: SubnetType.ISOLATED,
    //   },
    //   credentials: rds.Credentials.fromSecret(databaseCredentialsSecret),
    //   scaling: {
    //     minCapacity: rds.AuroraCapacityUnit.ACU_2, // default is 2 Aurora capacity units (ACUs)
    //     maxCapacity: rds.AuroraCapacityUnit.ACU_16, // default is 16 Aurora capacity units (ACUs)
    //     autoPause: cdk.Duration.minutes(10),
    //   },
    //   // https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html
    //   enableDataApi: true,
    //   backupRetention: cdk.Duration.days(7),
    //   defaultDatabaseName: 'postgres',
		// 	removalPolicy: cdk.RemovalPolicy.DESTROY,
    // });

    // cdk.Tags.of(cluster).add('Service', 'System');
    // cdk.Tags.of(cluster).add('Purpose', 'Operations');

    new cdk.CfnOutput(this,'ClusterARN', {
      description: 'The RDS cluster ARN',
      value: db.cluster.clusterArn,
      exportName: `${this.stackName}-CLUSTER-ARN`
    });

    new cdk.CfnOutput(this,'ClusterId', {
      description: 'The RDS cluster identifier',
      value: db.cluster.clusterIdentifier,
      exportName: `${this.stackName}-CLUSTER-ID`
    });

    new cdk.CfnOutput(this,'DNSName', {
      description: 'The connection endpoint for the DB cluster.',
      value: db.cluster.clusterEndpoint.hostname,
      exportName: `${this.stackName}-CLUSTER-DNS`
    });

  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();

new Stack(app, 'SLS-RDS-DEV', { env: devEnv });
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();