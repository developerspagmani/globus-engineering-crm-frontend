import MockAdapter from 'axios-mock-adapter';
import api from '@/lib/axios';
import { mockUsers, mockCompanies } from '@/data/mockModules';

// Singleton instance of the mock adapter
let mock: MockAdapter;

export const setupMockApi = () => {
  if (mock) return mock; // Avoid double initialization

  mock = new MockAdapter(api, { delayResponse: 500 });
  console.log('Mock API initialized');

  // Login Mock
  mock.onPost('/auth/login').reply((config) => {
    try {
      const { email, password, company_id } = JSON.parse(config.data);
      const user = mockUsers.find(u => u.email === email && u.password === password);

      if (user) {
        // Validation: Ensure user belongs to the selected company
        if (user.role === 'super_admin' && company_id !== 'super_admin') {
          return [401, { message: 'Super Admin must select System / Super Admin as company' }];
        }
        
        if (user.role !== 'super_admin' && user.company_id !== company_id) {
          return [401, { message: 'User does not belong to the selected company' }];
        }

        const company = user.company_id ? mockCompanies.find(c => c.id === user.company_id) : null;
        
        return [200, {
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role, 
            company_id: user.company_id,
            permissions: user.permissions
          },
          company: company || null,
          token: 'mock-jwt-token-' + user.id
        }];
      } else {
        return [401, { message: 'Invalid email or password' }];
      }
    } catch (e) {
      return [400, { message: 'Malformed login request' }];
    }
  });

  // Signup Mock
  mock.onPost('/auth/signup').reply((config) => {
    try {
      const { name, email } = JSON.parse(config.data);
      return [200, {
        message: 'Account created successfully',
        user: { id: Date.now().toString(), name, email, role: 'user' }
      }];
    } catch (e) {
      return [400, { message: 'Malformed signup request' }];
    }
  });

  return mock;
};

// Auto-initialize if in browser context
if (typeof window !== 'undefined') {
  setupMockApi();
}

export default setupMockApi;
