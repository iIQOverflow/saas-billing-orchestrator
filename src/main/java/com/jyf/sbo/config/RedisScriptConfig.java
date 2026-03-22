package com.jyf.sbo.config;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.script.DefaultRedisScript;

@Configuration
public class RedisScriptConfig {

    @Bean
    public DefaultRedisScript<Long> consumeQuotaScript() {
        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setResultType(Long.class);
        script.setScriptText(String.join("\n", List.of(
            "local current = redis.call('GET', KEYS[1])",
            "if (not current) then return -2 end",
            "if (tonumber(current) <= 0) then return -1 end",
            "local updated = redis.call('DECR', KEYS[1])",
            "redis.call('SADD', KEYS[2], ARGV[1])",
            "return updated"
        )));
        return script;
    }
}
