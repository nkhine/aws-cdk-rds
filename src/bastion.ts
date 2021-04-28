import {
  BastionHostLinux,
  CfnEIP,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "@aws-cdk/aws-ec2";
import * as core from "@aws-cdk/core";
import { siteConfig } from "./config";

interface IBastionProps {
  vpc: Vpc;
}

// Optional EC2 host to provide an entrypoint into the VPC
// useful for accessing the database
export class Bastion extends core.Construct {
  securityGroup: SecurityGroup;
  elasticIp: CfnEIP;
  createSshKeyCommand: string;
  pushSshKeyCommand: string;
  sshCommand: string;

  constructor(scope: core.Construct, id: string, { vpc }: IBastionProps) {
    super(scope, id);

    const securityGroup = new SecurityGroup(this, "SecGroup", {
      vpc,
      securityGroupName: "Bastion",
    });
    this.securityGroup = securityGroup;

    const host = new BastionHostLinux(this, "Host", {
      vpc,
      securityGroup,
      subnetSelection: {
        subnetType: SubnetType.PUBLIC,
      },
    });

    this.elasticIp = new CfnEIP(this, "EIP", {
      domain: "vpc",
      instanceId: host.instanceId,
    });
    siteConfig.sshAllowedHosts.map((peer) => host.allowSshAccessFrom(peer));
    host.instance.instance.keyName = siteConfig.bastionKeypairName;

    // Get profile from context variables
    const profile = this.node.tryGetContext('profile');

    // Display commands for connect bastion host using ec2 instance connect
    this.createSshKeyCommand = 'ssh-keygen -t rsa -f my_rsa_key';
    this.pushSshKeyCommand = `aws ec2-instance-connect send-ssh-public-key --region ${core.Aws.REGION} --instance-id ${host.instanceId} --availability-zone ${host.instanceAvailabilityZone} --instance-os-user ec2-user --ssh-public-key file://my_rsa_key.pub ${profile ? `--profile ${profile}` : ''}`;
    this.sshCommand = `ssh -o "IdentitiesOnly=yes" -i my_rsa_key ec2-user@${host.instancePublicDnsName}`;

  }
}