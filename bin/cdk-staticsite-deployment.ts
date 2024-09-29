import { App } from 'aws-cdk-lib';

import { CdkStaticSiteDeploymentStack } from '../lib/cdk-staticsite-deployment-stack';

import 'source-map-support/register';

const app = new App();
new CdkStaticSiteDeploymentStack(app, 'CdkStaticSiteDeploymentStack', {
});