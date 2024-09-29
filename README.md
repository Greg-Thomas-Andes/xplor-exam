# Xplor Static Website Deployment Guide

This guide provides step-by-step instructions on how to deploy the AWS resource stack and validate that the website is accessible.

## Prerequisites

- Node.js (v18.x or later)
- An AWS account
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Deployment Steps

1. Clone the repository:

```sh {"id":"01J8YN36Q1F3AH712FENC9KKJV"}
git clone https://github.com/Greg-Thomas-Andes/xplor-exam
```

2. Install dependencies:

```sh {"id":"01J8YN36Q1F3AH712FERMYTTH1"}
npm install
```

3. Change the .env variable values to your domain name and bucket name

```sh {"id":"01J8YSE8YQJR7MAXAW2G78GCKZ"}
DOMAIN_NAME=<your-domain-name>
BUCKET_NAME=<your-bucket-name>
```

4. Bootstrap your AWS environment (if not already done):

```sh {"id":"01J8YN36Q1F3AH712FET418D7H"}
cdk bootstrap aws://<your-account-id>/<your-region>
```

5. Synthesize the CloudFormation template:

```text {"id":"01J8YN36Q1F3AH712FET8BV394"}
cdk synth
```

6. Deploy the CDK application:

```sh {"id":"01J8YN36Q1F3AH712FEVNANGAG"}
cdk deploy --profile <your-profile-name>
```

7. After the deployment is complete, the CDK will output the website URL. Note this URL for validation.

## Validating Website Accessibility

To ensure your website is accessible, follow these steps:

1. After deployment, note the CloudFront distribution URL and your custom domain name from the CDK output.

2. DNS Propagation:
   - It may take some time for DNS changes to propagate. You can check propagation status using a tool like [whatsmydns.net](https://www.whatsmydns.net/).

3. Access via Custom Domain:
   - Open a web browser and navigate to your custom domain (https://your-domain.com).
   - Verify that the website loads correctly over HTTPS.
   - Check that the SSL certificate is valid and issued by Amazon (click the padlock icon in the browser's address bar).

4. Access via CloudFront URL:
   - Navigate to the CloudFront distribution URL (e.g., https://d1234abcd.cloudfront.net).
   - Confirm that the content matches what's served via your custom domain.

5. S3 Bucket Access:
   - Attempt to access your S3 bucket directly via the url in AWS Console.

6. CloudFront Behavior:
   - Try accessing your site with HTTP. It should automatically redirect to HTTPS.

If you encounter any issues during validation:
- Review the CloudFormation stack events in the AWS Console.
- Check S3 bucket permissions and CloudFront distribution settings.
- Verify that the Route 53 A record and name servers are correctly pointing to your CloudFront distribution.
- Ensure your SSL/TLS certificate in ACM is fully validated and associated with your distribution.

## Testing

The current implemented test is only for checking resource creation. The other tests which is intended for testing deployment is commented out but can be used for future improvements.

To trigger a new test: 

```sh {"id":"01J8YRYNHEC198GHPDTRF4PPYS"}
npm run test
```

## Cleaning Up

To avoid incurring unnecessary costs, remember to destroy the CDK stack when you're done:

```sh {"id":"01J8YN36Q1F3AH712FEYHS1D17"}
cdk destroy
```

## Future Improvements

### Security

1. Implement AWS WAF (Web Application Firewall) to protect against common web exploits.
Note: There is code commented out at the bottom of ./lib/cdk-staticsite-deployment-stack.ts. This is intended to deploy an AWS WAF in front of CloudFront. 

2. Enable AWS Shield for DDoS protection.
3. Implement strict Content Security Policy (CSP) headers.

### Observability

1. Set up AWS CloudWatch Alarms for key metrics (e.g., 4xx and 5xx errors, latency).
2. Implement AWS X-Ray for distributed tracing.
3. Use AWS CloudTrail for auditing API calls and resource changes.
4. Set up centralized logging using AWS CloudWatch Logs.
5. Create a dashboard in AWS CloudWatch for visualizing key metrics.

### Cost Optimization

1. Implement AWS S3 Intelligent-Tiering for automatic cost optimization of stored objects.
2. Implement AWS Budgets to set custom cost and usage budgets.
3. Use AWS Cost Explorer to identify cost-saving opportunities.

For more information on CDK commands and options, refer to the [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html).
