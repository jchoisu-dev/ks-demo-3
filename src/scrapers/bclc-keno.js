// 
const { 
    app,
    get  
} = require('../lib/http-client');
//
const dayjs = require('dayjs');
//
const utc = require('dayjs/plugin/utc'); // dependent on utc plugin
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);
// 
// const timecheck = async(d) => 
// {
//     return await dayjs(d).add(15, 'hour').format('YYYY-MM-DD HH:mm:ss');
//     // return dayjs(d).tz("America/Vancouver", true).utc().tz("Asia/Shanghai").format('YYYY-MM-DD HH:mm:ss');
// }
// 
const timecheck = async(time) =>
{
    const yyyymmddhh = dayjs().format('YYYY-MM-DD HH');
    const mmss = dayjs(time).format('mm:ss');
    return yyyymmddhh+':'+mmss;
}
// 
const get_list = async() => 
{
    let d = await get('jndlist');
    if(!d || d.length<=0) return '';
    let _r = {};
    for(let i in d)
    {
        let _con = d[i];
        let _time = await timecheck(_con.drawDate+' '+_con.drawTime);
        _r[_con.drawNbr] = [
            _time,
            _con.drawNbrs
        ];
    }
    return _r;
}
//
const get_one_fast = async() => 
{
    let d = await get('jnd');
    if(!d || !d.draw || !d.num || d.num[0]==0) return '';
    // 
    // let nextTime = dayjs().add(d.nextKenoDrawTime, 'second').format('YYYY-MM-DD HH:mm:ss');
    // const time = dayjs(nextTime).subtract(210, 'second').format('YYYY-MM-DD HH:mm:ss');
    const time = await timecheck(d.drawDate);
    // 
    return {
        peroids: d.draw,
        number: d.num.sort(function (a,b){ return a-b }),
        time
    }
}
//
const get_one_gf = async() => 
{
    let d = await get('jndgf');
    if(!d || !d.drawNbr || !d.drawNbrs || d.drawNbrs[0]==0) return '';
    // 
    const time = await timecheck(d.drawDate+' '+d.drawTime);
    // 
    return {
        peroids: d.drawNbr,
        number: d.drawNbrs,
        time
    }
}
//
const get_new_jnd = async() => 
{
    let a = await get_one_fast();
    if(!a) a = await get_one_gf();
    if(!a) return '';
    return a;
}
//
const get_list_jnd = async() =>
{
    let a = await get_one_fast();
    if(!a) a = await get_one_gf();
    let c = await get_list();
    //
    let list = {};
    if(a) list[a.peroids] = [a.time, a.number];
    if(c) list = {...list, ...c};
    // 
    if(Object.keys(list).length<=0){
        return '';
    }
    return list
}
//
module.exports = 
{
    get_new_jnd,
    get_list_jnd
};