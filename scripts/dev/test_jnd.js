const { contro_get } = require('../../src/lib/redis');
const dayjs = require('dayjs');
// 
const timeCheck = async(time) =>
{
    const yyyymmddhh = dayjs().format('YYYY-MM-DD HH');
    const mmss = dayjs(time).format('mm:ss');
    return yyyymmddhh+':'+mmss;
}
// 
const test = async() =>
{
    const _perv = await contro_get('game_list_jnd');
    // 
    const _new_time = await timeCheck(_perv.time);
    // 
    console.log(_new_time);
}
// 
test();


