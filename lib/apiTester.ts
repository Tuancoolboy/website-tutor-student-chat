/**
 * API Testing Utilities
 * Team B - Ngày 3-4
 * 
 * Utilities để test APIs một cách dễ dàng
 */

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  token?: string;
}

interface TestResult {
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  duration: number;
}

export class APITester {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Make API request
   */
  async request(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const headers = {
        ...this.defaultHeaders,
        ...options.headers
      };

      // Add authorization header if token provided
      if (options.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
      }

      const fetchOptions: RequestInit = {
        method: options.method || 'GET',
        headers
      };

      // Add body for POST/PUT requests
      if (options.body && (options.method === 'POST' || options.method === 'PUT')) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, fetchOptions);
      const data = await response.json();
      const duration = Date.now() - startTime;

      return {
        success: response.ok,
        status: response.status,
        data,
        duration
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        status: 0,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Test GET request
   */
  async get(endpoint: string, token?: string): Promise<TestResult> {
    return this.request(endpoint, { method: 'GET', token });
  }

  /**
   * Test POST request
   */
  async post(endpoint: string, body: any, token?: string): Promise<TestResult> {
    return this.request(endpoint, { method: 'POST', body, token });
  }

  /**
   * Test PUT request
   */
  async put(endpoint: string, body: any, token?: string): Promise<TestResult> {
    return this.request(endpoint, { method: 'PUT', body, token });
  }

  /**
   * Test DELETE request
   */
  async delete(endpoint: string, token?: string): Promise<TestResult> {
    return this.request(endpoint, { method: 'DELETE', token });
  }

  /**
   * Print test result
   */
  printResult(testName: string, result: TestResult) {
    const statusEmoji = result.success ? '✅' : '❌';
    const statusColor = result.success ? '\x1b[32m' : '\x1b[31m';
    const resetColor = '\x1b[0m';

    console.log(`\n${statusEmoji} ${statusColor}${testName}${resetColor}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Duration: ${result.duration}ms`);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else if (result.data) {
      console.log(`   Response:`, JSON.stringify(result.data, null, 2).substring(0, 200) + '...');
    }
  }

  /**
   * Run test suite
   */
  async runTests(tests: Array<{
    name: string;
    run: () => Promise<TestResult>;
  }>) {
    console.log('\n🧪 Running API Tests...\n');
    console.log('='.repeat(60));

    const results = {
      total: tests.length,
      passed: 0,
      failed: 0,
      duration: 0
    };

    for (const test of tests) {
      const result = await test.run();
      this.printResult(test.name, result);

      if (result.success) {
        results.passed++;
      } else {
        results.failed++;
      }
      results.duration += result.duration;
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Summary:');
    console.log(`   Total: ${results.total}`);
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   ⏱️  Total Duration: ${results.duration}ms`);
    console.log(`   Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`);

    return results;
  }
}

/**
 * Test data helpers
 */
export const testData = {
  // Valid login credentials
  student: {
    email: '2277229@hcmut.edu.vn',
    password: 'password123'
  },
  tutor: {
    email: 'nguyen.van.a@hcmut.edu.vn',
    password: 'password123'
  },
  management: {
    email: 'admin.1@hcmut.edu.vn',
    password: 'admin123'
  },

  // New user for registration test
  newStudent: {
    email: 'test.student@hcmut.edu.vn',
    password: 'testpass123',
    name: 'Test Student',
    role: 'student',
    major: 'Computer Science',
    year: 2
  },

  // Invalid credentials
  invalid: {
    email: 'invalid@hcmut.edu.vn',
    password: 'wrongpassword'
  }
};

export default APITester;

