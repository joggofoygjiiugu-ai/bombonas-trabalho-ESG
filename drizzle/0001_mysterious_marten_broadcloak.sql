CREATE TABLE `anotacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bombonaId` int NOT NULL,
	`conteudo` text NOT NULL,
	`usuarioId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anotacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bombonas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numero` varchar(10) NOT NULL,
	`status` enum('galpao','a_caminho','no_local','recolhida','entregue_galpao') NOT NULL DEFAULT 'galpao',
	`localizacao` text,
	`criadoPorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bombonas_id` PRIMARY KEY(`id`),
	CONSTRAINT `bombonas_numero_unique` UNIQUE(`numero`)
);
--> statement-breakpoint
CREATE TABLE `rastreamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bombonaId` int NOT NULL,
	`statusAnterior` enum('galpao','a_caminho','no_local','recolhida','entregue_galpao'),
	`statusNovo` enum('galpao','a_caminho','no_local','recolhida','entregue_galpao') NOT NULL,
	`localizacao` text,
	`usuarioId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rastreamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `anotacoes` ADD CONSTRAINT `anotacoes_bombonaId_bombonas_id_fk` FOREIGN KEY (`bombonaId`) REFERENCES `bombonas`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `anotacoes` ADD CONSTRAINT `anotacoes_usuarioId_users_id_fk` FOREIGN KEY (`usuarioId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bombonas` ADD CONSTRAINT `bombonas_criadoPorId_users_id_fk` FOREIGN KEY (`criadoPorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rastreamentos` ADD CONSTRAINT `rastreamentos_bombonaId_bombonas_id_fk` FOREIGN KEY (`bombonaId`) REFERENCES `bombonas`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rastreamentos` ADD CONSTRAINT `rastreamentos_usuarioId_users_id_fk` FOREIGN KEY (`usuarioId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;