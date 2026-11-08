// 
const { 
    app,
    cheerio,
    dayjs,
    get  
} = require('../lib/http-client');

const timeChange= async () => 
{
    let _minute = dayjs().format('mm');
    let _minuteX = _minute.split('');
    _minuteX[1] = _minuteX[1]<5 ? 0 : 5;
    return await dayjs().format('YYYY-MM-DD HH:')+_minuteX.join('')+':00';
};
//
const _cut_hour = 18;
// console.log(encodeURIComponent(dayjs().subtract(_cut_hour, 'hour').format('MM/DD/YYYY')));
const get_new_jnc = async() =>
{
    const _time = encodeURIComponent(dayjs().subtract(_cut_hour, 'hour').format('MM/DD/YYYY'));
    let d = await get('jnc','?selDate='+_time);
    // 
    let peroids;
    let number;
    let time;
    try {
        const $ = cheerio.load(d);
        const _td = $('.kenoTable').find('tr').last().find('td');
        peroids = _td.eq(0).html().replace(/(^\s*)|(\s*$)/g, "");
        peroids = parseInt(peroids);
        // 
        time = await timeChange();
        // 
        number = [];
        for(let i=1;i<21;i++)
        {
            number.push(parseInt(_td.eq(i).html().replace(/(^\s*)|(\s*$)/g, "")));
        }
    } catch (error) {
        
    }
    // 
    if(!peroids || !time || number.length<20) return '';
    // 
    return {
        peroids,
        number,
        time
    }
}

app.get('/jnc_list', async(req, res) =>
{
    const _time = encodeURIComponent(dayjs().subtract(_cut_hour, 'hour').format('MM/DD/YYYY'));
    let d = await get('jnc','?selDate='+_time);
    // 
    let peroids;
    let number;
    let time;
    let _r = [];
    let _rr = {};
    try {
        const $ = cheerio.load(d);
        const _trs = $('.kenoTable').find('tr');
        for(let i=1;i<_trs.length;i++)
        {
            const _td = $('.kenoTable').find('tr').eq(i).find('td');
            peroids = _td.eq(0).html().replace(/(^\s*)|(\s*$)/g, "");
            peroids = parseInt(peroids);
            // 
            number = [];
            for(let i=1;i<21;i++)
            {
                number.push(parseInt(_td.eq(i).html().replace(/(^\s*)|(\s*$)/g, "")));
            }
            _r.unshift([peroids,number]);
        }
        if(_r.length<=0)
        {
            res.end('none');
            return;
        }
        for(let i in _r)
        {
            if(!time)
            {
                time = await timeChange();
            }else{
                time = dayjs(time).subtract(300, 'second').format('YYYY-MM-DD HH:mm:ss');
            }
            _rr[_r[i][0]] = [ time, _r[i][1] ];
        }
    } catch (error) {
        
    }
    //
    if(!_r || Object.keys(_rr).length<=0)
    {
        res.end('none');
        return;
    }
    //
    res.json(_rr);
})
// 
module.exports = {
    get_new_jnc
};