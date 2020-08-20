module.exports = {
    title: 'El-Admin-Cloud', // 显示在左上角的网页名称以及首页在浏览器标签显示的title名称
    description: '', // meta 中的描述文字，用于SEO
    // 注入到当前页面的 HTML <head> 中的标签
    head: [
        ['link', {rel: 'icon', href: '/logo.png'}],  //浏览器的标签栏的网页图标
    ],
    theme: 'antdocs',
    base: '/studydocs/',
    markdown: {
        lineNumbers: true
    },
    serviceWorker: true,
    themeConfig: {
        logo: '/logo.png',
        lastUpdated: 'lastUpdate', // string | boolean
        nav: [
            {text: '首页', link: '/'},
            {
                text: '分类',
                ariaLabel: '分类',
                items: [
                    {text: '文档', link: '/pages/eacdocs/Eladmin-Gateway介绍.md'},
                    {text: '笔记', link: '/pages/guild/Elastic Search聚合搜索.md'},
                ]
            },
            {text: '功能演示', link: ''},
            {text: 'Github', link: 'https://github.com/Micah-Z/eladmin-cloud'},
        ],
        sidebar: {
            '/pages/guild/': [
                {
                    title: "ES总结",
                    sidebarDepth: 0,    // 可选的, 默认值是 1
                    children: [
                        ['Elastic Search聚合搜索.md','Elastic Search聚合搜索'],
                        ['ElasticSearch 总结笔记.md','ElasticSearch 总结笔记'],
                    ]
                },
                {
                    title: "Docker总结",
                    sidebarDepth: 0,    // 可选的, 默认值是 1
                    children: [
                        ['docker部署redis集群.md','docker部署redis集群']
                    ]
                },
                {
                    title: "SpringCloud总结",
                    sidebarDepth: 0,    // 可选的, 默认值是 1
                    children: [
                        ['springcloudalibab总结.md','SpringCloudAlibaba总结']
                    ]
                }
            ],
            '/pages/eacdocs/': [
                {
                    title: "项目介绍",
                    sidebarDepth: 0,    // 可选的, 默认值是 1
                    children: [
                        ['El-Admin-Cloud-Introduce.md','El-Admin-Cloud 项目介绍'],
                    ]
                },
                {
                    title: "网关介绍,原理",
                    sidebarDepth: 0,    // 可选的, 默认值是 1
                    children: [
                        ['Eladmin-Gateway介绍.md','网关介绍,原理']
                    ]
                },
            ],
        }
    }
}
