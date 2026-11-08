const { 
    app,
    dayjs,
    get  
} = require('../../src/lib/http-client');
//
const _getyearSummerDay = async() =>
{
    let _this = dayjs('2023-11-06 00:00:00').format('YYYY-MM-DD HH:mm:ss');
    _this = dayjs(_this).tz("Asia/Shanghai", true).utc().tz("America/Vancouver").format('YYYY-MM-DD HH:mm:ss');
    const _year = dayjs(_this).format('YYYY');
    //
    const _years = {
        2021: ['14 Mar 2021 02:00:00', '07 Nov 2021 01:59:59'],
        2022: ['13 Mar 2022 02:00:00', '06 Nov 2022 01:59:59'],
        2023: ['12 Mar 2023 02:00:00', '05 Nov 2023 01:59:59'],
        2024: ['10 Mar 2024 02:00:00', '03 Nov 2024 01:59:59'],
        2025: ['09 Mar 2025 02:00:00', '02 Nov 2025 01:59:59'],
        2026: ['08 Mar 2026 02:00:00', '01 Nov 2026 01:59:59'],
        2027: ['14 Mar 2027 02:00:00', '07 Nov 2027 01:59:59'],
        2028: ['12 Mar 2028 02:00:00', '05 Nov 2028 01:59:59'],
        2029: ['11 Mar 2029 02:00:00', '04 Nov 2029 01:59:59']
    }
    const yeay = _years[_year];
    const _start = yeay[0];
    const _end = yeay[1];
    // 
    return dayjs(_this).isBetween(_start, _end, null, '[]');
}
// 
const gamePeroidsTime = async(category) => 
{
    const winter ={
        jnd: [210, '20:00:00', 3600],
        ddbj: [300, '23:55:00', 25800],
        jnc: [300, '17:30:00', 7200],
        slfk: [180, '06:50:00', 18600],
        elg: [240, '19:56:00', 9360],
        au: [160, '00:00:00', 160],
        btc: [60, '00:00:00', 60]
    }
    //
    if(['jnd','jnc','elg','slfk'].find(v=>v==category) && await _getyearSummerDay())
    {
        const summers ={
            jnd: [210, '19:00:00', 3600],
            jnc: [300, '16:30:00', 7200],
            slfk: [180, '05:50:00', 18600],
            elg: [240, '18:56:00', 9360]
        }
        //
        return summers[category];
    }
    //
    return winter[category];
}
// 
const test = async() =>
{
    // const _t = await gamePeroidsTime('ddbj');
    // console.log(_t);
    // 
    const game_time = await gamePeroidsTime('jnd');
    let add_time = game_time[0];
    let stop = false;
    if(game_time[1] && ('18:00:00').indexOf(game_time[1])!==-1)
    {
        add_time = game_time[2];
        stop = true;
    }
    let time = await dayjs().add(add_time, 'second').format('YYYY-MM-DD HH:mm:ss');
    // time = timeLastChange(time);
    console.log( {
        time,
        next: parseInt(await dayjs(time).diff(dayjs(), 'second')),
        stop,
    })
};
// 
test();

