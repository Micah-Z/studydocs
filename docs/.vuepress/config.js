module.exports = {
    title: 'El-admin-Cloud', // 显示在左上角的网页名称以及首页在浏览器标签显示的title名称
    description: 'el-admin微服务文档', // meta 中的描述文字，用于SEO
    // 注入到当前页面的 HTML <head> 中的标签
    head: [
        ['link', {rel: 'icon', href: '/egg.png'}],  //浏览器的标签栏的网页图标
    ],
    theme: 'antdocs',
    markdown: {
        lineNumbers: true
    },
    serviceWorker: true,
    themeConfig: {
        // logo: '/egg.png',
        lastUpdated: 'lastUpdate', // string | boolean
        nav: [
            {text: '首页', link: '/'},
            {
                text: '分类',
                ariaLabel: '分类',
                items: [
                    {text: '文章', link: '/pages/folder1/test1.md'},
                    {text: '琐碎', link: '/pages/folder2/test4.md'},
                ]
            },
            {text: '功能演示', link: '/pages/folder1/test3.md'},
            {text: 'Github', link: 'https://github.com/dwanda'},
        ],
        sidebar: {
            '/pages/folder1/': [
                {
                    title: '测试菜单1',   // 必要的
                    collapsable: false, // 可选的, 默认值是 true,
                    sidebarDepth: 1,    // 可选的, 默认值是 1
                    children: [
                        ['test1.md', '子菜单1'],
                        ['test3.md', '子菜单2']
                    ]
                },
                {
                    title: '测试菜单2',
                    collapsable: false, // 可选的, 默认值是 true,
                    sidebarDepth: 0,    // 可选的, 默认值是 1
                    children: [
                        ['sca.md', 'SpringCloudAlibaba总结'],
                        ['test2.md', '子菜单1']
                    ]
                }
            ],
            '/pages/sca/': [
                {
                    title: "SpringCloud总结",
                    collapsable: false,
                    sidebarDepth: 0,    // 可选的, 默认值是 1
                    children: [
                        ['test3.md', 'test3']
                    ]
                }
            ],
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
        }
    }
}
