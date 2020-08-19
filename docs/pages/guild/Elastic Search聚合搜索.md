# Elastic Search聚合搜索

## 概念

Elasticsearch中的聚合，包含多种类型，最常用的两种，一个叫`桶`，一个叫`度量`：

> **桶（bucket）**

桶的作用，是按照某种方式对数据进行分组，每一组数据在ES中称为一个`桶`，例如我们根据国籍对人划分，可以得到`中国桶`、`英国桶`，`日本桶`……或者我们按照年龄段对人进行划分：0~10,10~20,20~30,30~40等。

Elasticsearch中提供的划分桶的方式有很多：

- Date Histogram Aggregation：根据日期阶梯分组，例如给定阶梯为周，会自动每周分为一组
- Histogram Aggregation：根据数值阶梯分组，与日期类似
- Terms Aggregation：根据词条内容分组，词条内容完全匹配的为一组
- Range Aggregation：数值和日期的范围分组，指定开始和结束，然后按段分组
- ……



bucket aggregations 只负责对数据进行分组，并不进行计算，因此往往bucket中往往会嵌套另一种聚合：metrics aggregations即度量



> **度量（metrics）**

分组完成以后，我们一般会对组中的数据进行聚合运算，例如求平均值、最大、最小、求和等，这些在ES中称为`度量`

比较常用的一些度量聚合方式：

- Avg Aggregation：求平均值
- Max Aggregation：求最大值
- Min Aggregation：求最小值
- Percentiles Aggregation：求百分比
- Stats Aggregation：同时返回avg、max、min、sum、count等
- Sum Aggregation：求和
- Top hits Aggregation：求前几
- Value Count Aggregation：求总数
- ……

## 聚合搜索

### 一、初始化数据

> 添加物品索引

```json
PUT /items
{
  "mappings": {
    "properties": {
      "name":{
        "type": "text"
      },
      "type":{
        "type": "keyword"
      },
      "price":{
        "type": "scaled_float",
        "scaling_factor": 100
      },
      "from":{
        "type": "keyword"
      }
    }
  }
}
```

> 批量添加测试数据

```json
POST /items/_doc/_bulk
{ "index": {}} 			// 指定index，实际为{ "index" : { "_index" : "索引名", "_type" : "类型名", "_id" : "id" } },
						// 在url指定了信息后就可以简写
{"name":"A1","type":"衣服","price":120,"from":"上海"}
{ "index": {}}
{"name":"A2","type":"衣服","price":120,"from":"上海"}
{ "index": {}}
{"name":"A3","type":"电子用品","price":2600,"from":"深圳"}
{ "index": {}}
{"name":"A4","type":"电子用品","price":1400,"from":"深圳"}
{ "index": {}}
{"name":"A5","type":"车子","price":560000,"from":"北京"}
{ "index": {}}
{"name":"A6","type":"车子","price":158000,"from":"武汉"}
{ "index": {}}
{"name":"A7","type":"车子","price":560000,"from":"北京"}
{ "index": {}}
{"name":"A8","type":"玩具","price":158,"from":"武汉"}
{ "index": {}}
{"name":"A9","type":"食品","price":56,"from":"北京"}
{ "index": {}}
{"name":"A10","type":"食品","price":15.8,"from":"武汉"}
```

### 二、根据词条内容分组，词条内容完全匹配的为一组(用terms来匹配)

