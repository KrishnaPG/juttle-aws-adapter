# AWS Adapter Metrics and Events

This page describes the specific metrics and events supported by the AWS Adapter.

## All Products
All events and metrics include a field `product=<product>`, which identifies the AWS Product related to the metric or event. `<product>` can be one of the following:

- `EC2`
- `ELB`
- `RDS`
- `EBS`
- `CloudFront`
- `AutoScaling`
- `ElastiCache`
- `Lambda`

All metrics include a field `metric_type=<type>` which has one of the following values:

- `metric_type=AWS Aggregate`: the metric is an aggregate metric counting some property across the entire collection of items
- `metric_type=AWS Demographic`: the metric is one of a set of metrics breaking down the set of items into one or more categories.
- `metric_type=AWS Metric`: the metric covers some metric of a single item obtained by product specific AWS API calls.

For each product, the adapter can send events with the following format:

- `event_type="<AWS item> Added" item=<item id> msg=<msg>`: An item was added. `<AWS item>` examples are `EC2 Instance`, `RDS DB`, `ELB Load Balancer`, etc. `<item_id>` examples are `i-8a9dbf51`, `db-migration-testing-eeb2ed68`, `jx3ha-ELBauth-1MK7ZYWJBV7MB`, etc. `<msg>` is not always present but when present provides additional detail on the event.
- `event_type="<AWS item> Removed" item=<item id> msg=<msg>`: An item was removed.
- `event_type="<AWS item> Changed" item=<item id> msg=<msg>`: An item was changed.

##EC2

###Aggregate Metrics

- `aggregate="EC2 Instance Count", name=total, value=<count>`: The number of EC2 instances.

###Demographic Metrics

- `demographic="EC2 Instance Type", name=<type>, value=<count>`: A breakdown of EC2 instances by type. `<type>` examples are `m3.large`, `m3.medium`, etc.
- `demographic="EC2 Root Device Type", name=<type>, value=<count>`: A breakdown of EC2 instances by root device type. `<type>` examples are `ebs`, `instance-store`.
- `demographic="EC2 State", name=<state>, value=<count>`: A breakdown of EC2 instances by current state. `<state>` examples are `running`, `stopped`, `shutting-down`, etc.

##EBS

###Aggregate Metrics

- `aggregate="EBS Volume Count", name=total, value=<count>`: The number of EBS volumes.
- `aggregate="EBS Volume Total size", name=total, value=<gb>`: The total size of all volumes combined, in GB.
- `aggregate="EBS Volume Total iops", name=total, value=<iops>`: The total iops capability of all volumes combined, in io ops/sec

###Demographic Metrics

- `demographic="EBS Volume Type", name=<type>, value=<count>`: A breakdown of EBS volumes by type. `<type>` examples are `gp2`, `io1`, `standard`, etc.
- `demographic="EBS State", name=<state>, value=<count>`: A breakdown of EBS volumes by current state. `<state>` examples are `in-use`, `available`, `creating`, `deleting`, etc.
- `demographic="EBS Status", name=<status>, value=<count>`: A breakdown of EBS volumes by current status. `<status>` examples are `ok`, `impaired`, `insufficient-data`, etc.

###AWS Metrics

- `name="VolumeStatusErrors", value=<count> name=<volume-id> status=<status string>`: Counts the number of times the given volume had a status other than "ok". In this version, `<count>` can only be 1. This metric is only reported when the volume status is something other than ok. The status field provdes the exact status string.

##ELB

###Aggregate Metrics

- `aggregate="ELB Load Balancer Count", name=total, value=<count>`: The number of ELB load balancers.

###Demographic Metrics

- `demographic="ELB Scheme", name=<scheme>, value=<count>`: A breakdown of ELB load balancers by scheme. `<scheme>` examples are `internal` and `internet-facing`.
- `demographic="ELB Health Check Target", name=<target>, value=<count>`: A breakdown of ELB load balancers by the target (protocol + port + path) used to check health. `<target>` examples include `HTTP:80/robots.txt`, `HTTPS:3110/ping`, `TCP:80`, etc.

##RDS

###Aggregate Metrics

- `aggregate="RDS DB Count", name=total, value=<count>`: The number of RDS databases.
- `aggregate="RDS DB Total Allocated Storage", name=total, value=<gb>`: The total allocated storage across the full set of databases.
- `aggregate="RDS DB Total Iops", name=total, value=<iops>`: The total iops capacity across the full set of databases, in io ops/sec.

###Demographic Metrics

