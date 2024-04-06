import { QdrantWrapper } from '@joshuajohnsonjj38/qdrant';
import { NotionWrapper } from '@joshuajohnsonjj38/notion';

const main = async () => {
	const notionService = new NotionWrapper('secret_gGu6uREqxFZLLeiMGktrSpmoWllSNOB9KYUkGLBQv2c');
    const resp = await notionService.listPageBlocks('');
    console.log(resp.data);
}

main();