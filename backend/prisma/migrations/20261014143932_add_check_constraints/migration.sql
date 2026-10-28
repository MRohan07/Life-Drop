-- LifeDrop Check Constraints & Integrity Rules

-- 1. InventoryLot non-negative units constraint
ALTER TABLE "InventoryLot" 
ADD CONSTRAINT "chk_inventory_lot_units_non_negative" 
CHECK ("availableUnits" >= 0 AND "reservedUnits" >= 0 AND "suppliedUnits" >= 0 AND "discardedUnits" >= 0);

-- 2. InventoryBalance non-negative units constraint
ALTER TABLE "InventoryBalance" 
ADD CONSTRAINT "chk_inventory_balance_units_non_negative" 
CHECK ("availableUnits" >= 0 AND "reservedUnits" >= 0 AND "suppliedUnits" >= 0);

-- 3. BloodRequest positive required and non-negative allocation
ALTER TABLE "BloodRequest" 
ADD CONSTRAINT "chk_blood_request_units_valid" 
CHECK ("requiredUnits" > 0 AND "allocatedUnits" >= 0 AND "confirmedUnits" >= 0 AND "remainingUnits" >= 0);

-- 4. BloodRequestResponse positive units
ALTER TABLE "BloodRequestResponse" 
ADD CONSTRAINT "chk_blood_request_response_units_positive" 
CHECK ("units" > 0);

-- 5. InventoryReservation positive units
ALTER TABLE "InventoryReservation" 
ADD CONSTRAINT "chk_inventory_reservation_units_positive" 
CHECK ("offeredUnits" >= 0 AND "allocatedUnits" >= 0);