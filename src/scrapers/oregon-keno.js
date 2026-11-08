// 
const { 
    app,
    dayjs,
    get  
} = require('../lib/http-client');

let _cut_hour = 15;
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
const get_new_elg = async(req, res) =>
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
    return {
        peroids: d.DrawNumber,
        number: d.WinningNumbers.sort((a,b)=>{ return a-b; }),
        time
    }
}

app.get('/elg_list', async(req, res) =>
{
    const _time = dayjs().subtract(_cut_hour, 'hour').format('MM/DD/YYYY');
    let d = await get('elglist', '?startingDate='+_time+'&endingDate='+_time+'&pageSize=50', {
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
    if(!d || d.lenght<=0)
    {
        res.end('none');
        return;
    }
    //
    let _list = {};
    for(let i in d)
    {
        let _d = d[i];
        _list[_d.DrawNumber] = [ 
            dayjs(_d.DrawDateTime).add(_cut_hour, 'hour').format('YYYY-MM-DD HH:mm:ss'), 
            _d.WinningNumbers 
        ];
    }
    if(Object.keys(_list).length<=0)
    {
        res.end('none');
        return;
    }
    res.json(_list);
})
//
module.exports = {
    get_new_elg
};