```json
GET /items/_search
{
  "size": 2, 					// 查询的数据的条数
  "aggs": {
    "items_aggs": {				// 聚合名称，随便取
      "terms": {				// 只能用terms完全匹配，不能用match,并且聚合的字段类型只能是keyword
        "field": "type",         // 聚合的字段
        "size": 2				// 多少个桶，可以去掉，去掉表示聚合所有的类型
      }
    }
  }
}
# 结果
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 10,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "items",
        "_type" : "_doc",
        "_id" : "-JTtS3MBzYW3SagD7cgb",
        "_score" : 1.0,
        "_source" : {
          "name" : "A1",
          "type" : "衣服",
          "price" : 120,
          "from" : "上海"
        }
      },
      {
        "_index" : "items",
        "_type" : "_doc",
        "_id" : "-ZTtS3MBzYW3SagD7cgb",
        "_score" : 1.0,
        "_source" : {
          "name" : "A2",
          "type" : "衣服",
          "price" : 120,
          "from" : "上海"
        }
      }
    ]
  },
  "aggregations" : {
    "items_aggs" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 5,
      "buckets" : [
        {
          "key" : "车子",
          "doc_count" : 3
        },
        {
          "key" : "电子用品",
          "doc_count" : 2
        }
      ]
    }
  }
}
# 以不同的字段聚合多个桶
GET /items/_search
{
  "size": 0,
  "aggs": {
    "type_aggs": {
      "terms": {
        "field": "type",
        "size": 10
      }
    },
    "from_aggs":{
      "terms": {
        "field": "from",
        "size": 10
      }
    }
  }
}
# 结果
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 10,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "from_aggs" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 0,
      "buckets" : [
        {
          "key" : "北京",
          "doc_count" : 3
        },
        {
          "key" : "武汉",
          "doc_count" : 3
        },
        {
          "key" : "上海",
          "doc_count" : 2
        },
        {
          "key" : "深圳",
          "doc_count" : 2
        }
      ]
    },
    "type_aggs" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 0,
      "buckets" : [
        {
          "key" : "车子",
          "doc_count" : 3
        },
        {
          "key" : "电子用品",
          "doc_count" : 2
        },
        {
          "key" : "衣服",
          "doc_count" : 2
        },
        {
          "key" : "食品",
          "doc_count" : 2
        },
        {
          "key" : "玩具",
          "doc_count" : 1
        }
      ]
    }
  }
}

```

- hits：查询结果为空，因为我们设置了size为0
- aggregations：聚合的结果
- buckets：查找到的桶，每个不同的type字段值都会形成一个桶
  - key：这个桶对应的type字段的值
  - doc_count：这个桶中的文档数量

### 三、桶内度量

```json
GET /items/_search
{
  "size": 0,
  "aggs": {
    "items_aggs": {
      "terms": {
        "field": "type",    
        "size": 10
      },
        // 相当于计算每个桶中的price的平均值，它也是个桶
      "aggs": {            // 在桶内进行聚合
        "avg_items": {     // 聚合名称
          "avg": {         // 聚合类型，计算平均值
            "field": "price" // 聚合字段
          }
        }
      }
    }
  }
}
#结果：
{
  "took" : 2,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 10,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "items_aggs" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 0,
      "buckets" : [
        {
          "key" : "车子",
          "doc_count" : 3,
          "avg_items" : {       // 相当于在桶内的一个桶，这个桶只包含平均值
            "value" : 426000.0
          }
        },
        {
          "key" : "电子用品",
          "doc_count" : 2,
          "avg_items" : {
            "value" : 2000.0
          }
        },
        {
          "key" : "衣服",
          "doc_count" : 2,
          "avg_items" : {
            "value" : 120.0
          }
        },
        {
          "key" : "食品",
          "doc_count" : 2,
          "avg_items" : {
            "value" : 35.9
          }
        },
        {
          "key" : "玩具",
          "doc_count" : 1,
          "avg_items" : {
            "value" : 158.0
          }
        }
      ]
    }
  }
}
- aggs：我们在上一个aggs(items_aggs)中添加新的aggs。可见`度量`也是一个聚合
- avg_items：聚合的名称
- avg：度量的类型，这里是求平均值
- field：度量运算的字段

# 例如直接计算所有的price平均值
GET /items/_search
{
  "size": 0,
  "aggs": {
    "items_aggs": {
      "avg": {
        "field": "price"
      }
    }
  }
}
# 结果：
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 10,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "items_aggs" : {
      "value" : 128246.98000000001
    }
  }
}
#结论：度量也是一个聚合，只不过在桶内使用场景比较多
```

