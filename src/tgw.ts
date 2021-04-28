import * as core from '@aws-cdk/core';
import { CfnTransitGateway } from '@aws-cdk/aws-ec2';
// https://github.com/tecracer/cdk-testing/blob/master/cdk-transitgateway/lib/vpc-setting.ts
export class CdkTransitgatewayStack extends core.Stack {
  public transitGateway: CfnTransitGateway;
  constructor(scope: core.Construct, id: string, props?: core.StackProps) {
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
      // tags: [new core.Tag('Name', 'demoTGW'), new core.Tag('Project', 'demo environment')],

    });
    core.Tags.of(demoTGW).add('Service', 'System');
    core.Tags.of(demoTGW).add('Purpose', 'Operations');

    this.transitGateway = demoTGW
  }
}