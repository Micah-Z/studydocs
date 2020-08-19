# springcloudalibab总结

## nacos总结

### nacos作为服务注册中心

> 单机部署

服务端部署

```bash
# 拉取镜像
docker pull nacos/nacos-server
# 运行镜像
docker run --env MODE=standalone --name nacos -d -p 8848:8848 nacos/nacos-server # mode指定是单机还是集群
# 进入容器修改配置文件
docker exec -it <CONTAINER ID> bash
vim conf/application.properties # 主要修改mysql相关的参数，使nacos中的数据能够持久化到mysql，注意mysql的版本不能为mysql8，否则会出错

```

服务端配置

```pom
<!-- 引入坐标依赖-->
 <dependency>
      <groupId>com.alibaba.cloud</groupId>
      <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
 </dependency>
```

```yaml
# 配置文件配置
server:
  port: 8081
spring:
  application:
    name: test-serve
  profiles:
    active: dev
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
```



```java
// 启动类配置
@SpringBootApplication
@EnableDiscoveryClient
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

上述客户端配置完启动项目就可以将服务注册到nacos，进行统一的管理



### nacos作为分布式配置中心

- 服务端不需要配置，只需要配置客户端就行

``` pom
<!-- 引入坐标依赖 -->
<dependency>
      <groupId>com.alibaba.cloud</groupId>
      <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
```

- 配置文件的配置项

``` yaml
# 配置文件需要配置到bootstrap.yml中 , 读取的配置文件的默认名称为:
# ${spring.application.name} - {dev or prod}. yaml or properties
server:
  port: 8081
spring:
  application:
    name: test-serve
  profiles:
    active: dev
  cloud:
    nacos:
      discovery:
        server-addr: 121.89.178.219:8848
      config:
        server-addr: 121.89.178.219:8848
        file-extension: yaml  # 指定需要读取的配置文件的类型,支持yaml和properties
```

- 在需要读取配置文件类容的类中的配置

```java
@RestController
@RequestMapping("/config")
@RefreshScope     				// 加上该注解就可以动态读取配置文件的类容,不需要重启服务就可以读									// 取置文件的内容
public class TestController {
    @Value("${user.config}")
    private String useLocalCache;

    @GetMapping("/get")
    public String get() {
        // int i = 1/0;
        return useLocalCache;
    }
}
```

## 使用RestTemplate调用服务实现负载均衡

- 只需要在配置类中的方法加上@LoadBalanced注解,实际中微服务之间的通信采用的是openfeign组件，该组件已经集成了ribbon负载均衡组件

```java
	@Bean
    @LoadBalanced
    public RestTemplate restTemplate(){
        return new RestTemplate();
    }
	// 调用接口的时候可以自动将http://服务名/hello转换为http://域名/hello
```

## openfeign的使用

- 启动类需要假注解

```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients   		// 开启支持openfeign
@EnableDiscoveryClient    
public class SentinelApplication {

    public static void main(String[] args) {
        SpringApplication.run(SentinelApplication.class, args);
    }

}
```

- 接口配置

```java
package com.example.demo.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * @program: spring-cloud-alibaba
 * @description:
 * @author: MicahZhang
 * @create: 2020-07-05 21:07
 * 当有@RequestParam @PathVariable注解需要指定val属性
 **/
@FeignClient("test-serve")
public interface FeignClients {

    @GetMapping("/config/get")
    String get();
}
```



## 第二代网关gateway配置

> 网关依赖的是webflux，默认已经集成，不能使用web坐标，如有有引用需要删掉

- 引入坐标依赖

```pom
<dependency>
     <groupId>com.alibaba.cloud</groupId>
     <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
<dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
```

- 配置文件配置

```yaml
server:
  port: 80
