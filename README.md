# CloudFunctionOptimizer

What will be needed:
- Node.js (https://nodejs.org)
- Redis (http://redis.io/)
- Application DAG
- Application binaries

## Montage - Example application

Check how to generate DAG, Montage data and binaries
```
https://github.com/malawski/hyperflow-gcf-executor
```
After those steps we should have:
1. dag.json
2. Montage inputs
3. Montage binaries

## Hyperflow - Lightweight execution engine

Install Hyperflow (https://github.com/hyperflow-wms/hyperflow):
```
npm install git://github.com/piotrek722/hyperflow.git#develop --save
```
Make sure that `hyperflow/bin` is added to your path.
`hyperflow/functions` directory contains the functions that will be executed by hyperflow.

## AWS

We are using serverless framework to deploy cloud functions.
To deploy functions we need to:

Install serverless (https://serverless.com/framework/docs/providers/aws/guide/installation/).

Copy application binaries to `CloudFunctionOptimizer/hflow_functions/aws/aws-executor`.

Change `aws-bucket` in `serverless.yml` to your S3 bucket name.

Run:
```
npm install
serverless deploy
```

Copy application binaries and inputs to S3 bucket.

Complete `hyperflow/functions/awsCommand.config.js`, put urls to your functions and path to S3 bucket.

## SDBWS

Running SDBWS consists of several steps:
- decorating DAG with ids,
- executing DAG on selected homogeneous resources,
- parsing logs from executions to obtain task times on all resources,
- normalizing task times,
- running SDBWS algorithm to produce decorated DAG,
- executing decorated DAG on resources assigned by the algorithm.

Current version is prepared to run on AWS Lambda.

1. In `configuration/config.js`, set your cloud provider, resource memory sizes and their pricing:
```
const FUNCTION_TYPES = ["256", "512", "1024", "1536"];
const PROVIDER = "AWS";

const PRICES = {
    "AWS" : {
        "256": 0.000000417,
        "512": 0.000000834,
        "1024": 0.000001667,
        "1536": 0.000002501
    }
}
```

Set user parameters:
```
const BUDGET_PARAMETER = 0.3;
const DEADLINE_PARAMETER = 0.7;
```
The values should be from range [0, 1].

2.Decorate DAG with task ids:
```
node dagscripts/id-decorator.js DAG_PATH OUTPUT_PATH
``` 

3.Run experiments with script ``./scripts/run.sh``:

Parameters:
1. Path to dag
2. Output folder.
3. Provider
4. Number of executions for each type
5. Function types 

Example invocation:
```
./run.sh ./dag.json output AWS 5 256 512 1024 1536
```

## Charts

To visualize the results you can use scripts from `plots` directory.

* `gant_resources.R` draws Gantt chart which shows which resource was used for each task execution. Remember to set which resources were used in the experiment.
* `compare_times.R` draws a bar plot which compares times of execution on homogeneous resources, heterogeneous resources(real) and theoretical execution(sdbws). Set `user_time` to user's deadline.
* `compare_prices.R` draws a bar plot which compares prices of executions. Set `user_price` to user's budget limit.