- `demographic="RDS DB Class", name=<class>, value=<count>`: A breakdown of RDS databases by class. `<class>` examples are `db.t2.medium`, `db.m3.large`, etc.
- `demographic="RDS DB Engine", name=<engine>, value=<count>`: A breakdown of RDS databases by db engine. `<engine>` examples are `MySQL`, `oracle-sel`, `postgres`, etc.
- `demographic="RDS DB Engine Version", name=<version>, value=<count>`: A breakdown of RDS databases by version number. `<version>` examples are `9.3.3`, `5.6.19a`, etc.
- `demographic="RDS DB License Model", name=<license>, value=<count>`: A breakdown of RDS databases by open source license. <license> examples are `general-public-license`, `postgresql-license`, etc.
- `demographic="RDS DB Retention Period", name=<period>, value=<count>`: A breakdown of RDS databases by retention period (in days).
- `demographic="RDS DB PubliclyAccessible", name=<value>, value=<count>`: A breakdown of RDS databases by whether or not they are flagged as publicly accessible. `<value>` can be `true`, `false`, or `unknown` (if not explicitly configured, meaning that the network configuration determines whether or not it is accessible).
- `demographic="RDS DB Storage Type", name=<stype>, value=<count>`: A breakdown of RDS databases by storage type. `<stype>` examples are `gp2`, `io1`, `standard`, etc.
- `demographic="RDS DB Status", name=<status>, value=<count>`: A breakdown of RDS databases by current status. `<status>` examples are `available`, etc.
- `demographic="RDS DB Read Replica Status", name=<status>, value=<count>`: For those databases that are configured as read replicas, A breakdown by status. `<status>` examples are `replicating`, `error`, `stopped`, etc.

##CloudFront

###Aggregate Metrics

- `aggregate="CF Distribution Count", name=total, value=<count>`: The number of CloudFront distributions.

###Demographic Metrics

- `demographic="CF Status", name=<status>, value=<count>`: A breakdown of CloudFront distributions by current status. `<status>` examples are `deployed`, `in-progress`, etc.
- `demographic="CF Price Class", name=<class>, value=<count>`: A breakdown of CloudFront distributions by price class. `<class>` examples are `PriceClass_100`, `PriceClass_All`, etc.
- `demographic="CF Enabled", name=<enabled>, value=<count>`: Counts of the number of enabled/disabled CloudFront distributions. `<enabled>` is `true` or `false`.

##AutoScaling

###Aggregate Metrics

- `aggregate="AutoScaling Group Count", name=total, value=<count>`: The number of AutoScaling groups.
- `aggregate="AutoScaling Group Total Size", name=total, value=<count>`: The current number of EC2 instances allocated across all groups.
- `aggregate="AutoScaling Group Total Desired Capacity", name=total, value=<count>`: The desired number of EC2 instances allocated across all groups.

###Demographic Metrics

- `demographic="AutoScaling Desired Capacity", name=<capacity>, value=<count>`: A breakdown of the desired capacity across all groups. For example, `name=5 value=3` implies 3 groups have a desired capacity of 5.
- `demographic="AutoScaling Current Group Size", name=<capacity>, value=<count>`: A breakdown of the current size of each group. For example, `name=6 value=2` implies 2 groups currently consist of 6 instances.
- `demographic="AutoScaling Health Check Type", name=<type>, value=<count>`: A breakdown of the groups by health check type. `<type>` examples are `EC2` and `ELB`.

##ElastiCache

###Aggregate Metrics

- `aggregate="ElastiCache Cluster Count", name=num_clusters, value=<count>`: The number of ElastiCache clusters.
- `aggregate="ElastiCache Total Cache Nodes", name=num_nodes, value=<count>`: The total number of nodes across all ElastiCache clusters.

###Demographic Metrics

- `demographic="ElastiCache Cache Node Type", name=<type>, value=<count>`: A breakdown of ElastiCache clusters by node type. `<type>` examples include `cache.t2.micro`, `cache.m3.large`, etc.
- `demographic="ElastiCache Engine", name=<engine>, value=<count>`: A breakdown of ElastiCache clusters by engine. `<engine>` examples include `memcached`, `redis`, etc.
- `demographic="ElastiCache Engine Version", name=<version>, value=<count>`: A breakdown of ElastiCache clusters by engine version. `<engine>` examples include `2.8.22`, `2.8.23`, etc.
- `demographic="ElastiCache Cluster Status", name=<status>, value=<count>`: A breakdown of ElastiCache clusters by status. `<status>` examples include `available`, `creating`, `modifying`, `snapshotting`, etc.
- `demographic="ElastiCache Num Cache Nodes", name=<node_count>, value=<count>`: A breakdown of ElastiCache clusters by the number of nodes in the cluster. For example, `name=6 value=2` implies 2 groups currently consist of 6 nodes.

##Lambda

###Aggregate Metrics

- `aggregate="Lambda Function Count", name=num_funcs, value=<count>`: The number of Lambda functions.
- `aggregate="Lambda Total Memory Size", name=num_mb, value=<count>`: The total memory usage (in MB) across all Lambda functions.

###Demographic Metrics

- `demographic="Lambda Runtime", name=<runtime>, value=<count>`:A breakdown of Lambda functions by runtime. `<runtime>` examples include `nodejs`, `java8`, `python2.7`, etc.
- `demographic="Lambda Role", name=<role>, value=<count>`: A breakdown of Lambda functions by IAM role. A `<role>` is an IAM identifier indicating the capabilities the function will have.
- `demographic="Lambda Timeout", name=<timeout>, value=<count>`: A breakdown of Lambda functions by timeout threshold (in seconds).
- `demographic="Lambda Memory Size", name=<size>, value=<count>`: A breakdown of Lambda functions by memory allocation given (in mb).
- `demographic="Lambda Version", name=<version>, value=<count>`: A breakdown of Lambda functions by version identifier.
- `demographic="Lambda Handler", name=<handler>, value=<count>`: A breakdown of Lambda functions by handler (entry point).

