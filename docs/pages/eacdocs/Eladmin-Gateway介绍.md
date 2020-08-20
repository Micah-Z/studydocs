# 项目网关Gateway介绍

## gateway介绍

gateway是Spring Cloud的第二代网关，比起第一代的zuul网关，功能更加强大

### 相关概念

- Route（路由）：路由是构建网关的基本模块，它由ID，目标URI，一系列的断言和过滤器组成，如果断言为true则匹配该路由；
- Predicate（断言）：指的是Java 8 的 Function Predicate。 输入类型是Spring框架中的ServerWebExchange。 这使开发人员可以匹配HTTP请求中的所有内容，例如请求头或请求参数。如果请求与断言相匹配，则进行路由；
- Filter（过滤器）：指的是Spring框架中GatewayFilter的实例，使用过滤器，可以在请求被路由前后对请求进行修改。

## 功能介绍

项目中的网关结合了MySQL数据库，采用动态加载路由的方式，不需要在配置文件中配置路由。

## 具体实现

核心的实现类`RouterServiceImpl`

该类实现了SpringBoot中的两个接口，一个是 `InitializingBean`，另一个是`ApplicationEventPublisherAware`.

-  实现`InitializingBean`的主要作用就是在初始化Bean的时候就初始化路由

```java
@Override
public void afterPropertiesSet() throws Exception {
     this.initData();
}
```

- 实现`ApplicationEventPublisherAware`的目的是监听刷新路由的事件然后发布，将存储在内存中的路由重新刷新一下

```java
 // 初始化数据，从数据库加载数据
 @Override
 public void initData() {
  List<Router> routers = this.routerMapper.selectAll();
  routers.forEach(this::loadRoute);
   // 提交事件
  this.publisher.publishEvent(new RefreshRoutesEvent(this));
    // 加载限流规则,可以加载多条规则
  GatewayRuleManager.loadRules(rules);
 }
```

- 加载路由的具体实现

```java
 /**
     * 配置路由，断言和过滤器都是用shortcut形式配置，与数据库对应
     * @param router
     */
    private void loadRoute(Router router) {
        RouteDefinition definition = new RouteDefinition();
        Map<String, String> predicateParams = new HashMap<>(8);
        List<PredicateDefinition> predicateDefinitions = new ArrayList<>();
        List<FilterDefinition> filterDefinitions = new ArrayList<>();
        Map<String, String> filterParams = new HashMap<>(8);
        // 判断路由状况
        URI uri = null;
        if (router.getRouteType().equals(0)) {
            // 从服务注册中心获取uri
            uri = UriComponentsBuilder.fromUriString("lb://" + router.getRouteUrl()).build().toUri();
        } else {
            // 直接获取httpUri
            uri = UriComponentsBuilder.fromHttpUrl(router.getRouteUrl()).build().toUri();
        }
        /**
         * spring:
         *   cloud:
         *     gateway:
         *       routes:
         *         - id: mygateway
         *           uri: lb://test-serve
         *           filters:
         *             - StripPrefix=1 // 过滤掉服务名后面的第一个前缀,(去掉这个前缀名，再转发)
         *           predicates:
         *             - Path=/test/**
         */
        definition.setId(router.getRouteId());
        // 设置- Path=/test/**
        router.getPredicates().forEach(predicate -> {
            // 实例化断言定义对象
            PredicateDefinition predicateDefinition = new PredicateDefinition();
            // 设置断言的名称
            predicateDefinition.setName(predicate.getPredicateName());
            String[] preValues = predicate.getPredicateVal().split(",");
            Map<String, String> valueMap = initArgs(preValues);
            // 设置断言的值
            predicateDefinition.setArgs(valueMap);
            predicateDefinitions.add(predicateDefinition);
        });
        for (Filter filter : router.getFilters()) {
            FilterDefinition filterDefinition = new FilterDefinition();
            filterDefinition.setName(filter.getFilterName());
            String[] values = filter.getFilterVal().split(",");
            Map<String, String> valueMap = initArgs(values);
            filterDefinition.setArgs(valueMap);
            filterDefinitions.add(filterDefinition);
        }
        // 设置predicates
        definition.setPredicates(predicateDefinitions);
        // 设置filters
        definition.setFilters(filterDefinitions);
        // 设置uri
        definition.setUri(uri);
        this.definitionWriter.save(Mono.just(definition)).subscribe();
        // 设置限流规则
        rules.add(new GatewayFlowRule(router.getRouteId())
                // 限流阈值
                .setCount(router.getThreshold())
                // 统计时间窗口，限流后一秒之类是不能访问的
                .setIntervalSec(router.getIntervalSec()));
        // 还可以配置其他参数，需要在数据库添加相应的字段
    }
```

后面使用sentinel加载限流规则，现在可以不用理会，以后会具体讲解.

