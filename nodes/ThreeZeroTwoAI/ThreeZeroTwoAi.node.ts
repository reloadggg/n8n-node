import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

export class ThreeZeroTwoAI implements INodeType {
	description: INodeTypeDescription = {
		displayName: '302.AI',
		name: 'threeZeroTwoAi',
		icon: 'file:../../icons/aiThreeZeroTwo.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with 302.ai AI services',
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
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
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
				description: 'Optional: Image URL address, supports http/https links or base64 encoding',
				placeholder: 'https://example.com/image.jpg or data:image/jpeg;base64,...',
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 0.9,
				description: 'What sampling temperature to use',
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
						description: 'Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency.',
					},
					{
						displayName: 'Max Tokens',
						name: 'max_tokens',
						type: 'number',
						default: 1000,
						description: 'The maximum number of tokens to generate',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presence_penalty',
						type: 'number',
						default: 0,
						description: 'Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far.',
					},
					{
						displayName: 'Top P',
						name: 'top_p',
						type: 'number',
						default: 1,
						description: 'An alternative to sampling with temperature, called nucleus sampling',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('threeZeroTwoAIApi');

				const options = {
					url: 'https://api.302.ai/v1/models?llm=1',
					headers: {
						Authorization: `Bearer ${credentials.apiKey}`,
						'Content-Type': 'application/json',
					},
					method: 'GET' as const,
					json: true,
				};

				try {
					const response = await this.helpers.request(options);
					
					if (!response?.data || !Array.isArray(response.data)) {
						throw new NodeOperationError(this.getNode(), 'Invalid response format from 302.ai API');
					}

					const models = response.data
						.map((model: any) => ({
							name: model.id,
							value: model.id,
							description: model.owned_by ? `Owned by: ${model.owned_by}` : '',
						}))
						.sort((a: any, b: any) => a.name.localeCompare(b.name));

					if (models.length === 0) {
						throw new NodeOperationError(this.getNode(), 'No models found in 302.ai API response');
					}

					return models;
				} catch (error) {
					throw new NodeOperationError(this.getNode(), `Failed to load models: ${error.message}`);
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

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const model = this.getNodeParameter('model', i) as string;
				const systemPrompt = this.getNodeParameter('system_prompt', i, '') as string;
				const message = this.getNodeParameter('message', i) as string;
				const temperature = this.getNodeParameter('temperature', i) as number;
				const additionalFields = this.getNodeParameter('additionalFields', i) as any;

				if (operation === 'chat') {
					const messages: any[] = [];
					
					if (systemPrompt) {
						messages.push({
							role: 'system',
							content: systemPrompt,
						});
					}

					const imageUrl = this.getNodeParameter("imageUrl", i, "") as string;
					let userMessage: any = { role: "user" };
					
					if (imageUrl) {
						// Multimodal format: contains both text and image
						userMessage.content = [
							{
								type: "text",
								text: message
							},
							{
								type: "image_url",
								image_url: {
									url: imageUrl
								}
							}
						];
					} else {
						// Text-only format
						userMessage.content = message;
					}
					
					messages.push(userMessage);

					const requestBody = {
						model,
						messages,
						temperature,
						...additionalFields,
					};

					const options = {
						url: 'https://api.302.ai/v1/chat/completions',
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
							'Content-Type': 'application/json',
						},
						method: 'POST' as const,
						body: requestBody,
						json: true,
					};

					const response = await this.helpers.request(options);
					
					if (!response?.choices?.[0]?.message?.content) {
						throw new NodeOperationError(this.getNode(), 'Invalid response format from 302.ai API');
					}

					const messageContent = response.choices[0].message.content.trim();
					
					returnData.push({
						json: {
							response: messageContent,
						},
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}