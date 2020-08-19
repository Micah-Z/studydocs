# ElasticSearch 总结笔记

## 创建索引

```bash
PUT /test8
{
  "settings": {
   # 索引的设置选项
  }
}
## 查看所有的索引
GET _cat/indices?v
```



## 创建和获取映射

```json
# 只能使用put请求
# PUT /索引库
`PUT /test5`
{
  "mappings": {
    "properties": {
      "name":{
        "type": "text"  
      },
      "price":{
        "type": "scaled_float", # 使用进度因子必须使用该类型
        "scaling_factor": 100   # 精度因子，比如10或100。elasticsearch会把真实值乘以这个因子后存储，取出时再还原
      },
      "created":{
        "type": "date",
        "format": ["yyyy-MM-dd hh:mm:ss"]
      }
    }
  }
}

# 获取映射
`GET /test3/_mapping`
- String类型，又分两种：

  - text：可分词，不可参与聚合
  - keyword：不可分词，数据会作为完整字段进行匹配，可以参与聚合

- Numerical：数值类型，分两类

  - 基本数据类型：long、interger、short、byte、double、float、half_float
  - 浮点数的高精度类型：scaled_float
    - 需要指定一个精度因子，比如10或100。elasticsearch会把真实值乘以这个因子后存储，取出时再还原。

- Date：日期类型

  elasticsearch可以对日期格式化为字符串存储，但是建议我们存储为毫秒值，存储为long，节省空间。
  
  
  index影响字段的索引情况。

	- true：字段会被索引，则可以用来进行搜索。默认值就是true
	- false：字段不会被索引，不能用来搜索

index的默认值就是true，也就是说你不进行任何配置，所有字段都会被索引。

但是有些字段是我们不希望被索引的，比如商品的图片信息，就需要手动设置index为false。

store属性:
是否将数据进行额外存储。

在学习lucene和solr时，我们知道如果一个字段的store设置为false，那么在文档列表中就不会有这个字段的值，用户的搜索结果中不会显示出来。

但是在Elasticsearch中，即便store设置为false，也可以搜索到结果。

原因是Elasticsearch在创建文档索引时，会将文档中的原始数据备份，保存到一个叫做`_source`的属性中。而且我们可以通过过滤`_source`来选择哪些要显示，哪些不显示。

而如果设置store为true，就会在`_source`以外额外存储一份数据，多余，因此一般我们都会将store设置为false，事实上，store的默认值就是false。
```





## 添加数据

```bash
# 使用PUT创建带有id的文档索引,必须指定id
`PUT /索引名/类型名/文档id`
`{请求体}`
# 使用POST创建则可以指定id也可以不指定id，不指定则自动生成一个唯一的id
`POST /索引名/类型名/文档id`
`{请求体}`


`直接插入数据，不指定映射的话默认都为text`
```





## 修改数据

```bash
# id存在则修改，会修改所有的，请求体没有指定的字段的数据则直接设为空(不推荐使用)
# id不存在则会增加
PUT /索引名/类型名/文档id
{请求体}

# 只修改指定字段的数据,不会将其他数据置为空（推荐使用）
POST /索引名/类型名/文档id/_update
{
	"doc":{
		# 请求体
	}
}

```

## 删除索引库

```bash
DELETE /索引库名称
```



## 查询(重点)

### match匹配查询

