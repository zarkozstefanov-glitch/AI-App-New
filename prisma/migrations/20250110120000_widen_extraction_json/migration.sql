-- Widen JSON payload columns for extraction drafts and transactions
ALTER TABLE `ExtractionDraft` MODIFY `extractionJson` LONGTEXT NOT NULL;
ALTER TABLE `Transaction` MODIFY `aiExtractedJson` LONGTEXT NULL;
