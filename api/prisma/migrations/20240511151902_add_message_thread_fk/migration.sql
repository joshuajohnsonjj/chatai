-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ChatMessageThread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
