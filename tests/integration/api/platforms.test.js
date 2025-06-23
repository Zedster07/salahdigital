import { server } from '../../mocks/server';
import { rest } from 'msw';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

describe('Platforms API Integration', () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('GET /api/platforms', () => {
    test('should fetch all platforms', async () => {
      const response = await fetch(`${API_BASE}/platforms`);
      const platforms = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(Array.isArray(platforms)).toBe(true);
      expect(platforms.length).toBeGreaterThan(0);
      
      // Verify platform structure
      const platform = platforms[0];
      expect(platform).toHaveProperty('id');
      expect(platform).toHaveProperty('name');
      expect(platform).toHaveProperty('creditBalance');
      expect(platform).toHaveProperty('isActive');
      expect(platform.creditBalance).toHaveValidCurrency();
    });

    test('should handle API errors gracefully', async () => {
      // Override handler to return error
      server.use(
        rest.get(`${API_BASE}/platforms`, (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
        })
      );

      const response = await fetch(`${API_BASE}/platforms`);
      const error = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(error).toHaveProperty('error');
    });
  });

  describe('GET /api/platforms/:id', () => {
    test('should fetch platform by ID', async () => {
      const response = await fetch(`${API_BASE}/platforms/platform-1`);
      const platform = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(platform).toHaveProperty('id', 'platform-1');
      expect(platform).toHaveProperty('name');
      expect(platform).toHaveProperty('creditBalance');
    });

    test('should return 404 for non-existent platform', async () => {
      const response = await fetch(`${API_BASE}/platforms/non-existent`);
      const error = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(error).toHaveProperty('error', 'Platform not found');
    });
  });

  describe('POST /api/platforms', () => {
    test('should create new platform', async () => {
      const newPlatform = {
        name: 'Test Platform',
        description: 'Test platform description',
        contactName: 'Test Contact',
        contactEmail: 'test@platform.com',
        contactPhone: '+1-555-0123',
        creditBalance: 1000,
        lowBalanceThreshold: 100,
        isActive: true
      };

      const response = await fetch(`${API_BASE}/platforms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPlatform)
      });

      const createdPlatform = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);
      expect(createdPlatform).toHaveProperty('id');
      expect(createdPlatform.name).toBe(newPlatform.name);
      expect(createdPlatform.creditBalance).toBe(newPlatform.creditBalance);
      expect(createdPlatform).toHaveProperty('createdAt');
      expect(createdPlatform).toHaveProperty('updatedAt');
    });

    test('should validate required fields', async () => {
      const invalidPlatform = {
        description: 'Missing required fields'
      };

      const response = await fetch(`${API_BASE}/platforms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidPlatform)
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/platforms/:id', () => {
    test('should update existing platform', async () => {
      const updates = {
        name: 'Updated Platform Name',
        creditBalance: 2000,
        lowBalanceThreshold: 200
      };

      const response = await fetch(`${API_BASE}/platforms/platform-1`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const updatedPlatform = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(updatedPlatform.name).toBe(updates.name);
      expect(updatedPlatform.creditBalance).toBe(updates.creditBalance);
      expect(updatedPlatform).toHaveProperty('updatedAt');
    });

    test('should return 404 for non-existent platform', async () => {
      const response = await fetch(`${API_BASE}/platforms/non-existent`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'Updated' })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/platforms/:id', () => {
    test('should delete platform', async () => {
      const response = await fetch(`${API_BASE}/platforms/platform-1`, {
        method: 'DELETE'
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(204);

      // Verify platform is deleted
      const getResponse = await fetch(`${API_BASE}/platforms/platform-1`);
      expect(getResponse.ok).toBe(false);
      expect(getResponse.status).toBe(404);
    });

    test('should return 404 for non-existent platform', async () => {
      const response = await fetch(`${API_BASE}/platforms/non-existent`, {
        method: 'DELETE'
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe('Platform Credit Management', () => {
    describe('POST /api/platforms/:id/credits', () => {
      test('should add credits to platform', async () => {
        const creditData = {
          amount: 500,
          reference: 'TEST-CREDIT-001',
          description: 'Test credit addition'
        };

        const response = await fetch(`${API_BASE}/platforms/platform-1/credits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(creditData)
        });

        const result = await response.json();

        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('platform');
        expect(result).toHaveProperty('movement');
        
        expect(result.platform.creditBalance).toBeGreaterThan(1500); // Original + added
        expect(result.movement.amount).toBe(creditData.amount);
        expect(result.movement.reference).toBe(creditData.reference);
        expect(result.movement.type).toBe('credit_added');
      });

      test('should return 404 for non-existent platform', async () => {
        const response = await fetch(`${API_BASE}/platforms/non-existent/credits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ amount: 100 })
        });

        expect(response.ok).toBe(false);
        expect(response.status).toBe(404);
      });

      test('should validate credit amount', async () => {
        const response = await fetch(`${API_BASE}/platforms/platform-1/credits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ amount: -100 }) // Negative amount
        });

        expect(response.ok).toBe(false);
        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/platforms/:id/credits/movements', () => {
      test('should fetch credit movements for platform', async () => {
        const response = await fetch(`${API_BASE}/platforms/platform-1/credits/movements`);
        const movements = await response.json();

        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
        expect(Array.isArray(movements)).toBe(true);
        
        if (movements.length > 0) {
          const movement = movements[0];
          expect(movement).toHaveProperty('id');
          expect(movement).toHaveProperty('platformId', 'platform-1');
          expect(movement).toHaveProperty('type');
          expect(movement).toHaveProperty('amount');
          expect(movement).toHaveProperty('createdAt');
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      // Simulate network error
      server.use(
        rest.get(`${API_BASE}/platforms`, (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );

      try {
        await fetch(`${API_BASE}/platforms`);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle malformed JSON', async () => {
      server.use(
        rest.get(`${API_BASE}/platforms`, (req, res, ctx) => {
          return res(ctx.status(200), ctx.text('invalid json'));
        })
      );

      const response = await fetch(`${API_BASE}/platforms`);
      
      try {
        await response.json();
      } catch (error) {
        expect(error).toBeInstanceOf(SyntaxError);
      }
    });

    test('should handle timeout', async () => {
      server.use(
        rest.get(`${API_BASE}/platforms`, (req, res, ctx) => {
          return res(ctx.delay(10000)); // 10 second delay
        })
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout

      try {
        await fetch(`${API_BASE}/platforms`, {
          signal: controller.signal
        });
      } catch (error) {
        expect(error.name).toBe('AbortError');
      } finally {
        clearTimeout(timeoutId);
      }
    });
  });

  describe('Data Validation', () => {
    test('should validate platform data structure', async () => {
      const response = await fetch(`${API_BASE}/platforms`);
      const platforms = await response.json();

      platforms.forEach(platform => {
        // Required fields
        expect(platform).toHaveProperty('id');
        expect(platform).toHaveProperty('name');
        expect(platform).toHaveProperty('creditBalance');
        expect(platform).toHaveProperty('isActive');
        expect(platform).toHaveProperty('createdAt');

        // Data types
        expect(typeof platform.id).toBe('string');
        expect(typeof platform.name).toBe('string');
        expect(typeof platform.creditBalance).toBe('number');
        expect(typeof platform.isActive).toBe('boolean');
        expect(platform.creditBalance).toBeGreaterThanOrEqual(0);

        // Date validation
        expect(new Date(platform.createdAt)).toBeValidDate();
        if (platform.updatedAt) {
          expect(new Date(platform.updatedAt)).toBeValidDate();
        }
      });
    });

    test('should validate credit movement data structure', async () => {
      const response = await fetch(`${API_BASE}/platforms/platform-1/credits/movements`);
      const movements = await response.json();

      movements.forEach(movement => {
        expect(movement).toHaveProperty('id');
        expect(movement).toHaveProperty('platformId');
        expect(movement).toHaveProperty('type');
        expect(movement).toHaveProperty('amount');
        expect(movement).toHaveProperty('createdAt');

        expect(typeof movement.id).toBe('string');
        expect(typeof movement.platformId).toBe('string');
        expect(typeof movement.type).toBe('string');
        expect(typeof movement.amount).toBe('number');
        expect(new Date(movement.createdAt)).toBeValidDate();
      });
    });
  });

  describe('Performance', () => {
    test('should respond within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE}/platforms`);
      await response.json();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () => 
        fetch(`${API_BASE}/platforms`)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
      });
    });
  });
});
