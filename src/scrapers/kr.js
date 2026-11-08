// 
const dayjs = require('dayjs');
const schedule = require('node-schedule');
const { 
    contro_set,
    contro_sets,
    contro_get,
    contro_lpush,
    contro_pub
} = require('../lib/redis');
// 
const numArr = [
    77, 78, 79, 80,
    1, 2, 3, 4, 5,
    13, 14, 15, 16, 17, 18,
    67, 68, 69, 70, 71, 72,
    25, 26, 27, 28, 29, 30,
    37, 38, 39, 40, 41, 42,
    55, 56, 57, 58, 59, 60,
    43, 44, 45, 46, 47, 48,
    6, 7, 8, 9, 10, 11, 12,
    19, 20, 21, 22, 23, 24,
    31, 32, 33, 34, 35, 36,
    49, 50, 51, 52, 53, 54,
    61, 62, 63, 64, 65, 66,
    73, 74, 75, 76
];
// Change this when open lottery data is not corect. Use the next period id, time of the chosen game which has not opened yet (SEE LINE 62 to 67)
const _default_peroids = 3056053;
const _default_time = '2021-12-02 09:12:30';
let _is_test = 1;
//
// 
const getNumber = async(peroids) => 
{
    let arr = numArr.sort(() => Math.random() > .5 ? -1 : 1).sort(() => Math.random() > .5 ? -1 : 1).sort(() => Math.random() > .5 ? -1 : 1).sort(() => Math.random() > .5 ? -1 : 1);
    arr = arr.slice(0, 20).sort((a, b) => a - b);
    return arr;
}
//
schedule.scheduleJob('0,30 * * * * *', async() => 
{
    let body = {};
    const _perv = await contro_get('game_list_kr');
    body.peroids = _default_peroids;
    if(_perv)
    {
        let _second = dayjs().diff(dayjs(_perv.time), 'second');
        if (_second < 85) {
            return;
        }
        body.peroids = parseInt(_perv.peroids) + 1;
    }
    //
    body.time = await dayjs().format('YYYY-MM-DD HH:mm:ss');
    // Comment out the following code when the id and time are correct
    // if(_is_test==1)
    // {
    //     body.peroids = _default_peroids;
    //     body.time = _default_time;
    //     _is_test = 2;
    // }
    // 
    // body.time = await dayjs().subtract(30, 'second').format('YYYY-MM-DD HH:mm:ss');
    body.number = await getNumber(body.peroids);
    await openGame(body);
});
//
const openGame = async(_d) => 
{
    console.log(new Date().toISOString(), 'open', 'kr', _d.peroids, _d.time, _d.number.join(','));
    await contro_set('game_list_kr', _d);
    await contro_pub('lottery_open_data', JSON.stringify({
        category: 'kr',
        ..._d
    }));
}