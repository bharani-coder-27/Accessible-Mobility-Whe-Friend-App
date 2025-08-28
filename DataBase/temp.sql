USE wheelchair_bus;

-- Drop existing trigger
DROP TRIGGER IF EXISTS after_user_insert;

-- Recreate trigger
DELIMITER //
CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.role = 'conductor' AND NEW.from IS NOT NULL AND NEW.to IS NOT NULL AND NEW.tripCode IS NOT NULL THEN
    INSERT IGNORE INTO buses (name, tripCode, deviceId, wheelchair_accessible)
    VALUES (CONCAT(NEW.from, '-', NEW.to), NEW.tripCode, NEW.classOfService, 0);
  END IF;
END //
DELIMITER ;
