const express = require('express');
const Browser = require('zombie'); 
const dayjs = require('dayjs');
const request = require('request-promise');
const cheerio = require('cheerio');
const gameTime = require('../services/draw-schedule.service');
// 
const app = express();
const browser = new Browser();
// 
const utc = require('dayjs/plugin/utc'); // dependent on utc plugin
const timezone = require('dayjs/plugin/timezone');
const isBetween = require('dayjs/plugin/isBetween');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
// 
const urls = {
    jnd: 'https://www.playnow.com/services2/keno/nextdraw',
    jndgf: 'https://lotto.bclc.com/services2/keno/draw/latest',
    jndlist: 'https://www.playnow.com/services2/keno/draw/latest/200/0',
    //
    ddbj: 'https://www.taiwanlottery.com.tw/Lotto/BINGOBINGO/drawing.aspx',
    jnc: 'http://www.wclc.com/winning-numbers/keno.htm',
    //
    slfk: 'https://eklubkeno.etipos.sk/defaultnoflash.aspx',
    slfklist: 'https://eklubkeno.etipos.sk/Archive.aspx',
    elg: 'https://api2.oregonlottery.org/keno/MostRecentDraw',
    elglist: 'https://api2.oregonlottery.org/keno/ByDrawDate',
    au: 'https://api-info-act.keno.com.au/v2/games/kds?jurisdiction=ACT',
    btc: 'https://api.blockchain.info/haskoin-store/btc/mempool',
}
// 
const get = async(type, fix, other) => 
{
    try {
        let uri = urls[type]+''+(fix||'');
        // 
        // console.log(uri);
        //
        const _data = await request({
            method: 'get',
            json: true,
            uri,
            timeout: 4000,
            ...other
        });
        // console.log(_data);
        //
        if(_data) return _data;
        //
    } catch (error) {
        // console.log(error)
    }
    return false;
}
//
module.exports = {
    app,
    browser,
    cheerio,
    dayjs,
    request,
    get,
    ...gameTime
};