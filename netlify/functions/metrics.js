const { Pool } = require('pg');

// Metrics collection endpoint
exports.handler = async (event, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    if (event.httpMethod === 'POST') {
      return await handleMetricsSubmission(event);
    } else if (event.httpMethod === 'GET') {
      return await handleMetricsQuery(event);
    } else {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

async function handleMetricsSubmission(event) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  try {
    const data = JSON.parse(event.body);
    const { metrics } = data;

    if (!metrics || !Array.isArray(metrics)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid metrics data' })
      };
    }

    // Store metrics in database
    await storeMetrics(metrics);

    // Process real-time alerts
    await processAlerts(metrics);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        metrics_processed: metrics.length,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error processing metrics:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to process metrics',
        message: error.message
      })
    };
  }
}

async function handleMetricsQuery(event) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  try {
    const queryParams = event.queryStringParameters || {};
    const {
      metric_name,
      start_time,
      end_time,
      aggregation = 'avg',
      interval = '1h',
      tags
    } = queryParams;

    const metrics = await queryMetrics({
      metricName: metric_name,
      startTime: start_time,
      endTime: end_time,
      aggregation,
      interval,
      tags: tags ? JSON.parse(tags) : {}
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        metrics,
        query: {
          metric_name,
          start_time,
          end_time,
          aggregation,
          interval
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error querying metrics:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to query metrics',
        message: error.message
      })
    };
  }
}

async function storeMetrics(metrics) {
  const pool = new Pool({
    connectionString: process.env.NETLIFY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    // Create metrics table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS metrics (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        value DECIMAL NOT NULL,
        timestamp BIGINT NOT NULL,
        tags JSONB DEFAULT '{}',
        unit VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (name, timestamp),
        INDEX USING GIN (tags)
      )
    `);

    // Insert metrics in batch
    const values = metrics.map(metric => [
      metric.name,
      metric.value,
      metric.timestamp,
      JSON.stringify(metric.tags || {}),
      metric.unit || null
    ]);

    if (values.length > 0) {
      const placeholders = values.map((_, index) => {
        const base = index * 5;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
      }).join(', ');

      const flatValues = values.flat();

      await client.query(`
        INSERT INTO metrics (name, value, timestamp, tags, unit)
        VALUES ${placeholders}
      `, flatValues);
    }

    // Clean up old metrics (keep last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    await client.query(
      'DELETE FROM metrics WHERE timestamp < $1',
      [thirtyDaysAgo]
    );

  } finally {
    client.release();
    await pool.end();
  }
}

async function queryMetrics(options) {
  const {
    metricName,
    startTime,
    endTime,
    aggregation,
    interval,
    tags
  } = options;

  const pool = new Pool({
    connectionString: process.env.NETLIFY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    let query = `
      SELECT 
        name,
        ${getAggregationFunction(aggregation)}(value) as value,
        ${getTimeGrouping(interval)} as time_bucket,
        tags
      FROM metrics 
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Add metric name filter
    if (metricName) {
      query += ` AND name = $${paramIndex}`;
      params.push(metricName);
      paramIndex++;
    }

    // Add time range filters
    if (startTime) {
      query += ` AND timestamp >= $${paramIndex}`;
      params.push(parseInt(startTime));
      paramIndex++;
    }

    if (endTime) {
      query += ` AND timestamp <= $${paramIndex}`;
      params.push(parseInt(endTime));
      paramIndex++;
    }

    // Add tag filters
    if (tags && Object.keys(tags).length > 0) {
      for (const [key, value] of Object.entries(tags)) {
        query += ` AND tags->>'${key}' = $${paramIndex}`;
        params.push(value);
        paramIndex++;
      }
    }

    query += `
      GROUP BY name, time_bucket, tags
      ORDER BY time_bucket ASC
    `;

    const result = await client.query(query, params);
    return result.rows;

  } finally {
    client.release();
    await pool.end();
  }
}

function getAggregationFunction(aggregation) {
  switch (aggregation) {
    case 'sum': return 'SUM';
    case 'count': return 'COUNT';
    case 'min': return 'MIN';
    case 'max': return 'MAX';
    case 'avg':
    default: return 'AVG';
  }
}

