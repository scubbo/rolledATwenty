# Deploying

## First Time

* Ensure you own the desired domain name in Route53
* Create a GitHub Personal Access Token with `admin:repo_hook` and `repo` scopes
* Create an AWS Secrets Manager secret, whose content is the GitHub token. Note the name of the secret.
* Run `$ cdk deploy --profile <profile> --context user=<github username> --context repo=<github repo> --context branch=<github branch> --context secretName=<secretName> --context domainName=<domainName>`

(Note that this setup does not currently allow for custom sub-records within the domain)

## Deploying changes

Push a change to the associated repo - it will get picked up and flow through the pipeline. Note that updating the CloudFront distribution can take a few minutes
