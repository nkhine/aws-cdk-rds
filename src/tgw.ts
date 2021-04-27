import * as cdk from '@aws-cdk/core';
import { CfnTransitGateway } from '@aws-cdk/aws-ec2';
// https://github.com/tecracer/cdk-testing/blob/master/cdk-transitgateway/lib/vpc-setting.ts
export class CdkTransitgatewayStack extends cdk.Stack {
  public transitGateway: CfnTransitGateway;
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // define resources here...
    // const disable = "disable";
    const enable  = "enable";

    /** Base TGW
    * see https://docs.aws.amazon.com/vpc/latest/tgw/tgw-transit-gateways.html
    */
    const demoTGW = new CfnTransitGateway(this,"tgw",
    {
      amazonSideAsn: 65000,
      description: "BGP Main Transit Gateway",
      autoAcceptSharedAttachments: enable,
      dnsSupport: enable, 
      defaultRouteTableAssociation: enable,
      // tags: [new cdk.Tag('Name', 'demoTGW'), new cdk.Tag('Project', 'demo environment')],

    });
    cdk.Tags.of(demoTGW).add('Service', 'System');
    cdk.Tags.of(demoTGW).add('Purpose', 'Operations');

    this.transitGateway = demoTGW
  }
}