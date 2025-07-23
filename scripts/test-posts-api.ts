import jwt from 'jsonwebtoken';

async function testPostsAPI() {
  try {
    // Generate a test token for our user
    const testUser = {
      userId: '677097a5b82b604e73866ade', // Jacques' user ID from DB
      id: '677097a5b82b604e73866ade',
      email: 'jacques.berg@forus.digital',
      name: 'Jacques van den Berg'
    };
    
    const accessToken = jwt.sign(
      testUser,
      process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      { expiresIn: '24h' }
    );
    console.log('🔑 Generated access token');
    
    // Test the posts endpoint
    console.log('\n📮 Testing /api/posts endpoint...');
    
    const response = await fetch('http://localhost:3001/api/posts?includeHidden=false&domain=maven-hub', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Success! Found ${data.posts.length} posts:`);
      
      data.posts.forEach((post: any) => {
        console.log(`  - ${post.masterPost.title} (${post.masterPost.domain})`);
      });
    } else {
      const error = await response.text();
      console.log(`❌ Error: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPostsAPI();