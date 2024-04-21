# Aws lambdas

## Deployment

Uses aws sam cli to deploy. Deploy function code only, dependancies deployed as lambda layer.

Deployment steps:

1. Create a `template.yml` file
1. `sam package --template-file ./template.yml --output-template-file ./packaged.yml --s3-bucket <BUCKET_NAME>`
1. `sam deploy --template-file packaged.yml --stack-name <STACK_NAME> notion --capabilities CAPABILITY_IAM --region us-east-1`

Deploying Layer:

1. `yarn build`
1. `yarn generate:schema`
1. create zip of `/node_modules` and `package.json`
1. upload to s3, update layer version on functions