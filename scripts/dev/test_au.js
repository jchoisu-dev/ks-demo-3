const { contro_get } = require('../../src/lib/redis');
const dayjs = require('dayjs');
// 
const test = async() =>
{
    const _perv = await contro_get('game_list_au');
    await checkNextTime(_perv);
}
// 
const checkNextTime = async(_perv) =>
{
    if(!_perv || !_perv.time) return 0;
    // 
    const next = parseInt(await dayjs().diff(dayjs(_perv.time), 'second'));
    console.log(next);
    return next;
}
// 
test();