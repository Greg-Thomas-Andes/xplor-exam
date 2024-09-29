import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { Distribution, OriginAccessIdentity, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';

dotenv.config();

export class CdkStaticSiteDeploymentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Define the domain name for the static site. This is the DNS name that will be associated with the CloudFront distribution.
    const domainName = process.env.DOMAIN_NAME as string;

    // Create a Hosted Zone in Route 53 for the domain. This manages DNS records for the domain.
    const hostedZone = new HostedZone(this, 'HostedZone', {
      zoneName: domainName, // Domain name to manage DNS for.
    });

    // Provision an SSL/TLS certificate using AWS Certificate Manager (ACM) for the domain.
    const cert = new Certificate(this, 'Cert', {
      domainName, // The domain that the certificate is valid for.
      validation: CertificateValidation.fromDns(hostedZone), // Use DNS validation via Route 53.
    });

    // Create an S3 bucket to store the static website files (HTML, CSS, JS, etc.).
    const frontendBucket = new Bucket(this, 'FEBucket', {
      bucketName: process.env.BUCKET_NAME,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // console.log('Bucket Name:', process.env.BUCKET_NAME);

    // Ensuring deployment waits for bucket creation
    new BucketDeployment(this, 'DeployWebsite', {
      sources: [Source.asset('./website')],
      destinationBucket: frontendBucket,
    }).node.addDependency(frontendBucket);

    // Create an Origin Access Identity (OAI) to restrict direct access to the S3 bucket.
    const oai = new OriginAccessIdentity(this, 'OAI');

    // Grant CloudFront's OAI read access to the S3 bucket.
    frontendBucket.grantRead(oai);

    // Create a CloudFront distribution to serve the static content from the S3 bucket.
    const distribution = new Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html', // The default object to serve when accessing the root of the domain.
      defaultBehavior: {
        origin: new S3Origin(frontendBucket, {
          originAccessIdentity: oai, // Ensure CloudFront is the only entity with access to the bucket.
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS, // Enforce HTTPS by redirecting all HTTP traffic.
      },
      domainNames: [domainName], // Associate the CloudFront distribution with the custom domain.
      certificate: cert, // Use the ACM certificate to enable HTTPS for the custom domain.
    });

    // Create an ARecord in Route 53 that maps the domain name to the CloudFront distribution.
    new ARecord(this, 'ARecord', {
      zone: hostedZone, // The hosted zone in which to create the A record.
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)), // Route DNS to the CloudFront distribution.
    });

    // // Create a WAF Web ACL with some basic rules to protect the CloudFront distribution.
    // const webACL = new CfnWebACL(this, 'WebACL', {
    //   defaultAction: { allow: {} }, // Default to allow requests
    //   scope: 'CLOUDFRONT', // WebACL for CloudFront
    //   rules: [
    //     {
    //       name: 'AWS-AWSManagedRulesCommonRuleSet',
    //       priority: 1,
    //       statement: {
    //         managedRuleGroupStatement: {
    //           vendorName: 'AWS',
    //           name: 'AWSManagedRulesCommonRuleSet', // Predefined rules for common threats
    //         },
    //       },
    //       overrideAction: { none: {} },
    //       visibilityConfig: {
    //         cloudWatchMetricsEnabled: true,
    //         metricName: 'CommonRuleSet',
    //         sampledRequestsEnabled: true,
    //       },
    //     },
    //     {
    //       name: 'RateLimitRule',
    //       priority: 2,
    //       statement: {
    //         rateBasedStatement: {
    //           limit: 1000, // Set the rate limit to 1000 requests per 5 minutes
    //           aggregateKeyType: 'IP',
    //         },
    //       },
    //       action: { block: {} },
    //       visibilityConfig: {
    //         cloudWatchMetricsEnabled: true,
    //         metricName: 'RateLimitRule',
    //         sampledRequestsEnabled: true,
    //       },
    //     },
    //   ],
    //   visibilityConfig: {
    //     cloudWatchMetricsEnabled: true,
    //     metricName: 'WebACL',
    //     sampledRequestsEnabled: true,
    //   },
    // });

    // // Manually construct the distributionArn using CDK's formatArn method
    // const distributionArn = this.formatArn({
    //   service: 'cloudfront',
    //   resource: 'distribution',
    //   resourceName: distribution.distributionId, // Use distributionId to build the ARN
    // });

    // // Associate the WAF Web ACL with the CloudFront distribution.
    // new CfnWebACLAssociation(this, 'WebACLAssociation', {
    //   resourceArn: distributionArn, // Manually constructed distribution ARN
    //   webAclArn: webACL.attrArn, // Link the WebACL to the CloudFront distribution.
    // });
  }
}
