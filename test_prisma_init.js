require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

try {
    console.log('Instantiating PrismaClient...');
    const prisma = new PrismaClient();
    console.log('PrismaClient instantiated successfully.');
} catch (e) {
    console.error('Error instantiating PrismaClient:');
    console.error(e);
}
