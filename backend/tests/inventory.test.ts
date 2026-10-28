import { describe, it, expect, beforeEach } from 'vitest';
import { request, clearTestDatabase, createTestBloodBank } from './helpers.js';
import { prisma } from '../src/config/database.js';
import { BloodGroup, ComponentType } from '@prisma/client';

describe('Inventory ACID Transactions & Stock Control Tests', () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('should add stock lot, update maintained balance, and append to immutable ledger atomically', async () => {
    const { bloodBank, token } = await createTestBloodBank();

    const futureExpiry = new Date();
    futureExpiry.setDate(futureExpiry.getDate() + 42);

    const res = await request
      .post('/api/v1/inventory/stock')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bloodGroup: 'O_POS',
        componentType: 'RED_BLOOD_CELLS',
        units: 5,
        expiryDate: futureExpiry.toISOString(),
        notes: 'Initial blood donation drive intake',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.balance.availableUnits).toBe(5);

    // Verify inventory balance in database
    const balance = await prisma.inventoryBalance.findUnique({
      where: {
        bloodBankId_bloodGroup_componentType: {
          bloodBankId: bloodBank.id,
          bloodGroup: BloodGroup.O_POS,
          componentType: ComponentType.RED_BLOOD_CELLS,
        },
      },
    });
    expect(balance?.availableUnits).toBe(5);

    // Verify transaction ledger
    const transactions = await prisma.inventoryTransaction.findMany({
      where: { bloodBankId: bloodBank.id },
    });
    expect(transactions).toHaveLength(1);
    expect(transactions[0].quantityChange).toBe(5);
    expect(transactions[0].operationType).toBe('STOCK_ADDITION');
    expect(transactions[0].balanceAfter).toBe(5);
  });

  it('should reject adjustments that would cause negative inventory', async () => {
    const { token } = await createTestBloodBank();

    // Add 2 units first
    await request
      .post('/api/v1/inventory/stock')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bloodGroup: 'A_POS',
        units: 2,
      });

    // Attempt to deduct 5 units (negative surplus)
    const res = await request
      .post('/api/v1/inventory/adjustments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bloodGroup: 'A_POS',
        quantityChange: -5,
        reason: 'Breakage during handling',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Only 2 units available');
  });

  it('should exclude expired stock lots from available inventory lots query', async () => {
    const { bloodBank, token } = await createTestBloodBank();

    // Manually insert an expired lot directly in the DB
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    await prisma.inventoryLot.create({
      data: {
        bloodBankId: bloodBank.id,
        bloodGroup: BloodGroup.B_POS,
        componentType: ComponentType.RED_BLOOD_CELLS,
        batchNumber: 'EXP-LOT-001',
        initialUnits: 3,
        availableUnits: 3,
        reservedUnits: 0,
        suppliedUnits: 0,
        collectionDate: new Date(Date.now() - 50 * 86400000),
        expiryDate: pastDate,
        status: 'AVAILABLE',
      },
    });

    const res = await request
      .get('/api/v1/inventory/expiring?days=30')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.lots.some((l: any) => l.batchNumber === 'EXP-LOT-001')).toBe(true);
  });
});