spring:
  application:
    name: gateway-server
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true # 该配置打开表示可以和nacos进行结合,可以发现nacos上面的服务
      datasource:
        ds:
          nacos:
            server-addr: 121.89.178.219:8848 # nacos服务端的地址
          routes:
            - id: mygateway					# 路由的id，随意取，但要是唯一的
              uri: lb://test-serve			# lb:表示负载均衡，需要路由的地址
              filters:
                - StripPrefix=1
              predicates:
                - Path=/test/**				# 当访问的地址中有test将路由到test-serve服务上
```

- 自定义拦截器

```java

// 需要实现GlobalFilter接口，如果需要指定执行顺序则可以实现Order接口
@Component
public class TokenFilter implements GlobalFilter {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String token = exchange.getRequest().getQueryParams().getFirst("token");
        if (token == null || token.isEmpty()) {
            ServerHttpResponse response = exchange.getResponse();
            response.setStatusCode(HttpStatus.BAD_REQUEST);
            String msg = "token not is null ";
            DataBuffer buffer = response.bufferFactory().wrap(msg.getBytes());
            return response.writeWith(Mono.just(buffer));
        }
        // 使用网关过滤
        return chain.filter(exchange);
    }
}

```

### 网关集群

> 需要配置nginx进行反向代理到gateway，在nginx上面做负载均衡 

![image-20200710183120139](C:\Users\z7676\AppData\Roaming\Typora\typora-user-images\image-20200710183120139.png)



### 动态获取网关的参数

> 实现原理：将路由参数存放在数据库中，动态加载到内存中

- 数据库脚本,可在此基础上增加字段

```sql
CREATE TABLE `mayikt_gateway` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `route_id` varchar(11) DEFAULT NULL,
  `route_name` varchar(255) DEFAULT NULL,
  `route_pattern` varchar(255) DEFAULT NULL,
  `route_type` varchar(255) DEFAULT NULL,
  `route_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
);  
```

- 引入依赖坐标

```pom
		<dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter</artifactId>
            <version>3.3.2</version>
        </dependency>
```



- 配置文件,此时不需要路由信息，所有的信息可以动态加载

```yaml
server:
  port: 80
spring:
  application:
    name: gateway-server
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true # 该配置打开表示可以和nacos进行结合,可以发现nacos上面的服务
      datasource:
        ds:
          nacos:
            server-addr: 121.89.178.219:8848 # nacos服务端的地址
   datasource:
    url: jdbc:mysql://121.89.178.219:3306/gateway?useUnicode=true&characterEncoding=UTF-8
    username: root
    password: 
```

- 核心代码

```java


import com.alibaba.csp.sentinel.adapter.gateway.common.rule.GatewayFlowRule;
import com.alibaba.csp.sentinel.adapter.gateway.common.rule.GatewayRuleManager;
import com.example.demo.entity.GatewayEntity;
import com.example.demo.mapper.GateMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.event.RefreshRoutesEvent;
import org.springframework.cloud.gateway.filter.FilterDefinition;
import org.springframework.cloud.gateway.handler.predicate.PredicateDefinition;
import org.springframework.cloud.gateway.route.RouteDefinition;
import org.springframework.cloud.gateway.route.RouteDefinitionWriter;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.ApplicationEventPublisherAware;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.*;

/**
 * @program: spring-cloud-alibaba
 * @description:
 * @author: MicahZhang
 * @create: 2020-07-03 22:47
 **/
@Service
public class GateWayService implements ApplicationEventPublisherAware {

    @Autowired
    private GateMapper gateMapper;

    private ApplicationEventPublisher publisher;

    Set<GatewayFlowRule> rules = new HashSet<>();

    @Autowired
    private RouteDefinitionWriter definitionWriter;

    // 初始化数据，从数据库加载数据
    public void initData() {
        List<GatewayEntity> gatewayEntities = this.gateMapper.selectList(null);
        gatewayEntities.forEach(this::loadRoute);
        // 提交事件，加载路由信息到内存中
        this.publisher.publishEvent(new RefreshRoutesEvent(this));
    }