### 三、桶内嵌套桶

```json
# 桶内进行多个度量
GET /items/_search
{
  "size": 0,
  "aggs": { 
    "items_aggs": {      // 最外面的桶
      "terms": {
        "field": "type",
        "size": 10
      },
      "aggs": {
        "avg_price": {    // 里面的第一个桶，计算物品的价格平均值
          "avg": {
            "field": "price"
          }
        },
        "max_price":{       // 里面的第二个桶，计算物品的价格的最大值
          "max": {
            "field": "price"
          }
        }
      }
    }
  }
}
# 结果：
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 10,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "items_aggs" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 0,
      "buckets" : [
        {
          "key" : "车子",
          "doc_count" : 3,
          "max_price" : {
            "value" : 560000.0
          },
          "avg_price" : {
            "value" : 426000.0
          }
        },
        {
          "key" : "电子用品",
          "doc_count" : 2,
          "max_price" : {
            "value" : 2600.0
          },
          "avg_price" : {
            "value" : 2000.0
          }
        },
        {
          "key" : "衣服",
          "doc_count" : 2,
          "max_price" : {
            "value" : 120.0
          },
          "avg_price" : {
            "value" : 120.0
          }
        },
        {
          "key" : "食品",
          "doc_count" : 2,
          "max_price" : {
            "value" : 56.0
          },
          "avg_price" : {
            "value" : 35.9
          }
        },
        {
          "key" : "玩具",
          "doc_count" : 1,
          "max_price" : {
            "value" : 158.0
          },
          "avg_price" : {
            "value" : 158.0
          }
        }
      ]
    }
  }
}
# 桶内进行其他字段的聚合以及度量
GET /items/_search
{
  "size": 0,
  "aggs": {
    "type_aggs": {
      "terms": {
        "field": "type",
        "size": 10
      },
      "aggs": {
        "from_aggs": {
          "terms": {
            "field": "from",
            "size": 10
          }
        },
        "price_aggs":{
          "avg": {
            "field": "price"
          }
        }
      }
    }
  }
}
# 结果：
{
  "took" : 6,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 10,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "type_aggs" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 0,
      "buckets" : [
        {
          "key" : "车子",
          "doc_count" : 3,
          "from_aggs" : {
            "doc_count_error_upper_bound" : 0,
            "sum_other_doc_count" : 0,
            "buckets" : [
              {
                "key" : "北京",
                "doc_count" : 2
              },
              {
                "key" : "武汉",
                "doc_count" : 1
              }
            ]
          },
          "price_aggs" : {
            "value" : 426000.0
          }
        },
        {
          "key" : "电子用品",
          "doc_count" : 2,
          "from_aggs" : {
            "doc_count_error_upper_bound" : 0,
            "sum_other_doc_count" : 0,
            "buckets" : [
              {
                "key" : "深圳",
                "doc_count" : 2
              }
            ]
          },
          "price_aggs" : {
            "value" : 2000.0
          }
        },
        {
          "key" : "衣服",
          "doc_count" : 2,
          "from_aggs" : {
            "doc_count_error_upper_bound" : 0,
            "sum_other_doc_count" : 0,
            "buckets" : [
              {
                "key" : "上海",
                "doc_count" : 2
              }
            ]
          },
          "price_aggs" : {
            "value" : 120.0
          }
        },
        {
          "key" : "食品",
          "doc_count" : 2,
          "from_aggs" : {
            "doc_count_error_upper_bound" : 0,
            "sum_other_doc_count" : 0,
            "buckets" : [
              {
                "key" : "北京",
                "doc_count" : 1
              },
              {
                "key" : "武汉",
                "doc_count" : 1
              }
            ]
          },
          "price_aggs" : {
            "value" : 35.9
          }
        },
        {
          "key" : "玩具",
          "doc_count" : 1,
          "from_aggs" : {
            "doc_count_error_upper_bound" : 0,
            "sum_other_doc_count" : 0,
            "buckets" : [
              {
                "key" : "武汉",
                "doc_count" : 1
              }
            ]
          },
          "price_aggs" : {
            "value" : 158.0
          }
        }
      ]
    }
  }
}
- 通过观察可以发现，桶内聚合的时候各个聚合是同一级的，不可以在同一级别写多个aggs进行聚合，只能无限嵌套下去
# 例如，三级嵌套：
GET /items/_search
{
  "size": 0,
  "aggs": {
    "type_aggs": {
      "terms": {
        "field": "type",
        "size": 10
      },
      "aggs": {
        "from_aggs": {
          "terms": {
            "field": "from",
            "size": 10
          },
          "aggs": {
            "price_aggs": {
              "terms": {
                "field": "price",
                "size": 10
              }
            }
          }
        }
      }
    }
  }
}
# 结果：
{
  "took" : 4,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 10,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "type_aggs" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 0,
      "buckets" : [
        {
          "key" : "车子",
          "doc_count" : 3,
          "from_aggs" : {
            "doc_count_error_upper_bound" : 0,
            "sum_other_doc_count" : 0,
            "buckets" : [
              {
                "key" : "北京",
                "doc_count" : 2,
                "price_aggs" : {
                  "doc_count_error_upper_bound" : 0,
                  "sum_other_doc_count" : 0,
                  "buckets" : [
                    {
                      "key" : 560000.0,
                      "doc_count" : 2
                    }
                  ]
                }
              },
              {
                "key" : "武汉",
                "doc_count" : 1,
                "price_aggs" : {
                  "doc_count_error_upper_bound" : 0,
                  "sum_other_doc_count" : 0,
                  "buckets" : [
                    {
                      "key" : 158000.0,
                      "doc_count" : 1
                    }
                  ]
                }
              }
            ]
          }
        },
        {
          "key" : "电子用品",
          "doc_count" : 2,
          "from_aggs" : {
            "doc_count_error_upper_bound" : 0,
            "sum_other_doc_count" : 0,
            "buckets" : [
              {
                "key" : "深圳",
                "doc_count" : 2,
                "price_aggs" : {
                  "doc_count_error_upper_bound" : 0,
                  "sum_other_doc_count" : 0,
                  "buckets" : [
                    {
                      "key" : 1400.0,
                      "doc_count" : 1
                    },
                    {
                      "key" : 2600.0,
                      "doc_count" : 1
                    }
                  ]
                }
              }
            ]
          }
        },
        {
          "key" : "衣服",
          "doc_count" : 2,
          "from_aggs" : {
            "doc_count_error_upper_bound" : 0,
            "sum_other_doc_count" : 0,
            "buckets" : [
              {
                "key" : "上海",
                "doc_count" : 2,
                "price_aggs" : {
                  "doc_count_error_upper_bound" : 0,
                  "sum_other_doc_count" : 0,
                  "buckets" : [
                    {
                      "key" : 120.0,
                      "doc_count" : 2
                    }
                  ]
                }
              }
            ]
          }
        },
        {
          "key" : "食品",
          "doc_count" : 2,
          "from_aggs" : {
            "doc_count_error_upper_bound" : 0,
            "sum_other_doc_count" : 0,
            "buckets" : [
              {
                "key" : "北京",
                "doc_count" : 1,
                "price_aggs" : {
                  "doc_count_error_upper_bound" : 0,
                  "sum_other_doc_count" : 0,
                  "buckets" : [
                    {
                      "key" : 56.0,
                      "doc_count" : 1
                    }
                  ]
                }
              },
              {
                "key" : "武汉",
                "doc_count" : 1,
                "price_aggs" : {
                  "doc_count_error_upper_bound" : 0,
                  "sum_other_doc_count" : 0,
                  "buckets" : [
                    {
                      "key" : 15.8,
                      "doc_count" : 1
                    }
                  ]
                }
              }
            ]
          }
        },
        {
          "key" : "玩具",
          "doc_count" : 1,
          "from_aggs" : {
            "doc_count_error_upper_bound" : 0,
            "sum_other_doc_count" : 0,
            "buckets" : [
              {
                "key" : "武汉",
                "doc_count" : 1,
                "price_aggs" : {
                  "doc_count_error_upper_bound" : 0,
                  "sum_other_doc_count" : 0,
                  "buckets" : [
                    {
                      "key" : 158.0,
                      "doc_count" : 1
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    }
  }
}
#总结：只要指定了聚合名称，这就是一个桶，桶内才能写aggs进行聚合，桶外不能写
```

