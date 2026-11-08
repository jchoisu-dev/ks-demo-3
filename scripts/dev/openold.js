// 
const { 
    app,
    cheerio,
    get  
} = require('../../src/lib/http-client');
const { 
    contro_pub,
    //
} = require('../../src/lib/redis');
// 
const test = async() => 
{
    const _n = '<div class="numbs"><span class="numberl n4">01</span><span class="numberl n3">02</span><span class="numberl n2">03</span><span class="numberl n4">04</span><span class="numberl n3">11</span><span class="numberl n2">12</span><span class="numberl n4">17</span><span class="numberl n3">19</span><span class="numberl n2">28</span><span class="numberl n4">35</span><span class="numberl n3">40</span><span class="numberl n2">46</span><span class="numberl n4">51</span><span class="numberl n3">52</span><span class="numberl n2">62</span><span class="numberl n4">67</span><span class="numberl n3">70</span><span class="numberl n2">77</span><span class="numberl n1">78</span><span class="numberl n1">79</span></div>';
    const $ = cheerio.load(_n);
    const _trs = $('.numbs').find('.numberl');
    // console.log(_trs);
    // console.log(_trs.eq(1).html());
    let number = [];
    for(let i=0;i<20;i++)
    {
        // console.log(_trs.eq(i));
        const _t = _trs.eq(i).html();
        // console.log(_t);
        if(_t) number.push(parseInt(_t));
    }
    // const _n = '03,06,07,10,12,17,21,26,27,31,38,42,51,53,55,69,70,73,75,78';
    // const _n = '6,9,12,14,15,16,19,23,26,33,39,40,41,44,46,50,59,70,76,77';
    // // 
    // const _nn = _n.split(',');
    // let number = [];
    // for(let i=0;i<20;i++)
    // {
    //     if(_nn[i]) number.push(parseInt(_nn[i]));
    // }
    console.log(number, number.length);
    // await contro_pub('lottery_open_data', JSON.stringify(
    // {
    //     old: 1,
    //     category: 'ddbj', // ddbj
    //     peroids: '111001265',
    //     time: '2022-01-07 10:55:00',
    //     number
    // }));
    // 
    // await contro_pub('lottery_open_data', JSON.stringify(
    // {
    //     old: 1,
    //     category: 'jnc', // ddbj
    //     peroids: '618658',
    //     time: '2022-01-07 10:55:00',
    //     number
    // }));
}
test();