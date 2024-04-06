import { QdrantWrapper } from '@joshuajohnsonjj38/qdrant';
import { NotionWrapper } from '@joshuajohnsonjj38/notion';

const main = async () => {
	const notionService = new NotionWrapper('secret_gGu6uREqxFZLLeiMGktrSpmoWllSNOB9KYUkGLBQv2c');
    const resp = await notionService.listPageBlocks('207a17fa-d1f5-4769-b9c2-e325b1082b8e');
    console.log(resp.data.results[0].paragraph)
    console.log(resp.data.results[1].numbered_list_item)
}

main();