```json
# 查询所有
GET /索引名称/_search
{
  "query": {
    "match_all": {}
  }  
}

# 根据id查询
GET /test2/_doc/1
GET /test2/_search
{
  "query": {
    "match": {
      "_id": "1"
    }
  }
}

# 匹配查询
GET /test3/_search
{
  "query": {
    "match": {
      "FIELD": "TEXT"   # 将text进行分词，然后匹配查询
    }
  }
}
-----------------------------------------------------------------------------------------------------------------------
GET /test3/_search
{
  "query": {
    "match": {
      "name": "法外"
    }
  }
}
结果:
{
  "took" : 673,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 4,
      "relation" : "eq"
    },
    "max_score" : 0.54830766,
    "hits" : [
      {
        "_index" : "test3",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.54830766,
        "_source" : {
          "name" : "法外",
          "des" : "逃离法外之人",
          "tags" : [
            "坏人",
            "非法行为"
          ]
        }
      },
      {
        "_index" : "test3",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.42217934,
        "_source" : {
          "name" : "法外狂徒",
          "des" : "逃离法外之人，极其恶劣",
          "tags" : [
            "坏人",
            "非法行为",
            "臭名昭著"
          ]
        }
      },
      {
        "_index" : "test3",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 0.3432263,
        "_source" : {
          "name" : "法外狂徒张三",
          "des" : "逃离法外之人，极其恶劣，法外中的老大",
          "tags" : [
            "坏人",
            "臭名昭著",
            "老大级别"
          ]
        }
      },
      {
        "_index" : "test3",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 0.14699078,
        "_source" : {
          "name" : "法",
          "des" : "逃离法外之人，极其恶劣，法大",
          "tags" : [
            "坏人",
            "臭名昭著",
            "级别"
          ]
        }
      }
    ]
  }
}
该查询中可以指定des或者tags查询，但是不支持多字段匹配查询
GET /test3/_search
{
  "query": {
    "match": {
      "tags": "大"
    }
  }
}
结果：
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
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 1.1229073,
    "hits" : [
      {
        "_index" : "test3",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.1229073,
        "_source" : {
          "name" : "法外狂徒张三",
          "des" : "逃离法外之人，极其恶劣，法外中的老大",
          "tags" : [
            "坏人",
            "臭名昭著",
            "老大级别"
          ]
        }
      }
    ]
  }
}
-----------------------------------------------------------------------------------------------------------------------
# 多字段匹配查询, 会查询指定字段，只要指定的字段包含query的值就命中
GET /test3/_search
{
  "query": {
    "multi_match": {
      "query": "坏",              # 字段的值
      "fields": ["name","tags"]   # 匹配的字段
    }
  }
}
结果:
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
      "value" : 4,
      "relation" : "eq"
    },
    "max_score" : 0.11977153,
    "hits" : [
      {
        "_index" : "test3",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.11977153,
        "_source" : {
          "name" : "法外",
          "des" : "逃离法外之人",
          "tags" : [
            "坏人",
            "非法行为"
          ]
        }
      },
      {
        "_index" : "test3",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 0.10795845,
        "_source" : {
          "name" : "法",
          "des" : "逃离法外之人，极其恶劣，法大",
          "tags" : [
            "坏人",
            "臭名昭著",
            "级别"
          ]
        }
      },
      {
        "_index" : "test3",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.09826641,
        "_source" : {
          "name" : "法外狂徒",
          "des" : "逃离法外之人，极其恶劣",
          "tags" : [
            "坏人",
            "非法行为",
            "臭名昭著"
          ]
        }
      },
      {
        "_index" : "test3",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 0.09826641,
        "_source" : {
          "name" : "法外狂徒张三",
          "des" : "逃离法外之人，极其恶劣，法外中的老大",
          "tags" : [
            "坏人",
            "臭名昭著",
            "老大级别"
          ]
        }
      }
    ]
  }
}
# 也可以进行多个字段匹配
GET /test3/_search
{
  "query": {
    "multi_match": {
      "query": "老 坏",          // 用空格隔开    
      "fields": ["name","tags"]   
    }
  }
}


```

### 指定查询字段

```json
GET /test3/_search
{
  "query": {
    "match": {
      "tags": "法"
    }
  },
  "_source": ["name","des"]
}

查询结果:
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
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 0.78795457,
    "hits" : [
      {
        "_index" : "test3",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.78795457,
        "_source" : {
          "des" : "逃离法外之人",
          "name" : "法外"
        }
      },
      {
        "_index" : "test3",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.6464764,
        "_source" : {
          "des" : "逃离法外之人，极其恶劣",
          "name" : "法外狂徒"
        }
      }
    ]
  }
}

```