    private void loadRoute(GatewayEntity gatewayEntity) {
        RouteDefinition definition = new RouteDefinition();
        Map<String, String> predicateParams = new HashMap<>(8);
        PredicateDefinition predicateDefinition = new PredicateDefinition();
        FilterDefinition filterDefinition = new FilterDefinition();
        Map<String, String> filterParams = new HashMap<>(8);
        // 判断路由状况
        URI uri = null;
        if ("0".equals(gatewayEntity.getRouteType())) {
            // 从服务注册中心获取uri
            uri = UriComponentsBuilder.fromUriString("lb://" + gatewayEntity.getRouteUrl()).build().toUri();
        } else {
            // 直接获取httpUri
            uri = UriComponentsBuilder.
                fromHttpUrl(gatewayEntity.getRouteUrl()).build().toUri();
        }
        /**
         * spring:
         *   cloud:
         *     gateway:
         *       routes:
         *         - id: mygateway
         *           uri: lb://test-serve
         *           filters:
         *             - StripPrefix=1
         *           predicates:
         *             - Path=/test/**
         */
        definition.setId(gatewayEntity.getRouteId());
        // 设置- Path=/test/**
        predicateDefinition.setName("Path");
        predicateParams.put("pattern", gatewayEntity.getRoutePattern());
        predicateDefinition.setArgs(predicateParams);
        // 设置predicates
        definition.setPredicates(Arrays.asList(predicateDefinition));
        // 设置StripPrefix=1
        filterDefinition.setName("StripPrefix");
        filterParams.put("_genkey_0", "1");
        filterDefinition.setArgs(filterParams);
        // 设置filters
        definition.setFilters(Arrays.asList(filterDefinition));
        // 设置uri
        definition.setUri(uri);
        this.definitionWriter.save(Mono.just(definition)).subscribe();
    }

    @Override
    public void setApplicationEventPublisher(ApplicationEventPublisher applicationEventPublisher) {
        this.publisher = applicationEventPublisher;
    }
}

```

- mapper层

```java
/**
 * @program: spring-cloud-alibaba
 * @description:
 * @author: MicahZhang
 * @create: 2020-07-03 22:56
 **/
public interface GateMapper extends BaseMapper<GatewayEntity> {
}
```

- 实体类

```java
package com.example.demo.entity;

import com.baomidou.mybatisplus.annotation.TableName;

import java.io.Serializable;

/**
 * @program: spring-cloud-alibaba
 * @description:
 * @author: MicahZhang
 * @create: 2020-07-03 22:59
 **/
@TableName("gateway")
public class GatewayEntity implements Serializable {
    private Integer id;
    private String routeId;
    private String routeName;
    private String routePattern;
    private String routeType;
    private String routeUrl;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getRouteId() {
        return routeId;
    }

    public void setRouteId(String routeId) {
        this.routeId = routeId;
    }

    public String getRouteName() {
        return routeName;
    }

    public void setRouteName(String routeName) {
        this.routeName = routeName;
    }

    public String getRoutePattern() {
        return routePattern;
    }

    public void setRoutePattern(String routePattern) {
        this.routePattern = routePattern;
    }

    public String getRouteType() {
        return routeType;
    }

    public void setRouteType(String routeType) {
        this.routeType = routeType;
    }

    public String getRouteUrl() {
        return routeUrl;
    }

    public void setRouteUrl(String routeUrl) {
        this.routeUrl = routeUrl;
    }
}

```

- controller层

```java
package com.example.demo.controller;

import com.example.demo.service.GateWayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @program: spring-cloud-alibaba
 * @description: gate动态配置接口
 * @author: MicahZhang
 * @create: 2020-07-03 22:45
 **/
@RestController
public class GateWayController {

    @Autowired
    private GateWayService gateWayService;

    @GetMapping("load")
    public String load(){
        this.gateWayService.initData();
        return "success";
    }
}

```

### gateway解决跨域问题

```java
@Component
public class CrossOriginFilter implements GlobalFilter {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        ServerHttpResponse response = exchange.getResponse();
        HttpHeaders headers = response.getHeaders();
        headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*");
        headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, "POST, GET, PUT, OPTIONS, DELETE, PATCH");
        headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
        headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, "*");
        headers.add(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, "*");
        return chain.filter(exchange);

    }
}

```



## sentinel服务保护

> sentinel具有接口限流和，熔断，服务降级功能

### 手动配置方式

```pom
 		<dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
        </dependency>
