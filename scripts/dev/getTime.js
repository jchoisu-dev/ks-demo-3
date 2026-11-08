const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const tz = require('dayjs/plugin/timezone');
// 
dayjs.extend(utc);
dayjs.extend(tz);
//
const when = dayjs('2021-03-15T11:34:10.563Z'); // Midday GMT in summer
console.log(when);
console.log('Dayjs Shanghai: ' + dayjs(when).tz('Asia/Shanghai').format('HH:mm Z'));
console.log('Dayjs Canada: ' + dayjs(when).tz('America/Vancouver').format('HH:mm Z'));
// 
// =======================================================================================
const d = new Date();
// Get time zone offset for NY, USA
const getEstOffset = () => 
{
    const stdTimezoneOffset = () => {
        var jan = new Date(0, 1)
        var jul = new Date(6, 1)
        return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset())
    }
    // 
    var today = new Date();
    // console.log('today',today);
    // 
    const isDstObserved = (today) => {
        return today.getTimezoneOffset() < stdTimezoneOffset()
    }

    if (isDstObserved(today)) {
        console.log(-4)
    } else {
        console.log(-5)
    }
};
// convert to msec since Jan 1 1970
const localTime = d.getTime()

// obtain local UTC offset and convert to msec
const localOffset = d.getTimezoneOffset() * 60 * 1000

// obtain UTC time in msec
const utcTime = localTime + localOffset

// obtain and add destination's UTC time offset
const estOffset = getEstOffset()
const usa = utcTime + (60 * 60 * 1000 * estOffset)

// convert msec value to date string
const nd = new Date(usa)