### 排序

```json
GET /索引库名称/_search
{
  "query": {
   "match_all": {}
  },
  "sort": [
    {
      "排序字段名": {
        "order": "desc"
      }
    }
  ]
}
```

### 分页

```json
GET /索引库名称/_search
{
  "query": {
    "match_all": {}
  },
  "from": 0, # 起始页
  "size": 2  # 每页的大小
}
```

### 布尔查询

#### must查询(与查询)

```json
GET /test3/_search
{
  "query": {
    "bool": {
      "must": [   # 条件内容为一个数组，里面为匹配查询,需要满足所有的条件
        {
          "match": {      # 匹配查询，可以单个字段匹配，也可以使用multi_match匹配多字段查询
            "name": "法外"
          }
        },
        {
          "match": {
            "tags": "老大"
          }
        }
      ]
    }
  }
}
#结果，需要满足所有的match才能命中
{
  "took" : 96,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 2.5890408,
    "hits" : [
      {
        "_index" : "test3",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 2.5890408,
        "_source" : {
          "name" : "法外狂徒张三",
          "des" : "逃离法外之人，极其恶劣，法外中的老大",
          "tags" : [
            "坏人",
            "臭名昭著",
            "老大级别"
          ]
        }
      }
    ]
  }
}
```

#### should查询(或关系)

```json
GET /test2/_search
{
  "query": {
    "bool": {
      "should": [
        {
          "match": {
            "name": "张"
          }
        },
        {
          "match": {
            "name": "王"
          }
        }
      ]
    }
  }
}
# 结果 只需要满足其中的一个match条件就可以命中
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
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 1.1392691,
    "hits" : [
      {
        "_index" : "test2",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.1392691,
        "_source" : {
          "name" : "法外狂徒张三",
          "age" : "20"
        }
      },
      {
        "_index" : "test2",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 0.7549127,
        "_source" : {
          "name" : "王七",
          "age" : 30,
          "birthday" : "1998-10-15"
        }
      },
      {
        "_index" : "test2",
        "_type" : "_doc",
        "_id" : "5",
        "_score" : 0.7549127,
        "_source" : {
          "name" : "王八",
          "age" : 30,
          "birthday" : "1998-10-15"
        }
      }
    ]
  }
}
```

#### must_not查询(非查询)

```json
GET /test2/_search
{
  "query": {
    "bool": {
      "must_not": [
        {
          "match": {
            "name": "张"
          }
        },
        {
          "match": {
            "name": "王"
          }
        }
      ]
    }
  }
}

# 查询的结果必须两个match都不满足才命中
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
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 0.0,
    "hits" : [
      {
        "_index" : "test2",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.0,
        "_source" : {
          "name" : "李四",
          "age" : 10,
          "birthday" : "1998-10-25"
        }
      },
      {
        "_index" : "test2",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 0.0,
        "_source" : {
          "name" : "老六"
        }
      }
    ]
  }
}

```

#### 过滤查询

```json
# 过滤器属于bool查询中的一类
GET /test2/_search
{
  "query": {
    "bool": {
      "must_not": [
        {
          "match": {
            "name": "张"
          }
        }
      ],
      "filter": [
        {
          "range": {    // 范围过滤
            "age": {
              "gte": 5, // 大于或等于
              "lte": 30 // 小于或等于
            }
          }
        }
      ]
    }
  }
}
# 结果
{
  "took" : 30,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 0.0,
    "hits" : [
      {
        "_index" : "test2",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.0,
        "_source" : {
          "name" : "李四",
          "age" : 10,
          "birthday" : "1998-10-25"
        }
      },
      {
        "_index" : "test2",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 0.0,
        "_source" : {
          "name" : "王七",
          "age" : 30,
          "birthday" : "1998-10-15"
        }
      },
      {
        "_index" : "test2",
        "_type" : "_doc",
        "_id" : "5",
        "_score" : 0.0,
        "_source" : {
          "name" : "王八",
          "age" : 30,
          "birthday" : "1998-10-15"
        }
      }
    ]
  }
}

```

