const { Pool } = require('pg');

// Health check endpoint for monitoring
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

  const startTime = Date.now();
  const checks = {};
  let overallStatus = 'healthy';

  try {
    // Database health check
    checks.database = await checkDatabase();
    
    // API endpoints health check
    checks.api = await checkApiEndpoints();
    
    // External services health check
    checks.external_services = await checkExternalServices();
    
    // System resources health check
    checks.system = await checkSystemResources();
    
    // Application-specific health checks
    checks.application = await checkApplicationHealth();

    // Determine overall status
    const failedChecks = Object.values(checks).filter(check => check.status !== 'healthy');
    if (failedChecks.length > 0) {
      overallStatus = failedChecks.some(check => check.severity === 'critical') ? 'critical' : 'degraded';
    }

    const responseTime = Date.now() - startTime;

    return {
      statusCode: overallStatus === 'healthy' ? 200 : 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        response_time_ms: responseTime,
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        checks
      })
    };

  } catch (error) {
    console.error('Health check failed:', error);
    
    return {
      statusCode: 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'critical',
        timestamp: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
        error: error.message,
        checks
      })
    };
  }
};

async function checkDatabase() {
  const startTime = Date.now();
  
  try {
    const pool = new Pool({
      connectionString: process.env.NETLIFY_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    try {
      // Test basic connectivity
      await client.query('SELECT 1');
      
      // Check critical tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('platforms', 'digital_products', 'stock_sales')
      `);
      
      const expectedTables = ['platforms', 'digital_products', 'stock_sales'];
      const existingTables = tablesResult.rows.map(row => row.table_name);
      const missingTables = expectedTables.filter(table => !existingTables.includes(table));
      
      if (missingTables.length > 0) {
        return {
          status: 'degraded',
          severity: 'high',
          message: `Missing tables: ${missingTables.join(', ')}`,
          response_time_ms: Date.now() - startTime,
          details: {
            existing_tables: existingTables,
            missing_tables: missingTables
          }
        };
      }
      
      // Check database performance
      const performanceResult = await client.query(`
        SELECT 
          count(*) as total_connections,
          sum(case when state = 'active' then 1 else 0 end) as active_connections
        FROM pg_stat_activity
      `);
      
      const connectionStats = performanceResult.rows[0];
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        severity: responseTime < 1000 ? 'low' : 'medium',
        message: 'Database connection successful',
        response_time_ms: responseTime,
        details: {
          total_connections: parseInt(connectionStats.total_connections),
          active_connections: parseInt(connectionStats.active_connections),
          tables_verified: existingTables.length
        }
      };
      
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error) {
    return {
      status: 'critical',
      severity: 'critical',
      message: `Database connection failed: ${error.message}`,
      response_time_ms: Date.now() - startTime,
      details: {
        error_type: error.code || 'unknown',
        error_message: error.message
      }
    };
  }
}

async function checkApiEndpoints() {
  const startTime = Date.now();
  const baseUrl = process.env.URL || 'http://localhost:3000';
  
  const endpoints = [
    { path: '/.netlify/functions/api/platforms', method: 'GET', critical: true },
    { path: '/.netlify/functions/api/digital-products', method: 'GET', critical: true },
    { path: '/.netlify/functions/api/stock-sales', method: 'GET', critical: false },
    { path: '/.netlify/functions/api/settings', method: 'GET', critical: false }
  ];
  
  const results = [];
  let criticalFailures = 0;
  
  for (const endpoint of endpoints) {
    const endpointStartTime = Date.now();
    
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      const responseTime = Date.now() - endpointStartTime;
      const isHealthy = response.ok && responseTime < 2000;
      
      if (!isHealthy && endpoint.critical) {
        criticalFailures++;
      }
      
      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        status: isHealthy ? 'healthy' : 'degraded',
        http_status: response.status,
        response_time_ms: responseTime,
        critical: endpoint.critical
      });
      
    } catch (error) {
      if (endpoint.critical) {
        criticalFailures++;
      }
      
      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'critical',
        error: error.message,
        response_time_ms: Date.now() - endpointStartTime,
        critical: endpoint.critical
      });
    }
  }
  
  const overallStatus = criticalFailures > 0 ? 'critical' : 
                      results.some(r => r.status === 'degraded') ? 'degraded' : 'healthy';
  
  return {
    status: overallStatus,
    severity: criticalFailures > 0 ? 'critical' : 'low',
    message: `API endpoints check completed`,
    response_time_ms: Date.now() - startTime,
    details: {
      total_endpoints: endpoints.length,
      healthy_endpoints: results.filter(r => r.status === 'healthy').length,
      degraded_endpoints: results.filter(r => r.status === 'degraded').length,
      critical_failures: criticalFailures,
      endpoints: results
    }
  };
}

async function checkExternalServices() {
  const startTime = Date.now();
  const services = [];
  
  // Check if we can resolve DNS
  try {
    await fetch('https://www.google.com', { 
      method: 'HEAD', 
      timeout: 3000 
    });
    services.push({
      service: 'internet_connectivity',
      status: 'healthy',
      message: 'Internet connectivity verified'
    });
  } catch (error) {
    services.push({
      service: 'internet_connectivity',
      status: 'critical',
      message: `Internet connectivity failed: ${error.message}`
    });
  }
  
  // Add other external service checks here
  // (e.g., payment processors, email services, etc.)
  
  const criticalFailures = services.filter(s => s.status === 'critical').length;
  const overallStatus = criticalFailures > 0 ? 'critical' : 'healthy';
  
  return {
    status: overallStatus,
    severity: criticalFailures > 0 ? 'critical' : 'low',
    message: 'External services check completed',
    response_time_ms: Date.now() - startTime,
    details: {
      services_checked: services.length,
      services
    }
  };
}

async function checkSystemResources() {
  const startTime = Date.now();
  
  try {
    // Memory usage check
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };
    
    // CPU usage approximation (for serverless, this is limited)
    const cpuUsage = process.cpuUsage();
    
    // Check if memory usage is concerning
    const memoryThreshold = 512; // MB
    const isMemoryHealthy = memoryUsageMB.heapUsed < memoryThreshold;
    
    return {
      status: isMemoryHealthy ? 'healthy' : 'degraded',
      severity: isMemoryHealthy ? 'low' : 'medium',
      message: 'System resources check completed',
      response_time_ms: Date.now() - startTime,
      details: {
        memory_usage_mb: memoryUsageMB,
        cpu_usage_microseconds: cpuUsage,
        uptime_seconds: Math.round(process.uptime()),
        node_version: process.version,
        platform: process.platform
      }
    };
    
  } catch (error) {
    return {
      status: 'degraded',
      severity: 'medium',
      message: `System resources check failed: ${error.message}`,
      response_time_ms: Date.now() - startTime
    };
  }
}

async function checkApplicationHealth() {
  const startTime = Date.now();
  const checks = [];
  
  try {
    // Check environment variables
    const requiredEnvVars = ['NETLIFY_DATABASE_URL'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    checks.push({
      check: 'environment_variables',
      status: missingEnvVars.length === 0 ? 'healthy' : 'critical',
      details: {
        required: requiredEnvVars.length,
        missing: missingEnvVars
      }
    });
    
    // Check application configuration
    checks.push({
      check: 'configuration',
      status: 'healthy',
      details: {
        node_env: process.env.NODE_ENV || 'not_set',
        app_version: process.env.APP_VERSION || 'not_set'
      }
    });
    
    const criticalFailures = checks.filter(c => c.status === 'critical').length;
    const overallStatus = criticalFailures > 0 ? 'critical' : 'healthy';
    
    return {
      status: overallStatus,
      severity: criticalFailures > 0 ? 'critical' : 'low',
      message: 'Application health check completed',
      response_time_ms: Date.now() - startTime,
      details: {
        checks_performed: checks.length,
        checks
      }
    };
    
  } catch (error) {
    return {
      status: 'degraded',
      severity: 'medium',
      message: `Application health check failed: ${error.message}`,
      response_time_ms: Date.now() - startTime
    };
  }
}
