import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { VerificationStatus, BloodGroup } from '@prisma/client';

const ALL_GROUPS: BloodGroup[] = [
  BloodGroup.O_POS,
  BloodGroup.O_NEG,
  BloodGroup.A_POS,
  BloodGroup.A_NEG,
  BloodGroup.B_POS,
  BloodGroup.B_NEG,
  BloodGroup.AB_POS,
  BloodGroup.AB_NEG,
];

function buildInventoryMap(balances: any[]): Record<string, any> {
  const map: Record<string, any> = {};
  ALL_GROUPS.forEach((g) => {
    map[g] = {
      bloodGroup: g,
      available: 0,
      reserved: 0,
      supplied: 0,
    };
  });

  if (Array.isArray(balances)) {
    balances.forEach((bal) => {
      map[bal.bloodGroup] = {
        bloodGroup: bal.bloodGroup,
        available: bal.availableUnits,
        reserved: bal.reservedUnits,
        supplied: bal.suppliedUnits,
      };
    });
  }
  return map;
}

export class BloodBanksService {
  async listBloodBanks(filters: { city?: string; verifiedOnly?: boolean }) {
    const banks = await prisma.bloodBank.findMany({
      where: {
        ...(filters.city ? { city: { contains: filters.city, mode: 'insensitive' } } : {}),
        ...(filters.verifiedOnly ? { isVerified: true, status: VerificationStatus.VERIFIED } : {}),
      },
      include: {
        inventoryBalances: true,
      },
      orderBy: { name: 'asc' },
    });

    return banks.map((b) => ({
      ...b,
      inventory: buildInventoryMap(b.inventoryBalances),
    }));
  }

  async getBloodBankById(id: string) {
    const bank = await prisma.bloodBank.findUnique({
      where: { id },
      include: {
        inventoryBalances: true,
      },
    });

    if (!bank) throw AppError.notFound('Blood bank not found');

    return {
      ...bank,
      inventory: buildInventoryMap(bank.inventoryBalances),
    };
  }

  async getMyBloodBank(userId: string) {
    const bank = await prisma.bloodBank.findUnique({
      where: { userId },
      include: {
        inventoryBalances: true,
        campaigns: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!bank) throw AppError.notFound('Blood bank facility not associated with this account');

    return {
      ...bank,
      inventory: buildInventoryMap(bank.inventoryBalances),
    };
  }

  async updateMyBloodBank(userId: string, data: any) {
    const bank = await prisma.bloodBank.findUnique({ where: { userId } });
    if (!bank) throw AppError.notFound('Blood bank not found');

    return await prisma.bloodBank.update({
      where: { id: bank.id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        image: data.image,
        address: data.address,
        area: data.area,
        city: data.city,
        state: data.state,
        pinCode: data.pinCode,
        is24x7Service: data.is24x7Service,
        emergencySupplyAvailable: data.emergencySupplyAvailable,
        componentsAvailable: data.componentsAvailable,
      },
    });
  }
}

export const bloodBanksService = new BloodBanksService();
