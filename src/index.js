const { get_new_jnd } = require('./scrapers/bclc-keno');
const { get_new_jnc } = require('./scrapers/wclc-keno');
const { get_new_ddbj } = require('./scrapers/taiwan-bingo');
const { get_new_au } = require('./scrapers/act-keno');
const { get_new_elg } = require('./scrapers/oregon-keno');
const { get_new_slfk } = require('./scrapers/slovakia-keno');
const { gameIn, dayIn } = require('./services/draw.service');
//
const {
    //
    contro_subscribe,
    contro_setex,
    //
    day_subscribe,
    day_del,
    //
    closeConnections,
    //
} = require('./lib/redis');
//
const gameCodes = [
    'jnd',
    'ddbj',
    'jnc',
    'au',
    'elg',
    'slfk'
];
//
const fetchLatestDrawByGame = {};
fetchLatestDrawByGame['jnd'] = get_new_jnd;
fetchLatestDrawByGame['jnc'] = get_new_jnc;
fetchLatestDrawByGame['ddbj'] = get_new_ddbj;
fetchLatestDrawByGame['elg'] = get_new_elg;
fetchLatestDrawByGame['au'] = get_new_au;
fetchLatestDrawByGame['slfk'] = get_new_slfk;
//
const clearDailyKeys = async() =>
{
    for(let index in gameCodes)
    {
        await day_del('day_'+gameCodes[index]);
    }
}
//
const fetchAndStoreAllGames = async() =>
{
    for(let index in gameCodes)
    {
        const gameCode = gameCodes[index];
        // console.log(gameCode);
        const latestDraw = await fetchLatestDrawByGame[gameCode]();
        // console.log(gameCode, latestDraw);
        if(latestDraw) await gameIn(gameCode, latestDraw);
    }
    await contro_setex('run_get_number', 5, 'uityiuyy');
}
const subscribeToPollTimer = async() =>
{
    contro_subscribe.subscribe(`__keyevent@0__:expired`, async() =>
    {
        contro_subscribe.on('message', async(channel, expiredKey) =>
        {
            // console.log(channel, expiredKey);
            //
            if(expiredKey=='run_get_number')
            {
                try {
                    await fetchAndStoreAllGames();
                } catch (error) {
                    console.error(new Date().toISOString(), 'run_get failed', error);
                }
            }
        })
    });
}
const subscribeToDailyExpiry = async()=>
{
    day_subscribe.subscribe(`__keyevent@1__:expired`, async() =>
    {
        day_subscribe.on('message', async(channel, expiredKey) =>
        {
            try {
                //
                await dayIn(expiredKey);
                //
            } catch (error) {
                console.error(new Date().toISOString(), 'dayIn failed', expiredKey, error);
            }
        })
    });
}
//
const main = async() =>
{
    await clearDailyKeys();
    await subscribeToDailyExpiry();
    await subscribeToPollTimer();
    await fetchAndStoreAllGames();
}
// ECS sends SIGTERM before stopping a task (deploys, scale-in); close Redis cleanly.
const SHUTDOWN_TIMEOUT_MS = 5000;
const shutdown = async(signal) =>
{
    console.log(new Date().toISOString(), `${signal} received, shutting down`);
    setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
    try {
        await closeConnections();
    } catch (error) {
        console.error(new Date().toISOString(), 'shutdown failed', error);
    }
    process.exit(0);
}
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
//
main();
