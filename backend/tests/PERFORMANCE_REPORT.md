# Performance Comparison Report

**Test Date:** December 01, 2025

## Test Configuration

- **Concurrent Users:** 100 threads
- **Ramp-up Time:** 10 seconds
- **Test Duration:** 60 seconds
- **Target:** http://localhost:5001

## Performance Metrics

| Configuration | Avg Response (ms) | Throughput (req/s) | Error Rate (%) | P95 Latency (ms) |
|--------------|-------------------|-------------------|----------------|------------------|
| Base (B) | 1250 | 45 | 8.5 | 2800 |
| B + Redis (S) | 380 | 185 | 2.1 | 950 |
| B + S + Kafka (K) | 285 | 290 | 0.8 | 620 |
| B + S + K + Other | 165 | 485 | 0.3 | 380 |

## Analysis

### Redis Caching Impact (B → B+S)
- **70% reduction** in average response time
- **311% increase** in throughput
- Eliminated redundant file I/O operations

### Kafka Messaging Impact (B+S → B+S+K)
- **25% additional reduction** in response time
- **57% increase** in throughput
- Enabled async processing and non-blocking operations

### Additional Optimizations (B+S+K → B+S+K+Other)
- **42% further reduction** in response time
- **67% increase** in throughput
- Techniques: Connection pooling, compression, indexes, batch processing

## Key Findings

1. **Redis caching** provides the single biggest performance improvement
2. **Kafka** enables horizontal scaling and fault tolerance
3. **Combined optimizations** achieve **87% performance improvement**
4. System can handle **485 requests/second** with all optimizations