function getTimeGrouping(interval) {
  switch (interval) {
    case '1m': return "date_trunc('minute', to_timestamp(timestamp / 1000))";
    case '5m': return "date_trunc('minute', to_timestamp(timestamp / 1000)) - interval '1 minute' * (extract(minute from to_timestamp(timestamp / 1000))::int % 5)";
    case '15m': return "date_trunc('minute', to_timestamp(timestamp / 1000)) - interval '1 minute' * (extract(minute from to_timestamp(timestamp / 1000))::int % 15)";
    case '1h': return "date_trunc('hour', to_timestamp(timestamp / 1000))";
    case '1d': return "date_trunc('day', to_timestamp(timestamp / 1000))";
    default: return "date_trunc('hour', to_timestamp(timestamp / 1000))";
  }
}

async function processAlerts(metrics) {
  // Alert rules (in production, these would be stored in database)
  const alertRules = [
    {
      id: 'high_error_rate',
      metric: 'error_count',
      condition: 'sum',
      threshold: 10,
      timeWindow: 300000, // 5 minutes
      severity: 'critical'
    },
    {
      id: 'slow_api_response',
      metric: 'api_response_time',
      condition: 'avg',
      threshold: 2000, // 2 seconds
      timeWindow: 600000, // 10 minutes
      severity: 'warning'
    },
    {
      id: 'high_memory_usage',
      metric: 'memory_usage_percent',
      condition: 'avg',
      threshold: 80,
      timeWindow: 300000, // 5 minutes
      severity: 'warning'
    }
  ];

  const now = Date.now();
  
  for (const rule of alertRules) {
    const relevantMetrics = metrics.filter(metric => 
      metric.name === rule.metric &&
      metric.timestamp >= (now - rule.timeWindow)
    );

    if (relevantMetrics.length === 0) continue;

    let value;
    switch (rule.condition) {
      case 'sum':
        value = relevantMetrics.reduce((sum, m) => sum + m.value, 0);
        break;
      case 'avg':
        value = relevantMetrics.reduce((sum, m) => sum + m.value, 0) / relevantMetrics.length;
        break;
      case 'max':
        value = Math.max(...relevantMetrics.map(m => m.value));
        break;
      case 'min':
        value = Math.min(...relevantMetrics.map(m => m.value));
        break;
      default:
        continue;
    }

    if (value > rule.threshold) {
      await triggerAlert({
        ruleId: rule.id,
        metric: rule.metric,
        value,
        threshold: rule.threshold,
        severity: rule.severity,
        timestamp: now
      });
    }
  }
}

async function triggerAlert(alert) {
  console.log('ALERT TRIGGERED:', alert);
  
  // In production, this would:
  // 1. Send notifications (email, Slack, SMS)
  // 2. Create incident tickets
  // 3. Trigger automated responses
  // 4. Log to alerting system
  
  // For now, just log the alert
  const alertMessage = `
    🚨 ALERT: ${alert.ruleId}
    Metric: ${alert.metric}
    Current Value: ${alert.value}
    Threshold: ${alert.threshold}
    Severity: ${alert.severity}
    Time: ${new Date(alert.timestamp).toISOString()}
  `;
  
  console.error(alertMessage);
  
  // Store alert in database for tracking
  try {
    await storeAlert(alert);
  } catch (error) {
    console.error('Failed to store alert:', error);
  }
}

async function storeAlert(alert) {
  const pool = new Pool({
    connectionString: process.env.NETLIFY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    // Create alerts table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        rule_id VARCHAR(255) NOT NULL,
        metric VARCHAR(255) NOT NULL,
        value DECIMAL NOT NULL,
        threshold DECIMAL NOT NULL,
        severity VARCHAR(50) NOT NULL,
        timestamp BIGINT NOT NULL,
        resolved_at BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      INSERT INTO alerts (rule_id, metric, value, threshold, severity, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      alert.ruleId,
      alert.metric,
      alert.value,
      alert.threshold,
      alert.severity,
      alert.timestamp
    ]);

  } finally {
    client.release();
    await pool.end();
  }
}