```

- 手动配置限流Api

```java
private static final String GETORDER_KEY = "getOrder";


@RequestMapping("/initFlowQpsRule")
public String initFlowQpsRule() {
    List<FlowRule> rules = new ArrayList<FlowRule>(); // 规则集合
    FlowRule rule1 = new FlowRule();
    rule1.setResource(GETORDER_KEY);
    // 配置qps，QPS控制在1以内，qps为每秒访问的最大次数
    rule1.setCount(1);
    // QPS限流
    rule1.setGrade(RuleConstant.FLOW_GRADE_QPS);
    rule1.setLimitApp("default");
    rules.add(rule1);
    // 加载规则
    FlowRuleManager.loadRules(rules);
    return "....限流配置初始化成功..";
}


@RequestMapping("/getOrder")
public String getOrders() {
    Entry entry = null;
    try {
        entry = SphU.entry(GETORDER_KEY);
        // 执行我们服务需要保护的业务逻辑
        return "getOrder接口";
    } catch (Exception e) {
        e.printStackTrace();
        return "该服务接口已经达到上线!";
    } finally {
        // SphU.entry(xxx) 需要与 entry.exit() 成对出现,否则会导致调用链记录异常
        if (entry != null) {
            entry.exit();
        }
    }

}

```

- 当springboot项目启动后自动加载限流规则

```java
@Component
@Slf4j
public class SentinelApplicationRunner implements ApplicationRunner {
    private static final String GETORDER_KEY = "getOrder";

    @Override
    public void run(ApplicationArguments args) throws Exception {
        List<FlowRule> rules = new ArrayList<FlowRule>();
        FlowRule rule1 = new FlowRule();
        rule1.setResource(GETORDER_KEY);
        // QPS控制在1以内
        rule1.setCount(1);
        // QPS限流
        rule1.setGrade(RuleConstant.FLOW_GRADE_QPS);
        rule1.setLimitApp("default");
        rules.add(rule1);
        FlowRuleManager.loadRules(rules);
        log.info(">>>限流服务接口配置加载成功>>>");
    }
}

```

### 控制台配置限流接口,需要下载Sentinel-Dashboard的jar包

```bash
# 下载地址
https://github.com/alibaba/Sentinel/releases/tag/1.3.0
# 运行命令
java -Dserver.port = 8080 -Dcsp.sentinel.dashboard.server = localhost：8080 -Dproject.name = sentinel-dashboard -jar sentinel-dashboard.jar
# -Dserver.port=8080 是控制台访问接口，可以自己指定
# 登陆的默认账号和密码都为sentinel
```



![image-20200710191744722](C:\Users\z7676\AppData\Roaming\Typora\typora-user-images\image-20200710191744722.png)

- springboot整合sentinel

1. 配置文件

```yaml
spring:
  application:
    ###服务的名称
    name: meitemayikt-order

  cloud:
    nacos:
      discovery:
        ###nacos注册地址
        server-addr: 127.0.0.1:8848
    sentinel:
      transport:
        dashboard: 127.0.0.1:8080 # 控制台的地址
      eager: true

```



1. 注解配置

```java
package com.example.demo.controller;

import com.alibaba.csp.sentinel.annotation.SentinelResource;
import com.example.demo.client.FeignClients;
import com.example.demo.exception.HandleFallBack;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @program: spring-cloud-alibaba
 * @description:
 * @author: MicahZhang
 * @create: 2020-07-04 20:43
 * 如果没有使用@SentinelResource注解的情况下，默认的资源名称为接口路径地址。
 */
@RestController
public class SentinelController {

  @GetMapping("/test")
  @SentinelResource(value = "sentinel-test",
                    blockHandler="限流之后调用的方法") // 开启该注解可以实现限流
  public String test() {
  }
}


