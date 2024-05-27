# Aws lambdas

## Deployment

Uses aws sam cli to deploy. Deploy function code only, dependancies deployed as lambda layer.

Deployment steps:

1. Create a `template.yml` file
1. `sam package --template-file ./template.yml --output-template-file ./packaged.yml --s3-bucket chat-ai-lambdas`
1. `sam deploy --template-file packaged.yml --stack-name <STACK_NAME> --capabilities CAPABILITY_IAM --region us-east-1`

Deploying Layer:

1. `yarn`
1. ensure contents of api prisma schema copied to lambda prisma schema if updated
1. `yarn generate:schema`
1. copy `/node_modules` directoy path `/nodejs/node20` and zip it
    - **NOTE:** uncompressed `/nodejs` dir must be < 260mb, manually delete dev/unnessessary dependancies to reduce package size
    - `aws-sdk` (not `@aws-sdk`)
    - `aws-lambda` (we only use types from this which aren't neccessary when compiled to js)
    - dev dependancies (`typescript`, `@types`, `prettier`)
***OR*** Can just copy changed dependancy directly out of `node_modules` and replace in `/nodejs/node20`
1. upload to s3, create new layer version, update layer version on functions
- layer config: x86_64, nodejs 20
