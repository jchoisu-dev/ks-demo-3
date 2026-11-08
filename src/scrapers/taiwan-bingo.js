// 
const { 
    app,
    cheerio,
    get  
} = require('../lib/http-client');
const dayjs = require('dayjs');
const timeChange= async () => 
{
    let _minute = dayjs().format('mm');
    let _minuteX = _minute.split('');
    _minuteX[1] = _minuteX[1]<5 ? 0 : 5;
    return await dayjs().format('YYYY-MM-DD HH:')+_minuteX.join('')+':00';
};

const get_new_ddbj = async() => 
{
    let d = await get('ddbj');
    if(!d) return '';
    let _r = [];
    let peroids;
    let time;
    let number = [];
    try {
        const $ = cheerio.load(d);
        const _tr = $('.tableFull').last().find('tr').eq(3);
        peroids = _tr.find('td').eq(0).html().replace(/(^\s*)|(\s*$)/g, "");
        let _number = _tr.find('td').eq(1).html().replace(/(^\s*)|(\s*$)/g, "").split(' ');
        // 
        peroids = parseInt(peroids);
        // 
        for(let i in _number)
        {
            if(_number[i]) number.push(parseInt(_number[i]));
        }
        time = await timeChange();
    } catch (error) {
        
    }
    // 
    if(!_r || !peroids || !time || !number) return '';
    // 
    return {
        peroids,
        time,
        number
    }
};

app.get('/ddbj_list', async(req, res) => 
{
    let d = await get('ddbj');
    if(!d)
    {
        res.end('none');
        return;
    }
    let _r = [];
    let time;
    let _rr = {};
    try {
        const $ = cheerio.load(d);
        const _trs = $('.tableFull').last().find('tr');
        for(let j=3;j<_trs.length;j++)
        {
            const _tr = $('.tableFull').last().find('tr').eq(j);
            let peroids = _tr.find('td').eq(0).html().replace(/(^\s*)|(\s*$)/g, "");
            let _number = _tr.find('td').eq(1).html().replace(/(^\s*)|(\s*$)/g, "").split(' ');
            // 
            peroids = parseInt(peroids);
            // 
            if(!time)
            {
                time = await timeChange();
            }else{
                time = dayjs(time).subtract(300, 'second').format('YYYY-MM-DD HH:mm:ss');
            }
            // 
            let number = [];
            for(let i in _number)
            {
                if(_number[i]) number.push(parseInt(_number[i]));
            }
            _rr[peroids] = [ time, number ];
        }
    } catch (error) {
        
    }
    //
    if(!_rr || Object.keys(_rr).length<=0)
    {
        res.end('none');
        return;
    }
    //
    res.json(_rr);
})
//
module.exports = {
    get_new_ddbj
};