### 四.阶梯分桶Histogram

> 原理：

histogram是把数值类型的字段，按照一定的阶梯大小进行分组。你需要指定一个阶梯值（interval）来划分阶梯大小。

举例：

比如你有价格字段，如果你设定interval的值为200，那么阶梯就会是这样的：

0，200，400，600，...

上面列出的是每个阶梯的key，也是区间的启点。

如果一件商品的价格是450，会落入哪个阶梯区间呢？计算公式如下：

```
bucket_key = Math.floor((value - offset) / interval) * interval + offset   //向下取整,floor(x)获得不大于x参数且最靠近参数x																		的整数
```

value：就是当前数据的值，本例中是450

offset：起始偏移量，默认为0

interval：阶梯间隔，比如200

因此你得到的key = Math.floor((450 - 0) / 200) * 200 + 0 = 400

> 实例：

```json
GET /items/_search
{
  "size": 0,
  "aggs": {
    "price_aggs": {
      "histogram": {
        "field": "price",
        "interval": 100000      // 从零开始每次递增100000直到大于或等于最大的price
      }
    }
  }
}
# 结果:
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 10,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "price_aggs" : {
      "buckets" : [
        {
          "key" : 0.0,
          "doc_count" : 7
        },
        {
          "key" : 100000.0,
          "doc_count" : 1
        },
        {
          "key" : 200000.0,
          "doc_count" : 0
        },
        {
          "key" : 300000.0,
          "doc_count" : 0
        },
        {
          "key" : 400000.0,
          "doc_count" : 0
        },
        {
          "key" : 500000.0,
          "doc_count" : 2
        }
      ]
    }
  }
}
# 去掉doc_count为零的桶
GET /items/_search
{
  "size": 0,
  "aggs": {
    "price_aggs": {
      "histogram": {
        "field": "price",
        "interval": 100000,
        "min_doc_count": 1      // 过滤doc_count小于1的桶
      }
    }
  }
}
```

### 五.范围分桶range

范围分桶与阶梯分桶类似，也是把数字按照阶段进行分组，只不过range方式需要你自己指定每一组的起始和结束大小。

> 示例:

```json
GET /items/_search
{
  "size": 0,
  "aggs": {
    "price_aggs": {
      "range": {
        "field": "price",
        "ranges": [            //以每个区间进行聚合，可以指定多个区间
          {
            "from": 1000,
            "to": 100000
          },
          {
            "from": 100000,
            "to": 1000000
          }
        ]
      }
    }
  }
}
# 结果：
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 10,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "price_aggs" : {
      "buckets" : [
        {
          "key" : "1000.0-100000.0",
          "from" : 1000.0,
          "to" : 100000.0,
          "doc_count" : 2
        },
        {
          "key" : "100000.0-1000000.0",
          "from" : 100000.0,
          "to" : 1000000.0,
          "doc_count" : 3
        }
      ]
    }
  }
}

```





































































































































































































































































































































