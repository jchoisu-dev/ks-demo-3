// 
const { 
    app,
    dayjs,
    cheerio,
    timeLastChange,
    get  
} = require('../lib/http-client');
// 
const {
    contro_get,
    contro_set
} = require('../lib/redis');
// 
const timeCheck = async(time) => 
{
    let _t = time.split(' ');
    let _t1 = _t[0].split('.');
    return _t1[2]+'-'+_t1[1]+'-'+_t1[0]+' '+_t[1]+':00';
}
const timeChange = async() => 
{
    let _minute = dayjs().format('mm');
    let _minuteX = _minute.split('');
    _minuteX[1] = _minuteX[1]<5 ? 0 : 5;
    return await dayjs().format('YYYY-MM-DD HH:')+_minuteX.join('')+':00';
};
// Change this when open lottery data is not corect. Use the next period id, time of the chosen game which has not opened yet (SEE LINE 62 to 67)
const _default_peroids = 6149942;
let _is_test = 1;
const get_new_slfk = async() =>
{
    // let d = await get('slfk');
    // // 
    // if(!d) return '';
    // // 
    // const $ = cheerio.load(d);
    // // let next = await timeCheck($('#_ctl0_ContentPlaceHolder_lblKenoNextDrawValue').text());
    // let time = await timeChange();
    // // 
    // let number = [];
    // let _this_span = $('#_ctl0_ContentPlaceHolder_tblLastDraw').find('tr').eq(1).find('td').eq(1).find('span');
    // // 
    // if(!_this_span.eq(0).text()) return '';
    // // 
    // for(let i=0;i<20;i++)
    // {
    //     number.push(parseInt(_this_span.eq(i).text().replace(/(^\s*)|(\s*$)/g, "")))
    // }
    // number.sort((a,b)=>{ return a-b; });
    // // 
    // // console.log(time, next);
    // // 
    // // next = await timeLastChange(dayjs(next).add(6,'hour').format('YYYY-MM-DD HH:mm:ss'));
    // // time = await timeLastChange(dayjs(time).add(6,'hour').format('YYYY-MM-DD HH:mm:ss'));
    // // 
    // let peroids;
    // const _perv = await contro_get('game_list_slfk');
    // if(_perv && (_perv.number).join(',')==number.join(',')) return '';
    // // 
    // if(_perv && _perv.peroids)
    // {
    //     peroids = parseInt(_perv.peroids)+1
    // }else{
    //     peroids = _default_peroids;
    // }
    // if(_is_test==1)
    // {
    //     peroids = _default_peroids;
    //     _is_test = 2;
    // }
    // 
    let d = await get('slfk');
    // 
    if(!d) return '';
    // 
    const $ = cheerio.load(d);
    // let next = $('#_ctl0_ContentPlaceHolder_lblKenoNextDrawValue').text();
    let time = $('#_ctl0_ContentPlaceHolder_lblLastDrawTimeValue').text();
    if(!time) return '';
    // 
    let number = [];
    let _this_span = $('#_ctl0_ContentPlaceHolder_tblLastDraw').find('tr').eq(1).find('td').eq(1).find('span');
    // 
    if(!_this_span.eq(0).text()) return '';
    // 
    for(let i=0;i<20;i++)
    {
        number.push(parseInt(_this_span.eq(i).text().replace(/(^\s*)|(\s*$)/g, "")))
    }
    number.sort((a,b)=>{ return a-b; });
    // 
    // time = dayjs(time).add(6,'hour').format('YYYY-MM-DD HH:mm:ss');
    time = await timeCheck(time);
    time = dayjs(time).add(6,'hour').format('YYYY-MM-DD HH:mm:ss');
    // 
    let peroids;
    const _perv = await contro_get('game_list_slfk');
    if(_perv && (_perv.number).join(',')==number.join(',')) return '';
    // 
    if(_perv && _perv.peroids)
    {
        peroids = parseInt(_perv.peroids)+1
    }else{
        peroids = _default_peroids;
    }
    // 
    if(number.length<20) return;
    // 
    return {
        peroids,
        time,
        number,
        // next
    }
}

app.get('/slfk_list', async(req, res) =>
{
    let d = await get('slfklist');
    // 
    let list = {};
    try {
        const $ = cheerio.load(d);
        const _this_times = $('.closest');
        // 
        for(let i in _this_times)
        {
            let _time = $('.closest').eq(i).find('span').eq(1).text();
            // 
            _time = dayjs().format('YYYY-MM-DD')+' '+_time+':00';
            _time = dayjs(_time).add(6,'hour').format('YYYY-MM-DD HH:mm:ss');
            // 
            let _number = [];
            let _nums = $('.numbers').eq(i).find('span');
            let peroids = dayjs(_time).format('YYMMDDHHmm');
            for(let j in _nums)
            {
                const _num = parseInt($('.numbers').eq(i).find('span').eq(j).text());
                if(_num) _number.push(_num);
            }
            if(_time&&_number.length>0) list[peroids] = [_time, _number];
        }
    } catch (error) {
        
    }
    // 
    if(Object.keys(list).length<=0)
    {
        res.end('none');
        return;
    }
    res.json(list);
});
// 
module.exports = {
    get_new_slfk
};