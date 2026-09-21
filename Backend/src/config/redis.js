const Redis = require("ioredis");

const redisHost = process.env.REDIS_HOST || (process.env.NODE_ENV === "production" ? "redis" : "127.0.0.1");
const redisPort = Number(process.env.REDIS_PORT || 6379);

const redis = new Redis({
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
});

redis.on("connect", () => {
    console.log("Redis connected successfully");
});

redis.on("error", (err) => {
    console.error("Redis error:", err.message);
});

module.exports = redis;