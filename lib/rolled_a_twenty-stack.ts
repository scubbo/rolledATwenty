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
    super(scope, id, props);

    const bucket = new Bucket(this, 'Bucket');

    new BucketDeployment(this, 'BucketDeployment', {
        destinationBucket: bucket,
        sources: [Source.asset('static-content')]
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
          ]
        }
    )

    const pipeline = new CodePipeline(this, 'pipeline', {
      synth: codeBuildAction
    });
    pipeline.addStage(new WebsiteStage(this, 'websiteStage'));
  }
}