```

### 使用分布式配置中心存储sentinel中的规则

- 原理

![image-20200710192806781](C:\Users\z7676\AppData\Roaming\Typora\typora-user-images\image-20200710192806781.png)

当服务启动后从nacos中读取配置信息到内存

sentinel控制台读取配置进行展示

- 步骤

1. 在nacos上面创建json格式的配置文件

```json
[
    {
        "resource": "/ getOrderSentinel",
        "limitApp": "default",
        "grade": 1,
        "count": 5,
        "strategy": 0,
        "controlBehavior": 0,
        "clusterMode": false
    }
]
resource：资源名，即限流规则的作用对象 相当于注解中的value属性的值
limitApp：流控针对的调用来源，若为 default 则不区分调用来源
grade：限流阈值类型（QPS 或并发线程数）；0代表根据并发数量来限流，1代表根据QPS来进行流量控制
count：限流阈值
strategy：调用关系限流策略
controlBehavior：流量控制效果（直接拒绝、Warm Up、匀速排队）
clusterMode：是否为集群模式


```

2. 引入坐标

```pom
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-datasource-nacos</artifactId>
</dependency>

```

3. 配置文件配置

```yaml
sentinel:
  transport:
    dashboard: 127.0.0.1:8718
  eager: true
  datasource:
    ds:
      nacos:
        ### nacos连接地址
        server-addr: localhost:8848
        ## nacos连接的分组
        group-id: DEFAULT_GROUP
        ###路由存储规则
        rule-type: flow
        ### 读取配置文件的 data-id
        data-id: 
        ###  读取培训文件类型为json
        data-type: json

```

> 配置完成后就可自动读取限流信息

### gateway网关整合sentinel

- 导入官方提供的依赖

```pom
 		<dependency>
            <groupId>com.alibaba.csp</groupId>
            <artifactId>sentinel-datasource-nacos</artifactId>
        </dependency>
```

- 网关路由配置

```yaml
gateway:
  routes:
    - id: my-member
      uri: lb://test-server
      predicates:
        - Path=/test/**
    - id: mayikt
      uri: http://www.baidu.com
      predicates:
        - Path=/baidu/**

```

- 编写配置类

```java
package com.example.demo.config;

import com.alibaba.csp.sentinel.adapter.gateway.sc.SentinelGatewayFilter;
import com.alibaba.csp.sentinel.adapter.gateway.sc.exception.SentinelGatewayBlockExceptionHandler;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.web.reactive.result.view.ViewResolver;

import java.util.Collections;
import java.util.List;

@Configuration
public class GatewayConfiguration {

    private final List<ViewResolver> viewResolvers;
    private final ServerCodecConfigurer serverCodecConfigurer;

    public GatewayConfiguration(ObjectProvider<List<ViewResolver>> viewResolversProvider,
                                ServerCodecConfigurer serverCodecConfigurer) {
        this.viewResolvers = viewResolversProvider.getIfAvailable(Collections::emptyList);
        this.serverCodecConfigurer = serverCodecConfigurer;
    }

    // 触发限流后执行的方法
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public SentinelGatewayBlockExceptionHandler sentinelGatewayBlockExceptionHandler() {
        // Register the block exception handler for Spring Cloud Gateway.
        return new SentinelGatewayBlockExceptionHandler(viewResolvers, serverCodecConfigurer);
    }

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public GlobalFilter sentinelGatewayFilter() {
        return new SentinelGatewayFilter();
    }
}
```

- 配置限流信息

```java
@Slf4j
@Component
public class SentinelApplicationRunner implements ApplicationRunner {

    @Override
    public void run(ApplicationArguments args) throws Exception {
        initGatewayRules();
    }

    /**
     * 配置限流规则
     */
    private void initGatewayRules() {
        // GatewayFlowRule 为限流规则
        Set<GatewayFlowRule> rules = new HashSet<>();
        rules.add(new GatewayFlowRule("mayikt")
                // 限流阈值
                .setCount(1)
                // 统计时间窗口，单位是秒，默认是 1 秒
                .setIntervalSec(1)
        );
        // 加载规则
        GatewayRuleManager.loadRules(rules);
    }
}

```

- 修改触发限流规则之后的提示

```java

