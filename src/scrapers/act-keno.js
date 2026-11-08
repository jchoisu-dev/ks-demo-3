// 
const { 
    app,
    dayjs,
    timeLastChange,
    get,
    browser
} = require('../lib/http-client');
// 
const {
    contro_get
} = require('../lib/redis');
//
// Change this when open lottery data is not corect. Use the next period id, time of the chosen game which has not opened yet (SEE LINE 62 to 67)
const _default_peroids = 8895177;
let _is_test = 1;
// 
const checkNextTime = async(_perv) =>
{
    if(!_perv || !_perv.time) return 0;
    // 
    const next = parseInt(await dayjs().diff(dayjs(_perv.time), 'second'));
    // console.log(next);
    return next;
}
const get_new_au = async() =>
{
    const _perv = await contro_get('game_list_au');
    const _next_open_time = await checkNextTime(_perv);
    if(_next_open_time < 160) return '';
    let d = await get('au');
    // 
    // console.log(d);
    // 
    if(!d || !d.current || !d.current.draw) return '';
    // console.log(d.selling.closing);
    let list = d.current;
    let peroids;
    let number;
    let time;
    try {
        number = list.draw;
        time = await dayjs(list.closed).format('YYYY-MM-DD HH:mm:ss');
        // peroids = dayjs(time).format('YYMMDDHHmmss');
        // next = await timeLastChange(dayjs(d.selling.closing).format('YYYY-MM-DD HH:mm:ss'));
        number.sort((a,b)=>{ return a-b });
    } catch (error) {
        // console.log(error);
    }
    // 
    // const _perv = await contro_get('game_list_au');
    if(_perv && (_perv.number).join(',')==number.join(',') && _perv.time==time) return '';
    // 
    if(_perv && _perv.peroids)
    {
        peroids = parseInt(_perv.peroids)+1
    }else{
        peroids = _default_peroids;
    }
    // 
    // Comment out the following code when the id and time are correct
    // if(_is_test==1)
    // {
    //     peroids = _default_peroids;
    //     _is_test = 2;
    // }
    //
    if(!peroids || !time || !number || number.length<20) return '';
    // 
    return {
        peroids,
        number,
        time
    }
}

module.exports = {
    get_new_au
};