### term精确匹配查询

**不会将查询条件进行分词,与目标字段的值的分词后进行精确匹配**

```json
GET /test3/_search
{
  "query": {
    "term": {
      "des": {
        "value": "法"
      }
    }
  }
}
# 能查询出结果
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
      "value" : 4,
      "relation" : "eq"
    },
    "max_score" : 0.14125897,
    "hits" : [
      {
        "_index" : "test3",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 0.14125897,
        "_source" : {
          "name" : "法",
          "des" : "逃离法外之人，极其恶劣，法大",
          "tags" : [
            "坏人",
            "臭名昭著",
            "级别"
          ]
        }
      },
      {
        "_index" : "test3",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.12942764,
        "_source" : {
          "name" : "法外",
          "des" : "逃离法外之人",
          "tags" : [
            "坏人",
            "非法行为"
          ]
        }
      },
      {
        "_index" : "test3",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 0.12844959,
        "_source" : {
          "name" : "法外狂徒张三",
          "des" : "逃离法外之人，极其恶劣，法外中的老大",
          "tags" : [
            "坏人",
            "臭名昭著",
            "老大级别"
          ]
        }
      },
      {
        "_index" : "test3",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.10943023,
        "_source" : {
          "name" : "法外狂徒",
          "des" : "逃离法外之人，极其恶劣",
          "tags" : [
            "坏人",
            "非法行为",
            "臭名昭著"
          ]
        }
      }
    ]
  }
}
# 默认没安装分词器,使用一个词语进行查询
GET /test3/_search
{
  "query": {
    "term": {
      "des": {
        "value": "法外"
      }
    }
  }
}
# 结果没有命中任何一条
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
      "value" : 0,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  }
}
```

#### terms多字段查询

```json
GET /test2/_search
{
  "query": {
    "terms": {
      "age": [
        "10",    // 匹配字段的值，满足其中的一个就行
        "30"
      ]
    }
  }
}
# 结果：
{
  "took" : 287,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "test2",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "name" : "李四",
          "age" : 10,
          "birthday" : "1998-10-25"
        }
      },
      {
        "_index" : "test2",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "name" : "王七",
          "age" : 30,
          "birthday" : "1998-10-15"
        }
      },
      {
        "_index" : "test2",
        "_type" : "_doc",
        "_id" : "5",
        "_score" : 1.0,
        "_source" : {
          "name" : "王八",
          "age" : 30,
          "birthday" : "1998-10-15"
        }
      }
    ]
  }
}

```

#### 与bool查询结合使用

```json
GET /test2/_search
{
  "query": {
    "bool": {
      "should": [   // 只需要满足其中的一个条件就行
        {
          "term": {
            "age": {
              "value": "10"
            }
          }
        },
        {
          "terms": {
            "age": [
              "20",
              "30"
            ]
          }
        }
      ]
    }
  }
}

# 结果
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
      "value" : 4,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "test2",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "name" : "法外狂徒张三",
          "age" : "20"
        }
      },
      {
        "_index" : "test2",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "name" : "李四",
          "age" : 10,
          "birthday" : "1998-10-25"
        }
      },
      {
        "_index" : "test2",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "name" : "王七",
          "age" : 30,
          "birthday" : "1998-10-15"
        }
      },
      {
        "_index" : "test2",
        "_type" : "_doc",
        "_id" : "5",
        "_score" : 1.0,
        "_source" : {
          "name" : "王八",
          "age" : 30,
          "birthday" : "1998-10-15"
        }
      }
    ]
  }
}

```

## 总结

在添加索引的时候，尽量默认使用`_doc`类型，对于不进行查询的字段要指定index属性为`false`

查询的时候：

- query的级别最大，排序的sort，查询字段的_resource,分页的from、size都与query同级别
- query里面为查询条件，有bool查询条件，则bool为query的下一级，没有bool则match与term在query的下一级，否则它们两个在bool里面的 should，must，must_not里面，filter过滤是与should，must，must_not同级别



































































































































