// Copy and paste this into Chrome console to see user persistence variables

// Check localStorage
console.log('=== LOCALSTORAGE ===');
console.log('user:', JSON.parse(localStorage.getItem('user') || 'null'));
console.log('accessToken:', localStorage.getItem('accessToken'));

// Check cookies
console.log('\n=== COOKIES ===');
document.cookie.split(';').forEach(cookie => {
  const [name, value] = cookie.trim().split('=');
  if (name === 'accessToken' || name === 'refreshToken') {
    console.log(`${name}: ${value ? 'exists' : 'missing'}`);
  }
});

// Check React Context (if available in window)
console.log('\n=== REACT CONTEXT (if exposed) ===');
if (window.__REACT_CONTEXT__) {
  console.log('Auth Context:', window.__REACT_CONTEXT__.auth);
  console.log('Domain Context:', window.__REACT_CONTEXT__.domain);
} else {
  console.log('React contexts not exposed to window');
}

// Summary
console.log('\n=== SUMMARY ===');
const user = JSON.parse(localStorage.getItem('user') || 'null');
if (user) {
  console.log('User ID:', user.id || user._id);
  console.log('Email:', user.email);
  console.log('Current Domain ID:', user.currentDomainId);
  console.log('Domains:', user.domains);
  console.log('Is Verified:', user.identity?.isVerified || false);
}