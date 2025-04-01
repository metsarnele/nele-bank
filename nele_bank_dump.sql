PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE `users` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` VARCHAR(100) NOT NULL, `username` VARCHAR(50) NOT NULL UNIQUE, `password` VARCHAR(255) NOT NULL, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL);
INSERT INTO users VALUES(1,'hello','helllo','$2a$10$CdbsUEBmbmbZZkhIZW3gIuDakKs5C08qQ0JrbFfn2pvX9Sc06nwqq','2025-03-28 18:47:21.165 +00:00','2025-03-28 18:47:21.165 +00:00');
INSERT INTO users VALUES(2,'hello','hellobank','$2a$10$InEyRxR8lLsGPERSXCmAN.a0mGZDcSHgZIkzVrs7bP2wFGQJBjGFO','2025-03-31 19:27:12.920 +00:00','2025-03-31 19:27:12.920 +00:00');
CREATE TABLE `accounts` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `accountNumber` VARCHAR(20) NOT NULL UNIQUE, `userId` INTEGER NOT NULL REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE, `currency` VARCHAR(3) NOT NULL, `balance` DECIMAL(15,2) NOT NULL DEFAULT 0, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL);
INSERT INTO accounts VALUES(1,'NELE876413223035',1,'EUR',100,'2025-03-28 18:47:21.325 +00:00','2025-03-28 18:47:21.326 +00:00');
INSERT INTO accounts VALUES(2,'NELE492330546889',2,'EUR',100,'2025-03-31 19:27:13.062 +00:00','2025-03-31 19:27:13.063 +00:00');
CREATE TABLE `transactions` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `transactionId` VARCHAR(36) NOT NULL UNIQUE, `type` TEXT NOT NULL, `status` TEXT NOT NULL DEFAULT 'pending', `amount` DECIMAL(15,2) NOT NULL, `currency` VARCHAR(3) NOT NULL, `fromAccountId` INTEGER NOT NULL REFERENCES `accounts` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE, `toAccountId` INTEGER REFERENCES `accounts` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE, `fromUserId` INTEGER NOT NULL REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE, `toUserId` INTEGER REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE, `externalFromAccount` VARCHAR(255), `externalToAccount` VARCHAR(255), `externalBankId` VARCHAR(255), `description` VARCHAR(255), `errorMessage` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, `completedAt` DATETIME);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('users',2);
INSERT INTO sqlite_sequence VALUES('accounts',2);
CREATE INDEX `accounts_user_id` ON `accounts` (`userId`);
CREATE INDEX `accounts_account_number` ON `accounts` (`accountNumber`);
CREATE INDEX `transactions_transaction_id` ON `transactions` (`transactionId`);
CREATE INDEX `transactions_from_account_id` ON `transactions` (`fromAccountId`);
CREATE INDEX `transactions_to_account_id` ON `transactions` (`toAccountId`);
CREATE INDEX `transactions_from_user_id` ON `transactions` (`fromUserId`);
CREATE INDEX `transactions_status` ON `transactions` (`status`);
CREATE INDEX `transactions_created_at` ON `transactions` (`createdAt`);
COMMIT;
