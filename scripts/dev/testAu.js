const {
    contro_get
} = require('../../src/lib/redis');
// 
const test = async ()=>
{
    const _perv = await contro_get('game_list_au');
    console.log(_perv);
}
// 
test();