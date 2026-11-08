'use strict';
// 
const { redis_contro, redis_day } = require('../config');
//
const { promisify } = require("util");
const redis = require("redis");
//
const client_contro = redis.createClient(redis_contro);
const client_day = redis.createClient(redis_day);

// const get_1_async = promisify(client_1.get).bind(client_1);
// // 2
// const client_2 = redis.createClient(redis_2_Config);
// const get_2_async = promisify(client_2.get).bind(client_2);
// const set_2_async = promisify(client_2.set).bind(client_2);
// // const lrange_2_async = promisify(client_2.lrange).bind(client_2);
// // 
// const redis_2_pub = redis.createClient(redis_2_Config);
// const redis_2_sub = redis.createClient(redis_2_Config);
// const redis_2_room_sub = redis.createClient(redis_2_Config);
// const redis_2_admin_to_user_sub = redis.createClient(redis_2_Config);
// const lpush_2 = promisify(client_2.lpush).bind(client_2);
const contro_sets = promisify(client_contro.set).bind(client_contro);
const contro_gets = promisify(client_contro.get).bind(client_contro);
const contro_setex = promisify(client_contro.setex).bind(client_contro);
const contro_lpush = promisify(client_contro.lpush).bind(client_contro);
const contro_lrange = promisify(client_contro.lrange).bind(client_contro);
const contro_lindex = promisify(client_contro.lindex).bind(client_contro);
const contro_ltrim = promisify(client_contro.ltrim).bind(client_contro);
const contro_del = promisify(client_contro.del).bind(client_contro);
const contro_set = async(n,d) => 
{
    if(!d) return '';
    return await contro_sets(n, JSON.stringify(d));
}
const contro_get = async(n) => 
{
    const d = await contro_gets(n);
    if(!d) return '';
    return JSON.parse(d);
}
const contro_list = async(n, a=0, b=-1) => 
{
    const _list = await contro_lrange(n, a, b);
    if(!_list) return '';
    let _r = [];
    try {
        for(let i in _list)
        {
            _r.push(JSON.parse(_list[i]));
        }
    } catch (error) {
        
    }
    return _r;
}
const contro_subscribe = redis.createClient(redis_contro);
const contro_pubs = redis.createClient(redis_contro);
const contro_pub = promisify(contro_pubs.publish).bind(contro_pubs);
//
const day_subscribe = redis.createClient(redis_day);
// 
const day_sets = promisify(client_day.set).bind(client_day);
const day_gets = promisify(client_day.get).bind(client_day);
const day_setex = promisify(client_day.setex).bind(client_day);
const day_del = promisify(client_day.del).bind(client_day);
const day_set = async(n,d) => 
{
    if(!d) return '';
    return await day_sets(n, JSON.stringify(d));
}
const day_get = async(n) => 
{
    const d = await day_gets(n);
    if(!d) return '';
    return JSON.parse(d);
}
// Close every Redis connection, waiting for pending replies (QUIT).
const closeConnections = () => Promise.all(
    [client_contro, client_day, contro_subscribe, contro_pubs, day_subscribe]
        .map(client => new Promise(resolve => client.quit(() => resolve())))
);
//
module.exports = 
{
    closeConnections,
    contro_del,
    contro_pub,
    contro_lpush,
    contro_setex,
    contro_lrange,
    contro_lindex,
    contro_list,
    contro_ltrim,
    contro_set,
    contro_sets,
    contro_get,
    contro_subscribe,
    //
    day_subscribe,
    day_set,
    day_get,
    day_setex,
    day_del,
};