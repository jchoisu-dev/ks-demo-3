// 
const { 
    app,
    dayjs,
    get  
} = require('../../src/lib/http-client');
//
// const test = async() => 
// {
//     // let d = await get('jnd');
//     // let dd = await get('jndlist');
//     // //
//     const _x = dayjs('Nov 7, 2021 01:35:30 AM').tz("America/Vancouver", true).utc().tz("Asia/Shanghai").format('YYYY-MM-DD HH:mm:ss');
//     // v
//     // const _t = (dayjs.tz("Nov 11, 2021 01:21:30 PM","America/Vancouver",true)).utc().tz("Asia/Shanghai").format('YYYY-MM-DD HH:mm:ss');
//     // const _jnd = dayjs(d.drawDate).tz('America/Vancouver').utc().format('YYYY-MM-DD HH:mm:ss');
//     // console.log(d, dd, _t);
//     // 
//     // console.log(d.drawDate);
//     // 2021-11-11T11:12:00.000
//     // 
//     console.log(_x);
// }
// // 
// test();

const timecheck = async(d) => 
{
    // return await dayjs(d).add(15, 'hour').format('YYYY-MM-DD HH:mm:ss');
    return dayjs(d).tz("America/Vancouver", true).utc().tz("Asia/Shanghai").format('YYYY-MM-DD HH:mm:ss');
}

const get_new_elg = async() =>
{
    let d = await get('elg', '', {
        headers: {
            'Host': 'api2.oregonlottery.org',
            'Ocp-Apim-Subscription-Key': process.env.OREGON_API_KEY,
            'Origin': 'https://www.oregonlottery.org',
            'Referer': 'https://www.oregonlottery.org/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36'
        }
    });
    // 
    if(!d || !d.DrawNumber || !d.DrawDateTime || d.WinningNumbers.length<20) return '';
    // const time = dayjs(d.DrawDateTime).add(_cut_hour,'hour').format('YYYY-MM-DD HH:mm:ss');
    const time = await timecheck(d.DrawDateTime);
    // 
    const _aa =  {
        peroids: d.DrawNumber,
        number: d.WinningNumbers.sort((a,b)=>{ return a-b; }),
        time
    }
    console.log(_aa);
}

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
    console.log(_r);
    return _r;
}
const get_one_fast = async() => 
{
    let d = await get('jnd');
    console.log(d);
    if(!d || !d.draw || !d.num || d.num[0]==0) return '';
    // 
    const time = await timecheck(d.drawDate);
    // 
    const _aa = {
        peroids: d.draw,
        number: d.num.sort(function (a,b){ return a-b }),
        time
    }
    console.log(_aa);
}
//
const get_one_gf = async() => 
{
    let d = await get('jndgf');
    if(!d || !d.drawNbr || !d.drawNbrs || d.drawNbrs[0]==0) return '';
    // 
    const time = await timecheck(d.drawDate+' '+d.drawTime);
    // 
    const _aa =  {
        peroids: d.drawNbr,
        number: d.drawNbrs,
        time
    }
    console.log(d, _aa);
}

get_new_elg();