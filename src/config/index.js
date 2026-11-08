require('dotenv').config();
//
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redis_base = {
    port: parseInt(process.env.REDIS_PORT || '6379'),
    host: redisHost,
    password: process.env.REDIS_PASSWORD,
    // ElastiCache with in-transit encryption (required for AUTH) needs TLS.
    ...(process.env.REDIS_TLS === 'true' ? { tls: { servername: redisHost } } : {}),
};
//
module.exports = {
    redis_contro: {
        ...redis_base,
        db: 0,
    },
    redis_day: {
        ...redis_base,
        db: 1,
    },
}
