import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import {
  BloodGroup,
  ComponentType,
  InventoryTransactionType,
  UserRole,
} from '@prisma/client';

export class InventoryService {
  /**
   * Get active inventory balances and lots for a blood bank
   */
  async getMyInventory(bloodBankId: string) {
    const balances = await prisma.inventoryBalance.findMany({
      where: { bloodBankId },
      orderBy: { bloodGroup: 'asc' },
    });

    const lots = await prisma.inventoryLot.findMany({
      where: {
        bloodBankId,
        availableUnits: { gt: 0 },
        expiryDate: { gt: new Date() },
      },
      orderBy: { expiryDate: 'asc' },
    });

    // Format inventory summary mapping with all 8 blood groups guaranteed
    const allGroups: BloodGroup[] = [
      BloodGroup.O_POS,
      BloodGroup.O_NEG,
      BloodGroup.A_POS,
      BloodGroup.A_NEG,
      BloodGroup.B_POS,
      BloodGroup.B_NEG,
      BloodGroup.AB_POS,
      BloodGroup.AB_NEG,
    ];

    const summary: Record<string, any> = {};
    allGroups.forEach((g) => {
      summary[g] = {
        bloodGroup: g,
        available: 0,
        reserved: 0,
        supplied: 0,
      };
    });

    balances.forEach((bal) => {
      summary[bal.bloodGroup] = {
        bloodGroup: bal.bloodGroup,
        available: bal.availableUnits,
        reserved: bal.reservedUnits,
        supplied: bal.suppliedUnits,
      };
    });

    return {
      summary,
      balances,
      lots,
    };
  }

