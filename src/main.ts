import * as core from "@aws-cdk/core";
import { siteConfig } from "./config";
import { Port, Vpc } from "@aws-cdk/aws-ec2";
import { Database } from "./database";
import { Bastion } from "./bastion";

export class Stack extends core.Stack {

  constructor(scope: core.Construct, id: string, props: core.StackProps = {}) {
    super(scope, id, props);

    // define resources here...
    // VPC
    const vpc = new Vpc(this, 'Vpc', {
      cidr: '10.80.0.0/16',
      // maxAzs: 2, // Default is all AZs in the region
      // increase this if you want to be highly available.
      natGateways: 1,
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
      // Display commands for connect bastion host using ec2 instance connect
      new core.CfnOutput(this, 'CreateSshKeyCommand', { value: bastion.createSshKeyCommand });
      new core.CfnOutput(this, 'PushSshKeyCommand', { value: bastion.pushSshKeyCommand });
      new core.CfnOutput(this, 'SshCommand', { value: bastion.sshCommand});

    }


    new core.CfnOutput(this,'ClusterARN', {
      description: 'The RDS cluster ARN',
      value: db.cluster.clusterArn,
      exportName: `${this.stackName}-CLUSTER-ARN`
    });

    new core.CfnOutput(this,'ClusterId', {
      description: 'The RDS cluster identifier',
      value: db.cluster.clusterIdentifier,
      exportName: `${this.stackName}-CLUSTER-ID`
    });

    new core.CfnOutput(this,'DNSName', {
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

const app = new core.App();

new Stack(app, 'SLS-RDS-DEV', { env: devEnv });
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();