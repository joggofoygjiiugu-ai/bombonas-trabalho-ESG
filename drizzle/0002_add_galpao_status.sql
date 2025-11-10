ALTER TABLE `bombonas` MODIFY COLUMN `status` enum('galpao','galpao_contaminada','galpao_descontaminada','a_caminho','no_local','recolhida','entregue_galpao') NOT NULL DEFAULT 'galpao';
--> statement-breakpoint
ALTER TABLE `rastreamentos` MODIFY COLUMN `statusAnterior` enum('galpao','galpao_contaminada','galpao_descontaminada','a_caminho','no_local','recolhida','entregue_galpao');
--> statement-breakpoint
ALTER TABLE `rastreamentos` MODIFY COLUMN `statusNovo` enum('galpao','galpao_contaminada','galpao_descontaminada','a_caminho','no_local','recolhida','entregue_galpao') NOT NULL;
