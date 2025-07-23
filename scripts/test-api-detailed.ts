import jwt from 'jsonwebtoken';

async function testAPIDetailed() {
  try {
    // The actual user ID from the database
    const userId = '68757f927d23d26a711a406f';
    
    // Create token with exact structure expected by the API
    const tokenPayload = {
      userId: userId,
      id: userId,
      email: 'jacques.berg@forus.digital',
      name: 'Jacques van den Berg'
    };
    
    const accessToken = jwt.sign(
      tokenPayload,
      'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '24h' }
    );
    
    console.log('🔑 Token payload:', tokenPayload);
    console.log('🎫 Access token generated');
    
    // Decode to verify
    const decoded = jwt.decode(accessToken);
    console.log('🔍 Decoded token:', decoded);
    
    // Test the posts endpoint
    console.log('\n📮 Testing /api/posts endpoint...');
    
    const url = 'http://localhost:3001/api/posts?includeHidden=false&domain=maven-hub';
    console.log('🌐 URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📬 Status: ${response.status} ${response.statusText}`);
    console.log('📋 Headers:', response.headers);
    
    const text = await response.text();
    console.log('📄 Raw response:', text.substring(0, 500));
    
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log(`\n✅ Success! Found ${data.posts.length} posts:`);
        
        data.posts.forEach((post: any, index: number) => {
          console.log(`\n${index + 1}. ${post.masterPost.title}`);
          console.log(`   Domain: ${post.masterPost.domain}`);
          console.log(`   Category: ${post.masterPost.category}`);
          console.log(`   Hidden: ${post.isHidden}`);
          console.log(`   Completed: ${post.isCompleted}`);
        });
      } catch (e) {
        console.log('❌ Failed to parse JSON:', e);
      }
    } else {
      console.log('❌ Error response');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAPIDetailed();