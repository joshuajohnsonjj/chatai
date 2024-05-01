# Aws lambdas

## Deployment

Uses aws sam cli to deploy. Deploy function code only, dependancies deployed as lambda layer.

Deployment steps:

1. Create a `template.yml` file
1. `sam package --template-file ./template.yml --output-template-file ./packaged.yml --s3-bucket <BUCKET_NAME>`
1. `sam deploy --template-file packaged.yml --stack-name <STACK_NAME> --capabilities CAPABILITY_IAM --region us-east-1`

Deploying Layer:

1. `yarn`
1. ensure contents of api prisma schema copied to lambda prisma schema if updated
1. `yarn generate:schema`
1. copy `/node_modules` directoy path `/nodejs/node20` and zip it
    - **NOTE:** uncompressed `/nodejs` dir must be < 260mb, manually delete dev dependancies to reduce package size
    - `modclean -n default:safe,default:caution -r`
    - `node-prune`
1. upload to s3, create new layer version, update layer version on functions
