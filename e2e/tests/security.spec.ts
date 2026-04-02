import { test, expect } from '../fixtures/auth.fixture';
import { SecurityHelper } from '../helpers/securityHelpers';
import { UserRole } from '../../src/types';

test.describe('RNF Security (RNF001-RNF004)', () => {
  
  test('RNF001: Local environment supports HTTP (HTTPS enforcement check skipped but helper exists)', async ({ page, baseURL }) => {
    const security = new SecurityHelper(page);
    await security.checkHttpsEnforcement(baseURL || '');
  });

  test('RNF004: Admin can access Users page but Expert cannot', async ({ adminPage, expertPage, baseURL }) => {
    const adminSecurity = new SecurityHelper(adminPage);
    const expertSecurity = new SecurityHelper(expertPage);
    
    const usersUrl = `${baseURL}/admin/users`; // Adjusted based on typical patterns

    // Admin should enter
    await adminSecurity.verifyRoleAccess(UserRole.ADMIN, usersUrl, true);
    
    // Expert should be redirected or see error
    await expertSecurity.verifyRoleAccess(UserRole.EXPERT, usersUrl, false);
  });

  test('RNF004: Facilitator can create projects but Expert cannot', async ({ facilitadorPage, expertPage, baseURL }) => {
    const facilitadorSecurity = new SecurityHelper(facilitadorPage);
    const expertSecurity = new SecurityHelper(expertPage);
    
    const createProjectUrl = `${baseURL}/projects/new`;

    await facilitadorSecurity.verifyRoleAccess(UserRole.FACILITATOR, createProjectUrl, true);
    await expertSecurity.verifyRoleAccess(UserRole.EXPERT, createProjectUrl, false);
  });

  test('RNF003: Accessing dashboard requires authentication', async ({ page, baseURL }) => {
    const security = new SecurityHelper(page);
    await security.verifyProtectedRoute(`${baseURL}/dashboard`);
  });

  test('RNF003: Logout clears session', async ({ facilitadorPage, baseURL }) => {
    const security = new SecurityHelper(facilitadorPage);
    await facilitadorPage.goto(`${baseURL}/dashboard`);
    await security.validateLogout();
    
    // Verify we are at login and cannot go back to dashboard
    expect(facilitadorPage.url()).toContain('/login');
    await facilitadorPage.goto(`${baseURL}/dashboard`);
    expect(facilitadorPage.url()).toContain('/login');
  });
});
