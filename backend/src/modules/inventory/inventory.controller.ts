import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service.js';
import { AppError } from '../../common/errors/AppError.js';
import { InventoryTransactionType } from '@prisma/client';

export class InventoryController {
  async getMyInventory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.bloodBankId) {
        throw AppError.forbidden('Only blood bank facility accounts can access inventory');
      }
      const inventory = await inventoryService.getMyInventory(req.user.bloodBankId);
      res.status(200).json({ status: 'success', data: inventory });
    } catch (err) {
      next(err);
    }
  }

  async addStock(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.bloodBankId) {
        throw AppError.forbidden('Only blood bank facility accounts can add stock');
      }
      const result = await inventoryService.addStock(
        req.user.bloodBankId,
        req.user.id,
        req.user.role,
        req.body
      );
      res.status(201).json({
        status: 'success',
        message: 'Stock units successfully credited to inventory',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.bloodBankId) {
        throw AppError.forbidden('Only blood bank facility accounts can adjust stock');
      }
      const result = await inventoryService.adjustStock(
        req.user.bloodBankId,
        req.user.id,
        req.user.role,
        {
          ...req.body,
          operationType: req.body.operationType || InventoryTransactionType.ADJUSTMENT_CORRECTION,
        }
      );
      res.status(200).json({
        status: 'success',
        message: 'Stock inventory balance adjusted',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.bloodBankId) {
        throw AppError.forbidden('Only blood bank facility accounts can view audit transactions');
      }
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
      const transactions = await inventoryService.getTransactions(req.user.bloodBankId, limit);
      res.status(200).json({ status: 'success', results: transactions.length, data: { transactions } });
    } catch (err) {
      next(err);
    }
  }

  async getExpiringLots(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.bloodBankId) {
        throw AppError.forbidden('Only blood bank accounts can view expiring lots');
      }
      const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
      const lots = await inventoryService.getExpiringLots(req.user.bloodBankId, days);
      res.status(200).json({ status: 'success', results: lots.length, data: { lots } });
    } catch (err) {
      next(err);
    }
  }
}

export const inventoryController = new InventoryController();
