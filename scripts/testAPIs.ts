#!/usr/bin/env tsx

/**
 * API Tests
 * Team B - Ngày 3-4
 * 
 * Test tất cả Authentication & User Management APIs
 */

import APITester, { testData } from '../lib/apiTester.js';

const tester = new APITester('http://localhost:3000');

// Store tokens for authenticated tests
let studentToken = '';
let tutorToken = '';
let managementToken = '';
let studentId = '';

async function main() {
  console.log('\n🚀 Starting API Tests for Day 3-4\n');

  await tester.runTests([
    // ===== HEALTH CHECK =====
    {
      name: '1. Health Check',
      run: async () => tester.get('/health')
    },

    // ===== AUTHENTICATION TESTS =====
    {
      name: '2. Login as Student',
      run: async () => {
        const result = await tester.post('/api/auth/login', testData.student);
        if (result.success && result.data?.data?.token) {
          studentToken = result.data.data.token;
          studentId = result.data.data.user.id;
        }
        return result;
      }
    },

    {
      name: '3. Login as Tutor',
      run: async () => {
        const result = await tester.post('/api/auth/login', testData.tutor);
        if (result.success && result.data?.data?.token) {
          tutorToken = result.data.data.token;
        }
        return result;
      }
    },

    {
      name: '4. Login as Management',
      run: async () => {
        const result = await tester.post('/api/auth/login', testData.management);
        if (result.success && result.data?.data?.token) {
          managementToken = result.data.data.token;
        }
        return result;
      }
    },

    {
      name: '5. Login with Invalid Credentials',
      run: async () => {
        const result = await tester.post('/api/auth/login', testData.invalid);
        // This should fail (401)
        return {
          ...result,
          success: result.status === 401 // We expect this to fail
        };
      }
    },

    {
      name: '6. Get Current User (Student)',
      run: async () => tester.get('/api/auth/me', studentToken)
    },

    {
      name: '7. Refresh Token',
      run: async () => {
        const result = await tester.post('/api/auth/login', testData.student);
        if (result.success && result.data?.data?.refreshToken) {
          return tester.post('/api/auth/refresh-token', {
            refreshToken: result.data.data.refreshToken
          });
        }
        return result;
      }
    },

    // ===== USER MANAGEMENT TESTS =====
    {
      name: '8. List All Users (Authenticated)',
      run: async () => tester.get('/api/users?limit=5', studentToken)
    },

    {
      name: '9. List Users with Role Filter',
      run: async () => tester.get('/api/users?role=tutor&limit=5', studentToken)
    },

    {
      name: '10. Get User by ID',
      run: async () => tester.get(`/api/users/${studentId}`, studentToken)
    },

    {
      name: '11. Update Own Profile',
      run: async () => tester.put(
        `/api/users/${studentId}`,
        { interests: ['Toán học', 'Lập trình'] },
        studentToken
      )
    },

    {
      name: '12. Try to Update Another User (Should Fail)',
      run: async () => {
        const result = await tester.put(
          '/api/users/stu_another',
          { name: 'Hacked' },
          studentToken
        );
        // Should return 403
        return {
          ...result,
          success: result.status === 403 || result.status === 404
        };
      }
    },

    // ===== TUTOR TESTS =====
    {
      name: '13. List All Tutors (Public)',
      run: async () => tester.get('/api/tutors?limit=5')
    },

    {
      name: '14. List Tutors by Subject',
      run: async () => tester.get('/api/tutors?subject=Toán%20cao%20cấp&limit=5')
    },

    {
      name: '15. List Verified Tutors',
      run: async () => tester.get('/api/tutors?verified=true&limit=5')
    },

    {
      name: '16. Get Tutor by ID',
      run: async () => tester.get('/api/tutors/tut_tJIyWgMUEqgH')
    },

    {
      name: '17. Get Tutor Reviews',
      run: async () => tester.get('/api/tutors/tut_tJIyWgMUEqgH/reviews')
    },

    // ===== STUDENT TESTS =====
    {
      name: '18. Get Student by ID',
      run: async () => tester.get(`/api/students/${studentId}`, studentToken)
    },

    {
      name: '19. Get Student Sessions',
      run: async () => tester.get(`/api/students/${studentId}/sessions`, studentToken)
    },

    {
      name: '20. Get Student Sessions by Status',
      run: async () => tester.get(`/api/students/${studentId}/sessions?status=completed`, studentToken)
    },

    // ===== AUTHORIZATION TESTS =====
    {
      name: '21. Access Protected Route Without Token',
      run: async () => {
        const result = await tester.get('/api/auth/me');
        return {
          ...result,
          success: result.status === 401 // Should be unauthorized
        };
      }
    },

    {
      name: '22. Delete User (Management Only)',
      run: async () => {
        // First create a test user
        const createResult = await tester.post('/api/auth/register', {
          email: 'deleteme@hcmut.edu.vn',
          password: 'test123456',
          name: 'Delete Me',
          role: 'student'
        });

        if (createResult.success) {
          const userId = createResult.data.data.user.id;
          // Try to delete with management token
          return tester.delete(`/api/users/${userId}`, managementToken);
        }

        return createResult;
      }
    },

    {
      name: '23. Try to Delete User as Student (Should Fail)',
      run: async () => {
        const result = await tester.delete('/api/users/stu_another', studentToken);
        return {
          ...result,
          success: result.status === 403 // Should be forbidden
        };
      }
    },

    {
      name: '24. Logout',
      run: async () => tester.post('/api/auth/logout', {}, studentToken)
    }
  ]);

  console.log('\n✨ All tests completed!\n');
}

// Run tests
main().catch((error) => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});

