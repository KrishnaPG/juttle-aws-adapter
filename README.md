# Juttle AWS Adapter

AWS adapter for the [Juttle data flow
language](https://github.com/juttle/juttle).

The AWS adapter is a Juttle frontend to various AWS APIs, returning the results of those API calls as Juttle points. You can use those points to perform detailed analysis of your AWS Infrastructure.

Additionally, the AWS adapter is packaged with a module that summarizes the raw API results, creating aggregate and demographic summary information from the raw points.

The adapter must be configured with an IAM Keypair to access the customer's AWS information and be given the region in which the customer's AWS products are located.

## AWS Product Coverage

The adapter supports the following AWS Products:

- [Elastic Compute (EC2)](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/monitoring_ec2.html)
- [Elastic Load Balancing (ELB)](http://docs.aws.amazon.com/ElasticLoadBalancing/latest/DeveloperGuide/elb-cloudwatch-metrics.html)
- [Relational Database Service (RDS)](http://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_Monitoring.html)
- [Elastic Block Store (EBS)](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/monitoring-volume-status.html)
- [CloudFront CDN](http://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/monitoring-using-cloudwatch.html)
- [Auto Scaling](http://docs.aws.amazon.com/AutoScaling/latest/DeveloperGuide/as-instance-monitoring.html)
- [ElastiCache](http://docs.aws.amazon.com/AmazonElastiCache/latest/UserGuide/CacheMetrics.html)
- [Lambda](http://docs.aws.amazon.com/lambda/latest/dg/monitoring-functions.html)

## Resulting Data Formats

By default, the adapter returns the raw json results of the AWS API calls for each product's "list items" function (e.g. `EC2.describeInstances`, `ELB.describeLoadBalancers`, etc) as Juttle points. The adapter also monitors the active set of items (EC2 Instances, etc) for each product and emits events when the items change. For example, when a new EC2 instance is added, a "EC2 instance added" event is generated. Also, when anything related to a given item is changed, a "... changed" event is generated.

The `aws` module packaged with the adapter exports several [subgraphs](http://juttle.github.io/juttle/concepts/programming_constructs/#subgraphs) that can be included in Juttle programs to automatically summarize the raw points returned from the AWS API calls. Each product has an `aggregate_all_<product>()` subgraph that summarizes points associated with each product. Additionally, there is an `aggregate_all` subgraph that summarizes for all products.

The subgraphs summarize the raw points into the following categories.
- **Demographic Information**: for each product, breakdowns by size, storage class, memory software version, etc.
- **Aggregate Information**: for each product, aggregate information such as the total number of EC2 instances, ELB gateways, etc. Also some aggregate information for the entire collection of items is collected such as total disk space, memory capacity, etc.

The full set of metrics and events are described [here](./docs/aws_adapter_metrics_events.md).

The AWS Adapter is very closely related to the [Juttle Cloudwatch Adapter](https://github.com/juttle/juttle-cloudwatch-adapter). The AWS adapter fetches current information about the demographics, capabilities, and configuration of a user's AWS resources and applications. The Cloudwatch adapter fetches historical monitoring information for the specific items in a user's AWS infrastructure.

## Examples

```
read aws product='EC2'
    | Adapter.aws.aggregate_EC2
    | filter demographic='EC2 Instance Type'
    | keep demographic, name, value
    | view table

┌───────────────┬──────────┬──────────────────────────┐
│ name          │ value    │ demographic              │
├───────────────┼──────────┼──────────────────────────┤
│ m3.medium     │ 39       │ EC2 Instance Type        │
├───────────────┼──────────┼──────────────────────────┤
│ m1.small      │ 5        │ EC2 Instance Type        │
├───────────────┼──────────┼──────────────────────────┤
│ m3.large      │ 5        │ EC2 Instance Type        │
├───────────────┼──────────┼──────────────────────────┤
│ m1.medium     │ 2        │ EC2 Instance Type        │
├───────────────┼──────────┼──────────────────────────┤
│ t1.micro      │ 4        │ EC2 Instance Type        │
├───────────────┼──────────┼──────────────────────────┤
│ c3.xlarge     │ 1        │ EC2 Instance Type        │
├───────────────┼──────────┼──────────────────────────┤
│ t2.micro      │ 3        │ EC2 Instance Type        │
├───────────────┼──────────┼──────────────────────────┤
│ c3.8xlarge    │ 1        │ EC2 Instance Type        │
├───────────────┼──────────┼──────────────────────────┤
│ m4.4xlarge    │ 1        │ EC2 Instance Type        │
├───────────────┼──────────┼──────────────────────────┤
│ m3.2xlarge    │ 2        │ EC2 Instance Type        │
├───────────────┼──────────┼──────────────────────────┤
│ c3.large      │ 1        │ EC2 Instance Type        │
├───────────────┼──────────┼──────────────────────────┤
│ c4.2xlarge    │ 1        │ EC2 Instance Type        │
├───────────────┼──────────┼──────────────────────────┤
│ m3.xlarge     │ 1        │ EC2 Instance Type        │
├───────────────┼──────────┼──────────────────────────┤
│ t2.small      │ 1        │ EC2 Instance Type        │
├───────────────┼──────────┼──────────────────────────┤
│ t2.medium     │ 1        │ EC2 Instance Type        │
└─────────────────────────────────────────────────────┘
```

An end-to-end example is described [here](https://github.com/juttle/juttle-engine/tree/master/examples/aws-cloudwatch) and deployed to the demo system [demo.juttle.io](http://demo.juttle.io/?path=/examples/aws-cloudwatch/index.juttle).

## Installation

Like Juttle itself, the adapter is installed as a npm package. Both Juttle and
the adapter need to be installed side-by-side:

```bash
$ npm install juttle
$ npm install juttle-aws-adapter
```

## Ecosystem

The juttle-aws-adapter fits into the overall Juttle Ecosystem as one of the adapters in the [below diagram](https://github.com/juttle/juttle/blob/master/docs/juttle_ecosystem.md):

[![Juttle Ecosystem](https://github.com/juttle/juttle/raw/master/docs/images/JuttleEcosystemDiagram.png)](https://github.com/juttle/juttle/blob/master/docs/juttle_ecosystem.md)

## Configuration

Configuration involves these steps:

1. Create an IAM access key ID and secret key that can access your account.
2. Add the appropriate configuration items to `.juttle/config.js`

### Create an IAM access key ID

[This page](https://aws.amazon.com/developers/access-keys/) provides a good introduction to IAM access keys and how to obtain them for your amazon account.

The key must have read-only access for the products for which you want to obtain metrics and events. The following default policies are sufficient:

- AmazonEC2ReadOnlyAccess
- AmazonRDSReadOnlyAccess
- CloudFrontReadOnlyAccess
- AmazonElastiCacheReadOnlyAccess
- AWSLambdaReadOnlyAccess

### Add the appropriate configuration items to `.juttle/config.js`

Add a config block like this to `.juttle/config.js`:

```Javascript
{
  "adapters": {
        "aws": {
            access_key: "--YOUR-ACCESS-KEY-HERE--",
            secret_key: "--YOUR-SECRET-KEY-HERE--",
            region: "--YOUR-REGION-HERE--"
         }
   }
}
```

Region is a region like `us-west-2`.

## Usage

### Read Options

Read command line format and examples:

```Javascript
read [(product filter) [OR (product filter)]...]

read product="EC2"                                                        // Return all metrics and events for all EC2 instances
read product="EC2" OR product="EBS"                                       // Return all metrics and events for the set of EC2 instances and EBS volumes
```

#### Options

The aws adapter only reads current live information, and as a result does not support a timerange in the past. The frequency at which the adapter polls AWS can be controlled via the `-every` option and the stop time can be controlled via the `-to` options.

#### Filtering Expression

The filtering expression consists of any number of product or item filters, combined with `OR`.

A product filter has the format `product="<aws product>"`, where `<aws product>` is one of the following:

- `EC2`
- `EBS`
- `ELB`
- `RDS`
- `CloudFront`
- `AutoScaling`
- `ElastiCache`
- `Lambda`

The returned data will consist of Raw Points or Aggregate Metric/Demographic Metrics for the specified products.

With no filter expression at all, the returned data will consist of all metrics and events for all supported products.

## Contributing

Want to contribute? Awesome! Don’t hesitate to file an issue or open a pull
request.
