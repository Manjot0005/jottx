#!/usr/bin/env node

/**
 * Database Setup Script for Kayak Platform
 * Sets up MySQL, MongoDB, and Redis with proper schemas
 */

const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
const redis = require('redis');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const MYSQL_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: process.env.MYSQL_PASSWORD || '',
  multipleStatements: true
};

const MONGODB_URI = 'mongodb://localhost:27017';
const MONGODB_NAME = 'kayak_mongo';

const REDIS_CONFIG = {
  host: 'localhost',
  port: 6379
};

// =============================================
// MySQL Setup
// =============================================
async function setupMySQL() {
  console.log('\n🔵 Setting up MySQL...');
  
  try {
    // Connect to MySQL
    const connection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ Connected to MySQL');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'mysql', 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    await connection.query(schema);
    console.log('✅ MySQL schema created successfully');
    
    // Verify tables
    const [tables] = await connection.query('SHOW TABLES FROM kayak_db');
    console.log(`✅ Created ${tables.length} tables:`);
    tables.forEach(row => {
      const tableName = Object.values(row)[0];
      console.log(`   - ${tableName}`);
    });
    
    await connection.end();
    return true;
    
  } catch (error) {
    console.error('❌ MySQL setup failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 MySQL access denied. Try:');
      console.log('   1. Run: mysql -u root');
      console.log('   2. Or set password: export MYSQL_PASSWORD=yourpassword');
      console.log('   3. Or run: ALTER USER \'root\'@\'localhost\' IDENTIFIED WITH mysql_native_password BY \'\';');
    }
    
    return false;
  }
}

// =============================================
// MongoDB Setup
// =============================================
async function setupMongoDB() {
  console.log('\n🟢 Setting up MongoDB...');
  
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_NAME);
    
    // Create collections with schemas
    const collections = [
      {
        name: 'reviews',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['user_id', 'listing_type', 'listing_id', 'rating', 'comment'],
            properties: {
              user_id: { bsonType: 'string' },
              listing_type: { enum: ['flight', 'hotel', 'car'] },
              listing_id: { bsonType: 'string' },
              rating: { bsonType: 'number', minimum: 1, maximum: 5 },
              comment: { bsonType: 'string' },
              created_at: { bsonType: 'date' }
            }
          }
        }
      },
      {
        name: 'images',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['listing_type', 'listing_id', 'image_url'],
            properties: {
              listing_type: { enum: ['flight', 'hotel', 'car', 'user'] },
              listing_id: { bsonType: 'string' },
              image_url: { bsonType: 'string' },
              image_type: { bsonType: 'string' },
              uploaded_at: { bsonType: 'date' }
            }
          }
        }
      },
      {
        name: 'analytics_logs',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['event_type', 'timestamp'],
            properties: {
              event_type: { enum: ['search', 'view', 'click', 'booking', 'payment'] },
              user_id: { bsonType: 'string' },
              listing_type: { enum: ['flight', 'hotel', 'car'] },
              listing_id: { bsonType: 'string' },
              metadata: { bsonType: 'object' },
              timestamp: { bsonType: 'date' }
            }
          }
        }
      },
      {
        name: 'click_tracking',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['page_url', 'element_type', 'timestamp'],
            properties: {
              user_id: { bsonType: 'string' },
              session_id: { bsonType: 'string' },
              page_url: { bsonType: 'string' },
              element_type: { bsonType: 'string' },
              element_id: { bsonType: 'string' },
              coordinates: {
                bsonType: 'object',
                properties: {
                  x: { bsonType: 'number' },
                  y: { bsonType: 'number' }
                }
              },
              timestamp: { bsonType: 'date' }
            }
          }
        }
      }
    ];
    
    // Create collections
    for (const collectionDef of collections) {
      try {
        await db.createCollection(collectionDef.name, {
          validator: collectionDef.validator
        });
        console.log(`✅ Created collection: ${collectionDef.name}`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`   ℹ️  Collection ${collectionDef.name} already exists`);
        } else {
          throw error;
        }
      }
    }
    
    // Create indexes
    await db.collection('reviews').createIndex({ listing_id: 1, rating: -1 });
    await db.collection('reviews').createIndex({ user_id: 1, created_at: -1 });
    
    await db.collection('analytics_logs').createIndex({ timestamp: -1 });
    await db.collection('analytics_logs').createIndex({ event_type: 1, timestamp: -1 });
    
    await db.collection('click_tracking').createIndex({ timestamp: -1 });
    await db.collection('click_tracking').createIndex({ page_url: 1, element_type: 1 });
    
    console.log('✅ Created indexes for all collections');
    
    await client.close();
    return true;
    
  } catch (error) {
    console.error('❌ MongoDB setup failed:', error.message);
    return false;
  }
}

// =============================================
// Redis Setup
// =============================================
async function setupRedis() {
  console.log('\n🔴 Setting up Redis...');
  
  try {
    const client = redis.createClient(REDIS_CONFIG);
    
    await client.connect();
    console.log('✅ Connected to Redis');
    
    // Test Redis with a simple ping
    const ping = await client.ping();
    console.log(`✅ Redis response: ${ping}`);
    
    // Set cache configuration
    await client.set('cache:config:ttl', '3600'); // 1 hour default TTL
    console.log('✅ Set default cache configuration');
    
    // Test cache functionality
    await client.set('test:connection', 'success', { EX: 60 });
    const testValue = await client.get('test:connection');
    console.log(`✅ Cache test: ${testValue}`);
    
    await client.quit();
    return true;
    
  } catch (error) {
    console.error('❌ Redis setup failed:', error.message);
    return false;
  }
}

// =============================================
// Main Setup Function
// =============================================
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  KAYAK DATABASE SETUP                  ║');
  console.log('╚════════════════════════════════════════╝');
  
  const results = {
    mysql: false,
    mongodb: false,
    redis: false
  };
  
  // Setup each database
  results.mysql = await setupMySQL();
  results.mongodb = await setupMongoDB();
  results.redis = await setupRedis();
  
  // Summary
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  SETUP SUMMARY                         ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  console.log(`MySQL:    ${results.mysql ? '✅ Success' : '❌ Failed'}`);
  console.log(`MongoDB:  ${results.mongodb ? '✅ Success' : '❌ Failed'}`);
  console.log(`Redis:    ${results.redis ? '✅ Success' : '❌ Failed'}`);
  
  const allSuccess = results.mysql && results.mongodb && results.redis;
  
  if (allSuccess) {
    console.log('\n🎉 All databases set up successfully!');
    console.log('\nNext steps:');
    console.log('1. Migrate data from JSON files to MySQL');
    console.log('2. Set up Kafka topics');
    console.log('3. Implement caching layer');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some databases failed to set up');
    console.log('Please check the error messages above');
    process.exit(1);
  }
}

// Run setup
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { setupMySQL, setupMongoDB, setupRedis };

