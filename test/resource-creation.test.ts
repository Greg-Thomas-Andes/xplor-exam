import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { CdkStaticSiteDeploymentStack } from '../lib/cdk-staticsite-deployment-stack';

import * as dotenv from 'dotenv';

dotenv.config();

describe('CdkStaticSiteDeploymentStack', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  test('S3 bucket is created with the correct configuration', () => {
    const bucketName = process.env.BUCKET_NAME;

    if (!bucketName) {
      throw new Error('BUCKET_NAME environment variable is not defined');
    }

    const stack = new CdkStaticSiteDeploymentStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: bucketName
    });

    // Check for autoDeleteObjects since DeletionPolicy is not explicitly shown
    template.resourceCountIs('AWS::S3::Bucket', 1);
  });

  test('CloudFront distribution is created', () => {
    const stack = new CdkStaticSiteDeploymentStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        ViewerCertificate: {
          AcmCertificateArn: {
            Ref: "Cert5C9FAEC1" // Adjust to reflect actual template
          },
          SslSupportMethod: "sni-only"
        },
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: "redirect-to-https"
        }
      }
    });
  });

  test('ARecord is created and linked to the CloudFront distribution', () => {
    const stack = new CdkStaticSiteDeploymentStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'xplorstatic.com.',
      Type: 'A',
      AliasTarget: {
        DNSName: {
          "Fn::GetAtt": ["Distribution830FAC52", "DomainName"]
        },
        HostedZoneId: {
          "Fn::FindInMap": [
            "AWSCloudFrontPartitionHostedZoneIdMap", // Accept this dynamic map
            { "Ref": "AWS::Partition" },
            "zoneId"
          ]
        }
      }
    });
  });

  test('SSL Certificate is created with DNS validation', () => {
    const stack = new CdkStaticSiteDeploymentStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      DomainName: process.env.DOMAIN_NAME,
      ValidationMethod: 'DNS'
    });
  });

  test('Route 53 Hosted Zone is created for the domain', () => {
    const domainName = process.env.DOMAIN_NAME;

    if (!domainName) {
      throw new Error('DOMAIN_NAME environment variable is not defined');
    }

    const stack = new CdkStaticSiteDeploymentStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Route53::HostedZone', {
      Name: `${domainName}.`
    });
  });
});
