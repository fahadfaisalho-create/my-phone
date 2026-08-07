-- AlterTable: one review per consumer per store
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_consumer_id_store_id_key" UNIQUE ("consumer_id", "store_id");

-- AlterTable: one chat thread per consumer per store
ALTER TABLE "chats" ADD CONSTRAINT "chats_consumer_id_store_id_key" UNIQUE ("consumer_id", "store_id");