  /**
   * Add new blood stock lot & record in ledger atomically
   */
  async addStock(
    bloodBankId: string,
    actorId: string,
    actorRole: UserRole,
    data: {
      bloodGroup: BloodGroup;
      componentType?: ComponentType;
      units: number;
      batchNumber?: string;
      collectionDate?: string;
      expiryDate?: string;
      notes?: string;
    }
  ) {
    if (data.units <= 0) {
      throw AppError.badRequest('Units to add must be greater than zero');
    }

    const componentType = data.componentType || ComponentType.RED_BLOOD_CELLS;
    const batchNumber =
      data.batchNumber ||
      `LOT-${Date.now().toString(36).toUpperCase()}-${data.bloodGroup}`;

    const collectionDate = data.collectionDate
      ? new Date(data.collectionDate)
      : new Date();

    // Default 42 days for red blood cells if not specified
    const defaultExpiry = new Date(collectionDate);
    defaultExpiry.setDate(defaultExpiry.getDate() + 42);
    const expiryDate = data.expiryDate ? new Date(data.expiryDate) : defaultExpiry;

    if (expiryDate <= new Date()) {
      throw AppError.badRequest('Expiration date cannot be in the past');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Create Lot
      const lot = await tx.inventoryLot.create({
        data: {
          bloodBankId,
          bloodGroup: data.bloodGroup,
          componentType,
          batchNumber,
          initialUnits: data.units,
          availableUnits: data.units,
          reservedUnits: 0,
          suppliedUnits: 0,
          collectionDate,
          expiryDate,
          status: 'AVAILABLE',
        },
      });

      // 2. Update Maintain Balance
      const balance = await tx.inventoryBalance.upsert({
        where: {
          bloodBankId_bloodGroup_componentType: {
            bloodBankId,
            bloodGroup: data.bloodGroup,
            componentType,
          },
        },
        create: {
          bloodBankId,
          bloodGroup: data.bloodGroup,
          componentType,
          availableUnits: data.units,
          reservedUnits: 0,
          suppliedUnits: 0,
        },
        update: {
          availableUnits: { increment: data.units },
          lastReconciledAt: new Date(),
        },
      });

      // 3. Append to immutable transaction ledger
      await tx.inventoryTransaction.create({
        data: {
          bloodBankId,
          lotId: lot.id,
          bloodGroup: data.bloodGroup,
          componentType,
          operationType: InventoryTransactionType.STOCK_ADDITION,
          quantityChange: data.units,
          balanceAfter: balance.availableUnits,
          actorId,
          actorRole,
          reason: data.notes || `Stock intake for lot ${batchNumber}`,
        },
      });

      return { lot, balance };
    });
  }

  /**
   * Adjust existing inventory (e.g. breakage, disposal, manual audit reconciliation)
   */
  async adjustStock(
    bloodBankId: string,
    actorId: string,
    actorRole: UserRole,
    data: {
      bloodGroup: BloodGroup;
      componentType?: ComponentType;
      quantityChange?: number; // Positive (surplus found) or negative (breakage, disposal)
      newAvailableUnits?: number; // Absolute target units
      operationType?: InventoryTransactionType;
      reason?: string;
      lotId?: string;
    }
  ) {
    const componentType = data.componentType || ComponentType.RED_BLOOD_CELLS;

    return await prisma.$transaction(async (tx) => {
      // Retrieve balance or auto-create if missing
      let balance = await tx.inventoryBalance.findUnique({
        where: {
          bloodBankId_bloodGroup_componentType: {
            bloodBankId,
            bloodGroup: data.bloodGroup,
            componentType,
          },
        },
      });

      if (!balance) {
        balance = await tx.inventoryBalance.create({
          data: {
            bloodBankId,
            bloodGroup: data.bloodGroup,
            componentType,
            availableUnits: 0,
            reservedUnits: 0,
            suppliedUnits: 0,
          },
        });
      }

      let delta = 0;
      let finalAvailable = balance.availableUnits;

      if (data.newAvailableUnits !== undefined) {
        finalAvailable = Math.max(0, data.newAvailableUnits);
        delta = finalAvailable - balance.availableUnits;
      } else if (data.quantityChange !== undefined) {
        delta = data.quantityChange;
        finalAvailable = balance.availableUnits + delta;
      }

      if (finalAvailable < 0) {
        throw AppError.badRequest(
          `Cannot deduct ${Math.abs(delta)} units. Only ${balance.availableUnits} units available.`
        );
      }

      // If a specific lot is being adjusted
      if (data.lotId) {
        const lot = await tx.inventoryLot.findUnique({ where: { id: data.lotId } });
        if (lot) {
          if (lot.availableUnits + delta < 0) {
            throw AppError.badRequest(
              `Lot only has ${lot.availableUnits} available units`
            );
          }
          await tx.inventoryLot.update({
            where: { id: data.lotId },
            data: {
              availableUnits: { increment: delta },
              ...(delta < 0 && data.operationType === InventoryTransactionType.ADJUSTMENT_DISPOSAL
                ? { discardedUnits: { increment: Math.abs(delta) } }
                : {}),
            },
          });
        }
      }

      // Update Balance to exact final count
      const updatedBalance = await tx.inventoryBalance.update({
        where: { id: balance.id },
        data: {
          availableUnits: finalAvailable,
          lastReconciledAt: new Date(),
        },
      });

      // Record in immutable ledger
      const transaction = await tx.inventoryTransaction.create({
        data: {
          bloodBankId,
          lotId: data.lotId,
          bloodGroup: data.bloodGroup,
          componentType,
          operationType: data.operationType || InventoryTransactionType.ADJUSTMENT_CORRECTION,
          quantityChange: delta,
          balanceAfter: finalAvailable,
          actorId,
          actorRole,
          reason: data.reason || `Stock adjusted to ${finalAvailable} units`,
        },
      });

      return { balance: updatedBalance, transaction };
    });
  }

  /**
   * Get immutable audit ledger of all inventory transactions
   */
  async getTransactions(bloodBankId: string, limit = 50) {
    return await prisma.inventoryTransaction.findMany({
      where: { bloodBankId },
      include: {
        lot: { select: { batchNumber: true, expiryDate: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get expiring lots within threshold days (default 30 days)
   */
  async getExpiringLots(bloodBankId: string, daysAhead = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysAhead);

    return await prisma.inventoryLot.findMany({
      where: {
        bloodBankId,
        availableUnits: { gt: 0 },
        expiryDate: { lte: thresholdDate },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }
}

export const inventoryService = new InventoryService();