// 主要是实现WebExceptionHandler接口，重写handle方法
public class JsonSentinelGatewayBlockExceptionHandler implements WebExceptionHandler {
    public JsonSentinelGatewayBlockExceptionHandler(List<ViewResolver> viewResolvers, ServerCodecConfigurer serverCodecConfigurer) {
    }

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse serverHttpResponse = exchange.getResponse();
        serverHttpResponse.getHeaders().add("Content-Type", "application/json;charset=UTF-8");
        byte[] datas = "{\"code\":403,\"msg\":\"API接口被限流\"}".getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = serverHttpResponse.bufferFactory().wrap(datas);
        return serverHttpResponse.writeWith(Mono.just(buffer));
    }
}
```

- 在配置类中做相应的更改

```java
@Bean
@Order(Ordered.HIGHEST_PRECEDENCE)
public JsonSentinelGatewayBlockExceptionHandler sentinelGatewayBlockExceptionHandler() {
    // Register the block exception handler for Spring Cloud Gateway.
    return new JsonSentinelGatewayBlockExceptionHandler(viewResolvers, serverCodecConfigurer);
}

```



### 服务降级策略

**1.平均响应时间 (DEGRADE_GRADE_RT)：当 1s 内持续进入 5 个请求，对应时刻的平均响应时间（秒级）均超过阈值（count，以 ms 为单位），那么在接下的时间窗口（DegradeRule 中的 timeWindow，以 s 为单位）之内，对这个方法的调用都会自动地熔断（抛出 DegradeException）。注意 Sentinel 默认统计的 RT 上限是 4900 ms，超出此阈值的都会算作 4900 ms，若需要变更此上限可以通过启动配置项 -Dcsp.sentinel.statistic.max.rt=xxx 来配置。**

**2.异常比例 (DEGRADE_GRADE_EXCEPTION_RATIO)：当资源的每秒请求量 >= 5，并且每秒异常总数占通过量的比值超过阈值（DegradeRule 中的 count）之后，资源进入降级状态，即在接下的时间窗口（DegradeRule 中的 timeWindow，以 s 为单位）之内，对这个方法的调用都会自动地返回。异常比率的阈值范围是 [0.0, 1.0]，代表 0% - 100%。**

**3.异常数 (DEGRADE_GRADE_EXCEPTION_COUNT)：当资源近 1 分钟的异常数目超过阈值之后会进行熔断。注意由于统计时间窗口是分钟级别的，若 timeWindow 小于 60s，则结束熔断状态后仍可能再进入熔断状态 **

---

### 网关整合sentinel实现动态加载数据源和路由策略

- 引入坐标依赖

```pom
		<dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-gateway</artifactId>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter</artifactId>
            <version>3.3.2</version>
        </dependency>

        <dependency>
            <groupId>com.alibaba.csp</groupId>
            <artifactId>sentinel-spring-cloud-gateway-adapter</artifactId>
        </dependency>
```

- 配置文件

```yaml
server:
  port: 80
spring:
  application:
    name: gateway-server
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true # 该配置打开表示可以和nacos进行结合,可以发现nacos上面的服务
      datasource:
        ds:
          nacos:
            server-addr: 121.89.178.219:8848 # nacos服务端的地址
   datasource:
    url: jdbc:mysql://121.89.178.219:3306/gateway?useUnicode=true&characterEncoding=UTF-8
    username: root
    password: 
```

- mapper层代码

```java
package com.example.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.demo.entity.GatewayEntity;

/**
 * @program: spring-cloud-alibaba
 * @description:
 * @author: MicahZhang
 * @create: 2020-07-03 22:56
 **/
public interface GateMapper extends BaseMapper<GatewayEntity> {
}

```

- service层代码

```java
package com.example.demo.service;

import com.alibaba.csp.sentinel.adapter.gateway.common.rule.GatewayFlowRule;
import com.alibaba.csp.sentinel.adapter.gateway.common.rule.GatewayRuleManager;
import com.example.demo.entity.GatewayEntity;
import com.example.demo.mapper.GateMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.event.RefreshRoutesEvent;
import org.springframework.cloud.gateway.filter.FilterDefinition;
import org.springframework.cloud.gateway.handler.predicate.PredicateDefinition;
import org.springframework.cloud.gateway.route.RouteDefinition;
import org.springframework.cloud.gateway.route.RouteDefinitionWriter;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.ApplicationEventPublisherAware;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.*;

