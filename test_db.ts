import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('DATABASE_URL:', process.env.DATABASE_URL)
    try {
        const store = await prisma.store.findFirst()
        console.log('Store:', store)
    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
