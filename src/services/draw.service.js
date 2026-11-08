// 
const dayjs = require('dayjs');
const { 
    contro_pub,
    contro_lrange,
    contro_lpush,
    contro_set,
    contro_get,
    //
    day_set,
    day_get,
    day_setex
    //
} = require('../lib/redis');
const { getNextPeroidsTime } = require('./draw-schedule.service');
// const { 
//     getGameType
// } = require('./gameTool');
// 
const fix = 'game_list_';
const day_fix = 'day_';
const gameIn = async(category, data) => 
{
    if(!data) return;
    // 
    const { peroids, time, number } = data;
    const _n = fix+''+category;
    // 
    const _perv = await contro_get(_n);
    // console.log(category, _perv);
    if(_perv && _perv.peroids>=peroids) return;
    console.log(new Date().toISOString(), 'open', category, peroids, time, number.join(','));
    await contro_pub('lottery_open_data', JSON.stringify({
        category,
        peroids,
        time,
        number
    }));
    await contro_set(_n, data);
    await day_set(day_fix+''+category, data);
    let __next = await getNextPeroidsTime(category, time);
    // console.log(category, '---------------------- gameIn ----------------------', __next.time, _time, data);
    if(__next.stop) return;
    //
    let _time = __next.next <=0 ? 1 : __next.next;
    await day_setex(category, _time, '-');
}
const dayIn = async(category) => 
{
    const _prev = await day_get(day_fix+''+category);
    if(!_prev) return;
    const __this = await getNextPeroidsTime(category, _prev.time);
    // 
    const peroids = parseInt(_prev.peroids)+1;
    const time = __this.time;
    await contro_pub('lottery_open_data', JSON.stringify({
        category,
        peroids,
        time
    }));
    const __next = await getNextPeroidsTime(category, time);
    if(__next.stop) return;
    await day_set(day_fix+''+category, {
        peroids,
        time
    });
    //  .log(category, '---------------------- dayIn ----------------------', __next.time, __next.next, [
    //     category,
    //     peroids,
    //     time
    // ]);
    await day_setex(category, __next.next, '-');
}
//  
module.exports = 
{
    gameIn,
    dayIn
};