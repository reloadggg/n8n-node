import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	INodePropertyOptions,
	IRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

interface ThreeZeroTwoModel {
	id: string;
	owned_by?: string;
}

interface ChatCompletionResponse {
	choices?: Array<{
		message?: {
			content?: string;
		};
	}>;
}

type MultimodalMessageContent =
	| string
	| Array<
		{
			type: 'text';
			text: string;
		} |
		{
			type: 'image_url';
			image_url: {
				url: string;
			};
		}
	>;

export class ThreeZeroTwoAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: '302.AI',
		name: 'threeZeroTwoAi',
		icon: { light: 'file:aiThreeZeroTwo.svg', dark: 'file:aiThreeZeroTwo.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with 302.AI AI services',
		defaults: {
			name: '302.AI',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'threeZeroTwoAIApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Chat',
						value: 'chat',
						description: 'Send a chat message',
						action: 'Send a chat message',
					},
				],
				default: 'chat',
			},
			{
				displayName: 'Model Name or ID',
				name: 'model',
				type: 'options',
				noDataExpression: true,
				typeOptions: {
					loadOptionsMethod: 'getModels',
				},
				required: true,
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'System Prompt',
				name: 'system_prompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'System message to set the behavior of the assistant',
				placeholder: 'You are a helpful assistant...',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'The message to send to the chat model',
				required: true,
			},
			{
				displayName: 'Image URL',
				name: 'imageUrl',
				type: 'string',
				default: '',
				description:
					'Optional image URL. Supports http/https links or base64-encoded data URLs.',
				placeholder: 'https://example.com/image.jpg or data:image/jpeg;base64,...',
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 0.9,
				description: 'Sampling temperature to use for the chat completion',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Frequency Penalty',
						name: 'frequency_penalty',
						type: 'number',
						default: 0,
						description:
							'Number between -2.0 and 2.0. Positive values penalize frequent tokens.',
					},
					{
						displayName: 'Max Tokens',
						name: 'max_tokens',
						type: 'number',
						default: 1000,
						description: 'Maximum number of tokens to generate in the response',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presence_penalty',
						type: 'number',
						default: 0,
						description:
							'Number between -2.0 and 2.0. Positive values penalize novel tokens.',
					},
					{
						displayName: 'Top P',
						name: 'top_p',
						type: 'number',
						default: 1,
						description: 'Alternative to temperature sampling using nucleus sampling',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('threeZeroTwoAIApi');
				if (!credentials?.apiKey) {
					throw new NodeOperationError(this.getNode(), 'API key is required to load models');
				}

				const requestOptions: IRequestOptions = {
					url: 'https://api.302.ai/v1/models?llm=1',
					headers: {
						Authorization: `Bearer ${credentials.apiKey}`,
						'Content-Type': 'application/json',
					},
					method: 'GET',
					json: true,
				};

				try {
					const response = (await this.helpers.request(requestOptions)) as {
						data?: ThreeZeroTwoModel[];
					};

					if (!Array.isArray(response?.data)) {
						throw new NodeOperationError(this.getNode(), 'Invalid response format from 302.AI API');
					}

					const models = response.data
						.map<INodePropertyOptions>((model) => ({
							name: model.id,
							value: model.id,
							description: model.owned_by ? `Owned by: ${model.owned_by}` : undefined,
						}))
						.sort((a, b) => a.name.localeCompare(b.name));

					if (models.length === 0) {
						throw new NodeOperationError(this.getNode(), 'No models found in 302.AI API response');
					}

					return models;
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Unknown error';
					throw new NodeOperationError(this.getNode(), `Failed to load models: ${message}`);
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('threeZeroTwoAIApi');

		if (!credentials?.apiKey) {
			throw new NodeOperationError(this.getNode(), 'No valid API key provided');
		}

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				if (operation !== 'chat') {
					throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`);
				}

				const model = this.getNodeParameter('model', itemIndex) as string;
				const systemPrompt = this.getNodeParameter('system_prompt', itemIndex, '') as string;
				const message = this.getNodeParameter('message', itemIndex) as string;
				const temperature = this.getNodeParameter('temperature', itemIndex) as number;
				const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
				const imageUrl = this.getNodeParameter('imageUrl', itemIndex, '') as string;

				const messages: Array<{ role: string; content: MultimodalMessageContent }> = [];

				if (systemPrompt) {
					messages.push({
						role: 'system',
						content: systemPrompt,
					});
				}

				const userMessage: { role: 'user'; content: MultimodalMessageContent } = {
					role: 'user',
					content: message,
				};

				if (imageUrl) {
					userMessage.content = [
						{ type: 'text', text: message },
						{ type: 'image_url', image_url: { url: imageUrl } },
					];
				}

				messages.push(userMessage);

				const requestBody: IDataObject = {
					model,
					messages,
					temperature,
					...additionalFields,
				};

				const requestOptions: IRequestOptions = {
					url: 'https://api.302.ai/v1/chat/completions',
					method: 'POST',
					headers: {
						Authorization: `Bearer ${credentials.apiKey}`,
						'Content-Type': 'application/json',
					},
					body: requestBody,
					json: true,
				};

				const response = (await this.helpers.request(requestOptions)) as ChatCompletionResponse;

				const messageContent = response?.choices?.[0]?.message?.content?.trim();

				if (!messageContent) {
					throw new NodeOperationError(this.getNode(), 'Invalid response format from 302.AI API');
				}

				returnData.push({
					json: {
						response: messageContent,
					},
					pairedItem: { item: itemIndex },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					const message = error instanceof Error ? error.message : 'Unknown error';

					returnData.push({
						json: {
							error: message,
						},
						pairedItem: { item: itemIndex },
					});

					continue;
				}

				throw error;
			}
		}

		return [returnData];
	}
}

