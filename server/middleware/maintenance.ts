import { Response, NextFunction } from "express";
import { storage } from "../storage";
import { AuthRequest } from "./auth";

export async function checkMaintenanceMode(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  requiredFeature?: "deposits" | "withdrawals" | "trading" | "login"
): Promise<void> {
  try {
    const settings = await storage.getMaintenanceSettings();
    
    if (!settings || settings.mode === "none") {
      return next();
    }

    const userRole = req.user?.role;
    const isAdmin = userRole === "admin";
    const isStaff = ["admin", "support", "finance_manager", "dispute_admin"].includes(userRole || "");

    if (isAdmin) {
      return next();
    }

    if (settings.mode === "full") {
      res.status(503).json({ 
        message: "Platform is under full maintenance. Please try again later.",
        maintenanceMode: settings.mode
      });
      return;
    }

    if (settings.mode === "readonly" && !isStaff) {
      res.status(503).json({ 
        message: "Platform is in read-only mode. All actions are temporarily disabled.",
        maintenanceMode: settings.mode
      });
      return;
    }

    if (requiredFeature) {
      if (requiredFeature === "deposits" && !settings.depositsEnabled) {
        res.status(503).json({ 
          message: "Deposits are temporarily disabled for maintenance.",
          maintenanceMode: settings.mode
        });
        return;
      }

      if (requiredFeature === "withdrawals" && !settings.withdrawalsEnabled) {
        res.status(503).json({ 
          message: "Withdrawals are temporarily disabled for maintenance.",
          maintenanceMode: settings.mode
        });
        return;
      }

      if (requiredFeature === "trading" && !settings.tradingEnabled) {
        res.status(503).json({ 
          message: "Trading/Order creation is temporarily disabled for maintenance.",
          maintenanceMode: settings.mode
        });
        return;
      }

      if (requiredFeature === "login" && !settings.loginEnabled) {
        res.status(503).json({ 
          message: "Login is temporarily disabled for maintenance.",
          maintenanceMode: settings.mode
        });
        return;
      }
    }

    next();
  } catch (error) {
    next();
  }
}

export function requireDepositsEnabled(req: AuthRequest, res: Response, next: NextFunction) {
  return checkMaintenanceMode(req, res, next, "deposits");
}

export function requireWithdrawalsEnabled(req: AuthRequest, res: Response, next: NextFunction) {
  return checkMaintenanceMode(req, res, next, "withdrawals");
}

export function requireTradingEnabled(req: AuthRequest, res: Response, next: NextFunction) {
  return checkMaintenanceMode(req, res, next, "trading");
}

export function requireLoginEnabled(req: AuthRequest, res: Response, next: NextFunction) {
  return checkMaintenanceMode(req, res, next, "login");
}