/**
 * @program: spring-cloud-alibaba
 * @description:
 * @author: MicahZhang
 * @create: 2020-07-03 22:47
 * 先要确保有路由规则信息，再配置限流信息
 **/
@Service
public class GateWayService implements ApplicationEventPublisherAware {

    @Autowired
    private GateMapper gateMapper;

    private ApplicationEventPublisher publisher;

    Set<GatewayFlowRule> rules = new HashSet<>();

    @Autowired
    private RouteDefinitionWriter definitionWriter;

    // 初始化数据，从数据库加载数据
    public void initData() {
        List<GatewayEntity> gatewayEntities = this.gateMapper.selectList(null);
        gatewayEntities.forEach(this::loadRoute);
        // 提交事件
        this.publisher.publishEvent(new RefreshRoutesEvent(this));
        // 加载限流规则,可以加载多条规则
        GatewayRuleManager.loadRules(rules);
    }

    private void loadRoute(GatewayEntity gatewayEntity) {
        RouteDefinition definition = new RouteDefinition();
        Map<String, String> predicateParams = new HashMap<>(8);
        PredicateDefinition predicateDefinition = new PredicateDefinition();
        FilterDefinition filterDefinition = new FilterDefinition();
        Map<String, String> filterParams = new HashMap<>(8);
        // 判断路由状况
        URI uri = null;
        if ("0".equals(gatewayEntity.getRouteType())) {
            // 从服务注册中心获取uri
            uri = UriComponentsBuilder.fromUriString("lb://" + gatewayEntity.getRouteUrl()).build().toUri();
        } else {
            // 直接获取httpUri
            uri = UriComponentsBuilder.fromHttpUrl(gatewayEntity.getRouteUrl()).build().toUri();
        }
        /**
         * spring:
         *   cloud:
         *     gateway:
         *       routes:
         *         - id: mygateway
         *           uri: lb://test-serve
         *           filters:
         *             - StripPrefix=1
         *           predicates:
         *             - Path=/test/**
         */
        definition.setId(gatewayEntity.getRouteId());
        // 设置- Path=/test/**
        predicateDefinition.setName("Path");
        predicateParams.put("pattern", gatewayEntity.getRoutePattern());
        predicateDefinition.setArgs(predicateParams);
        // 设置predicates
        definition.setPredicates(Arrays.asList(predicateDefinition));
        // 设置StripPrefix=1
        filterDefinition.setName("StripPrefix");
        filterParams.put("_genkey_0", "1");
        filterDefinition.setArgs(filterParams);
        // 设置filters
        definition.setFilters(Arrays.asList(filterDefinition));
        // 设置uri
        definition.setUri(uri);
        this.definitionWriter.save(Mono.just(definition)).subscribe();
        // 设置限流规则
        rules.add(new GatewayFlowRule(gatewayEntity.getRouteId())
                  // 限流阈值
                .setCount(1)
                  // 统计时间窗口，限流后一秒之类是不能访问的
                .setIntervalSec(1));
        		// 还可以配置其他参数，需要在数据库添加相应的字段
    }

    @Override
    public void setApplicationEventPublisher(ApplicationEventPublisher applicationEventPublisher) {
        this.publisher = applicationEventPublisher;
    }
}

```

- controller层

```java
package com.example.demo.controller;

import com.example.demo.service.GateWayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @program: spring-cloud-alibaba
 * @description: gate动态配置接口
 * @author: MicahZhang
 * @create: 2020-07-03 22:45
 **/
@RestController
public class GateWayController {

    @Autowired
    private GateWayService gateWayService;

    @GetMapping("load")
    public String load(){
        this.gateWayService.initData();
        return "success";
    }
}

```

### 热点词限流

**可以对参数的不同来配置限流规则**

[参考文档] [https://github.com/alibaba/Sentinel/wiki/%E7%83%AD%E7%82%B9%E5%8F%82%E6%95%B0%E9%99%90%E6%B5%81](https://github.com/alibaba/Sentinel/wiki/热点参数限流)



