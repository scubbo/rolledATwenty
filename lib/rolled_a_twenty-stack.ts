import {DnsValidatedCertificate} from '@aws-cdk/aws-certificatemanager';
import {Distribution, ViewerProtocolPolicy} from '@aws-cdk/aws-cloudfront';
import {S3Origin} from '@aws-cdk/aws-cloudfront-origins';
import {PolicyStatement} from '@aws-cdk/aws-iam';
import {ARecord, HostedZone, RecordTarget} from "@aws-cdk/aws-route53";
import {CloudFrontTarget} from "@aws-cdk/aws-route53-targets";
import {Bucket} from '@aws-cdk/aws-s3';
import {BucketDeployment, Source} from '@aws-cdk/aws-s3-deployment';
import * as cdk from '@aws-cdk/core';
import {CodeBuildStep, CodePipeline, CodePipelineSource} from '@aws-cdk/pipelines';

class WebsiteStage extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new WebsiteStack(this, 'WebsiteStack');
  }
}

class WebsiteStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
      }});

    const bucket = new Bucket(this, 'Bucket');

    const domainName = 'butirolledanat20.net';
    const zone = HostedZone.fromLookup(this, 'hostedZone', {
      domainName: domainName
    });
    const certificate = new DnsValidatedCertificate(this, 'mySiteCert', {
      domainName: domainName,
      hostedZone: zone,
    });
    const distribution = new Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new S3Origin(bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      defaultRootObject: 'index.html',
      domainNames: [domainName],
      certificate: certificate,
    });

    new BucketDeployment(this, 'BucketDeployment', {
      destinationBucket: bucket,
      distribution: distribution,
      sources: [Source.asset('static-content')]
    });

    new ARecord(this, 'ARecord', {
      zone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution))
    })
    
    
  }
}

export class RolledATwentyStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const user = this.node.tryGetContext("user");
    const repo = this.node.tryGetContext("repo");
    const branch = this.node.tryGetContext("branch");
    const secretName = this.node.tryGetContext("secretName");

    // https://cdkworkshop.com/20-typescript/70-advanced-topics/200-pipelines/3000-new-pipeline.html
    const codeBuildAction = new CodeBuildStep('SynthStep', {
          input: CodePipelineSource.gitHub(`${user}/${repo}`, branch, {
            authentication: cdk.SecretValue.secretsManager(secretName)
          }),
          installCommands: [
            'npm install -g aws-cdk'
          ],
          commands: [
            'npm ci',
            'npm run build',
            `npx cdk synth --context user=${user} --context repo=${repo} --context branch=${branch} --context secretName=${secretName}`
          ],
          rolePolicyStatements: [
            // new PolicyStatement({
            //   actions: ['route53:ListHostedZonesByName'],
            //   resources: ['*'],
            // }),
            new PolicyStatement({
              actions: ['sts:AssumeRole'],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'iam:ResourceTag/aws-cdk:bootstrap-role': 'lookup',
                },
              },
            }),
          ]
        }
    )

    const pipeline = new CodePipeline(this, 'pipeline', {
      synth: codeBuildAction
    });
    pipeline.addStage(new WebsiteStage(this, 'websiteStage'));
  }
}
