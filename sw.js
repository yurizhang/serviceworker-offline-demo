importScripts('js/cache-polyfill.js'); // cache 扩展

var CACHE_VERSION = 'app-v1'; // 缓存文件的版本
var CACHE_FILES = [ // 需要缓存的页面文件
    '/',
    'images/background.jpeg',
    'js/app.js',
    'css/styles.css'
];


self.addEventListener('install', function (event) { // 监听worker的install事件
    event.waitUntil( // 延迟install事件直到缓存初始化完成
        caches.open(CACHE_VERSION)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(CACHE_FILES);
            })
    );
});

self.addEventListener('activate', function (event) { // 监听worker的activate事件
    event.waitUntil( // 延迟activate事件直到
        caches.keys().then(function(keys){
            return Promise.all(keys.map(function(key, i){ // 清除旧版本缓存
                if(key !== CACHE_VERSION){
                    return caches.delete(keys[i]);
                }
            }))
        })
    )
});

self.addEventListener('fetch', function (event) { // 截取页面的资源请求
    event.respondWith( // 返回页面的资源请求
        caches.match(event.request).then(function(res){ // 判断缓存是否命中
            if(res){  // 返回缓存中的资源
                return res;
            }
            requestBackend(event); // 执行请求备份操作
        })
    )
});

function requestBackend(event){  // 请求备份操作
    var url = event.request.clone();
    return fetch(url).then(function(res){ // 请求线上资源
        //if not a valid response send the error
        if(!res || res.status !== 200 || res.type !== 'basic'){
            return res;
        }

        var response = res.clone();

        caches.open(CACHE_VERSION).then(function(cache){ // 缓存从线上获取的资源
            cache.put(event.request, response);
        });

        return res;
    })
}
