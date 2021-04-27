// configuration for app

import { Peer } from "@aws-cdk/aws-ec2";
// read config from .env and .env.local
require("dotenv-flow").config();

interface IConfig {
  BASTION_KEYPAIR_NAME?: string;
  SSH_ALLOWED_HOSTS: string;
}

const env: IConfig = (process.env as unknown) as IConfig;
class Config {
  get bastionKeypairName() {
    return env.BASTION_KEYPAIR_NAME;
  }
  get sshAllowedHosts() {
    return [Peer.ipv4(env.SSH_ALLOWED_HOSTS)];
  }

}

export const siteConfig = new Config();